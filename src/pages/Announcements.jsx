import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLatest(data[0]);
      setAnnouncements(data.slice(1));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HEADER */}
      <section className="bg-primary text-white py-14 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Announcements
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Official updates from AMA Computer College Lipa
        </p>
      </section>

      <div className="max-w-6xl mx-auto p-6">

        {/* ⏳ LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading announcements...
          </p>
        )}

        {/* 🌟 LATEST ANNOUNCEMENT */}
        {!loading && latest && (
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-card">
            <span className="text-secondary text-xs font-semibold uppercase">
              Latest Announcement
            </span>

            <h2 className="text-xl font-bold text-dark mt-2">
              {latest.title}
            </h2>

            <p className="text-gray-600 mt-2">
              {latest.content}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              {new Date(latest.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* 📢 ANNOUNCEMENTS LIST */}
        {!loading && announcements.length === 0 ? (
          <p className="text-center text-gray-500">
            No announcements available.
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white p-5 rounded-xl shadow-card hover:shadow-md transition"
              >
                <h3 className="font-semibold text-dark">
                  {a.title}
                </h3>

                <p className="text-sm text-gray-600 mt-2">
                  {a.content}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}