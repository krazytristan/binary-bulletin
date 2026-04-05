import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Articles", path: "/admin/articles" },
    { name: "Gallery", path: "/admin/admingallery" },
    { name: "The Binary Online", path: "/admin/adminthebinar" },
    { name: "Events", path: "/admin/events" },
    { name: "Announcements", path: "/admin/announcements" },
    { name: "Messages", path: "/admin/messages" },
  ];

  return (
    <div className="w-64 h-screen bg-primary text-white fixed top-0 left-0 p-5 z-40">

      {/* HEADER */}
      <h2 className="text-xl font-bold mb-6">
        Admin Panel
      </h2>

      {/* LINKS */}
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-secondary font-semibold"
                  : "hover:bg-secondary/70"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </div>

    </div>
  );
}