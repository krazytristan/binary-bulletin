import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    image: null,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 📥 FETCH
  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  };

  // 📤 UPLOAD IMAGE
  const uploadImage = async (file) => {
    if (!file) return null;

    const fileName = `pubmat-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("pubmats")
      .upload(fileName, file);

    if (error) {
      alert("Image upload failed");
      return null;
    }

    const { data } = supabase.storage
      .from("pubmats")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // 💾 SAVE / UPDATE
  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    let imageUrl = null;

    if (form.image) {
      imageUrl = await uploadImage(form.image);
    }

    if (editing) {
      // UPDATE
      await supabase
        .from("announcements")
        .update({
          title: form.title,
          content: form.content,
          ...(imageUrl && { image_url: imageUrl }),
        })
        .eq("id", editing.id);
    } else {
      // INSERT
      await supabase.from("announcements").insert({
        title: form.title,
        content: form.content,
        image_url: imageUrl,
      });
    }

    setModalOpen(false);
    setEditing(null);
    setForm({ title: "", content: "", image: null });

    fetchAnnouncements();
    setLoading(false);
  };

  // ✏️ EDIT
  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      image: null,
    });
    setModalOpen(true);
  };

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  };

  return (
    <div className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Announcements Management
        </h1>

        <button
          onClick={() => {
            setEditing(null);
            setForm({ title: "", content: "", image: null });
            setModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          + Add Announcement
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="border p-4 rounded-lg">

              {a.image_url && (
                <img
                  src={a.image_url}
                  alt=""
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}

              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(a)}
                    className="text-blue-500 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm">{a.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-lg">

            <h2 className="text-lg font-bold mb-4">
              {editing ? "Edit Announcement" : "Add Announcement"}
            </h2>

            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            <textarea
              placeholder="Content"
              rows="4"
              value={form.content}
              onChange={(e) =>
                setForm({ ...form, content: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            {/* IMAGE UPLOAD */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, image: e.target.files[0] })
              }
              className="mb-3"
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                {loading ? "Saving..." : "Save"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}