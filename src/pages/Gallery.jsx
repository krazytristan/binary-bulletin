import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2, Camera } from "lucide-react";

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

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const openViewer = (images, index) => {
    setCurrentAlbum(images);
    setViewerIndex(index);
    setViewer(images[index]);
  };

  const nextImage = () => {
    const next = (viewerIndex + 1) % currentAlbum.length;
    setViewerIndex(next);
    setViewer(currentAlbum[next]);
  };

  const prevImage = () => {
    const prev = (viewerIndex - 1 + currentAlbum.length) % currentAlbum.length;
    setViewerIndex(prev);
    setViewer(currentAlbum[prev]);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!viewer) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewer, viewerIndex, currentAlbum]);

  return (
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-primary selection:text-white antialiased">
      <Navbar />

      {/* COMPACT TOP NAV */}
      <div className="pt-24 md:pt-28 pb-4 border-b border-dark/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-1">
              Visual Archives
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">
              The Binary Bulletin Gallery
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Photographic Record</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gallery Index</p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <nav className="sticky top-0 z-40 bg-light/95 backdrop-blur-md border-b border-dark/5 h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search Archives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-6 pr-4 focus:ring-0 font-bold text-[11px] uppercase tracking-wider placeholder:text-gray-300 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
               <Camera size={12} /> {loading ? "..." : filteredEvents.length} Collections Found
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-dark/10 border border-dark/10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/5] bg-white animate-pulse p-8 flex flex-col justify-end">
                <div className="h-4 w-3/4 bg-gray-100 mb-4" />
                <div className="h-3 w-1/2 bg-gray-50" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dark/10 bg-white">
            <ImageIcon size={32} className="mx-auto text-gray-200 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No matching collections found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-dark/10 border border-dark/10">
            {filteredEvents.map((event) => (
              <div key={event.id} className="group bg-white relative overflow-hidden flex flex-col">
                <div 
                  className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                  onClick={() => openViewer(event.images, 0)}
                >
                  <img
                    src={event.images?.[0]}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    alt={event.title}
                  />
                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="text-white" size={24} />
                  </div>
                </div>

                <div className="p-6 border-t border-dark/5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">
                      Registry ID // BB-GAL-{event.id.toString().slice(0, 4)}
                    </span>
                    <span className="text-[8px] font-black bg-accent text-dark px-2 py-0.5 uppercase tracking-widest">
                      {event.images?.length} EXP
                    </span>
                  </div>
                  <h2 className="text-lg font-black leading-none tracking-tight uppercase mb-6 group-hover:text-primary transition-colors">
                    {event.title}
                  </h2>

                  {/* MINI THUMBS */}
                  <div className="flex gap-2 border-t border-dark/5 pt-4">
                    {event.images?.slice(1, 4).map((img, i) => (
                      <div 
                        key={i} 
                        className="w-10 h-10 border border-dark/10 cursor-pointer overflow-hidden opacity-60 hover:opacity-100 transition-all"
                        onClick={() => openViewer(event.images, i + 1)}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {event.images?.length > 4 && (
                      <div className="w-10 h-10 bg-dark text-white flex items-center justify-center text-[8px] font-bold">
                        +{event.images.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🖼 LIGHTBOX VIEWER */}
      {viewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-md" onClick={() => setViewer(null)} />
          
          <button onClick={() => setViewer(null)} className="absolute top-6 right-6 text-white/50 hover:text-accent transition-colors z-[110]">
            <X size={24} />
          </button>
          
          <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors z-[110]">
            <ChevronLeft size={48} strokeWidth={1} />
          </button>
          
          <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors z-[110]">
            <ChevronRight size={48} strokeWidth={1} />
          </button>

          <div className="relative z-[105] flex flex-col items-center max-w-5xl w-full p-6">
            <img
              src={viewer}
              className="max-h-[75vh] w-auto border border-white/10 shadow-2xl object-contain animate-in zoom-in duration-300"
              alt="Archive focus"
            />
            
            <div className="mt-8 flex flex-col items-center gap-4">
              <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
                Displaying Item {viewerIndex + 1} of {currentAlbum.length}
              </span>
              <button 
                onClick={() => window.open(viewer, '_blank')} 
                className="text-white/60 hover:text-accent border border-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/5"
              >
                Open Full Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}