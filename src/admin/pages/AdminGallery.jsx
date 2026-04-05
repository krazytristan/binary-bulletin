import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminGallery() {
  const [events, setEvents] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);

  const [deleteId, setDeleteId] = useState(null);

  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentAlbum, setCurrentAlbum] = useState([]);

  const fileInputRef = useRef();

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data } = await supabase.from("gallery").select("*");
    setEvents(data || []);
  };

  // 🧠 COMPRESS IMAGE
  const compressImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => (img.src = e.target.result);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 800 / img.width;

        canvas.width = 800;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        }, "image/jpeg", 0.7);
      };

      reader.readAsDataURL(file);
    });

  // 🔥 PROCESS FILES
  const processFiles = async (selected) => {
    let compressed = [];

    for (let file of selected) {
      const c = await compressImage(file);
      compressed.push(c);
    }

    const newFiles = [...files, ...compressed];
    setFiles(newFiles);
    setPreview(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleFiles = (e) => processFiles(Array.from(e.target.files));

  const handleDrop = (e) => {
    e.preventDefault();
    processFiles(Array.from(e.dataTransfer.files));
  };

  // ❌ REMOVE IMAGE
  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreview(newFiles.map((f) => URL.createObjectURL(f)));
  };

  // 🚀 UPLOAD
  const uploadImages = async () => {
    let urls = [];

    for (let file of files) {
      const name = `${Date.now()}-${file.name}`;

      await supabase.storage.from("articles").upload(name, file);

      const { data } = supabase.storage
        .from("articles")
        .getPublicUrl(name);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  // 💾 SAVE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) return alert("Title required");

    const imageUrls = await uploadImages();

    if (editing) {
      await supabase
        .from("gallery")
        .update({
          title,
          images: imageUrls.length ? imageUrls : editing.images,
        })
        .eq("id", editing.id);
    } else {
      await supabase.from("gallery").insert({
        title,
        images: imageUrls,
      });
    }

    resetForm();
    fetchGallery();
  };

  const resetForm = () => {
    setTitle("");
    setFiles([]);
    setPreview([]);
    setModalOpen(false);
    setEditing(null);
  };

  // ✏️ EDIT
  const openEdit = (e) => {
    setEditing(e);
    setTitle(e.title);
    setPreview(e.images || []);
    setFiles([]);
    setModalOpen(true);
  };

  // ❌ DELETE
  const confirmDelete = async () => {
    await supabase.from("gallery").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchGallery();
  };

  // 🖼 VIEWER
  const openViewer = (images, index) => {
    setCurrentAlbum(images);
    setViewerIndex(index);
    setViewer(images[index]);
  };

  const nextImage = () => {
    const next = (viewerIndex + 1) % currentAlbum.length;
    setViewerIndex(next);
    setViewer(currentAlbum[next]);
  };

  const prevImage = () => {
    const prev =
      (viewerIndex - 1 + currentAlbum.length) % currentAlbum.length;
    setViewerIndex(prev);
    setViewer(currentAlbum[prev]);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!viewer) return;

      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setViewer(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewer, viewerIndex]);

  return (
    <div className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Gallery Albums</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          + Create Album
        </button>
      </div>

      {/* ALBUM GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {events.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow">

            <img
              src={e.images?.[0]}
              className="h-40 w-full object-cover cursor-pointer"
              onClick={() => openViewer(e.images, 0)}
            />

            <div className="p-4 flex justify-between">
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-xs text-gray-400">
                  {e.images?.length} photos
                </p>
              </div>

              <div className="flex gap-2 text-sm">
                <button onClick={() => openEdit(e)} className="text-blue-500">
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(e.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 p-2">
              {e.images?.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => openViewer(e.images, i)}
                  className="h-16 object-cover cursor-pointer"
                />
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-lg">

            <h2 className="font-bold mb-4">
              {editing ? "Edit Album" : "Create Album"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Album Title"
              />

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed p-6 text-center rounded-lg cursor-pointer"
              >
                Drag & drop images
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFiles}
                  className="hidden"
                />
              </div>

              {/* SCROLL PREVIEW */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {preview.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="h-24 w-full object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button className="bg-primary text-white px-3 py-1 rounded">
                  Save
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* IMAGE VIEWER */}
      {viewer && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

          <button onClick={prevImage} className="absolute left-5 text-white text-3xl">‹</button>

          <img src={viewer} className="max-h-[90%] max-w-[90%]" />

          <button onClick={nextImage} className="absolute right-5 text-white text-3xl">›</button>

          <button
            onClick={() => setViewer(null)}
            className="absolute top-5 right-5 text-white text-xl"
          >
            ✕
          </button>

        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-xl text-center">

            <p>Delete this album?</p>

            <div className="flex gap-3 justify-center mt-3">
              <button onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={confirmDelete}>Delete</button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}