import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Heart, Bookmark, Share2, Link as LinkIcon, 
  ChevronLeft, MessageSquare, Calendar, User,
  Zap, Quote, Images as ImagesIcon
} from "lucide-react";

export default function ArticleView() {
  const { id } = useParams();

  // --- DATA STATES ---
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  // --- UI STATES ---
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    window.scrollTo(0, 0);
    try {
      const { data: artData } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (artData) {
        setArticle(artData);
        // Fetch related items
        const { data: relData } = await supabase
          .from("articles")
          .select("*")
          .eq("category", artData.category)
          .neq("id", id)
          .limit(4);
        setRelated(relData || []);
      }

      // Fetch Interactions
      const [likesRes, commentsRes, bookmarkRes] = await Promise.all([
        supabase.from("likes").select("*").eq("article_id", id),
        supabase.from("comments").select("*").eq("article_id", id).order("created_at", { ascending: false }),
        supabase.from("bookmarks").select("*").eq("article_id", id)
      ]);

      setLikes(likesRes.data?.length || 0);
      setComments(commentsRes.data || []);
      if (bookmarkRes.data?.length > 0) setBookmarked(true);
      
    } catch (error) {
      console.error("Error loading publication data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const current = window.scrollY;
      setProgress((current / total) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [id, loadData]);

  const handleLike = async () => {
    if (liked) return;
    await supabase.from("likes").insert({ article_id: id });
    setLikes((prev) => prev + 1);
    setLiked(true);
  };

  const toggleBookmark = async () => {
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("article_id", id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ article_id: id });
      setBookmarked(true);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const { error } = await supabase.from("comments").insert({ article_id: id, text: comment });
    if (!error) {
      setComment("");
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("article_id", id)
        .order("created_at", { ascending: false });
      setComments(data || []);
    }
  };

  const shareFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`);
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); alert("Editorial link copied to clipboard."); };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#1E3A8A] rounded-full animate-spin"></div>
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Syncing Edition...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1a1a1a] font-sans antialiased selection:bg-[#1E3A8A] selection:text-white">
      <Navbar />

      {/* Reading Progress Header */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100 z-[60]">
        <div className="h-full bg-[#1E3A8A] transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* --- LEFT: MAIN CONTENT --- */}
          <article className="lg:col-span-8">
            <header className="space-y-6">
              <Link to="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#1E3A8A] transition-colors">
                <ChevronLeft size={14} /> Back to Archives
              </Link>
              
              <div>
                <span className="bg-[#1E3A8A] text-white text-[9px] font-black px-3 py-1 uppercase tracking-[0.3em]">
                  {article?.category || "Bulletin"}
                </span>
                <h1 className="text-3xl md:text-5xl font-black mt-6 leading-[1.1] tracking-tighter uppercase">
                  {article?.title}
                </h1>
              </div>

              <div className="flex items-center justify-between py-6 border-y border-black/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden grayscale border border-black/10">
                    <img src={article?.author_image || `https://ui-avatars.com/api/?name=${article?.author_name}`} className="w-full h-full object-cover" alt="Author" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest">{article?.author_name || "Journal Staff"}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> {new Date(article?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 border transition-all font-black text-[10px] uppercase tracking-widest ${liked ? "bg-red-50 border-red-100 text-red-600" : "bg-white border-black/10 hover:border-black"}`}>
                    <Heart size={14} fill={liked ? "currentColor" : "none"} /> {likes}
                  </button>
                  <button onClick={toggleBookmark} className={`p-2 border transition-all ${bookmarked ? "bg-[#1E3A8A] border-[#1E3A8A] text-white" : "bg-white border-black/10 hover:border-black"}`}>
                    <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </header>

            {/* Featured Lead Image */}
            <div className="mt-10 relative group bg-gray-100 overflow-hidden border border-black/10">
              <img src={article?.image_url} className="w-full h-auto max-h-[600px] object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Cover" />
            </div>

            {/* Content Area */}
            <div className="mt-12">
              <div className="max-w-3xl mx-auto">
                <p className="text-xl md:text-2xl text-gray-500 italic border-l-4 border-[#F59E0B] pl-8 mb-12 leading-relaxed font-medium">
                  "{article?.excerpt}"
                </p>
                
                <div className="prose prose-lg max-w-none text-[#1a1a1a] leading-[1.8] space-y-8 font-serif mb-16">
                  {article?.content?.split("\n").map((paragraph, i) => (
                    paragraph.trim() && (
                      <p key={i} className={i === 0 ? "first-letter:text-6xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:mt-2 first-letter:text-[#1E3A8A]" : ""}>
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>

                {/* --- ARTICLE GALLERY (Supporting Photos) --- */}
                {article?.gallery && article.gallery.length > 0 && (
                  <section className="mt-20 border-t-2 border-black pt-12">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-2">
                        <ImagesIcon size={16} className="text-[#1E3A8A]" /> Visual Documentation
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {article.gallery.length} Exhibits
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {article.gallery.map((url, index) => (
                        <div key={index} className={`relative overflow-hidden border border-black/10 bg-gray-50 group ${
                          article.gallery.length === 1 ? 'md:col-span-2 h-[500px]' : 
                          (index === 0 && article.gallery.length % 2 !== 0) ? 'md:col-span-2 h-[450px]' : 'h-[300px]'
                        }`}>
                          <img 
                            src={url} 
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 cursor-crosshair" 
                            alt={`Gallery asset ${index + 1}`} 
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Footer Actions */}
                <div className="mt-16 pt-8 border-t-2 border-black flex flex-wrap gap-4">
                  <button onClick={shareFB} className="flex-1 bg-black text-white py-4 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1E3A8A] transition-colors">
                    <Share2 size={16} /> Share Journal
                  </button>
                  <button onClick={copyLink} className="flex-1 border-2 border-black text-black py-4 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all">
                    <LinkIcon size={16} /> Copy Archive URL
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* --- RIGHT: SIDEBAR --- */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="lg:sticky lg:top-24 space-y-12">
              
              {/* RELATED CONTENT */}
              <section className="bg-white border-t-4 border-black p-8 shadow-sm">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-[#1E3A8A]">
                  <Zap size={16} className="text-[#F59E0B]" fill="currentColor" /> Related Logs
                </h3>
                <div className="space-y-10">
                  {related.map((item) => (
                    <Link key={item.id} to={`/article/${item.id}`} className="group block">
                      <div className="aspect-video overflow-hidden border border-black/10 mb-4 bg-gray-50">
                        <img src={item.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="Thumbnail" />
                      </div>
                      <h4 className="font-black text-xs uppercase leading-tight group-hover:text-[#1E3A8A] transition-colors line-clamp-2 tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-3 italic">
                        "{item.excerpt}"
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              {/* DISCUSSION BOARD */}
              <section className="bg-black text-white p-8">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#F59E0B]" /> Discussion
                </h3>
                
                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {comments.map((c) => (
                    <div key={c.id} className="border-b border-white/10 pb-4">
                      <p className="text-xs text-gray-300 leading-relaxed font-medium uppercase tracking-tighter">{c.text}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#F59E0B]">Verified Reader</span>
                        <span className="text-[8px] text-gray-500 uppercase font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-10">
                      <Quote className="mx-auto text-white/10 mb-2" size={32} />
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">No entries recorded.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="SYNC YOUR THOUGHTS..."
                    className="w-full p-4 bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-white placeholder:text-white/20 outline-none focus:border-[#F59E0B] transition-colors resize-none"
                    rows="3"
                  />
                  <button onClick={addComment} className="w-full bg-[#1E3A8A] text-white py-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                    Post Entry
                  </button>
                </div>
              </section>

            </div>
          </aside>

        </div>
      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
        .prose p::first-letter { font-family: ui-sans-serif, system-ui; }
      `}} />
    </div>
  );
}