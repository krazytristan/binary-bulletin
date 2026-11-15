import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PUBLICATION } from "../utils/editorial";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `Letters to the Editor | ${PUBLICATION.name}`;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const { name, email, message } = Object.fromEntries(formData);

    try {
      const { error: supabaseError } = await supabase
        .from("messages")
        .insert([{ name: name.trim(), email: email.trim(), message: message.trim(), created_at: new Date().toISOString() }]);

      if (supabaseError) throw supabaseError;
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 flex-1 w-full">
        <header className="mb-14 text-center border-b-[3px] border-blue-900 pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-4">
            Editorial Board &amp; Correspondence
          </p>
          <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter mb-5 text-blue-900">
            Letters to the Editor
          </h1>
          <p className="font-serif text-gray-600 text-base md:text-lg italic max-w-xl mx-auto leading-relaxed">
            Submit campus news tips, event coverage requests, corrections, or letters of opinion directly to the editorial staff of {PUBLICATION.name}. All submissions undergo editorial review.
          </p>
        </header>

        {submitted ? (
          <div className="text-center py-16 bg-white border-2 border-blue-900 p-8 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]">
            <h2 className="text-3xl font-serif font-black uppercase mb-4 text-blue-900">
              Correspondence Received
            </h2>
            <p className="font-serif text-gray-600 mb-8 italic max-w-md mx-auto leading-relaxed">
              Thank you for writing to {PUBLICATION.name}. Your message has been logged for review by our editorial desk.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs font-bold uppercase tracking-widest border-b-2 border-red-900 text-red-900 pb-1 hover:text-blue-900 hover:border-blue-900 transition-all"
            >
              Submit Another Letter
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-blue-900 p-8 md:p-12 space-y-8 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-[11px] font-bold uppercase tracking-widest text-red-900 mb-2.5"
                >
                  Full Name
                </label>
                <input
                  id="contact-name"
                  required
                  name="name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  className="w-full bg-transparent border-b border-gray-300 py-2.5 focus:border-red-900 font-serif outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[11px] font-bold uppercase tracking-widest text-red-900 mb-2.5"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  required
                  name="email"
                  type="email"
                  placeholder="student@ama.edu.ph"
                  className="w-full bg-transparent border-b border-gray-300 py-2.5 focus:border-red-900 font-serif outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-[11px] font-bold uppercase tracking-widest text-red-900 mb-2.5"
              >
                Letter or Inquiry
              </label>
              <textarea
                id="contact-message"
                required
                name="message"
                rows="6"
                placeholder="Write your letter, news tip, or editorial inquiry here..."
                className="w-full bg-[#FCFBF9] border border-gray-300 p-4 focus:border-red-900 font-serif outline-none transition-all resize-y"
                disabled={loading}
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {PUBLICATION.institution} &bull; {PUBLICATION.location}
              </span>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-900 text-white px-8 py-3.5 font-bold text-xs uppercase tracking-[0.18em] hover:bg-amber-400 hover:text-blue-950 transition-colors disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Send Letter"}
              </button>
            </div>
            {error && (
              <p className="text-xs font-bold text-red-700 text-center mt-4">{error}</p>
            )}
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
