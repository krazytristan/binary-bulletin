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
    <div className="min-h-screen bg-[#F9F9F7] text-dark font-sans selection:bg-accent/30">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER (Mirrors News & Multimedia) */}
      <section className="bg-primary text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[15rem] leading-none -bottom-10 -left-10">
          GALLERY
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-accent text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                Visual Journalism
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Captured <br /> Moments
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              A visual record of campus life, culture, and the milestones that define our student journey.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 SEARCH BAR (Sticky Sync) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search albums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-light border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/10 font-bold text-sm"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <Camera size={14} /> {filteredEvents.length} Albums
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Developing Photos...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold">No collections found</h3>
            <p className="text-gray-500">Refine your search to find specific events.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredEvents.map((event) => (
              <div key={event.id} className="group flex flex-col">
                {/* LARGE COVER */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-dark shadow-sm group-hover:shadow-2xl transition-all duration-500">
                   <img
                    src={event.images?.[0]}
                    onClick={() => openViewer(event.images, 0)}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 cursor-pointer"
                    alt={event.title}
                  />
                  
                  {/* PHOTO COUNT BADGE */}
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                    {event.images?.length} PHOTOS
                  </div>

                  {/* TITLE OVERLAY */}
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <h2 className="text-white text-2xl font-black leading-tight tracking-tight">
                      {event.title}
                    </h2>
                    <div className="mt-4 flex gap-2 overflow-hidden">
                      {event.images?.slice(1, 4).map((img, i) => (
                        <div 
                          key={i} 
                          className="w-12 h-12 rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-accent transition-colors"
                          onClick={() => openViewer(event.images, i + 1)}
                        >
                          <img src={img} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {event.images?.length > 4 && (
                        <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white">
                          +{event.images.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🖼 LIGHTBOX VIEWER (High-end sync) */}
      {viewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-dark/98 backdrop-blur-xl" onClick={() => setViewer(null)} />
          
          {/* CONTROLS */}
          <button onClick={() => setViewer(null)} className="absolute top-8 right-8 text-white/50 hover:text-accent transition-colors z-[110]">
            <X size={32} />
          </button>
          
          <button onClick={prevImage} className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors z-[110]">
            <ChevronLeft size={64} strokeWidth={1} />
          </button>
          
          <button onClick={nextImage} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors z-[110]">
            <ChevronRight size={64} strokeWidth={1} />
          </button>

          <div className="relative z-[105] flex flex-col items-center max-w-5xl w-full p-4">
            <img
              src={viewer}
              className="max-h-[80vh] w-auto rounded-lg shadow-2xl object-contain animate-in zoom-in duration-500"
              alt="Gallery view"
            />
            
            <div className="mt-8 flex items-center gap-6">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                {viewerIndex + 1} / {currentAlbum.length}
              </span>
              <div className="h-px w-12 bg-white/10" />
              <button onClick={() => window.open(viewer, '_blank')} className="text-white/40 hover:text-accent flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                <Maximize2 size={14} /> Full Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}