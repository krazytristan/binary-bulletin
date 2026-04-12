import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Play, User, X, Film, Info, Search, ShieldCheck, Globe } from "lucide-react";

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
      console.error("Transmission Error:", err.message);
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
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-primary selection:text-white antialiased">
      <Navbar />

      {/* Editorial Header */}
      <section className="pt-28 pb-12 border-b border-dark/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-accent text-dark px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
                  Multimedia
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Vol. 04 / Video Archive
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                THE BINARY <br /> ONLINE
              </h1>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed max-w-md">
                A digital repository capturing campus narratives through visual storytelling. 
                Documenting the evolution of our community in high-fidelity motion.
              </p>
            </div>
            <div className="hidden lg:block border-l border-dark/5 pl-8 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-2">Media Inventory</p>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-primary">
                <Film size={14} />
                {filteredVideos.length} Documented Episodes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Status Bar */}
      <nav className="sticky top-0 z-30 bg-light/95 backdrop-blur-md border-b border-dark/5 h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between gap-8">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search video archives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-8 pr-4 focus:ring-0 font-bold text-xs uppercase tracking-wider outline-none"
            />
          </div>
          <div className="hidden md:flex text-[9px] font-bold uppercase tracking-[0.2em] text-dark/40 items-center gap-2">
            <ShieldCheck size={12} className="text-primary" /> Verified Media Stream
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-accent rounded-full animate-spin"></div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">Accessing media registry...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-32 bg-white border border-dark/5">
            <Film size={32} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest">No Footage Found</h3>
            <p className="text-[11px] text-gray-400 font-medium uppercase mt-2 tracking-tighter">Please adjust your search parameters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-dark/10 border border-dark/10">
            {filteredVideos.map((v) => (
              <div key={v.id} className="group bg-white flex flex-col hover:bg-gray-50 transition-colors duration-500">
                {/* THUMBNAIL */}
                <div 
                  className="relative aspect-video cursor-pointer overflow-hidden bg-dark"
                  onClick={() => setViewer(v)}
                >
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-primary text-white p-4 rounded-full shadow-2xl">
                      <Play fill="currentColor" size={20} />
                    </div>
                  </div>
                  
                  {isYouTube(v.video_url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${v.video_url.split('v=')[1]?.split('&')[0] || v.video_url.split('/').pop()}/maxresdefault.jpg`}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={v.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/5 bg-dark">
                      <Film size={40} />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary px-2 py-0.5 border border-primary/20">
                      {isYouTube(v.video_url) ? "YouTube" : "Direct Feature"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-gray-500 text-[12px] font-medium leading-relaxed line-clamp-2 mb-8">
                    {v.excerpt}
                  </p>
                  <div className="mt-auto pt-6 border-t border-dark/5 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <User size={12} className="text-accent" /> {v.author_name}
                    </span>
                    <button onClick={() => setViewer(v)} className="text-dark/20 hover:text-primary transition-colors">
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Modal Overlay */}
      {viewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-sm" onClick={() => setViewer(null)} />
          <div className="bg-white w-full max-w-6xl overflow-hidden shadow-2xl relative z-10 flex flex-col lg:flex-row max-h-[90vh] border border-dark/10">
            <button onClick={() => setViewer(null)} className="absolute top-6 right-6 z-50 bg-dark text-white p-2 hover:bg-primary transition-all">
              <X size={18} />
            </button>

            <div className="flex-[3] bg-black flex items-center justify-center">
              {isYouTube(viewer.video_url) ? (
                <iframe 
                  src={getYouTubeEmbed(viewer.video_url)} 
                  className="w-full aspect-video lg:h-full border-none" 
                  allow="autoplay" 
                  allowFullScreen 
                />
              ) : (
                <video src={viewer.video_url} controls autoPlay className="w-full" />
              )}
            </div>

            <div className="flex-1 p-10 overflow-y-auto bg-white divide-y divide-dark/5">
              <div className="pb-8">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">Feature Dispatch</span>
                <h2 className="text-2xl font-black tracking-tighter leading-tight mb-6">{viewer.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  <div>
                    <p className="text-accent mb-1">Author</p>
                    <p className="text-dark">{viewer.author_name}</p>
                  </div>
                  <div>
                    <p className="text-accent mb-1">Registry Date</p>
                    <p className="text-dark">{new Date(viewer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="py-8">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {viewer.content || viewer.excerpt}
                </p>
              </div>
              <div className="pt-8">
                <div className="flex items-center gap-3 text-gray-300">
                  <Globe size={14} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em]">AMA Computer College Lipa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}