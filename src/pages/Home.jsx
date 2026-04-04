// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    setArticles(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-primary mb-6">
        The Binary Bulletin
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div key={article.id} className="bg-white shadow rounded-xl p-4">
            <img
              src={article.image_url}
              className="h-40 w-full object-cover rounded"
            />
            <h2 className="text-xl font-semibold mt-3">
              {article.title}
            </h2>
            <p className="text-sm text-gray-500">
              {article.category}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}