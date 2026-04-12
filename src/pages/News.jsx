import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  Newspaper, 
  Hash, 
  ChevronUp,
  User,
  ChevronRight,
  Bookmark,
  Share2,
  Clock 
} from "lucide-react";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      fetchArticles();
      isInitialRender.current = false;
    }
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
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
    const term = search.toLowerCase();
    return articles.filter((a) => {
      const matchesSearch = !search || 
        a.title?.toLowerCase().includes(term) || 
        a.excerpt?.toLowerCase().includes(term);
      const matchesCategory = category === "All" || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, category]);

  const latest = filtered[0];
  const remaining = filtered.slice(1);

  const getImage = (url) => {
    return url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000";
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#1E3A8A] selection:text-white overflow-x-hidden antialiased">
      <Navbar />

      {/* --- EDITORIAL HEADER --- */}
      <header className="pt-24 md:pt-28 pb-4 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1E3A8A] mb-1">NexGen Gazette</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">Journal</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Vol. 2026 — Ed. 04</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Access // Digital Edition</p>
          </div>
        </div>
      </header>

      {/* --- UTILITY BAR --- */}
      <nav className="sticky top-0 z-40 bg-[#FDFDFB]/95 backdrop-blur-md border-b border-black/5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 flex-1">
            <Search className="text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH ARCHIVES..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="bg-transparent border-none w-full text-[10px] font-bold tracking-[0.1em] outline-none placeholder:text-gray-300" 
            />
          </div>
          <div className="hidden md:flex items-center gap-6">
            {["All", "News", "Sports", "Opinion", "Feature", "Editorial"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                  category === cat ? "text-[#1E3A8A]" : "text-gray-400 hover:text-black"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-96 bg-gray-100 border border-black/5" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* --- LEAD STORY (TITLES RESIZED & NO ITALICS) --- */}
            {latest && !search && (
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-black/10 group">
                <div className="lg:col-span-7 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-[#1E3A8A] text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">{latest.category}</span>
                    <time className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(latest.created_at).toDateString()}</time>
                  </div>
                  <Link to={`/article/${latest.id}`}>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight mb-6 uppercase group-hover:text-[#1E3A8A] transition-colors">
                      {latest.title}
                    </h2>
                  </Link>
                  <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed mb-8 line-clamp-3">
                    {latest.excerpt || latest.content}
                  </p>
                  
                  {/* Author Meta */}
                  <div className="flex items-center justify-between pt-6 border-t border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 bg-gray-50">
                        {latest.author_image ? (
                          <img src={latest.author_image} alt={latest.author_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={20}/></div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{latest.author_name || "Staff Writer"}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Journalist</p>
                      </div>
                    </div>
                    <Link to={`/article/${latest.id}`} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                      Read Article <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-5 bg-gray-50 overflow-hidden min-h-[350px]">
                  <img 
                    src={getImage(latest.image_url)} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
                    alt="Article Lead" 
                  />
                </div>
              </article>
            )}

            {/* --- SECONDARY GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border border-black/10">
              {(search ? filtered : remaining).map((a) => (
                <article key={a.id} className="bg-[#FDFDFB] flex flex-col hover:bg-white transition-colors group">
                  <div className="aspect-[16/10] overflow-hidden border-b border-black/10 bg-gray-100">
                    <img 
                      src={getImage(a.image_url)} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" 
                      alt="Thumbnail" 
                    />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[8px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">{a.category}</span>
                      <Bookmark size={12} className="text-gray-200" />
                    </div>
                    
                    <Link to={`/article/${a.id}`} className="flex-1">
                      <h3 className="text-sm font-black uppercase leading-tight tracking-tight mb-3 line-clamp-2 group-hover:text-[#1E3A8A]">
                        {a.title}
                      </h3>
                      <p className="text-[12px] text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2">
                        {a.excerpt || a.content}
                      </p>
                    </Link>

                    <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 border border-black/5">
                          {a.author_image ? (
                            <img src={a.author_image} className="w-full h-full object-cover" alt="Author" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={10}/></div>
                          )}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-600">{a.author_name || "Staff"}</span>
                      </div>
                      <span className="text-[8px] font-bold text-gray-300 uppercase">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- SIDEBAR TOPICS --- */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="border-t border-black/10 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-[#1E3A8A]">Archive Index</h3>
             <div className="flex flex-wrap gap-2">
              {["ICT", "Titans", "Lipa City", "AI", "Campus", "Tech", "Sports"].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="text-[10px] font-bold border border-black/10 px-4 py-2 hover:bg-black hover:text-white transition-all uppercase tracking-widest"
                >
                  #{tag}
                </button>
              ))}
             </div>
          </div>
          <div className="bg-[#1E3A8A] p-8 text-white flex flex-col justify-between">
             <div>
               <h3 className="text-xl font-black uppercase leading-none mb-4 tracking-tighter">Newsletter</h3>
               <p className="text-xs text-white/70 font-medium mb-8">Receive weekly highlights and editorial deep-dives directly.</p>
             </div>
             <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest bg-white text-[#1E3A8A] py-3 text-center hover:bg-[#F59E0B] hover:text-white transition-colors">
               Subscribe
             </Link>
          </div>
        </div>
      </section>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-50 bg-black text-white p-4 rounded-none shadow-2xl transition-all duration-500 ${showScrollTop ? 'opacity-100' : 'opacity-0'}`}
      >
        <ChevronUp size={20} />
      </button>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}