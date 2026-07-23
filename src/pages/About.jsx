import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ articles: 0, writers: 0, years: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    let start = 0;
    const interval = setInterval(() => {
      start += 1;
      setCounts({
        articles: Math.min(start * 3, 45),
        writers: Math.min(start, 12),
        years: Math.min((start / 10).toFixed(1), 1.5),
      });
      if (start >= 50) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Institutional Record</p>
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter mb-8">Masthead</h1>
          <div className="w-24 h-1 bg-black mx-auto"></div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500">Retrieving records...</div>
        ) : (
          <div className="space-y-24">
            
            <section className="text-center">
              <h2 className="text-2xl font-serif font-black uppercase mb-6">Our Mission</h2>
              <p className="text-xl font-serif text-gray-600 leading-relaxed italic max-w-2xl mx-auto">
                "To empower the AMAer community by providing accurate, relevant, and timely information. 
                We are committed to fostering responsible journalism and providing a digital stage 
                where every student's voice can resonate with integrity and purpose."
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y-2 border-black">
              <div className="text-center">
                <div className="text-5xl font-serif font-black mb-2">{counts.articles}+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Publications</div>
              </div>
              <div className="text-center border-y md:border-y-0 md:border-x border-gray-200 py-6 md:py-0">
                <div className="text-5xl font-serif font-black mb-2">{counts.writers}+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Staff Personnel</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-serif font-black mb-2">{counts.years}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Years Active</div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-8 text-center">Historical Record</h2>
              <div className="space-y-12 max-w-2xl mx-auto">
                <div className="border-l-2 border-black pl-6">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">2025.01</div>
                  <h3 className="text-xl font-serif font-black uppercase mb-3">Institutional Genesis</h3>
                  <p className="font-serif text-gray-600 leading-relaxed">
                    The Binary Bulletin was officially established as the primary news medium for AMA Computer College Lipa. The initial phase focused on building a student-led newsroom dedicated to academic and campus integrity.
                  </p>
                </div>
                <div className="border-l-2 border-black pl-6">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">2026.01</div>
                  <h3 className="text-xl font-serif font-black uppercase mb-3">Digital Migration</h3>
                  <p className="font-serif text-gray-600 leading-relaxed">
                    The publication transitioned from traditional reporting to a modern digital ecosystem. This move allowed for real-time engagement and better information accessibility across the campus network.
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}