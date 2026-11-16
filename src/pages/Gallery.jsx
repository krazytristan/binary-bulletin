import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SmartImage from "../components/SmartImage";
import { Search, X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { PUBLICATION, formatDate } from "../utils/editorial";

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentAlbum, setCurrentAlbum] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("");

  useEffect(() => {
    document.title = `Photo Gallery | ${PUBLICATION.name}`;
    fetchGallery();
    window.scrollTo(0, 0);
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    setAlbums(data || []);
    setLoading(false);
  };

  const filteredAlbums = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return albums;
    return albums.filter((e) => e.title?.toLowerCase().includes(term));
  }, [albums, search]);

  const openAlbum = (album) => {
    if (!album?.images || album.images.length === 0) return;
    setCurrentAlbum(album.images);
    setCurrentTitle(album.title || "Campus Photo Exhibit");
    setViewerIndex(0);
    setViewer(album.images[0]);
  };

  const nextImage = useCallback(() => {
    if (currentAlbum.length === 0) return;
    const next = (viewerIndex + 1) % currentAlbum.length;
    setViewerIndex(next);
    setViewer(currentAlbum[next]);
  }, [viewerIndex, currentAlbum]);

  const prevImage = useCallback(() => {
    if (currentAlbum.length === 0) return;
    const prev = (viewerIndex - 1 + currentAlbum.length) % currentAlbum.length;
    setViewerIndex(prev);
    setViewer(currentAlbum[prev]);
  }, [viewerIndex, currentAlbum]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!viewer) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewer, nextImage, prevImage]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 flex-1 w-full">
        <header className="mb-8 sm:mb-12 border-b-[3px] border-blue-900 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-2 sm:mb-3">
              Photojournalism &amp; Campus Visuals
            </p>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">
              Gallery
            </h1>
          </div>

          <div className="relative w-full md:w-64 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors"
              size={15}
            />
            <input
              type="text"
              aria-label="Search photo gallery albums"
              placeholder="Search albums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[42px] bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-sm sm:text-xs font-medium outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-gray-200 border border-gray-300" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAlbums.map((album) => {
              const coverImage =
                album.images && album.images.length > 0 ? album.images[0] : null;
              const imageCount = album.images?.length || 0;

              return (
                <article
                  key={album.id}
                  className="group cursor-pointer border-2 border-gray-200 bg-white hover:border-blue-900 hover:shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] transition-all flex flex-col"
                  onClick={() => openAlbum(album)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 border-b-2 border-gray-200 group-hover:border-blue-900 transition-colors">
                    {coverImage ? (
                      <SmartImage
                        src={coverImage}
                        mode="card"
                        fit="auto"
                        containerClassName="w-full h-full"
                        className="transition-transform duration-700 group-hover:scale-105"
                        alt={album.title}
                        fallbackLabel="Album Cover"
                        fallbackIcon={Images}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Images size={32} />
                      </div>
                    )}

                    <div className="absolute bottom-0 right-0 bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-950 border-t border-l border-amber-500 flex items-center gap-1.5">
                      <Images size={11} />
                      {imageCount} {imageCount === 1 ? "Photo" : "Photos"}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 group-hover:text-amber-800 transition-colors">
                      {formatDate(album.created_at)}
                    </span>
                    <h2 className="text-xl font-serif font-black tracking-tight leading-snug group-hover:text-red-900 transition-colors text-gray-900">
                      {album.title}
                    </h2>
                  </div>
                </article>
              );
            })}

            {filteredAlbums.length === 0 && (
              <div className="col-span-full text-center py-20 border border-gray-300 bg-white">
                <p className="font-serif italic text-gray-500 text-lg">
                  No photo albums matched your search.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/95 backdrop-blur-md"
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            aria-label="Close photo viewer"
            onClick={() => setViewer(null)}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-950/70 text-white hover:text-amber-400 transition-colors z-20"
          >
            <X size={24} />
          </button>

          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-amber-400 transition-colors z-20 bg-blue-900/70 border border-white/20"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-amber-400 transition-colors z-20 bg-blue-900/70 border border-white/20"
          >
            <ChevronRight size={24} />
          </button>

          <div
            className="w-full max-w-6xl max-h-screen p-3 sm:p-8 md:p-14 flex flex-col items-center justify-center gap-3 sm:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <SmartImage
              src={viewer}
              mode="lightbox"
              fit="contain"
              loading="eager"
              containerClassName="border-[3px] border-amber-400 shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] sm:shadow-[8px_8px_0px_0px_rgba(251,191,36,1)] bg-white"
              alt={`${currentTitle} — Exhibit ${viewerIndex + 1}`}
              showDimensionsBadge
            />
            <div className="bg-white px-4 sm:px-5 py-2 border-2 border-blue-900 shadow-lg text-[11px] sm:text-xs font-bold uppercase tracking-widest text-blue-900 text-center max-w-full">
              {currentTitle} &bull; Photo {viewerIndex + 1} of {currentAlbum.length}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
