import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, X, Play } from "lucide-react";

export default function TheBinar() {
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
      const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");
  
  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const id = url.includes("v=") ? url.split("v=")[1]?.split("&")[0] : url.split("/").pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 border-b-2 border-black pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Motion Picture Archive</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">The Binar</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search Footage..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black transition-colors" 
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20">Loading archives...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((v) => (
              <article key={v.id} className="group flex flex-col border border-gray-300 bg-white">
                <div 
                  className="aspect-video relative overflow-hidden bg-gray-100 cursor-pointer border-b border-gray-300"
                  onClick={() => setViewer(v)}
                >
                  {isYouTube(v.video_url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${v.video_url.split('v=')[1]?.split('&')[0] || v.video_url.split('/').pop()}/maxresdefault.jpg`}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={v.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-4 rounded-full text-black">
                      <Play fill="currentColor" size={24} />
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                  <h2 className="text-xl font-serif font-black uppercase leading-tight mb-3 group-hover:underline decoration-1 underline-offset-2 cursor-pointer" onClick={() => setViewer(v)}>
                    {v.title}
                  </h2>
                  <p className="text-sm font-serif text-gray-600 line-clamp-2 mb-4 flex-1">
                    {v.excerpt}
                  </p>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border-t border-gray-200 pt-4">
                    Dir. {v.author_name}
                  </div>
                </div>
              </article>
            ))}

            {filteredVideos.length === 0 && (
              <div className="col-span-full text-center py-20 border border-gray-300 bg-white">
                <p className="font-serif italic text-gray-500 text-lg">No footage found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIDEO LIGHTBOX */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/95 backdrop-blur-md">
          <div className="w-full max-w-5xl bg-white border border-black shadow-2xl relative">
            <button onClick={() => setViewer(null)} className="absolute -top-12 right-0 p-2 text-black hover:bg-gray-100 bg-white border border-black transition-colors">
              <X size={20} />
            </button>
            
            <div className="aspect-video bg-black w-full border-b border-black">
              {isYouTube(viewer.video_url) ? (
                <iframe 
                  src={getYouTubeEmbed(viewer.video_url)} 
                  className="w-full h-full border-none" 
                  allow="autoplay" 
                  allowFullScreen 
                />
              ) : (
                <video src={viewer.video_url} controls autoPlay className="w-full h-full" />
              )}
            </div>
            
            <div className="p-8">
              <h2 className="text-3xl font-serif font-black uppercase tracking-tight mb-4">{viewer.title}</h2>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                <span>By {viewer.author_name}</span>
                <span>|</span>
                <span>{new Date(viewer.created_at).toLocaleDateString()}</span>
              </div>
              <p className="font-serif text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {viewer.content || viewer.excerpt}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}