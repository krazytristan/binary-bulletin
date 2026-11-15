import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

/* AUTH GUARD */
import ProtectedRoute from "./components/ProtectedRoute";

/* PUBLIC PAGES */
import Home from "./pages/Home";
import News from "./pages/News";
import Events from "./pages/Events";
import About from "./pages/About";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import ArticleView from "./pages/ArticleView";
import TheBinar from "./pages/TheBinar";
import Gallery from "./pages/Gallery";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* ADMIN CORE */
import Login from "./admin/Login";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";

/* ADMIN SUB-PAGES */
import Articles from "./admin/pages/Articles";
import MediaLibrary from "./admin/pages/MediaLibrary";
import Categories from "./admin/pages/Categories";
import HomepageCMS from "./admin/pages/HomepageCMS";
import Comments from "./admin/pages/Comments";
import Analytics from "./admin/pages/Analytics";
import ActivityCenter from "./admin/pages/ActivityCenter";
import Users from "./admin/pages/Users";
import AdminGallery from "./admin/pages/AdminGallery";
import AdminTheBinar from "./admin/pages/AdminTheBinar";
import AdminEvents from "./admin/pages/Events";
import AdminAnnouncements from "./admin/pages/Announcements";
import Messages from "./admin/pages/Messages";
import Settings from "./admin/pages/Settings";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full bg-white border-2 border-blue-900 p-8 md:p-12 text-center shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
            Edition Notice &bull; Error 404
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-tight text-blue-900 mb-4">
            Page Not Found
          </h1>
          <p className="font-serif text-gray-600 leading-relaxed mb-8">
            The requested dispatch or archive page could not be located. Please verify the address or return to the front page of The Binary Bulletin.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors"
          >
            Return to Front Page
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
        <Route path="/admin" element={<Login />} />

        {/* --- PROTECTED ADMIN PANEL --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin-panel" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin-panel/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="articles" element={<Articles />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="categories" element={<Categories />} />
            <Route path="homepage" element={<HomepageCMS />} />
            <Route path="comments" element={<Comments />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="activity" element={<ActivityCenter />} />
            <Route path="users" element={<Users />} />
            <Route path="admingallery" element={<AdminGallery />} />
            <Route path="adminthebinar" element={<AdminTheBinar />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* --- 404 HANDLING --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
