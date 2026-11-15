import { useState, useEffect, useRef, useCallback } from "react";
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
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowResults(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const performSearch = useCallback(async (query) => {
    setIsSearching(true);
    setShowResults(true);
    try {
      const [news, events, announcements] = await Promise.all([
        supabase.from("articles").select("id, title, category").ilike("title", `%${query}%`).limit(5),
        supabase.from("events").select("id, title").ilike("title", `%${query}%`).limit(3),
        supabase.from("announcements").select("id, title").ilike("title", `%${query}%`).limit(3),
      ]);

      const combined = [
        ...(news.data || []).map((i) => ({
          ...i,
          category: i.category || "News",
          icon: <FileText size={14} />,
          link: `/article/${i.id}`,
        })),
        ...(events.data || []).map((i) => ({
          ...i,
          category: "Campus Event",
          icon: <Calendar size={14} />,
          link: `/events?id=${i.id}`,
        })),
        ...(announcements.data || []).map((i) => ({
          ...i,
          category: "Official Notice",
          icon: <Bell size={14} />,
          link: `/announcements?id=${i.id}`,
        })),
      ];
      setResults(combined);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    const delayDebounceFn = setTimeout(() => {
      if (trimmed.length > 1) {
        performSearch(trimmed);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performSearch]);

  const handleNavigate = (path) => {
    setShowResults(false);
    setSearchQuery("");
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <nav
      aria-label="Primary Navigation"
      className="sticky top-0 z-50 bg-blue-900 text-white font-sans border-b-4 border-blue-950 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/binary-logo.png"
            alt="The Binary Bulletin logo"
            className="h-9 w-9 object-contain bg-white rounded-full p-0.5 border border-blue-800"
          />
          <div className="hidden lg:block leading-tight">
            <span className="block font-serif font-black text-lg uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
              The Binary Bulletin
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200">
              AMA Computer College Lipa Campus
            </span>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden xl:flex items-center gap-5 text-[11px] font-semibold uppercase tracking-wider">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);
            return (
              <Link key={link.path} to={link.path} className="relative group py-2 whitespace-nowrap">
                <span
                  className={`transition-colors ${
                    isActive ? "text-amber-400" : "text-blue-100 hover:text-white"
                  }`}
                >
                  {link.name}
                </span>
                <span
                  className={`absolute left-0 bottom-0 h-[2px] bg-amber-400 transition-all ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            );
          })}
        </div>

        {/* SEARCH BAR */}
        <div
          className="relative flex-1 max-w-[210px] sm:max-w-[240px] ml-auto xl:ml-0"
          ref={searchRef}
        >
          <div className="relative group">
            <input
              type="text"
              aria-label="Search publication archives"
              placeholder="Search publication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 1 && setShowResults(true)}
              className="w-full bg-blue-950 border border-blue-800 rounded-none py-2 pl-3.5 pr-9 text-xs font-medium text-white placeholder:text-blue-300 outline-none focus:border-amber-400 focus:bg-blue-900 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-amber-400 pointer-events-none">
              {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            </div>
          </div>

          {/* RESULTS DROPDOWN */}
          {showResults && searchQuery.trim().length > 1 && (
            <div className="absolute top-full mt-2 left-0 right-0 sm:min-w-[290px] bg-white border-2 border-blue-900 shadow-xl overflow-hidden z-50">
              <div className="max-h-[340px] overflow-y-auto p-2 custom-scrollbar">
                {results.length > 0 ? (
                  results.map((res, index) => (
                    <button
                      key={`${res.category}-${res.id || index}`}
                      type="button"
                      onClick={() => handleNavigate(res.link)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left group"
                    >
                      <div className="text-gray-400 group-hover:text-blue-900 transition-colors mt-0.5 shrink-0">
                        {res.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-serif font-bold text-gray-900 line-clamp-2 leading-snug">
                          {res.title}
                        </p>
                        <p className="text-[10px] font-sans text-red-900 uppercase tracking-wider font-bold mt-1">
                          {res.category}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  !isSearching && (
                    <div className="text-center py-6 px-3">
                      <p className="text-xs font-serif italic text-gray-500">
                        No articles, notices, or events matched "{searchQuery}".
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="xl:hidden p-2 text-white hover:text-amber-400 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE & TABLET MENU */}
      <div
        className={`xl:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-[520px] border-t-2 border-blue-800 bg-blue-900" : "max-h-0 bg-blue-900"
        }`}
      >
        <div className="px-4 py-2 space-y-0.5">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block py-3.5 px-4 border-b border-blue-800 last:border-0 text-xs font-bold uppercase tracking-widest ${
                  isActive ? "text-amber-400" : "text-blue-100 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
