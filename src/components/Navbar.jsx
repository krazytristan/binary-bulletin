import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "News", path: "/news" },
    { name: "Events", path: "/events" },
    { name: "Announcements", path: "/announcements" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-primary/90 text-white shadow-lg border-b border-white/10">

      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* 🔷 LOGO */}
        <div className="flex items-center gap-3">
          <img
            src="/binary-logo.png"
            alt="Binary Bulletin"
            className="h-10 w-10 object-contain"
          />
          <h1 className="font-bold text-lg tracking-wide hidden sm:block">
            Binary Bulletin
          </h1>
        </div>

        {/* 🖥 DESKTOP MENU */}
        <div className="hidden md:flex gap-8 text-sm">

          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <span
                  className={`transition ${
                    isActive
                      ? "text-secondary font-semibold"
                      : "hover:text-secondary"
                  }`}
                >
                  {link.name}
                </span>

                {/* 🔥 UNDERLINE ANIMATION */}
                <span
                  className={`absolute left-0 -bottom-1 h-[2px] bg-secondary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>
            );
          })}

        </div>

        {/* 📱 MOBILE BUTTON */}
        <button
          className="md:hidden text-2xl transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* 📱 MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="bg-primary/95 backdrop-blur-md px-6 pb-4 space-y-3">

          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 border-b border-white/10 transition ${
                  isActive
                    ? "text-secondary font-semibold"
                    : "hover:text-secondary"
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