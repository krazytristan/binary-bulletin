import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

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
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-primary/95 text-white shadow-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        
        {/* 🔷 LOGO */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="/binary-logo.png"
            alt="Binary Bulletin Logo"
            className="h-10 w-10 object-contain"
          />
          <h1 className="font-bold text-lg tracking-wide hidden sm:block text-light">
            Binary Bulletin
          </h1>
        </Link>

        {/* 🖥 DESKTOP MENU */}
        <div className="hidden md:flex gap-8 text-sm">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative group py-2"
              >
                <span
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-secondary font-semibold"
                      : "text-light hover:text-secondary"
                  }`}
                >
                  {link.name}
                </span>

                {/* 🔥 UNDERLINE ANIMATION (using secondary) */}
                <span
                  className={`absolute left-0 bottom-0 h-[2px] bg-secondary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            );
          })}
        </div>

        {/* 📱 MOBILE BUTTON */}
        <button
          className="md:hidden text-2xl p-2 focus:outline-none flex items-center justify-center text-light hover:text-secondary transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* 📱 MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-[100vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-primary border-t border-white/5 px-6 py-4 space-y-1 shadow-inner">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block py-4 px-3 transition-all duration-200 rounded-xl ${
                  isActive
                    ? "text-secondary font-bold bg-white/10"
                    : "text-light hover:text-secondary hover:bg-white/5"
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