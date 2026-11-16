import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

/* AUTH GUARD */
import ProtectedRoute from "./components/ProtectedRoute";

/* EAGER CORE PUBLIC SHELL & LANDING PAGE */
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* LAZY-LOADED SECONDARY PUBLIC PAGES */
const News = lazy(() => import("./pages/News"));
const Events = lazy(() => import("./pages/Events"));
const About = lazy(() => import("./pages/About"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Contact = lazy(() => import("./pages/Contact"));
const ArticleView = lazy(() => import("./pages/ArticleView"));
const TheBinar = lazy(() => import("./pages/TheBinar"));
const Gallery = lazy(() => import("./pages/Gallery"));

/* LAZY-LOADED ADMIN CORE & MODULES */
const Login = lazy(() => import("./admin/Login"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Dashboard = lazy(() => import("./admin/Dashboard"));
const Articles = lazy(() => import("./admin/pages/Articles"));
const MediaLibrary = lazy(() => import("./admin/pages/MediaLibrary"));
const Categories = lazy(() => import("./admin/pages/Categories"));
const HomepageCMS = lazy(() => import("./admin/pages/HomepageCMS"));
const Comments = lazy(() => import("./admin/pages/Comments"));
const Analytics = lazy(() => import("./admin/pages/Analytics"));
const ActivityCenter = lazy(() => import("./admin/pages/ActivityCenter"));
const Users = lazy(() => import("./admin/pages/Users"));
const AdminGallery = lazy(() => import("./admin/pages/AdminGallery"));
const AdminTheBinar = lazy(() => import("./admin/pages/AdminTheBinar"));
const AdminEvents = lazy(() => import("./admin/pages/Events"));
const AdminAnnouncements = lazy(() => import("./admin/pages/Announcements"));
const Messages = lazy(() => import("./admin/pages/Messages"));
const Settings = lazy(() => import("./admin/pages/Settings"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-bold uppercase tracking-widest text-blue-900">
        Loading Edition...
      </p>
    </div>
  );
}

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
      <Suspense fallback={<RouteLoadingFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
