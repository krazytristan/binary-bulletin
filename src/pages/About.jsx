import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowUpRight } from "lucide-react";

export default function About() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    articles: 0,
    writers: 0,
    years: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
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
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-primary selection:text-white antialiased">
      <Navbar />

      {/* COMPACT TOP NAV */}
      <div className="pt-24 md:pt-28 pb-4 border-b border-dark/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-1">
              Official Institutional Publication
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">
              About The Binary Bulletin
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Est. 2025 — AMA Lipa</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">About the Press</p>
          </div>
        </div>
      </div>

      {/* UTILITY BAR */}
      <nav className="sticky top-0 z-40 bg-light/95 backdrop-blur-md border-b border-dark/5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Operational Status: Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-8">
            <div className="h-64 bg-gray-100 animate-pulse border border-dark/5" />
            <div className="grid grid-cols-3 gap-px bg-dark/10">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* STATS GRID */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-dark/10 border border-dark/10 shadow-card">
              <div className="bg-white p-8 text-center hover:bg-gray-50 transition-colors">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Registry Content</p>
                <h3 className="text-4xl font-black text-primary tracking-tighter uppercase">{counts.articles}+</h3>
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">Total Publications</p>
              </div>
              <div className="bg-white p-8 text-center hover:bg-gray-50 transition-colors">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Staff Strength</p>
                <h3 className="text-4xl font-black text-primary tracking-tighter uppercase">{counts.writers}+</h3>
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">Student Personnel</p>
              </div>
              <div className="bg-white p-8 text-center hover:bg-gray-50 transition-colors">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Service Tenure</p>
                <h3 className="text-4xl font-black text-primary tracking-tighter uppercase">{counts.years}</h3>
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">Years Active</p>
              </div>
            </section>

            {/* EDITORIAL SPLIT: MISSION & VISION */}
            <section className="grid grid-cols-1 lg:grid-cols-12 border border-dark/10">
              <div className="lg:col-span-6 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-dark/10">
                <span className="bg-dark text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest mb-6 inline-block">Directives</span>
                <h2 className="text-2xl md:text-3xl font-black leading-none tracking-tighter mb-6 uppercase text-primary">Our Mission</h2>
                <p className="text-[13px] md:text-sm text-gray-500 font-medium leading-relaxed text-justify">
                  To empower the AMAer community by providing accurate, relevant, and timely information. 
                  We are committed to fostering responsible journalism and providing a digital stage 
                  where every student's voice can resonate with integrity and purpose within the 
                  Binary Bulletin network.
                </p>
              </div>
              <div className="lg:col-span-6 p-8 md:p-12 bg-gray-50/50">
                <span className="bg-secondary text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest mb-6 inline-block">Future State</span>
                <h2 className="text-2xl md:text-3xl font-black leading-none tracking-tighter mb-6 uppercase text-primary">Our Vision</h2>
                <p className="text-[13px] md:text-sm text-gray-500 font-medium leading-relaxed text-justify">
                  To be the premier digital news authority in the AMA Education System, recognized for 
                  creative excellence and our ability to adapt to the evolving landscape 
                  of modern media while maintaining strict journalistic standards across our platforms.
                </p>
              </div>
            </section>

            {/* EXPANDED HISTORICAL RECORD */}
            <section className="border border-dark/10 p-8 md:p-12 rounded-xl">
              <div className="max-w-3xl">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2">Editorial Evolution</p>
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-12">The Historical Record</h2>
                
                <div className="space-y-12 border-l border-dark/10 pl-8">
                  {/* STEP 1 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-2 h-2 bg-accent rounded-full" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ref: 2025.01 — Foundation</span>
                    <h3 className="text-lg font-black uppercase mt-1">Institutional Genesis</h3>
                    <p className="text-gray-500 text-[12px] mt-3 leading-relaxed font-medium">
                      The Binary Bulletin was officially established as the primary news medium for AMA Computer College Lipa. The initial phase focused on building a student-led newsroom dedicated to academic and campus integrity.
                    </p>
                  </div>

                  {/* STEP 2 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-2 h-2 bg-primary rounded-full" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ref: 2026.01 — Digital Migration</span>
                    <h3 className="text-lg font-black uppercase mt-1">Platform Expansion</h3>
                    <p className="text-gray-500 text-[12px] mt-3 leading-relaxed font-medium">
                      The publication transitioned from traditional static reporting to a high-density React-based digital ecosystem. This move allowed for real-time engagement and better information accessibility across the campus network.
                    </p>
                  </div>

                  {/* STEP 3 */}
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-2 h-2 bg-secondary rounded-full" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ref: 2026.04 — Modern Horizon</span>
                    <h3 className="text-lg font-black uppercase mt-1">Cloud Integration</h3>
                    <p className="text-gray-500 text-[12px] mt-3 leading-relaxed font-medium">
                      Implementation of full-scale Supabase integration, enabling live student discussions, personal bookmarks, and a synchronized database for all archival content. This finalized the transformation into a digital-first press authority.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* HALL OF RECORDS */}
            <section className="bg-dark text-white p-8 md:p-12 rounded-2xl">
              <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-accent mb-10">Institutional Records</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  "Official Campus Publication of AMA Lipa",
                  "100% Digital Native Newsroom",
                  "Real-time Student Engagement System",
                  "Consistent Weekly Academic Coverage"
                ].map((item, i) => (
                  <div key={i} className="border-b border-white/10 pb-4 flex justify-between items-end group">
                    <div className="space-y-1">
                      <p className="text-[7px] font-black text-gray-500 uppercase">Registry ID // BB-00{i + 1}</p>
                      <p className="text-[11px] font-bold tracking-tight uppercase group-hover:text-accent transition-colors">{item}</p>
                    </div>
                    <ArrowUpRight size={12} className="text-gray-600" />
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}