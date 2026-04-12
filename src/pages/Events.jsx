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
  Share2
} from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

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
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-primary selection:text-white antialiased">
      <Navbar />

      {/* COMPACT TOP NAV / HEADER */}
      <div className="pt-24 md:pt-28 pb-4 border-b border-dark/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-1">
              Campus Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">
              The Binary Bulletin
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Bulletin Schedule</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Engagements</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR (STICKY) */}
      <nav className="sticky top-0 z-30 bg-light/95 backdrop-blur-md border-b border-dark/5 h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search Schedule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-6 pr-4 focus:ring-0 font-bold text-[11px] uppercase tracking-wider placeholder:text-gray-300 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-primary">
            <Ticket size={12} /> {filteredEvents.length + (featured ? 1 : 0)} Active Listings
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-dark/10 border-t-primary animate-spin"></div>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary">Synchronizing Calendar...</p>
          </div>
        ) : (
          <>
            {/* 🌟 FEATURED "COVER STORY" EVENT */}
            {featured && (
              <section className="border border-dark/10 bg-white grid grid-cols-1 lg:grid-cols-12 mb-16 shadow-card">
                <div className="lg:col-span-7 relative h-80 lg:h-auto overflow-hidden bg-dark">
                  <img
                    src={featured.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"}
                    className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-pointer"
                    alt={featured.title}
                    onClick={() => setSelectedEvent(featured)}
                  />
                  <div className="absolute top-0 left-0 bg-accent text-dark px-4 py-2 text-[9px] font-black uppercase tracking-widest">
                    Headline Listing
                  </div>
                </div>
                <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-center border-l border-dark/5">
                  <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-6">
                    <span className="flex items-center gap-2">
                      <Calendar size={12} /> {new Date(featured.event_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-6 uppercase">
                    {featured.title}
                  </h2>
                  <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-8 line-clamp-3 text-justify">
                    {featured.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-px bg-dark/10 border border-dark/10 mb-8">
                    <div className="bg-white p-4">
                      <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Venue</p>
                      <p className="text-[11px] font-bold uppercase flex items-center gap-2"><MapPin size={12} className="text-accent" /> {featured.location || "Main Campus"}</p>
                    </div>
                    <div className="bg-white p-4">
                      <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Schedule</p>
                      <p className="text-[11px] font-bold uppercase flex items-center gap-2"><Clock size={12} className="text-accent" /> {featured.event_time || "TBA"}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedEvent(featured)}
                    className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] bg-dark text-white w-full py-4 hover:bg-primary transition-all active:scale-95"
                  >
                    View Operational Data <ArrowRight size={14} />
                  </button>
                </div>
              </section>
            )}

            {/* 🎉 SUBSEQUENT EVENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-dark/10 border border-dark/10">
              {filteredEvents.length === 0 && !featured ? (
                <div className="col-span-full text-center py-20 bg-white">
                  <Calendar size={32} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">No Active Listings Found</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white p-8 hover:bg-gray-50 transition-all duration-300 flex flex-col cursor-pointer relative"
                  >
                    <div className="mb-8 flex justify-between items-start">
                      <div className="border border-dark/10 p-2 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Calendar size={20} />
                      </div>
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                        Ref: {new Date(event.event_date).getFullYear()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-black leading-none tracking-tight uppercase mb-4 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-[12px] text-gray-400 font-medium leading-relaxed mb-8 line-clamp-3 text-justify">
                      {event.description}
                    </p>

                    <div className="mt-auto space-y-2 pt-6 border-t border-dark/5">
                      <div className="flex items-center gap-2 text-[9px] font-black text-dark uppercase tracking-widest">
                        <Clock size={11} className="text-accent" /> {new Date(event.event_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-black text-dark uppercase tracking-widest">
                        <MapPin size={11} className="text-accent" /> {event.location || "TBA"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* 🖼️ EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-md" onClick={() => setSelectedEvent(null)}></div>
          
          <div className="relative bg-white w-full max-w-5xl max-h-full md:max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row border border-white/10">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 z-10 bg-dark text-white p-2 hover:bg-primary transition-all"
            >
              <X size={20} />
            </button>

            {/* Image Side */}
            <div className="md:w-1/2 h-64 md:h-auto bg-dark border-r border-dark/5">
              <img 
                src={selectedEvent.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"} 
                className="w-full h-full object-cover grayscale opacity-80" 
                alt={selectedEvent.title}
              />
            </div>

            {/* Content Side */}
            <div className="md:w-1/2 p-8 md:p-16 flex flex-col">
              <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-[0.4em] mb-4">
                <Sparkles size={14} className="text-accent" /> Registry Record
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-10 uppercase">
                {selectedEvent.title}
              </h2>

              <div className="grid grid-cols-1 gap-4 mb-10">
                <div className="flex items-center gap-4 border-b border-dark/5 pb-4">
                  <div className="bg-light p-3 border border-dark/5 text-primary"><Calendar size={18} /></div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
                    <p className="text-xs font-bold uppercase tracking-tight">{new Date(selectedEvent.event_date).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-b border-dark/5 pb-4">
                  <div className="bg-light p-3 border border-dark/5 text-primary"><Clock size={18} /></div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard Time</p>
                    <p className="text-xs font-bold uppercase tracking-tight">{selectedEvent.event_time || "TBA"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-b border-dark/5 pb-4">
                  <div className="bg-light p-3 border border-dark/5 text-primary"><MapPin size={18} /></div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Operational Venue</p>
                    <p className="text-xs font-bold uppercase tracking-tight">{selectedEvent.location || "AMA Lipa Campus"}</p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-12 text-justify">
                {selectedEvent.description}
              </p>

              <div className="mt-auto grid grid-cols-5 gap-4">
                <button className="col-span-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] py-5 hover:bg-dark transition-colors flex items-center justify-center gap-3">
                  Commit to Calendar
                </button>
                <button className="col-span-1 border border-dark/10 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}