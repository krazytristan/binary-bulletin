import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import { checkTableExists, logActivity } from "../../utils/cmsService";
import {
  LayoutTemplate,
  Flame,
  Eye,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Star,
} from "lucide-react";

const DEFAULT_CONFIG = {
  showEditorial: true,
  showVoices: true,
  showBulletins: true,
  showEvents: true,
  showVideos: true,
  showArchives: true,
  showNewsletter: true,
  aboutMission:
    "The Binary Bulletin is the official student publication of AMA Computer College Lipa Campus, upholding ethical, student-centered, and accurate campus journalism.",
  editorialBoard: [],
  announcementBanner: "",
};

export default function HomepageCMS() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canManage = hasPermission(role, "manageHomepage");

  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [articles, setArticles] = useState([]);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    breaking_news_enabled: false,
    breaking_news_text: "",
    breaking_news_link: "",
    featured_article_id: "",
    contact_email: "binarybulletin@ama.edu.ph",
    contact_address: "AMA Computer College Lipa Campus, Lipa City, Batangas",
    facebook_url: "https://web.facebook.com/profile.php?id=61581010768762",
    twitter_url: "",
    instagram_url: "",
    youtube_url: "",
    publication_description: "",
    homepage_config: DEFAULT_CONFIG,
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [exists, artRes] = await Promise.all([
        checkTableExists("site_settings"),
        supabase
          .from("articles")
          .select("id, title, category, author_name, image_url, status")
          .order("created_at", { ascending: false }),
      ]);

      setTableReady(exists);
      setArticles(artRes.data || []);

      if (exists) {
        const { data } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (data) {
          setForm({
            breaking_news_enabled: Boolean(data.breaking_news_enabled),
            breaking_news_text: data.breaking_news_text || "",
            breaking_news_link: data.breaking_news_link || "",
            featured_article_id: data.featured_article_id || "",
            contact_email: data.contact_email || "binarybulletin@ama.edu.ph",
            contact_address: data.contact_address || "Lipa City, Batangas",
            facebook_url: data.facebook_url || "",
            twitter_url: data.twitter_url || "",
            instagram_url: data.instagram_url || "",
            youtube_url: data.youtube_url || "",
            publication_description: data.publication_description || "",
            homepage_config: {
              ...DEFAULT_CONFIG,
              ...(data.homepage_config || {}),
            },
          });
        }
      }
    } catch (err) {
      console.error("Homepage CMS load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateCfg = (key, val) => {
    setForm((prev) => ({
      ...prev,
      homepage_config: { ...prev.homepage_config, [key]: val },
    }));
  };

  const addBoardMember = () => {
    const current = Array.isArray(form.homepage_config.editorialBoard)
      ? form.homepage_config.editorialBoard
      : [];
    updateCfg("editorialBoard", [
      ...current,
      { name: "", position: "Editorial Staff" },
    ]);
  };

  const updateBoardMember = (idx, field, val) => {
    const next = [...(form.homepage_config.editorialBoard || [])];
    next[idx] = { ...next[idx], [field]: val };
    updateCfg("editorialBoard", next);
  };

  const removeBoardMember = (idx) => {
    const next = [...(form.homepage_config.editorialBoard || [])];
    next.splice(idx, 1);
    updateCfg("editorialBoard", next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage || !tableReady) return;
    setSaving(true);
    try {
      const payload = {
        id: "default",
        breaking_news_enabled: form.breaking_news_enabled,
        breaking_news_text: form.breaking_news_text.trim(),
        breaking_news_link: form.breaking_news_link.trim(),
        featured_article_id: form.featured_article_id || null,
        contact_email: form.contact_email.trim(),
        contact_address: form.contact_address.trim(),
        facebook_url: form.facebook_url.trim(),
        twitter_url: form.twitter_url.trim(),
        instagram_url: form.instagram_url.trim(),
        youtube_url: form.youtube_url.trim(),
        publication_description: form.publication_description.trim(),
        homepage_config: form.homepage_config,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("site_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      await logActivity({
        action: "Updated Homepage & Public Website CMS settings",
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "site_settings",
      });
      showToast("success", "Homepage & public website content published.");
    } catch (err) {
      showToast("error", err.message || "Failed to save homepage content.");
    } finally {
      setSaving(false);
    }
  };

  const selectedFeatured = articles.find(
    (a) => String(a.id) === String(form.featured_article_id)
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Front Page &amp; Masthead Controls
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Homepage &amp; Website CMS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control breaking news tickers, lead hero stories, visible homepage
            sections, About Us, editorial board roster, and footer links.
          </p>
        </div>

        {canManage && tableReady && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? "Publishing Changes..." : "Publish Homepage Changes"}
          </button>
        )}
      </div>

      {!loading && !tableReady && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm mb-1">
              <code>site_settings</code> Table Required
            </p>
            <p>
              Execute{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                client/supabase/migrations/001_editorial_cms_upgrade.sql
              </code>{" "}
              in your Supabase SQL Editor to store and publish live homepage
              configuration changes.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Editor Controls */}
        <form onSubmit={handleSave} className="xl:col-span-2 space-y-5 text-xs">
          {/* Breaking News Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Breaking News Ticker
                </h2>
              </div>
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManage}
                  checked={form.breaking_news_enabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      breaking_news_enabled: e.target.checked,
                    }))
                  }
                />
                Show Breaking Banner
              </label>
            </div>

            <input
              type="text"
              disabled={!canManage}
              value={form.breaking_news_text}
              onChange={(e) =>
                setForm((p) => ({ ...p, breaking_news_text: e.target.value }))
              }
              placeholder="Breaking bulletin headline text..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              disabled={!canManage}
              value={form.breaking_news_link}
              onChange={(e) =>
                setForm((p) => ({ ...p, breaking_news_link: e.target.value }))
              }
              placeholder="Optional URL or /article/<id>"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Lead Story & Homepage Sections */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Lead Hero Story &amp; Sections
              </h2>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pin Main Headline / Lead Story
              </label>
              <select
                disabled={!canManage}
                value={form.featured_article_id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    featured_article_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">
                  Automatic (Latest Featured or Published Story)
                </option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.status || "published"}] {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Visible Homepage Sections
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  ["showEditorial", "Editorial Desk"],
                  ["showVoices", "Campus Voices"],
                  ["showBulletins", "Advisories Banner"],
                  ["showEvents", "Campus Calendar"],
                  ["showVideos", "The Binar Broadcast"],
                  ["showArchives", "Photojournalism Archives"],
                  ["showNewsletter", "Newsletter Strip"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      disabled={!canManage}
                      checked={form.homepage_config[key] !== false}
                      onChange={(e) => updateCfg(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Publication Top Announcement Strip (Optional)
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={form.homepage_config.announcementBanner || ""}
                onChange={(e) =>
                  updateCfg("announcementBanner", e.target.value)
                }
                placeholder="e.g., Call for student contributors open for 2nd Semester..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* About Us & Editorial Board */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-blue-900" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  About Us &amp; Editorial Board
                </h2>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={addBoardMember}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-900 font-bold hover:bg-blue-100"
                >
                  <Plus className="w-3 h-3" /> Add Member
                </button>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                About / Mission Statement
              </label>
              <textarea
                rows={3}
                disabled={!canManage}
                value={form.homepage_config.aboutMission || ""}
                onChange={(e) => updateCfg("aboutMission", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              {(form.homepage_config.editorialBoard || []).map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={m.name}
                    onChange={(e) =>
                      updateBoardMember(idx, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Editor-in-Chief)"
                    value={m.position}
                    onChange={(e) =>
                      updateBoardMember(idx, "position", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => removeBoardMember(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Contact & Social Links */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Footer, Contact &amp; Social Media Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Editorial Contact Email
                </label>
                <input
                  type="email"
                  disabled={!canManage}
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contact_email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Campus Office Address
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={form.contact_address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contact_address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  disabled={!canManage}
                  value={form.facebook_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, facebook_url: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  disabled={!canManage}
                  value={form.youtube_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, youtube_url: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Live Front-Page Preview Pane */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit sticky top-20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-900">
              <Eye className="w-4 h-4" /> Live Front-Page Preview
            </span>
          </div>

          <div className="bg-[#FCFBF9] border border-slate-200 rounded-xl overflow-hidden text-xs">
            {form.breaking_news_enabled && form.breaking_news_text && (
              <div className="bg-red-700 text-white px-3 py-2 font-bold text-[11px] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  BREAKING: {form.breaking_news_text}
                </span>
              </div>
            )}

            {form.homepage_config.announcementBanner && (
              <div className="bg-amber-100 text-amber-950 px-3 py-1.5 text-[10px] font-semibold">
                {form.homepage_config.announcementBanner}
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-serif font-black text-base text-slate-900">
                  The Binary Bulletin
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                  AMA Computer College Lipa Campus
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold uppercase text-blue-900">
                  Featured Lead Story
                </span>
                <p className="font-serif font-bold text-sm text-slate-900 mt-0.5">
                  {selectedFeatured
                    ? selectedFeatured.title
                    : "Automatic: Latest Published Featured Story"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Active Homepage Blocks
                </p>
                <div className="flex flex-wrap gap-1">
                  {[
                    ["showEditorial", "Editorial"],
                    ["showVoices", "Voices"],
                    ["showBulletins", "Advisories"],
                    ["showEvents", "Events"],
                    ["showVideos", "The Binar"],
                    ["showArchives", "Gallery"],
                  ]
                    .filter(([k]) => form.homepage_config[k] !== false)
                    .map(([, label]) => (
                      <span
                        key={label}
                        className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded text-[10px] font-bold"
                      >
                        {label}
                      </span>
                    ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <p className="font-semibold text-slate-700">Footer Preview</p>
                <p className="truncate">{form.contact_email}</p>
                <p className="truncate">{form.contact_address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
