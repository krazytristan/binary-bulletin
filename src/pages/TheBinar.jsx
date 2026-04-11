import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Play, Calendar, User, X, Film, Info, Search } from "lucide-react";

export default function TheBinaryOnline() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVideos();
    window.scrollTo(0, 0);
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
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");

  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-dark font-sans selection:bg-accent/30">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER (Mirrors News.jsx) */}
      <section className="bg-primary text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[15rem] leading-none -bottom-10 -left-10">
          VIDEOS
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-accent text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                The Binary Online
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Multimedia <br /> Features
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              Capturing the pulse of the campus through lens and light. Stories that move.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 SEARCH BAR (Sticky - Mirrors News.jsx) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search video archives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-light border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/10 font-bold text-sm"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <Film size={14} /> {filteredVideos.length} Episodes
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Accessing Media...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Film size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold">No footage found</h3>
            <p className="text-gray-500">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((v) => (
              <div key={v.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500">
                {/* THUMBNAIL */}
                <div 
                  className="relative aspect-video cursor-pointer overflow-hidden bg-dark"
                  onClick={() => setViewer(v)}
                >
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20 scale-50 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                    <div className="bg-accent text-dark p-4 rounded-full shadow-2xl">
                      <Play fill="currentColor" size={24} />
                    </div>
                  </div>
                  
                  {isYouTube(v.video_url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${v.video_url.split('v=')[1]?.split('&')[0] || v.video_url.split('/').pop()}/maxresdefault.jpg`}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={v.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <Film size={40} />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-accent bg-dark px-2 py-1 rounded w-fit mb-4">
                    {isYouTube(v.video_url) ? "YouTube" : "Direct Feature"}
                  </div>
                  <h3 className="text-xl font-black leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-6">
                    {v.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 flex items-center gap-1">
                      <User size={12} className="text-accent" /> {v.author_name}
                    </span>
                    <button onClick={() => setViewer(v)} className="text-primary hover:translate-x-1 transition-transform">
                      <Info size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🎬 MODAL (Consistent styling) */}
      {viewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-md" onClick={() => setViewer(null)} />
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh]">
            <button onClick={() => setViewer(null)} className="absolute top-6 right-6 z-50 bg-light text-dark p-2 rounded-full hover:bg-accent transition-all">
              <X size={20} />
            </button>

            <div className="flex-[2] bg-black flex items-center justify-center">
              {isYouTube(viewer.video_url) ? (
                <iframe src={getYouTubeEmbed(viewer.video_url)} className="w-full aspect-video md:h-full" allow="autoplay" allowFullScreen />
              ) : (
                <video src={viewer.video_url} controls autoPlay className="w-full" />
              )}
            </div>

            <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
              <span className="bg-accent text-dark px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded mb-4 inline-block">Featured Story</span>
              <h2 className="text-3xl font-black tracking-tighter leading-[0.9] mb-4">{viewer.title}</h2>
              <div className="flex gap-4 mb-6 text-[10px] font-black uppercase text-gray-400 border-b pb-6">
                <div><p className="text-accent">Author</p>{viewer.author_name}</div>
                <div><p className="text-accent">Date</p>{new Date(viewer.created_at).toLocaleDateString()}</div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{viewer.content || viewer.excerpt}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}