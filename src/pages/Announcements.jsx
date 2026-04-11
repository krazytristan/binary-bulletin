import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Trash2,
  Search,
} from "lucide-react";

// 🎨 YOUR PALETTE
const colors = {
  primary: "#1E3A8A",
  secondary: "#2563EB",
  light: "#F9FAFB",
  dark: "#111827",
  accent: "#F59E0B",
};

export default function Announcements() {
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
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Prevents double-execution in React Strict Mode
  const isInitialRender = useRef(true);

  // FORMAT DATE
  const formatDate = (date) =>
    new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // TRUNCATE
  const truncate = (text, length = 120) =>
    text && text.length > length ? text.substring(0, length) + "..." : text;

  // ESC CLOSE MODAL
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // INIT & FETCH DATA
  useEffect(() => {
    if (isInitialRender.current) {
      const init = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        fetchAnnouncements(authUser); // Pass user directly to avoid stale state
      };
      init();
      isInitialRender.current = false;
    }
  }, []);

  const fetchAnnouncements = async (currentUser) => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setLatest(data[0]);
      setAnnouncements(data.slice(1));
      setFiltered(data.slice(1));

      data.forEach((a) => {
        getCounts(a.id);
        checkUserActions(a.id, currentUser);
      });
    }
    setLoading(false);
  };

  // SEARCH
  useEffect(() => {
    const result = announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, announcements]);

  // GET COUNTS
  const getCounts = async (id) => {
    const { count: likeCount } = await supabase
      .from("announcement_likes")
      .select("*", { count: "exact", head: true })
      .eq("announcement_id", id);

    const { count: commentCount } = await supabase
      .from("announcement_comments")
      .select("*", { count: "exact", head: true })
      .eq("announcement_id", id);

    setLikes((p) => ({ ...p, [id]: likeCount || 0 }));
    setCommentsCount((p) => ({ ...p, [id]: commentCount || 0 }));
  };

  // USER ACTIONS
  const checkUserActions = async (id, currentUser) => {
    if (!currentUser) return;

    const { data: liked } = await supabase
      .from("announcement_likes")
      .select("id")
      .eq("announcement_id", id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    const { data: saved } = await supabase
      .from("announcement_bookmarks")
      .select("id")
      .eq("announcement_id", id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setLikedMap((p) => ({ ...p, [id]: !!liked }));
    setBookmarks((p) => ({ ...p, [id]: !!saved }));
  };

  // LIKE
  const handleLike = async (id) => {
    if (!user) return setToast("Login required");

    const wasLiked = likedMap[id];
    setLikedMap((p) => ({ ...p, [id]: !p[id] }));
    setLikes((p) => ({
      ...p,
      [id]: wasLiked ? p[id] - 1 : (p[id] || 0) + 1,
    }));

    if (wasLiked) {
      await supabase
        .from("announcement_likes")
        .delete()
        .eq("announcement_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("announcement_likes")
        .insert({ announcement_id: id, user_id: user.id });
    }
  };

  // BOOKMARK
  const handleBookmark = async (id) => {
    if (!user) return setToast("Login required");

    if (bookmarks[id]) {
      await supabase
        .from("announcement_bookmarks")
        .delete()
        .eq("announcement_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("announcement_bookmarks")
        .insert({ announcement_id: id, user_id: user.id });
    }

    setBookmarks((p) => ({ ...p, [id]: !p[id] }));
  };

  // SHARE
  const handleShare = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/announcement/${id}`);
    setToast("Link copied!");
  };

  // FETCH COMMENTS
  const fetchComments = async (id) => {
    const { data } = await supabase
      .from("announcement_comments")
      .select("*")
      .eq("announcement_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  // ADD COMMENT
  const handleComment = async () => {
    if (!newComment.trim() || !user) return;

    await supabase.from("announcement_comments").insert({
      announcement_id: selected.id,
      user_id: user.id,
      comment: newComment,
    });

    setNewComment("");
  };

  // EDIT MODE
  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;

    await supabase
      .from("announcement_comments")
      .update({ comment: editText })
      .eq("id", id);

    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // DELETE COMMENT
  const deleteComment = async (id) => {
    await supabase.from("announcement_comments").delete().eq("id", id);
  };

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!selected) return;

    const channel = supabase
      .channel(`realtime-comments-${selected.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcement_comments",
          filter: `announcement_id=eq.${selected.id}`,
        },
        (payload) => {
          setComments((prev) => [payload.new, ...prev]);
          setCommentsCount((p) => ({
            ...p,
            [selected.id]: (p[selected.id] || 0) + 1,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "announcement_comments",
          filter: `announcement_id=eq.${selected.id}`,
        },
        (payload) => {
          setComments((prev) =>
            prev.map((c) => (c.id === payload.new.id ? payload.new : c))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "announcement_comments",
        },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          setCommentsCount((p) => ({
            ...p,
            [selected.id]: Math.max((p[selected.id] || 1) - 1, 0),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected]);

  // TOAST AUTO HIDE
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const avatar = (id) => id?.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#1E3A8A] text-white py-16 text-center shadow-lg">
        <h1 className="text-4xl font-bold">Announcements</h1>
        <p className="opacity-80 mt-2">Stay updated with latest news</p>
      </section>

      <div className="max-w-6xl mx-auto p-6">
        {/* SEARCH */}
        <div className="flex items-center gap-2 mb-6 bg-white p-3 rounded-xl shadow">
          <Search size={18} className="text-[#2563EB]" />
          <input
            placeholder="Search announcements..."
            className="w-full outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-500">
            Loading announcements...
          </div>
        )}

        {!loading && !latest && (
          <p className="text-center text-gray-500">No announcements yet</p>
        )}

        {/* FEATURED */}
        {latest && (
          <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
            {latest.image_url && (
              <img src={latest.image_url} className="w-full h-72 object-cover" alt="Latest" />
            )}

            <div className="p-6">
              <p className="text-xs text-gray-400">
                {formatDate(latest.created_at)}
              </p>
              <h2 className="text-2xl font-bold">{latest.title}</h2>

              <p className="mt-3 whitespace-pre-line">
                {expanded[latest.id]
                  ? latest.content
                  : truncate(latest.content, 200)}
              </p>

              <button
                onClick={() =>
                  setExpanded((p) => ({
                    ...p,
                    [latest.id]: !p[latest.id],
                  }))
                }
                className="text-[#2563EB] text-sm mt-1"
              >
                {expanded[latest.id] ? "Show Less" : "Read More"}
              </button>

              <div className="flex gap-6 mt-4 items-center">
                <button
                  onClick={() => handleLike(latest.id)}
                  className="flex gap-1"
                >
                  <Heart
                    size={18}
                    className={
                      likedMap[latest.id] ? "text-red-500 fill-red-500" : ""
                    }
                  />
                  {likes[latest.id] || 0}
                </button>

                <button
                  onClick={() => {
                    setSelected(latest);
                    fetchComments(latest.id);
                  }}
                  className="flex gap-1"
                >
                  <MessageCircle size={18} />
                  {commentsCount[latest.id] || 0}
                </button>

                <Bookmark
                  size={18}
                  onClick={() => handleBookmark(latest.id)}
                  className={
                    bookmarks[latest.id]
                      ? "text-[#F59E0B] fill-[#F59E0B] cursor-pointer"
                      : "cursor-pointer"
                  }
                />

                <Share2
                  size={18}
                  className="cursor-pointer"
                  onClick={() => handleShare(latest.id)}
                />
              </div>
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-md p-5">
              <p className="text-xs text-gray-400">
                {formatDate(a.created_at)}
              </p>

              {a.image_url && (
                <img
                  src={a.image_url}
                  className="w-full h-40 object-cover rounded mb-3"
                  alt={a.title}
                />
              )}

              <h3 className="font-semibold text-lg">{a.title}</h3>

              <p className="text-sm mt-2 whitespace-pre-line">
                {expanded[a.id] ? a.content : truncate(a.content)}
              </p>

              <button
                onClick={() =>
                  setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))
                }
                className="text-[#2563EB] text-xs"
              >
                {expanded[a.id] ? "Show Less" : "Read More"}
              </button>

              <div className="flex gap-5 mt-3 items-center">
                <button
                  onClick={() => handleLike(a.id)}
                  className="flex gap-1"
                >
                  <Heart
                    size={16}
                    className={
                      likedMap[a.id] ? "text-red-500 fill-red-500" : ""
                    }
                  />
                  {likes[a.id] || 0}
                </button>

                <button
                  onClick={() => {
                    setSelected(a);
                    fetchComments(a.id);
                  }}
                  className="flex gap-1"
                >
                  <MessageCircle size={16} />
                  {commentsCount[a.id] || 0}
                </button>

                <Bookmark
                  size={16}
                  onClick={() => handleBookmark(a.id)}
                  className={
                    bookmarks[a.id]
                      ? "text-[#F59E0B] fill-[#F59E0B] cursor-pointer"
                      : "cursor-pointer"
                  }
                />

                <Share2
                  size={16}
                  className="cursor-pointer"
                  onClick={() => handleShare(a.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold text-lg text-[#111827]">
                Comments
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* COMMENTS LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 && (
                <p className="text-center text-gray-400 text-sm">
                  No comments yet
                </p>
              )}

              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 items-start group">
                  {/* AVATAR */}
                  <div className="bg-[#1E3A8A] text-white rounded-full w-9 h-9 flex-shrink-0 flex items-center justify-center text-xs font-semibold">
                    {avatar(c.user_id)}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-xl px-3 py-2 shadow-sm">
                      {editingId === c.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full border p-2 rounded text-sm outline-none"
                          />
                          <div className="flex gap-2 text-xs">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="bg-[#2563EB] text-white px-3 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-300 px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#111827]">{c.comment}</p>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {user?.id === c.user_id && editingId !== c.id && (
                      <div className="flex gap-3 text-xs mt-1 ml-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-[#2563EB] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT */}
            <div className="border-t p-3 flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                placeholder="Write a comment..."
              />
              <button
                onClick={handleComment}
                className="bg-[#2563EB] hover:bg-[#1E40AF] text-white px-5 rounded-full text-sm font-medium transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-[#111827] text-white px-4 py-2 rounded shadow-lg z-[100]">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}