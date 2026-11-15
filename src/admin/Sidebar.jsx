import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Video,
  Calendar,
  Bell,
  MessageSquare,
  MessageCircle,
  Shield,
  ArrowLeft,
  FolderKanban,
  FolderOpen,
  LayoutTemplate,
  BarChart3,
  Users,
  Activity,
} from "lucide-react";
import { hasPermission } from "../utils/rbac";

export default function Sidebar({ setSidebarOpen, role = "Staff Writer" }) {
  const groups = [
    {
      title: "Newsroom",
      items: [
        {
          name: "Dashboard",
          path: "/admin-panel/dashboard",
          icon: <LayoutDashboard size={15} />,
          perm: "viewDashboard",
        },
        {
          name: "Articles & Workflow",
          path: "/admin-panel/articles",
          icon: <FileText size={15} />,
          perm: "viewDashboard",
        },
        {
          name: "Announcements",
          path: "/admin-panel/announcements",
          icon: <Bell size={15} />,
          perm: "createArticle",
        },
        {
          name: "Campus Events",
          path: "/admin-panel/events",
          icon: <Calendar size={15} />,
          perm: "createArticle",
        },
      ],
    },
    {
      title: "Content & Media",
      items: [
        {
          name: "Media Library",
          path: "/admin-panel/media",
          icon: <FolderOpen size={15} />,
          perm: "manageMedia",
        },
        {
          name: "Photo Gallery",
          path: "/admin-panel/admingallery",
          icon: <ImageIcon size={15} />,
          perm: "manageMedia",
        },
        {
          name: "The Binary Online",
          path: "/admin-panel/adminthebinar",
          icon: <Video size={15} />,
          perm: "manageMedia",
        },
        {
          name: "Categories & Sections",
          path: "/admin-panel/categories",
          icon: <FolderKanban size={15} />,
          perm: "manageCategories",
        },
        {
          name: "Homepage & Content",
          path: "/admin-panel/homepage",
          icon: <LayoutTemplate size={15} />,
          perm: "manageHomepage",
        },
      ],
    },
    {
      title: "Engagement & Reports",
      items: [
        {
          name: "Comment Moderation",
          path: "/admin-panel/comments",
          icon: <MessageCircle size={15} />,
          perm: "moderateComments",
        },
        {
          name: "Reader Letters",
          path: "/admin-panel/messages",
          icon: <MessageSquare size={15} />,
          perm: "reviewArticles",
        },
        {
          name: "Analytics & Reports",
          path: "/admin-panel/analytics",
          icon: <BarChart3 size={15} />,
          perm: "viewAnalytics",
        },
        {
          name: "Notifications & Logs",
          path: "/admin-panel/activity",
          icon: <Activity size={15} />,
          perm: "viewDashboard",
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          name: "Users & Roles",
          path: "/admin-panel/users",
          icon: <Users size={15} />,
          perm: "manageUsers",
        },
        {
          name: "Settings",
          path: "/admin-panel/settings",
          icon: <Shield size={15} />,
          perm: "viewDashboard",
        },
      ],
    },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col border-r-2 border-blue-900 font-sans">
      {/* BRANDING SECTION */}
      <div className="px-6 py-5 border-b-2 border-blue-900 flex items-center gap-3">
        <img
          src="/binary-logo.png"
          alt="The Binary Bulletin"
          className="h-9 w-9 object-contain rounded-full border border-blue-900 p-0.5 bg-white shrink-0"
        />
        <div>
          <h2 className="text-lg font-serif font-black text-blue-900 tracking-tight uppercase leading-none">
            Newsroom CMS
          </h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
            The Binary Bulletin
          </p>
        </div>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-4 space-y-5">
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) => hasPermission(role, item.perm));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen?.(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-blue-900 text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-red-900"
                      }`
                    }
                  >
                    <span className="shrink-0">{link.icon}</span>
                    <span className="truncate">{link.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* FOOTER ACTION */}
      <div className="p-4 border-t-2 border-blue-900">
        <NavLink
          to="/"
          className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-blue-900 text-[11px] font-bold uppercase tracking-widest text-blue-900 hover:bg-red-900 hover:border-red-900 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          View Live Site
        </NavLink>
      </div>
    </div>
  );
}
