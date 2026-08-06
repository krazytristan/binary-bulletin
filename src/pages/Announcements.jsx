import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, Maximize2, X } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewerImage, setViewerImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  const isInitialRender = useRef(true);

  // Allow closing the lightbox with the Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setViewerImage(null);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      fetchAnnouncements();
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const newFiltered = announcements.filter(a => 
      a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term)
    );
    setFiltered(newFiltered);
    setShowAll(false); // Reset to View More when searching
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

  const visibleItems = showAll ? filtered : filtered.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col relative">
        <header className="mb-12 border-b-[3px] border-blue-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-900 mb-4">Official Notices</p>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase tracking-tighter text-blue-900">Bulletins</h1>
          </div>
          
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all" 
            />
          </div>
        </header>

        {loading ? (
          <div className="text-center font-serif italic text-gray-500 py-20 flex-1">Loading bulletins...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-gray-300 bg-white flex-1">
            <p className="font-serif italic text-gray-500 text-lg">No bulletins found.</p>
          </div>
        ) : (
          <div className="flex flex-col w-full pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {visibleItems.map((item) => (
                <article 
                  key={item.id}
                  className="bg-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] flex flex-col transition-all group overflow-hidden"
                >
                  {/* Image Top */}
                  {item.image_url ? (
                    <div 
                      className="w-full h-48 sm:h-56 lg:h-64 border-b-2 border-blue-900 relative cursor-pointer bg-gray-100 overflow-hidden shrink-0"
                      onClick={() => setViewerImage(item.image_url)}
                    >
                      <img src={item.image_url} alt="Notice attachment" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-amber-400 drop-shadow-md" size={24} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 sm:h-56 lg:h-64 bg-blue-50/50 flex flex-col items-center justify-center border-b-2 border-blue-900 p-8 text-center shrink-0">
                      <p className="font-serif italic text-blue-900/40">No imagery attached.</p>
                    </div>
                  )}
                  
                  {/* Content Bottom */}
                  <div className="p-6 flex flex-col flex-1 bg-white">
                    <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-200">
                      <span className="self-start text-[9px] font-bold uppercase tracking-widest text-blue-900 bg-amber-400 px-2 py-1 border border-amber-400">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <h2 
                        className="text-xl md:text-2xl font-serif font-black uppercase tracking-tight leading-tight text-blue-900 group-hover:text-red-900 transition-colors line-clamp-2 cursor-pointer" 
                        title="Click to read full bulletin"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.title}
                      </h2>
                    </div>
                    <div className="prose prose-sm max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap flex-1 line-clamp-4 text-ellipsis overflow-hidden">
                      {item.content}
                    </div>
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="mt-4 self-start text-[10px] font-bold uppercase tracking-widest text-red-900 hover:text-blue-900 transition-colors"
                    >
                      Read Full Article →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* View More / View Less Button */}
            {filtered.length > 3 && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3 bg-white border-2 border-blue-900 text-blue-900 font-bold uppercase tracking-widest hover:bg-red-900 hover:text-white hover:border-red-900 transition-all shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
                >
                  {showAll ? "View Less" : "View More Bulletins"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ARTICLE READING MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm p-4 md:p-12" onClick={() => setSelectedItem(null)}>
          <div 
            className="bg-[#FCFBF9] w-full max-w-4xl max-h-full overflow-y-auto shadow-2xl border-4 border-blue-900 relative flex flex-col custom-scrollbar" 
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-white text-blue-900 border-2 border-blue-900 hover:bg-red-900 hover:text-white hover:border-red-900 transition-colors z-10 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]">
              <X size={20} />
            </button>
            
            <div className="p-8 md:p-12 flex flex-col bg-white flex-1">
               <span className="self-start text-[10px] font-bold uppercase tracking-widest text-blue-900 bg-amber-400 px-3 py-1 border border-amber-400 mb-6">
                  {new Date(selectedItem.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
               </span>
               <h2 className="text-3xl md:text-5xl font-serif font-black uppercase tracking-tight leading-tight text-blue-900 mb-8 pb-6 border-b-2 border-gray-200">
                  {selectedItem.title}
               </h2>
               <div className="prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.content}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {viewerImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-md" onClick={() => setViewerImage(null)}>
          <button onClick={() => setViewerImage(null)} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 transition-colors z-10">
            <X size={24} />
          </button>
          <div className="w-full max-w-6xl max-h-screen p-12 flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewerImage}
              className="max-h-[85vh] w-auto border border-gray-300 shadow-2xl object-contain"
              alt="Notice full view"
            />
          </div>
        </div>
      )}

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #7f1d1d; }
      `}} />
    </div>
  );
}