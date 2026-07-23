import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";

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
          <div className="space-y-16">
            {filteredEvents.map((event) => (
              <section key={event.id} className="border-b border-gray-300 pb-16">
                <div className="flex flex-col md:flex-row justify-between items-baseline mb-6 gap-4">
                  <h2 className="text-3xl font-serif font-black uppercase tracking-tight">{event.title}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-300 px-2 py-1">
                    {event.images?.length || 0} Captures
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.images?.map((img, idx) => (
                    <div 
                      key={idx}
                      className="aspect-[4/3] relative overflow-hidden bg-gray-100 border border-gray-300 cursor-pointer group"
                      onClick={() => openViewer(event.images, idx)}
                    >
                      <img 
                        src={img} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                        alt={`${event.title} ${idx + 1}`} 
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-20 border border-gray-300 bg-white">
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
          
          <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <ChevronLeft size={32} strokeWidth={1} />
          </button>
          
          <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <ChevronRight size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-6xl max-h-screen p-12 flex flex-col items-center">
            <img
              src={viewer}
              className="max-h-[80vh] w-auto border border-gray-300 shadow-2xl object-contain"
              alt="Archive focus"
            />
            <div className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Exhibit {viewerIndex + 1} of {currentAlbum.length}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}