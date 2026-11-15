import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import { formatDate } from "../../utils/editorial";
import { logActivity } from "../../utils/cmsService";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  Flag,
  ShieldAlert,
} from "lucide-react";

const STATUS_FILTERS = [
  { id: "all", label: "All Comments" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "hidden", label: "Hidden" },
  { id: "spam", label: "Spam" },
  { id: "reported", label: "Reported" },
];

export default function Comments() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canModerate = hasPermission(role, "moderateComments");

  const [comments, setComments] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, artRes] = await Promise.all([
        supabase
          .from("comments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("articles").select("id, title"),
      ]);
      setComments(commRes.data || []);
      setArticles(artRes.data || []);
    } catch (err) {
      console.error("Failed loading comments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getArticleTitle = (id) => {
    const found = articles.find((a) => a.id === id);
    return found ? found.title : `Article #${id || "—"}`;
  };

  const handleStatusChange = async (comment, nextStatus) => {
    if (!canModerate) return;
    try {
      const { error } = await supabase
        .from("comments")
        .update({
          status: nextStatus,
          moderated_by: user?.id || null,
        })
        .eq("id", comment.id);
      if (error) throw error;

      await logActivity({
        action: `Marked comment #${comment.id} as ${nextStatus}`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "comment",
        entityId: comment.id,
      });

      showToast("success", `Comment marked as ${nextStatus}.`);
      loadData();
    } catch (err) {
      showToast(
        "error",
        /column .* does not exist/i.test(err.message || "")
          ? "Comment status columns require running 001_editorial_cms_upgrade.sql."
          : err.message || "Moderation update failed."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canModerate) return;
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      await logActivity({
        action: `Deleted reader comment on "${getArticleTitle(deleteTarget.article_id)}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "comment",
        entityId: deleteTarget.id,
      });
      showToast("success", "Comment permanently deleted.");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Delete failed.");
    }
  };

  const filtered = comments.filter((c) => {
    const status = c.status || "approved";
    if (filterStatus === "reported" && !c.is_reported) return false;
    if (
      filterStatus !== "all" &&
      filterStatus !== "reported" &&
      status !== filterStatus
    )
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${c.content || ""} ${c.author_name || ""} ${c.author_email || ""} ${getArticleTitle(c.article_id)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Per-article engagement summary
  const engagementByArticle = {};
  comments.forEach((c) => {
    if (!c.article_id) return;
    engagementByArticle[c.article_id] =
      (engagementByArticle[c.article_id] || 0) + 1;
  });
  const topDiscussed = Object.entries(engagementByArticle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "hidden":
        return "bg-slate-200 text-slate-700";
      case "spam":
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-emerald-100 text-emerald-800";
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
          Reader Engagement
        </p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Comments &amp; Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Approve reader discussions, review flagged comments, hide
          inappropriate remarks, and remove spam.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                filterStatus === f.id
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments, reader, article..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Comments List */}
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
              Loading reader comments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
              No comments match the selected filter.
            </div>
          ) : (
            filtered.map((c) => {
              const status = c.status || "approved";
              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {c.author_name || "Campus Reader"}
                      </span>
                      {c.author_email && (
                        <span className="text-[11px] text-slate-400">
                          ({c.author_email})
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadge(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                      {c.is_reported && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <Flag className="w-2.5 h-2.5" /> Reported
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(c.created_at, { short: true })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed">
                    {c.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-blue-900 font-semibold">
                      Article: {getArticleTitle(c.article_id)}
                    </span>

                    {canModerate && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(c, "approved")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(c, "hidden")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200"
                        >
                          <EyeOff className="w-3 h-3" /> Hide
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(c, "spam")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-[11px] font-bold hover:bg-amber-100"
                        >
                          <ShieldAlert className="w-3 h-3" /> Spam
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(c, "rejected")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-700 text-[11px] font-bold hover:bg-red-100"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-red-600 hover:bg-red-50 text-[11px] font-bold"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Most Discussed Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Engagement by Article
            </h2>
          </div>

          {topDiscussed.length === 0 ? (
            <p className="text-xs text-slate-500">No discussion metrics yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topDiscussed.map(([artId, count]) => (
                <div
                  key={artId}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {getArticleTitle(Number(artId) || artId)}
                  </span>
                  <span className="text-xs font-black text-blue-900 shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Delete Comment?
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              Permanently remove this reader comment? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
