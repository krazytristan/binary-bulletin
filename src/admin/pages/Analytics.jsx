import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { exportToCsv, checkTableExists } from "../../utils/cmsService";
import {
  BarChart3,
  Download,
  Printer,
  Eye,
  FileText,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

const DATE_RANGES = [
  { id: "7d", label: "Last 7 Days", days: 7 },
  { id: "30d", label: "Last 30 Days", days: 30 },
  { id: "90d", label: "Last 90 Days", days: 90 },
  { id: "365d", label: "Last 12 Months", days: 365 },
  { id: "all", label: "All Time", days: null },
];

export default function Analytics() {
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pageViews, setPageViews] = useState([]);
  const [hasPageViewsTable, setHasPageViewsTable] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const pvReady = await checkTableExists("page_views");
      setHasPageViewsTable(pvReady);

      const queries = [
        supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("comments").select("*"),
        supabase.from("profiles").select("*"),
      ];

      if (pvReady) {
        queries.push(
          supabase
            .from("page_views")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(2000)
        );
      }

      const [artRes, commRes, profRes, pvRes] = await Promise.all(queries);
      setArticles(artRes.data || []);
      setComments(commRes.data || []);
      setProfiles(profRes.data || []);
      setPageViews(pvRes?.data || []);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const selectedRangeObj = DATE_RANGES.find((r) => r.id === range);
  const cutoffDate = selectedRangeObj?.days
    ? new Date(Date.now() - selectedRangeObj.days * 86400000)
    : null;

  const filterByDate = (rows) => {
    if (!cutoffDate) return rows;
    return rows.filter((r) => new Date(r.created_at) >= cutoffDate);
  };

  const filteredArticles = filterByDate(articles);
  const filteredComments = filterByDate(comments);
  const filteredPageViews = filterByDate(pageViews);

  const totalViews = filteredArticles.reduce(
    (sum, a) => sum + (Number(a.views) || 0),
    0
  );
  const publishedArticles = filteredArticles.filter(
    (a) => (a.status || "published") === "published"
  );

  // Average draft-to-publish turnaround in hours (from real created_at & published_at/updated_at)
  const turnaroundHoursList = publishedArticles
    .filter((a) => a.created_at && (a.published_at || a.updated_at))
    .map((a) => {
      const start = new Date(a.created_at).getTime();
      const end = new Date(a.published_at || a.updated_at).getTime();
      return Math.max(0, (end - start) / 3600000);
    });
  const avgTurnaroundHours =
    turnaroundHoursList.length > 0
      ? (
          turnaroundHoursList.reduce((s, h) => s + h, 0) /
          turnaroundHoursList.length
        ).toFixed(1)
      : null;

  // Most-read articles
  const topArticles = [...filteredArticles]
    .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
    .slice(0, 8);

  // Popular categories
  const categoryStatsMap = {};
  filteredArticles.forEach((a) => {
    const cat = a.category || "Uncategorized";
    if (!categoryStatsMap[cat]) {
      categoryStatsMap[cat] = { category: cat, articles: 0, views: 0 };
    }
    categoryStatsMap[cat].articles += 1;
    categoryStatsMap[cat].views += Number(a.views) || 0;
  });
  const popularCategories = Object.values(categoryStatsMap).sort(
    (a, b) => b.views - a.views || b.articles - a.articles
  );
  const maxCatViews = Math.max(1, ...popularCategories.map((c) => c.views));

  // Contributor productivity
  const contributorMap = {};
  filteredArticles.forEach((a) => {
    const name = a.author_name || "Editorial Staff";
    if (!contributorMap[name]) {
      contributorMap[name] = {
        author: name,
        total: 0,
        published: 0,
        views: 0,
      };
    }
    contributorMap[name].total += 1;
    if ((a.status || "published") === "published") {
      contributorMap[name].published += 1;
    }
    contributorMap[name].views += Number(a.views) || 0;
  });
  const contributorStats = Object.values(contributorMap).sort(
    (a, b) => b.total - a.total || b.views - a.views
  );

  // Publication frequency by month
  const monthlyPubMap = {};
  filteredArticles.forEach((a) => {
    if (!a.created_at) return;
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyPubMap[key] = (monthlyPubMap[key] || 0) + 1;
  });
  const monthlyFreq = Object.entries(monthlyPubMap).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const maxMonthlyCount = Math.max(1, ...monthlyFreq.map((m) => m[1]));

  const handleExportCsv = () => {
    const rows = filteredArticles.map((a) => ({
      ID: a.id,
      Headline: a.title,
      Section: a.category || "Uncategorized",
      Author: a.author_name || "Editorial Staff",
      Status: a.status || "published",
      Views: Number(a.views) || 0,
      CreatedAt: a.created_at,
      PublishedAt: a.published_at || "",
    }));
    exportToCsv(`binary-bulletin-analytics-${range}.csv`, rows);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 print:pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Publication Intelligence
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Analytics &amp; Editorial Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All figures reflect live records queried from Supabase without
            synthetic projections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-700"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Article Views</span>
            <Eye className="w-4 h-4 text-sky-700" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "—" : totalViews.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Recorded on articles
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Page Visits</span>
            <TrendingUp className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading
              ? "—"
              : hasPageViewsTable
                ? filteredPageViews.length.toLocaleString()
                : "N/A"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {hasPageViewsTable
              ? "Tracked visitor sessions"
              : "Apply SQL migration to track"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">
              Published Output
            </span>
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "—" : publishedArticles.length}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Out of {filteredArticles.length} created
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">
              Reader Comments
            </span>
            <Users className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? "—" : filteredComments.length}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Registered staff: {profiles.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">
              Avg Turnaround
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading
              ? "—"
              : avgTurnaroundHours !== null
                ? `${avgTurnaroundHours}h`
                : "N/A"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Draft to publish latency
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Popular Sections */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Readership by Publication Section
            </h2>
            <BarChart3 className="w-4 h-4 text-blue-900" />
          </div>
          {popularCategories.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No section data in selected window.
            </p>
          ) : (
            <div className="space-y-3">
              {popularCategories.map((c) => {
                const pct = Math.round((c.views / maxCatViews) * 100);
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {c.category} ({c.articles})
                      </span>
                      <span className="font-bold text-slate-900">
                        {c.views.toLocaleString()} views
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 rounded-full"
                        style={{ width: `${c.views > 0 ? Math.max(5, pct) : 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Publication Frequency */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
            Monthly Publication Frequency
          </h2>
          {monthlyFreq.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No dated articles in selected range.
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyFreq.map(([month, count]) => (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">
                      {month}
                    </span>
                    <span className="font-bold text-slate-900">
                      {count} articles
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.round((count / maxMonthlyCount) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tables: Top Read Articles & Contributor Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Most-Read Articles
            </h2>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {topArticles.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No articles.</p>
            ) : (
              topArticles.map((art, i) => (
                <div
                  key={art.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {i + 1}. {art.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {art.category || "News"} &middot;{" "}
                      {art.author_name || "Staff"}
                    </p>
                  </div>
                  <span className="font-black text-blue-900 shrink-0">
                    {(Number(art.views) || 0).toLocaleString()} views
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Contributor Productivity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-4">Author</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Published</th>
                  <th className="py-2.5 px-4 text-right">Total Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contributorStats.map((c) => (
                  <tr key={c.author}>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {c.author}
                    </td>
                    <td className="py-2.5 px-3">{c.total}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      {c.published}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      {c.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
