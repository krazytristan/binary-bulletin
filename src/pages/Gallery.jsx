import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, X, ChevronLeft, ChevronRight, Images } from "lucide-react";

export default function Gallery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentAlbum, setCurrentAlbum] = useState([]);

  useEffect(() => {
    fetchGallery();
    window.scrollTo(0, 0);
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const openAlbum = (images) => {
    if (!images || images.length === 0) return;
    setCurrentAlbum(images);
    setViewerIndex(0);
    setViewer(images[0]);
  };

  const nextImage = useCallback(() => {
    const next = (viewerIndex + 1) % currentAlbum.length;
    setViewerIndex(next);
    setViewer(currentAlbum[next]);
  }, [viewerIndex, currentAlbum]);

  const prevImage = useCallback(() => {
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
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 border-b-2 border-black pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Visual Archives</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">Exhibits</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search Exhibits..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black transition-colors" 
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20">Loading exhibits...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => {
              const coverImage = event.images && event.images.length > 0 ? event.images[0] : null;
              const imageCount = event.images?.length || 0;
              
              return (
                <article 
                  key={event.id} 
                  className="group cursor-pointer border border-gray-300 bg-white hover:border-black transition-colors flex flex-col"
                  onClick={() => openAlbum(event.images)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 border-b border-gray-300">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        alt={event.title} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Images size={32} />
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 right-0 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black border-t border-l border-gray-300 flex items-center gap-1.5">
                      <Images size={10} />
                      {imageCount} Captures
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      {new Date(event.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h2 className="text-xl font-serif font-black uppercase tracking-tight leading-tight group-hover:underline decoration-1 underline-offset-2">
                      {event.title}
                    </h2>
                  </div>
                </article>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-20 border border-gray-300 bg-white">
                <p className="font-serif italic text-gray-500 text-lg">No exhibits found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md">
          <button onClick={() => setViewer(null)} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <X size={24} />
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <ChevronLeft size={32} strokeWidth={1} />
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <ChevronRight size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-6xl max-h-screen p-12 flex flex-col items-center justify-center relative">
            <img
              src={viewer}
              className="max-h-[80vh] w-auto border border-gray-300 shadow-2xl object-contain"
              alt="Archive focus"
            />
            <div className="absolute bottom-8 bg-white px-4 py-2 border border-black shadow-lg text-[10px] font-bold uppercase tracking-widest text-black">
              Exhibit {viewerIndex + 1} of {currentAlbum.length}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}