import { useEffect, useState } from "react";
import AdminLayout from "../AdminLayout";
import { supabase } from "../../lib/supabase";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

    const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "News",
    author_name: "Campus Writer", // ✅ ADDED
    author_image: "", // ✅ ADDED
    image: null,
    image_url: "",
    preview: "",
    });

  useEffect(() => {
    fetchArticles();
  }, []);

  // 🔥 FETCH ARTICLES
  const fetchArticles = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    setArticles(data || []);
    setLoading(false);
  };

  // 🔥 OPEN MODAL
  const openModal = (article = null) => {
    setEditing(article);

    if (article) {
      setForm({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content || "",
        category: article.category || "News",
        image: null,
        image_url: article.image_url,
        preview: article.image_url,
        author_name: article?.author_name || "Campus Writer",
        author_image: article?.author_image || "",
      });
    } else {
      setForm({
        title: "",
        excerpt: "",
        content: "",
        category: "News",
        image: null,
        image_url: "",
        preview: "",
      });
    }

    setModalOpen(true);
  };

  // 🔥 IMAGE CHANGE
  const handleImageChange = (file) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForm({
      ...form,
      image: file,
      preview: previewUrl,
    });
  };

  // 🔥 FIXED IMAGE UPLOAD (IMPORTANT)
  const uploadImage = async () => {
    if (!form.image) return form.image_url;

    const fileName = `${Date.now()}-${form.image.name}`;

    const { error } = await supabase.storage
      .from("articles")
      .upload(fileName, form.image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(error);
      setMessage({ type: "error", text: "Image upload failed" });
      return null;
    }

    const { data } = supabase.storage
      .from("articles")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

    // 🔥 SUCCESS + AUTO RELOAD (ALREADY GOOD — KEEP THIS)
    const showSuccessAndReload = (text) => {
    setMessage({ type: "success", text });

    setTimeout(() => {
        setMessage(null);
        window.location.reload(); // 🔥 final reload
    }, 3000);
    };

    // 🔥 SAVE (UPDATED FIX)
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

    let error;

    if (editing) {
        ({ error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editing.id));
    } else {
        ({ error } = await supabase.from("articles").insert([payload]));
    }

    setSaving(false);

    if (error) {
        setMessage({ type: "error", text: "Failed to save article" });
        return;
    }

    // 🔥 CLOSE MODAL FIRST
    setModalOpen(false);

    // 🔥 USE THIS INSTEAD (IMPORTANT FIX)
    showSuccessAndReload(
        editing
        ? "Article updated successfully!"
        : "Article created successfully!"
    );
    };

  // 🔥 DELETE
  const confirmDelete = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", deleteId);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Delete failed" });
      return;
    }

    setMessage({ type: "success", text: "Article deleted!" });
    setDeleteId(null);
    fetchArticles();
  };

  return (
    <AdminLayout title="Manage Articles">

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-bold">Articles</h2>

        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          + Add Article
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">

          {articles.length === 0 ? (
            <p>No articles yet.</p>
          ) : (
            articles.map((a) => (
              <div
                key={a.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div className="flex items-center gap-3">

                  {/* 🔥 FIXED IMAGE DISPLAY */}
                  <img
                    src={
                      a.image_url
                        ? `${a.image_url}?t=${new Date(
                            a.updated_at || a.created_at
                          ).getTime()}`
                        : "https://picsum.photos/400/200"
                    }
                    className="w-16 h-12 object-cover rounded"
                  />

                  <div>
                    <p className="font-semibold">{a.title}</p>

                    <p className="text-xs text-primary font-medium">
                      {a.category || "News"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>

                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openModal(a)}
                    className="text-blue-500 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="font-bold mb-4">
              {editing ? "Edit Article" : "Add Article"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                
                <input
                placeholder="Author Name"
                value={form.author_name}
                onChange={(e) =>
                    setForm({ ...form, author_name: e.target.value })
                }
                className="w-full border p-2 rounded"
                />

                <input
                placeholder="Author Image URL (optional)"
                value={form.author_image}
                onChange={(e) =>
                    setForm({ ...form, author_image: e.target.value })
                }
                className="w-full border p-2 rounded"
                />

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
                placeholder="Content"
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              {/* CATEGORY */}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option>News</option>
                <option>Sports</option>
                <option>Opinion</option>
                <option>Feature</option>
                <option>Editorial</option>
                <option>Literary</option>
              </select>

              {/* IMAGE */}
              <input
                type="file"
                onChange={(e) => handleImageChange(e.target.files[0])}
              />

              {form.preview && (
                <img
                  src={form.preview}
                  className="h-32 w-full object-cover rounded"
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
                  disabled={saving}
                  className="bg-primary text-white px-3 py-1 rounded flex items-center gap-2"
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  Save
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

            <h2 className="font-bold mb-3">Delete Article</h2>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this article?
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
                className="bg-red-500 text-white px-4 py-1 rounded flex items-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}