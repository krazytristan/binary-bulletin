import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X, Menu, Calendar, Bell, FileText, Loader2, Shield } from "lucide-react";
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef(null);
  const mobileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setShowResults(false);
  }, [location.pathname]);

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
        setMobileSearchOpen(false);
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
    setMobileSearchOpen(false);
    navigate(path);
  };

  return (
    <nav
      aria-label="Primary Navigation"
      className="sticky top-0 z-50 bg-blue-900 text-white font-sans border-b-4 border-blue-950 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center gap-2 sm:gap-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 group">
          <img
            src="/binary-logo.png"
            alt="The Binary Bulletin logo"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain bg-white rounded-full p-0.5 border border-blue-800 shrink-0"
          />
          <div className="leading-tight min-w-0">
            <span className="block font-serif font-black text-sm sm:text-base lg:text-lg uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors truncate">
              The Binary Bulletin
            </span>
            <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-200 truncate">
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

        {/* ACTIONS & SEARCH */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto xl:ml-0 shrink-0" ref={searchRef}>
          {/* DESKTOP & TABLET SEARCH BAR */}
          <div className="hidden sm:block relative w-48 md:w-56 lg:w-60">
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

            {showResults && searchQuery.trim().length > 1 && (
              <div className="absolute top-full mt-2 right-0 w-72 md:w-80 bg-white border-2 border-blue-900 shadow-xl overflow-hidden z-50">
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

          {/* NEWSROOM SIGN IN QUICK LINK (DESKTOP/TABLET) */}
          <Link
            to="/admin"
            title="Editorial Desk Login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-blue-700 bg-blue-950/60 text-[10px] font-bold uppercase tracking-wider text-blue-100 hover:text-amber-300 hover:border-amber-400 transition-colors whitespace-nowrap"
          >
            <Shield size={13} />
            <span className="hidden lg:inline">Newsroom</span>
          </Link>

          {/* MOBILE SEARCH TOGGLE (<640px) */}
          <button
            type="button"
            aria-label={mobileSearchOpen ? "Close search" : "Search archives"}
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              const next = !mobileSearchOpen;
              setMobileSearchOpen(next);
              setMenuOpen(false);
              if (next) setTimeout(() => mobileInputRef.current?.focus(), 60);
            }}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-amber-400 transition-colors"
          >
            {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* HAMBURGER MENU BUTTON */}
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            className="xl:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-amber-400 transition-colors"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setMobileSearchOpen(false);
            }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDABLE SEARCH BAR (<640px) */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-3 pt-1 border-t border-blue-800 bg-blue-950">
          <div className="relative">
            <input
              ref={mobileInputRef}
              type="text"
              aria-label="Search publication archives"
              placeholder="Search articles, events, notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-blue-900 border border-blue-700 rounded-none py-2.5 pl-3.5 pr-10 text-sm text-white placeholder:text-blue-300 outline-none focus:border-amber-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
          </div>

          {showResults && searchQuery.trim().length > 1 && (
            <div className="mt-2 bg-white border-2 border-blue-900 shadow-xl max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {results.length > 0 ? (
                results.map((res, index) => (
                  <button
                    key={`mobile-${res.category}-${res.id || index}`}
                    type="button"
                    onClick={() => handleNavigate(res.link)}
                    className="w-full flex items-start gap-3 p-3.5 hover:bg-gray-50 text-left min-h-[44px]"
                  >
                    <div className="text-gray-400 mt-0.5 shrink-0">{res.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif font-bold text-gray-900 line-clamp-2 leading-snug">
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
                  <p className="text-center py-5 px-3 text-xs font-serif italic text-gray-500">
                    No articles, notices, or events matched "{searchQuery}".
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* MOBILE & TABLET MENU */}
      <div
        className={`xl:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          menuOpen
            ? "max-h-[80vh] opacity-100 border-t-2 border-blue-800 bg-blue-900 overflow-y-auto"
            : "max-h-0 opacity-0 bg-blue-900 pointer-events-none"
        }`}
      >
        <div className="px-3 sm:px-6 py-2 divide-y divide-blue-800">
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
                className={`flex items-center justify-between min-h-[46px] px-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                  isActive ? "text-amber-400 bg-blue-950/40" : "text-blue-100 hover:text-white"
                }`}
              >
                <span>{link.name}</span>
                {isActive && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
              </Link>
            );
          })}
          <div className="py-3 px-3">
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full bg-amber-400 text-blue-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-300 transition-colors"
            >
              <Shield size={14} /> Editorial Desk Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
