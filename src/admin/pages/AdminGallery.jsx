import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import { logActivity } from "../../utils/cmsService";
import SmartImage from "../../components/SmartImage";
import { ACCEPTED_IMAGE_INPUT, validateImageFile } from "../../utils/imageUtils";
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Loader2,
  Clock
} from "lucide-react";

export default function AdminGallery() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canDelete = hasPermission(role, "deleteMedia");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [viewerIndex, setViewerIndex] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState([]);

  const fileInputRef = useRef();

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  const processFiles = async (selected) => {
    setUploadError("");
    const validFiles = [];
    const errors = [];

    for (const file of selected) {
      const check = await validateImageFile(file);
      if (!check.valid) {
        errors.push(`${file.name}: ${check.error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setUploadError(errors[0]);
    }
    if (validFiles.length === 0) return;

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    setPreview(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const uploadImages = async () => {
    let urls = [];
    for (let file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const name = `gallery/${Date.now()}-${safeName}`;
      await supabase.storage.from("articles").upload(name, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
      const { data } = supabase.storage.from("articles").getPublicUrl(name);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setActionLoading(true);
    try {
      const imageUrls = await uploadImages();
      const payload = {
        title,
        images: imageUrls.length ? imageUrls : editing?.images || [],
      };

      if (editing) {
        await supabase.from("gallery").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("gallery").insert([payload]);
      }
      await logActivity({
        action: `${editing ? "Updated" : "Created"} gallery album "${title}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "gallery",
      });
      resetForm();
      fetchGallery();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setFiles([]);
    setPreview([]);
    setModalOpen(false);
    setEditing(null);
  };

  const openEdit = (album) => {
    setEditing(album);
    setTitle(album.title);
    setPreview(album.images || []);
    setFiles([]);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      alert("Your role does not permit deleting gallery albums.");
      setDeleteId(null);
      return;
    }
    await supabase.from("gallery").delete().eq("id", deleteId);
    await logActivity({
      action: `Deleted gallery album #${deleteId}`,
      userId: user?.id,
      userName: profile?.full_name,
      userRole: role,
      entityType: "gallery",
      entityId: deleteId,
    });
    setDeleteId(null);
    fetchGallery();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Photo Gallery</h1>
          <p className="text-gray-500">Manage campus photojournalism albums and exhibits.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-none text-sm font-bold hover:bg-red-900 transition"
          >
            <PlusCircle size={16} /> New Album
          </button>
        </div>
      </div>

      {/* ALBUM GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-none animate-pulse border border-gray-100 " />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((album) => (
            <div key={album.id} className="bg-white rounded-none  border border-gray-100 overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-gray-50">
                <SmartImage
                  src={album.images?.[0]}
                  alt={album.title || "Album thumbnail"}
                  mode="card"
                  fit="auto"
                  containerClassName="h-48"
                  className="cursor-pointer"
                  onClick={() => { setCurrentAlbum(album.images); setViewerIndex(0); }}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-none text-[10px] font-bold text-gray-600 ">
                  {album.images?.length} PHOTOS
                </div>
              </div>

              {/* Album Info */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm truncate">{album.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {new Date(album.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(album)} className="p-1.5 text-gray-400 hover:text-blue-900 transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => setDeleteId(album.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL (Matches Dashboard Create Style) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/20 backdrop-blur-sm" onClick={resetForm} />
          
          <div className="relative bg-white w-full max-w-xl rounded-none  flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Edit Album" : "Create New Album"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Album Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-none text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition"
                  placeholder="e.g. Science Fair 2026"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Upload Assets</label>
                <div
                  onDrop={(e) => { e.preventDefault(); processFiles(Array.from(e.dataTransfer.files)); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-gray-200 p-8 text-center rounded-none cursor-pointer hover:bg-gray-50 transition"
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Click to browse or drag and drop</p>
                  <input type="file" multiple ref={fileInputRef} onChange={(e) => processFiles(Array.from(e.target.files))} className="hidden" accept={ACCEPTED_IMAGE_INPUT} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">JPG, JPEG, PNG, or WebP. Original image proportions & quality are preserved.</p>
                {uploadError && <p className="text-xs text-red-600 mt-1.5 font-medium">{uploadError}</p>}
              </div>

              {preview.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {preview.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-none overflow-hidden border border-gray-100 bg-gray-50">
                      <SmartImage src={img} alt={`Preview ${i + 1}`} mode="preview" fit="contain" containerClassName="h-full w-full" />
                      <button type="button" onClick={() => {
                        const newFiles = files.filter((_, idx) => idx !== i);
                        setFiles(newFiles);
                        setPreview(newFiles.map(f => URL.createObjectURL(f)));
                      }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-none z-10">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <div className="p-6 border-t border-gray-50 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={handleSubmit}
                className="bg-blue-900 hover:bg-red-900 text-white px-6 py-2 rounded-none font-bold text-sm flex items-center gap-2 transition"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Album"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWER DIALOG */}
      {viewerIndex !== null && (
        <div className="fixed inset-0 bg-blue-900/95 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <button onClick={() => setViewerIndex(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition"><X size={32} /></button>
          
          <button onClick={() => setViewerIndex(prev => (prev - 1 + currentAlbum.length) % currentAlbum.length)} className="absolute left-4 p-4 text-white/30 hover:text-white transition bg-white/5 rounded-full">
            <ChevronLeft size={40} />
          </button>
          
          <SmartImage
            src={currentAlbum[viewerIndex]}
            alt={`Album photograph ${viewerIndex + 1}`}
            mode="lightbox"
            fit="contain"
            showDimensionsBadge
            containerClassName="max-w-5xl w-full max-h-[85vh] bg-transparent"
            className="max-h-[85vh] rounded-none"
          />
          
          <button onClick={() => setViewerIndex(prev => (prev + 1) % currentAlbum.length)} className="absolute right-4 p-4 text-white/30 hover:text-white transition bg-white/5 rounded-full">
            <ChevronRight size={40} />
          </button>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-sm flex justify-center items-center z-[70] p-4">
          <div className="bg-white p-8 rounded-none text-center max-w-xs w-full  border border-gray-50">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Album?</h2>
            <p className="text-sm text-gray-500 mb-6">This record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white text-sm font-bold rounded-none  shadow-blue-100 active:scale-95 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}