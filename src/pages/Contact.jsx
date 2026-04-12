import { useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Send, MapPin, Mail, Clock, ShieldCheck, Globe } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const { name, email, message } = Object.fromEntries(formData);

    try {
      const { error: supabaseError } = await supabase
        .from("messages") 
        .insert([{ 
          name, 
          email, 
          message,
          created_at: new Date().toISOString()
        }]);

      if (supabaseError) throw supabaseError;
      setSubmitted(true);
    } catch (err) {
      setError("Database sync failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light text-dark font-sans selection:bg-primary selection:text-white antialiased">
      <Navbar />

      {/* Editorial Header */}
      <section className="pt-28 pb-12 border-b border-dark/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-accent text-dark px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">
                  Registry
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Vol. 04 / Dispatch 2026
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                EDITORIAL <br /> INQUIRIES
              </h1>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed max-w-md">
                This is the formal channel for campus leads, technical reports, and official correspondence. 
                All transmissions are recorded within the central registry for editorial review.
              </p>
            </div>
            <div className="hidden lg:block border-l border-dark/5 pl-8 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-2">System Status</p>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Uplink Operational
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Bar */}
      <nav className="sticky top-0 z-30 bg-light/95 backdrop-blur-md border-b border-dark/5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-dark/40 flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" /> End-to-end encrypted transmission
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-dark/40">
            Batangas / PHP / 121.05° E
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-px bg-dark/10 border border-dark/10">
          
          {/* Form Column */}
          <div className="lg:col-span-8 bg-white p-8 md:p-16">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-primary/5 flex items-center justify-center mb-8 border border-primary/20">
                  <Send className="text-primary" size={32} />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase mb-4">Packet Received</h2>
                <p className="text-[12px] text-gray-500 font-medium mb-10 max-w-xs tracking-widest leading-loose">
                  Your message has been processed and stored in the Binary Bulletin archives.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-dark/20 pb-1 hover:text-primary hover:border-primary transition-all"
                >
                  Initiate New Dispatch
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">01. Identity Name</label>
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="Enter full name"
                      className="w-full bg-transparent border-b border-dark/10 py-3 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all disabled:opacity-30"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">02. Return Address</label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="email@domain.com"
                      className="w-full bg-transparent border-b border-dark/10 py-3 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all disabled:opacity-30"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">03. Detailed Intelligence / Inquiry</label>
                  <textarea
                    required
                    name="message"
                    rows="6"
                    placeholder="Type message here..."
                    className="w-full bg-transparent border border-dark/10 p-6 focus:border-primary focus:ring-0 font-medium text-sm outline-none transition-all resize-none disabled:opacity-30"
                    disabled={loading}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-dark/5">
                  <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest max-w-[200px]">
                    Transmission is subject to manual editorial review.
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-dark text-white px-10 py-5 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center gap-4 disabled:opacity-50"
                  >
                    {loading ? "Transmitting..." : "Send Dispatch"} <Send size={14} />
                  </button>
                </div>
                {error && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{error}</p>}
              </form>
            )}
          </div>

          {/* Info Column */}
          <div className="lg:col-span-4 bg-gray-50 flex flex-col border-l border-dark/5 divide-y divide-dark/5">
            <div className="p-12">
              <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-10">Bureau Metadata</h2>
              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <MapPin size={16} className="text-accent mt-1" />
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Location</p>
                    <p className="text-[11px] font-bold leading-tight tracking-tight">AMA Computer College<br />Lipa City, Batangas</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail size={16} className="text-accent mt-1" />
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Direct Uplink</p>
                    <p className="text-[11px] font-bold tracking-tight">binarybulletin@ama.edu.ph</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock size={16} className="text-accent mt-1" />
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">Operational Hours</p>
                    <p className="text-[11px] font-bold tracking-tight">Mon — Fri | 08:00 - 17:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-300">Social Archive</h3>
              <div className="grid grid-cols-3 gap-px bg-dark/10 border border-dark/10">
                {['FB', 'IG', 'TW'].map((label) => (
                  <div key={label} className="bg-white aspect-square flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-accent transition-colors">
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-12 mt-auto">
              <div className="flex items-center gap-3 text-gray-300">
                <Globe size={14} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Full digital launch 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Map Area */}
        <div className="mt-px border border-dark/10 bg-white h-64 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-5 grayscale pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>
          <div className="relative text-center">
            <div className="inline-block p-4 border border-dark/5 mb-4">
              <MapPin className="text-gray-200" size={32} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-300">Geographic data integration pending</p>
          </div>
          <div className="absolute bottom-6 left-6 bg-dark text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest">
            Site: AMA_LIPA_HQ
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}