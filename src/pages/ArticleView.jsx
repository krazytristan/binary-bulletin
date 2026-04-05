import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ArticleView() {
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchComments();
    fetchLikes();
    checkBookmark();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [id]);

  // 🔥 SCROLL PROGRESS
  const handleScroll = () => {
    const total =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    const current = window.scrollY;
    setProgress((current / total) * 100);
  };

  // 🔥 FETCH ARTICLE
  const fetchArticle = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setArticle(data);

      const { data: relatedData } = await supabase
        .from("articles")
        .select("*")
        .eq("category", data.category)
        .neq("id", id)
        .limit(3);

      setRelated(relatedData || []);
    }
  };

  // 🖼 IMAGE FIX
  const getImage = (a) => {
    if (!a?.image_url) return "https://picsum.photos/800/400";

    const t = new Date(a.updated_at || a.created_at).getTime();
    return `${a.image_url}?t=${t}`;
  };

  // 👍 FETCH LIKES
  const fetchLikes = async () => {
    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("article_id", id);

    setLikes(data?.length || 0);
  };

  const handleLike = async () => {
    if (liked) return;

    await supabase.from("likes").insert({
      article_id: id,
    });

    setLikes((prev) => prev + 1);
    setLiked(true);
  };

  // 🔖 BOOKMARK
  const checkBookmark = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("article_id", id);

    if (data?.length > 0) setBookmarked(true);
  };

  const toggleBookmark = async () => {
    if (bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("article_id", id);

      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({
        article_id: id,
      });

      setBookmarked(true);
    }
  };

  // 💬 COMMENTS
  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const addComment = async () => {
    if (!comment) return;

    await supabase.from("comments").insert({
      article_id: id,
      text: comment,
    });

    setComment("");
    fetchComments();
  };

  // 🔗 SHARE
  const shareFB = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  };

  return (
    <div className="min-h-screen bg-light font-sans">

      <Navbar />

      {/* 🔥 PROGRESS BAR */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-1 bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {!article && (
          <p className="text-center text-gray-500">Loading...</p>
        )}

        {article && (
          <>
            {/* CATEGORY */}
            <span className="text-xs text-secondary font-semibold uppercase">
              {article.category}
            </span>

            {/* TITLE */}
            <h1 className="text-3xl font-bold mt-2">
              {article.title}
            </h1>

            {/* DATE */}
            <p className="text-sm text-gray-400 mt-1">
              {new Date(article.created_at).toLocaleDateString()}
            </p>

            {/* IMAGE */}
            <img
              src={getImage(article)}
              className="w-full h-80 object-cover rounded-xl mt-6"
            />

            {/* AUTHOR */}
            <div className="mt-6 flex items-center gap-3">
              <img
                src="/tristan.png"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-sm font-semibold">Campus Writer</p>
                <p className="text-xs text-gray-400">
                  Tristan Jorge Cuartero | The Binary Bulletin
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4 mt-6 flex-wrap">

              <button
                onClick={handleLike}
                className={`px-4 py-2 rounded ${
                  liked ? "bg-primary text-white" : "bg-gray-200"
                }`}
              >
                👍 {likes}
              </button>

              <button
                onClick={toggleBookmark}
                className={`px-4 py-2 rounded ${
                  bookmarked
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-200"
                }`}
              >
                🔖 {bookmarked ? "Saved" : "Save"}
              </button>

              <button
                onClick={shareFB}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Share
              </button>

              <button
                onClick={copyLink}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Copy Link
              </button>

            </div>

            {/* EXCERPT */}
            <p className="mt-6 italic border-l-4 border-primary pl-4">
              {article.excerpt}
            </p>

            {/* CONTENT */}
            <div className="mt-6 space-y-4 text-gray-800 leading-relaxed">
              {article.content?.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* 💬 COMMENTS */}
            <section className="mt-12">
              <h2 className="font-bold mb-3">Comments</h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border p-2 rounded"
                />
                <button
                  onClick={addComment}
                  className="bg-primary text-white px-4 rounded"
                >
                  Post
                </button>
              </div>

              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="bg-white p-3 rounded shadow">
                    <p className="text-sm">{c.text}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 🔥 RELATED */}
            <section className="mt-12">
              <h2 className="font-bold mb-3">Related Articles</h2>

              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.id} to={`/article/${r.id}`}>
                    <div className="bg-white rounded shadow hover:shadow-lg transition">
                      <img
                        src={getImage(r)}
                        className="h-32 w-full object-cover"
                      />
                      <p className="p-2 text-sm font-semibold">
                        {r.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* BACK */}
            <Link
              to="/news"
              className="inline-block mt-10 text-secondary text-sm"
            >
              ← Back to News
            </Link>

          </>
        )}

      </div>

      <Footer />
    </div>
  );
}