import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {

  // 🔥 Animated Stats
  const [counts, setCounts] = useState({
    articles: 0,
    writers: 0,
    years: 0,
  });

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 5;

      setCounts({
        articles: Math.min(start, 12),
        writers: Math.min(start / 2, 2),
        years: Math.min(start / 10, 0),
      });

      if (start >= 120) clearInterval(interval);
    }, 30);
  }, []);

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔷 HEADER */}
      <section className="bg-primary text-white py-16 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          About The Binary Bulletin
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Official Campus Publication of AMA Computer College Lipa
        </p>
      </section>

      <div className="max-w-6xl mx-auto p-6 space-y-12">

        {/* 📖 OVERVIEW */}
        <section className="bg-white p-8 rounded-xl shadow-card">
          <h2 className="text-xl font-bold text-dark mb-4">Overview</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            The Binary Bulletin is the official campus publication of AMA Computer College Lipa.
            It serves as a platform for delivering campus news, student stories,
            and academic updates while promoting responsible journalism and digital innovation.
          </p>
        </section>

        {/* 📊 STATS */}
        <section className="grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="text-3xl font-bold text-primary">
              {Math.floor(counts.articles)}+
            </h3>
            <p className="text-gray-500 text-sm mt-2">Articles Published</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="text-3xl font-bold text-primary">
              {Math.floor(counts.writers)}+
            </h3>
            <p className="text-gray-500 text-sm mt-2">Student Writers</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-card">
            <h3 className="text-3xl font-bold text-primary">
              {Math.floor(counts.years)}+
            </h3>
            <p className="text-gray-500 text-sm mt-2">Years of Service</p>
          </div>
        </section>

        {/* 🕰 TIMELINE */}
        <section className="bg-white p-8 rounded-xl shadow-card">
          <h2 className="text-xl font-bold text-dark mb-6">History & Timeline</h2>

          <div className="space-y-6 border-l-2 border-primary pl-6">

            <div>
              <p className="text-sm text-gray-400">2025</p>
              <h3 className="font-semibold text-dark">
                Establishment of The Binary Bulletin
              </h3>
              <p className="text-sm text-gray-600">
                The publication was founded to serve as the official voice of students.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">2026 Facebook</p>
              <h3 className="font-semibold text-dark">
                Digital Platform Launch
              </h3>
              <p className="text-sm text-gray-600">
                Transitioned from print to a modern web-based publication system.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">2026 Present</p>
              <h3 className="font-semibold text-dark">
                Expansion of Editorial Team
              </h3>
              <p className="text-sm text-gray-600">
                Increased participation of student writers and contributors.
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">2026 Coming Soon!</p>
              <h3 className="font-semibold text-dark">
                Full Digital Transformation
              </h3>
              <p className="text-sm text-gray-600">
                Implementation of a cloud-based publication system.
              </p>
            </div>

          </div>
        </section>

        {/* 🏆 ACHIEVEMENTS */}
        <section className="bg-white p-8 rounded-xl shadow-card">
          <h2 className="text-xl font-bold text-dark mb-4">Achievements</h2>

          <ul className="space-y-3 text-sm text-gray-600">
            <li>• Recognized as official campus publication of AMA Lipa</li>
            <li>• Successfully launched a fully digital news platform</li>
            <li>• Engaged hundreds of students through journalism programs</li>
            <li>• Produced consistent campus-wide news coverage</li>
          </ul>
        </section>

        {/* 🎯 MISSION & VISION */}
        <section className="grid md:grid-cols-2 gap-6">

          <div className="bg-white p-8 rounded-xl shadow-card">
            <h3 className="font-bold text-lg text-dark mb-3">Mission</h3>
            <p className="text-gray-600 text-sm">
              To provide accurate, relevant, and timely information while fostering
              responsible journalism and student engagement.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-card">
            <h3 className="font-bold text-lg text-dark mb-3">Vision</h3>
            <p className="text-gray-600 text-sm">
              To become a leading campus publication that upholds excellence,
              integrity, and innovation in digital journalism.
            </p>
          </div>

        </section>

      </div>

      <Footer />
    </div>
  );
}