import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const initialForm = {
    title: "",
    excerpt: "",
    content: "",
    category: "News",
    author_name: "Campus Writer",
    author_image: "",
    image: null,
    image_url: "",
    preview: "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchArticles();
  }, []);

  // 🔥 FETCH ARTICLES
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 OPEN MODAL
  const openModal = (article = null) => {
    setEditing(article);
    if (article) {
      setForm({
        title: article.title || "",
        excerpt: article.excerpt || "",
        content: article.content || "",
        category: article.category || "News",
        image: null,
        image_url: article.image_url || "",
        preview: article.image_url || "",
        author_name: article.author_name || "Campus Writer",
        author_image: article.author_image || "",
      });
    } else {
      setForm(initialForm);
    }
    setModalOpen(true);
  };

  // 🔥 IMAGE CHANGE
  const handleImageChange = (file) => {
    if (!file) return;
    
    // Revoke old preview to save memory
    if (form.preview && !form.preview.startsWith('http')) {
      URL.revokeObjectURL(form.preview);
    }

    const previewUrl = URL.createObjectURL(file);
    setForm({ ...form, image: file, preview: previewUrl });
  };

  // 🔥 IMAGE UPLOAD
  const uploadImage = async () => {
    if (!form.image) return form.image_url;

    const fileName = `${Date.now()}-${form.image.name}`;
    const { error } = await supabase.storage
      .from("articles")
      .upload(fileName, form.image);

    if (error) {
      console.error(error);
      setMessage({ type: "error", text: "Image upload failed" });
      return null;
    }

    const { data } = supabase.storage.from("articles").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 🔥 SUCCESS + RELOAD
  const showSuccessAndReload = (text) => {
    setMessage({ type: "success", text });
    setTimeout(() => {
      setMessage(null);
      fetchArticles(); // Refresh data without full page reload
    }, 2000);
  };

  // 🔥 SAVE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }

    setSaving(true);
    const imageUrl = await uploadImage();

    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      image_url: imageUrl,
      updated_at: new Date(),
      author_name: form.author_name,
      author_image: form.author_image,
    };

    let result;
    if (editing) {
      result = await supabase.from("articles").update(payload).eq("id", editing.id);
    } else {
      result = await supabase.from("articles").insert([payload]);
    }

    setSaving(false);

    if (result.error) {
      setMessage({ type: "error", text: "Failed to save article" });
    } else {
      setModalOpen(false);
      showSuccessAndReload(editing ? "Updated successfully!" : "Created successfully!");
    }
  };

  // 🔥 DELETE
  const confirmDelete = async () => {
    setSaving(true);
    const { error } = await supabase.from("articles").delete().eq("id", deleteId);
    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Delete failed" });
    } else {
      // Optimistic UI: Remove from list immediately
      setArticles(articles.filter(a => a.id !== deleteId));
      setMessage({ type: "success", text: "Article deleted!" });
      setDeleteId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* MESSAGE NOTIFICATION */}
      {message && (
        <div className={`fixed top-5 right-5 z-[60] px-6 py-3 rounded-lg shadow-lg border transition-all animate-in slide-in-from-right-full ${
          message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Articles</h2>
          <p className="text-gray-500 text-sm">Manage your campus news and stories</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          + Add Article
        </button>
      </div>

      {/* LISTING SECTION */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {articles.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No articles found. Start by adding one!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {articles.map((a) => (
                <div key={a.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={a.image_url || "https://via.placeholder.com/400x200?text=No+Image"}
                      alt=""
                      className="w-20 h-14 object-cover rounded-md bg-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">
                          {a.category || "News"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => openModal(a)} className="flex-1 sm:flex-none px-4 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium transition">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(a.id)} className="flex-1 sm:flex-none px-4 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800">{editing ? "Edit Article" : "Create New Article"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <input placeholder="Author Name" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                <input placeholder="Author Image URL" value={form.author_image} onChange={(e) => setForm({ ...form, author_image: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                <input placeholder="Article Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
                  {["News", "Sports", "Opinion", "Feature", "Editorial", "Literary"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4">
                <textarea placeholder="Brief Excerpt" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" />
                <textarea placeholder="Main Content" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                {form.preview && (
                  <div className="relative group">
                    <img src={form.preview} alt="Preview" className="h-32 w-full object-cover rounded-xl border" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                      <span className="text-white text-xs font-bold">New Image Selected</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md disabled:bg-blue-300">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h2>
            <p className="text-gray-500 mb-8">This action cannot be undone. This article will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">No, Keep it</button>
              <button onClick={confirmDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition">
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}