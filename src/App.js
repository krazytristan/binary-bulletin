import { BrowserRouter, Routes, Route } from "react-router-dom";

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

/* 🧑‍💻 ADMIN PAGES */
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

        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/thebinar" element={<TheBinar />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/events" element={<Events />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/article/:id" element={<ArticleView />} />

        {/* ADMIN */}
        <Route path="/admin" element={<Login />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="articles" element={<Articles />} />
          <Route path="admingallery" element={<AdminGallery />} />
          <Route path="adminthebinar" element={<AdminTheBinar />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div>Page Not Found</div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;