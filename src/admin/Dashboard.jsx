import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FileText, Calendar, Megaphone, Mail, ArrowUpRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/editorial";

export default function Dashboard() {
  const [stats, setStats] = useState({ articles: 0, events: 0, announcements: 0, messages: 0 });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

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
      fetchCount("articles"),
      fetchCount("events"),
      fetchCount("announcements"),
      fetchCount("messages"),
    ]);
    setStats({ articles: art, events: eve, announcements: ann, messages: msg });
  };

  const fetchRecentArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentArticles(data || []);
  };

  const statCards = [
    { label: "Published Articles", value: stats.articles, icon: <FileText size={18} /> },
    { label: "Campus Events", value: stats.events, icon: <Calendar size={18} /> },
    { label: "Announcements", value: stats.announcements, icon: <Megaphone size={18} /> },
    { label: "Reader Letters", value: stats.messages, icon: <Mail size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b-2 border-blue-900 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tighter mb-2">
            Editorial Desk
          </h1>
          <p className="font-serif italic text-gray-600">
            Publication overview for The Binary Bulletin &mdash; AMA Computer College Lipa Campus.
          </p>
        </div>
        <Link
          to="/admin-panel/articles"
          className="bg-blue-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors"
        >
          Publish New Article
        </Link>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-gray-300 p-6 hover:border-red-900 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                {stat.label}
              </span>
              <div className="text-blue-900">{stat.icon}</div>
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-900">
              Latest Articles
            </h2>
            <Link
              to="/admin-panel/articles"
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-900"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 text-center font-serif italic text-gray-500">
                Loading publication records...
              </div>
            ) : recentArticles.length === 0 ? (
              <div className="p-12 text-center font-serif italic text-gray-500">
                No articles published yet.
              </div>
            ) : (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-6 flex justify-between items-center hover:bg-gray-50 transition group"
                >
                  <div>
                    <h3 className="font-serif font-black text-lg mb-1 group-hover:underline decoration-1 underline-offset-2">
                      {article.title}
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      {formatDate(article.created_at)}
                    </p>
                  </div>
                  <Link
                    to="/admin-panel/articles"
                    aria-label={`Manage ${article.title}`}
                    className="p-2 border border-gray-300 text-gray-400 hover:border-red-900 hover:text-red-900 transition-colors"
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EDITORIAL GUIDELINES & STATUS */}
        <div className="space-y-6">
          <div className="bg-blue-900 text-white p-8">
            <h3 className="font-serif font-black text-2xl uppercase mb-4">
              Editorial Guidelines
            </h3>
            <p className="font-serif italic text-blue-100 mb-6 leading-relaxed">
              Review house style, attribution rules, and verification standards before publishing to the campus network.
            </p>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="w-full border border-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-blue-900 transition-colors"
            >
              Read Style Guide
            </button>
          </div>

          <div className="bg-white border border-gray-300 p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-6">
              System Status
            </h3>
            <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Database Uplink</span>
                <span className="flex items-center gap-2 text-blue-900">
                  <span className="w-2 h-2 bg-blue-900 rounded-full animate-pulse"></span> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Media Storage</span>
                <span className="text-blue-900">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDITORIAL STYLE GUIDE MODAL */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-50 bg-blue-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="bg-white border-4 border-blue-900 max-w-2xl w-full p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b-2 border-blue-900 pb-4 mb-6">
              <h2 className="font-serif font-black text-2xl text-blue-900 uppercase">
                Editorial Style Checklist
              </h2>
              <button
                type="button"
                aria-label="Close style guide"
                onClick={() => setGuideOpen(false)}
                className="p-1 text-gray-500 hover:text-red-900"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-4 font-serif text-gray-700 leading-relaxed text-sm md:text-base">
              <li>
                <strong className="text-blue-900">1. Headlines &amp; Decks:</strong> Keep headlines concise, informative, and free of all-caps shouting. Write a 1–2 sentence lead summary in the Excerpt field (do not enter category/date tags as the excerpt).
              </li>
              <li>
                <strong className="text-blue-900">2. Institutional Naming:</strong> Always refer to the institution as <em>AMA Computer College Lipa Campus</em> (or <em>AMA Lipa</em> on second reference) and the publication as <em>The Binary Bulletin</em>.
              </li>
              <li>
                <strong className="text-blue-900">3. Bylines &amp; Attribution:</strong> Credit the actual student writer or contributor instead of leaving generic placeholders. Verify all names, dates, venues, and statistics before publishing.
              </li>
              <li>
                <strong className="text-blue-900">4. Formatting:</strong> Use <code>## Subheading</code> for section headers in article bodies. Avoid social-media hashtags, excessive emojis, or raw signature blocks at the end of copy.
              </li>
              <li>
                <strong className="text-blue-900">5. Tone Separation:</strong> Maintain a neutral, factual, third-person tone in News reports and Announcements; preserve reasoned voice in Opinion, Editorial, and Literary pieces.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
