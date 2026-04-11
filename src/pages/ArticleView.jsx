import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);

    const loadData = async () => {
      try {
        await Promise.all([
          fetchArticle(),
          fetchComments(),
          fetchLikes(),
          checkBookmark(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [id]);

  // 🔥 READING PROGRESS
  const handleScroll = () => {
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const current = window.scrollY;
    setProgress((current / total) * 100);
  };

  // 🔥 FETCH CONTENT
  const fetchArticle = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setArticle(data);
      // Fetch related items from same category
      const { data: relatedData } = await supabase
        .from("articles")
        .select("*")
        .eq("category", data.category)
        .neq("id", id)
        .limit(4);
      setRelated(relatedData || []);
    }
  };

  const getImage = (a) => {
    if (!a?.image_url) return "https://picsum.photos/800/400";
    const t = new Date(a.updated_at || a.created_at).getTime();
    return `${a.image_url}?t=${t}`;
  };

  // 🔥 INTERACTION LOGIC
  const fetchLikes = async () => {
    const { data } = await supabase.from("likes").select("*").eq("article_id", id);
    setLikes(data?.length || 0);
  };

  const handleLike = async () => {
    if (liked) return;
    await supabase.from("likes").insert({ article_id: id });
    setLikes((prev) => prev + 1);
    setLiked(true);
  };

  const checkBookmark = async () => {
    const { data } = await supabase.from("bookmarks").select("*").eq("article_id", id);
    if (data?.length > 0) setBookmarked(true);
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

  // 🔥 COMMENTS LOGIC
  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", id)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await supabase.from("comments").insert({ article_id: id, text: comment });
    setComment("");
    fetchComments();
  };

  const shareFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`);
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />

      {/* Progress Line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
        <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-gray-200 w-24 rounded" />
            <div className="h-10 bg-gray-200 w-full rounded" />
            <div className="h-64 md:h-96 bg-gray-200 w-full rounded-2xl" />
          </div>
        ) : article && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* --- LEFT: MAIN CONTENT --- */}
            <main className="lg:col-span-8">
              <header>
                <Link to="/news" className="text-xs font-bold text-blue-600 uppercase tracking-tighter hover:underline">
                  ← Back to Feed
                </Link>
                <div className="mt-4">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                    {article.category}
                  </span>
                  <h1 className="text-2xl md:text-5xl font-black mt-3 leading-tight tracking-tight">
                    {article.title}
                  </h1>
                </div>

                <div className="flex items-center gap-3 mt-6 pb-6 border-b border-gray-50">
                  <img src={article.author_image || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-full object-cover" alt="Author" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">{article.author_name || "Campus Writer"}</p>
                    <p className="text-gray-400 text-xs">{new Date(article.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </header>

              <img src={getImage(article)} className="w-full h-auto max-h-[500px] object-cover rounded-2xl mt-6 shadow-sm" alt="Cover" />

              {/* ACTION BAR */}
              <div className="flex gap-2 md:gap-3 mt-6 flex-wrap">
                <button onClick={handleLike} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${liked ? "bg-red-50 text-red-600" : "bg-gray-100"}`}>
                  {liked ? "❤️" : "🤍"} {likes}
                </button>
                <button onClick={toggleBookmark} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${bookmarked ? "bg-blue-50 text-blue-600" : "bg-gray-100"}`}>
                  🔖 {bookmarked ? "Saved" : "Save"}
                </button>
                <button onClick={shareFB} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Share</button>
                <button onClick={copyLink} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm">Link</button>
              </div>

              {/* ARTICLE TEXT */}
              <article className="mt-8">
                <p className="text-lg md:text-xl text-slate-500 italic border-l-4 border-blue-600 pl-5 mb-8 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="text-slate-800 leading-relaxed space-y-6 text-base md:text-lg">
                  {article.content?.split("\n").map((p, i) => (
                    p.trim() && <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            </main>

            {/* --- RIGHT: SIDEBAR --- */}
            <aside className="lg:col-span-4 space-y-8 mt-12 lg:mt-0">
              <div className="lg:sticky lg:top-24 space-y-10">
                
                {/* RELATED NEWS COMPONENT */}
                <section className="bg-slate-50 p-5 md:p-6 rounded-3xl border border-gray-100">
                  <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                    Related News
                  </h3>
                  <div className="space-y-8">
                    {related.map((r) => (
                      <Link key={r.id} to={`/article/${r.id}`} className="group block">
                        <div className="space-y-3">
                          <img src={getImage(r)} className="w-full h-40 object-cover rounded-xl group-hover:opacity-90 transition shadow-sm" alt="Thumbnail" />
                          <div>
                            <h4 className="font-bold text-sm md:text-base leading-snug group-hover:text-blue-600 transition line-clamp-2">
                              {r.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                              {r.excerpt}
                            </p>
                            <div className="flex items-center justify-between mt-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter pt-2 border-t border-gray-100">
                              <span>{r.author_name || "Staff"}</span>
                              <span>{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* DISCUSSION COMPONENT */}
                <section className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-black text-lg mb-4 text-slate-900">Discussion</h3>
                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-sm text-slate-700 leading-snug">{c.text}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold text-right uppercase">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-xs text-gray-400 text-center py-4 italic">No comments yet.</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none focus:ring-1 focus:ring-blue-600 outline-none"
                      rows="2"
                    />
                    <button onClick={addComment} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition">
                      Post Comment
                    </button>
                  </div>
                </section>

              </div>
            </aside>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}