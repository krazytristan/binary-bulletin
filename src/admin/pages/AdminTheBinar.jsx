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
    const { data } = await supabase.from("videos").select("*");
    setVideos(data || []);
  };

  // 🎥 FILE
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // 🚀 UPLOAD
  const uploadVideo = async () => {
    if (!file) return form.video_url; // 🔥 use link if no file

    const name = `${Date.now()}-${file.name}`;

    await supabase.storage.from("articles").upload(name, file);

    const { data } = supabase.storage
      .from("articles")
      .getPublicUrl(name);

    return data.publicUrl;
  };

  // 💾 SAVE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title) {
      alert("Title required");
      return;
    }

    setLoading(true);

    try {
      const url = await uploadVideo();

      await supabase.from("videos").insert({
        ...form,
        video_url: url,
      });

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
      console.error(err);
      alert("Upload failed");
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
        <h1 className="text-xl font-bold">The Binar</h1>

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

            <video
              src={v.video_url}
              controls
              className="w-full h-40 mt-3 rounded"
            />

          </div>
        ))
      )}

      {/* 🔥 MODAL (LIKE ARTICLES) */}
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

              <input
                placeholder="Author"
                value={form.author_name}
                onChange={(e) =>
                  setForm({ ...form, author_name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              {/* 🔥 VIDEO LINK */}
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

              {/* FILE */}
              <input type="file" onChange={handleFile} />

              {/* PREVIEW */}
              {preview && (
                <video
                  src={preview}
                  controls
                  className="h-32 w-full rounded"
                />
              )}

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
                  className="bg-primary text-white px-3 py-1 rounded"
                >
                  {loading ? "Uploading..." : "Save"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 text-center">

            <h2 className="font-bold mb-3">Delete Video</h2>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-400 text-white px-4 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}