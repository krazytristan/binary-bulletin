import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";

export default function AdminLayout() {
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 CHECK AUTH SESSION
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/admin"); // redirect to login
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  // 🔥 CLOSE DROPDOWN WHEN CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔓 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  // ⏳ LOADING SCREEN
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* 🔷 SIDEBAR */}
      <Sidebar />

      {/* 🔷 MAIN CONTENT */}
      <div className="flex-1 md:ml-64">

        {/* 🔹 TOPBAR */}
        <div className="bg-white shadow px-6 py-4 flex justify-between items-center border-b">

          {/* TITLE */}
          <h1 className="text-lg md:text-xl font-semibold text-gray-800">
            Admin Panel
          </h1>

          {/* PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition"
            >
              {/* AVATAR */}
              <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              {/* EMAIL */}
              <span className="hidden md:block text-sm text-gray-700">
                {user?.email}
              </span>
            </button>

            {/* DROPDOWN MENU */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden z-50">

                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Signed in as
                  <div className="font-medium text-gray-800 truncate">
                    {user?.email}
                  </div>
                </div>

                <button
                  onClick={() => navigate("/admin/profile")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  👤 Profile
                </button>

                <button
                  onClick={() => alert("Settings coming soon")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                >
                  🚪 Logout
                </button>

              </div>
            )}

          </div>
        </div>

        {/* 🔹 PAGE CONTENT (VERY IMPORTANT) */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>

      </div>
    </div>
  );
}