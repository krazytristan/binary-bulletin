import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);
  
  // Touch swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const isInitialRender = useRef(true);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setViewerImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      fetchEvents();
      isInitialRender.current = false;
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const nextEvent = () => {
    setActiveIndex((prev) => (prev + 1) % events.length);
  };

  const prevEvent = () => {
    setActiveIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && events.length > 1) {
      nextEvent();
    }
    if (isRightSwipe && events.length > 1) {
      prevEvent();
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full flex flex-col relative">
        <header className="mb-12 border-b-2 border-black pb-8 text-center shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Official Itinerary</p>
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">Registry</h1>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20 flex-1">Loading registry...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 border border-gray-300 bg-white flex-1">
            <p className="font-serif italic text-gray-500 text-lg">No events found.</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center flex-1 w-full pb-10">
            
            {/* Prev Button */}
            {events.length > 1 && (
              <button 
                onClick={prevEvent}
                className="absolute left-0 md:-left-12 z-10 p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main Center Content */}
            <article 
              className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 w-full max-w-4xl min-h-[500px] flex flex-col z-0 relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-2 border-black pb-6">
                <h2 className="text-3xl md:text-5xl font-serif font-black uppercase tracking-tight leading-tight">
                  {events[activeIndex].title}
                </h2>
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-gray-100 px-3 py-1 border border-gray-300">
                    <Calendar size={12} className="inline mr-1 -mt-0.5" />
                    {new Date(events[activeIndex].event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                     <span className="flex items-center gap-1"><Clock size={12}/> {events[activeIndex].event_time || "TBA"}</span>
                     <span className="flex items-center gap-1"><MapPin size={12}/> {events[activeIndex].location || "Campus"}</span>
                  </div>
                </div>
              </div>
              
              <div 
                className="mb-8 aspect-video w-full overflow-hidden border-2 border-black relative cursor-pointer group"
                onClick={() => setViewerImage(events[activeIndex].image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070")}
              >
                <img 
                  src={events[activeIndex].image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"} 
                  alt="Event cover" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Maximize2 className="text-white drop-shadow-md" size={32} />
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap flex-1">
                {events[activeIndex].description}
              </div>

              {/* Pagination indicator */}
              {events.length > 1 && (
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Engagement {activeIndex + 1} of {events.length}
                </div>
              )}
            </article>

            {/* Next Button */}
            {events.length > 1 && (
              <button 
                onClick={nextEvent}
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
              alt="Event full view"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}