import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Ticket, 
  Search, 
  Sparkles, 
  X,
  Share2,
  Info
} from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null); // State for Full Details Modal

  useEffect(() => {
    fetchEvents();
    window.scrollTo(0, 0);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error && data) {
      const today = new Date().toISOString().split('T')[0];
      const futureEvents = data.filter(e => e.event_date >= today);
      
      if (futureEvents.length > 0) {
        setFeatured(futureEvents[0]);
        setEvents(data.filter(e => e.id !== futureEvents[0].id));
      } else {
        setFeatured(data[0]);
        setEvents(data.slice(1));
      }
    }
    setLoading(false);
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-dark font-sans selection:bg-accent/30">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER */}
      <section className="bg-primary text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[15rem] leading-none -bottom-10 -left-10">
          EVENTS
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-accent text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                Campus Bulletin
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Upcoming <br /> Engagements
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              Your guide to the activities, seminars, and celebrations happening across AMA Lipa.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 SEARCH BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search event schedule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-light border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/10 font-bold text-sm"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <Ticket size={14} /> {filteredEvents.length + (featured ? 1 : 0)} Total Listings
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Checking Calendar...</p>
          </div>
        ) : (
          <>
            {/* 🌟 FEATURED "COVER STORY" EVENT */}
            {featured && (
              <div className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 mb-20 flex flex-col lg:flex-row transition-all duration-500 hover:shadow-2xl">
                <div className="lg:w-1/2 relative h-80 lg:h-auto overflow-hidden">
                  <img
                    src={featured.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    alt={featured.title}
                  />
                  <div className="absolute top-8 left-8 bg-accent text-dark px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 bg-dark rounded-full"></span> Headline Event
                  </div>
                </div>
                <div className="lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
                    <span className="flex items-center gap-1"><Calendar size={14} className="text-accent" /> {new Date(featured.event_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-6 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-500 text-base font-medium leading-relaxed mb-8 line-clamp-4">
                    {featured.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8 py-6 border-y border-gray-100">
                    <div>
                      <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Venue</p>
                      <p className="text-sm font-bold flex items-center gap-1"><MapPin size={14} className="text-accent" /> {featured.location || "Main Campus"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Schedule</p>
                      <p className="text-sm font-bold flex items-center gap-1"><Clock size={14} className="text-accent" /> {featured.event_time || "See Details"}</p>
                    </div>
                  </div>
                  {/* Updated: View Details Trigger */}
                  <button 
                    onClick={() => setSelectedEvent(featured)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-dark text-white w-fit px-8 py-4 rounded-full hover:bg-primary transition-all active:scale-95 shadow-lg shadow-dark/10"
                  >
                    View Full Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* 🎉 SUBSEQUENT EVENTS GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.length === 0 && !featured ? (
                <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No matches found in the archive</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="mb-6 flex justify-between items-start">
                      <div className="bg-light p-3 rounded-2xl group-hover:bg-accent transition-colors">
                        <Calendar className="text-primary" size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-300 group-hover:text-primary transition-colors">
                        {new Date(event.event_date).getFullYear()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black leading-tight tracking-tight mb-4 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-gray-500 text-xs font-medium leading-relaxed mb-8 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="mt-auto space-y-3 pt-6 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Clock size={12} className="text-accent" /> {new Date(event.event_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <MapPin size={12} className="text-accent" /> {event.location || "TBA"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* 🖼️ EVENT DETAILS MODAL (Pop-up) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" onClick={() => setSelectedEvent(null)}></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white md:text-dark md:bg-gray-100 md:hover:bg-gray-200 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Image Side */}
              <div className="md:w-1/2 h-64 md:h-auto sticky top-0">
                <img 
                  src={selectedEvent.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"} 
                  className="w-full h-full object-cover" 
                  alt={selectedEvent.title}
                />
              </div>

              {/* Content Side */}
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-4">
                  <Sparkles size={14} className="text-accent" /> Campus Event
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight mb-6 italic">
                  {selectedEvent.title}
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-light p-2.5 rounded-xl"><Calendar size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">When</p>
                      <p className="text-sm font-bold">{new Date(selectedEvent.event_date).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-light p-2.5 rounded-xl"><Clock size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Time</p>
                      <p className="text-sm font-bold">{selectedEvent.event_time || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-light p-2.5 rounded-xl"><MapPin size={18} className="text-primary" /></div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Where</p>
                      <p className="text-sm font-bold">{selectedEvent.location || "AMA Lipa Campus"}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm mb-8">
                  <p className="text-gray-500 font-medium leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-100">
                  <button className="flex-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-full hover:bg-dark transition-colors flex items-center justify-center gap-2">
                    Add to Calendar
                  </button>
                  <button className="p-4 bg-gray-100 text-dark rounded-full hover:bg-gray-200 transition-colors">
                    <Share2 size={18} />
                  </button>
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