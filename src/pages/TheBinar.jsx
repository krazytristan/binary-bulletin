import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TheBinar() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    setVideos(data || []);
    setLoading(false);
  };

  // 🎥 YOUTUBE CHECK
  const isYouTube = (url) =>
    url?.includes("youtube.com") || url?.includes("youtu.be");

  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const id =
      url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    return `https://www.youtube.com/embed/${id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      <Navbar />

      {/* HERO */}
      <section className="bg-primary text-white py-14 text-center">
        <h1 className="text-3xl font-bold">The Binary Online</h1>
        <p className="text-sm opacity-80 mt-2">
          Multimedia Stories & Video Features
        </p>
      </section>

      <div className="max-w-7xl mx-auto p-6">

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-gray-500">
            No videos yet.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {videos.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >

                {/* VIDEO PREVIEW */}
                <div
                  onClick={() => setViewer(v)}
                  className="cursor-pointer"
                >
                  {v.video_type === "link" || isYouTube(v.video_url) ? (
                    <iframe
                      src={getYouTubeEmbed(v.video_url)}
                      className="w-full h-48"
                      title="video"
                    />
                  ) : (
                    <video
                      src={v.video_url}
                      className="w-full h-48 object-cover"
                    />
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-4">
                  <h3 className="font-bold">{v.title}</h3>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {v.excerpt}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(v.created_at).toLocaleDateString()}
                  </p>

                  <p className="text-xs text-gray-500">
                    {v.author_name}
                  </p>

                  {/* READ MORE */}
                  <button
                    onClick={() => setViewer(v)}
                    className="mt-3 text-primary text-sm font-semibold"
                  >
                    Read / Watch →
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* 🎬 FULL MODAL */}
      {viewer && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 overflow-auto">

          <div className="bg-white max-w-3xl w-full rounded-xl overflow-hidden">

            {/* VIDEO */}
            {viewer.video_type === "link" || isYouTube(viewer.video_url) ? (
              <iframe
                src={getYouTubeEmbed(viewer.video_url)}
                className="w-full h-64"
                allowFullScreen
                title="video"
              />
            ) : (
              <video
                src={viewer.video_url}
                controls
                autoPlay
                className="w-full max-h-[400px]"
              />
            )}

            {/* TEXT CONTENT */}
            <div className="p-6">

              <h2 className="text-xl font-bold mb-2">
                {viewer.title}
              </h2>

              <p className="text-sm text-gray-400 mb-3">
                {viewer.author_name} •{" "}
                {new Date(viewer.created_at).toLocaleDateString()}
              </p>

              <p className="text-gray-700 whitespace-pre-line">
                {viewer.content || viewer.excerpt}
              </p>

            </div>

          </div>

          {/* CLOSE */}
          <button
            onClick={() => setViewer(null)}
            className="absolute top-5 right-5 text-white text-2xl"
          >
            ✕
          </button>

        </div>
      )}

      <Footer />
    </div>
  );
}