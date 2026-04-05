import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    articles: 0,
    events: 0,
    announcements: 0,
    messages: 0,
  });

  const [recentArticles, setRecentArticles] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentArticles();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: articles } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true });

      const { count: events } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      const { count: announcements } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true });

      const { count: messages } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

      setStats({
        articles: articles || 0,
        events: events || 0,
        announcements: announcements || 0,
        messages: messages || 0,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecentArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentArticles(data || []);
  };

  return (
    <div className="p-4 md:p-6">

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Articles</h3>
          <p className="text-2xl font-bold text-primary">{stats.articles}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Events</h3>
          <p className="text-2xl font-bold text-primary">{stats.events}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Announcements</h3>
          <p className="text-2xl font-bold text-primary">{stats.announcements}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-sm text-gray-500">Messages</h3>
          <p className="text-2xl font-bold text-primary">{stats.messages}</p>
        </div>

      </div>

      {/* RECENT */}
      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-lg font-bold mb-4">
          Recent Articles
        </h2>

        {recentArticles.length === 0 ? (
          <p className="text-gray-500 text-sm">No articles yet.</p>
        ) : (
          <div className="space-y-4">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="border-b pb-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>

                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  Article
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}