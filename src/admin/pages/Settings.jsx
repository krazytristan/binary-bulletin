import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase"; 
import { 
  User, Lock, Save, Camera, 
  CheckCircle, AlertCircle, Loader2,
  Shield, Briefcase, Mail
} from "lucide-react";

export default function Settings() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    email: "",
    avatar_url: "",
    role: "Reader" // Default role
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // 1. FETCH DATA FROM SUPABASE
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || "",
          email: data.email || user.email,
          avatar_url: data.avatar_url || "",
          role: data.role || "Reader"
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err.message);
      setError("Failed to load profile data.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
      }
      setUploadFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // 2. SAVE CHANGES (Including Role)
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatarUrl = profile.avatar_url;

      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, uploadFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        finalAvatarUrl = publicUrlData.publicUrl;
      }

      // Update Profile Table including the new 'role' field
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          avatar_url: finalAvatarUrl,
          role: profile.role, // Ensure this column exists in your DB
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setProfile(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
      setUploadFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500">Manage your THE BINARY BULLETIN identity and staff privileges.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="text-sm font-medium">Database updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

      <div className="grid gap-8">
        {/* Profile Section */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
            <User size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100 shadow-inner">
                {previewImage || profile.avatar_url ? (
                  <img src={previewImage || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-white shadow-lg border border-gray-100 rounded-xl text-blue-600 hover:scale-110 active:scale-95 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500 italic">
                  <Mail size={14} /> {profile.email}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Staff Role Section */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
            <Briefcase size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Designation & Permissions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Staff Role</label>
              <select 
                value={profile.role}
                onChange={(e) => setProfile({...profile, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="Reader">Standard Reader</option>
                <option value="News Writer">News Writer</option>
                <option value="Editor">Content Editor</option>
                <option value="Editor in Chief">Editor in Chief</option>
                <option value="Administrator">System Administrator</option>
              </select>
              <p className="text-[10px] text-gray-400 font-medium px-1">Your role determines your access level to the publishing dashboard.</p>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 self-end">
               <div className="flex items-center gap-2 text-blue-700 mb-1">
                 <Shield size={14} />
                 <span className="text-xs font-bold uppercase tracking-tight">Access Level</span>
               </div>
               <p className="text-xs text-blue-600 font-medium">
                 {profile.role === "Editor in Chief" || profile.role === "Administrator" 
                   ? "Full publishing and user management privileges granted." 
                   : "Standard content submission privileges granted."}
               </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Synchronize Profile
          </button>
        </div>
      </div>
    </div>
  );
}