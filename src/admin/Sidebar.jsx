import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Articles", path: "/admin/articles" },
    { name: "Events", path: "/admin/events" },
    { name: "Announcements", path: "/admin/announcements" },
    { name: "Messages", path: "/admin/messages" },
  ];

  return (
    <div className="w-64 h-screen bg-primary text-white p-5 fixed">

      <h2 className="text-xl font-bold mb-6">
        Admin Panel
      </h2>

      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`block p-2 rounded-md transition ${
              location.pathname === link.path
                ? "bg-secondary"
                : "hover:bg-secondary/70"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}