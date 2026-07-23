import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);
  const isInitialRender = useRef(true);

  // Allow closing the lightbox with the Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setViewerImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      fetchAnnouncements();
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const newFiltered = announcements.filter(a => 
      a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term)
    );
    setFiltered(newFiltered);
    setActiveIndex(0); // reset index when search changes
  }, [search, announcements]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) {
      setAnnouncements(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  const nextAnnouncement = () => {
    setActiveIndex((prev) => (prev + 1) % filtered.length);
  };

  const prevAnnouncement = () => {
    setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full flex flex-col relative">
        <header className="mb-12 border-b-2 border-black pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Official Notices</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">Bulletins</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black transition-colors" 
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20 flex-1">Loading bulletins...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-gray-300 bg-white flex-1">
            <p className="font-serif italic text-gray-500 text-lg">No bulletins found.</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center flex-1 w-full pb-10">
            
            {/* Prev Button */}
            {filtered.length > 1 && (
              <button 
                onClick={prevAnnouncement}
                className="absolute left-0 md:-left-12 z-10 p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main Center Content */}
            <article className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 w-full max-w-4xl min-h-[500px] flex flex-col z-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-2 border-black pb-6">
                <h2 className="text-3xl md:text-4xl font-serif font-black uppercase tracking-tight leading-tight">
                  {filtered[activeIndex].title}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-gray-100 px-3 py-1 border border-gray-300 shrink-0">
                  {new Date(filtered[activeIndex].created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              {filtered[activeIndex].image_url && (
                <div 
                  className="mb-8 aspect-[21/9] w-full overflow-hidden border-2 border-black relative cursor-pointer group"
                  onClick={() => setViewerImage(filtered[activeIndex].image_url)}
                >
                  <img src={filtered[activeIndex].image_url} alt="Notice attachment" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="text-white drop-shadow-md" size={32} />
                  </div>
                </div>
              )}
              
              <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap flex-1">
                {filtered[activeIndex].content}
              </div>

              {/* Pagination indicator */}
              {filtered.length > 1 && (
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Bulletin {activeIndex + 1} of {filtered.length}
                </div>
              )}
            </article>

            {/* Next Button */}
            {filtered.length > 1 && (
              <button 
                onClick={nextAnnouncement}
                className="absolute right-0 md:-right-12 z-10 p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>
            )}

          </div>
        )}
      </main>

      {/* FULL SCREEN IMAGE VIEWER */}
      {viewerImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md" onClick={() => setViewerImage(null)}>
          <button onClick={() => setViewerImage(null)} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <X size={24} />
          </button>
          <div className="w-full max-w-6xl max-h-screen p-12 flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewerImage}
              className="max-h-[85vh] w-auto border border-gray-300 shadow-2xl object-contain"
              alt="Notice full view"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}