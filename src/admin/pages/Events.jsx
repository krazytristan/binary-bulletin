import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  MapPin,
  Clock,
  Loader2,
  Image as ImageIcon,
  X,
  FileText
} from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    description: "",
    image_url: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  // 📡 FETCH DATA
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🖼️ HANDLE IMAGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `event-thumbnails/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("events")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("events").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ✍️ SAVE LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const publicUrl = await uploadImage();
      
      if (imageFile && !publicUrl) {
        throw new Error("Image upload failed. Check Supabase Storage permissions.");
      }

      const payload = {
        title: form.title,
        event_date: form.event_date,
        event_time: form.event_time,
        location: form.location,
        description: form.description,
        image_url: publicUrl,
      };

      let error;
      if (editing) {
        const { error: err } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editing.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("events")
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      setModalOpen(false);
      resetForm();
      await fetchEvents(); // Refresh list from DB
    } catch (err) {
      console.error("Database Error:", err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ FIXED DELETE LOGIC
  const confirmDelete = async () => {
    try {
      // 1. Delete from database first
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      // 2. Only update local state if DB deletion succeeded
      setEvents(prev => prev.filter(e => e.id !== deleteId));
      setDeleteId(null);
      
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete from server. Check your RLS policies.");
    }
  };

  const resetForm = () => {
    setForm({ title: "", event_date: "", event_time: "", location: "", description: "", image_url: "" });
    setEditing(null);
    setImageFile(null);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview("");
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      description: event.description,
      image_url: event.image_url,
    });
    setPreview(event.image_url);
    setModalOpen(true);
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Events</h1>
          <p className="text-gray-500">Manage and publish your campus engagements.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> New Event
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Search events or venues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
      </div>

      {/* TABLE/LIST */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-20 text-center text-gray-400">No events scheduled.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-widest text-gray-400 font-bold">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={event.image_url || 'https://via.placeholder.com/150'} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100" 
                        />
                        <span className="font-bold text-gray-900 line-clamp-1">{event.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">
                          {new Date(event.event_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 uppercase font-black tracking-tighter">
                          <Clock size={12} className="text-blue-400" /> {event.event_time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                        <MapPin size={14} className="text-gray-300" />
                        {event.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(event)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => setDeleteId(event.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">{editing ? 'Edit' : 'New'} Event</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                    <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                      <input type="date" required value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time</label>
                      <input type="text" placeholder="10:00 AM" required value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Location</label>
                    <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Thumbnail</label>
                  <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
                    {preview ? (
                      <>
                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button type="button" onClick={() => { setImageFile(null); setPreview(""); }} className="bg-white p-2 rounded-full text-red-500"><X size={20}/></button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-xs text-gray-400 font-bold">Click to upload banner</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Provide event details..." />
              </div>

              <button 
                disabled={saving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-300 shadow-xl shadow-blue-100"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2 italic">Cancel Event?</h2>
            <p className="text-gray-500 mb-6">This will remove the event from the NexGen calendar permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl">Back</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}