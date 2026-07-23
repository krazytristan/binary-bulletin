import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, Calendar, CloudSun, MapPin, Users, BookOpen, ChevronRight,
  Newspaper, Quote, PenTool, ShieldCheck, X, ChevronLeft, ArrowRight
} from "lucide-react";

const STAGES = [
  "Setting the Press...",
  "Inking the Rollers...",
  "Fetching Latest Headlines...",
  "Formatting Editorial Columns...",
  "Printing Edition..."
];

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const scrollRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingStage(0);
      
      const stageInterval = setInterval(() => {
        setLoadingStage(prev => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 500);

      const [articlesRes, annRes, eventsRes] = await Promise.all([
        supabase.from("articles").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("events").select("*").order("event_date", { ascending: true }).limit(3)
      ]);

      if (articlesRes.data) {
        setArticles(articlesRes.data);
        setFeatured(articlesRes.data[0]);
      }
      if (annRes.data) setAnnouncements(annRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);

      clearInterval(stageInterval);
    } catch (err) {
      console.error("Data sync failed.", err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  useEffect(() => {
    fetchData();
    document.title = "The Binary Bulletin | The Binary Journal";
    
    const consent = localStorage.getItem("bulletin_cookie_consent");
    if (!consent) {
      setTimeout(() => setShowCookies(true), 2500);
    }
  }, [fetchData]);

  // Auto-scroll logic for the Archive Carousel
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

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    }) : "";

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-[#FCFBF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-xs w-full space-y-8 text-center font-serif text-[#111827]">
        <Newspaper className="mx-auto text-black" size={48} strokeWidth={1} />
        <div className="space-y-4">
          <h2 className="font-bold text-3xl uppercase tracking-widest border-b border-black pb-4">The Press</h2>
          <div className="h-[1px] bg-gray-300 w-full relative">
            <div 
              className="absolute inset-y-0 left-0 bg-black transition-all duration-700 ease-in-out"
              style={{ width: `${((loadingStage + 1) / STAGES.length) * 100}%` }}
            />
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gray-500 animate-pulse pt-2">
            {STAGES[loadingStage]}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans selection:bg-black selection:text-white antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* --- CLASSIC MASTHEAD --- */}
        <header className="mb-10 text-center border-b-[3px] border-black pb-6">
          <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-6">
            <div className="flex gap-4 text-[10px] font-sans uppercase tracking-widest text-gray-600 hidden md:flex">
              <span className="flex items-center gap-1"><MapPin size={12}/> Lipa City, PH</span>
              <span className="flex items-center gap-1"><CloudSun size={12}/> 29°C</span>
            </div>
            <div className="mx-auto md:mx-0 text-[10px] font-sans uppercase tracking-[0.2em] text-black font-bold">
              Digital Premiere Edition
            </div>
            <div className="flex gap-4 text-[10px] font-sans uppercase tracking-widest text-gray-600 hidden md:flex">
              <span className="flex items-center gap-1"><Users size={12}/> 1,240 Readers</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-8xl lg:text-[8rem] font-serif font-black uppercase tracking-tighter leading-none text-[#111827]">
            The Binary<br className="md:hidden" /> Bulletin
          </h1>
          
          <div className="flex justify-between items-center border-t border-black mt-6 pt-3 text-[11px] font-sans uppercase tracking-widest font-bold">
            <span className="hidden sm:inline">Vol. 2026 — Ed. 04</span>
            <span className="mx-auto sm:mx-0">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="hidden sm:inline">Since 1998</span>
          </div>
        </header>

        {/* --- SEARCH BAR --- */}
        <div className="flex justify-end mb-10 border-b border-gray-200 pb-6">
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Archives..." 
              className="w-full bg-white border border-gray-300 rounded-none py-2.5 pl-10 pr-4 text-[#111827] outline-none focus:border-black font-sans text-xs uppercase tracking-widest placeholder:text-gray-400 transition-colors" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        {/* --- MAIN NEWSPAPER GRID --- */}
        <div className="grid lg:grid-cols-12 gap-x-8 gap-y-12 mb-16">
          
          {/* COLUMN 1: EDITORIAL & VOICES (Left Sidebar) */}
          <div className="lg:col-span-3 space-y-10 lg:border-r border-gray-300 lg:pr-8">
            
            {/* Editorial block */}
            <div className="border-b border-gray-300 pb-8">
                <div className="flex items-center gap-2 mb-4 text-black border-t-2 border-black pt-2">
                  <Quote size={16} fill="currentColor"/>
                  <h2 className="font-sans font-bold uppercase text-[10px] tracking-widest">Editorial</h2>
                </div>
                {categorized.editorial[0] && (
                  <Link to={`/article/${categorized.editorial[0].id}`} className="group block">
                     <h3 className="font-serif text-2xl font-bold leading-tight mb-3 group-hover:text-black transition-colors">{categorized.editorial[0].title}</h3>
                     <p className="text-sm text-gray-700 leading-relaxed font-serif mb-4">"{categorized.editorial[0].excerpt}"</p>
                     <div className="flex items-center gap-3">
                        <img src={categorized.editorial[0].author_image || `https://ui-avatars.com/api/?name=Staff&background=111827&color=fff`} className="w-8 h-8 rounded-full grayscale" alt="author"/>
                        <div>
                          <span className="block text-[9px] font-sans font-bold uppercase tracking-widest">{categorized.editorial[0].author_name || "Chief Editor"}</span>
                        </div>
                     </div>
                  </Link>
                )}
            </div>

            {/* Voices block */}
            <div className="space-y-6 border-b border-gray-300 pb-8">
              <h2 className="font-sans font-bold uppercase text-[10px] tracking-widest border-t border-black pt-2 flex items-center gap-2 text-gray-500">
                <PenTool size={14}/> Voices
              </h2>
              <div className="flex flex-col gap-6">
                {categorized.opinion.slice(0, 3).map(a => (
                  <Link key={a.id} to={`/article/${a.id}`} className="block group">
                    <h4 className="font-serif font-bold text-lg leading-tight group-hover:text-black transition-colors mb-2">{a.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans text-gray-500 uppercase tracking-widest">By {a.author_name || "Staff"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Campus Announcements block */}
            <div className="space-y-6">
              <h2 className="font-sans font-bold uppercase text-[10px] tracking-widest border-t-2 border-black pt-2 flex items-center gap-2 text-black">
                <Newspaper size={14}/> Bulletins
              </h2>
              <div className="space-y-5">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white p-4 border border-gray-200 shadow-sm">
                    <span className="text-[9px] font-sans font-bold uppercase text-black tracking-widest block mb-2">{ann.category || "Official"}</span>
                    <h4 className="text-sm font-serif font-bold leading-tight mb-2">{ann.title}</h4>
                    <p className="text-xs text-gray-600 font-serif leading-relaxed line-clamp-3">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: FRONT PAGE LEAD (Center) */}
          <div className="lg:col-span-6 lg:border-r border-gray-300 lg:pr-8">
            <div className="border-t-[3px] border-black pt-2 mb-6">
              <h2 className="uppercase tracking-widest font-sans font-bold text-[10px] text-gray-500 text-center">Front Page Lead</h2>
            </div>
            
            {featured && (
              <div className="block">
                <Link to={`/article/${featured.id}`} className="group block">
                  <h2 className="text-4xl md:text-5xl font-serif font-black leading-[1.1] mb-6 group-hover:text-black transition-colors text-center">{featured.title}</h2>
                  
                  <div className="flex items-center justify-center gap-3 mb-8 text-[11px] font-sans uppercase tracking-widest">
                    <span className="font-bold text-black border-r border-gray-300 pr-3">By {featured.author_name || "Journal Staff"}</span>
                    <span className="text-gray-500">{formatDate(featured.created_at)}</span>
                  </div>

                  <div className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden bg-gray-200 mb-8 border border-gray-300">
                    <img src={featured.image_url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Lead"/>
                    <div className="absolute bottom-0 right-0 bg-white px-3 py-1 text-[9px] font-sans uppercase tracking-widest text-gray-500 border-t border-l border-gray-300">Archive Photo</div>
                  </div>
                  
                  {/* Drop cap styling for excerpt */}
                  <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-serif">
                    <span className="float-left text-6xl font-black font-serif leading-none pr-3 pt-1 text-black">{featured.excerpt.charAt(0)}</span>
                    {featured.excerpt.slice(1)}...
                  </p>
                  
                  <div className="flex items-center gap-2 mt-8 text-black font-sans font-bold text-[11px] uppercase tracking-widest group-hover:underline decoration-2 underline-offset-4">
                    Continue Reading <ArrowRight size={14}/>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* COLUMN 3: THE LATEST INDEX (Right Sidebar) */}
          <div className="lg:col-span-3 space-y-8">
            <h2 className="font-sans font-bold uppercase text-[10px] tracking-widest border-t border-black pt-2 flex items-center gap-2 text-gray-500">
               Recent Dispatches
            </h2>
            <div className="flex flex-col gap-8">
                {filteredArticles.slice(1, 5).map((a) => (
                  <Link key={a.id} to={`/article/${a.id}`} className="block group border-b border-gray-200 pb-6 last:border-0">
                    <span className="inline-block text-black font-sans font-bold text-[9px] uppercase tracking-widest mb-2">{a.category}</span>
                    <h4 className="font-serif font-bold text-xl leading-tight group-hover:text-black transition-colors mb-3">{a.title}</h4>
                    <p className="text-sm font-serif text-gray-600 line-clamp-3 mb-3">"{a.excerpt}"</p>
                    <p className="text-[9px] font-sans uppercase tracking-widest text-gray-400 font-bold">{formatDate(a.created_at)}</p>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* --- ARCHIVE CAROUSEL (Bottom Strip) --- */}
        <section className="mt-16 pt-10 border-t-4 border-black">
          <div className="flex items-center justify-between mb-8 border-b border-gray-300 pb-4">
            <h2 className="font-sans font-bold text-[12px] uppercase tracking-widest text-black flex items-center gap-2">
              <BookOpen size={16} /> From The Archives
            </h2>
            <div className="flex gap-2">
              <button onClick={() => scrollRef.current.scrollBy({left: -320, behavior: 'smooth'})} className="p-2 border border-gray-300 hover:bg-black hover:text-white transition-colors text-black"><ChevronLeft size={16}/></button>
              <button onClick={() => scrollRef.current.scrollBy({left: 320, behavior: 'smooth'})} className="p-2 border border-gray-300 hover:bg-black hover:text-white transition-colors text-black"><ChevronRight size={16}/></button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex gap-8 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory">
            {filteredArticles.map((a) => (
              <div key={a.id} className="min-w-[280px] md:min-w-[300px] snap-start shrink-0">
                <Link to={`/article/${a.id}`} className="block group">
                  <div className="aspect-[16/10] overflow-hidden bg-gray-200 mb-4 border border-gray-300">
                    <img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-700" alt="article" />
                  </div>
                  <span className="block text-[9px] font-sans uppercase tracking-widest text-black font-bold mb-2">{a.category}</span>
                  <h4 className="font-serif font-bold text-lg leading-tight group-hover:text-black transition-colors mb-2 line-clamp-2">{a.title}</h4>
                  <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">{formatDate(a.created_at)}</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* --- NEWSLETTER SUBSCRIPTION --- */}
        <section className="bg-white border-2 border-black p-10 md:p-16 text-center my-16 max-w-4xl mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-lg mx-auto space-y-6">
            <Newspaper size={40} className="mx-auto text-black" strokeWidth={1.5} />
            <h2 className="text-3xl md:text-4xl font-serif font-black text-black leading-tight">Subscribe to the Edition</h2>
            <p className="font-serif text-gray-600 text-lg">Receive the weekly digest of campus news directly to your inbox, free of charge.</p>
            <div className="flex flex-col sm:flex-row gap-0 pt-6">
              <input 
                type="email" 
                placeholder="Enter your campus email" 
                className="grow border-2 border-black px-6 py-4 font-sans font-bold text-black text-[11px] tracking-widest outline-none focus:bg-gray-50 placeholder:text-gray-400 placeholder:font-normal" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <button className="bg-black text-white border-2 border-black border-l-0 px-8 py-4 font-sans font-bold uppercase text-[11px] tracking-widest hover:bg-transparent hover:text-black transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- COOKIE CONSENT --- */}
      {showCookies && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t-2 border-black bg-white shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4 text-black">
              <ShieldCheck size={24} className="shrink-0" />
              <p className="text-[11px] font-sans uppercase tracking-widest font-bold leading-relaxed">
                By continuing to read The Binary Bulletin, you consent to our use of cookies for analytics and editorial insights.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <button onClick={() => setShowCookies(false)} className="text-[10px] font-sans uppercase font-bold text-gray-500 hover:text-black tracking-widest px-4">Decline</button>
               <button onClick={handleAcceptCookies} className="grow md:grow-0 bg-black text-white px-8 py-3 text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-black transition-colors whitespace-nowrap border border-black">Accept</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}