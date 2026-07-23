import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      fetchAnnouncements();
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      announcements.filter(a => 
        a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term)
      )
    );
  }, [search, announcements]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) {
      setAnnouncements(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 border-b-2 border-black pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Official Notices</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter">Bulletins</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black transition-colors" 
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20">Loading bulletins...</div>
        ) : (
          <div className="space-y-6">
            {filtered.map((a) => (
              <article key={a.id} className="bg-white border border-gray-300 p-8 md:p-10 hover:border-black transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
                  <h2 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {a.title}
                  </h2>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 shrink-0">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                
                {a.image_url && (
                  <div className="mb-8 aspect-[21/9] w-full overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={a.image_url} alt="Notice attachment" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none font-serif text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {a.content}
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 border border-gray-300 bg-white">
                <p className="font-serif italic text-gray-500 text-lg">No bulletins found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}