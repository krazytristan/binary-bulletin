import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* 🔐 AUTH GUARD */
import ProtectedRoute from "./components/ProtectedRoute"; // Ensure this path is correct

/* 🌐 PUBLIC PAGES */
import Home from "./pages/Home";
import News from "./pages/News";
import Events from "./pages/Events";
import About from "./pages/About";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import ArticleView from "./pages/ArticleView";
import TheBinar from "./pages/TheBinar";
import Gallery from "./pages/Gallery";

/* 🔐 ADMIN CORE */
import Login from "./admin/Login";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";

/* 🧑‍💻 ADMIN sub-PAGES */
import Articles from "./admin/pages/Articles";
import AdminGallery from "./admin/pages/AdminGallery";
import AdminTheBinar from "./admin/pages/AdminTheBinar";
import AdminEvents from "./admin/pages/Events";
import AdminAnnouncements from "./admin/pages/Announcements";
import Messages from "./admin/pages/Messages";
import Settings from "./admin/pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/thebinar" element={<TheBinar />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/events" element={<Events />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/article/:id" element={<ArticleView />} />

        {/* --- AUTHENTICATION --- */}
        {/* Keep this OUTSIDE the ProtectedRoute to avoid infinite redirect loops */}
        <Route path="/admin" element={<Login />} />

        {/* --- PROTECTED ADMIN PANEL --- */}
        <Route element={<ProtectedRoute />}>
          {/* 
              Note: We use a different parent path or a nested structure 
              to ensure the Login page (/admin) doesn't clash with the Layout.
          */}
          <Route path="/admin-panel" element={<AdminLayout />}>
            {/* Auto-redirect from /admin-panel to dashboard */}
            <Route index element={<Navigate to="/admin-panel/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="articles" element={<Articles />} />
            <Route path="admingallery" element={<AdminGallery />} />
            <Route path="adminthebinar" element={<AdminTheBinar />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* --- 404 HANDLING --- */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen bg-[#05070a] text-white">
            <h1 className="text-2xl font-mono">404 // TERMINAL_NOT_FOUND</h1>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;