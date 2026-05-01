import { NavLink } from "react-router-dom";
import { motion } from "framer-motion"; // <--- Add this line
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Bell, 
  MessageSquare,
  Shield,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export default function Sidebar({ setSidebarOpen }) {
  // Navigation Links - Ensure these match your App.jsx routes
  const links = [
    { name: "Dashboard", path: "/admin-panel/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Articles", path: "/admin-panel/articles", icon: <FileText size={18} /> },
    { name: "Gallery", path: "/admin-panel/admingallery", icon: <ImageIcon size={18} /> },
    { name: "The Binary", path: "/admin-panel/adminthebinar", icon: <Video size={18} /> },
    { name: "Events", path: "/admin-panel/events", icon: <Calendar size={18} /> },
    { name: "Announcements", path: "/admin-panel/announcements", icon: <Bell size={18} /> },
    { name: "Messages", path: "/admin-panel/messages", icon: <MessageSquare size={18} /> },
    { name: "Settings", path: "/admin-panel/settings", icon: <Shield size={18} /> },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col">
      
      {/* BRANDING SECTION */}
      <div className="p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <Sparkles size={16} className="text-white fill-current" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            THE Binary
          </h2>
        </div>
        <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.3em] ml-10">
          Bulletin
        </p>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-4">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Main Menu</p>
        </div>
        
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setSidebarOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-100 translate-x-1"
                  : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
              }`
            }
          >
            <span className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
              {link.icon}
            </span>
            {link.name}
            
            {/* Active Indicator Pin */}
            {({ isActive }) => isActive && (
              <motion.div 
                layoutId="active-pill"
                className="ml-auto w-1.5 h-1.5 bg-white rounded-full" 
              />
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER ACTION */}
      <div className="p-6 mt-auto border-t border-gray-50 bg-gray-50/50">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">External Access</p>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-black text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
          >
            <ArrowLeft size={14} />
            Live Site
          </NavLink>
        </div>
      </div>
      
    </div>
  );
}