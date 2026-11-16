import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../utils/editorial";
import { exportToCsv } from "../../utils/cmsService";
import {
  Bell,
  Activity,
  CheckCheck,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function ActivityCenter() {
  const { refreshNotifications } = useOutletContext() || {};
  const [tab, setTab] = useState("notifications"); // notifications | logs
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, logRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setNotifications(notifRes.data || []);
      setLogs(logRes.data || []);
    } catch (err) {
      console.error("ActivityCenter load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markRead = async (id) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    refreshNotifications?.();
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshNotifications?.();
  };

  const filteredNotifs = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return `${n.title || ""} ${n.message || ""}`.toLowerCase().includes(q);
  });

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return `${l.action || ""} ${l.user_name || ""} ${l.entity_type || ""}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Audit &amp; Alerts
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notifications &amp; Activity Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track article workflow transitions, administrative updates, and
            system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === "notifications" && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              Mark All Read
            </button>
          )}
          {tab === "logs" && (
            <button
              type="button"
              onClick={() => exportToCsv("activity-audit-log.csv", filteredLogs)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("notifications")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ${
              tab === "notifications"
                ? "bg-blue-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications ({notifications.filter((n) => !n.is_read).length}{" "}
            unread)
          </button>
          <button
            type="button"
            onClick={() => setTab("logs")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ${
              tab === "logs"
                ? "bg-blue-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Audit Log ({logs.length})
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter alerts or log actions..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
          Loading newsroom timeline...
        </div>
      ) : tab === "notifications" ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filteredNotifs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No notifications yet.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 ${
                  !n.is_read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-700" />
                    )}
                    <p className="text-xs font-bold text-slate-900">{n.title}</p>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(n.created_at, { short: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:underline"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-900"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No administrative actions recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile Log Cards (<md) */}
              <div className="md:hidden divide-y divide-slate-100 text-xs">
                {filteredLogs.map((l) => (
                  <div key={`m-${l.id}`} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-slate-900 truncate">
                        {l.user_name || "Editorial Staff"}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {new Date(l.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-snug">{l.action}</p>
                    {l.user_role && (
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {l.user_role}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Log Table (>=md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {l.user_name || "Editorial Staff"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {l.user_role || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
