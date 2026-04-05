import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ArticleView() {
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setError("Article not found.");
    } else {
      setArticle(data);
    }

    setLoading(false);
  };

  // 🔥 IMAGE HANDLER
  const getImage = (url) => {
    if (!url) return "https://picsum.photos/800/400";
    return url;
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      <div className="max-w-4xl mx-auto p-6">

        {/* 🔙 BACK */}
        <Link
          to="/news"
          className="text-secondary text-sm hover:underline"
        >
          ← Back to News
        </Link>

        {/* ⏳ LOADING */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* ❌ ERROR */}
        {!loading && error && (
          <p className="text-center text-red-500 mt-10">
            {error}
          </p>
        )}

        {/* 📄 ARTICLE */}
        {!loading && article && (
          <article className="mt-6 bg-white rounded-xl shadow-card overflow-hidden">

            {/* IMAGE */}
            <img
              src={getImage(article.image_url)}
              alt={article.title}
              className="w-full h-80 object-cover"
            />

            <div className="p-6">

              {/* TITLE */}
              <h1 className="text-2xl md:text-3xl font-bold text-dark">
                {article.title}
              </h1>

              {/* DATE */}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(article.created_at).toLocaleDateString()}
              </p>

              {/* EXCERPT */}
              {article.excerpt && (
                <p className="mt-4 text-gray-600 italic">
                  {article.excerpt}
                </p>
              )}

              {/* CONTENT */}
              <div className="mt-6 text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
                {article.content || "No content available."}
              </div>

            </div>

          </article>
        )}

      </div>

      <Footer />
    </div>
  );
}