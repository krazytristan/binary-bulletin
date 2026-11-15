import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Search, ChevronUp, Newspaper } from "lucide-react";
import {
  PUBLICATION,
  formatDate,
  cleanEditorialText,
  isMetadataTagExcerpt,
} from "../utils/editorial";

const CATEGORIES = [
  "All",
  "News",
  "Feature",
  "Opinion",
  "Editorial",
  "Sports",
  "Literary",
  "Official Notice",
];

export default function News() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    document.title = `News & Archive | ${PUBLICATION.name}`;
    fetchArticles();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const [artRes, annRes] = await Promise.all([
        supabase.from("articles").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      ]);
      if (artRes.error) throw artRes.error;

      const normalizedArticles = (artRes.data || []).map((item) => ({
        ...item,
        sourceType: "article",
        category: item.category || "News",
      }));

      const normalizedAnnouncements = (annRes.data || []).map((item) => ({
        ...item,
        sourceType: "announcement",
        category: "Official Notice",
        author_name: item.author_name || "Campus Administration",
      }));

      const allArticles = [...normalizedArticles, ...normalizedAnnouncements].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setArticles(allArticles);
    } catch (err) {
      console.error("Error fetching articles:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesSearch =
        !term ||
        a.title?.toLowerCase().includes(term) ||
        a.excerpt?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term);
      const matchesCategory = category === "All" || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, category]);

  const latest = useMemo(() => {
    return (
      filtered.find((a) => a.sourceType === "article" && a.image_url) ||
      filtered[0]
    );
  }, [filtered]);

  const getSummary = (item) => {
    if (!item) return "";
    if (item.excerpt && !isMetadataTagExcerpt(item.excerpt)) {
      return cleanEditorialText(item.excerpt);
    }
    return cleanEditorialText(item.content || "");
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-1 w-full">
        {/* --- HEADER --- */}
        <header className="mb-8 md:mb-12 border-b-[3px] border-blue-900 pb-6 md:pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
            Campus Reporting &amp; Dispatches
          </p>
          <h1 className="text-4xl md:text-7xl font-serif font-black uppercase tracking-tighter mb-6 text-blue-900">
            News &amp; Archive
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-2 whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors shrink-0 pb-1 ${
                    category === cat
                      ? "text-red-900 border-b-2 border-red-900"
                      : "text-gray-500 hover:text-blue-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors"
                size={15}
              />
              <input
                type="text"
                aria-label="Search news and archive"
                placeholder="Search archive..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-xs font-medium outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-[360px] bg-gray-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* --- LEAD STORY (DESKTOP ONLY) --- */}
            {latest && !search && category === "All" && (
              <article className="hidden lg:grid grid-cols-2 gap-8 border-b-2 border-gray-200 pb-12 group">
                <Link
                  to={`/article/${latest.id}`}
                  className="aspect-[16/10] overflow-hidden bg-gray-100 border border-gray-300 relative"
                >
                  {latest.image_url ? (
                    <img
                      src={latest.image_url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={latest.title}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/70">
                      <Newspaper size={36} className="text-blue-900/40 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-900/60">
                        {latest.category}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 bg-amber-400 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-blue-950">
                    Featured Story
                  </div>
                </Link>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span className="text-white bg-red-900 px-2.5 py-0.5">
                      {latest.category}
                    </span>
                    <span className="text-amber-800">{formatDate(latest.created_at)}</span>
                  </div>
                  <Link to={`/article/${latest.id}`}>
                    <h2 className="text-3xl md:text-4xl font-serif font-black leading-tight mb-4 group-hover:text-red-900 transition-colors text-gray-900">
                      {cleanEditorialText(latest.title)}
                    </h2>
                  </Link>
                  <p className="text-base text-gray-700 font-serif leading-relaxed mb-6 line-clamp-4">
                    {getSummary(latest)}
                  </p>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    By{" "}
                    <span className="text-blue-900">
                      {latest.author_name || "Editorial Staff"}
                    </span>
                  </div>
                </div>
              </article>
            )}

            {/* --- GRID (ALL DEVICES) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filtered.map((a) => {
                const isLeadDesktop =
                  latest && a.id === latest.id && !search && category === "All";
                return (
                  <article
                    key={a.id}
                    className={`group flex flex-col ${isLeadDesktop ? "lg:hidden" : ""}`}
                  >
                    <Link
                      to={`/article/${a.id}`}
                      className="block aspect-[4/3] overflow-hidden bg-gray-100 border border-gray-300 mb-4 group-hover:border-blue-900 transition-colors"
                    >
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          alt={a.title}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/70 p-6 text-center">
                          <Newspaper size={28} className="text-blue-900/40 mb-2" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-900/60">
                            {a.category}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center justify-between mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <span className="text-red-900">{a.category}</span>
                      <span className="text-amber-800">{formatDate(a.created_at)}</span>
                    </div>
                    <Link to={`/article/${a.id}`}>
                      <h3 className="text-xl font-serif font-black leading-snug mb-2 group-hover:text-red-900 transition-colors text-gray-900">
                        {cleanEditorialText(a.title)}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 font-serif line-clamp-3 mb-3 leading-relaxed flex-1">
                      {getSummary(a)}
                    </p>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      By{" "}
                      <span className="text-blue-900">
                        {a.author_name || "Editorial Staff"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 border border-gray-200 bg-white">
                <p className="text-base font-serif text-gray-500 italic">
                  No articles or notices matched your filter criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <button
        type="button"
        aria-label="Scroll back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 z-50 bg-blue-900 border-2 border-blue-950 text-white p-3 shadow-lg hover:bg-amber-400 hover:text-blue-950 hover:border-amber-400 transition-all duration-300 ${
          showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUp size={16} />
      </button>

      <Footer />
    </div>
  );
}
