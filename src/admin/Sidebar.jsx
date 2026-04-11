import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Bell, 
  MessageSquare,
  Shield, // <--- This must be here to fix the error
  ArrowLeft
} from "lucide-react";

export default function Sidebar({ setSidebarOpen }) {
  const links = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Articles", path: "/admin/articles", icon: <FileText size={20} /> },
    { name: "Gallery", path: "/admin/admingallery", icon: <ImageIcon size={20} /> },
    { name: "The Binary Online", path: "/admin/adminthebinar", icon: <Video size={20} /> },
    { name: "Events", path: "/admin/events", icon: <Calendar size={20} /> },
    { name: "Announcements", path: "/admin/announcements", icon: <Bell size={20} /> },
    { name: "Messages", path: "/admin/messages", icon: <MessageSquare size={20} /> },
    { name: "Settings", path: "/admin/settings", icon: <Shield size={20} /> },
  ];

  return (
    <div className="w-64 h-full bg-white flex flex-col border-r border-gray-100">
      
      {/* BRANDING / HEADER */}
      <div className="p-8">
        <h2 className="text-2xl font-black text-blue-600 tracking-tighter italic uppercase">
          BINARY
          <span className="text-gray-900 not-italic ml-1">BULLETIN</span>
        </h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          Campus Management
        </p>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setSidebarOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-blue-600"
              }`
            }
          >
            <span className="flex-shrink-0 transition-transform group-hover:scale-110">
              {link.icon}
            </span>
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER ACTION */}
      <div className="p-4 mt-auto border-t border-gray-50">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Live Site
        </NavLink>
      </div>
      
    </div>
  );
}