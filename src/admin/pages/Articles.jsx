import React, { useEffect, useState, useCallback, useRef } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  formatDate,
  parseArticleBlocks,
  estimateReadingTime,
} from "../../utils/editorial";
import {
  ARTICLE_STATUSES,
  getStatusMeta,
  hasPermission,
} from "../../utils/rbac";
import {
  slugify,
  logActivity,
  createNotification,
  checkTableExists,
  optimizeImageFile,
} from "../../utils/cmsService";
import RichTextEditor from "../../components/RichTextEditor";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Archive,
  RotateCcw,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarClock,
  AlertTriangle,
  X,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  History,
  GitBranch,
  Flame,
  Star,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
} from "lucide-react";

const FALLBACK_CATEGORIES = [
  "Campus News",
  "News",
  "Features",
  "Editorial",
  "Opinion",
  "Sports",
  "Events",
  "Announcements",
  "Photojournalism",
  "Special Reports",
];

const EMPTY_FORM = {
  id: null,
  title: "",
  subheadline: "",
  slug: "",
  category: "Campus News",
  category_id: null,
  excerpt: "",
  content: "",
  tags_text: "",
  author_name: "",
  author_id: null,
  assigned_editor_id: "",
  assigned_editor_name: "",
  image_url: "",
  image_caption: "",
  image_credit: "",
  status: "draft",
  is_featured: false,
  is_breaking: false,
  published_at: "",
  scheduled_at: "",
  seo_title: "",
  seo_description: "",
};

const AUTOSAVE_KEY = "binary_bulletin_article_autosave_v1";

export default function Articles() {
  const outlet = useOutletContext() || {};
  const { user, profile, role = "Staff Writer" } = outlet;
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendedReady, setExtendedReady] = useState({
    revisions: false,
    comments: false,
    approvals: false,
  });

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState("content"); // content | comments | revisions | approvals
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [autosaveBanner, setAutosaveBanner] = useState(null);

  // Preview, Media Picker, Delete Confirmation, Workflow Note
  const [previewArticle, setPreviewArticle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const mediaCallbackRef = useRef(null);

  // Sub-tabs data for currently open article
  const [editorialComments, setEditorialComments] = useState([]);
  const [newEditorialComment, setNewEditorialComment] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [workflowNote, setWorkflowNote] = useState("");

  const showToast = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [artRes, catRes, profRes, medRes, hasRev, hasComm, hasApp] =
        await Promise.all([
          supabase
            .from("articles")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("*").order("name"),
          supabase.from("profiles").select("*").order("full_name"),
          supabase
            .from("media")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(40),
          checkTableExists("article_revisions"),
          checkTableExists("editorial_comments"),
          checkTableExists("approval_history"),
        ]);

      setArticles(artRes.data || []);
      setCategories(catRes.data || []);
      setProfiles(profRes.data || []);
      setMediaItems(medRes.data || []);
      setExtendedReady({
        revisions: hasRev,
        comments: hasComm,
        approvals: hasApp,
      });
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      showToast("error", "Failed to load articles from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Open new or edit modal based on URL params
  useEffect(() => {
    const action = searchParams.get("action");
    const editId = searchParams.get("edit");
    if (action === "new" && !loading) {
      openNewArticle();
      setSearchParams({}, { replace: true });
    } else if (editId && !loading && articles.length > 0) {
      const found = articles.find((a) => String(a.id) === String(editId));
      if (found) {
        openEditArticle(found);
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, articles]);

  // Autosave draft to localStorage while modal is open
  useEffect(() => {
    if (!editorOpen) return;
    const timer = setInterval(() => {
      if (form.title.trim() || form.content.trim()) {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            savedAt: new Date().toISOString(),
            articleId: form.id,
            data: form,
          })
        );
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [editorOpen, form]);

  const loadArticleSubRecords = async (articleId) => {
    if (!articleId) {
      setEditorialComments([]);
      setRevisions([]);
      setApprovals([]);
      return;
    }

    const promises = [];
    if (extendedReady.comments) {
      promises.push(
        supabase
          .from("editorial_comments")
          .select("*")
          .eq("article_id", articleId)
          .order("created_at", { ascending: true })
          .then((r) => setEditorialComments(r.data || []))
      );
    } else {
      setEditorialComments([]);
    }

    if (extendedReady.revisions) {
      promises.push(
        supabase
          .from("article_revisions")
          .select("*")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false })
          .then((r) => setRevisions(r.data || []))
      );
    } else {
      setRevisions([]);
    }

    if (extendedReady.approvals) {
      promises.push(
        supabase
          .from("approval_history")
          .select("*")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false })
          .then((r) => setApprovals(r.data || []))
      );
    } else {
      setApprovals([]);
    }

    await Promise.all(promises);
  };

  const openNewArticle = () => {
    setForm({
      ...EMPTY_FORM,
      author_name: profile?.full_name || "Editorial Staff",
      author_id: user?.id || null,
    });
    setSlugLocked(false);
    setEditorTab("content");
    setWorkflowNote("");
    setEditorialComments([]);
    setRevisions([]);
    setApprovals([]);

    // Check autosave
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.articleId && parsed.data?.title) {
          setAutosaveBanner(parsed);
        } else {
          setAutosaveBanner(null);
        }
      }
    } catch {
      setAutosaveBanner(null);
    }

    setEditorOpen(true);
  };

  const openEditArticle = (art) => {
    const tagsArr = Array.isArray(art.tags) ? art.tags : [];
    setForm({
      id: art.id,
      title: art.title || "",
      subheadline: art.subheadline || "",
      slug: art.slug || slugify(art.title || ""),
      category: art.category || "Campus News",
      category_id: art.category_id || null,
      excerpt: art.excerpt || "",
      content: art.content || "",
      tags_text: tagsArr.join(", "),
      author_name: art.author_name || profile?.full_name || "",
      author_id: art.author_id || null,
      assigned_editor_id: art.editor_id || art.assigned_editor_id || "",
      assigned_editor_name: art.editor_name || art.assigned_editor_name || "",
      image_url: art.image_url || "",
      image_caption: art.image_caption || "",
      image_credit: art.image_credit || "",
      status: art.status || "draft",
      is_featured: Boolean(art.is_featured),
      is_breaking: Boolean(art.is_breaking),
      published_at: art.published_at
        ? new Date(art.published_at).toISOString().slice(0, 16)
        : "",
      scheduled_at: art.scheduled_at
        ? new Date(art.scheduled_at).toISOString().slice(0, 16)
        : "",
      seo_title: art.seo_title || "",
      seo_description: art.seo_description || "",
    });
    setSlugLocked(true);
    setEditorTab("content");
    setWorkflowNote("");
    setAutosaveBanner(null);
    setEditorOpen(true);
    loadArticleSubRecords(art.id);
  };

  const handleFieldChange = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "title" && !slugLocked) {
        next.slug = slugify(val);
      }
      if (key === "category") {
        const matchedCat = categories.find((c) => c.name === val);
        next.category_id = matchedCat ? matchedCat.id : null;
      }
      if (key === "assigned_editor_id") {
        const matchedProf = profiles.find((p) => p.id === val);
        next.assigned_editor_name = matchedProf ? matchedProf.full_name : "";
      }
      return next;
    });
  };

  const handleUploadCoverImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const optimized = await optimizeImageFile(file, 1600, 0.85);
      const ext = optimized.name.split(".").pop() || "jpg";
      const fileName = `article_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("articles")
        .upload(fileName, optimized);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("articles").getPublicUrl(fileName);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));

      // Also register in media table
      await supabase.from("media").insert({
        file_name: file.name,
        file_url: publicUrl,
        uploaded_by: user?.id || null,
      });

      showToast("success", "Featured image uploaded and optimized.");
    } catch (err) {
      console.error("Upload failed:", err);
      showToast("error", err.message || "Image upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const openMediaPickerForCover = () => {
    mediaCallbackRef.current = (url, caption) => {
      setForm((prev) => ({
        ...prev,
        image_url: url,
        image_caption: prev.image_caption || caption || "",
      }));
      setMediaPickerOpen(false);
    };
    setMediaPickerOpen(true);
  };

  const openMediaPickerForEditor = (insertCb) => {
    mediaCallbackRef.current = (url, caption) => {
      insertCb(url, caption);
      setMediaPickerOpen(false);
    };
    setMediaPickerOpen(true);
  };

  const saveRevisionSnapshot = async (articleId, payload, summary) => {
    if (!extendedReady.revisions || !articleId) return;
    await supabase.from("article_revisions").insert({
      article_id: articleId,
      title: payload.title,
      subheadline: payload.subheadline || null,
      excerpt: payload.excerpt || null,
      content: payload.content,
      status: payload.status,
      edited_by: user?.id || null,
      edited_by_name: profile?.full_name || "Editorial Staff",
      revision_note: summary || "Updated article draft",
    });
  };

  const recordApprovalAction = async (
    articleId,
    fromStatus,
    toStatus,
    notes
  ) => {
    if (!extendedReady.approvals || !articleId) return;
    await supabase.from("approval_history").insert({
      article_id: articleId,
      from_status: fromStatus || null,
      to_status: toStatus,
      actor_id: user?.id || null,
      actor_name: profile?.full_name || "Editorial Staff",
      actor_role: role,
      note: notes || null,
    });
  };

  const persistArticle = async (targetStatus, note = "") => {
    if (!form.title.trim()) {
      showToast("error", "Article headline is required.");
      return;
    }
    if (!form.content.trim()) {
      showToast("error", "Article body content cannot be empty.");
      return;
    }

    if (targetStatus === "scheduled" && !form.scheduled_at) {
      showToast(
        "error",
        "Please select a scheduled publication date and time."
      );
      return;
    }

    // RBAC check
    if (
      targetStatus === "published" &&
      !hasPermission(role, "publishArticles")
    ) {
      showToast("error", "Your role cannot publish articles directly.");
      return;
    }
    if (
      targetStatus === "approved" &&
      !hasPermission(role, "approveArticles")
    ) {
      showToast("error", "Your role cannot approve articles.");
      return;
    }

    setSaving(true);
    const previousStatus = form.status;
    const finalStatus = targetStatus || form.status || "draft";
    const parsedTags = form.tags_text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const basePayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      category: form.category,
      category_id: form.category_id || null,
      excerpt: form.excerpt.trim(),
      content: form.content,
      image_url: form.image_url.trim() || null,
      author_name: form.author_name.trim() || profile?.full_name || "Staff Writer",
      author_id: form.author_id || user?.id || null,
      status: finalStatus,
      updated_at: new Date().toISOString(),
    };

    const extendedPayload = {
      ...basePayload,
      subheadline: form.subheadline.trim() || null,
      image_caption: form.image_caption.trim() || null,
      image_credit: form.image_credit.trim() || null,
      editor_id: form.assigned_editor_id || null,
      editor_name: form.assigned_editor_name || null,
      is_featured: Boolean(form.is_featured),
      is_breaking: Boolean(form.is_breaking),
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      tags: parsedTags,
      published_at:
        finalStatus === "published"
          ? form.published_at
            ? new Date(form.published_at).toISOString()
            : new Date().toISOString()
          : form.published_at
            ? new Date(form.published_at).toISOString()
            : null,
      scheduled_at:
        finalStatus === "scheduled" && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      archived_at:
        finalStatus === "archived" ? new Date().toISOString() : undefined,
      approved_by:
        finalStatus === "approved" || finalStatus === "published"
          ? user?.id || null
          : undefined,
      published_by:
        finalStatus === "published" ? user?.id || null : undefined,
    };

    try {
      let savedRecord = null;
      let usedFallback = false;

      const executeSave = async (payload) => {
        if (form.id) {
          return supabase
            .from("articles")
            .update(payload)
            .eq("id", form.id)
            .select()
            .single();
        }
        return supabase.from("articles").insert(payload).select().single();
      };

      let { data, error } = await executeSave(extendedPayload);
      if (error && /column .* does not exist/i.test(error.message || "")) {
        // Fallback to baseline schema if extended migration hasn't been executed
        usedFallback = true;
        const retry = await executeSave(basePayload);
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      savedRecord = data;

      localStorage.removeItem(AUTOSAVE_KEY);

      await saveRevisionSnapshot(
        savedRecord.id,
        extendedPayload,
        note || `Status: ${finalStatus}`
      );

      if (previousStatus !== finalStatus || !form.id) {
        await recordApprovalAction(
          savedRecord.id,
          form.id ? previousStatus : null,
          finalStatus,
          note
        );

        await createNotification({
          title: `Article ${getStatusMeta(finalStatus).label}`,
          message: `"${savedRecord.title}" moved to ${getStatusMeta(finalStatus).label} by ${profile?.full_name || "Editorial Staff"}.`,
          notificationType: "editorial",
          entityType: "article",
          entityId: savedRecord.id,
          link: `/admin-panel/articles?edit=${savedRecord.id}`,
        });
      }

      await logActivity({
        action: `${form.id ? "Updated" : "Created"} article "${savedRecord.title}" (${getStatusMeta(finalStatus).label})`,
        userId: user?.id,
        userName: profile?.full_name || "Editorial Staff",
        userRole: role,
        entityType: "article",
        entityId: savedRecord.id,
        details: { status: finalStatus, note },
      });

      showToast(
        "success",
        usedFallback
          ? `Article saved (${getStatusMeta(finalStatus).label}). Run SQL migration to enable extended SEO/caption fields.`
          : `Article saved as ${getStatusMeta(finalStatus).label}.`
      );
      setEditorOpen(false);
      await fetchAllData();
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", err.message || "Unable to save article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (art) => {
    if (!hasPermission(role, "createArticle")) return;
    try {
      const payload = {
        title: `${art.title} (Copy)`,
        slug: `${slugify(art.title)}-copy-${Date.now().toString().slice(-4)}`,
        category: art.category || "Campus News",
        category_id: art.category_id || null,
        excerpt: art.excerpt || "",
        content: art.content || "",
        image_url: art.image_url || null,
        author_name: profile?.full_name || art.author_name || "Staff Writer",
        author_id: user?.id || art.author_id || null,
        status: "draft",
      };
      const { error } = await supabase.from("articles").insert(payload);
      if (error) throw error;
      await logActivity({
        action: `Duplicated article "${art.title}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "article",
        entityId: art.id,
      });
      showToast("success", "Article duplicated as a new draft.");
      fetchAllData();
    } catch (err) {
      showToast("error", err.message || "Duplicate failed.");
    }
  };

  const handleQuickStatus = async (art, nextStatus) => {
    if (
      nextStatus === "published" &&
      !hasPermission(role, "publishArticles")
    ) {
      showToast("error", "Insufficient permission to publish.");
      return;
    }
    try {
      const { error } = await supabase
        .from("articles")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", art.id);
      if (error) throw error;

      await recordApprovalAction(art.id, art.status, nextStatus, "Quick status update");
      await logActivity({
        action: `Changed "${art.title}" to ${getStatusMeta(nextStatus).label}`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "article",
        entityId: art.id,
      });
      showToast("success", `Article marked as ${getStatusMeta(nextStatus).label}.`);
      fetchAllData();
    } catch (err) {
      showToast("error", err.message || "Status update failed.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !hasPermission(role, "deleteArticles")) return;
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      await logActivity({
        action: `Permanently deleted article "${deleteTarget.title}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "article",
        entityId: deleteTarget.id,
      });
      showToast("success", "Article deleted.");
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      showToast("error", err.message || "Delete failed.");
    }
  };

  const handleAddEditorialComment = async () => {
    if (!newEditorialComment.trim() || !form.id) return;
    if (!extendedReady.comments) {
      showToast(
        "error",
        "Run 001_editorial_cms_upgrade.sql to store internal editorial comments."
      );
      return;
    }
    try {
      const { data, error } = await supabase
        .from("editorial_comments")
        .insert({
          article_id: form.id,
          author_id: user?.id || null,
          author_name: profile?.full_name || "Editorial Staff",
          author_role: role,
          comment_type:
            hasPermission(role, "reviewArticles")
              ? "review_note"
              : "writer_response",
          comment: newEditorialComment.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      setEditorialComments((prev) => [...prev, data]);
      setNewEditorialComment("");
      await logActivity({
        action: `Added editorial note on "${form.title}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "article",
        entityId: form.id,
      });
    } catch (err) {
      showToast("error", err.message || "Could not post note.");
    }
  };

  const handleRestoreRevision = (rev) => {
    setForm((prev) => ({
      ...prev,
      title: rev.title || prev.title,
      subheadline: rev.subheadline || "",
      excerpt: rev.excerpt || "",
      content: rev.content || prev.content,
    }));
    setEditorTab("content");
    showToast(
      "success",
      `Loaded revision #${rev.revision_number} into editor. Click Save to apply.`
    );
  };

  // Filtered articles
  const filteredArticles = articles.filter((art) => {
    const st = art.status || "published";
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (categoryFilter !== "all" && art.category !== categoryFilter)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${art.title || ""} ${art.author_name || ""} ${art.category || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const paginatedArticles = filteredArticles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const categoryChoices =
    categories.length > 0
      ? categories.map((c) => c.name)
      : FALLBACK_CATEGORIES;

  const canReview = hasPermission(role, "reviewArticles");
  const canApprove = hasPermission(role, "approveArticles");
  const canPublish = hasPermission(role, "publishArticles");
  const canDelete = hasPermission(role, "deleteArticles");
  const canEditAll = hasPermission(role, "editAllArticles");

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedbackMsg.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Content Management System
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Articles &amp; Editorial Workflow
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage drafts, peer reviews, editorial approvals, scheduled releases,
            and published stories.
          </p>
        </div>

        {hasPermission(role, "createArticle") && (
          <button
            type="button"
            onClick={openNewArticle}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            statusFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All ({articles.length})
        </button>
        {ARTICLE_STATUSES.map((st) => {
          const count = articles.filter(
            (a) => (a.status || "published") === st.value
          ).length;
          return (
            <button
              key={st.value}
              type="button"
              onClick={() => {
                setStatusFilter(st.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st.value
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by headline, author, or section..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-blue-600"
        >
          <option value="all">All Sections</option>
          {categoryChoices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading newsroom articles...
          </div>
        ) : paginatedArticles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No articles match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Views</th>
                  <th className="py-3 px-3">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedArticles.map((art) => {
                  const st = getStatusMeta(art.status || "published");
                  const isOwn =
                    art.author_id && user?.id && art.author_id === user.id;
                  const canEditThis = canEditAll || isOwn;
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-center gap-3">
                          {art.image_url ? (
                            <img
                              src={art.image_url}
                              alt=""
                              className="w-12 h-9 object-cover rounded border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {art.is_breaking && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                  <Flame className="w-2.5 h-2.5" /> Breaking
                                </span>
                              )}
                              {art.is_featured && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  <Star className="w-2.5 h-2.5" /> Featured
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-slate-900 truncate">
                              {art.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              /{art.slug || art.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {art.category || "News"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {art.author_name || "Staff Writer"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.badge}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {(Number(art.views) || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(art.updated_at || art.created_at, {
                          short: true,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewArticle(art)}
                            title="Preview"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEditThis && (
                            <button
                              type="button"
                              onClick={() => openEditArticle(art)}
                              title="Edit & Workflow"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canPublish && art.status !== "published" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(art, "published")}
                              title="Publish Now"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canPublish && art.status === "published" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(art, "draft")}
                              title="Unpublish to Draft"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDuplicate(art)}
                            title="Duplicate"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {canEditAll && art.status !== "archived" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(art, "archived")}
                              title="Archive"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(art)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredArticles.length)} of{" "}
              {filteredArticles.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Article Editor & Workflow Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  {form.id ? "Edit Article" : "New Article"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    getStatusMeta(form.status).badge
                  }`}
                >
                  {getStatusMeta(form.status).label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewArticle({
                      ...form,
                      created_at: new Date().toISOString(),
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Autosave Restore Prompt */}
            {autosaveBanner && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                <span>
                  Unsaved local draft found from{" "}
                  {new Date(autosaveBanner.savedAt).toLocaleTimeString()}. Restore
                  it?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(autosaveBanner.data);
                      setAutosaveBanner(null);
                    }}
                    className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold"
                  >
                    Restore Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(AUTOSAVE_KEY);
                      setAutosaveBanner(null);
                    }}
                    className="px-2.5 py-1 text-amber-800 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Tabs */}
            <div className="px-5 border-b border-slate-200 flex items-center gap-4 bg-white">
              {[
                { id: "content", label: "Content & Metadata", icon: Edit3 },
                {
                  id: "comments",
                  label: `Editorial Notes (${editorialComments.length})`,
                  icon: MessageSquare,
                  disabled: !form.id,
                },
                {
                  id: "revisions",
                  label: `Revisions (${revisions.length})`,
                  icon: History,
                  disabled: !form.id,
                },
                {
                  id: "approvals",
                  label: `Approval Log (${approvals.length})`,
                  icon: GitBranch,
                  disabled: !form.id,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={tab.disabled}
                    onClick={() => setEditorTab(tab.id)}
                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition disabled:opacity-40 ${
                      editorTab === tab.id
                        ? "border-blue-900 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {editorTab === "content" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Writing Column */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Headline *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          handleFieldChange("title", e.target.value)
                        }
                        placeholder="Enter concise, active-voice headline..."
                        className="w-full px-3.5 py-2.5 text-base font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Subheadline / Deck
                      </label>
                      <input
                        type="text"
                        value={form.subheadline}
                        onChange={(e) =>
                          handleFieldChange("subheadline", e.target.value)
                        }
                        placeholder="Secondary summary sentence supporting the headline..."
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          URL Slug
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => {
                              setSlugLocked(true);
                              handleFieldChange("slug", slugify(e.target.value));
                            }}
                            className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Lead / Excerpt
                        </label>
                        <input
                          type="text"
                          value={form.excerpt}
                          onChange={(e) =>
                            handleFieldChange("excerpt", e.target.value)
                          }
                          placeholder="1-2 sentence summary shown on article cards"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Article Body *
                      </label>
                      <RichTextEditor
                        value={form.content}
                        onChange={(val) => handleFieldChange("content", val)}
                        onOpenMediaPicker={openMediaPickerForEditor}
                        rows={15}
                      />
                    </div>
                  </div>

                  {/* Metadata & Workflow Sidebar */}
                  <div className="space-y-4">
                    {/* Section & Assignment */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Classification &amp; Bylines
                      </h3>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Publication Section
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) =>
                            handleFieldChange("category", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        >
                          {categoryChoices.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Author / Contributor
                        </label>
                        <input
                          type="text"
                          value={form.author_name}
                          onChange={(e) =>
                            handleFieldChange("author_name", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Assigned Editor
                        </label>
                        <select
                          value={form.assigned_editor_id}
                          onChange={(e) =>
                            handleFieldChange(
                              "assigned_editor_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
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
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Tags &amp; Keywords (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={form.tags_text}
                          onChange={(e) =>
                            handleFieldChange("tags_text", e.target.value)
                          }
                          placeholder="amacc lipa, campus event, honors"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) =>
                              handleFieldChange("is_featured", e.target.checked)
                            }
                            className="rounded border-slate-300"
                          />
                          Featured Story
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-red-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_breaking}
                            onChange={(e) =>
                              handleFieldChange("is_breaking", e.target.checked)
                            }
                            className="rounded border-slate-300"
                          />
                          Breaking News
                        </label>
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Featured Image &amp; Credits
                      </h3>

                      {form.image_url && (
                        <img
                          src={form.image_url}
                          alt="Featured preview"
                          className="w-full h-36 object-cover rounded-lg border border-slate-200"
                        />
                      )}

                      <div className="flex gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingCover ? "Uploading..." : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCoverImage}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={openMediaPickerForCover}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 hover:bg-blue-100"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Media Library
                        </button>
                      </div>

                      <input
                        type="text"
                        value={form.image_caption}
                        onChange={(e) =>
                          handleFieldChange("image_caption", e.target.value)
                        }
                        placeholder="Photo caption (who, what, when, where)"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={form.image_credit}
                        onChange={(e) =>
                          handleFieldChange("image_credit", e.target.value)
                        }
                        placeholder="Credit (e.g. Photo by Staff / The Binary Bulletin)"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    {/* Scheduling & SEO */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Scheduling &amp; SEO
                      </h3>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Scheduled Publish Time
                        </label>
                        <input
                          type="datetime-local"
                          value={form.scheduled_at}
                          onChange={(e) =>
                            handleFieldChange("scheduled_at", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          SEO Title
                        </label>
                        <input
                          type="text"
                          value={form.seo_title}
                          onChange={(e) =>
                            handleFieldChange("seo_title", e.target.value)
                          }
                          placeholder="Custom search engine headline"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          SEO Meta Description
                        </label>
                        <textarea
                          rows={2}
                          value={form.seo_description}
                          onChange={(e) =>
                            handleFieldChange("seo_description", e.target.value)
                          }
                          placeholder="150-160 char description for search previews"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Editorial Comments Tab */}
              {editorTab === "comments" && (
                <div className="max-w-3xl space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                    Internal newsroom comments between writers and editors.
                    These notes are never shown on the public website.
                  </div>

                  {!extendedReady.comments ? (
                    <p className="text-xs text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
                      Run{" "}
                      <code>001_editorial_cms_upgrade.sql</code> to enable
                      persistent internal editorial comments.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {editorialComments.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">
                            No internal editorial notes on this article yet.
                          </p>
                        ) : (
                          editorialComments.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50"
                            >
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-slate-900">
                                  {c.author_name}{" "}
                                  <span className="font-normal text-slate-500">
                                    ({c.author_role})
                                  </span>
                                </span>
                                <span className="text-slate-400">
                                  {new Date(c.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {c.comment || c.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <textarea
                          rows={2}
                          value={newEditorialComment}
                          onChange={(e) =>
                            setNewEditorialComment(e.target.value)
                          }
                          placeholder="Leave editorial feedback, fact-check questions, or revision responses..."
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleAddEditorialComment}
                          className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg hover:bg-blue-800 self-end"
                        >
                          Post Note
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Revision History Tab */}
              {editorTab === "revisions" && (
                <div className="max-w-3xl space-y-3">
                  {!extendedReady.revisions ? (
                    <p className="text-xs text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
                      Run{" "}
                      <code>001_editorial_cms_upgrade.sql</code> to track
                      article revision snapshots.
                    </p>
                  ) : revisions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No revision snapshots recorded yet for this article.
                    </p>
                  ) : (
                    revisions.map((rev, revIdx) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-blue-900">
                              Revision #{revisions.length - revIdx}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              {rev.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            {rev.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Saved by {rev.edited_by_name || rev.editor_name || "Editorial Staff"} on{" "}
                            {new Date(rev.created_at).toLocaleString()} &middot;{" "}
                            {rev.revision_note || rev.change_summary || "Draft update"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreRevision(rev)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0"
                        >
                          Load Version
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Approval History Tab */}
              {editorTab === "approvals" && (
                <div className="max-w-3xl space-y-3">
                  {!extendedReady.approvals ? (
                    <p className="text-xs text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
                      Run{" "}
                      <code>001_editorial_cms_upgrade.sql</code> to record
                      structured editorial approval logs.
                    </p>
                  ) : approvals.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No workflow transitions logged yet.
                    </p>
                  ) : (
                    approvals.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {app.from_status
                              ? `${getStatusMeta(app.from_status).label} → `
                              : ""}
                            {getStatusMeta(app.to_status).label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            By {app.actor_name} ({app.actor_role})
                          </p>
                          {(app.note || app.notes) && (
                            <p className="text-xs text-slate-700 mt-1.5 italic">
                              &ldquo;{app.note || app.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(app.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Workflow Action Bar Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <input
                type="text"
                value={workflowNote}
                onChange={(e) => setWorkflowNote(e.target.value)}
                placeholder="Optional workflow note / revision reason..."
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg md:w-72"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => persistArticle("draft", workflowNote)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => persistArticle("pending_review", workflowNote)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit for Review
                </button>

                {canReview && (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => persistArticle("in_review", workflowNote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      In Review
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        persistArticle("revision_required", workflowNote)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50"
                    >
                      Request Revision
                    </button>
                  </>
                )}

                {canApprove && (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => persistArticle("approved", workflowNote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => persistArticle("rejected", workflowNote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}

                {canPublish && (
                  <>
                    {form.scheduled_at && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => persistArticle("scheduled", workflowNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Schedule
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => persistArticle("published", workflowNote)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Publish Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-[60] bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-[#FCFBF9] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-300 shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-blue-900">
                Editorial Article Preview
              </span>
              <div className="flex items-center gap-2">
                {previewArticle.id && (
                  <a
                    href={`/article/${previewArticle.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:underline mr-2"
                  >
                    Public Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewArticle(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-10 space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                <span>{previewArticle.category || "Campus News"}</span>
                <span>&middot;</span>
                <span>{estimateReadingTime(previewArticle.content)}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                {previewArticle.title}
              </h1>
              {previewArticle.subheadline && (
                <p className="text-lg text-slate-600 font-serif italic">
                  {previewArticle.subheadline}
                </p>
              )}
              <p className="text-xs text-slate-500 border-y border-slate-200 py-2.5">
                By{" "}
                <strong className="text-slate-900">
                  {previewArticle.author_name || "Editorial Staff"}
                </strong>{" "}
                &middot;{" "}
                {formatDate(
                  previewArticle.published_at || previewArticle.created_at
                )}
              </p>
              {previewArticle.image_url && (
                <figure>
                  <img
                    src={previewArticle.image_url}
                    alt={previewArticle.image_caption || previewArticle.title}
                    className="w-full max-h-96 object-cover rounded-lg border border-slate-200"
                  />
                  {(previewArticle.image_caption ||
                    previewArticle.image_credit) && (
                    <figcaption className="text-xs text-slate-500 mt-2 italic">
                      {previewArticle.image_caption}{" "}
                      {previewArticle.image_credit && (
                        <span className="not-italic font-semibold text-slate-600">
                          ({previewArticle.image_credit})
                        </span>
                      )}
                    </figcaption>
                  )}
                </figure>
              )}
              <div className="space-y-4 font-serif text-slate-800 leading-relaxed">
                {parseArticleBlocks(previewArticle.content, {
                  category: previewArticle.category,
                }).map((block, idx) => {
                  if (block.type === "heading") {
                    return (
                      <h2
                        key={idx}
                        className="text-xl font-bold text-slate-900 pt-2"
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === "quote") {
                    return (
                      <blockquote
                        key={idx}
                        className="border-l-4 border-blue-900 pl-4 italic text-slate-700"
                      >
                        {block.text}
                      </blockquote>
                    );
                  }
                  if (block.type === "bullet") {
                    return (
                      <li key={idx} className="ml-5 list-disc">
                        {block.text}
                      </li>
                    );
                  }
                  if (block.type === "image") {
                    return (
                      <figure key={idx} className="my-4">
                        <img
                          src={block.url}
                          alt={block.alt || "Article visual"}
                          className="w-full rounded-lg border border-slate-200"
                        />
                        {block.alt && (
                          <figcaption className="text-xs text-slate-500 mt-1">
                            {block.alt}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return <p key={idx}>{block.text}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Select Image from Media Library
              </h3>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mediaItems.length === 0 ? (
                <p className="col-span-full text-center text-xs text-slate-500 py-10">
                  No media items registered yet. Upload images in the Media
                  Library or upload directly on the article.
                </p>
              ) : (
                mediaItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      mediaCallbackRef.current?.(
                        m.file_url,
                        m.caption || m.file_name
                      )
                    }
                    className="group text-left border border-slate-200 rounded-lg overflow-hidden hover:border-blue-600 transition"
                  >
                    <img
                      src={m.file_url}
                      alt={m.alt_text || m.file_name}
                      className="w-full h-24 object-cover"
                    />
                    <p className="p-1.5 text-[10px] font-medium text-slate-700 truncate">
                      {m.title || m.file_name}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Delete Article Permanently?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Are you sure you want to permanently delete{" "}
              <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>? Consider
              archiving instead if you want to retain editorial history.
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
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
