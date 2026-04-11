import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  Newspaper, 
  Hash, 
  RefreshCcw,
  ChevronUp
} from "lucide-react";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetchArticles();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching articles:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const searchRegex = new RegExp(search, "gi");
    return articles.filter((a) => {
      const matchesSearch = !search || a.title?.match(searchRegex) || a.excerpt?.match(searchRegex);
      const matchesCategory = category === "All" || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, category]);

  const trending = useMemo(() => articles.slice(0, 5), [articles]);

  const getImage = (article) => {
    const fallback = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000";
    if (!article?.image_url) return fallback;
    const cacheBuster = new Date(article.updated_at || article.created_at).getTime();
    return `${article.image_url}?t=${cacheBuster}`;
  };

  const SkeletonCard = () => (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-[16/10] rounded-2xl mb-5 bg-gray-200"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-dark font-sans selection:bg-accent/30 overflow-x-hidden">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER */}
      <section className="bg-primary text-white pt-28 pb-12 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[9rem] md:text-[15rem] leading-none -bottom-5 md:-bottom-10 -left-5 md:-left-10">
          ARCHIVE
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <span className="bg-accent text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                The Binary Bulletin
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                Digital <br /> Journalism
              </h1>
            </div>
            <div className="max-w-xs border-l-2 border-accent pl-6 py-2">
              <p className="text-white/70 font-medium text-xs md:text-sm leading-relaxed">
                Exploring the intersection of campus life, technology, and student perspectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-[40] bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search archives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/10 font-bold text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar pb-1 lg:pb-0 touch-pan-x">
            <Filter size={16} className="text-primary flex-shrink-0 mr-1" />
            {["All", "News", "Sports", "Opinion", "Feature", "Editorial", "Literary"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-90 flex-shrink-0 ${
                  category === cat 
                  ? "bg-dark text-white shadow-lg shadow-dark/20" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-10 lg:gap-16 mt-10 mb-20">
        
        {/* 📰 MAIN FEED (FIRST ON MOBILE) */}
        <div className="lg:col-span-8 order-1">
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-12">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 px-6">
              <Newspaper size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-black uppercase italic">No articles found</h3>
              <button 
                onClick={() => {setSearch(""); setCategory("All")}}
                className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-dark text-white px-8 py-4 rounded-full"
              >
                <RefreshCcw size={14} /> Reset Feed
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-14">
              {filtered.map((article) => (
                <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] mb-6 shadow-sm bg-gray-100">
                    <img
                      src={getImage(article)}
                      alt={article.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-5 left-5 bg-primary text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter">
                      {article.category || "General"}
                    </div>
                  </div>
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <Calendar size={12} className="text-accent" />
                      {new Date(article.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <h2 className="text-2xl font-black leading-tight tracking-tighter group-hover:text-primary transition-colors line-clamp-2 italic">
                      {article.title}
                    </h2>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed">
                      {article.excerpt || "Dive into this story from our digital journalism archives."}
                    </p>
                    <div className="pt-2 flex items-center text-[11px] font-black uppercase tracking-widest text-primary group-hover:translate-x-2 transition-transform">
                      Read Story <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 🔥 SIDEBAR (SECOND ON MOBILE) */}
        <aside className="lg:col-span-4 space-y-10 order-2">
          {/* Trending Card */}
          <div className="bg-dark text-white rounded-[2.5rem] p-8 lg:sticky lg:top-32 shadow-2xl overflow-hidden">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-10 italic border-b border-white/10 pb-4">
              <TrendingUp className="text-accent" size={20} /> Most Read
            </h3>
            <div className="space-y-10">
              {trending.map((t, i) => (
                <Link key={t.id} to={`/article/${t.id}`} className="flex gap-5 group items-start">
                  <span className="text-4xl font-black text-white/5 group-hover:text-accent transition-colors leading-none">
                    0{i + 1}
                  </span>
                  <div>
                    <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em] block mb-2">{t.category}</span>
                    <h4 className="text-sm font-bold leading-tight group-hover:text-accent transition-colors">{t.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="p-8 border-2 border-dark rounded-[2.5rem] bg-white shadow-sm">
             <h3 className="font-black text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
               <Hash size={18} className="text-primary" /> Topics
             </h3>
             <div className="flex flex-wrap gap-2">
                {["ICT", "Titans", "Lipa City", "AI", "Enrollment", "Campus"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="text-[10px] font-black border-2 border-gray-100 px-4 py-2 rounded-full hover:bg-dark hover:text-white transition-all"
                  >
                    #{tag}
                  </button>
                ))}
             </div>
          </div>
        </aside>
      </main>

      {/* Floating Scroll Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-50 bg-primary text-white p-4 rounded-full shadow-2xl transition-all duration-500 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <ChevronUp size={24} />
      </button>

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}