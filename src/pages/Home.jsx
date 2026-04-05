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

    if (!error && data && data.length > 0) {
      setFeatured(data[0]);
      setArticles(data);
    }

    setLoading(false);
  };

  // 🖼 IMAGE HANDLER (FIX CACHE)
  const getImage = (article) => {
    if (!article?.image_url) return "https://picsum.photos/400/200";

    const t = new Date(
      article.updated_at || article.created_at
    ).getTime();

    return `${article.image_url}?t=${t}`;
  };

  // 🔥 CATEGORY FILTER
  const getCategory = (cat) =>
    articles.filter((a) => a.category === cat).slice(0, 4);

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HERO */}
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
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 🌟 FEATURED */}
        {!loading && featured && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-dark mb-4 border-l-4 border-primary pl-2">
              Featured Article
            </h2>

            <Link to={`/article/${featured.id}`}>
              <div className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition">

                <img
                  src={getImage(featured)}
                  alt={featured.title}
                  className="w-full h-80 object-cover"
                />

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-dark">
                    {featured.title}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    {featured.excerpt || "No description available."}
                  </p>

                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(featured.created_at).toLocaleDateString()}
                  </p>

                  <span className="inline-block mt-3 text-secondary text-sm font-medium">
                    Read more →
                  </span>
                </div>

              </div>
            </Link>
          </section>
        )}

        {/* 📰 LATEST NEWS (UNCHANGED) */}
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

            {articles.slice(1, 4).map((article) => (
              <Link key={article.id} to={`/article/${article.id}`}>

                <div className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition">

                  <img
                    src={getImage(article)}
                    alt={article.title}
                    className="h-40 w-full object-cover"
                  />

                  <div className="p-4">
                    <h4 className="font-semibold text-dark line-clamp-2">
                      {article.title}
                    </h4>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                      {article.excerpt || "No description available."}
                    </p>

                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>

                </div>

              </Link>
            ))}

          </div>

        </section>

        {/* 🆕 CATEGORIES (2 COLUMN ONLY THIS PART) */}
        <section className="mb-12 grid md:grid-cols-2 gap-8">

          {/* 🏀 SPORTS */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-primary pl-2 mb-4">
              Sports
            </h2>

            {getCategory("Sports").map((a) => (
              <Link key={a.id} to={`/article/${a.id}`}>
                <div className="flex gap-3 bg-white p-3 rounded-xl shadow-card mb-3">
                  <img src={getImage(a)} className="w-20 h-16 object-cover rounded"/>
                  <p className="text-sm font-semibold">{a.title}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 💬 OPINION */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-primary pl-2 mb-4">
              Opinion
            </h2>

            {getCategory("Opinion").map((a) => (
              <Link key={a.id} to={`/article/${a.id}`}>
                <div className="bg-white p-3 rounded-xl shadow-card mb-3">
                  <p className="text-sm font-semibold">{a.title}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ✨ FEATURE */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-primary pl-2 mb-4">
              Feature
            </h2>

            {getCategory("Feature").map((a) => (
              <Link key={a.id} to={`/article/${a.id}`}>
                <div className="flex gap-3 bg-white p-3 rounded-xl shadow-card mb-3">
                  <img src={getImage(a)} className="w-20 h-16 object-cover rounded"/>
                  <p className="text-sm font-semibold">{a.title}</p>
                </div>
              </Link>
            ))}
          </div>

        </section>

        {/* 🎯 QUICK SECTIONS (UNCHANGED) */}
        <section className="grid md:grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-md transition">
            <h3 className="font-bold text-lg text-dark">Events</h3>
            <p className="text-gray-500 text-sm mt-2">
              Stay updated with upcoming campus activities and programs.
            </p>
            <Link to="/events" className="text-secondary text-sm mt-3 inline-block">
              View events →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-md transition">
            <h3 className="font-bold text-lg text-dark">Announcements</h3>
            <p className="text-gray-500 text-sm mt-2">
              Official announcements and important updates.
            </p>
            <Link to="/announcements" className="text-secondary text-sm mt-3 inline-block">
              View →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card hover:shadow-md transition">
            <h3 className="font-bold text-lg text-dark">Contact</h3>
            <p className="text-gray-500 text-sm mt-2">
              Connect with our editorial team and staff.
            </p>
            <Link to="/contact" className="text-secondary text-sm mt-3 inline-block">
              Contact →
            </Link>
          </div>

        </section>

        {/* 🏫 ABOUT (UNCHANGED) */}
        <section className="mt-12 bg-white p-6 rounded-xl shadow-card">
          <h3 className="text-lg font-bold text-dark mb-2 border-l-4 border-primary pl-2">
            About The Binary Bulletin
          </h3>

          <p className="text-gray-600 text-sm">
            The Binary Bulletin is the official campus publication of AMA Computer College Lipa,
            delivering reliable campus news, feature stories, and student-driven content.
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