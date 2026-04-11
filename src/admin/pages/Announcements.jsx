import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    image: null,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 📥 FETCH DATA
  const fetchAnnouncements = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setAnnouncements(data || []);
    setFetching(false);
  };

  // 🖼️ HANDLE IMAGE SELECTION (PREVIEW)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // 📤 UPLOAD IMAGE
  const uploadImage = async (file) => {
    if (!file) return null;
    const fileName = `pubmat-${Date.now()}-${file.name.replace(/\s/g, '_')}`;

    const { error } = await supabase.storage
      .from("pubmats")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("pubmats").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 💾 SAVE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return alert("Please fill in all required fields.");

    setLoading(true);
    let imageUrl = editing?.image_url || null;

    if (form.image) {
      const uploadedUrl = await uploadImage(form.image);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const payload = {
      title: form.title,
      content: form.content,
      image_url: imageUrl,
    };

    const { error } = editing 
      ? await supabase.from("announcements").update(payload).eq("id", editing.id)
      : await supabase.from("announcements").insert([payload]);

    if (error) {
      alert("Error saving announcement");
    } else {
      closeModal();
      fetchAnnouncements();
    }
    setLoading(false);
  };

  // ✏️ EDIT MODE
  const handleEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, image: null });
    setPreview(item.image_url);
    setModalOpen(true);
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this? This action cannot be undone.")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) fetchAnnouncements();
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPreview(null);
    setForm({ title: "", content: "", image: null });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50/50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements</h1>
          <p className="text-gray-500 text-sm">Create and manage public updates for the bulletin.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      {/* LISTING */}
      {fetching ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="relative h-48 bg-gray-200">
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={40} /></div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => handleEdit(a)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">
                  {new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{a.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">{a.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Enter a catchy title..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows="5"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Write the announcement details here..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Featured Image</label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <ImageIcon className="text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {editing ? "Update Post" : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}