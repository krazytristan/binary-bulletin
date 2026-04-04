import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [search, articles]);

  const fetchArticles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
      setFiltered(data);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    if (!search) {
      setFiltered(articles);
    } else {
      const result = articles.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      );
      setFiltered(result);
    }
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HEADER */}
      <section className="bg-primary text-white py-14 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          News & Articles
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Stay updated with the latest campus news
        </p>
      </section>

      <div className="max-w-7xl mx-auto p-6">

        {/* 🔍 SEARCH */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {/* ⏳ LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading articles...
          </p>
        )}

        {/* ❌ EMPTY */}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-500">
            No articles found.
          </p>
        )}

        {/* 📰 ARTICLES */}
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-2xl shadow-card hover:shadow-lg transition overflow-hidden"
            >
              {/* IMAGE */}
              <img
                src={article.image_url || "https://picsum.photos/400/200"}
                onError={(e) =>
                  (e.target.src = "https://picsum.photos/400/200")
                }
                alt={article.title}
                className="h-48 w-full object-cover"
              />

              {/* CONTENT */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-dark line-clamp-2">
                  {article.title}
                </h2>

                <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                  {article.excerpt || "No description available."}
                </p>

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      <Footer />
    </div>
  );
}