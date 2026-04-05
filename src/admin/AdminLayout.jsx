import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔐 GET SESSION (FIXED)
  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        if (!data.session) {
          navigate("/admin"); // redirect if not logged in
        } else {
          setUser(data.session.user);
        }
      }
    };

    getSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // 🔥 CLICK OUTSIDE DROPDOWN
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔓 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* 🔷 SIDEBAR */}
      <Sidebar />

      {/* 🔷 MAIN CONTENT */}
      <div className="ml-64 flex-1">

        {/* 🔹 TOPBAR */}
        <div className="bg-white shadow px-6 py-4 flex justify-between items-center">

          {/* PAGE TITLE */}
          <h1 className="text-xl font-bold text-gray-800">
            {title || "Admin Panel"}
          </h1>

          {/* PROFILE */}
          <div className="relative" ref={dropdownRef}>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 transition"
            >
              {/* Avatar */}
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              {/* Email */}
              <span className="text-sm text-gray-700 hidden md:block">
                {user?.email || "Admin"}
              </span>
            </button>

            {/* 🔽 DROPDOWN */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-md overflow-hidden z-50">

                {/* USER INFO */}
                <div className="px-4 py-2 text-xs text-gray-500 border-b">
                  Signed in as
                  <div className="font-medium text-gray-800 truncate">
                    {user?.email}
                  </div>
                </div>

                {/* PROFILE */}
                <button
                  onClick={() => navigate("/admin/profile")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Profile
                </button>

                {/* SETTINGS */}
                <button
                  onClick={() => alert("Settings coming soon")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Settings
                </button>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                >
                  Logout
                </button>

              </div>
            )}

          </div>
        </div>

        {/* 🔹 PAGE CONTENT */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
}