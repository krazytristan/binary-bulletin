import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FileText, Calendar, Megaphone, Mail, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ articles: 0, events: 0, announcements: 0, messages: 0 });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentArticles()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchStats = async () => {
    const fetchCount = async (table) => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return count || 0;
    };
    const [art, eve, ann, msg] = await Promise.all([
      fetchCount("articles"), fetchCount("events"), fetchCount("announcements"), fetchCount("messages")
    ]);
    setStats({ articles: art, events: eve, announcements: ann, messages: msg });
  };

  const fetchRecentArticles = async () => {
    const { data } = await supabase.from("articles").select("id, title, created_at").order("created_at", { ascending: false }).limit(5);
    setRecentArticles(data || []);
  };

  const statCards = [
    { label: "Archives", value: stats.articles, icon: <FileText size={18}/> },
    { label: "Registry", value: stats.events, icon: <Calendar size={18}/> },
    { label: "Bulletins", value: stats.announcements, icon: <Megaphone size={18}/> },
    { label: "Letters", value: stats.messages, icon: <Mail size={18}/> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b-2 border-black pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tighter mb-2">Morning Brief</h1>
          <p className="font-serif italic text-gray-600">The current state of the publication.</p>
        </div>
        <Link to="/admin-panel/articles" className="bg-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
          File New Dispatch
        </Link>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-gray-300 p-6 hover:border-black transition-colors">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</span>
              <div className="text-black">{stat.icon}</div>
            </div>
            {loading ? (
              <div className="h-10 w-16 bg-gray-200 animate-pulse" />
            ) : (
              <div className="text-4xl font-serif font-black">{stat.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* RECENT CONTENT */}
        <div className="lg:col-span-2 bg-white border border-gray-300">
          <div className="p-6 border-b border-gray-300 flex justify-between items-center bg-gray-50">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-black">Latest Archives</h2>
            <Link to="/admin-panel/articles" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black">View All</Link>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 text-center font-serif italic text-gray-500">Loading records...</div>
            ) : recentArticles.length === 0 ? (
              <div className="p-12 text-center font-serif italic text-gray-500">No archives filed yet.</div>
            ) : (
              recentArticles.map((article) => (
                <div key={article.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition group">
                  <div>
                    <h3 className="font-serif font-black text-lg mb-1 group-hover:underline decoration-1 underline-offset-2">{article.title}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/admin-panel/articles`} className="p-2 border border-gray-300 text-gray-400 hover:border-black hover:text-black transition-colors">
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="space-y-6">
          <div className="bg-black text-white p-8">
            <h3 className="font-serif font-black text-2xl uppercase mb-4">Editorial Guidelines</h3>
            <p className="font-serif italic text-gray-400 mb-6">Review the latest standards for publishing to the campus network.</p>
            <button className="w-full border border-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
              Read Manifesto
            </button>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-6">System Status</h3>
            <div className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Database Uplink</span>
                <span className="flex items-center gap-2 text-black">
                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Storage Archive</span>
                <span className="text-black">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}