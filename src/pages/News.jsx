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
  ChevronUp,
  Clock,
  User
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
      <div className="aspect-[16/10] rounded-xl mb-5 bg-gray-200"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-secondary/20 overflow-x-hidden">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER (NO TOUCH) */}
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
      <div className="sticky top-0 z-[40] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search news, topics, or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/5 focus:border-primary outline-none font-medium text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar pb-1 lg:pb-0 touch-pan-x">
            <Filter size={16} className="text-gray-400 flex-shrink-0 mr-1" />
            {["All", "News", "Sports", "Opinion", "Feature", "Editorial", "Literary"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  category === cat 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-white text-gray-500 border border-gray-200 hover:border-primary/30 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-12 gap-12 mt-12 mb-20">
        
        {/* 📰 MAIN FEED */}
        <div className="lg:col-span-8 order-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Newspaper size={18} /> Latest Stories
            </h2>
            <p className="text-gray-400 text-[11px] font-medium">{filtered.length} articles available</p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 px-6">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Search size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-2">No results for "{search}"</h3>
              <p className="text-gray-500 text-sm mb-8">Try adjusting your filters or search keywords.</p>
              <button 
                onClick={() => {setSearch(""); setCategory("All")}}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest bg-primary text-white px-8 py-4 rounded-lg hover:bg-secondary transition-colors"
              >
                <RefreshCcw size={14} /> Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-12">
              {filtered.map((article) => (
                <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col bg-white rounded-xl overflow-hidden border border-transparent hover:border-gray-100 hover:shadow-card transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={getImage(article)}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-primary text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        {article.category || "General"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-grow space-y-3">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-secondary" /> {new Date(article.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h2 className="text-xl font-bold leading-snug text-dark group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-500 text-sm line-clamp-3 font-medium leading-relaxed">
                      {article.excerpt || "Dive into this story from our digital journalism archives."}
                    </p>
                    <div className="pt-4 flex items-center text-[11px] font-bold uppercase tracking-widest text-primary border-t border-gray-50 group-hover:gap-4 gap-2 transition-all">
                      Read Article <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 🔥 SIDEBAR */}
        <aside className="lg:col-span-4 space-y-8 order-2">
          {/* Trending Section Updated */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-8 text-dark">
              <TrendingUp className="text-secondary" size={16} /> Most Popular
            </h3>
            <div className="space-y-10">
              {trending.map((t, i) => (
                <Link key={t.id} to={`/article/${t.id}`} className="block group">
                  <div className="flex gap-4 items-start mb-4">
                    <span className="text-2xl font-black text-gray-100 group-hover:text-secondary transition-colors w-6 leading-none">
                      {i + 1}
                    </span>
                    <div className="space-y-2 flex-1">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block">{t.category}</span>
                      <h4 className="text-sm font-bold leading-tight text-dark group-hover:text-primary transition-colors line-clamp-2">{t.title}</h4>
                      <p className="text-gray-500 text-[11px] font-medium line-clamp-2 leading-relaxed">
                        {t.excerpt}
                      </p>
                    </div>
                  </div>
                  
                  {/* Author & Meta Data Section */}
                  <div className="flex items-center justify-between pl-10">
                    <div className="flex items-center gap-2">
                      {t.author_image ? (
                        <img 
                          src={t.author_image} 
                          alt={t.author_name} 
                          className="w-5 h-5 rounded-full object-cover border border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <User size={10} className="text-gray-400" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-dark/70 uppercase tracking-tight">
                        {t.author_name || "Staff Writer"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-medium text-gray-400">
                      <Calendar size={10} />
                      {new Date(t.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tag Cloud Section */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-dark">
               <Hash size={16} className="text-primary" /> Browse Topics
             </h3>
             <div className="flex flex-wrap gap-2">
                {["ICT", "Titans", "Lipa City", "AI", "Enrollment", "Campus", "Tech", "Sports"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded hover:bg-primary hover:text-white hover:border-primary transition-all uppercase"
                  >
                    {tag}
                  </button>
                ))}
             </div>
          </div>

          {/* Newsletter Box */}
          <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
               <p className="text-white/70 text-xs mb-6 leading-relaxed">Get the latest campus stories delivered straight to your feed.</p>
               <Link to="/contact" className="inline-block w-full text-center bg-white text-primary text-[10px] font-black uppercase tracking-widest py-3 rounded hover:bg-secondary hover:text-white transition-all">
                 Join the Newsletter
               </Link>
             </div>
             <Newspaper className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12" />
          </div>
        </aside>
      </main>

      {/* Floating Scroll Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-50 bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-secondary hover:-translate-y-1 active:scale-95 transition-all duration-500 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <ChevronUp size={24} />
      </button>

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}