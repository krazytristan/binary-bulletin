import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  // 🔥 Refined Animated Stats
  const [counts, setCounts] = useState({
    articles: 0,
    writers: 0,
    years: 0,
  });

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 1;

      setCounts({
        articles: Math.min(start * 3, 45), // Target: 45+
        writers: Math.min(start, 12),      // Target: 12+
        years: Math.min((start / 10).toFixed(1), 1.5), // Target: 1.5
      });

      if (start >= 50) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1a1a1a] font-sans selection:bg-yellow-200">
      <Navbar />

      {/* 🔷 NEWS-STYLE HERO SECTION */}
      <section className="bg-[#1E3A8A] text-white pt-28 pb-20 relative overflow-hidden">
        {/* Large background watermark */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[14rem] leading-none -bottom-10 -left-10">
          HISTORY
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-[#F59E0B] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                The Binary Bulletin
              </span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                Our Legacy, <br /> Your Voice.
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              The official campus publication of AMA Computer College Lipa, 
              bridging the gap between journalism and digital innovation.
            </p>
          </div>
        </div>
      </section>

      {/* STICKY STATUS BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">
            <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse"></span>
            Established 2025
          </div>
          <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Institutional Publication • AMA Lipa
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12 space-y-16">
        
        {/* 📊 STATS GRID */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 text-center group hover:border-[#F59E0B] transition-all">
            <div className="text-3xl mb-4">📖</div>
            <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              {counts.articles}+
            </h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Articles Published</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 text-center group hover:border-[#F59E0B] transition-all">
            <div className="text-3xl mb-4">✍️</div>
            <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              {counts.writers}+
            </h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Student Journalists</p>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 text-center group hover:border-[#F59E0B] transition-all">
            <div className="text-3xl mb-4">⏳</div>
            <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              {counts.years}
            </h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Years of Service</p>
          </div>
        </section>

        {/* 🎯 MISSION & VISION */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6 flex items-center gap-2">
                <span className="text-[#F59E0B]">⚡</span> Our Mission
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                To empower the AMAer community by providing accurate, relevant, and timely information. 
                We are committed to fostering responsible journalism and providing a digital stage 
                where every student's voice can resonate.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-3xl group-hover:bg-[#F59E0B]/10 transition-colors"></div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6 flex items-center gap-2">
                <span className="text-[#1E3A8A]">🚀</span> Our Vision
              </h2>
              <p className="text-gray-600 leading-relaxed font-medium">
                To be the premier digital news authority in the AMA Education System, recognized for 
                integrity, creative excellence, and our ability to adapt to the evolving landscape 
                of modern media.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#1E3A8A]/5 rounded-full blur-3xl group-hover:bg-[#1E3A8A]/10 transition-colors"></div>
          </div>
        </section>

        {/* 🕰 TIMELINE */}
        <section className="bg-white p-10 md:p-14 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-12">Editorial Evolution</h2>
          
          <div className="relative space-y-12 border-l-4 border-[#1E3A8A]/10 ml-4 pl-8">
            <div className="relative">
              <div className="absolute -left-[40px] top-1 w-5 h-5 bg-[#F59E0B] rounded-full border-4 border-white shadow-sm" />
              <span className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-[0.2em]">2025 • Genesis</span>
              <h3 className="text-xl font-bold mt-1">Foundation</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-2xl">
                Born out of the need for a unified student voice, the publication was officially recognized by the AMA Lipa administration.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[40px] top-1 w-5 h-5 bg-[#1E3A8A] rounded-full border-4 border-white shadow-sm" />
              <span className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-[0.2em]">Early 2026 • Migration</span>
              <h3 className="text-xl font-bold mt-1">Digital Platform Launch</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-2xl">
                Transitioned from static PDFs to a modern, React-based web ecosystem to reach students in real-time across all devices.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[40px] top-1 w-5 h-5 bg-[#1E3A8A] rounded-full border-4 border-white shadow-sm" />
              <span className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-[0.2em]">Present • Horizon</span>
              <h3 className="text-xl font-bold mt-1">Cloud Transformation</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-2xl">
                Implementation of a full-scale cloud backend, allowing for community engagement, live updates, and student-driven discussions.
              </p>
            </div>
          </div>
        </section>

        {/* 🏆 ACHIEVEMENTS */}
        <section className="bg-[#1E3A8A] p-10 md:p-14 rounded-[2.5rem] text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-10 flex items-center gap-3">
              <span className="text-[#F59E0B]">🏆</span> Hall of Records
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "Official Campus Publication of AMA Lipa",
                "100% Digital Native Newsroom",
                "Real-time Student Engagement System",
                "Consistent Weekly Academic Coverage"
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <div className="text-[#F59E0B] font-black text-xl italic">{i + 1}</div>
                  <div className="text-sm font-bold opacity-90 tracking-tight">{achievement}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Watermark in footer box */}
          <div className="absolute -bottom-10 -right-10 text-[10rem] font-black text-white/5 leading-none select-none italic">
            AMA
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}