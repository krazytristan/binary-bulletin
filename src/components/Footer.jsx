import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-blue-900 border-t-4 border-blue-950 text-white mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* BRAND */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/binary-logo.png"
              alt="Binary Bulletin"
              className="h-8 object-contain bg-white rounded-full p-0.5"
            />
            <h2 className="text-xl font-serif font-black uppercase tracking-tight text-white drop-shadow-sm">
              The Binary Bulletin
            </h2>
          </div>
          <p className="text-sm font-serif text-blue-100 leading-relaxed mb-6">
            The official independent campus publication of AMA Computer College Lipa.
          </p>
          <a
            href="https://web.facebook.com/profile.php?id=61581010768762"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.891h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562v1.875h2.773l-.443 2.891h-2.33V21.88C18.343 21.13 22 16.991 22 12z"/>
            </svg>
            Follow on Facebook
          </a>
        </div>

        {/* LINKS */}
        <div>
          <h3 className="font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-blue-800 pb-2 text-blue-200">Sections</h3>
          <ul className="space-y-3 text-sm font-serif text-blue-100">
            <li><Link to="/news" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Archive</Link></li>
            <li><Link to="/events" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Registry</Link></li>
            <li><Link to="/announcements" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Bulletins</Link></li>
            <li><Link to="/gallery" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Exhibits</Link></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-blue-800 pb-2 text-blue-200">Publisher</h3>
          <ul className="space-y-3 text-sm font-serif text-blue-100">
            <li><Link to="/about" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Masthead & Staff</Link></li>
            <li><Link to="/contact" className="hover:text-amber-400 hover:underline decoration-1 underline-offset-2">Letters to the Editor</Link></li>
            <li className="pt-2">Lipa City, Batangas</li>
            <li>binarybulletin@ama.edu.ph</li>
          </ul>
        </div>

        {/* SDGs */}
        <div>
          <h3 className="font-bold text-[10px] uppercase tracking-widest mb-6 border-b border-blue-800 pb-2 text-blue-200">Initiatives</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <a href="https://sdgs.un.org/goals/goal4" target="_blank" rel="noopener noreferrer"><img src="/sdg4.png" alt="SDG 4" className="h-8 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" /></a>
            <a href="https://sdgs.un.org/goals/goal8" target="_blank" rel="noopener noreferrer"><img src="/sdg8.webp" alt="SDG 8" className="h-8 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" /></a>
            <a href="https://sdgs.un.org/goals/goal9" target="_blank" rel="noopener noreferrer"><img src="/sdg9.jpeg" alt="SDG 9" className="h-8 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" /></a>
            <a href="https://sdgs.un.org/goals/goal16" target="_blank" rel="noopener noreferrer"><img src="/sdg16.webp" alt="SDG 16" className="h-8 object-contain hover:opacity-80 transition bg-white p-1 rounded-sm" /></a>
          </div>
          <p className="text-[11px] font-serif text-blue-200 leading-relaxed italic">
            Supporting global goals on education, innovation, and strong institutions through digital journalism.
          </p>
        </div>

      </div>

      <div className="border-t border-blue-950 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-blue-300">
        © {new Date().getFullYear()} The Binary Bulletin. All rights reserved.
      </div>
    </footer>
  );
}