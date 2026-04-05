import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

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

  // 🔥 FETCH ARTICLES
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

  // 🔍 SEARCH
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

  // 🖼 IMAGE HANDLER (WITH CACHE FIX)
  const getImage = (article) => {
    if (!article.image_url) return "https://picsum.photos/400/200";

    const timestamp = new Date(
      article.updated_at || article.created_at
    ).getTime();

    return `${article.image_url}?t=${timestamp}`;
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
        <div className="mb-6 flex justify-between items-center flex-wrap gap-3">

          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          />

          <p className="text-sm text-gray-400">
            {filtered.length} article(s)
          </p>

        </div>

        {/* ⏳ LOADING */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* ❌ EMPTY */}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-500">
            No articles found.
          </p>
        )}

        {/* 📰 ARTICLES */}
        {!loading && filtered.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">

            {filtered.map((article) => (
              <Link key={article.id} to={`/article/${article.id}`}>

                <div className="bg-white rounded-2xl shadow-card hover:shadow-lg transition overflow-hidden group cursor-pointer">

                  {/* IMAGE */}
                  <img
                    src={getImage(article)}
                    alt={article.title}
                    className="h-48 w-full object-cover group-hover:scale-105 transition"
                  />

                  {/* CONTENT */}
                  <div className="p-4">

                    <h2 className="text-lg font-semibold text-dark line-clamp-2 group-hover:text-primary transition">
                      {article.title}
                    </h2>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                      {article.excerpt || "No description available."}
                    </p>

                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>

                    <span className="inline-block mt-3 text-secondary text-sm font-medium">
                      Read more →
                    </span>

                  </div>

                </div>

              </Link>
            ))}

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}