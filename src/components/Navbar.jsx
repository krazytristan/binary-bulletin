import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X, Menu, Calendar, Bell, FileText, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase"; 

const navLinks = [
  { name: "Home", path: "/" },
  { name: "News", path: "/news" },
  { name: "The Binary Online", path: "/thebinar" }, 
  { name: "Gallery", path: "/gallery" },
  { name: "Events", path: "/events" },
  { name: "Announcements", path: "/announcements" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    setShowResults(true);
    try {
      const [news, events, announcements] = await Promise.all([
        supabase.from("articles").select("id, title").ilike("title", `%${searchQuery}%`).limit(5),
        supabase.from("events").select("id, title").ilike("title", `%${searchQuery}%`).limit(3),
        supabase.from("announcements").select("id, title").ilike("title", `%${searchQuery}%`).limit(3)
      ]);

      const combined = [
        ...(news.data || []).map(i => ({ 
          ...i, 
          category: "News", 
          icon: <FileText size={14}/>, 
          link: `/article/${i.id}` 
        })),
        ...(events.data || []).map(i => ({ 
          ...i, 
          category: "Event", 
          icon: <Calendar size={14}/>, 
          link: `/events` 
        })),
        ...(announcements.data || []).map(i => ({ 
          ...i, 
          category: "Notice", 
          icon: <Bell size={14}/>, 
          link: `/announcements` 
        }))
      ];
      setResults(combined);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigate = (path) => {
    setShowResults(false);
    setSearchQuery("");
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-primary/95 text-white shadow-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-4">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img src="/binary-logo.png" alt="Logo" className="h-9 w-9 object-contain" />
          <h1 className="font-bold text-lg hidden lg:block text-light uppercase">Binary Bulletin</h1>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className="relative group py-2">
              <span className={`transition-colors ${location.pathname === link.path ? "text-secondary font-semibold" : "text-light hover:text-secondary"}`}>
                {link.name}
              </span>
              <span className={`absolute left-0 bottom-0 h-[2px] bg-secondary transition-all ${location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"}`}></span>
            </Link>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative flex-1 max-w-[180px] xs:max-w-[220px] sm:max-w-xs ml-auto lg:ml-0" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Live search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setShowResults(true)}
              className="w-full bg-white/10 border border-white/20 rounded-full py-1.5 pl-4 pr-10 text-xs sm:text-sm text-light placeholder:text-light/40 outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-light/50">
              {isSearching ? <Loader2 size={16} className="animate-spin text-secondary" /> : <Search size={16} />}
            </div>
          </div>

          {/* UPDATED RESULTS DROPDOWN (GLASSMORPISM) */}
          {showResults && searchQuery.length > 1 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/20">
                {results.length > 0 ? (
                  results.map((res, index) => (
                    <button 
                      key={index} 
                      onClick={() => handleNavigate(res.link)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl transition-colors border-b border-white/5 last:border-0 text-left group"
                    >
                      <div className="p-2 bg-white/10 text-secondary group-hover:bg-secondary group-hover:text-primary rounded-lg transition-colors">
                        {res.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{res.title}</p>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest">{res.category}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  !isSearching && (
                    <div className="text-center py-8">
                      <p className="text-xs text-white/40 italic">No matches found</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <button className="lg:hidden p-2 text-light" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-screen border-t border-white/5" : "max-h-0"}`}>
        <div className="px-6 py-4 space-y-1 bg-primary">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} className={`block py-3.5 px-3 rounded-xl ${location.pathname === link.path ? "text-secondary font-bold bg-white/10" : "text-light hover:bg-white/5"}`}>
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}