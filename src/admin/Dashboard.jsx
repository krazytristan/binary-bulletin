import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  FileText, 
  Calendar, 
  Megaphone, 
  Mail, 
  ArrowUpRight, 
  PlusCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    articles: 0,
    events: 0,
    announcements: 0,
    messages: 0,
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchStats(), fetchRecentArticles()]);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const fetchStats = async () => {
    const fetchCount = (table) => 
      supabase.from(table).select("*", { count: "exact", head: true });

    const [art, eve, ann, msg] = await Promise.all([
      fetchCount("articles"),
      fetchCount("events"),
      fetchCount("announcements"),
      fetchCount("contacts"),
    ]);

    setStats({
      articles: art.count || 0,
      events: eve.count || 0,
      announcements: ann.count || 0,
      messages: msg.count || 0,
    });
  };

  const fetchRecentArticles = async () => {
    const { data, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (fetchError) throw fetchError;
    setRecentArticles(data || []);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const statCards = [
    { label: "Articles", value: stats.articles, icon: <FileText size={20}/>, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Events", value: stats.events, icon: <Calendar size={20}/>, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Announcements", value: stats.announcements, icon: <Megaphone size={20}/>, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Messages", value: stats.messages, icon: <Mail size={20}/>, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500">Here's what's happening with Binary Bulletin today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/announcements" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle size={16} /> New Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded" /> : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* RECENT ARTICLES TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Recent Content
            </h2>
            <Link to="/admin/news" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
          </div>

          <div className="min-h-[300px]">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentArticles.length === 0 ? (
              <div className="p-20 text-center">
                <FileText className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 text-sm">No articles published yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentArticles.map((article) => (
                  <div key={article.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition group">
                    <div className="flex gap-4 items-center overflow-hidden">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold uppercase text-xs">
                        {article.title?.charAt(0) || "T"}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-gray-800 text-sm truncate">{article.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(article.created_at)}</p>
                      </div>
                    </div>
                    <Link to={`/admin/news/edit/${article.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2 text-white">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">Check the documentation for managing roles and permissions.</p>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-bold transition">
                Read Docs
              </button>
            </div>
            <Megaphone className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 -rotate-12 group-hover:scale-110 transition-transform" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Supabase API</span>
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Storage Bucket</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}