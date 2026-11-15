import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  EDITORIAL_ROLES,
  ROLE_DESCRIPTIONS,
  normalizeRole,
  hasPermission,
} from "../../utils/rbac";
import { formatDate } from "../../utils/editorial";
import { logActivity } from "../../utils/cmsService";
import SmartImage from "../../components/SmartImage";
import {
  Users as UsersIcon,
  Shield,
  Edit3,
  KeyRound,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

export default function Users() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canManage = hasPermission(role, "manageUsers");

  const [usersList, setUsersList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [editUser, setEditUser] = useState(null);
  const [activityUser, setActivityUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, artRes, catRes, logRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("articles")
          .select("id, title, status, author_id, author_name, views, created_at"),
        supabase.from("categories").select("name").order("name"),
        supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      setUsersList(profRes.data || []);
      setArticles(artRes.data || []);
      setCategories(catRes.data || []);
      setLogs(logRes.data || []);
    } catch (err) {
      console.error("Failed loading users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEditModal = (u) => {
    setEditUser({
      ...u,
      normalizedRole: normalizeRole(u.role),
      bio: u.bio || "",
      assigned_section: u.assigned_section || "",
      is_active: u.is_active !== false,
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!canManage || !editUser) return;
    setSaving(true);

    const basePayload = {
      full_name: editUser.full_name?.trim() || editUser.email,
      role: editUser.normalizedRole,
    };
    const extendedPayload = {
      ...basePayload,
      bio: editUser.bio?.trim() || null,
      assigned_section: editUser.assigned_section || null,
      is_active: Boolean(editUser.is_active),
    };

    try {
      let { error } = await supabase
        .from("profiles")
        .update(extendedPayload)
        .eq("id", editUser.id);
      let usedFallback = false;

      if (error && /column .* does not exist/i.test(error.message || "")) {
        usedFallback = true;
        const retry = await supabase
          .from("profiles")
          .update(basePayload)
          .eq("id", editUser.id);
        error = retry.error;
      }

      if (error) throw error;

      await logActivity({
        action: `Updated account role/details for ${editUser.full_name || editUser.email} (${editUser.normalizedRole})`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "profile",
        entityId: editUser.id,
      });

      showToast(
        "success",
        usedFallback
          ? "Role & name updated. Run SQL migration to enable contributor bio/section/active fields."
          : "Staff profile and role updated."
      );
      setEditUser(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Could not update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (targetUser) => {
    if (!canManage || !targetUser.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        targetUser.email,
        {
          redirectTo: `${window.location.origin}/admin`,
        }
      );
      if (error) throw error;

      await logActivity({
        action: `Triggered password reset email for ${targetUser.email}`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "profile",
        entityId: targetUser.id,
      });
      showToast(
        "success",
        `Password reset email sent to ${targetUser.email}.`
      );
    } catch (err) {
      showToast("error", err.message || "Failed to send reset email.");
    }
  };

  const handleToggleActive = async (u) => {
    if (!canManage) return;
    if (u.id === user?.id) {
      showToast("error", "You cannot deactivate your own active session.");
      return;
    }
    try {
      const nextState = u.is_active === false;
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: nextState })
        .eq("id", u.id);
      if (error) throw error;
      await logActivity({
        action: `${nextState ? "Activated" : "Deactivated"} account ${u.full_name || u.email}`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "profile",
        entityId: u.id,
      });
      loadData();
    } catch {
      showToast(
        "error",
        "Account activation toggle requires 001_editorial_cms_upgrade.sql."
      );
    }
  };

  const getUserArticles = (u) =>
    articles.filter(
      (a) =>
        a.author_id === u.id ||
        (a.author_name &&
          u.full_name &&
          a.author_name.toLowerCase() === u.full_name.toLowerCase())
    );

  const filteredUsers = usersList.filter((u) => {
    const nr = normalizeRole(u.role);
    if (roleFilter !== "all" && nr !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${u.full_name || ""} ${u.email || ""} ${nr}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Role-Based Access Control
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Editorial Staff &amp; User Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign newsroom roles, monitor contributor productivity, manage
            section assignments, and control account status.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-[11px] text-blue-900 max-w-md">
          <strong>Adding New Staff Accounts:</strong> Invite new members via
          Supabase Auth &rarr; Users, then assign their editorial role and
          section here.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, or role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium"
        >
          <option value="all">All Editorial Roles</option>
          {EDITORIAL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading editorial staff...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No matching staff accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-3">Editorial Role</th>
                  <th className="py-3 px-3">Assigned Desk</th>
                  <th className="py-3 px-3">Articles</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Login / Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const normRole = normalizeRole(u.role);
                  const isActive = u.is_active !== false;
                  const authored = getUserArticles(u);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <SmartImage
                              src={u.avatar_url}
                              alt={u.full_name || u.email || "Staff avatar"}
                              mode="avatar"
                              fit="cover"
                              containerClassName="w-8 h-8 rounded-full border border-slate-200 shrink-0"
                              fallbackLabel=""
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                              {(u.full_name || u.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">
                              {u.full_name || "Unnamed Member"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900">
                          <Shield className="w-3 h-3" />
                          {normRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {u.assigned_section || "General"}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {authored.length}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isActive ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {formatDate(u.last_login_at || u.created_at, {
                          short: true,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActivityUser(u)}
                            title="View Contributor Activity"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                title="Edit Role & Profile"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetPassword(u)}
                                title="Send Password Reset"
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(u)}
                                title={
                                  isActive
                                    ? "Deactivate Account"
                                    : "Activate Account"
                                }
                                className={`p-1.5 rounded-lg ${
                                  isActive
                                    ? "text-red-500 hover:bg-red-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {isActive ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <UsersIcon className="w-4 h-4 text-blue-900" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Newsroom Role Hierarchy
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {EDITORIAL_ROLES.map((r) => (
            <div
              key={r}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50"
            >
              <p className="font-bold text-blue-900">{r}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Manage Staff Account
              </h3>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUser.full_name || ""}
                  onChange={(e) =>
                    setEditUser((p) => ({ ...p, full_name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Editorial Role
                  </label>
                  <select
                    value={editUser.normalizedRole}
                    onChange={(e) =>
                      setEditUser((p) => ({
                        ...p,
                        normalizedRole: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {EDITORIAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Assigned Desk / Section
                  </label>
                  <select
                    value={editUser.assigned_section}
                    onChange={(e) =>
                      setEditUser((p) => ({
                        ...p,
                        assigned_section: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">All / General</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contributor Bio
                </label>
                <textarea
                  rows={2}
                  value={editUser.bio}
                  onChange={(e) =>
                    setEditUser((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Short editorial biography or beat description..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editUser.is_active}
                  onChange={(e) =>
                    setEditUser((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                Account Active (can access Admin Dashboard)
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contributor Activity Drawer/Modal */}
      {activityUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[82vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Contributor Activity: {activityUser.full_name || activityUser.email}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {normalizeRole(activityUser.role)} &middot;{" "}
                  {activityUser.assigned_section || "General Desk"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivityUser(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Articles Contributed ({getUserArticles(activityUser).length})
                </h4>
                {getUserArticles(activityUser).length === 0 ? (
                  <p className="text-slate-500">No articles attributed yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {getUserArticles(activityUser).map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800 truncate pr-2">
                          {a.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                          {a.status} &middot; {a.views || 0} views
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Recent Audit Actions
                </h4>
                {logs.filter((l) => l.user_id === activityUser.id).length ===
                0 ? (
                  <p className="text-slate-500">No logged actions yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {logs
                      .filter((l) => l.user_id === activityUser.id)
                      .slice(0, 10)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="p-2 rounded border border-slate-100 flex items-center justify-between gap-2"
                        >
                          <span className="text-slate-700">{l.action}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDate(l.created_at, { short: true })}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
