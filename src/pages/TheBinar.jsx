import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TheBinar() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    setVideos(data || []);
  };

  return (
    <div className="min-h-screen bg-light font-sans">
      <Navbar />

      <section className="bg-primary text-white py-14 text-center">
        <h1 className="text-3xl font-bold">The Binary Online</h1>
        <p className="text-sm opacity-80 mt-2">
          Multimedia Stories & Video Features
        </p>
      </section>

      <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-3 gap-6">

        {videos.map((v) => (
          <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden">

            {/* VIDEO */}
            <video
              src={v.video_url}
              controls
              className="w-full h-48 object-cover"
            />

            {/* CONTENT */}
            <div className="p-4">
              <h3 className="font-bold">{v.title}</h3>

              <p className="text-sm text-gray-500 mt-2">
                {v.excerpt}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                {new Date(v.created_at).toLocaleDateString()}
              </p>

              <p className="text-xs text-gray-500">
                {v.author_name}
              </p>
            </div>

          </div>
        ))}

      </div>

      <Footer />
    </div>
  );
}