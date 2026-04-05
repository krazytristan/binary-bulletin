import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminTheBinar() {
  const [videos, setVideos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    author_name: "",
    video_url: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("FETCH:", data, error);

    setVideos(data || []);
  };

  // 🎥 CHECK YOUTUBE
  const isYouTube = (url) =>
    url?.includes("youtube.com") || url?.includes("youtu.be");

  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const id =
      url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    return `https://www.youtube.com/embed/${id}`;
  };

  // 🎥 FILE SELECT
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // 🚀 UPLOAD (FIXED WITH ERROR HANDLING)
  const uploadVideo = async () => {
    if (!file) return form.video_url;

    const name = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("articles")
      .upload(name, file);

    if (error) {
      console.error("UPLOAD ERROR:", error);
      alert("Upload failed");
      return null;
    }

    const { data } = supabase.storage
      .from("articles")
      .getPublicUrl(name);

    return data.publicUrl;
  };

  // 💾 SAVE (FULL FIX)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title) {
      alert("Title required");
      return;
    }

    setLoading(true);

    try {
      const url = await uploadVideo();

      console.log("VIDEO URL:", url);

      // 🚨 PREVENT NULL INSERT (MAIN FIX)
      if (!url) {
        alert("Please upload a video OR provide a video link");
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        video_url: url,
        video_type: file ? "file" : "link",
      };

      console.log("PAYLOAD:", payload);

      const { data, error } = await supabase
        .from("videos")
        .insert(payload)
        .select();

      console.log("INSERT RESULT:", data);
      console.log("INSERT ERROR:", error);

      if (error) {
        alert("Insert failed (check console)");
        return;
      }

      alert("Saved successfully ✅");

      setForm({
        title: "",
        excerpt: "",
        content: "",
        author_name: "",
        video_url: "",
      });

      setFile(null);
      setPreview("");
      setModalOpen(false);

      fetchVideos();
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ❌ DELETE
  const confirmDelete = async () => {
    await supabase.from("videos").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchVideos();
  };

  return (
    <div className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">The Binary Online</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          + Add Video
        </button>
      </div>

      {/* LIST */}
      {videos.length === 0 ? (
        <p className="text-gray-500">No videos yet.</p>
      ) : (
        videos.map((v) => (
          <div key={v.id} className="mb-6 bg-white p-4 rounded-xl shadow">

            <div className="flex justify-between items-center">
              <h3 className="font-bold">{v.title}</h3>

              <button
                onClick={() => setDeleteId(v.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>

            {/* VIDEO DISPLAY */}
            {v.video_type === "link" || isYouTube(v.video_url) ? (
              <iframe
                src={getYouTubeEmbed(v.video_url)}
                className="w-full h-40 mt-3 rounded"
                title="video"
              />
            ) : (
              <video
                src={v.video_url}
                controls
                className="w-full h-40 mt-3 rounded"
              />
            )}

            <p className="text-sm mt-2 text-gray-600">
              {v.excerpt}
            </p>

          </div>
        ))
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="font-bold mb-4">Add Video</h2>

            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <textarea
                placeholder="Excerpt"
                value={form.excerpt}
                onChange={(e) =>
                  setForm({ ...form, excerpt: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <textarea
                placeholder="Full Content"
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                className="w-full border p-2 rounded h-24"
              />

              <input
                placeholder="Author"
                value={form.author_name}
                onChange={(e) =>
                  setForm({ ...form, author_name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <input
                placeholder="Video URL (optional)"
                value={form.video_url}
                onChange={(e) =>
                  setForm({ ...form, video_url: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <p className="text-xs text-gray-400 text-center">
                OR upload video file
              </p>

              <input type="file" onChange={handleFile} />

              {preview && (
                <video
                  src={preview}
                  controls
                  className="h-32 w-full rounded"
                />
              )}

              {/* BUTTON */}
              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-400 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {loading ? "Saving..." : "Save"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-xl text-center">

            <p>Delete this video?</p>

            <div className="flex justify-center gap-3 mt-3">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={confirmDelete}>Delete</button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}