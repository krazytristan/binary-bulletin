import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { 
  Search, TrendingUp, Calendar, Clock, ArrowRight, Zap, 
  CloudSun, MapPin, Users, BookOpen, ChevronRight,
  MessageSquare, Newspaper, Award, Quote, PenTool,
  ShieldCheck, X, ChevronLeft, User
} from "lucide-react";

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

  const stages = [
    "Connecting to Archives...",
    "Syncing Database...",
    "Fetching Latest Headlines...",
    "Rendering Editorial Layout...",
    "Finalizing Edition..."
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingStage(0);
      
      const stageInterval = setInterval(() => {
        setLoadingStage(prev => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 500);

      // Fetch Articles, Announcements, and Events in parallel
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

  const headlines = useMemo(() => {
    return articles?.slice(0, 5).map(a => a.title) || [];
  }, [articles]);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    }) : "";

  if (loading) return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xs w-full space-y-8 text-center font-sans">
        <div className="relative inline-block">
          <div className="w-24 h-24 border-2 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 w-24 h-24 border-t-4 border-[#1E3A8A] rounded-full animate-spin"></div>
          <Newspaper className="absolute inset-0 m-auto text-[#1E3A8A]" size={32} />
        </div>
        <div className="space-y-4">
          <h2 className="font-black tracking-tighter text-3xl uppercase text-[#1E3A8A]">The Binary Bulletin</h2>
          <div className="h-1.5 bg-gray-100 w-full rounded-full overflow-hidden relative">
            <div 
              className="absolute inset-y-0 left-0 bg-[#1E3A8A] transition-all duration-700 ease-in-out"
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
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#1E3A8A] selection:text-white overflow-x-hidden antialiased">
      <Navbar />

      {/* --- TOP STATUS BAR --- */}
      <div className="bg-[#1E3A8A] text-white py-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1"><MapPin size={12}/> Lipa City, PH</span>
            <span className="flex items-center gap-1 hidden md:flex"><CloudSun size={12}/> 29°C Partly Cloudy</span>
            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1 hidden sm:flex"><Users size={12}/> 1,240 Readers</span>
            <span>● Vol. 2026 — Ed. 04</span>
          </div>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-[#1E3A8A]">
        <div className="absolute inset-0">
          <img src="ama-bg.jpg" className="w-full h-full object-cover opacity-50 grayscale" alt="Campus"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A]/60 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-white">
          <div className="max-w-2xl space-y-4">
             <div className="inline-block bg-[#F59E0B] px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] mb-4">● Digital Premiere Edition</div>
             <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] tracking-tighter mb-6 uppercase">THE<br/>BINARY BULLETIN</h1>
             <p className="text-xl text-white/90 font-medium leading-relaxed border-l-4 border-[#F59E0B] pl-6 max-w-lg italic">Decoding stories, campus updates, and technological breakthroughs for the modern student.</p>
             <div className="flex flex-wrap gap-4 pt-8">
               <Link to="/news" className="bg-white text-[#1E3A8A] px-8 py-4 rounded-none font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#F59E0B] hover:text-white transition-all">Browse Archive</Link>
               <div className="relative flex-grow max-w-xs">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                 <input type="text" placeholder="SEARCH HEADLINES..." className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-none py-4 pl-12 pr-4 text-white outline-none placeholder:text-white/30 text-[10px] font-black tracking-widest" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- TICKER --- */}
      <div className="bg-black text-white py-3 overflow-hidden whitespace-nowrap border-y border-black">
        <div className="flex animate-marquee gap-12 items-center font-sans text-[11px] font-black uppercase tracking-[0.2em]">
          {[1, 2].map((set) => (
            <div key={set} className="flex gap-12 items-center">
              {headlines.length > 0 ? headlines.map((text, index) => (
                <span key={index} className="flex items-center gap-3"><Zap size={14} className="text-[#F59E0B]" fill="currentColor"/> {text}</span>
              )) : <span className="flex items-center gap-2 italic"><Zap size={14} className="text-[#F59E0B]" fill="currentColor"/> Syncing Archive...</span>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-18">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          {/* COLUMN 1: EDITORIAL & VOICES */}
          <div className="lg:col-span-3 space-y-10 border-r border-black/10 pr-10 hidden lg:block">
            <div className="bg-[#FDFDFB] p-6 border border-black/10">
                <div className="flex items-center gap-2 mb-4 text-[#1E3A8A]"><Quote size={20} fill="currentColor"/><h2 className="font-black uppercase text-[10px] tracking-[0.3em]">Editorial</h2></div>
                {categorized.editorial[0] && (
                  <Link to={`/article/${categorized.editorial[0].id}`} className="group block">
                     <h3 className="font-serif text-xl font-bold leading-tight mb-2 group-hover:text-[#1E3A8A] transition-colors">{categorized.editorial[0].title}</h3>
                     <p className="text-[11px] text-gray-500 line-clamp-3 italic mb-4">"{categorized.editorial[0].excerpt}"</p>
                     <div className="flex items-center gap-2 mb-4">
                        <img src={categorized.editorial[0].author_image || `https://ui-avatars.com/api/?name=Staff`} className="w-6 h-6 rounded-full grayscale border border-black/10" alt="author"/>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{categorized.editorial[0].author_name || "Chief Editor"}</span>
                     </div>
                     <span className="text-[10px] font-black uppercase text-[#1E3A8A] border-b-2 border-[#1E3A8A] pb-1 tracking-widest">Read More</span>
                  </Link>
                )}
            </div>

            <div className="space-y-6">
              <h2 className="font-black border-b border-black pb-1 text-[10px] uppercase tracking-[0.3em]">Voices</h2>
              {categorized.opinion.slice(0, 4).map(a => (
                <Link key={a.id} to={`/article/${a.id}`} className="block group border-b border-black/5 pb-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 border border-black/5 overflow-hidden">
                      <img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Thumbnail" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold leading-tight group-hover:text-[#1E3A8A] transition-colors mb-1 text-sm uppercase tracking-tight truncate">{a.title}</h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 italic mb-2">"{a.excerpt}"</p>
                      <div className="flex items-center gap-2">
                        <img src={a.author_image || `https://ui-avatars.com/api/?name=${a.author_name}`} className="w-4 h-4 rounded-full grayscale" alt="author" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">By {a.author_name || "Staff"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CAMPUS ANNOUNCEMENTS */}
            <div className="space-y-6 pt-10">
              <h2 className="font-black border-b border-black pb-1 text-[10px] uppercase flex items-center gap-2 tracking-[0.3em]">
                <Newspaper size={14} className="text-[#F59E0B]"/> Bulletins
              </h2>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-gray-50 border-l-2 border-[#1E3A8A]">
                    <span className="text-[8px] font-black uppercase text-[#1E3A8A] tracking-widest block mb-1">{ann.category || "Official"}</span>
                    <h4 className="text-[11px] font-black uppercase leading-tight mb-1">{ann.title}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{ann.content}"</p>
                  </div>
                ))}
                <Link to="/announcements" className="text-[9px] font-black uppercase text-[#1E3A8A] flex items-center gap-1 hover:gap-2 transition-all">
                  View All Bulletins <ChevronRight size={12}/>
                </Link>
              </div>
            </div>

            {/* UPCOMING EVENTS */}
            <div className="space-y-6 pt-10">
              <h2 className="font-black border-b border-black pb-1 text-[10px] uppercase flex items-center gap-2 tracking-[0.3em]">
                <Calendar size={14} className="text-[#F59E0B]"/> Registry
              </h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black text-white flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black leading-none">{new Date(event.event_date).getDate()}</span>
                        <span className="text-[7px] uppercase font-bold">{new Date(event.event_date).toLocaleDateString('en-US', {month: 'short'})}</span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase leading-tight group-hover:text-[#1E3A8A] transition-colors">{event.title}</h4>
                        <div className="flex items-center gap-2 text-[8px] text-gray-400 font-bold uppercase mt-1">
                          <Clock size={10}/> {event.event_time || "TBA"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/events" className="text-[9px] font-black uppercase text-[#1E3A8A] flex items-center gap-1 hover:gap-2 transition-all pt-2 block">
                  Operational Schedule <ChevronRight size={12}/>
                </Link>
              </div>
            </div>
          </div>

          {/* COLUMN 2: LEAD STORY */}
          <div className="lg:col-span-6 space-y-8">
            <h2 className="uppercase tracking-[0.5em] font-black text-[9px] text-[#F59E0B]">Featured Narrative</h2>
            {featured && (
              <Link to={`/article/${featured.id}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden border border-black/10 mb-6 bg-gray-100">
                  <img src={featured.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt="Lead"/>
                  <div className="absolute top-4 left-4 bg-black text-white font-black text-[8px] px-2 py-0.5 uppercase tracking-[0.2em]">Front Page</div>
                </div>
                <h2 className="text-2xl md:text-4xl font-black leading-[1.1] tracking-tighter mb-4 group-hover:text-[#1E3A8A] transition-colors uppercase">{featured.title}</h2>
                <p className="text-gray-500 text-base leading-relaxed line-clamp-3 font-medium italic mb-6">"{featured.excerpt}"</p>
                <div className="flex items-center justify-between border-t border-black/5 pt-6">
                  <div className="flex items-center gap-3">
                    <img src={featured.author_image || `https://ui-avatars.com/api/?name=${featured.author_name}`} className="w-10 h-10 rounded-full border border-black/10 grayscale" alt="author"/>
                    <div>
                      <p className="text-[10px] font-black uppercase text-black tracking-widest">{featured.author_name || "Journal Staff"}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(featured.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#1E3A8A] font-black text-[9px] uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                    Full Coverage <ArrowRight size={14}/>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* COLUMN 3: THE LATEST INDEX */}
          <div className="lg:col-span-3 border-l border-black/10 pl-10 space-y-8">
            <h2 className="font-black border-b border-black pb-1 text-[10px] uppercase flex items-center gap-2 tracking-[0.3em]"><TrendingUp size={14}/> Recent</h2>
            <div className="divide-y divide-black/5">
              {articles.slice(1, 6).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="py-6 block group">
                  <span className="text-[8px] font-black text-[#1E3A8A] uppercase tracking-[0.3em]">{a.category}</span>
                  <h4 className="font-black text-xs uppercase leading-tight group-hover:text-[#F59E0B] transition-colors mb-2 tracking-tight">{a.title}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 italic mb-3">"{a.excerpt}"</p>
                  <div className="flex items-center gap-2">
                    <img src={a.author_image || `https://ui-avatars.com/api/?name=${a.author_name}`} className="w-4 h-4 rounded-full grayscale" alt="av"/>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{a.author_name || "Staff"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* --- ARCHIVE CAROUSEL --- */}
        <section className="mb-22 pt-12 border-t border-black/10 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-400">Archives Carousel</h2>
            <div className="flex gap-2">
              <button onClick={() => scrollRef.current.scrollBy({left: -320, behavior: 'smooth'})} className="p-2 border border-black/10 hover:bg-black hover:text-white transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={() => scrollRef.current.scrollBy({left: 320, behavior: 'smooth'})} className="p-2 border border-black/10 hover:bg-black hover:text-white transition-colors"><ChevronRight size={16}/></button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
            {articles.map((a) => (
              <Link key={a.id} to={`/article/${a.id}`} className="min-w-[280px] md:min-w-[320px] group block">
                <div className="aspect-[16/9] overflow-hidden mb-4 bg-gray-100 border border-black/10">
                  <img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="article" />
                </div>
                <h4 className="font-black text-xs uppercase leading-tight group-hover:text-[#1E3A8A] mb-2 line-clamp-1 tracking-tight">{a.title}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2 italic mb-3">"{a.excerpt}"</p>
                <div className="flex items-center justify-between border-t border-black/5 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden grayscale border border-black/5"><img src={a.author_image || `https://ui-avatars.com/api/?name=${a.author_name}`} alt="auth" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-black">{a.author_name}</span>
                  </div>
                  <span className="text-[8px] font-bold text-gray-300 uppercase">{formatDate(a.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- CATEGORIES & LITERARY --- */}
        <div className="grid lg:grid-cols-2 gap-12 mb-22">
          <section className="pt-12 border-t-4 border-black">
            <h2 className="text-3xl font-black uppercase text-[#1E3A8A] flex items-center gap-3 mb-8 tracking-tighter"><PenTool size={24} className="text-[#F59E0B]" /> Opinion</h2>
            <div className="space-y-8">
              {categorized.opinion.slice(0, 3).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="flex gap-4 group">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-50 overflow-hidden border border-black/10"><img src={a.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="op" /></div>
                  <div className="flex-grow">
                    <h4 className="font-black text-sm uppercase leading-tight group-hover:text-[#F59E0B] transition-colors">{a.title}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 italic">"{a.excerpt}"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={a.author_image || `https://ui-avatars.com/api/?name=Staff`} className="w-5 h-5 rounded-full grayscale border border-black/5" alt="auth"/>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">{a.author_name || "Columnist"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="pt-12 border-t-4 border-black">
            <h2 className="text-3xl font-black uppercase text-[#1E3A8A] flex items-center gap-3 mb-8 tracking-tighter"><BookOpen size={24} className="text-[#F59E0B]" /> Literary</h2>
            <div className="grid grid-cols-2 gap-4">
              {categorized.literary.slice(0, 2).map((a) => (
                <Link key={a.id} to={`/article/${a.id}`} className="relative aspect-[4/5] overflow-hidden group bg-black">
                  <img src={a.image_url} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt="lit" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 p-6 w-full">
                    <h4 className="text-white font-black text-sm mb-1 leading-tight uppercase tracking-tight">{a.title}</h4>
                    <p className="text-[10px] text-white/60 line-clamp-2 italic mb-3">"{a.excerpt}"</p>
                    <div className="flex items-center gap-2">
                      <img src={a.author_image || `https://ui-avatars.com/api/?name=Staff`} className="w-4 h-4 rounded-full grayscale border border-white/20" alt="av" />
                      <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">{a.author_name || "Contributor"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* --- NEWSLETTER --- */}
        <section className="bg-white border-4 border-black p-8 md:p-22 text-center my-22 relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <Newspaper size={48} className="mx-auto text-[#1E3A8A]" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Stay Wired.</h2>
            <p className="font-medium text-gray-600 italic text-base md:text-lg">Get the Binary digest delivered to your campus inbox.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 mt-8">
              <input 
                type="email" 
                placeholder="CAMPUS EMAIL..." 
                className="flex-grow border-2 border-black px-6 py-4 rounded-none font-black text-[10px] tracking-widest outline-none focus:bg-gray-50 sm:border-r-0" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <button className="bg-black text-white px-10 py-4 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#1E3A8A] transition-colors whitespace-nowrap">
                Join Archive
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- COOKIE CONSENT --- */}
      {showCookies && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100] animate-slide-up">
          <div className="bg-black text-white p-6 rounded-none shadow-2xl border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck className="text-[#F59E0B]" size={16} /> Data Protocol</h3>
              <button onClick={() => setShowCookies(false)} className="text-white/40 hover:text-white"><X size={16} /></button>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-black uppercase tracking-widest">We utilize telemetry to enhance this digital edition. By access, you accept our Privacy Policy.</p>
            <button onClick={handleAcceptCookies} className="w-full bg-[#1E3A8A] text-white text-[10px] font-black uppercase py-3 hover:bg-[#F59E0B] transition-all tracking-[0.3em]">Accept & Proceed</button>
          </div>
        </div>
      )}

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: fit-content; animation: marquee 40s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}