import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MapPin, Clock, X, Maximize2 } from "lucide-react";
import {
  PUBLICATION,
  formatEventDateParts,
  cleanEditorialText,
  parseArticleBlocks,
} from "../utils/editorial";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerImage, setViewerImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = `Campus Events | ${PUBLICATION.name}`;
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setViewerImage(null);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
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

  // Support deep linking via ?id= from Home or Navbar search
  useEffect(() => {
    const targetId = searchParams.get("id");
    if (targetId && events.length > 0) {
      const match = events.find((e) => String(e.id) === String(targetId));
      if (match) {
        setSelectedItem(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, events, setSearchParams]);

  const visibleItems = showAll ? events : events.slice(0, 6);

  const selectedBlocks = useMemo(() => {
    if (!selectedItem) return [];
    return parseArticleBlocks(selectedItem.description || "");
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col relative">
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8 text-center shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
            {PUBLICATION.institution} &bull; Official Calendar
          </p>
          <h1 className="text-4xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">
            Campus Events
          </h1>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 border border-gray-300" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 border border-gray-300 bg-white flex-1">
            <p className="font-serif italic text-gray-500 text-lg">
              No campus events are currently scheduled.
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {visibleItems.map((item) => {
                const dateParts = formatEventDateParts(item.event_date);
                return (
                  <article
                    key={item.id}
                    className="bg-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] flex flex-col transition-all group overflow-hidden"
                  >
                    {/* Image Top */}
                    {item.image_url ? (
                      <div
                        className="w-full h-48 sm:h-56 border-b-2 border-blue-900 relative cursor-pointer bg-gray-100 overflow-hidden shrink-0"
                        onClick={() => setViewerImage(item.image_url)}
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-amber-400 drop-shadow-md" size={24} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full h-48 sm:h-56 bg-blue-50/70 flex flex-col items-center justify-center border-b-2 border-blue-900 p-8 text-center shrink-0 cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Calendar size={28} className="text-blue-900/40 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-900/60">
                          Campus Event
                        </p>
                      </div>
                    )}

                    {/* Content Bottom */}
                    <div className="p-6 flex flex-col flex-1 bg-white">
                      <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex flex-col gap-2">
                          <span className="self-start text-[10px] font-bold uppercase tracking-widest text-blue-950 bg-amber-400 px-2.5 py-1 border border-amber-500 inline-flex items-center gap-1.5">
                            <Calendar size={12} />
                            {dateParts.full}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-red-900">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {item.event_time || "Time TBA"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.location || "Campus TBA"}
                            </span>
                          </div>
                        </div>
                        <h2
                          className="text-xl font-serif font-black tracking-tight leading-snug text-blue-900 group-hover:text-red-900 transition-colors line-clamp-2 mt-1 cursor-pointer"
                          title="Click to read full event details"
                          onClick={() => setSelectedItem(item)}
                        >
                          {item.title}
                        </h2>
                      </div>

                      <p className="text-sm font-serif text-gray-700 leading-relaxed flex-1 line-clamp-4">
                        {cleanEditorialText(item.description)}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="mt-5 self-start text-xs font-bold uppercase tracking-widest text-red-900 hover:text-blue-900 transition-colors"
                      >
                        Read Full Details &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {events.length > 6 && (
              <div className="flex justify-center mt-12">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3 bg-white border-2 border-blue-900 text-blue-900 text-xs font-bold uppercase tracking-widest hover:bg-red-900 hover:text-white hover:border-red-900 transition-all shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
                >
                  {showAll ? "Show Fewer Events" : `View All ${events.length} Events`}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EVENT READING MODAL */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm p-0 md:p-10"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[#FCFBF9] w-full h-full md:h-auto max-w-4xl max-h-full overflow-y-auto shadow-2xl border-0 md:border-4 border-blue-900 relative flex flex-col custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close event modal"
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-white text-blue-900 border-2 border-blue-900 hover:bg-red-900 hover:text-white hover:border-red-900 transition-colors z-10 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
            >
              <X size={20} />
            </button>

            <div className="p-6 md:p-12 flex flex-col bg-white flex-1 min-h-screen md:min-h-0">
              <div className="flex flex-col gap-4 mb-6 pb-6 border-b-2 border-gray-200 mt-10 md:mt-0">
                <h2 className="text-2xl md:text-4xl font-serif font-black tracking-tight leading-tight text-blue-900">
                  {selectedItem.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-950 bg-amber-400 px-3 py-1 border border-amber-500 inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatEventDateParts(selectedItem.event_date).full}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-900">
                    <Clock size={13} /> {selectedItem.event_time || "Time TBA"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-900">
                    <MapPin size={13} /> {selectedItem.location || "Campus TBA"}
                  </span>
                </div>
              </div>

              {selectedItem.image_url && (
                <figure className="mb-8">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    onClick={() => setViewerImage(selectedItem.image_url)}
                    className="w-full max-h-[400px] object-cover border border-gray-300 cursor-zoom-in"
                  />
                  <figcaption className="mt-2 text-xs font-serif italic text-gray-500 text-right">
                    Event Banner &mdash; Click image to enlarge
                  </figcaption>
                </figure>
              )}

              <div className="max-w-none font-serif text-gray-800 text-base md:text-lg leading-relaxed space-y-4">
                {selectedBlocks.map((block, i) => {
                  if (block.type === "heading") {
                    return (
                      <h3
                        key={i}
                        className="text-lg md:text-xl font-serif font-bold text-blue-900 pt-3 border-l-4 border-amber-400 pl-3"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === "bullet") {
                    return (
                      <div key={i} className="flex items-start gap-3 pl-2">
                        <span className="mt-2.5 w-1.5 h-1.5 bg-red-900 shrink-0 rounded-full" />
                        <p>{block.text}</p>
                      </div>
                    );
                  }
                  return <p key={i}>{block.text}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/95 backdrop-blur-md"
          onClick={() => setViewerImage(null)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setViewerImage(null)}
            className="absolute top-6 right-6 p-2 text-white hover:text-amber-400 transition-colors z-10"
          >
            <X size={26} />
          </button>
          <div
            className="w-full max-w-6xl max-h-screen p-6 md:p-12 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewerImage}
              className="max-h-[85vh] w-auto border-2 border-amber-400 shadow-2xl object-contain bg-white"
              alt="Event banner full view"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
