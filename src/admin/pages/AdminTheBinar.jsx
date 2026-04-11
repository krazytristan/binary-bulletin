import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Plus, Video, Link as LinkIcon, X, Loader2 } from "lucide-react";

export default function AdminTheBinar() {
  const [videos, setVideos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    author_name: "",
    video_url: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    setVideos(data || []);
    setFetching(false);
  };

  // 🎥 IMPROVED YOUTUBE LOGIC
  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");

  // 🎥 FILE SELECT
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    // Cleanup previous preview memory
    if (preview) URL.revokeObjectURL(preview);

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setForm({ ...form, video_url: "" }); // Clear URL if file is chosen
  };

  // 🚀 UPLOAD
  const uploadVideo = async () => {
    if (!file) return form.video_url;

    const name = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("articles").upload(name, file);

    if (error) {
      console.error("UPLOAD ERROR:", error);
      return null;
    }

    const { data } = supabase.storage.from("articles").getPublicUrl(name);
    return data.publicUrl;
  };

  // 💾 SAVE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Title required");

    setLoading(true);
    try {
      const finalUrl = await uploadVideo();

      if (!finalUrl && !form.video_url) {
        alert("Please upload a video OR provide a video link");
        setLoading(false);
        return;
      }

      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        author_name: form.author_name,
        video_url: finalUrl,
        video_type: file ? "file" : "link",
      };

      const { error } = await supabase.from("videos").insert([payload]);

      if (error) throw error;

      // Reset
      setForm({ title: "", excerpt: "", content: "", author_name: "", video_url: "" });
      setFile(null);
      setPreview("");
      setModalOpen(false);
      fetchVideos();
    } catch (err) {
      console.error(err);
      alert("Error saving video");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from("videos").delete().eq("id", deleteId);
    if (!error) {
      setVideos(videos.filter(v => v.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">The Binary Online</h1>
          <p className="text-gray-500">Manage video content and reports.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> Add Video
        </button>
      </div>

      {/* LIST GRID */}
      {fetching ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : videos.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center">
          <Video className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No videos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
              <div className="aspect-video bg-gray-900 relative">
                {isYouTube(v.video_url) ? (
                  <iframe
                    src={getYouTubeEmbed(v.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video src={v.video_url} controls className="w-full h-full object-cover" />
                )}
                <button 
                  onClick={() => setDeleteId(v.id)}
                  className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {v.video_type === 'link' ? 'Remote Link' : 'Internal File'}
                </span>
                <h3 className="font-bold text-gray-900 line-clamp-1">{v.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{v.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Add Video Content</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Title</label>
                <input
                  required
                  placeholder="Enter video headline"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border-gray-100 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Excerpt</label>
                <textarea
                  placeholder="Short description..."
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full border-gray-100 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border h-20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Author</label>
                    <input
                        placeholder="Name"
                        value={form.author_name}
                        onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                        className="w-full border-gray-100 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border transition"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><LinkIcon size={12}/> Link</label>
                    <input
                        placeholder="YouTube/Vimeo URL"
                        value={form.video_url}
                        onChange={(e) => {
                            setForm({ ...form, video_url: e.target.value });
                            setFile(null); // Clear file if URL is typed
                            setPreview("");
                        }}
                        className="w-full border-gray-100 bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border transition"
                    />
                </div>
              </div>

              <div className="relative border-2 border-dashed border-gray-100 rounded-2xl p-4 bg-gray-50 text-center">
                <input type="file" accept="video/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-sm text-gray-500">
                  <Video className="mx-auto mb-2 text-gray-400" />
                  {file ? <span className="text-blue-600 font-bold">{file.name}</span> : "Click to upload video file instead"}
                </div>
              </div>

              {preview && (
                <video src={preview} className="h-32 w-full rounded-xl object-cover bg-black" />
              )}

              <button
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition disabled:bg-gray-300 shadow-xl shadow-blue-100 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Publish Video"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Video?</h2>
            <p className="text-gray-500 mb-6">This action is permanent and will remove the video from the site.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-100">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}