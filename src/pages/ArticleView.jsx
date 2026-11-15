import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ChevronLeft, Share2, Check, Clock, Newspaper, MessageSquare } from "lucide-react";
import {
  PUBLICATION,
  formatDate,
  estimateReadingTime,
  cleanEditorialText,
  isMetadataTagExcerpt,
  parseArticleBlocks,
} from "../utils/editorial";

function renderInlineMarkdown(text) {
  if (!text) return text;
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 underline hover:text-red-900"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({
    author_name: "",
    author_email: "",
    content: "",
  });
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentNotice, setCommentNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    window.scrollTo(0, 0);
    try {
      let { data: artData, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      let sourceType = "article";

      if (error || !artData) {
        const { data: annData } = await supabase
          .from("announcements")
          .select("*")
          .eq("id", id)
          .single();
        if (annData) {
          artData = {
            ...annData,
            category: "Official Notice",
            author_name: annData.author_name || "Campus Administration",
          };
          sourceType = "announcement";
        }
      }

      if (artData) {
        setArticle({ ...artData, sourceType });
        document.title = `${cleanEditorialText(artData.seo_title || artData.title)} | ${PUBLICATION.name}`;

        if (sourceType === "article") {
          // Track view count & page view gracefully
          supabase.rpc("increment_article_views", { target_article_id: id }).then(() => {}, () => {});
          supabase.from("page_views").insert({ path: `/article/${id}`, article_id: id }).then(() => {}, () => {});

          const { data: commData } = await supabase
            .from("comments")
            .select("*")
            .eq("article_id", id)
            .order("created_at", { ascending: false });
          setComments(
            (commData || []).filter(
              (c) => !c.status || c.status === "approved"
            )
          );
        }

        if (sourceType === "article" && artData.category) {
          const { data: relData } = await supabase
            .from("articles")
            .select("*")
            .eq("category", artData.category)
            .neq("id", id)
            .limit(3);
          setRelated(relData || []);
        } else {
          const { data: relData } = await supabase
            .from("articles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3);
          setRelated(relData || []);
        }
      } else {
        setArticle(null);
        document.title = `Article Not Found | ${PUBLICATION.name}`;
      }
    } catch (error) {
      console.error("Error loading publication data:", error);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const blocks = useMemo(() => {
    return parseArticleBlocks(article?.content || "", { category: article?.category });
  }, [article]);

  const firstParagraphIndex = useMemo(() => {
    return blocks.findIndex((b) => b.type === "paragraph");
  }, [blocks]);

  const validDeck = useMemo(() => {
    if (!article?.excerpt || isMetadataTagExcerpt(article.excerpt)) return "";
    return cleanEditorialText(article.excerpt);
  }, [article]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.content.trim() || article?.sourceType !== "article") return;
    setCommentSubmitting(true);
    setCommentNotice("");
    try {
      const basePayload = {
        article_id: article.id,
        content: commentForm.content.trim(),
      };
      const extPayload = {
        ...basePayload,
        author_name: commentForm.author_name.trim() || "Campus Reader",
        author_email: commentForm.author_email.trim() || null,
        status: "pending",
      };
      let { error } = await supabase.from("comments").insert(extPayload);
      if (error && /column .* does not exist/i.test(error.message || "")) {
        const retry = await supabase.from("comments").insert(basePayload);
        error = retry.error;
      }
      if (error) throw error;
      setCommentForm({ author_name: "", author_email: "", content: "" });
      setCommentNotice(
        "Thank you. Your comment has been submitted for editorial review."
      );
    } catch (err) {
      setCommentNotice(
        err.message || "Unable to submit comment right now."
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-serif italic text-gray-500">Retrieving dispatch from archive...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] text-[#111827] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-lg w-full bg-white border-2 border-blue-900 p-8 md:p-12 text-center shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-900 mb-3">
              Archive Notice
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-black uppercase text-blue-900 mb-4">
              Story Not Found
            </h1>
            <p className="font-serif text-gray-600 mb-8 leading-relaxed">
              The requested article or notice may have been removed or moved within the publication archive.
            </p>
            <Link
              to="/news"
              className="inline-block bg-blue-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors"
            >
              Browse News Archive
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isLiterary = article.category?.toLowerCase() === "literary";

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased selection:bg-blue-900 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16 flex-1 w-full">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-900 hover:text-blue-900 transition-colors"
          >
            <ChevronLeft size={15} /> Back to News &amp; Archive
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 border border-blue-900 px-3 py-1.5 hover:bg-blue-900 hover:text-white transition-colors"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? "Link Copied" : "Share"}
          </button>
        </div>

        <article>
          <header className="text-center mb-8 md:mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest bg-amber-400 border border-amber-500 text-blue-950 px-3 py-1 inline-block mb-4 md:mb-6 shadow-sm">
              {article.category || "Official Notice"}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black leading-[1.12] mb-6 text-gray-900">
              {cleanEditorialText(article.title)}
            </h1>

            {(article.subheadline || validDeck) && (
              <p className="text-lg md:text-xl font-serif italic text-gray-700 max-w-2xl mx-auto mb-6 leading-relaxed">
                {article.subheadline || validDeck}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-wider text-gray-500 border-y border-gray-200 py-3">
              <span className="text-blue-900">
                By {article.author_name || "Editorial Staff"}
              </span>
              <span className="text-gray-300">&bull;</span>
              <span className="text-amber-800">{formatDate(article.published_at || article.created_at)}</span>
              <span className="text-gray-300">&bull;</span>
              <span className="inline-flex items-center gap-1 text-gray-600">
                <Clock size={12} /> {estimateReadingTime(article.content)}
              </span>
            </div>
          </header>

          {article.image_url && (
            <figure className="mb-10 md:mb-12">
              <div className="aspect-video w-full bg-gray-100 border-2 border-blue-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]">
                <img
                  src={article.image_url}
                  className="w-full h-full object-cover"
                  alt={article.image_caption || article.title}
                />
              </div>
              <figcaption className="mt-3 text-xs font-serif italic text-gray-600 text-right">
                {article.image_caption ||
                  `${cleanEditorialText(article.title)} — Courtesy of ${PUBLICATION.name}`}
                {article.image_credit && (
                  <span className="not-italic font-semibold text-gray-700">
                    {" "}({article.image_credit})
                  </span>
                )}
              </figcaption>
            </figure>
          )}

          <div className="max-w-3xl mx-auto">
            <div
              className={`max-w-none font-serif text-gray-800 ${
                isLiterary ? "text-center text-lg md:text-xl leading-loose py-4" : "text-base md:text-lg leading-relaxed"
              }`}
            >
              {blocks.map((block, i) => {
                if (block.type === "heading") {
                  return (
                    <h2
                      key={i}
                      className="text-xl md:text-2xl font-serif font-black text-blue-900 mt-10 mb-4 border-l-4 border-amber-400 pl-4"
                    >
                      {renderInlineMarkdown(block.text)}
                    </h2>
                  );
                }

                if (block.type === "quote") {
                  return (
                    <blockquote
                      key={i}
                      className="my-6 border-l-4 border-red-900 pl-5 italic text-gray-700 text-lg bg-white py-3 pr-4"
                    >
                      {renderInlineMarkdown(block.text)}
                    </blockquote>
                  );
                }

                if (block.type === "image") {
                  return (
                    <figure key={i} className="my-8">
                      <img
                        src={block.url}
                        alt={block.alt || article.title}
                        className="w-full border border-gray-300"
                      />
                      {block.alt && (
                        <figcaption className="mt-2 text-xs font-serif italic text-gray-500 text-right">
                          {block.alt}
                        </figcaption>
                      )}
                    </figure>
                  );
                }

                if (block.type === "bullet") {
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 pl-2">
                      <span className="mt-2.5 w-1.5 h-1.5 bg-red-900 shrink-0 rounded-full" />
                      <p className="leading-relaxed">
                        {renderInlineMarkdown(block.text)}
                      </p>
                    </div>
                  );
                }

                if (!isLiterary && i === firstParagraphIndex && block.text.length > 40) {
                  return (
                    <p key={i} className="mb-6 leading-loose">
                      <span className="float-left text-6xl md:text-7xl font-serif font-black leading-[0.8] pr-3 pt-2 text-blue-900">
                        {block.text.charAt(0)}
                      </span>
                      {renderInlineMarkdown(block.text.slice(1))}
                    </p>
                  );
                }

                return (
                  <p key={i} className={isLiterary ? "mb-3" : "mb-6 leading-loose"}>
                    {renderInlineMarkdown(block.text)}
                  </p>
                );
              })}
            </div>

            {/* Editorial Colophon */}
            <div className="mt-12 pt-6 border-t border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border">
              <div className="flex items-center gap-3">
                <Newspaper size={22} className="text-blue-900 shrink-0" />
                <div>
                  <p className="font-serif font-bold text-sm text-blue-900">
                    {PUBLICATION.name} &bull; {PUBLICATION.institution}
                  </p>
                  <p className="font-serif italic text-xs text-gray-600">
                    {PUBLICATION.motto}
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="text-xs font-bold uppercase tracking-widest text-red-900 hover:text-blue-900 transition-colors shrink-0"
              >
                Send a Letter to the Editor &rarr;
              </Link>
            </div>

            {/* Gallery Section */}
            {article.gallery && article.gallery.length > 0 && (
              <div className="mt-14 border-t-[3px] border-blue-900 pt-10">
                <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-center mb-8 text-red-900">
                  Visual Coverage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {article.gallery.map((url, index) => (
                    <figure key={index} className="group">
                      <div className="aspect-[4/3] border-2 border-gray-300 overflow-hidden bg-gray-100 group-hover:border-blue-900 transition-colors">
                        <img
                          src={url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          alt={`${article.title} — Photograph ${index + 1}`}
                        />
                      </div>
                      <figcaption className="mt-2 text-xs font-serif italic text-gray-500">
                        Photo {index + 1} of {article.gallery.length} &mdash; {PUBLICATION.name}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Reader Comments Section */}
        {article.sourceType === "article" && (
          <section className="max-w-3xl mx-auto mt-14 pt-10 border-t border-gray-300">
            <h3 className="font-sans font-bold text-xs uppercase tracking-widest mb-6 text-blue-900 flex items-center gap-2">
              <MessageSquare size={15} /> Reader Discussion ({comments.length})
            </h3>

            {comments.length > 0 && (
              <div className="space-y-4 mb-8">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-blue-900">
                        {c.author_name || "Campus Reader"}
                      </span>
                      <span className="text-gray-400">
                        {formatDate(c.created_at, { short: true })}
                      </span>
                    </div>
                    <p className="font-serif text-sm text-gray-800 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleCommentSubmit}
              className="bg-white border border-gray-300 p-5 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Leave a Comment
              </p>
              {commentNotice && (
                <p className="text-xs bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2">
                  {commentNotice}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={commentForm.author_name}
                  onChange={(e) =>
                    setCommentForm((p) => ({
                      ...p,
                      author_name: e.target.value,
                    }))
                  }
                  placeholder="Your Name (optional)"
                  className="px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-blue-900"
                />
                <input
                  type="email"
                  value={commentForm.author_email}
                  onChange={(e) =>
                    setCommentForm((p) => ({
                      ...p,
                      author_email: e.target.value,
                    }))
                  }
                  placeholder="Campus Email (optional, kept private)"
                  className="px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-blue-900"
                />
              </div>
              <textarea
                rows={3}
                required
                value={commentForm.content}
                onChange={(e) =>
                  setCommentForm((p) => ({ ...p, content: e.target.value }))
                }
                placeholder="Share a respectful, constructive perspective on this report..."
                className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:border-blue-900"
              />
              <button
                type="submit"
                disabled={commentSubmitting}
                className="bg-blue-900 text-white px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-900 transition-colors disabled:opacity-50"
              >
                {commentSubmitting ? "Submitting..." : "Submit Comment"}
              </button>
            </form>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-gray-300">
            <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-center mb-8 text-red-900">
              More from {PUBLICATION.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((item) => (
                <Link key={item.id} to={`/article/${item.id}`} className="group">
                  <div className="aspect-[16/10] border border-gray-300 mb-3 overflow-hidden bg-gray-100 group-hover:border-blue-900 transition-colors">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={item.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50/70">
                        <Newspaper size={24} className="text-blue-900/40" />
                      </div>
                    )}
                  </div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-red-900 mb-1">
                    {item.category}
                  </span>
                  <h4 className="font-serif font-bold text-lg leading-snug group-hover:text-red-900 text-gray-900 transition-colors">
                    {cleanEditorialText(item.title)}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
