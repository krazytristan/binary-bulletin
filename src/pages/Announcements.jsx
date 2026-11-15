import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SmartImage from "../components/SmartImage";
import { Search, Maximize2, X, Bell } from "lucide-react";
import { PUBLICATION, formatDate, cleanEditorialText, parseArticleBlocks } from "../utils/editorial";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewerImage, setViewerImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = `Official Announcements | ${PUBLICATION.name}`;
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setViewerImage(null);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setAnnouncements(data);
    }
    setLoading(false);
  };

  // Support deep linking via ?id= from Home or Navbar search
  useEffect(() => {
    const targetId = searchParams.get("id");
    if (targetId && announcements.length > 0) {
      const match = announcements.find((a) => String(a.id) === String(targetId));
      if (match) {
        setSelectedItem(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, announcements, setSearchParams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return announcements;
    return announcements.filter(
      (a) =>
        a.title?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term)
    );
  }, [search, announcements]);

  const visibleItems = showAll ? filtered : filtered.slice(0, 6);

  const selectedBlocks = useMemo(() => {
    if (!selectedItem) return [];
    return parseArticleBlocks(selectedItem.content);
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col relative">
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
              Official Campus Notices &amp; Advisories
            </p>
            <h1 className="text-4xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">
              Announcements
            </h1>
          </div>

          <div className="relative w-full md:w-64 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors"
              size={15}
            />
            <input
              type="text"
              aria-label="Search official announcements"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowAll(false);
              }}
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 border border-gray-300" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-gray-300 bg-white flex-1">
            <p className="font-serif italic text-gray-500 text-lg">
              No campus announcements matched your search.
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] flex flex-col transition-all group overflow-hidden"
                >
                  {/* Image Top */}
                  {item.image_url ? (
                    <div
                      className="w-full h-48 sm:h-56 border-b-2 border-blue-900 relative cursor-pointer bg-gray-100 overflow-hidden shrink-0"
                      onClick={() => setViewerImage(item.image_url)}
                    >
                      <SmartImage
                        src={item.image_url}
                        alt={cleanEditorialText(item.title)}
                        mode="card"
                        fit="auto"
                        containerClassName="w-full h-full"
                        className="group-hover:scale-105 transition-all duration-700"
                        fallbackLabel="Official Campus Advisory"
                        fallbackIcon={Bell}
                      />
                      <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-amber-400 drop-shadow-md" size={24} />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-48 sm:h-56 bg-blue-50/70 flex flex-col items-center justify-center border-b-2 border-blue-900 p-8 text-center shrink-0 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Bell size={28} className="text-blue-900/40 mb-2" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-900/60">
                        Official Campus Advisory
                      </p>
                    </div>
                  )}

                  {/* Content Bottom */}
                  <div className="p-6 flex flex-col flex-1 bg-white">
                    <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-200">
                      <span className="self-start text-[10px] font-bold uppercase tracking-widest text-blue-950 bg-amber-400 px-2.5 py-1 border border-amber-500">
                        {formatDate(item.created_at)}
                      </span>
                      <h2
                        className="text-xl font-serif font-black tracking-tight leading-snug text-blue-900 group-hover:text-red-900 transition-colors line-clamp-2 cursor-pointer"
                        title="Click to read full announcement"
                        onClick={() => setSelectedItem(item)}
                      >
                        {cleanEditorialText(item.title)}
                      </h2>
                    </div>
                    <p className="text-sm font-serif text-gray-700 leading-relaxed flex-1 line-clamp-4">
                      {cleanEditorialText(item.content)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="mt-5 self-start text-xs font-bold uppercase tracking-widest text-red-900 hover:text-blue-900 transition-colors"
                    >
                      Read Full Notice &rarr;
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length > 6 && (
              <div className="flex justify-center mt-12">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3 bg-white border-2 border-blue-900 text-blue-900 text-xs font-bold uppercase tracking-widest hover:bg-red-900 hover:text-white hover:border-red-900 transition-all shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
                >
                  {showAll ? "Show Fewer Notices" : `View All ${filtered.length} Notices`}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ANNOUNCEMENT READING MODAL */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm p-0 md:p-10"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[#FCFBF9] w-full h-full md:h-auto max-w-4xl max-h-full overflow-y-auto shadow-2xl border-0 md:border-4 border-blue-900 relative flex flex-col custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close announcement modal"
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-white text-blue-900 border-2 border-blue-900 hover:bg-red-900 hover:text-white hover:border-red-900 transition-colors z-10 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
            >
              <X size={20} />
            </button>

            <div className="p-6 md:p-12 flex flex-col bg-white flex-1 min-h-screen md:min-h-0">
              <div className="flex flex-wrap items-center gap-3 mb-5 mt-10 md:mt-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-950 bg-amber-400 px-3 py-1 border border-amber-500">
                  {formatDate(selectedItem.created_at)}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-900">
                  {PUBLICATION.institution}
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl font-serif font-black tracking-tight leading-tight text-blue-900 mb-6 pb-6 border-b-2 border-gray-200">
                {cleanEditorialText(selectedItem.title)}
              </h2>

              {selectedItem.image_url && (
                <figure className="mb-8">
                  <SmartImage
                    src={selectedItem.image_url}
                    alt={cleanEditorialText(selectedItem.title)}
                    mode="article"
                    fit="contain"
                    loading="eager"
                    onClick={() => setViewerImage(selectedItem.image_url)}
                    containerClassName="border border-gray-300"
                    className="max-h-[460px] cursor-zoom-in"
                  />
                  <figcaption className="mt-2 text-xs font-serif italic text-gray-500 text-right">
                    Official Notice Visual &mdash; Click image to enlarge
                  </figcaption>
                </figure>
              )}

              <div className="max-w-none font-serif text-gray-800 text-base md:text-lg leading-relaxed space-y-4">
                {selectedBlocks.map((block, i) => {
                  if (block.type === "heading") {
                    return (
                      <h3
                        key={i}
                        className="text-lg md:text-xl font-serif font-bold text-blue-900 pt-4 border-l-4 border-amber-400 pl-3"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === "bullet") {
                    return (
                      <div key={i} className="flex items-start gap-3 pl-2">
                        <span className="mt-2.5 w-1.5 h-1.5 bg-red-900 shrink-0 rounded-full" />
                        <p className="leading-relaxed">{block.text}</p>
                      </div>
                    );
                  }
                  return <p key={i}>{block.text}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/95 backdrop-blur-md"
          onClick={() => setViewerImage(null)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white hover:text-amber-400 transition-colors z-10"
          >
            <X size={26} />
          </button>
          <div
            className="w-full max-w-6xl max-h-screen p-4 md:p-12 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <SmartImage
              src={viewerImage}
              mode="lightbox"
              fit="contain"
              loading="eager"
              containerClassName="border-2 border-amber-400 shadow-2xl bg-white"
              alt="Official notice full view"
              showDimensionsBadge
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
