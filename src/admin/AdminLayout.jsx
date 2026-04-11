import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Loader2,
  Bell,
  Mail,
  Check
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();
  const notificationRef = useRef();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ full_name: "", avatar_url: "" }); // Added for photo
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/admin");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id); // Fetch profile data when user is available
        fetchUnreadData();
      }
      setLoading(false);
    });

    const channel = supabase
      .channel('realtime-updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        () => fetchUnreadData()
      )
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'profiles' }, 
        (payload) => {
          if (payload.new.id === user?.id) {
            setProfileData({
              full_name: payload.new.full_name,
              avatar_url: payload.new.avatar_url
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate, user?.id]);

  // Fetching the profile image and name from the database
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();
      
      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    }
  };

  const fetchUnreadData = async () => {
    try {
      const { count } = await supabase
        .from("messages") 
        .select("*", { count: 'exact', head: true })
        .eq("is_read", false); 
      setUnreadCount(count || 0);

      const { data } = await supabase
        .from("messages")
        .select("id, name, message, created_at")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMessages(data || []);
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    }
  };

  const markAsRead = async (e, id) => {
    e.stopPropagation();
    await supabase.from("messages").update({ is_read: true }).eq("id", id);
    fetchUnreadData();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-wide">Securing Session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col md:ml-64 min-w-0 h-screen">

        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 h-20 flex justify-between items-center border-b border-gray-100">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu size={24} className="text-gray-600" />
            </button>
            
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Administrator</h1>
              <p className="text-lg font-black text-gray-900 capitalize">
                {location.pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className={`p-2.5 rounded-xl transition relative ${notifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                <Bell size={20} className={unreadCount > 0 ? "text-blue-600" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black px-1 shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest italic">Inbox</h3>
                      <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black">{unreadCount} New</span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {recentMessages.length > 0 ? (
                        recentMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            onClick={() => { navigate("/admin/messages"); setNotifOpen(false); }}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-50 last:border-none group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-black text-gray-900 truncate pr-4 uppercase tracking-tighter">{msg.name}</p>
                              <button 
                                onClick={(e) => markAsRead(e, msg.id)}
                                className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-1 font-medium italic mb-2">{msg.message}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <Mail className="mx-auto text-gray-200 mb-2" size={32} />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inbox Clean</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { navigate("/admin/messages"); setNotifOpen(false); }}
                      className="w-full py-4 bg-gray-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition border-t border-gray-100"
                    >
                      View All Messages
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
              >
                {/* Updated: Profile Photo Display */}
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-100 overflow-hidden">
                  {profileData.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg">{user?.email?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                    {profileData.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Super Admin</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden py-2"
                  >
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Authenticated Email</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                    </div>

                    <button 
                      onClick={() => { navigate("/admin/settings"); setDropdownOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
                    >
                      <User size={18} /> Profile Details
                    </button>

                    <button 
                      onClick={() => { navigate("/admin/settings"); setDropdownOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
                    >
                      <Settings size={18} /> System Settings
                    </button>

                    <div className="h-px bg-gray-50 my-1" />

                    <button
                      onClick={() => setConfirmLogout(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-bold"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {confirmLogout && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmLogout(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative z-10"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h2 className="font-black text-2xl text-gray-900 mb-2">Sign Out?</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                You will need to re-authenticate to access the management panel.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold hover:bg-red-600 shadow-xl shadow-red-100 transition"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}