import { useState } from "react";
import { supabase } from "../lib/supabase"; // Ensure lib/supabase.js is inside your src folder
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Pulling data from the form
    const formData = new FormData(e.target);
    const { name, email, message } = Object.fromEntries(formData);

    try {
      // 🔷 Sending to your "messages" table in Supabase
      const { error: supabaseError } = await supabase
        .from("messages") 
        .insert([{ 
          name: name, 
          email: email, 
          message: message,
          created_at: new Date().toISOString()
        }]);

      if (supabaseError) throw supabaseError;

      setSubmitted(true);
    } catch (err) {
      console.error("Transmission Error:", err.message);
      setError("Database sync failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1a1a1a] font-sans selection:bg-yellow-200">
      <Navbar />

      {/* 🔷 NEWS-STYLE HERO SECTION */}
      <section className="bg-[#1E3A8A] text-white pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[14rem] leading-none -bottom-10 -left-10">
          CONTACT
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-[#F59E0B] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                Get In Touch
              </span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
                Contact the <br /> Newsroom
              </h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">
              The definitive gateway for campus leads, editorial inquiries, and community feedback.
            </p>
          </div>
        </div>
      </section>

      {/* STICKY STATUS BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">
            <span className={`w-2 h-2 rounded-full animate-pulse ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            {loading ? "Transmitting Packet..." : "Inbox Active & Open"}
          </div>
          <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Official Correspondence
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* 📝 CONTACT FORM (Main Column) */}
          <div className="lg:col-span-2 bg-white p-8 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-2xl">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in zoom-in">
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Dispatch Sent</h2>
                <p className="text-gray-500 mt-4 font-medium text-lg">Your message has been logged in the Binary Bulletin system.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-[10px] font-black uppercase tracking-widest text-[#1E3A8A] border-b-2 border-[#1E3A8A] pb-1"
                >
                  Send another dispatch
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest">Transmission</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inquiry Form</span>
                  </div>
                  {error && <span className="text-red-500 text-[9px] font-black uppercase tracking-widest">{error}</span>}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Name</label>
                      <input
                        required
                        name="name" // Matches "name" column in Supabase
                        type="text"
                        placeholder="Juan Dela Cruz"
                        className="w-full bg-[#F3F4F6] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#1E3A8A]/10 font-bold text-sm outline-none transition-all disabled:opacity-50"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email Address</label>
                      <input
                        required
                        name="email" // Matches "email" column in Supabase
                        type="email"
                        placeholder="juan@example.com"
                        className="w-full bg-[#F3F4F6] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#1E3A8A]/10 font-bold text-sm outline-none transition-all disabled:opacity-50"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Detailed Message</label>
                    <textarea
                      required
                      name="message" // Matches "message" column in Supabase
                      rows="8"
                      placeholder="Enter your message here..."
                      className="w-full bg-[#F3F4F6] border-none rounded-[2rem] py-5 px-6 focus:ring-2 focus:ring-[#1E3A8A]/10 font-bold text-sm outline-none transition-all resize-none disabled:opacity-50"
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#1E3A8A] text-white px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                          Transmitting...
                        </>
                      ) : "Send Message ➔"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* 📍 CONTACT INFO & SIDEBAR (Right Column) */}
          <div className="space-y-10">
            <div className="bg-[#1E3A8A] text-white p-10 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-8">Bureau Info</h2>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="text-xl">📍</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Headquarters</p>
                      <p className="text-sm font-bold leading-tight">AMA Computer College Lipa City, Batangas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-xl">📧</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Digital Inbox</p>
                      <p className="text-sm font-bold">binarybulletin@ama.edu.ph</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-xl">🕒</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Office Hours</p>
                      <p className="text-sm font-bold uppercase tracking-tighter">Mon — Fri | 08:00 - 17:00</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#F59E0B] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>

            <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-gray-300 text-center">Social Archive</h3>
              <div className="grid grid-cols-3 gap-4">
                {['📘', '📸', '🐦'].map((emoji, idx) => (
                  <div key={idx} className="bg-[#F3F4F6] aspect-square rounded-2xl flex items-center justify-center text-2xl cursor-pointer hover:bg-[#F59E0B] hover:scale-105 transition-all">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-center text-[9px] font-bold text-gray-400 mt-8 uppercase tracking-[0.2em] italic">Full Digital Launch 2026</p>
            </div>
          </div>
        </div>

        {/* MAP FOOTER */}
        <div className="mt-16 bg-white rounded-[2.5rem] border border-gray-100 p-4 h-80 relative overflow-hidden shadow-sm group">
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-1000">
              <div className="text-center">
                <div className="text-5xl opacity-20 mb-4 group-hover:scale-110 transition-transform">🗺️</div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Geographic Data Integration</p>
              </div>
          </div>
          <div className="absolute top-8 left-8 bg-black text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
            Main Campus Site
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}