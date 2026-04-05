import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Gallery() {
  const [events, setEvents] = useState([]);

  const [viewer, setViewer] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [currentAlbum, setCurrentAlbum] = useState([]);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    setEvents(data || []);
  };

  // 🖼 OPEN VIEWER
  const openViewer = (images, index) => {
    setCurrentAlbum(images);
    setViewerIndex(index);
    setViewer(images[index]);
  };

  const nextImage = () => {
    const next = (viewerIndex + 1) % currentAlbum.length;
    setViewerIndex(next);
    setViewer(currentAlbum[next]);
  };

  const prevImage = () => {
    const prev =
      (viewerIndex - 1 + currentAlbum.length) % currentAlbum.length;
    setViewerIndex(prev);
    setViewer(currentAlbum[prev]);
  };

  // ⌨️ KEYBOARD SUPPORT
  useEffect(() => {
    const handleKey = (e) => {
      if (!viewer) return;

      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setViewer(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewer, viewerIndex, currentAlbum]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar />

      {/* HERO */}
      <section className="bg-primary text-white py-14 text-center">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-sm opacity-80 mt-2">
          Moments and highlights from our events
        </p>
      </section>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-6">

        {events.length === 0 ? (
          <p className="text-center text-gray-500">
            No gallery yet.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >

                {/* COVER IMAGE */}
                <div className="relative cursor-pointer">
                  <img
                    src={event.images?.[0]}
                    onClick={() => openViewer(event.images, 0)}
                    className="h-48 w-full object-cover"
                  />

                  {/* OVERLAY COUNT */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {event.images?.length} photos
                  </div>
                </div>

                {/* TITLE */}
                <div className="p-4">
                  <h2 className="font-semibold text-gray-800">
                    {event.title}
                  </h2>
                </div>

                {/* THUMBNAILS */}
                <div className="grid grid-cols-4 gap-1 p-2">
                  {event.images?.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      onClick={() => openViewer(event.images, i)}
                      className="h-16 object-cover cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* 🖼 VIEWER MODAL */}
      {viewer && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

          {/* PREV */}
          <button
            onClick={prevImage}
            className="absolute left-5 text-white text-4xl"
          >
            ‹
          </button>

          {/* IMAGE */}
          <img
            src={viewer}
            className="max-h-[90%] max-w-[90%] rounded"
          />

          {/* NEXT */}
          <button
            onClick={nextImage}
            className="absolute right-5 text-white text-4xl"
          >
            ›
          </button>

          {/* CLOSE */}
          <button
            onClick={() => setViewer(null)}
            className="absolute top-5 right-5 text-white text-xl"
          >
            ✕
          </button>

        </div>
      )}

      <Footer />
    </div>
  );
}