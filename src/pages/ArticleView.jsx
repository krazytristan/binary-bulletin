import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ChevronLeft } from "lucide-react";

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    window.scrollTo(0, 0);
    try {
      const { data: artData } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (artData) {
        setArticle(artData);
        const { data: relData } = await supabase
          .from("articles")
          .select("*")
          .eq("category", artData.category)
          .neq("id", id)
          .limit(3);
        setRelated(relData || []);
      }
    } catch (error) {
      console.error("Error loading publication data:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <p className="font-serif italic text-gray-500">Retrieving archive...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Link to="/news" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-12">
          <ChevronLeft size={14} /> Back to Archive
        </Link>
        
        <article>
          <header className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest border border-black px-3 py-1 inline-block mb-6">
              {article?.category || "Bulletin"}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black leading-[1.1] mb-8">
              {article?.title}
            </h1>
            
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <span className="text-black">By {article?.author_name || "Journal Staff"}</span>
              <span>|</span>
              <span>{new Date(article?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </header>

          <div className="aspect-video w-full bg-gray-100 border border-gray-300 mb-12 overflow-hidden">
            <img 
              src={article?.image_url} 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              alt="Cover" 
            />
          </div>

          <div className="max-w-3xl mx-auto">
            {article?.excerpt && (
              <p className="text-xl md:text-2xl font-serif italic text-gray-600 text-center mb-12 leading-relaxed">
                "{article.excerpt}"
              </p>
            )}
            
            <div className="prose prose-lg max-w-none prose-p:font-serif prose-p:leading-loose prose-p:text-gray-800">
              {article?.content?.split("\n").map((paragraph, i) => {
                if (!paragraph.trim()) return null;
                // Simple drop cap for first paragraph
                if (i === 0) {
                  return (
                    <p key={i} className="mb-8 text-lg">
                      <span className="float-left text-7xl font-serif font-black leading-[0.8] pr-3 pt-2 text-black">
                        {paragraph.charAt(0)}
                      </span>
                      {paragraph.slice(1)}
                    </p>
                  );
                }
                return <p key={i} className="mb-8 text-lg">{paragraph}</p>;
              })}
            </div>

            {/* Gallery Section */}
            {article?.gallery && article.gallery.length > 0 && (
              <div className="mt-16 border-t-2 border-black pt-12">
                <h3 className="font-sans font-bold text-[10px] uppercase tracking-widest text-center mb-8">Visual Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.gallery.map((url, index) => (
                    <div key={index} className="aspect-[4/3] border border-gray-300 overflow-hidden bg-gray-100">
                      <img src={url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt={`Exhibit ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24 pt-12 border-t border-gray-300">
            <h3 className="font-sans font-bold text-[10px] uppercase tracking-widest text-center mb-8">Related Dispatches</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map(item => (
                <Link key={item.id} to={`/article/${item.id}`} className="group">
                  <div className="aspect-[16/10] border border-gray-300 mb-3 overflow-hidden bg-gray-100">
                    <img src={item.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Thumbnail" />
                  </div>
                  <h4 className="font-serif font-bold text-lg leading-tight group-hover:underline decoration-1 underline-offset-2">{item.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}