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
    <nav className="sticky top-0 z-50 bg-[#FCFBF9] text-[#111827] font-sans border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src="/binary-logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <h1 className="font-serif font-black text-xl hidden lg:block uppercase tracking-tight">The Binary Bulletin</h1>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className="relative group py-2">
              <span className={`transition-colors ${location.pathname === link.path ? "text-[#1E3A8A]" : "text-gray-600 hover:text-black"}`}>
                {link.name}
              </span>
              <span className={`absolute left-0 bottom-0 h-[2px] bg-black transition-all ${location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"}`}></span>
            </Link>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative flex-1 max-w-[180px] xs:max-w-[220px] sm:max-w-xs ml-auto lg:ml-0" ref={searchRef}>
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setShowResults(true)}
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-4 pr-10 text-[10px] font-bold uppercase tracking-widest text-[#111827] placeholder:text-gray-400 outline-none focus:border-[#1E3A8A] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E3A8A]">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
          </div>

          {/* RESULTS DROPDOWN */}
          {showResults && searchQuery.length > 1 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-black/10">
                {results.length > 0 ? (
                  results.map((res, index) => (
                    <button 
                      key={index} 
                      onClick={() => handleNavigate(res.link)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left group"
                    >
                      <div className="text-gray-400 group-hover:text-[#1E3A8A] transition-colors">
                        {res.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-serif font-bold text-[#111827] truncate">{res.title}</p>
                        <p className="text-[9px] font-sans text-[#1E3A8A] uppercase tracking-widest font-bold">{res.category}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  !isSearching && (
                    <div className="text-center py-8">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No matches found</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <button className="lg:hidden p-2 text-black" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-screen border-t-2 border-black" : "max-h-0"}`}>
        <div className="px-6 py-4 space-y-1 bg-white">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} className={`block py-3.5 px-3 border-b border-gray-100 last:border-0 text-[11px] font-bold uppercase tracking-widest ${location.pathname === link.path ? "text-[#1E3A8A]" : "text-gray-600 hover:text-black"}`}>
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}