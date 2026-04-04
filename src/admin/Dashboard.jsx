// src/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase.from("articles").select("*");
    setArticles(data);
  };

  const addArticle = async () => {
    await supabase.from("articles").insert([{ title }]);
    setTitle("");
    fetchArticles();
  };

  const deleteArticle = async (id) => {
    await supabase.from("articles").delete().eq("id", id);
    fetchArticles();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="my-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 flex-1"
          placeholder="Article title"
        />
        <button
          onClick={addArticle}
          className="bg-green-600 text-white px-4 rounded"
        >
          Add
        </button>
      </div>

      {articles.map((a) => (
        <div key={a.id} className="flex justify-between border p-3 mb-2">
          {a.title}
          <button
            onClick={() => deleteArticle(a.id)}
            className="text-red-500"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}