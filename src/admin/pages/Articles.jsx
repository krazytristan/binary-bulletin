import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  User,
  X,
  Images
} from "lucide-react";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "News",
    author_name: "Campus Writer",
    author_image: "",
    image_url: "",
    gallery: [], 
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setArticles(data || []);
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview && !preview.startsWith('http')) URL.revokeObjectURL(preview); 
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryItem = (index) => {
    // 1. Filter previews
    const targetPreview = galleryPreviews[index];
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));

    // 2. If it was a blob/preview, revoke it
    if (targetPreview && targetPreview.startsWith('blob:')) {
      URL.revokeObjectURL(targetPreview);
    }

    // 3. Update the files array for new uploads
    // We need to figure out if this index belongs to a new file or an existing URL
    const existingGalleryCount = form.gallery ? form.gallery.length : 0;
    
    if (index < existingGalleryCount) {
      // It's an existing URL in the database
      setForm(prev => ({
        ...prev,
        gallery: prev.gallery.filter((_, i) => i !== index)
      }));
    } else {
      // It's a newly added file
      const fileIndex = index - existingGalleryCount;
      setGalleryFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const uploadImage = async (file, folder = "article-thumbnails") => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("articles")
      .upload(filePath, file);

    if (uploadError) return null;

    const { data } = supabase.storage.from("articles").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Upload Main Thumbnail
      let finalImageUrl = form.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, "article-thumbnails");
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      // 2. Upload New Gallery Images
      const newGalleryUrls = await Promise.all(
        galleryFiles.map(file => uploadImage(file, "article-gallery"))
      );
      
      const finalGallery = [
        ...(form.gallery || []),
        ...newGalleryUrls.filter(url => url !== null)
      ];

      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        author_name: form.author_name,
        author_image: form.author_image,
        image_url: finalImageUrl,
        gallery: finalGallery,
        updated_at: new Date(),
      };

      let error;
      if (editing) {
        const { error: err } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", editing.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("articles")
          .insert([payload]);
        error = err;
      }

      if (!error) {
        setModalOpen(false);
        resetForm();
        fetchArticles();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      title: "", 
      excerpt: "", 
      content: "", 
      category: "News", 
      author_name: "Campus Writer", 
      author_image: "", 
      image_url: "",
      gallery: []
    });
    setEditing(null);
    setImageFile(null);
    setGalleryFiles([]);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview("");
    galleryPreviews.forEach(p => { if(p.startsWith('blob:')) URL.revokeObjectURL(p)});
    setGalleryPreviews([]);
  };

  const openEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author_name: article.author_name,
      author_image: article.author_image || "",
      image_url: article.image_url,
      gallery: article.gallery || [],
    });
    setPreview(article.image_url);
    setGalleryPreviews(article.gallery || []);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    const { error } = await supabase.from("articles").delete().eq("id", deleteId);
    if (!error) {
      setArticles(articles.filter(a => a.id !== deleteId));
      setDeleteId(null);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Articles</h1>
          <p className="text-gray-500">Create, edit, and manage your news stories.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> New Article
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
      </div>

      {/* TABLE/LIST */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-20 text-center text-gray-400">No articles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-widest text-gray-400 font-bold">
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={article.image_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <span className="font-bold text-gray-900 line-clamp-1">{article.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <img src={article.author_image || 'https://via.placeholder.com/100'} className="w-6 h-6 rounded-full object-cover bg-gray-100" />
                            <span className="text-sm text-gray-600">{article.author_name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(article)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => setDeleteId(article.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">{editing ? 'Edit' : 'New'} Article</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                    <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Author Name</label>
                      <input required value={form.author_name} onChange={e => setForm({...form, author_name: e.target.value})} className="w-full p-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Author Profile Image URL</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {form.author_image ? (
                                <img src={form.author_image} className="w-full h-full object-cover" alt="Author" />
                            ) : (
                                <User className="w-full h-full p-2 text-gray-400" />
                            )}
                        </div>
                        <input 
                          placeholder="https://example.com/photo.jpg" 
                          value={form.author_image} 
                          onChange={e => setForm({...form, author_image: e.target.value})} 
                          className="flex-1 p-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>News</option>
                      <option>Feature</option>
                      <option>Sports</option>
                      <option>Opinion</option>
                      <option>Literary</option>
                      <option>Editorial</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Article Thumbnail (Main)</label>
                  <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
                    {preview ? (
                      <>
                        <img src={preview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button type="button" onClick={() => { setImageFile(null); setPreview(""); setForm({...form, image_url: ""})}} className="bg-white p-2 rounded-full text-red-500"><X size={20}/></button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-xs text-gray-400">Main cover image</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* GALLERY SECTION */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                  <Images size={14} /> Supporting Photos (Gallery)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {galleryPreviews.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={src} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeGalleryItem(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition group">
                    <Plus className="text-gray-300 group-hover:text-blue-500" size={24} />
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Add Photo</span>
                    <input type="file" multiple accept="image/*" onChange={handleGalleryChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Excerpt</label>
                <textarea rows="2" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Content</label>
                <textarea rows="6" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <button 
                disabled={saving}
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-300 shadow-xl shadow-blue-100"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : (editing ? 'Update Article' : 'Publish Article')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Article?</h2>
            <p className="text-gray-500 mb-6">This will permanently remove the story from the bulletin.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}