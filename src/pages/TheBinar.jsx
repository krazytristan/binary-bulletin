import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, X, Play, Film } from "lucide-react";
import {
  PUBLICATION,
  formatDate,
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "../utils/editorial";

export default function TheBinar() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = `The Binary Online | ${PUBLICATION.name}`;
    fetchVideos();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error("Failed to fetch multimedia broadcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return videos;
    return videos.filter(
      (v) =>
        v.title?.toLowerCase().includes(term) ||
        v.excerpt?.toLowerCase().includes(term)
    );
  }, [videos, search]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
              Campus Broadcast &amp; Multimedia
            </p>
            <h1 className="text-4xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">
              The Binary Online
            </h1>
          </div>

          <div className="relative w-full md:w-64 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors"
              size={15}
            />
            <input
              type="text"
              aria-label="Search video reports"
              placeholder="Search broadcasts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-200 border border-gray-300" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((v) => {
              const ytThumb = isYouTubeUrl(v.video_url)
                ? getYouTubeThumbnailUrl(v.video_url)
                : "";
              return (
                <article
                  key={v.id}
                  className="group flex flex-col border border-gray-300 bg-white hover:border-blue-900 transition-colors hover:shadow-md"
                >
                  <div
                    className="aspect-video relative overflow-hidden bg-gray-900 cursor-pointer border-b border-gray-300 group-hover:border-blue-900 transition-colors"
                    onClick={() => setViewer(v)}
                  >
                    {ytThumb ? (
                      <img
                        src={ytThumb}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={v.title}
                      />
                    ) : v.video_url ? (
                      <video
                        src={v.video_url}
                        className="w-full h-full object-cover opacity-85"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Film size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-900/35 opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-amber-400 p-4 rounded-full text-blue-950 shadow-lg group-hover:scale-110 transition-transform">
                        <Play fill="currentColor" size={22} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2.5 block">
                      {formatDate(v.created_at)}
                    </span>
                    <h2
                      className="text-xl font-serif font-black leading-snug mb-3 group-hover:text-red-900 transition-colors cursor-pointer text-gray-900"
                      onClick={() => setViewer(v)}
                    >
                      {v.title}
                    </h2>
                    {v.excerpt && (
                      <p className="text-sm font-serif text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
                        {v.excerpt}
                      </p>
                    )}
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 border-t border-gray-200 pt-3.5 mt-auto">
                      Produced by {v.author_name || "Multimedia Desk"}
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredVideos.length === 0 && (
              <div className="col-span-full text-center py-20 border border-gray-300 bg-white">
                <Film size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="font-serif italic text-gray-500 text-lg">
                  No video broadcasts have been published yet.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIDEO LIGHTBOX */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/95 backdrop-blur-md"
          onClick={() => setViewer(null)}
        >
          <div
            className="w-full max-w-5xl bg-white border-2 border-amber-400 shadow-[8px_8px_0px_0px_rgba(251,191,36,1)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close video player"
              onClick={() => setViewer(null)}
              className="absolute -top-11 right-0 p-2 text-white hover:text-amber-400 transition-colors"
            >
              <X size={26} />
            </button>

            <div className="aspect-video bg-black w-full border-b border-amber-400">
              {isYouTubeUrl(viewer.video_url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(viewer.video_url, { autoplay: true })}
                  title={viewer.title}
                  className="w-full h-full border-none"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <video src={viewer.video_url} controls autoPlay className="w-full h-full" />
              )}
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight mb-3 text-blue-900">
                {viewer.title}
              </h2>
              <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-5">
                <span className="text-red-900">
                  Produced by {viewer.author_name || "Multimedia Desk"}
                </span>
                <span>&bull;</span>
                <span className="text-amber-800">{formatDate(viewer.created_at)}</span>
              </div>
              {(viewer.content || viewer.excerpt) && (
                <p className="font-serif text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {viewer.content || viewer.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
