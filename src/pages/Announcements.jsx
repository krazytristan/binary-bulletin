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
  ArrowUpRight,
  Maximize2
} from "lucide-react";

export default function Announcements() {
  // --- STATE & LOGIC ---
  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedForComments, setSelectedForComments] = useState(null);
  const [selectedForReading, setSelectedForReading] = useState(null);
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const isInitialRender = useRef(true);

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
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
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

  const handleLike = async (id) => {
    const wasLiked = likedMap[id];
    setLikedMap(p => ({ ...p, [id]: !p[id] }));
    setLikes(p => ({ ...p, [id]: wasLiked ? (p[id] || 1) - 1 : (p[id] || 0) + 1 }));
    if (user) {
      if (wasLiked) await supabase.from("announcement_likes").delete().eq("announcement_id", id).eq("user_id", user.id);
      else await supabase.from("announcement_likes").insert({ announcement_id: id, user_id: user.id });
    }
  };

  const handleBookmark = async (id) => {
    if (!user) return setToast("Access Denied: Login Required");
    const isBookmarked = bookmarks[id];
    if (isBookmarked) await supabase.from("announcement_bookmarks").delete().eq("announcement_id", id).eq("user_id", user.id);
    else await supabase.from("announcement_bookmarks").insert({ announcement_id: id, user_id: user.id });
    setBookmarks(p => ({ ...p, [id]: !p[id] }));
    setToast(isBookmarked ? "REMOVED FROM ARCHIVE" : "SAVED TO ARCHIVE");
  };

  const handleShare = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/announcements/${id}`).then(() => setToast("LINK COPIED"));
  };

  const fetchComments = async (id) => {
    const { data } = await supabase.from("announcement_comments").select("*").eq("announcement_id", id).order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handleComment = async () => {
    const content = editingComment ? editValue : newComment;
    if (!content.trim() || !selectedForComments) return;
    if (editingComment) {
      const { error } = await supabase.from("announcement_comments").update({ comment: content }).eq("id", editingComment.id);
      if (!error) { setEditingComment(null); setEditValue(""); fetchComments(selectedForComments.id); setToast("COMMENT UPDATED"); }
    } else {
      const { error } = await supabase.from("announcement_comments").insert({ 
        announcement_id: selectedForComments.id, 
        user_id: user?.id || null, 
        comment: content,
        parent_id: replyTo?.id || null 
      });
      if (!error) { setNewComment(""); setReplyTo(null); fetchComments(selectedForComments.id); getCounts(selectedForComments.id); }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans selection:bg-[#1E3A8A] selection:text-white overflow-x-hidden antialiased">
      <Navbar />

      {/* COMPACT TOP NAV */}
      <div className="pt-24 md:pt-28 pb-4 border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1E3A8A] mb-1">NexGen Gazette</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">Journal</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Vol. 2026 — Ed. 04</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Released: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* UTILITY BAR */}
      <nav className="sticky top-0 z-40 bg-[#FDFDFB]/95 backdrop-blur-md border-b border-black/5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Search className="text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH ARCHIVES..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="bg-transparent border-none w-full text-[10px] font-bold tracking-[0.1em] outline-none placeholder:text-gray-300" 
            />
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{loading ? "SYNCING..." : "LIVE FEED"}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-8">
            <div className="h-96 bg-gray-50 animate-pulse border border-black/5" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-50 animate-pulse border border-black/5" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* FEATURED: HIGH-DENSITY EDITORIAL */}
            {latest && !search && (
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-black/10 hover:border-black/30 transition-colors group">
                <div className="lg:col-span-7 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-black/10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-[#1E3A8A] text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">Lead Story</span>
                    <time className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(latest.created_at).toDateString()}</time>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tighter mb-6 uppercase cursor-pointer group-hover:text-[#1E3A8A] transition-colors" onClick={() => setSelectedForReading(latest)}>
                    {latest.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed mb-8 line-clamp-3">
                    {latest.content}
                  </p>
                  <div className="flex items-center gap-6 pt-6 border-t border-black/5">
                    <button onClick={() => setSelectedForReading(latest)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:gap-3 transition-all">
                      Details <ChevronRight size={14} />
                    </button>
                    <div className="flex gap-4">
                       <button onClick={() => handleLike(latest.id)} className={`text-[9px] font-bold flex items-center gap-1 ${likedMap[latest.id] ? 'text-red-500' : 'text-gray-400'}`}><Heart size={12} fill={likedMap[latest.id] ? "currentColor" : "none"}/> {likes[latest.id] || 0}</button>
                       <button onClick={() => { setSelectedForComments(latest); fetchComments(latest.id); }} className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><MessageCircle size={12} /> {commentsCount[latest.id] || 0}</button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 bg-gray-50 flex items-center justify-center overflow-hidden h-64 lg:h-auto">
                  {latest.image_url ? (
                    <img src={latest.image_url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Cover" />
                  ) : (
                    <div className="text-[6rem] font-black text-black/5">NEWS</div>
                  )}
                </div>
              </article>
            )}

            {/* SECONDARY GRID: COMPACT BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border border-black/10">
              {filtered.map((a) => (
                <article key={a.id} className="bg-[#FDFDFB] p-6 flex flex-col hover:bg-white transition-colors group">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[8px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">Note // {new Date(a.created_at).toLocaleDateString()}</span>
                    <button onClick={() => handleBookmark(a.id)} className={`${bookmarks[a.id] ? 'text-[#F59E0B]' : 'text-gray-200'}`}><Bookmark size={12} fill={bookmarks[a.id] ? "currentColor" : "none"}/></button>
                  </div>
                  <h3 className="text-sm font-black uppercase leading-tight tracking-tight mb-3 line-clamp-2 cursor-pointer group-hover:text-[#1E3A8A]" onClick={() => setSelectedForReading(a)}>
                    {a.title}
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium leading-relaxed mb-6 line-clamp-3 flex-1">
                    {a.content}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-black/5">
                    <div className="flex gap-3">
                      <button onClick={() => handleLike(a.id)} className={`text-[9px] font-bold flex items-center gap-1 ${likedMap[a.id] ? 'text-red-500' : 'text-gray-300'}`}><Heart size={10} fill={likedMap[a.id] ? "currentColor" : "none"} /> {likes[a.id] || 0}</button>
                      <button onClick={() => { setSelectedForComments(a); fetchComments(a.id); }} className="text-[9px] font-bold text-gray-300 flex items-center gap-1"><MessageCircle size={10} /> {commentsCount[a.id] || 0}</button>
                    </div>
                    <button onClick={() => handleShare(a.id)} className="text-gray-300 hover:text-black"><Share2 size={12}/></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* READING MODAL (CONCENTRATED TYPOGRAPHY) */}
      {selectedForReading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-12">
          <div className="absolute inset-0 bg-white/98 backdrop-blur-xl" onClick={() => setSelectedForReading(null)} />
          <div className="bg-white w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto relative z-10 p-8 md:p-16 flex flex-col border border-black/5 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedForReading(null)} className="fixed top-6 right-6 p-2 text-gray-400 hover:text-black"><X size={24}/></button>
            
            <header className="mb-10 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#1E3A8A] mb-4">Official Publication</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none mb-4 uppercase">{selectedForReading.title}</h2>
              <time className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(selectedForReading.created_at).toDateString()} — Archive Ref: #{selectedForReading.id.substring(0,6)}</time>
            </header>

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 text-[15px] md:text-[16px] leading-[1.8] whitespace-pre-line font-medium text-justify">
                {selectedForReading.content}
              </p>
            </div>

            {/* MODAL ACTIONS FOOTER */}
            <footer className="mt-12 pt-8 border-t border-black/5 grid grid-cols-2 md:grid-cols-4 gap-4">
               <button onClick={() => handleLike(selectedForReading.id)} className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${likedMap[selectedForReading.id] ? 'text-red-500' : 'text-gray-400'}`}>
                 <Heart size={16} fill={likedMap[selectedForReading.id] ? "currentColor" : "none"}/> Like
               </button>
               <button onClick={() => { setSelectedForComments(selectedForReading); fetchComments(selectedForReading.id); }} className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-gray-400">
                 <MessageCircle size={16}/> Discussion
               </button>
               <button onClick={() => handleBookmark(selectedForReading.id)} className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${bookmarks[selectedForReading.id] ? 'text-[#F59E0B]' : 'text-gray-400'}`}>
                 <Bookmark size={16} fill={bookmarks[selectedForReading.id] ? "currentColor" : "none"}/> {bookmarks[selectedForReading.id] ? 'Saved' : 'Save'}
               </button>
               <button onClick={() => handleShare(selectedForReading.id)} className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-gray-400 hover:text-black">
                 <Share2 size={16}/> Share
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* COMMENTS DRAWER */}
      {selectedForComments && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => setSelectedForComments(null)} />
          <div className="bg-white w-full max-w-sm h-full relative z-10 flex flex-col border-l border-black/10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest">Public Commentary</h2>
              <button onClick={() => setSelectedForComments(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {comments.map((c) => (
                <div key={c.id} className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                    {c.user_id ? `User // ${c.user_id.substring(0,6)}` : "Guest Participant"}
                  </p>
                  <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="relative">
                <input 
                  value={editingComment ? editValue : newComment} 
                  onChange={(e) => editingComment ? setEditValue(e.target.value) : setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  placeholder="ADD TO DISCUSSION..." 
                  className="w-full bg-white border border-black/10 p-3 text-[11px] font-bold outline-none focus:border-[#1E3A8A]" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL TOAST */}
      {toast && (
        <div className="fixed bottom-8 left-8 bg-black text-white px-4 py-2 text-[9px] font-black tracking-[0.2em] z-[200] animate-in slide-in-from-left-4">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}