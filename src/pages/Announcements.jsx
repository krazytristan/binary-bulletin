import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle
} from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
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

  const channelRef = useRef(null)

  // 🎨 Avatar color generator
  const getColor = (id) => {
    const colors = [
      "bg-red-500","bg-blue-500","bg-green-500",
      "bg-purple-500","bg-pink-500","bg-yellow-500"
    ];
    return colors[id?.charCodeAt(0) % colors.length];
  };

  const getInitial = (id) => id?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setSelected(null);
    }
  };

  window.addEventListener("keydown", handleEsc);

  return () => {
    window.removeEventListener("keydown", handleEsc);
  };
}, []);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    fetchAnnouncements();
  };

  const fetchAnnouncements = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setLatest(data[0]);
      setAnnouncements(data.slice(1));

      data.forEach((a) => {
        getCounts(a.id);
        checkUserActions(a.id);
      });
    }

    setLoading(false);
  };

  // 📊 COUNTS
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

  const checkUserActions = async (id) => {
    if (!user) return;

    const { data: liked } = await supabase
      .from("announcement_likes")
      .select("*")
      .eq("announcement_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: saved } = await supabase
      .from("announcement_bookmarks")
      .select("*")
      .eq("announcement_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLikedMap((p) => ({ ...p, [id]: !!liked }));
    setBookmarks((p) => ({ ...p, [id]: !!saved }));
  };

  // ❤️ LIKE
  const handleLike = async (id) => {
    if (!user) return alert("Login required");

    if (likedMap[id]) {
      await supabase.from("announcement_likes")
        .delete()
        .eq("announcement_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("announcement_likes").insert({
        announcement_id: id,
        user_id: user.id
      });
    }

    fetchAnnouncements();
  };

  // 🔖 BOOKMARK
  const handleBookmark = async (id) => {
    if (!user) return alert("Login required");

    if (bookmarks[id]) {
      await supabase.from("announcement_bookmarks")
        .delete()
        .eq("announcement_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("announcement_bookmarks").insert({
        announcement_id: id,
        user_id: user.id
      });
    }

    fetchAnnouncements();
  };

  // 🔗 SHARE
  const handleShare = (id) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/announcement/${id}`
    );
    alert("Link copied!");
  };

  // 💬 FETCH COMMENTS
  const fetchComments = async (id) => {
    const { data } = await supabase
      .from("announcement_comments")
      .select("*")
      .eq("announcement_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  // 🔥 REALTIME (SAFE)
  useEffect(() => {
    if (!selected) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("comments-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcement_comments"
        },
        (payload) => {
          if (payload.new.announcement_id === selected.id) {
            setComments((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selected]);

  // 💬 ADD COMMENT
  const handleComment = async () => {
    if (!newComment || !user) return;

    await supabase.from("announcement_comments").insert({
      announcement_id: selected.id,
      user_id: user.id,
      comment: newComment
    });

    setNewComment("");
    getCounts(selected.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 text-center px-4 shadow">
        <h1 className="text-3xl md:text-5xl font-bold">Announcements</h1>
        <p className="mt-2 opacity-80">
          Stay updated with the latest news and events
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading announcements...
          </p>
        )}

        {/* FEATURED */}
        {!loading && latest && (
          <div className="mb-10 bg-white rounded-2xl shadow overflow-hidden">

            {latest.image_url && (
              <img
                src={latest.image_url}
                className="w-full h-72 object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-xl font-bold">{latest.title}</h2>
              <p className="text-gray-600 mt-2">{latest.content}</p>

              <div className="flex gap-4 mt-4">

                <button onClick={() => handleLike(latest.id)}>
                  ❤️ {likes[latest.id] || 0}
                </button>

                <button onClick={() => {
                  setSelected(latest);
                  fetchComments(latest.id);
                }}>
                  💬 {commentsCount[latest.id] || 0}
                </button>

                <button onClick={() => handleBookmark(latest.id)}>🔖</button>
                <button onClick={() => handleShare(latest.id)}>🔗</button>

              </div>
            </div>

          </div>
        )}

        {/* LIST */}
        <div className="grid gap-6 md:grid-cols-2">

          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
            >

              {a.image_url && (
                <img
                  src={a.image_url}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}

              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{a.content}</p>

              <div className="flex gap-3 mt-3">

                <button onClick={() => handleLike(a.id)}>
                  ❤️ {likes[a.id] || 0}
                </button>

                <button onClick={() => {
                  setSelected(a);
                  fetchComments(a.id);
                }}>
                  💬 {commentsCount[a.id] || 0}
                </button>

                <button onClick={() => handleBookmark(a.id)}>🔖</button>
                <button onClick={() => handleShare(a.id)}>🔗</button>

              </div>

            </div>
          ))}

        </div>

      </div>

      {/* COMMENTS MODAL */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
          onClick={() => setSelected(null)} // ✅ click outside closes
        >

          <div
            className="bg-white w-full max-w-lg rounded-xl p-5"
            onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">{selected.title}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* COMMENTS */}
            <div className="space-y-3 max-h-72 overflow-y-auto">

              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">

                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs ${getColor(c.user_id)}`}>
                    {getInitial(c.user_id)}
                  </div>

                  <div className="flex-1">
                    <div className="bg-gray-100 p-2 rounded">
                      {c.comment}
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 mt-1">

                      <span>{new Date(c.created_at).toLocaleString()}</span>

                      {user?.id === c.user_id && (
                        <button
                          onClick={async () => {
                            await supabase
                              .from("announcement_comments")
                              .delete()
                              .eq("id", c.id);

                            setComments((prev) =>
                              prev.filter((x) => x.id !== c.id)
                            );
                          }}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      )}

                    </div>
                  </div>

                </div>
              ))}

            </div>

            {/* INPUT */}
            <div className="flex gap-2 mt-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border p-2 rounded-full"
                placeholder="Write a comment..."
              />
              <button
                onClick={handleComment}
                className="bg-primary text-white px-4 rounded-full"
              >
                Post
              </button>
            </div>

          </div>

        </div>
      )}
      <Footer />
    </div>
  );
}