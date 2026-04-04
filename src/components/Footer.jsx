import { Link } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";

<FaFacebook />

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-12">

      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8">

        {/* 📰 BRAND */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/binary-logo.png"
              alt="Binary Bulletin"
              className="h-10"
            />
            <h2 className="text-lg font-bold">
              The Binary Bulletin
            </h2>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            Official campus publication of AMA Computer College Lipa,
            delivering news, events, and student voices through digital journalism.
          </p>

            {/* 🌐 SOCIAL */}
            <div className="flex gap-4 mt-4">

            <a
            href="https://web.facebook.com/profile.php?id=61581010768762"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary transition flex items-center gap-2"
            >
            {/* FACEBOOK SVG */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.891h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.891h-2.33V21.88C18.343 21.13 22 16.991 22 12z"/>
            </svg>

            <span className="text-sm">Facebook</span>
            </a>

            </div>
        </div>

        {/* 🔗 QUICK LINKS */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>

          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/news" className="hover:text-white">News</Link></li>
            <li><Link to="/events" className="hover:text-white">Events</Link></li>
            <li><Link to="/announcements" className="hover:text-white">Announcements</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        {/* 📞 CONTACT */}
        <div>
          <h3 className="font-semibold mb-3">Contact</h3>

          <div className="space-y-2 text-sm text-gray-400">
            <p>AMA Computer College Lipa</p>
            <p>binarybulletin@ama.edu.ph</p>
            <p>+63 900 000 0000</p>
          </div>
        </div>

        {/* 🌍 SDGs */}
        <div>
          <h3 className="font-semibold mb-3">
            Sustainable Development Goals
          </h3>

          <div className="grid grid-cols-4 gap-2">

            {/* SDG 4 */}
            <a
              href="https://sdgs.un.org/goals/goal4"
              target="_blank"
              rel="noopener noreferrer"
              title="Quality Education"
            >
              <img
                src="/sdg4.png"
                alt="SDG 4"
                className="h-10 object-contain hover:scale-110 transition"
              />
            </a>

            {/* SDG 8 */}
            <a
              href="https://sdgs.un.org/goals/goal8"
              target="_blank"
              rel="noopener noreferrer"
              title="Decent Work and Economic Growth"
            >
              <img
                src="/sdg8.webp"
                alt="SDG 8"
                className="h-10 object-contain hover:scale-110 transition"
              />
            </a>

            {/* SDG 9 */}
            <a
              href="https://sdgs.un.org/goals/goal9"
              target="_blank"
              rel="noopener noreferrer"
              title="Industry, Innovation and Infrastructure"
            >
              <img
                src="/sdg9.jpeg"
                alt="SDG 9"
                className="h-10 object-contain hover:scale-110 transition"
              />
            </a>

            {/* SDG 16 */}
            <a
              href="https://sdgs.un.org/goals/goal16"
              target="_blank"
              rel="noopener noreferrer"
              title="Peace, Justice and Strong Institutions"
            >
              <img
                src="/sdg16.webp"
                alt="SDG 16"
                className="h-10 object-contain hover:scale-110 transition"
              />
            </a>

          </div>

          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            This platform supports global goals on education, innovation,
            and strong institutions.
          </p>
        </div>

      </div>

      {/* 🔻 BOTTOM */}
      <div className="border-t border-gray-700 text-center py-4 text-sm text-gray-400">
        © {new Date().getFullYear()} The Binary Bulletin. All rights reserved.
      </div>

    </footer>
  );
}