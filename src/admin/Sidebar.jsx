import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Bell, 
  MessageSquare,
  Shield,
  ArrowLeft
} from "lucide-react";

export default function Sidebar({ setSidebarOpen }) {
  const links = [
    { name: "Dashboard", path: "/admin-panel/dashboard", icon: <LayoutDashboard size={16} /> },
    { name: "Archive", path: "/admin-panel/articles", icon: <FileText size={16} /> },
    { name: "Exhibits", path: "/admin-panel/admingallery", icon: <ImageIcon size={16} /> },
    { name: "The Binar", path: "/admin-panel/adminthebinar", icon: <Video size={16} /> },
    { name: "Registry", path: "/admin-panel/events", icon: <Calendar size={16} /> },
    { name: "Bulletins", path: "/admin-panel/announcements", icon: <Bell size={16} /> },
    { name: "Letters", path: "/admin-panel/messages", icon: <MessageSquare size={16} /> },
    { name: "Settings", path: "/admin-panel/settings", icon: <Shield size={16} /> },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col border-r-2 border-blue-900 font-sans">
      
      {/* BRANDING SECTION */}
      <div className="p-8 border-b-2 border-blue-900">
        <h2 className="text-2xl font-serif font-black text-blue-900 tracking-tighter uppercase mb-1">
          Editor's Desk
        </h2>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          Binary Bulletin
        </p>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Operations</p>
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen?.(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-blue-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-red-900"
                  }`
                }
              >
                <span className="shrink-0">{link.icon}</span>
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* FOOTER ACTION */}
      <div className="p-6 border-t-2 border-blue-900">
        <NavLink
          to="/"
          className="flex items-center justify-center gap-3 w-full py-4 border border-blue-900 text-[10px] font-bold uppercase tracking-widest text-blue-900 hover:bg-red-900 hover:text-amber-400 hover:border-red-900 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          View Live Publication
        </NavLink>
      </div>
      
    </div>
  );
}