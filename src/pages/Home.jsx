import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SmartImage from "../components/SmartImage";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  BookOpen,
  ChevronRight,
  Newspaper,
  Quote,
  PenTool,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import {
  PUBLICATION,
  formatDate,
  formatEventDateParts,
  estimateReadingTime,
  cleanEditorialText,
  isMetadataTagExcerpt,
  isYouTubeUrl,
  getYouTubeThumbnailUrl,
} from "../utils/editorial";
import { checkTableExists } from "../utils/cmsService";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const scrollRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [articlesRes, annRes, eventsRes, videosRes, hasSiteSettings] = await Promise.all([
        supabase.from("articles").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("event_date", { ascending: true }).limit(3),
        supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(2),
        checkTableExists("site_settings"),
      ]);

      if (hasSiteSettings) {
        const { data: settingsRow } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();
        if (settingsRow) setSiteSettings(settingsRow);
      }

      const now = new Date();
      const publicArticles = (articlesRes.data || []).filter((item) => {
        if (!item.status || item.status === "published") return true;
        if (item.status === "scheduled" && item.scheduled_at) {
          return new Date(item.scheduled_at) <= now;
        }
        return false;
      });

      const normalizedArticles = publicArticles.map((item) => ({
        ...item,
        sourceType: "article",
        category: item.category || "News",
      }));

      const normalizedAnnouncements = (annRes.data || []).map((item) => ({
        ...item,
        sourceType: "announcement",
        category: "Official Notice",
        author_name: item.author_name || "Campus Administration",
      }));

      const combined = [...normalizedArticles, ...normalizedAnnouncements].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setArticles(combined);
      if (annRes.data) setAnnouncements(annRes.data.slice(0, 3));
      if (eventsRes.data) setEvents(eventsRes.data);
      if (videosRes.data) setVideos(videosRes.data);
    } catch (err) {
      console.error("Failed to fetch publication data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    document.title = `${PUBLICATION.name} | ${PUBLICATION.tagline}`;

    const consent = localStorage.getItem("bulletin_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setShowCookies(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [fetchData]);

  // Auto-scroll for the Archive Carousel
  useEffect(() => {
    if (loading || articles.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollTo({ left: scrollLeft + 340, behavior: "smooth" });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, articles.length]);

  const handleAcceptCookies = () => {
    localStorage.setItem("bulletin_cookie_consent", "true");
    setShowCookies(false);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSubscribeError("Please enter a valid email address.");
      return;
    }
    setSubscribeError("");
    localStorage.setItem("bulletin_subscriber_email", trimmed);
    setSubscribed(true);
    setEmail("");
  };

  const filteredArticles = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter(
      (a) =>
        a?.title?.toLowerCase().includes(term) ||
        a?.category?.toLowerCase().includes(term) ||
        a?.excerpt?.toLowerCase().includes(term)
    );
  }, [articles, searchQuery]);

  // Select Front Page Lead: prefer admin-pinned hero, then featured flag, then newest editorial/news/feature article with an image
  const featured = useMemo(() => {
    const pinnedId = siteSettings?.featured_article_id;
    const pinned = pinnedId
      ? filteredArticles.find((a) => String(a.id) === String(pinnedId))
      : null;
    if (pinned) return pinned;

    const editorialLead =
      filteredArticles.find((a) => a.is_featured && a.sourceType === "article") ||
      filteredArticles.find((a) => a.sourceType === "article" && a.image_url) ||
      filteredArticles.find((a) => a.sourceType === "article") ||
      filteredArticles[0];
    return editorialLead || null;
  }, [filteredArticles, siteSettings]);

  const recentDispatches = useMemo(() => {
    return filteredArticles.filter((a) => a.id !== featured?.id).slice(0, 4);
  }, [filteredArticles, featured]);

  const categorized = useMemo(() => {
    const get = (cat) => filteredArticles.filter((a) => a.category === cat);
    return {
      news: get("News"),
      sports: get("Sports"),
      feature: get("Feature"),
      opinion: get("Opinion"),
      editorial: get("Editorial"),
      literary: get("Literary"),
    };
  }, [filteredArticles]);

  const voicesList = useMemo(() => {
    return [...categorized.opinion, ...categorized.literary].slice(0, 3);
  }, [categorized]);

  const getLeadSummary = (item) => {
    if (!item) return "";
    if (item.excerpt && !isMetadataTagExcerpt(item.excerpt)) {
      return cleanEditorialText(item.excerpt);
    }
    return cleanEditorialText(item.content || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-pulse">
          <div className="border-b-[3px] border-blue-900 pb-6 mb-10 text-center space-y-4">
            <div className="h-3 w-64 bg-gray-200 mx-auto" />
            <div className="h-16 md:h-24 w-3/4 bg-gray-200 mx-auto" />
            <div className="h-3 w-80 bg-gray-200 mx-auto" />
          </div>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="h-44 bg-gray-200" />
              <div className="h-44 bg-gray-200" />
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="h-12 bg-gray-200" />
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="h-24 bg-gray-200" />
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="h-36 bg-gray-200" />
              <div className="h-36 bg-gray-200" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const featuredSummary = getLeadSummary(featured);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#111827] font-sans selection:bg-blue-900 selection:text-white antialiased">
      <Navbar />

      {siteSettings?.maintenance_mode && (
        <div className="bg-amber-400 text-blue-950 text-xs font-bold py-2.5 px-4 text-center border-b border-amber-500">
          {siteSettings.maintenance_message ||
            "The Binary Bulletin is undergoing scheduled editorial maintenance."}
        </div>
      )}

      {siteSettings?.breaking_news_enabled && siteSettings?.breaking_news_text && (
        <div className="bg-red-900 text-white py-2.5 px-4 text-center text-xs font-bold tracking-wider uppercase">
          <span className="bg-amber-400 text-blue-950 px-2 py-0.5 mr-2.5 font-black">
            Breaking
          </span>
          {siteSettings.breaking_news_link ? (
            <Link to={siteSettings.breaking_news_link} className="hover:underline">
              {siteSettings.breaking_news_text}
            </Link>
          ) : (
            <span>{siteSettings.breaking_news_text}</span>
          )}
        </div>
      )}

      {siteSettings?.homepage_config?.announcementBanner && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 py-2 px-4 text-center text-xs font-semibold">
          {siteSettings.homepage_config.announcementBanner}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* --- CLASSIC MASTHEAD --- */}
        <header className="mb-8 md:mb-10 text-center border-b-[3px] border-blue-900 pb-4 md:pb-6">
          <div className="flex justify-between items-center border-b border-gray-300 pb-2.5 mb-4 md:mb-6 text-[11px] font-sans uppercase tracking-widest text-gray-600">
            <div className="hidden md:flex items-center gap-2">
              <MapPin size={13} className="text-blue-900" />
              <span>{PUBLICATION.location}</span>
            </div>
            <div className="mx-auto md:mx-0 font-bold text-red-900 tracking-[0.16em]">
              Official Student Publication &bull; {PUBLICATION.institution}
            </div>
            <div className="hidden md:block font-semibold text-blue-900">
              Digital Edition
            </div>
          </div>

          <h1 className="text-[11vw] sm:text-6xl md:text-8xl lg:text-[7.5rem] font-serif font-black uppercase tracking-tighter leading-[0.9] text-blue-900">
            The Binary<br className="md:hidden" /> Bulletin
          </h1>

          <p className="mt-3 font-serif italic text-sm md:text-base text-gray-600">
            &ldquo;{PUBLICATION.motto}&rdquo;
          </p>

          <div className="flex flex-wrap justify-between items-center gap-2 border-t border-blue-900 mt-4 md:mt-5 pt-3 text-[11px] font-sans uppercase tracking-widest font-bold text-blue-900">
            <span className="hidden sm:inline">{PUBLICATION.shortInstitution} Press</span>
            <span className="mx-auto sm:mx-0">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="hidden sm:inline">Academic Year 2026–2027</span>
          </div>
        </header>

        {/* --- FRONT PAGE FILTER BAR --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-gray-200 pb-5">
          <p className="text-xs font-serif italic text-gray-600">
            Covering campus news, student voices, official advisories, and academic milestones.
          </p>
          <div className="relative w-full sm:w-72 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-900 transition-colors"
              size={15}
            />
            <input
              type="text"
              aria-label="Filter front page stories"
              placeholder="Filter headlines..."
              className="w-full bg-white border border-gray-300 rounded-none py-2.5 pl-10 pr-4 text-[#111827] outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 font-sans text-xs tracking-wide placeholder:text-gray-400 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* --- MAIN NEWSPAPER GRID --- */}
        <div className="grid lg:grid-cols-12 gap-x-8 gap-y-12 mb-16">
          {/* COLUMN 1: EDITORIAL, VOICES & BULLETINS (Left Sidebar) */}
          <div className="lg:col-span-3 space-y-10 lg:border-r border-gray-300 lg:pr-8 order-2 lg:order-1">
            {/* Editorial block */}
            <section className="border-b border-gray-300 pb-8">
              <div className="flex items-center gap-2 mb-4 text-blue-900 border-t-2 border-blue-900 pt-2.5">
                <Quote size={15} fill="currentColor" />
                <h2 className="font-sans font-bold uppercase text-xs tracking-widest">
                  Editorial
                </h2>
              </div>
              {categorized.editorial[0] ? (
                <Link to={`/article/${categorized.editorial[0].id}`} className="group block">
                  <h3 className="font-serif text-xl font-bold leading-snug mb-3 group-hover:text-red-900 transition-colors text-gray-900">
                    {categorized.editorial[0].title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-serif mb-4 line-clamp-4">
                    {getLeadSummary(categorized.editorial[0])}
                  </p>
                  <div className="flex items-center gap-3">
                    <SmartImage
                      src={
                        categorized.editorial[0].author_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          categorized.editorial[0].author_name || "Editorial Board"
                        )}&background=1E3A8A&color=fff`
                      }
                      mode="avatar"
                      fit="cover"
                      containerClassName="w-8 h-8 rounded-full border border-gray-200 shrink-0"
                      alt={categorized.editorial[0].author_name || "Editorial Board"}
                      fallbackLabel=""
                    />
                    <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-red-900">
                      {categorized.editorial[0].author_name || "Editorial Board"}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="bg-white border border-gray-200 p-4">
                  <h3 className="font-serif text-base font-bold text-blue-900 mb-2">
                    From the Editorial Desk
                  </h3>
                  <p className="text-sm font-serif text-gray-600 leading-relaxed mb-3">
                    Have a campus issue, commentary, or student perspective to share with the AMA Lipa community?
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-900 hover:text-blue-900 transition-colors"
                  >
                    Submit a Letter <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </section>

            {/* Voices & Literary block */}
            <section className="space-y-5 border-b border-gray-300 pb-8">
              <h2 className="font-sans font-bold uppercase text-xs tracking-widest border-t-2 border-blue-900 pt-2.5 flex items-center gap-2 text-blue-900">
                <PenTool size={14} /> Opinion &amp; Literary
              </h2>
              {voicesList.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {voicesList.map((a) => (
                    <Link
                      key={a.id}
                      to={`/article/${a.id}`}
                      className="block group border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="inline-block text-[10px] font-sans font-bold uppercase tracking-widest text-red-900 mb-1">
                        {a.category}
                      </span>
                      <h3 className="font-serif font-bold text-lg leading-snug group-hover:text-red-900 transition-colors mb-1.5 text-gray-900">
                        {a.title}
                      </h3>
                      <p className="text-xs font-sans font-semibold text-amber-800 uppercase tracking-wider">
                        By {a.author_name || "Student Contributor"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-serif italic text-gray-500">
                  No opinion or literary pieces published yet.
                </p>
              )}
            </section>

            {/* Campus Announcements block */}
            <section className="space-y-5">
              <div className="flex items-center justify-between border-t-2 border-blue-900 pt-2.5">
                <h2 className="font-sans font-bold uppercase text-xs tracking-widest flex items-center gap-2 text-blue-900">
                  <Newspaper size={14} /> Campus Bulletins
                </h2>
                <Link
                  to="/announcements"
                  className="text-[11px] font-bold uppercase tracking-wider text-red-900 hover:text-blue-900"
                >
                  All
                </Link>
              </div>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <Link
                    key={ann.id}
                    to={`/announcements?id=${ann.id}`}
                    className="block bg-white p-4 border border-gray-200 shadow-sm group hover:border-blue-900 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <span className="text-[10px] font-sans font-bold uppercase text-red-900 tracking-wider">
                        Official Notice
                      </span>
                      <span className="text-[10px] font-sans font-semibold text-gray-500">
                        {formatDate(ann.created_at, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-sm font-serif font-bold leading-snug mb-2 group-hover:text-blue-900 transition-colors text-gray-900">
                      {cleanEditorialText(ann.title)}
                    </h3>
                    <p className="text-xs text-gray-600 font-serif leading-relaxed line-clamp-3">
                      {cleanEditorialText(ann.content)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* COLUMN 2: FRONT PAGE LEAD (Center) */}
          <div className="lg:col-span-6 lg:border-r border-gray-300 lg:pr-8 order-1 lg:order-2">
            <div className="border-t-[3px] border-blue-900 pt-2.5 mb-6">
              <h2 className="uppercase tracking-widest font-sans font-bold text-xs text-blue-900 text-center">
                Front Page Lead
              </h2>
            </div>

            {featured ? (
              <article className="block">
                <Link to={`/article/${featured.id}`} className="group block">
                  <div className="text-center mb-3">
                    <span className="inline-block bg-red-900 text-white px-2.5 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest">
                      {featured.category}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif font-black leading-[1.12] mb-4 md:mb-5 group-hover:text-red-900 transition-colors text-center text-gray-900">
                    {cleanEditorialText(featured.title)}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-6 text-xs font-sans uppercase tracking-wider">
                    <span className="font-bold text-blue-900">
                      By {featured.author_name || "Editorial Staff"}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="text-gray-600 font-semibold">
                      {formatDate(featured.created_at)}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="text-amber-800 font-semibold">
                      {estimateReadingTime(featured.content)}
                    </span>
                  </div>

                  {featured.image_url && (
                    <figure className="mb-6 md:mb-8">
                      <div className="relative overflow-hidden bg-[#F5F3EE] border border-gray-300">
                        <SmartImage
                          src={featured.image_url}
                          mode="article"
                          fit="contain"
                          loading="eager"
                          className="max-h-[540px] transition-transform duration-700 group-hover:scale-[1.02]"
                          alt={featured.image_caption || featured.title}
                        />
                        <div className="absolute bottom-0 right-0 bg-amber-400 px-3 py-1 text-[10px] font-sans uppercase tracking-widest text-blue-950 font-bold border-t border-l border-amber-500">
                          Lead Story
                        </div>
                      </div>
                      <figcaption className="mt-2 text-xs font-serif italic text-gray-500 text-right">
                        {featured.image_caption || `Visual coverage — ${PUBLICATION.name}`}
                      </figcaption>
                    </figure>
                  )}

                  {featuredSummary && (
                    <p className="text-gray-800 text-base md:text-lg leading-relaxed font-serif">
                      <span className="float-left text-5xl md:text-6xl font-black font-serif leading-[0.85] pr-3 pt-1 text-blue-900">
                        {featuredSummary.charAt(0)}
                      </span>
                      {featuredSummary.slice(1, 260)}
                      {featuredSummary.length > 260 ? "..." : ""}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 mt-8 text-red-900 font-sans font-bold text-xs uppercase tracking-widest group-hover:text-blue-900 transition-colors">
                    Continue Reading <ArrowRight size={14} />
                  </div>
                </Link>
              </article>
            ) : (
              <div className="bg-white border border-gray-200 p-10 text-center">
                <p className="font-serif italic text-gray-500">
                  No matching stories found in the current edition.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: RECENT DISPATCHES & EVENTS (Right Sidebar) */}
          <div className="lg:col-span-3 space-y-8 order-3">
            <section>
              <h2 className="font-sans font-bold uppercase text-xs tracking-widest border-t-2 border-blue-900 pt-2.5 mb-6 text-blue-900">
                Recent Dispatches
              </h2>
              <div className="flex flex-col gap-6">
                {recentDispatches.map((a) => {
                  const previewText = getLeadSummary(a);
                  return (
                    <Link
                      key={a.id}
                      to={`/article/${a.id}`}
                      className="block group border-b border-gray-200 pb-5 last:border-0"
                    >
                      <span className="inline-block bg-red-900 text-white font-sans font-bold text-[10px] uppercase tracking-widest mb-2.5 px-2 py-0.5">
                        {a.category || "Official Notice"}
                      </span>
                      <h3 className="font-serif font-bold text-lg leading-snug group-hover:text-red-900 transition-colors mb-2 text-gray-900">
                        {cleanEditorialText(a.title)}
                      </h3>
                      {previewText && (
                        <p className="text-sm font-serif text-gray-600 line-clamp-3 mb-2.5 leading-relaxed">
                          {previewText}
                        </p>
                      )}
                      <p className="text-[11px] font-sans font-semibold text-amber-800">
                        {formatDate(a.created_at)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* UPCOMING EVENTS */}
            {events.length > 0 && (
              <section className="pt-2">
                <div className="flex items-center justify-between border-t-2 border-blue-900 pt-2.5 mb-5">
                  <h2 className="font-sans font-bold uppercase text-xs tracking-widest flex items-center gap-2 text-blue-900">
                    <Calendar size={14} /> Campus Events
                  </h2>
                  <Link
                    to="/events"
                    className="text-[11px] font-bold uppercase tracking-wider text-red-900 hover:text-blue-900"
                  >
                    Calendar
                  </Link>
                </div>
                <div className="flex flex-col gap-4">
                  {events.map((evt) => {
                    const parts = formatEventDateParts(evt.event_date);
                    return (
                      <Link
                        key={evt.id}
                        to={`/events?id=${evt.id}`}
                        className="block bg-white border border-gray-200 p-4 shadow-sm group hover:border-amber-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="bg-amber-400 text-blue-950 flex flex-col items-center justify-center min-w-[3.25rem] px-2 py-1.5 shrink-0">
                            <span className="font-sans text-[10px] uppercase font-bold tracking-widest">
                              {parts.monthShort}
                            </span>
                            <span className="font-serif font-black text-xl leading-none">
                              {parts.day}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-serif font-bold text-sm leading-snug group-hover:text-red-900 transition-colors mb-1.5 text-gray-900 line-clamp-2">
                              {evt.title}
                            </h3>
                            <span className="text-[11px] font-sans font-semibold text-gray-600 flex items-center gap-1">
                              <MapPin size={11} className="shrink-0 text-red-900" />
                              <span className="truncate">{evt.location || "Campus TBA"}</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* --- MULTIMEDIA DESK (Videos) --- */}
        {videos.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between border-b-2 border-gray-300 pb-4 mb-8">
              <h2 className="font-sans font-bold text-xs uppercase tracking-widest text-blue-900 flex items-center gap-2">
                <PlayCircle size={16} /> The Binary Online
              </h2>
              <Link
                to="/thebinar"
                className="text-xs font-bold uppercase tracking-wider text-red-900 hover:text-blue-900 transition-colors"
              >
                View All Broadcasts &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {videos.map((vid) => {
                const ytThumb = isYouTubeUrl(vid.video_url)
                  ? getYouTubeThumbnailUrl(vid.video_url)
                  : "";
                return (
                  <Link
                    to="/thebinar"
                    key={vid.id}
                    className="group cursor-pointer border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-900 transition-all"
                  >
                    <div className="aspect-video bg-gray-900 w-full mb-4 relative overflow-hidden flex items-center justify-center">
                      {ytThumb ? (
                        <SmartImage
                          src={ytThumb}
                          alt={vid.title}
                          mode="thumbnail"
                          fit="cover"
                          containerClassName="w-full h-full"
                          className="opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <video
                          src={vid.video_url}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors"></div>
                      <div className="absolute">
                        <PlayCircle
                          size={48}
                          className="text-white/90 group-hover:text-amber-400 transition-all drop-shadow-lg group-hover:scale-110 duration-300"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                    <h3 className="font-serif font-black text-xl leading-snug mb-2 text-gray-900 group-hover:text-red-900 transition-colors line-clamp-1">
                      {vid.title}
                    </h3>
                    {vid.excerpt && (
                      <p className="font-serif text-sm text-gray-600 line-clamp-2">
                        {vid.excerpt}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* --- ARCHIVE CAROUSEL (Bottom Strip) --- */}
        {filteredArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t-[4px] border-blue-900">
            <div className="flex items-center justify-between mb-8 border-b border-gray-300 pb-4">
              <h2 className="font-sans font-bold text-xs uppercase tracking-widest text-blue-900 flex items-center gap-2">
                <BookOpen size={16} /> From the Archives
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Scroll archives left"
                  onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
                  className="p-2 border border-blue-900 hover:bg-blue-900 hover:text-white transition-colors text-blue-900"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Scroll archives right"
                  onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
                  className="p-2 border border-blue-900 hover:bg-blue-900 hover:text-white transition-colors text-blue-900"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex flex-row gap-6 md:gap-8 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory"
            >
              {filteredArticles.map((a) => (
                <div key={a.id} className="w-[82vw] sm:w-[290px] snap-start shrink-0">
                  <Link to={`/article/${a.id}`} className="block group">
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100 mb-3.5 border border-gray-300 group-hover:border-blue-900 transition-colors">
                      {a.image_url ? (
                        <SmartImage
                          src={a.image_url}
                          mode="card"
                          fit="auto"
                          containerClassName="w-full h-full"
                          className="group-hover:scale-105 transition-transform duration-700"
                          alt={a.title}
                          fallbackLabel={a.category || "Official Notice"}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/70 p-4 text-center">
                          <Newspaper size={24} className="text-blue-900/40 mb-1.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900/60">
                            {a.category || "Official Notice"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="block text-[10px] font-sans uppercase tracking-widest text-red-900 font-bold mb-1.5">
                      {a.category || "Official Notice"}
                    </span>
                    <h3 className="font-serif font-bold text-lg leading-snug group-hover:text-red-900 transition-colors mb-1.5 line-clamp-2 text-gray-900">
                      {cleanEditorialText(a.title)}
                    </h3>
                    <span className="text-[11px] font-sans font-semibold text-gray-500">
                      {formatDate(a.created_at)}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- CAMPUS DIGEST SUBSCRIPTION --- */}
        <section className="bg-amber-400 border-2 border-blue-900 p-6 md:p-14 text-center my-16 max-w-4xl mx-auto shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] md:shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]">
          <div className="max-w-lg mx-auto space-y-5">
            <Newspaper size={36} className="mx-auto text-blue-900" strokeWidth={1.5} />
            <h2 className="text-3xl md:text-4xl font-serif font-black text-blue-950 leading-tight">
              Campus Digest Updates
            </h2>
            <p className="font-serif text-blue-950/90 text-base md:text-lg leading-relaxed">
              Stay informed on campus journalism, official advisories, and student features from {PUBLICATION.institution}.
            </p>

            {subscribed ? (
              <div className="bg-white border-2 border-blue-900 p-5 text-left flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-900 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                    Interest Recorded
                  </p>
                  <p className="font-serif text-sm text-gray-700 leading-relaxed">
                    Thank you for following {PUBLICATION.name}. Weekly email digests are being coordinated by the editorial board; meanwhile, check our Official Announcements page or Facebook page for real-time campus advisories.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-0 pt-2">
                <input
                  type="email"
                  aria-label="Campus email address"
                  placeholder="Enter your campus or personal email"
                  className="grow border-2 border-blue-900 px-5 py-3.5 font-sans font-medium text-blue-950 text-xs tracking-wide outline-none focus:bg-amber-50 placeholder:text-blue-900/50 bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-900 text-white border-2 border-blue-900 sm:border-l-0 px-7 py-3.5 font-sans font-bold uppercase text-xs tracking-widest hover:bg-red-900 hover:border-red-900 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}
            {subscribeError && (
              <p className="text-xs font-bold text-red-900">{subscribeError}</p>
            )}
          </div>
        </section>
      </main>

      {/* --- COOKIE CONSENT --- */}
      {showCookies && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t-4 border-amber-400 bg-blue-900 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3.5 text-white">
              <ShieldCheck size={22} className="shrink-0 text-amber-400" />
              <p className="text-xs font-sans font-medium leading-relaxed">
                By continuing to read {PUBLICATION.name}, you acknowledge our use of essential browser storage for site preferences and readership analytics.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowCookies(false)}
                className="text-xs font-sans uppercase font-bold text-blue-200 hover:text-white tracking-wider px-3 py-2"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleAcceptCookies}
                className="bg-amber-400 text-blue-950 px-6 py-2.5 text-xs font-sans font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors whitespace-nowrap border-2 border-amber-400"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />
    </div>
  );
}
