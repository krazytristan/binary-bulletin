import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { Search, ChevronRight, ChevronUp } from "lucide-react";

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

  const categories = ["All", "News", "Sports", "Opinion", "Feature", "Editorial", "Literary"];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* --- HEADER --- */}
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8">
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter mb-6 text-blue-900">Archive</h1>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    category === cat ? "text-red-900 border-b-2 border-red-900 pb-0.5" : "text-gray-500 hover:text-blue-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors" 
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-[400px] bg-gray-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* --- LEAD STORY --- */}
            {latest && !search && category === "All" && (
              <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b-2 border-gray-200 pb-12 group">
                <Link to={`/article/${latest.id}`} className="aspect-[16/10] overflow-hidden bg-gray-100 border border-gray-300 relative">
                  <img 
                    src={getImage(latest.image_url)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt="Article Lead" 
                  />
                  <div className="absolute top-0 left-0 bg-amber-400 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-blue-900">Featured</div>
                </Link>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span className="text-white bg-red-900 px-2 py-0.5">{latest.category}</span>
                    <span className="text-amber-600">{new Date(latest.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/article/${latest.id}`}>
                    <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight mb-4 group-hover:text-red-900 transition-colors text-gray-900">
                      {latest.title}
                    </h2>
                  </Link>
                  <p className="text-base text-gray-600 font-serif leading-relaxed mb-6">
                    {latest.excerpt || latest.content?.substring(0, 150) + "..."}
                  </p>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    By <span className="text-blue-900">{latest.author_name || "Staff"}</span>
                  </div>
                </div>
              </article>
            )}

            {/* --- GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {(search || category !== "All" ? filtered : remaining).map((a) => (
                <article key={a.id} className="group">
                  <Link to={`/article/${a.id}`} className="block aspect-[4/3] overflow-hidden bg-gray-100 border border-gray-300 mb-4">
                    <img 
                      src={getImage(a.image_url)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      alt="Thumbnail" 
                    />
                  </Link>
                  <div className="flex items-center justify-between mb-2 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span className="text-red-900">{a.category}</span>
                    <span className="text-amber-600">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/article/${a.id}`}>
                    <h3 className="text-xl font-serif font-black leading-tight mb-2 group-hover:text-red-900 transition-colors text-gray-900">
                      {a.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 font-serif line-clamp-2 mb-3">
                    {a.excerpt || a.content}
                  </p>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    By <span className="text-blue-900">{a.author_name || "Staff"}</span>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-sm font-serif text-gray-500 italic">No archives found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-50 bg-blue-900 border-2 border-blue-950 text-white p-3 shadow-lg hover:bg-amber-400 hover:text-blue-900 hover:border-amber-400 transition-all duration-500 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ChevronUp size={16} />
      </button>

      <Footer />
    </div>
  );
}