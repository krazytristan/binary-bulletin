import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import {
  checkTableExists,
  logActivity,
} from "../../utils/cmsService";
import SmartImage from "../../components/SmartImage";
import { ACCEPTED_IMAGE_INPUT, validateImageFile } from "../../utils/imageUtils";
import {
  User,
  Settings as SettingsIcon,
  Save,
  Upload,
  KeyRound,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from "lucide-react";

export default function Settings() {
  const {
    user,
    profile,
    role = "Staff Writer",
    refreshProfile,
  } = useOutletContext() || {};
  const canManageSettings = hasPermission(role, "manageSettings");

  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [siteTableReady, setSiteTableReady] = useState(false);
  const [toast, setToast] = useState(null);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  const [systemForm, setSystemForm] = useState({
    publication_name: "The Binary Bulletin",
    publication_tagline:
      "Official Student Publication of AMA Computer College Lipa Campus",
    publication_description: "",
    institution_name: "AMA Computer College Lipa Campus",
    logo_url: "/binary-logo.png",
    favicon_url: "/binary-logo.png",
    primary_color: "#1E3A8A",
    accent_color: "#FBBF24",
    secondary_color: "#7F1D1D",
    seo_title: "",
    seo_description: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    youtube_url: "",
    default_article_status: "draft",
    comment_moderation: "pre_moderate",
    allow_public_registration: false,
    timezone: "Asia/Manila",
    maintenance_mode: false,
    maintenance_message: "",
    privacy_policy: "",
    terms_of_use: "",
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const loadSystemSettings = useCallback(async () => {
    const exists = await checkTableExists("site_settings");
    setSiteTableReady(exists);
    if (!exists) return;

    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (data) {
      setSystemForm((prev) => ({
        ...prev,
        ...data,
      }));
    }
  }, []);

  useEffect(() => {
    loadSystemSettings();
  }, [loadSystemSettings]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingAvatar(true);
    try {
      const check = await validateImageFile(file);
      if (!check.valid) throw new Error(check.error);

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `avatar_${user.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setProfileForm((p) => ({ ...p, avatar_url: publicUrl }));
      showToast("success", "Avatar uploaded. Save profile to apply.");
    } catch (err) {
      showToast("error", err.message || "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const base = {
        full_name: profileForm.full_name.trim(),
        avatar_url: profileForm.avatar_url.trim() || null,
      };
      const ext = {
        ...base,
        bio: profileForm.bio.trim() || null,
      };

      let { error } = await supabase
        .from("profiles")
        .update(ext)
        .eq("id", user.id);

      if (error && /column .* does not exist/i.test(error.message || "")) {
        const retry = await supabase
          .from("profiles")
          .update(base)
          .eq("id", user.id);
        error = retry.error;
      }

      if (error) throw error;

      await refreshProfile?.();
      await logActivity({
        action: "Updated personal editorial profile",
        userId: user.id,
        userName: profileForm.full_name,
        userRole: role,
        entityType: "profile",
      });
      showToast("success", "Profile updated.");
    } catch (err) {
      showToast("error", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) throw error;
      showToast("success", `Password reset link sent to ${user.email}.`);
    } catch (err) {
      showToast("error", err.message || "Reset request failed.");
    }
  };

  const handleSaveSystem = async (e) => {
    e.preventDefault();
    if (!canManageSettings || !siteTableReady) return;
    setSaving(true);
    try {
      const payload = {
        ...systemForm,
        id: "default",
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("site_settings")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;

      await logActivity({
        action: "Updated publication & system settings",
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "site_settings",
      });
      showToast("success", "Publication & system settings saved.");
    } catch (err) {
      showToast("error", err.message || "Failed saving system settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    if (!canManageSettings) return;
    setExportingBackup(true);
    try {
      const [articles, announcements, events, gallery, videos, categories, profiles] =
        await Promise.all([
          supabase.from("articles").select("*"),
          supabase.from("announcements").select("*"),
          supabase.from("events").select("*"),
          supabase.from("gallery").select("*"),
          supabase.from("videos").select("*"),
          supabase.from("categories").select("*"),
          supabase.from("profiles").select("*"),
        ]);

      const snapshot = {
        exportedAt: new Date().toISOString(),
        exportedBy: profile?.email || user?.email,
        tables: {
          articles: articles.data || [],
          announcements: announcements.data || [],
          events: events.data || [],
          gallery: gallery.data || [],
          videos: videos.data || [],
          categories: categories.data || [],
          profiles: profiles.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `binary-bulletin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logActivity({
        action: "Downloaded full publication JSON backup",
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
      });
      showToast("success", "Database JSON backup downloaded.");
    } catch (err) {
      showToast("error", err.message || "Backup export failed.");
    } finally {
      setExportingBackup(false);
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
          Account &amp; Newsroom Configuration
        </p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Settings &amp; System Preferences
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            tab === "profile"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          My Profile &amp; Security
        </button>

        {canManageSettings && (
          <button
            type="button"
            onClick={() => setTab("system")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === "system"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            Publication &amp; System Settings
          </button>
        )}
      </div>

      {tab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5 text-xs"
        >
          <div className="flex items-center gap-4">
            {profileForm.avatar_url ? (
              <SmartImage
                src={profileForm.avatar_url}
                alt={profileForm.full_name || "Avatar"}
                mode="avatar"
                fit="cover"
                containerClassName="w-16 h-16 rounded-full border border-slate-200 shrink-0"
                fallbackLabel=""
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-900 font-black text-xl flex items-center justify-center shrink-0">
                {(profileForm.full_name || user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingAvatar ? "Uploading..." : "Change Profile Photo"}
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_INPUT}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500">
                Role:{" "}
                <strong className="text-blue-900 inline-flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {role}
                </strong>{" "}
                &middot; {user?.email}
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Display / Byline Name
            </label>
            <input
              type="text"
              required
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, full_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Editorial Biography
            </label>
            <textarea
              rows={3}
              value={profileForm.bio}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="Your journalism beat, college department, and editorial role..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Send Password Reset Email
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {tab === "system" && canManageSettings && (
        <div className="space-y-6 max-w-4xl">
          {!siteTableReady && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">
                  Run SQL Migration for Persistent System Settings
                </p>
                <p>
                  Execute{" "}
                  <code>client/supabase/migrations/001_editorial_cms_upgrade.sql</code>{" "}
                  to store system settings in <code>site_settings</code>. Backup
                  export below already works immediately.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveSystem} className="space-y-5 text-xs">
            {/* Publication Identity & Branding */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Publication Identity &amp; Branding
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Publication Name
                  </label>
                  <input
                    type="text"
                    value={systemForm.publication_name}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        publication_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    value={systemForm.institution_name}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        institution_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={systemForm.publication_tagline}
                  onChange={(e) =>
                    setSystemForm((p) => ({
                      ...p,
                      publication_tagline: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="text"
                    value={systemForm.primary_color}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        primary_color: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Accent Color
                  </label>
                  <input
                    type="text"
                    value={systemForm.accent_color}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        accent_color: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={systemForm.timezone}
                    onChange={(e) =>
                      setSystemForm((p) => ({ ...p, timezone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Workflow, Comments & SEO Policies */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Editorial Policy, Moderation &amp; SEO
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Default New Article Status
                  </label>
                  <select
                    value={systemForm.default_article_status}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        default_article_status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Submitted for Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Comment Moderation Policy
                  </label>
                  <select
                    value={systemForm.comment_moderation}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        comment_moderation: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="pre_moderate">
                      Pre-moderate (Require Approval)
                    </option>
                    <option value="auto_approve">
                      Auto-approve (Post-moderate)
                    </option>
                    <option value="disabled">Disable Reader Comments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Site SEO Title
                </label>
                <input
                  type="text"
                  value={systemForm.seo_title || ""}
                  onChange={(e) =>
                    setSystemForm((p) => ({ ...p, seo_title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Site SEO Description
                </label>
                <textarea
                  rows={2}
                  value={systemForm.seo_description || ""}
                  onChange={(e) =>
                    setSystemForm((p) => ({
                      ...p,
                      seo_description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(systemForm.allow_public_registration)}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        allow_public_registration: e.target.checked,
                      }))
                    }
                  />
                  Allow Contributor Self-Registration
                </label>

                <label className="flex items-center gap-2 font-semibold text-red-700">
                  <input
                    type="checkbox"
                    checked={Boolean(systemForm.maintenance_mode)}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        maintenance_mode: e.target.checked,
                      }))
                    }
                  />
                  Enable Public Maintenance Banner
                </label>
              </div>

              {systemForm.maintenance_mode && (
                <input
                  type="text"
                  value={systemForm.maintenance_message || ""}
                  onChange={(e) =>
                    setSystemForm((p) => ({
                      ...p,
                      maintenance_message: e.target.value,
                    }))
                  }
                  placeholder="Maintenance message shown to public visitors..."
                  className="w-full px-3 py-2 border border-red-200 rounded-lg bg-red-50"
                />
              )}
            </div>

            {/* Legal & Backup */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Governance &amp; Database Backup
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Privacy Policy Summary
                  </label>
                  <textarea
                    rows={3}
                    value={systemForm.privacy_policy || ""}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        privacy_policy: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Terms of Publication Use
                  </label>
                  <textarea
                    rows={3}
                    value={systemForm.terms_of_use || ""}
                    onChange={(e) =>
                      setSystemForm((p) => ({
                        ...p,
                        terms_of_use: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={exportingBackup}
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 hover:bg-slate-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingBackup
                    ? "Exporting Snapshot..."
                    : "Export Full Publication Backup (JSON)"}
                </button>

                <button
                  type="submit"
                  disabled={saving || !siteTableReady}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save System Settings"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
