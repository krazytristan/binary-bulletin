import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFeatured(data[0]);
      setArticles(data.slice(1, 4));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HERO (CLEAN, NO GRADIENT) */}
      <section className="bg-primary text-white py-16 text-center px-4 border-b">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          The Binary Bulletin
        </h1>
        <p className="mt-3 text-sm md:text-base opacity-80">
          Official Campus Publication of AMA Computer College Lipa
        </p>

        <Link
          to="/news"
          className="inline-block mt-6 bg-white text-primary px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition"
        >
          Explore News
        </Link>
      </section>

      <div className="max-w-7xl mx-auto p-6">

        {/* ⏳ LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading content...
          </p>
        )}

        {/* 🌟 FEATURED */}
        {!loading && featured && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-dark mb-4 border-l-4 border-primary pl-2">
              Featured Article
            </h2>

            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <img
                src={featured.image_url || "https://picsum.photos/800/400"}
                onError={(e) =>
                  (e.target.src = "https://picsum.photos/800/400")
                }
                alt={featured.title}
                className="w-full h-80 object-cover"
              />

              <div className="p-6">
                <h3 className="text-2xl font-bold text-dark">
                  {featured.title}
                </h3>

                <p className="text-gray-600 mt-2">
                  {featured.excerpt}
                </p>

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(featured.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 📰 NEWS */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark border-l-4 border-primary pl-2">
              Latest News
            </h2>

            <Link to="/news" className="text-secondary text-sm hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white p-4 rounded-xl shadow-card hover:shadow-md transition"
              >
                <h4 className="font-semibold text-dark">
                  {article.title}
                </h4>

                <p className="text-sm text-gray-500 mt-2">
                  {article.excerpt}
                </p>

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 🎯 SECTIONS */}
        <section className="grid md:grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-lg text-dark">Events</h3>
            <p className="text-gray-500 text-sm mt-2">
              Upcoming campus events and activities.
            </p>
            <Link to="/events" className="text-secondary text-sm mt-3 inline-block">
              View events →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-lg text-dark">Announcements</h3>
            <p className="text-gray-500 text-sm mt-2">
              Official announcements from the campus.
            </p>
            <Link to="/announcements" className="text-secondary text-sm mt-3 inline-block">
              View →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="font-bold text-lg text-dark">Contact</h3>
            <p className="text-gray-500 text-sm mt-2">
              Reach out to our editorial team.
            </p>
            <Link to="/contact" className="text-secondary text-sm mt-3 inline-block">
              Contact →
            </Link>
          </div>

        </section>

        {/* 🏫 ABOUT */}
        <section className="mt-12 bg-white p-6 rounded-xl shadow-card">
          <h3 className="text-lg font-bold text-dark mb-2 border-l-4 border-primary pl-2">
            About The Binary Bulletin
          </h3>

          <p className="text-gray-600 text-sm">
            The Binary Bulletin is the official campus publication of AMA Computer College Lipa,
            delivering reliable news, features, and student-driven content.
          </p>

          <Link to="/about" className="text-secondary text-sm mt-3 inline-block">
            Learn more →
          </Link>
        </section>

      </div>

      <Footer />
    </div>
  );
}