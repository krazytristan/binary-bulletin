import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("SUPABASE DATA:", data);
      console.log("SUPABASE ERROR:", error);

      if (error) throw error;

      setArticles(data || []);
    } catch (err) {
      console.error("FETCH ERROR:", err.message);
      setErrorMsg(err.message || "Failed to load articles");
      setArticles([]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔷 HEADER */}
      <div className="bg-blue-900 text-white py-10 text-center">
        <h1 className="text-4xl font-bold">
          The Binary Bulletin
        </h1>
        <p className="text-sm mt-2 opacity-80">
          AMA Computer College Lipa Campus
        </p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* ⏳ LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading articles...
          </p>
        )}

        {/* ❌ ERROR */}
        {!loading && errorMsg && (
          <p className="text-center text-red-500 font-semibold">
            {errorMsg}
          </p>
        )}

        {/* 📰 ARTICLES */}
        {!loading && !errorMsg && (
          <>
            {articles.length === 0 ? (
              <p className="text-center text-gray-500">
                No articles yet. Add one in admin panel or database.
              </p>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
                  >
                    {/* IMAGE */}
                    <img
                      src={
                        article.image_url ||
                        "https://via.placeholder.com/400x200"
                      }
                      alt={article.title}
                      className="h-48 w-full object-cover"
                    />

                    {/* CONTENT */}
                    <div className="p-4">
                      <h2 className="text-lg font-bold line-clamp-2">
                        {article.title}
                      </h2>

                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {article.excerpt || "No description available."}
                      </p>

                      <p className="text-xs text-gray-400 mt-3">
                        {article.created_at
                          ? new Date(article.created_at).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}