import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // 🔐 AUTH CHECK
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/admin");
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

  // 🔥 CLOSE SIDEBAR ON ROUTE CHANGE
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // 🔥 CLICK OUTSIDE DROPDOWN
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

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* 🔥 MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🔥 SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
      >
        <Sidebar />
      </div>

      {/* 🔷 MAIN */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* 🔹 TOPBAR */}
        <div className="bg-white shadow px-4 md:px-6 py-4 flex justify-between items-center border-b">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* ☰ MOBILE */}
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              className="md:hidden text-xl"
            >
              ☰
            </button>

            <h1 className="text-lg md:text-xl font-semibold text-gray-800">
              Admin Panel
            </h1>
          </div>

          {/* PROFILE */}
          <div className="relative" ref={dropdownRef}>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition"
            >
              <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              <span className="hidden md:block text-sm text-gray-700">
                {user?.email}
              </span>
            </button>

            {/* DROPDOWN */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden z-50"
                >
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
                    onClick={() => setConfirmLogout(true)}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                  >
                    🚪 Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* 🔹 CONTENT */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* 🔥 LOGOUT MODAL */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="bg-white rounded-xl p-6 w-80 text-center shadow-xl"
            >
              <h2 className="font-bold text-lg mb-2">
                Confirm Logout
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to logout?
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}