import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";
import { Menu, ChevronDown, User, Settings, LogOut, Loader2, Bell } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ full_name: "", avatar_url: "" });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/admin");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfileData({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (err) {
      console.warn("Profile fetch skipped or failed.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FCFBF9]">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin mb-4" />
        <p className="font-serif italic text-gray-500">Securing Editorial Desk...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FCFBF9] overflow-hidden font-sans text-blue-900 selection:bg-red-900 selection:text-white">
      
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 h-screen">

        {/* HEADER / TOPBAR */}
        <header className="bg-white sticky top-0 z-30 px-6 h-20 flex justify-between items-center border-b-2 border-blue-900">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 transition"
            >
              <Menu size={24} className="text-blue-900" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-serif font-black uppercase tracking-tight">
                {location.pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-red-900 transition">
              <Bell size={20} />
            </button>

            {/* USER DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 transition border border-transparent hover:border-red-900"
              >
                <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                  <span className="text-white font-serif font-black">{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="hidden lg:block text-left pr-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900">
                    {profileData.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Editor</p>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] overflow-hidden z-50">
                  <button 
                    onClick={() => { navigate("/admin-panel/settings"); setDropdownOpen(false); }} 
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-blue-900 hover:bg-gray-100 border-b border-gray-200 transition"
                  >
                    <Settings size={14} /> System Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}