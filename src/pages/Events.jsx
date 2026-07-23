import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MapPin, Clock, ArrowRight, X } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 border-b-2 border-black pb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Official Itinerary</p>
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">Registry</h1>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20">Loading registry...</div>
        ) : (
          <div className="space-y-16">
            {/* FEATURED EVENT */}
            {featured && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-gray-300 pb-16">
                <div 
                  className="aspect-video lg:aspect-square bg-gray-100 border border-gray-300 cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedEvent(featured)}
                >
                  <img
                    src={featured.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt={featured.title}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                    <span className="text-black border border-black px-2 py-0.5">Upcoming</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(featured.event_date).toLocaleDateString()}</span>
                  </div>
                  <h2 
                    className="text-4xl md:text-6xl font-serif font-black leading-[1.1] mb-6 cursor-pointer hover:underline decoration-2 underline-offset-4"
                    onClick={() => setSelectedEvent(featured)}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-lg font-serif text-gray-600 leading-relaxed mb-8 line-clamp-3">
                    {featured.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 border-t border-gray-200 pt-6">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Venue</p>
                      <p className="text-sm font-bold uppercase">{featured.location || "Main Campus"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Time</p>
                      <p className="text-sm font-bold uppercase">{featured.event_time || "TBA"}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* UPCOMING LIST */}
            {events.length > 0 && (
              <section>
                <h3 className="font-sans font-bold text-[10px] uppercase tracking-widest border-b border-gray-300 pb-2 mb-8">Scheduled Engagements</h3>
                <div className="space-y-6">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border border-gray-300 hover:border-black cursor-pointer transition-colors"
                    >
                      <div className="md:col-span-1">
                        <div className="text-3xl font-serif font-black mb-1">{new Date(event.event_date).getDate()}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <h4 className="text-2xl font-serif font-black mb-3 group-hover:underline decoration-1 underline-offset-2">{event.title}</h4>
                        <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={12}/> {event.event_time || "TBA"}</span>
                          <span className="flex items-center gap-1"><MapPin size={12}/> {event.location || "Campus"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* EVENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          
          <div className="relative bg-white w-full max-w-3xl border border-black shadow-2xl p-8 md:p-12 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8 border-b border-gray-200 pb-8 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest border border-black px-3 py-1 inline-block mb-6">
                Registry Details
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight mb-6">
                {selectedEvent.title}
              </h2>
              <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span className="flex items-center gap-1 text-black"><Calendar size={12}/> {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1 text-black"><Clock size={12}/> {selectedEvent.event_time || "TBA"}</span>
                <span className="flex items-center gap-1 text-black"><MapPin size={12}/> {selectedEvent.location || "Campus"}</span>
              </div>
            </div>

            <div className="aspect-video w-full bg-gray-100 border border-gray-300 mb-8 overflow-hidden">
              <img 
                src={selectedEvent.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"} 
                className="w-full h-full object-cover grayscale" 
                alt={selectedEvent.title}
              />
            </div>

            <div className="prose prose-sm max-w-none font-serif text-gray-800 leading-relaxed text-lg">
              {selectedEvent.description?.split('\n').map((p, i) => (
                <p key={i} className="mb-4">{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}