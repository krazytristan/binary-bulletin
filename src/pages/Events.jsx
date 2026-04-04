import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (!error && data) {
      setFeatured(data[0]);
      setEvents(data.slice(1));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HEADER */}
      <section className="bg-primary text-white py-14 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Campus Events
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Discover upcoming activities and programs at AMA Lipa
        </p>
      </section>

      <div className="max-w-6xl mx-auto p-6">

        {/* ⏳ LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading events...
          </p>
        )}

        {/* 🌟 FEATURED EVENT */}
        {!loading && featured && (
          <div className="mb-10 bg-white rounded-2xl shadow-card overflow-hidden">

            <img
              src={featured.image_url || "https://picsum.photos/800/400"}
              onError={(e) =>
                (e.target.src = "https://picsum.photos/800/400")
              }
              alt={featured.title}
              className="w-full h-80 object-cover"
            />

            <div className="p-6">
              <span className="text-secondary text-xs font-semibold uppercase">
                Upcoming Event
              </span>

              <h2 className="text-2xl font-bold text-dark mt-2">
                {featured.title}
              </h2>

              <p className="text-gray-600 mt-2">
                {featured.description}
              </p>

              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>📅 {new Date(featured.event_date).toLocaleDateString()}</p>
                <p>📍 {featured.location || "TBA"}</p>
              </div>
            </div>
          </div>
        )}

        {/* 🎉 EVENTS LIST */}
        {!loading && events.length === 0 ? (
          <p className="text-center text-gray-500">
            No events available.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white p-5 rounded-xl shadow-card hover:shadow-md transition"
              >
                <h3 className="font-semibold text-dark text-lg">
                  {event.title}
                </h3>

                <p className="text-sm text-gray-600 mt-2">
                  {event.description}
                </p>

                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                  <p>📍 {event.location || "TBA"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}