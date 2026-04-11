import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, TrendingUp, Calendar, Clock, ArrowRight, Zap, 
  CloudSun, MapPin, Users, BookOpen, ChevronRight,
  MessageSquare, Newspaper, Award, Quote, PenTool
} from "lucide-react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      if (data && data.length > 0) {
        setArticles(data);
        setFeatured(data[0]);
      }
    } catch (err) {
      setError("Failed to load publication. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    document.title = "The Binary Bulletin | Official Campus Publication";
  }, [fetchData]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    return articles.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const categorized = useMemo(() => {
    const get = (cat) => filteredArticles.filter((a) => a.category === cat);
    return {
      news: get("News"),
      sports: get("Sports"),
      feature: get("Feature"),
      opinion: get("Opinion"),
      editorial: get("Editorial"),
      literary: get("Literary"),
    };
  }, [filteredArticles]);

  // Extract real headlines for the Ticker
  const headlines = useMemo(() => {
    return articles.slice(0, 5).map(a => a.title);
  }, [articles]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-black tracking-widest text-primary uppercase text-xs">Printing Edition...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-dark font-sans selection:bg-accent/30">
      <Navbar />

      {/* 🌤️ TOP STATUS BAR */}
      <div className="bg-primary text-white py-2 text-[10px] font-bold uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1"><MapPin size={12}/> Lipa City, PH</span>
            <span className="flex items-center gap-1 hidden md:flex"><CloudSun size={12}/> 29°C Partly Cloudy</span>
            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1 hidden sm:flex"><Users size={12}/> 1,240 Campus Readers Online</span>
            <span>● Volume IV, Issue II</span>
          </div>
        </div>
      </div>

      {/* 🚀 IMPACT HERO SECTION */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b" 
            className="w-full h-full object-cover opacity-50 grayscale" 
            alt="Campus Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl text-white space-y-4">
             <div className="inline-block bg-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
               ● The Official Publication of AMA Lipa
             </div>
             <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] tracking-tighter mb-6">
               THE<br/>BINARY
             </h1>
             <p className="text-xl text-white/90 font-medium leading-relaxed border-l-4 border-accent pl-6 max-w-lg">
               Decoding stories, campus updates, and technological breakthroughs for the modern student.
             </p>
             <div className="flex flex-wrap gap-4 pt-8">
               <Link to="/news" className="bg-white text-primary px-8 py-4 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
                 Latest News
               </Link>
               <div className="relative flex-grow max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search articles..." 
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-white/40 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ⚡ TRUE DATA BREAKING NEWS TICKER */}
      <div className="bg-dark text-white py-3 overflow-hidden whitespace-nowrap border-y border-dark">
        <div className="flex animate-marquee gap-12 items-center font-sans text-[11px] font-black uppercase tracking-widest">
          {/* We render the set twice to ensure seamless looping */}
          {[1, 2].map((set) => (
            <div key={set} className="flex gap-12 items-center">
              {headlines.length > 0 ? (
                headlines.map((text, index) => (
                  <span key={index} className="flex items-center gap-3">
                    <Zap size={14} className="text-accent" fill="currentColor"/> 
                    {text}
                  </span>
                ))
              ) : (
                <span className="flex items-center gap-2">
                  <Zap size={14} className="text-accent" fill="currentColor"/> 
                  Fetching Latest Headlines...
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-18">
        {/* 🏛️ TRADITIONAL NEWSPAPER GRID */}
        <div className="grid lg:grid-cols-12 gap-10 mb-22">
          
          {/* Left: Opinion & Editorial */}
          <div className="lg:col-span-3 space-y-10 border-r border-gray-100 pr-10 hidden lg:block">
            <div className="bg-light p-6 rounded-xl border border-gray-200">
               <div className="flex items-center gap-2 mb-4 text-primary">
                 <Quote size={20} fill="currentColor"/>
                 <h2 className="font-black uppercase text-xs tracking-widest">Editorial</h2>
               </div>
               {categorized.editorial[0] && (
                 <Link to={`/article/${categorized.editorial[0].id}`} className="group">
                    <h3 className="font-serif text-xl font-bold leading-tight mb-4 group-hover:text-secondary transition-colors">
                      {categorized.editorial[0].title}
                    </h3>
                    <span className="text-[10px] font-black uppercase text-primary border-b border-primary pb-1">Read Full Statement</span>
                 </Link>
               )}
            </div>

            <div className="space-y-6">
              <h2 className="font-black border-b-2 border-dark pb-1 text-xs uppercase tracking-widest">Campus Voices</h2>
              {categorized.opinion.slice(0, 4).map(a => (
                <Link key={a.id} to={`/article/${a.id}`} className="block group border-b border-gray-100 pb-4">
                  <h4 className="font-bold leading-snug group-hover:text-primary transition-colors mb-1">{a.title}</h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">By Editorial Staff</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Center: Top Trending Story */}
          <div className="lg:col-span-6 space-y-8">
            <h2 className="uppercase tracking-[0.3em] font-black text-[10px] text-secondary">The Lead Coverage</h2>
            {featured && (
              <Link to={`/article/${featured.id}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-card">
                  <img src={featured.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Lead"/>
                  <div className="absolute top-4 left-4 bg-accent text-dark font-black text-[10px] px-3 py-1 rounded uppercase">Front Page</div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tighter mb-4 group-hover:text-primary transition-colors font-serif">
                  {featured.title}
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed line-clamp-3 font-medium italic">"{featured.excerpt}"</p>
                <div className="flex items-center gap-4 mt-6 font-black text-[10px] uppercase tracking-widest text-secondary">
                  <span>{formatDate(featured.created_at)}</span>
                  <span>•</span>
                  <span>5 MIN READ</span>
                </div>
              </Link>
            )}
          </div>

          {/* Right: The Latest Bulletins */}
          <div className="lg:col-span-3 border-l border-gray-100 pl-10 space-y-8">
            <h2 className="font-black border-b-2 border-dark pb-1 text-xs uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16}/> The Latest
            </h2>
            <div className="divide-y divide-gray-100">
              {articles.slice(1, 6).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="py-4 block group">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{a.category}</span>
                  <h4 className="font-bold text-md leading-tight group-hover:underline decoration-accent underline-offset-4">{a.title}</h4>
                </Link>
              ))}
            </div>
            
            <div className="bg-dark text-white p-6 rounded-xl text-center space-y-3 shadow-card">
               <Award size={32} className="mx-auto text-accent"/>
               <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Student Merit</h3>
               <p className="text-[11px] text-gray-400 italic">Submit your literary works for the upcoming Volume IV Issue.</p>
            </div>
          </div>
        </div>

        {/* 🖋️ DEDICATED OPINION & LITERARY SECTION */}
        <div className="grid lg:grid-cols-2 gap-12 mb-22">
          {/* Column: Opinion */}
          <section className="pt-12 border-t-2 border-dark">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-primary flex items-center gap-2">
                <PenTool size={24} className="text-accent" /> Opinion
              </h2>
            </div>
            <div className="space-y-6">
              {categorized.opinion.slice(0, 3).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="flex gap-4 group">
                  <div className="w-20 h-20 flex-shrink-0 bg-light rounded-lg overflow-hidden border border-gray-100">
                    <img src={a.image_url} className="w-full h-full object-cover grayscale" alt="op-thumb" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight group-hover:text-secondary transition-colors line-clamp-2">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">By Student Columnist</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Column: Literary */}
          <section className="pt-12 border-t-2 border-dark">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-primary flex items-center gap-2">
                <BookOpen size={24} className="text-accent" /> Literary
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categorized.literary.slice(0, 2).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-dark group">
                  <img src={a.image_url} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="lit-thumb" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 p-4">
                    <h4 className="text-white font-bold text-sm leading-tight group-hover:text-accent transition-colors">{a.title}</h4>
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-2 block">Poetry / Prose</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* 📚 THE BIG THREE CATEGORIES */}
        {["News", "Sports", "Feature"].map((cat) => (
          categorized[cat.toLowerCase()].length > 0 && (
            <section key={cat} className="pt-12 border-t-2 border-dark mb-18">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic text-primary">{cat}</h2>
                  <div className="h-1 w-20 bg-accent mt-1"></div>
                </div>
                <Link to="/news" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-dark pb-1 hover:text-primary transition-colors">Full Archive</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                {categorized[cat.toLowerCase()].slice(0, 3).map((article) => (
                  <Link key={article.id} to={`/article/${article.id}`} className="group">
                    <div className="aspect-video bg-gray-100 mb-6 overflow-hidden rounded-xl shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500">
                      <img src={article.image_url} className="w-full h-full object-cover" alt="thumb" />
                    </div>
                    <h4 className="text-xl font-bold leading-tight mb-2 group-hover:text-secondary font-serif">{article.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium">{article.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )
        ))}

        {/* 📬 NEWSLETTER SECTION */}
        <section className="bg-white border-4 border-dark p-12 md:p-22 text-center my-22 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <Newspaper size={48} className="mx-auto text-primary" />
            <h2 className="text-5xl font-black uppercase tracking-tighter">Stay Wired.</h2>
            <p className="font-medium text-gray-600 italic text-lg">Get the Bulletin digest delivered to your campus inbox every Monday morning.</p>
            <div className="flex flex-col md:flex-row gap-3 mt-8">
              <input 
                type="email" 
                placeholder="ama.student@email.com" 
                className="flex-grow border-2 border-dark px-6 py-4 rounded-lg font-bold focus:outline-none focus:bg-light"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="bg-dark text-white px-10 py-4 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-primary transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 40s linear infinite;
        }
      `}} />
    </div>
  );
}