import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { hasPermission } from "../../utils/rbac";
import { logActivity } from "../../utils/cmsService";
import {
  ACCEPTED_IMAGE_INPUT,
  validateImageFile,
  createThumbnailFile,
  formatFileSize,
} from "../../utils/imageUtils";
import SmartImage from "../../components/SmartImage";
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Edit3,
  X,
  Folder,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const BUCKETS = ["articles", "events", "pubmats", "avatars"];

export default function MediaLibrary() {
  const { user, profile, role = "Staff Writer" } = useOutletContext() || {};
  const canManage = hasPermission(role, "manageMedia");
  const canDelete = hasPermission(role, "deleteMedia");

  const [mediaRecords, setMediaRecords] = useState([]);
  const [bucketFiles, setBucketFiles] = useState([]);
  const [usageMap, setUsageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState("all");
  const [uploadBucket, setUploadBucket] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const [medRes, artRes, annRes, evRes, galRes] = await Promise.all([
        supabase
          .from("media")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("articles").select("id, title, image_url, content"),
        supabase.from("announcements").select("id, title, image_url"),
        supabase.from("events").select("id, title, image_url"),
        supabase.from("gallery").select("id, title, images"),
      ]);

      const dbMedia = medRes.data || [];
      setMediaRecords(dbMedia);

      // Build reference index by URL
      const refs = {};
      const addRef = (url, label) => {
        if (!url) return;
        if (!refs[url]) refs[url] = [];
        refs[url].push(label);
      };
      (artRes.data || []).forEach((a) => {
        addRef(a.image_url, `Article: ${a.title}`);
      });
      (annRes.data || []).forEach((a) =>
        addRef(a.image_url, `Announcement: ${a.title}`)
      );
      (evRes.data || []).forEach((e) => addRef(e.image_url, `Event: ${e.title}`));
      (galRes.data || []).forEach((g) => {
        (g.images || []).forEach((imgUrl) =>
          addRef(imgUrl, `Gallery: ${g.title}`)
        );
      });
      setUsageMap(refs);

      // Scan storage buckets so legacy uploaded assets also show up
      const discovered = [];
      for (const bucket of BUCKETS) {
        const { data: list } = await supabase.storage
          .from(bucket)
          .list("", { limit: 100 });
        if (list) {
          list.forEach((f) => {
            if (!f.name || f.id === null) return;
            const {
              data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(f.name);
            discovered.push({
              id: `storage-${bucket}-${f.name}`,
              isStorageOnly: true,
              bucket,
              storage_path: f.name,
              file_name: f.name,
              file_url: publicUrl,
              folder: bucket,
              created_at: f.created_at,
            });
          });
        }
      }
      setBucketFiles(discovered);
    } catch (err) {
      console.error("Media load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Merge DB media records + undiscovered bucket items
  const dbUrls = new Set(mediaRecords.map((m) => m.file_url));
  const combinedItems = [
    ...mediaRecords.map((m) => ({
      ...m,
      folder: m.folder || "articles",
    })),
    ...bucketFiles.filter((bf) => !dbUrls.has(bf.file_url)),
  ];

  const filteredItems = combinedItems.filter((item) => {
    if (selectedFolder !== "all" && item.folder !== selectedFolder)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${item.title || ""} ${item.file_name || ""} ${item.caption || ""} ${item.credit || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleMultiUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !canManage) return;

    setUploading(true);
    let successCount = 0;
    const rejectedMessages = [];
    try {
      for (const file of files) {
        const validation = await validateImageFile(file);
        if (!validation.valid) {
          rejectedMessages.push(`${file.name}: ${validation.error}`);
          continue;
        }

        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const baseId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const cleanName = `${baseId}.${ext}`;

        // Preserve original file intact without altering dimensions or quality
        const { error: upErr } = await supabase.storage
          .from(uploadBucket)
          .upload(cleanName, file);
        if (upErr) throw upErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from(uploadBucket).getPublicUrl(cleanName);

        // Generate a proportional thumbnail separately for faster grid loading
        let thumbnailUrl = null;
        const thumbFile = await createThumbnailFile(file, 480, 0.82);
        if (thumbFile) {
          const thumbExt = thumbFile.name.split(".").pop() || "webp";
          const thumbPath = `thumbs/${baseId}_thumb.${thumbExt}`;
          const { error: thumbErr } = await supabase.storage
            .from(uploadBucket)
            .upload(thumbPath, thumbFile);
          if (!thumbErr) {
            thumbnailUrl = supabase.storage
              .from(uploadBucket)
              .getPublicUrl(thumbPath).data.publicUrl;
          }
        }

        const basePayload = {
          file_name: file.name,
          file_url: publicUrl,
          uploaded_by: user?.id || null,
        };
        const extPayload = {
          ...basePayload,
          title: file.name.replace(/\.[^/.]+$/, ""),
          folder: uploadBucket,
          storage_path: cleanName,
          file_size: file.size,
          mime_type: file.type,
        };
        const richPayload = {
          ...extPayload,
          thumbnail_url: thumbnailUrl,
          width: validation.width,
          height: validation.height,
          orientation: validation.orientation,
        };

        let { error: dbErr } = await supabase.from("media").insert(richPayload);
        if (dbErr && /column .* does not exist/i.test(dbErr.message || "")) {
          const extRetry = await supabase.from("media").insert(extPayload);
          dbErr = extRetry.error;
          if (dbErr && /column .* does not exist/i.test(dbErr.message || "")) {
            const retry = await supabase.from("media").insert(basePayload);
            dbErr = retry.error;
          }
        }
        if (dbErr) throw dbErr;
        successCount += 1;
      }

      if (successCount > 0) {
        await logActivity({
          action: `Uploaded ${successCount} original image(s) with thumbnails to "${uploadBucket}"`,
          userId: user?.id,
          userName: profile?.full_name,
          userRole: role,
          entityType: "media",
        });
      }

      if (rejectedMessages.length > 0 && successCount === 0) {
        showToast("error", rejectedMessages[0]);
      } else if (rejectedMessages.length > 0) {
        showToast(
          "error",
          `Uploaded ${successCount}; skipped ${rejectedMessages.length} invalid file(s).`
        );
      } else if (successCount > 0) {
        showToast(
          "success",
          `Uploaded ${successCount} original image(s) with proportional thumbnails.`
        );
      }
      loadMedia();
    } catch (err) {
      showToast("error", err.message || "Media upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      if (editItem.isStorageOnly) {
        // Register into media table
        const { error } = await supabase.from("media").insert({
          file_name: editItem.file_name,
          file_url: editItem.file_url,
          uploaded_by: user?.id || null,
          title: editItem.title || editItem.file_name,
          caption: editItem.caption || null,
          credit: editItem.credit || null,
          alt_text: editItem.alt_text || null,
          folder: editItem.folder || "articles",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("media")
          .update({
            title: editItem.title || null,
            caption: editItem.caption || null,
            credit: editItem.credit || null,
            alt_text: editItem.alt_text || null,
            folder: editItem.folder || "articles",
          })
          .eq("id", editItem.id);
        if (error) throw error;
      }
      showToast("success", "Media attribution & metadata saved.");
      setEditItem(null);
      loadMedia();
    } catch (err) {
      showToast(
        "error",
        err.message ||
          "Extended metadata requires running 001_editorial_cms_upgrade.sql."
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canDelete) return;
    try {
      if (!deleteTarget.isStorageOnly) {
        const { error } = await supabase
          .from("media")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;
      }

      if (deleteTarget.storage_path && deleteTarget.folder) {
        await supabase.storage
          .from(deleteTarget.folder)
          .remove([deleteTarget.storage_path]);
      }

      await logActivity({
        action: `Removed media file "${deleteTarget.file_name}"`,
        userId: user?.id,
        userName: profile?.full_name,
        userRole: role,
        entityType: "media",
      });
      showToast("success", "Media asset removed.");
      setDeleteTarget(null);
      loadMedia();
    } catch (err) {
      showToast("error", err.message || "Could not remove asset.");
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard?.writeText(url);
    showToast("success", "Image URL copied to clipboard.");
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-900 mb-1">
            Digital Asset Management
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Centralized Media Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload optimized photos, manage captions &amp; photojournalist
            credits, and verify usage before deletion.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={uploadBucket}
              onChange={(e) => setUploadBucket(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
            >
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  Folder: {b}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer transition shadow-sm">
              <Upload className="w-4 h-4" />
              {uploading ? "Validating & Uploading..." : "Upload Images"}
              <input
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_INPUT}
                onChange={handleMultiUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedFolder("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              selectedFolder === "all"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            All ({combinedItems.length})
          </button>
          {BUCKETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedFolder(b)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                selectedFolder === b
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              <Folder className="w-3 h-3" />
              {b}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, caption, credit..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={loadMedia}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
          Scanning Supabase Storage &amp; media registry...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
          No media assets found in this folder.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const refs = usageMap[item.file_url] || [];
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col group hover:border-blue-300 transition"
              >
                <div className="relative h-36 bg-slate-100">
                  <SmartImage
                    src={item.thumbnail_url || item.file_url}
                    alt={item.alt_text || item.file_name}
                    mode="thumbnail"
                    fit="auto"
                    containerClassName="w-full h-full cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                    fallbackLabel="Unavailable"
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900/75 text-white">
                    {item.folder}
                  </span>
                  {item.width && item.height && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/75 text-white">
                      {item.width}&times;{item.height}
                    </span>
                  )}
                  {refs.length > 0 && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      In Use ({refs.length})
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.title || item.file_name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.credit || item.caption || "No credit set"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        title="Preview"
                        className="p-1 text-slate-500 hover:text-blue-900"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyUrl(item.file_url)}
                        title="Copy URL"
                        className="p-1 text-slate-500 hover:text-blue-900"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setEditItem({ ...item })}
                          title="Edit Attribution"
                          className="p-1 text-slate-500 hover:text-blue-900"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete"
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 truncate">
                {previewItem.title || previewItem.file_name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:underline"
                >
                  Open Original <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-1 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <SmartImage
                src={previewItem.file_url}
                alt={previewItem.alt_text || previewItem.file_name}
                mode="preview"
                fit="contain"
                loading="eager"
                showDimensionsBadge
                containerClassName="rounded-lg border border-slate-200"
                className="max-h-[60vh]"
              />
              <div className="text-xs text-slate-600 space-y-1">
                {previewItem.file_size && (
                  <p>
                    <strong>Original Size:</strong> {formatFileSize(previewItem.file_size)}
                    {previewItem.mime_type ? ` (${previewItem.mime_type})` : ""}
                  </p>
                )}
                {previewItem.caption && (
                  <p>
                    <strong>Caption:</strong> {previewItem.caption}
                  </p>
                )}
                {previewItem.credit && (
                  <p>
                    <strong>Credit:</strong> {previewItem.credit}
                  </p>
                )}
                {(usageMap[previewItem.file_url] || []).length > 0 && (
                  <p className="text-emerald-700 font-semibold">
                    Referenced in: {usageMap[previewItem.file_url].join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Edit Image Metadata &amp; Attribution
              </h3>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMetadata} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editItem.title || ""}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Caption
                </label>
                <textarea
                  rows={2}
                  value={editItem.caption || ""}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, caption: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Credit / Copyright Attribution
                </label>
                <input
                  type="text"
                  value={editItem.credit || ""}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, credit: e.target.value }))
                  }
                  placeholder="Photo by [Name] / The Binary Bulletin"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={editItem.alt_text || ""}
                  onChange={(e) =>
                    setEditItem((p) => ({ ...p, alt_text: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold hover:bg-blue-800"
                >
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Delete Media File?
            </h3>
            {(usageMap[deleteTarget.file_url] || []).length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900 mb-4">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4" /> Warning: Currently Used
                  in Published/Saved Content
                </p>
                <ul className="list-disc ml-4 space-y-0.5">
                  {usageMap[deleteTarget.file_url].map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-4">
                This file is not currently linked to any article, event,
                announcement, or gallery album.
              </p>
            )}
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
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                {(usageMap[deleteTarget.file_url] || []).length > 0
                  ? "Confirm Delete Anyway"
                  : "Delete Media"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
