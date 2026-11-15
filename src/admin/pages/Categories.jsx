import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import { slugify, logActivity } from "../../utils/cmsService";
import {
  Plus,
  Edit3,
  Trash2,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const EMPTY_CATEGORY = {
  id: null,
  name: "",
  slug: "",
  description: "",
  sort_order: 0,
  is_active: true,
  assigned_editor_id: "",
  featured_image: "",
  allow_comments: true,
};

export default function Categories() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canManage = hasPermission(role, "manageCategories");

  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [articleCounts, setArticleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, profRes, artRes] = await Promise.all([
        supabase.from("categories").select("*").order("created_at", { ascending: true }),
        supabase.from("profiles").select("id, full_name, email, role"),
        supabase.from("articles").select("id, category"),
      ]);

      const rows = (catRes.data || []).sort(
        (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
      );
      setCategories(rows);
      setProfiles(profRes.data || []);

      const counts = {};
      (artRes.data || []).forEach((a) => {
        const key = a.category || "Uncategorized";
        counts[key] = (counts[key] || 0) + 1;
      });
      setArticleCounts(counts);
    } catch (err) {
      console.error("Categories load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setForm({
      ...EMPTY_CATEGORY,
      sort_order: categories.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setForm({
      id: cat.id,
      name: cat.name || "",
      slug: cat.slug || slugify(cat.name || ""),
      description: cat.description || "",
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active !== false,
      assigned_editor_id: cat.editor_id || cat.assigned_editor_id || "",
      featured_image: cat.featured_image || "",
      allow_comments: cat.allow_comments !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    if (!form.name.trim()) {
      showToast("error", "Section name is required.");
      return;
    }

    setSaving(true);
    const basePayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    const extendedPayload = {
      ...basePayload,
      slug: form.slug.trim() || slugify(form.name),
      sort_order: Number(form.sort_order) || 0,
      is_active: Boolean(form.is_active),
      editor_id: form.assigned_editor_id || null,
      featured_image: form.featured_image.trim() || null,
      allow_comments: Boolean(form.allow_comments),
    };

    try {
      const exec = async (payload) => {
        if (form.id) {
          return supabase.from("categories").update(payload).eq("id", form.id);
        }
        return supabase.from("categories").insert(payload);
      };

      let { error } = await exec(extendedPayload);
      let usedFallback = false;
      if (error && /column .* does not exist/i.test(error.message || "")) {
        usedFallback = true;
        const retry = await exec(basePayload);
        error = retry.error;
      }

      if (error) throw error;

      await logActivity({
        action: `${form.id ? "Updated" : "Created"} section "${form.name}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "category",
      });

      showToast(
        "success",
        usedFallback
          ? "Section saved (core fields). Apply SQL migration for ordering & section editors."
          : "Publication section saved."
      );
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Failed to save section.");
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index, direction) => {
    if (!canManage) return;
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const current = categories[index];
    const target = categories[swapIdx];

    try {
      const { error } = await supabase
        .from("categories")
        .update({ sort_order: target.sort_order ?? swapIdx })
        .eq("id", current.id);
      if (error) throw error;

      await supabase
        .from("categories")
        .update({ sort_order: current.sort_order ?? index })
        .eq("id", target.id);

      loadData();
    } catch {
      showToast(
        "error",
        "Ordering requires running 001_editorial_cms_upgrade.sql."
      );
    }
  };

  const handleToggleActive = async (cat) => {
    if (!canManage) return;
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !(cat.is_active !== false) })
        .eq("id", cat.id);
      if (error) throw error;
      loadData();
    } catch {
      showToast(
        "error",
        "Active status toggle requires 001_editorial_cms_upgrade.sql."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canManage) return;
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      await logActivity({
        action: `Deleted section "${deleteTarget.name}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "category",
      });
      showToast("success", "Section deleted.");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast("error", err.message || "Delete failed.");
    }
  };

  const getEditorName = (editorId) => {
    if (!editorId) return "Unassigned";
    const found = profiles.find((p) => p.id === editorId);
    return found ? found.full_name || found.email : "Assigned Staff";
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Editorial Structure
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Categories &amp; Sections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure newsroom desks, ordering, section editors, and comment
            policies.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        )}
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
          You have read-only access to publication sections. Contact an Editor-in-Chief,
          Managing Editor, or Super Admin to modify sections.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading sections...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No sections found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Section Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-3">Section Editor</th>
                  <th className="py-3 px-3">Articles</th>
                  <th className="py-3 px-3">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {categories.map((cat, idx) => {
                  const isActive = cat.is_active !== false;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-500 w-5">
                            {cat.sort_order ?? idx + 1}
                          </span>
                          {canManage && (
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorder(idx, -1)}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === categories.length - 1}
                                onClick={() => handleReorder(idx, 1)}
                                className="text-slate-400 hover:text-slate-800 disabled:opacity-20"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <FolderTree className="w-4 h-4 text-blue-900 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">
                              {cat.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              /{cat.slug || slugify(cat.name)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {getEditorName(cat.editor_id || cat.assigned_editor_id)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {articleCounts[cat.name] || 0}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => handleToggleActive(cat)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50 mr-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                {form.id ? "Edit Publication Section" : "Create Section"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        name: e.target.value,
                        slug: p.id ? p.slug : slugify(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, slug: slugify(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section Editor
                  </label>
                  <select
                    value={form.assigned_editor_id}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        assigned_editor_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Unassigned</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sort_order: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Featured Banner URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.featured_image}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, featured_image: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, is_active: e.target.checked }))
                    }
                  />
                  Active Section
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.allow_comments}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        allow_comments: e.target.checked,
                      }))
                    }
                  />
                  Allow Reader Comments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Delete Section?
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              Delete <strong>{deleteTarget.name}</strong>? Existing articles
              using this section label will keep their text category field.
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
