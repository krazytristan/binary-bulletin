import { BrowserRouter, Routes, Route } from "react-router-dom";

/* 🌐 PUBLIC PAGES */
import Home from "./pages/Home";
import News from "./pages/News";
import Events from "./pages/Events";
import About from "./pages/About";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import ArticleView from "./pages/ArticleView"; // 🔥 NEW

/* 🔐 ADMIN CORE */
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";

/* 🧑‍💻 ADMIN PAGES */
import Articles from "./admin/pages/Articles";
import AdminEvents from "./admin/pages/Events";
import AdminAnnouncements from "./admin/pages/Announcements";
import Messages from "./admin/pages/Messages";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* 🌐 PUBLIC ROUTES */}
        {/* ========================= */}
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/events" element={<Events />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* 🔥 ARTICLE VIEW (DYNAMIC) */}
        <Route path="/article/:id" element={<ArticleView />} />

        {/* ========================= */}
        {/* 🔐 ADMIN ROUTES */}
        {/* ========================= */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/articles" element={<Articles />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/messages" element={<Messages />} />

        {/* ========================= */}
        {/* ❌ FALLBACK (OPTIONAL) */}
        {/* ========================= */}
        <Route
          path="*"
          element={
            <div className="flex justify-center items-center h-screen text-gray-500">
              Page Not Found
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;