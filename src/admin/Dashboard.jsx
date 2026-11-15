import React, { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/editorial";
import {
  getStatusMeta,
  hasPermission,
  normalizeRole,
} from "../utils/rbac";
import { checkTableExists } from "../utils/cmsService";
import {
  FileText,
  Clock,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Archive,
  Users,
  ShieldCheck,
  Eye,
  MessageSquare,
  BookOpen,
  X,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Activity,
  PenTool,
  Calendar,
  Megaphone,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const outlet = useOutletContext() || {};
  const { role = "Staff Writer", profile } = outlet;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const [migrationReady, setMigrationReady] = useState(true);

  const [articles, setArticles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [eventsCount, setEventsCount] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        artRes,
        profRes,
        commRes,
        actRes,
        evRes,
        annRes,
        msgRes,
        hasSiteSettings,
        hasRevisions,
      ] = await Promise.all([
        supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase
          .from("comments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase
          .from("announcements")
          .select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        checkTableExists("site_settings"),
        checkTableExists("article_revisions"),
      ]);

      setArticles(artRes.data || []);
      setProfiles(profRes.data || []);
      setComments(commRes.data || []);
      setActivityLogs(actRes.data || []);
      setEventsCount(evRes.count || 0);
      setAnnouncementsCount(annRes.count || 0);
      setMessagesCount(msgRes.count || 0);
      setMigrationReady(Boolean(hasSiteSettings && hasRevisions));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  // Compute all real KPI counts from DB records
  const totalPublished = articles.filter(
    (a) => (a.status || "published") === "published"
  ).length;
  const totalDrafts = articles.filter((a) => a.status === "draft").length;
  const totalPendingReview = articles.filter((a) =>
    ["pending_review", "in_review", "revision_required"].includes(a.status)
  ).length;
  const totalScheduled = articles.filter(
    (a) => a.status === "scheduled"
  ).length;
  const totalRejected = articles.filter((a) => a.status === "rejected").length;
  const totalArchived = articles.filter((a) => a.status === "archived").length;

  const editorRoles = new Set([
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
    "Adviser",
  ]);
  const totalEditors = profiles.filter((p) =>
    editorRoles.has(normalizeRole(p.role))
  ).length;
  const totalContributors = profiles.length;

  const totalViews = articles.reduce(
    (sum, a) => sum + (Number(a.views) || 0),
    0
  );
  const totalEngagement = comments.length + messagesCount;

  const pendingQueue = articles.filter((a) =>
    ["pending_review", "in_review", "revision_required", "approved"].includes(
      a.status
    )
  );
  const scheduledList = articles
    .filter((a) => a.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduled_at || a.created_at) -
        new Date(b.scheduled_at || b.created_at)
    )
    .slice(0, 5);
  const mostViewed = [...articles]
    .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
    .slice(0, 5);
  const recentSubmitted = articles.slice(0, 6);

  // Category breakdown for SVG chart
  const categoryMap = {};
  articles.forEach((a) => {
    const cat = a.category || "Uncategorized";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, count: 0, views: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].views += Number(a.views) || 0;
  });
  const categoryStats = Object.values(categoryMap).sort(
    (a, b) => b.count - a.count
  );
  const maxCatCount = Math.max(1, ...categoryStats.map((c) => c.count));

  // Status breakdown for chart
  const statusBuckets = [
    { label: "Published", value: totalPublished, color: "#059669" },
    { label: "Drafts", value: totalDrafts, color: "#64748B" },
    { label: "In Review", value: totalPendingReview, color: "#D97706" },
    { label: "Scheduled", value: totalScheduled, color: "#2563EB" },
    { label: "Rejected", value: totalRejected, color: "#DC2626" },
    { label: "Archived", value: totalArchived, color: "#334155" },
  ];
  const maxStatusCount = Math.max(1, ...statusBuckets.map((s) => s.value));

  const kpiCards = [
    {
      label: "Published Articles",
      value: totalPublished,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      to: "/admin-panel/articles?status=published",
    },
    {
      label: "Draft Articles",
      value: totalDrafts,
      icon: FileText,
      tone: "text-slate-700 bg-slate-100 border-slate-200",
      to: "/admin-panel/articles?status=draft",
    },
    {
      label: "Pending Review",
      value: totalPendingReview,
      icon: Clock,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      to: "/admin-panel/articles?status=pending_review",
    },
    {
      label: "Scheduled",
      value: totalScheduled,
      icon: CalendarClock,
      tone: "text-blue-700 bg-blue-50 border-blue-200",
      to: "/admin-panel/articles?status=scheduled",
    },
    {
      label: "Rejected Articles",
      value: totalRejected,
      icon: XCircle,
      tone: "text-red-700 bg-red-50 border-red-200",
      to: "/admin-panel/articles?status=rejected",
    },
    {
      label: "Archived Articles",
      value: totalArchived,
      icon: Archive,
      tone: "text-slate-600 bg-slate-50 border-slate-200",
      to: "/admin-panel/articles?status=archived",
    },
    {
      label: "Contributors / Writers",
      value: totalContributors,
      icon: Users,
      tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
      to: "/admin-panel/users",
    },
    {
      label: "Editorial Staff",
      value: totalEditors,
      icon: ShieldCheck,
      tone: "text-purple-700 bg-purple-50 border-purple-200",
      to: "/admin-panel/users",
    },
    {
      label: "Total Article Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      tone: "text-sky-700 bg-sky-50 border-sky-200",
      to: "/admin-panel/analytics",
    },
    {
      label: "Reader Engagement",
      value: totalEngagement,
      icon: MessageSquare,
      tone: "text-rose-700 bg-rose-50 border-rose-200",
      to: "/admin-panel/comments",
    },
  ];

  const getArticleTitleById = (articleId) => {
    const found = articles.find((a) => a.id === articleId);
    return found ? found.title : `Article #${articleId || "—"}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Newsroom Operations Center
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Editorial Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Signed in as{" "}
            <span className="font-semibold text-slate-800">
              {profile?.full_name || "Editorial Staff"}
            </span>{" "}
            ({role}) &middot; Live metrics from Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>

          <button
            type="button"
            onClick={() => setStyleGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-900" />
            Style Guide
          </button>

          {hasPermission(role, "createArticle") && (
            <Link
              to="/admin-panel/articles?action=new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" />
              New Article
            </Link>
          )}
        </div>
      </div>

      {/* Migration status notice when upgraded SQL tables are missing */}
      {!loading && !migrationReady && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold text-sm mb-0.5">
              Extended Editorial Schema Not Yet Applied in Supabase
            </p>
            <p>
              Core articles, events, announcements, media, categories, comments,
              and profiles are active. To enable{" "}
              <span className="font-semibold">
                Revision History, Internal Editorial Comments, Approval History,
                Page View Logs, and Homepage CMS Settings
              </span>
              , execute{" "}
              <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono">
                client/supabase/migrations/001_editorial_cms_upgrade.sql
              </code>{" "}
              in your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Helpful alert when all existing articles are still drafts */}
      {!loading && articles.length > 0 && totalPublished === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950">
              <p className="font-bold text-sm">
                All {articles.length} current articles are saved as drafts
              </p>
              <p className="text-blue-800 mt-0.5">
                Review and publish approved articles in Article Management so they
                appear in the public published feed.
              </p>
            </div>
          </div>
          <Link
            to="/admin-panel/articles"
            className="shrink-0 px-3 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition"
          >
            Review Articles
          </Link>
        </div>
      )}

      {/* 10 Real-Time KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${card.tone}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-700 transition" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {loading ? "—" : card.value}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {card.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Bulletin Operational Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link
          to="/admin-panel/events"
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-900" />
            <span className="text-xs font-bold text-slate-700">
              Campus Events
            </span>
          </div>
          <span className="text-sm font-black text-slate-900">
            {loading ? "—" : eventsCount}
          </span>
        </Link>

        <Link
          to="/admin-panel/announcements"
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">
              Published Advisories
            </span>
          </div>
          <span className="text-sm font-black text-slate-900">
            {loading ? "—" : announcementsCount}
          </span>
        </Link>

        <Link
          to="/admin-panel/messages"
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-slate-300 transition"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-700">
              Reader Inquiries
            </span>
          </div>
          <span className="text-sm font-black text-slate-900">
            {loading ? "—" : messagesCount}
          </span>
        </Link>
      </div>

      {/* Publication Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Pipeline Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Editorial Pipeline Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Current articles grouped by workflow status
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-900" />
          </div>

          <div className="space-y-3">
            {statusBuckets.map((item) => {
              const pct = Math.round((item.value / maxStatusCount) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value === 0 ? 0 : Math.max(4, pct)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Performance Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Section Output &amp; Readership
              </h2>
              <p className="text-xs text-slate-500">
                Article volume and views by section
              </p>
            </div>
            <Link
              to="/admin-panel/analytics"
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Full Analytics &rarr;
            </Link>
          </div>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No article data available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryStats.slice(0, 6).map((cat) => {
                const widthPct = Math.round((cat.count / maxCatCount) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {cat.name}
                      </span>
                      <span className="text-slate-600 font-medium">
                        <strong className="text-slate-900">{cat.count}</strong>{" "}
                        articles &middot;{" "}
                        <strong className="text-slate-900">
                          {cat.views.toLocaleString()}
                        </strong>{" "}
                        views
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Queues Row: Pending Approval + Upcoming Scheduled + Most Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Approval Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Approval Queue
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {pendingQueue.length} pending
            </span>
          </div>

          {pendingQueue.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center flex-1 flex items-center justify-center">
              No articles awaiting editorial approval.
            </p>
          ) : (
            <div className="space-y-2.5 flex-1">
              {pendingQueue.slice(0, 5).map((art) => {
                const st = getStatusMeta(art.status);
                return (
                  <Link
                    key={art.id}
                    to={`/admin-panel/articles?edit=${art.id}`}
                    className="block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(art.created_at, { short: true })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">
                      {art.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      By {art.author_name || "Staff Writer"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Scheduled Publications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Scheduled Queue
            </h2>
            <CalendarClock className="w-4 h-4 text-blue-700" />
          </div>

          {scheduledList.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center flex-1 flex items-center justify-center">
              No scheduled publications queued.
            </p>
          ) : (
            <div className="space-y-2.5 flex-1">
              {scheduledList.map((art) => (
                <Link
                  key={art.id}
                  to={`/admin-panel/articles?edit=${art.id}`}
                  className="block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-bold text-slate-900 line-clamp-1">
                    {art.title}
                  </p>
                  <p className="text-[11px] text-blue-700 font-semibold mt-1">
                    Scheduled:{" "}
                    {art.scheduled_at
                      ? new Date(art.scheduled_at).toLocaleString()
                      : "Pending timestamp"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Most Viewed Articles */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Most Viewed Articles
            </h2>
            <Eye className="w-4 h-4 text-sky-700" />
          </div>

          {mostViewed.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center flex-1 flex items-center justify-center">
              No view data recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5 flex-1">
              {mostViewed.map((art, idx) => (
                <Link
                  key={art.id}
                  to={`/admin-panel/articles?edit=${art.id}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {art.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {art.category || "News"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800 shrink-0">
                    {(Number(art.views) || 0).toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recently Submitted + Latest Comments + Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recently Submitted Articles */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Recent Articles
            </h2>
            <Link
              to="/admin-panel/articles"
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Manage All
            </Link>
          </div>

          {recentSubmitted.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No articles found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSubmitted.map((art) => {
                const st = getStatusMeta(art.status || "published");
                return (
                  <Link
                    key={art.id}
                    to={`/admin-panel/articles?edit=${art.id}`}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-1 rounded transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {art.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {art.author_name || "Editorial Staff"} &middot;{" "}
                        {formatDate(art.created_at, { short: true })}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.badge}`}
                    >
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest Reader Comments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Latest Reader Comments
            </h2>
            <Link
              to="/admin-panel/comments"
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Moderate
            </Link>
          </div>

          {comments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No reader comments submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {comments.slice(0, 5).map((c) => (
                <div key={c.id} className="py-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-bold text-slate-700">
                      {c.author_name || "Campus Reader"}
                    </span>
                    <span>{formatDate(c.created_at, { short: true })}</span>
                  </div>
                  <p className="text-xs text-slate-800 line-clamp-2">
                    {c.content}
                  </p>
                  <p className="text-[10px] text-blue-800 mt-0.5 truncate">
                    On: {getArticleTitleById(c.article_id)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Editorial Activities */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Recent Editorial Activity
            </h2>
            <Link
              to="/admin-panel/activity"
              className="text-xs font-bold text-blue-900 hover:underline"
            >
              Full Log
            </Link>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Activity logs will appear here as staff create, review, and
              publish content.
            </p>
          ) : (
            <div className="space-y-2.5">
              {activityLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 text-xs border-b border-slate-100 pb-2 last:border-0"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-800 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium leading-snug">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {log.user_name ? `${log.user_name} · ` : ""}
                      {formatDate(log.created_at, { short: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editorial Style Guide Modal */}
      {styleGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900">
                  The Binary Bulletin
                </p>
                <h3 className="text-lg font-black text-slate-900">
                  Campus Journalism &amp; Editorial Style Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStyleGuideOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  1. Institutional Naming &amp; Capitalization
                </h4>
                <p>
                  Always write <strong>AMA Computer College Lipa Campus</strong>{" "}
                  on first reference (may use <strong>AMACC Lipa</strong> on
                  subsequent references). Refer to the publication as{" "}
                  <strong>The Binary Bulletin</strong>.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  2. Headlines, Leads &amp; Attribution
                </h4>
                <p>
                  News headlines should use active voice, present tense, and
                  sentence or title case consistently without trailing periods.
                  Verify all names, official titles, dates, venues, and quotes
                  prior to submitting for editorial review.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  3. Photojournalism &amp; Captions
                </h4>
                <p>
                  Every image must include a descriptive caption identifying the
                  subject, context, and date, plus an accurate photo credit
                  (e.g., <em>Photo by [Name] / The Binary Bulletin</em>).
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">
                  4. Editorial Workflow Discipline
                </h4>
                <p>
                  Writers save drafts and submit for review. Section/News
                  Editors review grammar and facts and may request revisions.
                  Only authorized Editors-in-Chief, Managing Editors, News
                  Editors, or Super Admins may approve and publish final copy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
