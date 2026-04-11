import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Search, Filter, Calendar, ArrowRight, TrendingUp, Newspaper, Hash, RefreshCcw } from "lucide-react";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const matchesSearch = !search || a.title.match(searchRegex) || a.excerpt?.match(searchRegex);
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

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-dark font-sans selection:bg-accent/30">
      <Navbar />

      {/* 🔷 EDITORIAL HEADER */}
      <section className="bg-primary text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[15rem] leading-none -bottom-10 -left-10">
          ARCHIVE
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <span className="bg-accent text-dark px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                The Binary Bulletin
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Digital <br /> Journalism
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              Exploring the intersection of campus life, technology, and student perspectives within the digital age.
            </p>
          </div>
        </div>
      </section>

      {/* 🔥 SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search archives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/10 font-bold text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
            <Filter size={16} className="text-primary hidden md:block mr-2" />
            {["All", "News", "Sports", "Opinion", "Feature", "Editorial", "Literary"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
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

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-12 gap-12 mt-8">
        
        {/* 📰 NEWS FEED */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Database</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
              <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold">No results found</h3>
              <p className="text-gray-500 mb-6">We couldn't find any articles matching your criteria.</p>
              <button 
                onClick={() => {setSearch(""); setCategory("All")}}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-dark text-white px-6 py-3 rounded-full hover:bg-primary transition-colors"
              >
                <RefreshCcw size={14} /> Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-12">
              {filtered.map((article) => (
                <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-5 shadow-sm bg-gray-200">
                    <img
                      src={getImage(article)}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded shadow-sm text-[9px] font-black uppercase tracking-tighter text-dark">
                      {article.category || "General"}
                    </div>
                  </div>

                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <Calendar size={12} className="text-accent" />
                      {new Date(article.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <h2 className="text-2xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed">
                      {article.excerpt || "Dive into this latest update from our student journalists."}
                    </p>
                    <div className="pt-2 flex items-center text-[10px] font-black uppercase tracking-widest text-secondary group-hover:gap-3 transition-all">
                      Read Full Story <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 🔥 TRENDING SIDEBAR */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-dark text-white rounded-[2rem] p-8 lg:sticky lg:top-32 shadow-2xl overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent opacity-5 rounded-full blur-3xl"></div>
            
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-8 italic">
              <TrendingUp className="text-accent" /> Trending Now
            </h3>

            <div className="space-y-8 relative z-10">
              {trending.length > 0 ? trending.map((t, i) => (
                <Link key={t.id} to={`/article/${t.id}`} className="flex gap-4 group/item">
                  <span className="text-3xl font-black text-white/10 group-hover/item:text-accent transition-colors leading-none">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] block mb-1">
                      {t.category}
                    </span>
                    <h4 className="text-sm font-bold leading-tight group-hover/item:text-accent transition-colors">
                      {t.title}
                    </h4>
                  </div>
                </Link>
              )) : (
                <p className="text-xs text-white/40 italic">Nothing trending yet...</p>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-white/40">Total Archive Count</span>
                <span className="text-accent">{articles.length}</span>
              </div>
            </div>
          </div>

          {/* QUICK TOPIC CLOUD */}
          <div className="p-8 border-2 border-dark rounded-[2rem] bg-white shadow-sm">
             <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
               <Hash size={16} className="text-primary" /> Popular Topics
             </h3>
             <div className="flex flex-wrap gap-2">
                {["Titans", "ICT", "AMAer", "Lipa City", "AI", "Enrollment", "Campus"].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="text-[10px] font-bold border border-gray-200 px-3 py-1.5 rounded-full hover:bg-dark hover:text-white hover:border-dark transition-all"
                  >
                    #{tag}
                  </button>
                ))}
             </div>
          </div>
        </aside>

      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}