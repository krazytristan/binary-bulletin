import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [trending, setTrending] = useState([]); // ✅ NEW
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [search, articles, category]);

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
      setTrending(data.slice(0, 6)); // ✅ trending list
    }

    setLoading(false);
  };

  // 🔍 FILTER
  const handleSearch = () => {
    let result = articles;

    if (category !== "All") {
      result = result.filter((a) => a.category === category);
    }

    if (search) {
      result = result.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  };

  // 🖼 IMAGE
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

      {/* 🔥 MAIN LAYOUT WITH SIDEBAR */}
      <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-4 gap-6">

        {/* 📰 MAIN CONTENT */}
        <div className="md:col-span-3">

          {/* 🔍 SEARCH + FILTER */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">

            <input
              type="text"
              placeholder="Search news..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option>All</option>
              <option>News</option>
              <option>Sports</option>
              <option>Opinion</option>
              <option>Feature</option>
              <option>Editorial</option>
              <option>Literary</option>
            </select>

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {filtered.map((article) => (
                <Link key={article.id} to={`/article/${article.id}`}>

                  <div className="bg-white rounded-2xl shadow-card hover:shadow-xl transition overflow-hidden group flex flex-col h-full">

                    <div className="overflow-hidden">
                      <img
                        src={getImage(article)}
                        alt={article.title}
                        className="h-48 w-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    </div>

                    <div className="p-4 flex flex-col flex-grow">

                      <span className="text-xs text-secondary font-semibold mb-1">
                        {article.category || "News"}
                      </span>

                      <h2 className="text-lg font-semibold text-dark line-clamp-2 group-hover:text-primary">
                        {article.title}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2 line-clamp-3 flex-grow">
                        {article.excerpt || "No description available."}
                      </p>

                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                        <span className="text-secondary text-sm">
                          Read →
                        </span>
                      </div>

                    </div>

                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>

        {/* 🔥 TRENDING SIDEBAR */}
        <div className="bg-white rounded-xl shadow p-4 h-fit">

          <h3 className="font-bold mb-4 text-dark">
            🔥 Trending
          </h3>

          <div className="space-y-4">

            {trending.map((t) => (
              <Link key={t.id} to={`/article/${t.id}`}>

                <div className="flex gap-3 group">

                  {/* IMAGE */}
                  <img
                    src={getImage(t)}
                    className="w-16 h-16 object-cover rounded-md"
                  />

                  {/* TEXT */}
                  <div className="flex-1">

                    <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary">
                      {t.title}
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {t.excerpt}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>

                  </div>

                </div>

              </Link>
            ))}

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}