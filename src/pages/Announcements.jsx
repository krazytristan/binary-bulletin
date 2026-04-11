import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Heart, 
  Bookmark, 
  Share2, 
  MessageCircle, 
  Search, 
  X, 
  Send, 
  Bell, 
  ChevronRight, 
  Trash2 
} from "lucide-react";

export default function Announcements() {
  // --- STATE MANAGEMENT ---
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState({});
  const [newComment, setNewComment] = useState("");
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  const isInitialRender = useRef(true);

  // --- 1. INITIALIZATION & DATA FETCHING ---
  useEffect(() => {
    if (isInitialRender.current) {
      const init = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        fetchAnnouncements(authUser);
      };
      init();
      isInitialRender.current = false;
    }
  }, []);

  const fetchAnnouncements = async (currentUser) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setLatest(data[0]);
      setAnnouncements(data.slice(1));
      setFiltered(data.slice(1));
      data.forEach((a) => {
        getCounts(a.id);
        if (currentUser) checkUserActions(a.id, currentUser);
      });
    }
    setLoading(false);
  };

  const getCounts = async (id) => {
    const { count: lc } = await supabase.from("announcement_likes").select("*", { count: "exact", head: true }).eq("announcement_id", id);
    const { count: cc } = await supabase.from("announcement_comments").select("*", { count: "exact", head: true }).eq("announcement_id", id);
    setLikes(p => ({ ...p, [id]: lc || 0 }));
    setCommentsCount(p => ({ ...p, [id]: cc || 0 }));
  };

  const checkUserActions = async (id, currentUser) => {
    const { data: l } = await supabase.from("announcement_likes").select("id").eq("announcement_id", id).eq("user_id", currentUser.id).maybeSingle();
    const { data: b } = await supabase.from("announcement_bookmarks").select("id").eq("announcement_id", id).eq("user_id", currentUser.id).maybeSingle();
    setLikedMap(p => ({ ...p, [id]: !!l }));
    setBookmarks(p => ({ ...p, [id]: !!b }));
  };

  // --- 2. SEARCH LOGIC ---
  useEffect(() => {
    const result = announcements.filter(a => 
      a.title.toLowerCase().includes(search.toLowerCase()) || 
      a.content.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, announcements]);

  // --- 3. CORE ACTIONS (LIKE, BOOKMARK, SHARE) ---
  const handleLike = async (id) => {
    if (!user) return setToast("Login required");
    const wasLiked = likedMap[id];
    setLikedMap(p => ({ ...p, [id]: !p[id] }));
    setLikes(p => ({ ...p, [id]: wasLiked ? p[id] - 1 : (p[id] || 0) + 1 }));
    
    if (wasLiked) {
      await supabase.from("announcement_likes").delete().eq("announcement_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("announcement_likes").insert({ announcement_id: id, user_id: user.id });
    }
  };

  const handleBookmark = async (id) => {
    if (!user) return setToast("Login required");
    const isBookmarked = bookmarks[id];
    
    if (isBookmarked) {
      await supabase.from("announcement_bookmarks").delete().eq("announcement_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("announcement_bookmarks").insert({ announcement_id: id, user_id: user.id });
    }
    
    setBookmarks(p => ({ ...p, [id]: !p[id] }));
    setToast(isBookmarked ? "Removed from Saved" : "Post Saved");
  };

  const handleShare = (id) => {
    const shareUrl = `${window.location.origin}/announcements/${id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => setToast("Link copied to clipboard!"))
      .catch(() => setToast("Failed to copy link"));
  };

  // --- 4. COMMENTING LOGIC ---
  const fetchComments = async (id) => {
    const { data } = await supabase
      .from("announcement_comments")
      .select("*")
      .eq("announcement_id", id)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user || !selected) return;
    const { error } = await supabase.from("announcement_comments").insert({ 
      announcement_id: selected.id, 
      user_id: user.id, 
      comment: newComment 
    });
    if (!error) setNewComment("");
  };

  const deleteComment = async (id) => {
    const { error } = await supabase.from("announcement_comments").delete().eq("id", id);
    if (!error) setToast("Comment deleted");
  };

  // --- 5. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel(`realtime-${selected.id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "announcement_comments", 
        filter: `announcement_id=eq.${selected.id}` 
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setComments(prev => [payload.new, ...prev]);
          setCommentsCount(c => ({ ...c, [selected.id]: (c[selected.id] || 0) + 1 }));
        } else if (payload.eventType === "DELETE") {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
          setCommentsCount(c => ({ ...c, [selected.id]: Math.max((c[selected.id] || 1) - 1, 0) }));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  // Toast auto-hide effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1a1a1a] font-sans selection:bg-yellow-200">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-[#1E3A8A] text-white pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none uppercase font-black text-[14rem] leading-none -bottom-10 -left-10">BULLETIN</div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-[#F59E0B] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Official Updates</span>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">Campus <br /> Announcements</h1>
            </div>
            <p className="max-w-xs text-white/60 font-medium border-l border-white/20 pl-6 text-sm">The definitive record of campus directives, academic notices, and cultural milestones.</p>
          </div>
        </div>
      </section>

      {/* STICKY SEARCH/FILTER BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E3A8A]" size={18} />
            <input 
              type="text" 
              placeholder="Filter archives..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-[#F3F4F6] border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-[#1E3A8A]/10 font-bold text-sm outline-none" 
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]"><Bell size={14} /> Feed Active</div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-[#F59E0B] rounded-full animate-spin"></div></div>
        ) : (
          <>
            {/* FEATURED HEADLINE (Latest Post) */}
            {latest && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-16 group transition-all duration-500 hover:shadow-2xl">
                <div className="flex flex-col lg:flex-row">
                  {latest.image_url && (
                    <div className="lg:w-1/2 h-80 lg:h-auto overflow-hidden">
                      <img src={latest.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Latest" />
                    </div>
                  )}
                  <div className="flex-1 p-8 md:p-14">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-black text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest">Headline</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(latest.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-8 group-hover:text-[#1E3A8A] transition-colors">{latest.title}</h2>
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8 font-medium whitespace-pre-line">
                      {expanded[latest.id] ? latest.content : latest.content.substring(0, 260) + "..."}
                    </p>
                    <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                      <div className="flex gap-8">
                        <button onClick={() => handleLike(latest.id)} className={`flex items-center gap-2 text-xs font-black transition-colors ${likedMap[latest.id] ? 'text-red-500' : 'text-gray-400 hover:text-black'}`}>
                          <Heart size={22} className={likedMap[latest.id] ? "fill-current" : ""} /> {likes[latest.id] || 0}
                        </button>
                        <button onClick={() => { setSelected(latest); fetchComments(latest.id); }} className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-black transition-colors">
                          <MessageCircle size={22} /> {commentsCount[latest.id] || 0}
                        </button>
                      </div>
                      <button onClick={() => setExpanded(p => ({ ...p, [latest.id]: !p[latest.id] }))} className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A] flex items-center gap-1">
                        {expanded[latest.id] ? "Collapse" : "Read Full Article"} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARCHIVE GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filtered.map((a) => (
                <article key={a.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                  <span className="text-[10px] font-black text-gray-300 uppercase block mb-4 tracking-widest">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight leading-tight mb-4 group-hover:text-[#1E3A8A] transition-colors">{a.title}</h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 flex-1 line-clamp-3 whitespace-pre-line">
                    {a.content}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex gap-4">
                      <button onClick={() => handleLike(a.id)} className={`flex items-center gap-1 text-[10px] font-black transition-colors ${likedMap[a.id] ? 'text-red-500' : 'text-gray-400'}`}>
                        <Heart size={18} className={likedMap[a.id] ? "fill-current" : ""} /> {likes[a.id] || 0}
                      </button>
                      <button onClick={() => { setSelected(a); fetchComments(a.id); }} className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-black transition-colors">
                        <MessageCircle size={18} /> {commentsCount[a.id] || 0}
                      </button>
                    </div>
                    <div className="flex gap-3 text-gray-300">
                      <Bookmark 
                        size={18} 
                        onClick={() => handleBookmark(a.id)} 
                        className={`cursor-pointer transition-colors ${bookmarks[a.id] ? 'text-[#F59E0B] fill-current' : 'hover:text-black'}`} 
                      />
                      <Share2 size={18} className="hover:text-black cursor-pointer transition-colors" onClick={() => handleShare(a.id)} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ENGAGEMENT MODAL (Comments) */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F7]">
              <div>
                <h2 className="text-2xl font-black tracking-tighter">Engagement</h2>
                <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest truncate max-w-[300px]">{selected.title}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-3 bg-white rounded-full border border-gray-100 hover:bg-[#F59E0B] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-gray-300 font-bold uppercase text-xs tracking-widest">No conversation yet</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-4 group">
                    <div className="bg-[#1E3A8A] text-white rounded-2xl w-10 h-10 flex flex-shrink-0 items-center justify-center text-[10px] font-black">
                      {c.user_id?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-[#F3F4F6] rounded-[1.5rem] rounded-tl-none p-4 relative">
                        <p className="text-sm font-bold text-gray-800 leading-relaxed">{c.comment}</p>
                        {user?.id === c.user_id && (
                          <button 
                            onClick={() => deleteComment(c.id)}
                            className="absolute -right-2 -top-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex items-center gap-3">
              <input 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Join the discussion..." 
                className="w-full bg-[#F3F4F6] border-none rounded-full py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none" 
              />
              <button 
                onClick={handleComment} 
                disabled={!newComment.trim()}
                className="p-4 bg-[#1E3A8A] text-white rounded-full hover:bg-black transition-colors disabled:opacity-20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full shadow-2xl z-[150] text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}