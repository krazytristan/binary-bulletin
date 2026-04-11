import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, TrendingUp, Calendar, Clock, ArrowRight, Zap, 
  CloudSun, MapPin, Users, BookOpen, ChevronRight,
  MessageSquare, Newspaper, Award, Quote, PenTool,
  ShieldCheck, X, ChevronLeft
} from "lucide-react";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const scrollRef = useRef(null);

  const stages = [
    "Connecting to Archives...",
    "Syncing Database...",
    "Fetching Latest Headlines...",
    "Rendering Editorial Layout...",
    "Finalizing Edition..."
  ];

  // --- AUTO-SLIDE LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollTo({ left: scrollLeft + 350, behavior: "smooth" });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [articles]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const stageInterval = setInterval(() => {
        setLoadingStage(prev => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 600);

      const { data, error: fetchError } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        setArticles(data);
        setFeatured(data[0]);
      }
      clearInterval(stageInterval);
    } catch (err) {
      console.error("Failed to load publication.");
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  }, []);

  useEffect(() => {
    fetchData();
    document.title = "The Binary Bulletin | Official Campus Publication";
    
    const consent = localStorage.getItem("bulletin_cookie_consent");
    if (!consent) {
      setTimeout(() => setShowCookies(true), 2500);
    }
  }, [fetchData]);

  const handleAcceptCookies = () => {
    localStorage.setItem("bulletin_cookie_consent", "true");
    setShowCookies(false);
  };

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter(a => 
      a?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a?.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const categorized = useMemo(() => {
    const get = (cat) => filteredArticles?.filter((a) => a.category === cat) || [];
    return {
      news: get("News"),
      sports: get("Sports"),
      feature: get("Feature"),
      opinion: get("Opinion"),
      editorial: get("Editorial"),
      literary: get("Literary"),
    };
  }, [filteredArticles]);

  const headlines = useMemo(() => {
    return articles?.slice(0, 5).map(a => a.title) || [];
  }, [articles]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    }) : "";

  if (loading) return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xs w-full space-y-8 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 border-2 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 w-24 h-24 border-t-4 border-primary rounded-full animate-spin"></div>
          <Newspaper className="absolute inset-0 m-auto text-primary" size={32} />
        </div>
        <div className="space-y-4">
          <h2 className="font-black tracking-tighter text-3xl uppercase italic text-primary">The Binary</h2>
          <div className="h-1.5 bg-gray-100 w-full rounded-full overflow-hidden relative">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 ease-in-out"
              style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
            ></div>
          </div>
          <p className="font-black tracking-[0.2em] text-gray-400 uppercase text-[11px] animate-pulse">
            {stages[loadingStage]}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-dark font-sans selection:bg-accent/30 relative">
      <Navbar />

      {/* TOP STATUS BAR */}
      <div className="bg-primary text-white py-2 text-[10px] font-bold uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1"><MapPin size={12}/> Lipa City, PH</span>
            <span className="flex items-center gap-1 hidden md:flex"><CloudSun size={12}/> 29°C Partly Cloudy</span>
            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1 hidden sm:flex"><Users size={12}/> 1,240 Campus Readers</span>
            <span>● Volume IV, Issue II</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b" className="w-full h-full object-cover opacity-50 grayscale" alt="Campus"/>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-white">
          <div className="max-w-2xl space-y-4">
             <div className="inline-block bg-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">● The Official Publication of AMA Lipa</div>
             <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] tracking-tighter mb-6">THE<br/>BINARY</h1>
             <p className="text-xl text-white/90 font-medium leading-relaxed border-l-4 border-accent pl-6 max-w-lg">Decoding stories, campus updates, and technological breakthroughs for the modern student.</p>
             <div className="flex flex-wrap gap-4 pt-8">
               <Link to="/news" className="bg-white text-primary px-8 py-4 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">Latest News</Link>
               <div className="relative flex-grow max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                 <input type="text" placeholder="Search articles..." className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg py-4 pl-12 pr-4 text-white outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-dark text-white py-3 overflow-hidden whitespace-nowrap border-y border-dark">
        <div className="flex animate-marquee gap-12 items-center font-sans text-[11px] font-black uppercase tracking-widest">
          {[1, 2].map((set) => (
            <div key={set} className="flex gap-12 items-center">
              {headlines.length > 0 ? headlines.map((text, index) => (
                <span key={index} className="flex items-center gap-3"><Zap size={14} className="text-accent" fill="currentColor"/> {text}</span>
              )) : <span className="flex items-center gap-2 italic"><Zap size={14} className="text-accent" fill="currentColor"/> Fetching Latest Headlines...</span>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-18">
        {/* EDITORIAL GRID */}
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          {/* Left Column: Editorial & Campus Voices */}
          <div className="lg:col-span-3 space-y-10 border-r border-gray-100 pr-10 hidden lg:block">
            <div className="bg-light p-6 rounded-xl border border-gray-200">
               <div className="flex items-center gap-2 mb-4 text-primary"><Quote size={20} fill="currentColor"/><h2 className="font-black uppercase text-xs tracking-widest">Editorial</h2></div>
               {categorized.editorial[0] && (
                 <Link to={`/article/${categorized.editorial[0].id}`} className="group block">
                    <h3 className="font-serif text-xl font-bold leading-tight mb-2 group-hover:text-secondary transition-colors">{categorized.editorial[0].title}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-3 italic mb-4">"{categorized.editorial[0].excerpt}"</p>
                    <div className="flex items-center gap-2 mb-4">
                        <img src={categorized.editorial[0].author_image || "https://ui-avatars.com/api/?name=Editor"} className="w-6 h-6 rounded-full grayscale border border-gray-200" alt="author"/>
                        <span className="text-[10px] font-bold text-gray-500">{categorized.editorial[0].author_text || "Editorial Board"}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary border-b border-primary pb-1">Read Editorial</span>
                 </Link>
               )}
            </div>
            <div className="space-y-6">
              <h2 className="font-black border-b-2 border-dark pb-1 text-xs uppercase tracking-widest">Campus Voices</h2>
              {categorized.opinion.slice(0, 4).map(a => (
                <Link key={a.id} to={`/article/${a.id}`} className="block group border-b border-gray-100 pb-4">
                  <h4 className="font-bold leading-snug group-hover:text-primary transition-colors mb-2">{a.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">By {a.author_text || "Columnist"}</span>
                    <span className="text-[9px] text-gray-400">{formatDate(a.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Center Column: The Lead Coverage */}
          <div className="lg:col-span-6 space-y-8">
            <h2 className="uppercase tracking-[0.3em] font-black text-[10px] text-secondary">The Lead Coverage</h2>
            {featured && (
              <Link to={`/article/${featured.id}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-card">
                  <img src={featured.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Lead"/>
                  <div className="absolute top-4 left-4 bg-accent text-dark font-black text-[10px] px-3 py-1 rounded uppercase">Front Page</div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-[0.9] tracking-tighter mb-4 group-hover:text-primary transition-colors font-serif">{featured.title}</h2>
                <p className="text-gray-500 text-lg leading-relaxed line-clamp-3 font-medium italic mb-6">"{featured.excerpt}"</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-3">
                    <img src={featured.author_image || "https://ui-avatars.com/api/?name=Staff"} className="w-10 h-10 rounded-full border border-gray-200 grayscale" alt="author"/>
                    <div>
                      <p className="text-[10px] font-black uppercase text-dark">{featured.author_text || "Bulletin Staff"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(featured.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    Read More <ChevronRight size={14}/>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Right Column: The Latest */}
          <div className="lg:col-span-3 border-l border-gray-100 pl-10 space-y-8">
            <h2 className="font-black border-b-2 border-dark pb-1 text-xs uppercase flex items-center gap-2"><TrendingUp size={16}/> The Latest</h2>
            <div className="divide-y divide-gray-100">
              {articles.slice(1, 6).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="py-6 block group">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{a.category}</span>
                  <h4 className="font-bold text-md leading-tight group-hover:underline decoration-accent underline-offset-4 mb-2">{a.title}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 italic mb-3">"{a.excerpt}"</p>
                  <div className="flex items-center gap-2">
                    <img src={a.author_image || "https://ui-avatars.com/api/?name=Writer"} className="w-4 h-4 rounded-full grayscale" alt="av"/>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{a.author_text || "Staff Writer"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* --- DYNAMIC SMALL AUTO-SLIDE CAROUSEL --- */}
        <section className="mb-22 pt-12 border-t border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-xs uppercase tracking-[0.3em] text-gray-400 italic">Featured Archives Scroll</h2>
            <div className="flex gap-2">
              <button onClick={() => scrollRef.current.scrollBy({left: -320, behavior: 'smooth'})} className="p-2 border border-gray-200 rounded-full hover:bg-gray-50"><ChevronLeft size={16}/></button>
              <button onClick={() => scrollRef.current.scrollBy({left: 320, behavior: 'smooth'})} className="p-2 border border-gray-200 rounded-full hover:bg-gray-50"><ChevronRight size={16}/></button>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {articles.map((a) => (
              <Link key={a.id} to={`/article/${a.id}`} className="min-w-[280px] md:min-w-[320px] group block">
                <div className="aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-gray-100 border border-gray-100 shadow-sm">
                  <img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="article" />
                </div>
                <h4 className="font-bold text-sm leading-tight group-hover:text-primary mb-2 line-clamp-1">{a.title}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 italic mb-3">"{a.excerpt}"</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2">
                    <img src={a.author_image || "https://ui-avatars.com/api/?name=Writer"} className="w-5 h-5 rounded-full grayscale border border-gray-200" alt="auth" />
                    <span className="text-[9px] font-black uppercase text-dark">{a.author_text}</span>
                  </div>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{formatDate(a.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* OPINION & LITERARY */}
        <div className="grid lg:grid-cols-2 gap-12 mb-22">
          <section className="pt-12 border-t-2 border-dark">
            <h2 className="text-3xl font-black uppercase italic text-primary flex items-center gap-2 mb-8"><PenTool size={24} className="text-accent" /> Opinion</h2>
            <div className="space-y-8">
              {categorized.opinion.slice(0, 3).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="flex gap-4 group">
                  <div className="w-24 h-24 flex-shrink-0 bg-light rounded-lg overflow-hidden border border-gray-100"><img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="op" /></div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg leading-tight group-hover:text-secondary">{a.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">"{a.excerpt}"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={a.author_image || "https://ui-avatars.com/api/?name=Author"} className="w-5 h-5 rounded-full" alt="auth"/>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{a.author_text || "Columnist"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="pt-12 border-t-2 border-dark">
            <h2 className="text-3xl font-black uppercase italic text-primary flex items-center gap-2 mb-8"><BookOpen size={24} className="text-accent" /> Literary</h2>
            <div className="grid grid-cols-2 gap-4">
              {categorized.literary.slice(0, 2).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-dark group">
                  <img src={a.image_url} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="lit" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 p-4 w-full">
                    <h4 className="text-white font-bold text-sm mb-1 leading-tight">{a.title}</h4>
                    <p className="text-[10px] text-white/60 line-clamp-2 italic mb-2">"{a.excerpt}"</p>
                    <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">{a.author_text || "Contributor"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* CATEGORIES SECTION */}
        {["News", "Sports", "Feature"].map((cat) => (
          categorized[cat.toLowerCase()].length > 0 && (
            <section key={cat} className="pt-12 border-t-2 border-dark mb-18">
              <div className="flex items-end justify-between mb-8">
                <div><h2 className="text-4xl font-black uppercase tracking-tighter italic text-primary">{cat}</h2><div className="h-1 w-20 bg-accent mt-1"></div></div>
                <Link to="/news" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-dark pb-1">Archive</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-10">
                {categorized[cat.toLowerCase()].slice(0, 3).map((article) => (
                  <Link key={article.id} to={`/article/${article.id}`} className="group block">
                    <div className="aspect-video bg-gray-100 mb-6 overflow-hidden rounded-xl shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500"><img src={article.image_url} className="w-full h-full object-cover" alt="thumb" /></div>
                    <h4 className="text-xl font-bold leading-tight mb-3 group-hover:text-secondary font-serif">{article.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium mb-4 italic">"{article.excerpt}"</p>
                    <div className="flex items-center gap-2 mb-4">
                      <img src={article.author_image || "https://ui-avatars.com/api/?name=Staff"} className="w-5 h-5 rounded-full" alt="auth" />
                      <p className="text-[9px] font-black uppercase text-gray-500">{article.author_text || "Staff"}</p>
                    </div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Read Full Article</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        ))}

        {/* NEWSLETTER */}
        <section className="bg-white border-4 border-dark p-12 md:p-22 text-center my-22 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <Newspaper size={48} className="mx-auto text-primary" />
            <h2 className="text-5xl font-black uppercase tracking-tighter">Stay Wired.</h2>
            <p className="font-medium text-gray-600 italic text-lg">Get the Bulletin digest delivered to your campus inbox.</p>
            <div className="flex flex-col md:flex-row gap-3 mt-8">
              <input type="email" placeholder="ama.student@email.com" className="flex-grow border-2 border-dark px-6 py-4 rounded-lg font-bold outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="bg-dark text-white px-10 py-4 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-primary transition-colors">Subscribe</button>
            </div>
          </div>
        </section>
      </main>

      {/* COOKIE CONSENT */}
      {showCookies && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100] animate-slide-up">
          <div className="bg-dark text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><ShieldCheck className="text-accent" size={20} /> Transparency</h3>
              <button onClick={() => setShowCookies(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">We use telemetry to improve your experience. By continuing, you agree to our Digital Ethics Policy.</p>
            <div className="flex gap-3">
              <button onClick={handleAcceptCookies} className="flex-1 bg-accent text-dark text-[10px] font-black uppercase py-3 rounded-xl hover:bg-white transition-all">Accept All</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: fit-content; animation: marquee 40s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}