import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";
import {
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  Loader2,
  Bell,
  ShieldAlert,
  CheckCheck,
} from "lucide-react";
import { normalizeRole } from "../utils/rbac";
import { logActivity } from "../utils/cmsService";
import { formatDate } from "../utils/editorial";
import SmartImage from "../components/SmartImage";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();
  const notifRef = useRef();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    id: "",
    full_name: "",
    email: "",
    avatar_url: "",
    role: "Staff Writer",
    is_active: true,
    assigned_section: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfileData({
          id: data.id,
          full_name: data.full_name || authUser.email?.split("@")[0] || "Staff Member",
          email: data.email || authUser.email || "",
          avatar_url: data.avatar_url || "",
          role: normalizeRole(data.role),
          rawRole: data.role,
          is_active: data.is_active !== false,
          assigned_section: data.assigned_section || "",
        });
        // Update last_login_at silently if column exists
        supabase
          .from("profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", authUser.id)
          .then(() => {});
      } else {
        setProfileData({
          id: authUser.id,
          full_name: authUser.email?.split("@")[0] || "Staff Member",
          email: authUser.email || "",
          avatar_url: "",
          role: "Staff Writer",
          is_active: true,
          assigned_section: "",
        });
      }
    } catch (err) {
      console.warn("Profile fetch skipped:", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (data) setNotifications(data);
    } catch (err) {
      console.warn("Notifications unavailable:", err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
      } else {
        setUser(session.user);
        await Promise.all([fetchProfile(session.user), fetchNotifications()]);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/admin");
      } else if (session) {
        setUser(session.user);
        fetchProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchProfile, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const pageTitle = (() => {
    const segment = location.pathname.split("/").pop();
    const map = {
      dashboard: "Newsroom Overview",
      articles: "Articles & Workflow",
      admingallery: "Photo Gallery",
      adminthebinar: "The Binary Online",
      events: "Campus Events",
      announcements: "Official Announcements",
      categories: "Categories & Sections",
      media: "Media Library",
      homepage: "Homepage & Content",
      comments: "Comment Moderation",
      messages: "Reader Letters",
      analytics: "Analytics & Reports",
      activity: "Notifications & Activity Log",
      users: "Users & Roles",
      settings: "Settings",
    };
    return map[segment] || segment?.replace("-", " ") || "Dashboard";
  })();

  const handleLogout = async () => {
    await logActivity({
      action: "User Logout",
      userId: profileData.id,
      userName: profileData.full_name,
      userRole: profileData.role,
      entityType: "auth",
      details: `${profileData.email} signed out`,
    });
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const markNotificationRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FCFBF9]">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin mb-4" />
        <p className="font-serif italic text-gray-600">Loading Newsroom CMS...</p>
      </div>
    );
  }

  if (profileData.is_active === false) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-red-900 p-8 text-center shadow-[8px_8px_0px_0px_rgba(127,29,29,1)]">
          <ShieldAlert size={40} className="mx-auto text-red-900 mb-4" />
          <h1 className="font-serif font-black text-2xl text-gray-900 uppercase mb-3">
            Account Deactivated
          </h1>
          <p className="font-serif text-sm text-gray-600 mb-6 leading-relaxed">
            Your editorial account is currently inactive. Contact the Editor-in-Chief or Super Admin to restore newsroom access.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-blue-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FCFBF9] overflow-hidden font-sans text-blue-900 selection:bg-red-900 selection:text-white">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar setSidebarOpen={setSidebarOpen} role={profileData.role} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 h-screen">
        {/* HEADER / TOPBAR */}
        <header className="bg-white sticky top-0 z-30 px-6 h-18 py-3 flex justify-between items-center border-b-2 border-blue-900 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 transition"
            >
              <Menu size={22} className="text-blue-900" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-black uppercase tracking-tight text-blue-900">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-900 hover:bg-gray-100 transition"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-2 border-blue-900 shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] z-50">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-900">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-900 hover:text-blue-900"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs font-serif italic text-gray-500">
                        No editorial notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markNotificationRead(n.id)}
                          className={`w-full text-left p-3.5 hover:bg-gray-50 transition ${
                            !n.is_read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-gray-900">{n.title}</p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-red-900 mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-serif text-gray-600 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatDate(n.created_at)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2.5 border-t border-gray-200 bg-gray-50 text-center">
                    <Link
                      to="/admin-panel/activity"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-bold uppercase tracking-widest text-blue-900 hover:text-red-900"
                    >
                      Open Activity &amp; Notification Center &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* USER DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-gray-100 transition border border-transparent hover:border-blue-900"
              >
                {profileData.avatar_url ? (
                  <SmartImage
                    src={profileData.avatar_url}
                    alt={profileData.full_name || "User avatar"}
                    mode="avatar"
                    fit="cover"
                    containerClassName="w-8 h-8 border border-blue-900 shrink-0"
                    fallbackLabel=""
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-900 flex items-center justify-center shrink-0">
                    <span className="text-white font-serif font-black text-sm">
                      {(profileData.full_name || user?.email || "E").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block text-left pr-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900 leading-tight">
                    {profileData.full_name}
                  </p>
                  <p className="text-[10px] font-bold text-red-900 uppercase tracking-widest leading-tight">
                    {profileData.role}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-500 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] overflow-hidden z-50">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 truncate">
                      {profileData.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/admin-panel/settings");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-blue-900 hover:bg-gray-100 border-b border-gray-200 transition"
                  >
                    <Settings size={14} /> Profile &amp; Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50 transition"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet
            context={{
              user,
              profile: profileData,
              role: profileData.role,
              refreshProfile: () => user && fetchProfile(user),
              refreshNotifications: fetchNotifications,
            }}
          />
        </main>
      </div>
    </div>
  );
}
