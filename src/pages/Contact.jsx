import { useState } from "react";
import { supabase } from "../lib/supabase";
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

    const formData = new FormData(e.target);
    const { name, email, message } = Object.fromEntries(formData);

    try {
      const { error: supabaseError } = await supabase
        .from("messages") 
        .insert([{ name, email, message, created_at: new Date().toISOString() }]);

      if (supabaseError) throw supabaseError;
      setSubmitted(true);
    } catch (err) {
      setError("Transmission failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <header className="mb-16 text-center border-b-2 border-black pb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Editorial Board</p>
          <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter mb-6">Letters to the Editor</h1>
          <p className="font-serif text-gray-600 text-lg italic max-w-xl mx-auto">
            Submit inquiries, reports, and correspondence directly to the publication staff. All transmissions are subject to editorial review.
          </p>
        </header>

        {submitted ? (
          <div className="text-center py-20 bg-white border border-black p-8">
            <h2 className="text-3xl font-serif font-black uppercase mb-4">Letter Received</h2>
            <p className="font-serif text-gray-600 mb-8 italic">Your correspondence has been filed in the registry.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-all"
            >
              Draft Another Letter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-8 md:p-12 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-3">Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-black font-serif outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-3">Return Address (Email)</label>
                <input
                  required
                  name="email"
                  type="email"
                  className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-black font-serif outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-3">Correspondence</label>
              <textarea
                required
                name="message"
                rows="6"
                className="w-full bg-[#FCFBF9] border border-gray-300 p-4 focus:border-black font-serif outline-none transition-all resize-y"
                disabled={loading}
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Batangas / PHP</span>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-8 py-3 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Transmitting..." : "Send Letter"}
              </button>
            </div>
            {error && <p className="text-[10px] font-bold text-red-600 uppercase text-center mt-4">{error}</p>}
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}