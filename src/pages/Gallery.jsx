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
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-900 mb-4">Visual Archives</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">Exhibits</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search Exhibits..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors" 
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
                  className="group cursor-pointer border-2 border-gray-200 bg-white hover:border-blue-900 hover:shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] transition-all flex flex-col"
                  onClick={() => openAlbum(event.images)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 border-b-2 border-gray-200 group-hover:border-blue-900 transition-colors">
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
                    
                    <div className="absolute bottom-0 right-0 bg-amber-400 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-blue-900 border-t border-l border-amber-400 flex items-center gap-1.5">
                      <Images size={10} />
                      {imageCount} Captures
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-hover:text-amber-500 transition-colors">
                      {new Date(event.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <h2 className="text-xl font-serif font-black uppercase tracking-tight leading-tight group-hover:text-red-900 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/95 backdrop-blur-md">
          <button onClick={() => setViewer(null)} className="absolute top-6 right-6 p-2 text-white hover:text-amber-400 transition-colors z-10">
            <X size={24} />
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-white hover:text-amber-400 transition-colors z-10">
            <ChevronLeft size={32} strokeWidth={1} />
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white hover:text-amber-400 transition-colors z-10">
            <ChevronRight size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-6xl max-h-screen p-12 flex flex-col items-center justify-center relative" onClick={() => setViewer(null)}>
            <img
              src={viewer}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-auto border-[3px] border-amber-400 shadow-[8px_8px_0px_0px_rgba(251,191,36,1)] object-contain"
              alt="Archive focus"
            />
            <div className="absolute bottom-8 bg-white px-4 py-2 border-2 border-blue-900 shadow-lg text-[10px] font-bold uppercase tracking-widest text-blue-900">
              Exhibit {viewerIndex + 1} of {currentAlbum.length}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}