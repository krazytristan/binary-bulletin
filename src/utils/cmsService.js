import { supabase } from "../lib/supabase";

/**
 * Generate an SEO-friendly URL slug from a headline.
 */
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/**
 * Record an audit entry in `activity_logs`.
 * Gracefully falls back to the baseline `{ action }` column if the extended migration is not yet applied.
 */
export async function logActivity({
  action,
  userId = null,
  userName = "Editorial Staff",
  userRole = "",
  entityType = "",
  entityId = "",
  details = "",
}) {
  if (!action) return;
  try {
    const richAction = details ? `${action}: ${details}` : action;
    const { error } = await supabase.from("activity_logs").insert([
      {
        action: richAction,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        details,
      },
    ]);

    if (error) {
      // Fallback for baseline schema where activity_logs only has (id, action, created_at)
      await supabase.from("activity_logs").insert([{ action: richAction }]);
    }
  } catch (err) {
    console.warn("Activity log skipped:", err?.message || err);
  }
}

/**
 * Create a notification in `notifications`.
 * Gracefully falls back to baseline `{ title, message, is_read }` if extended columns are absent.
 */
export async function createNotification({
  title,
  message,
  recipientId = null,
  notificationType = "editorial",
  entityType = "",
  entityId = "",
  link = "",
}) {
  if (!title || !message) return;
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        title,
        message,
        is_read: false,
        recipient_id: recipientId,
        notification_type: notificationType,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        link,
      },
    ]);

    if (error) {
      await supabase.from("notifications").insert([{ title, message, is_read: false }]);
    }
  } catch (err) {
    console.warn("Notification insert skipped:", err?.message || err);
  }
}

/**
 * Check whether an optional upgraded table exists in Supabase.
 */
export async function checkTableExists(tableName) {
  const { error } = await supabase.from(tableName).select("*", { count: "exact", head: true });
  return !error;
}

/**
 * Export an array of objects to a downloadable CSV file.
 */
export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    const str = val === null || val === undefined ? "" : String(val);
    const safe = str.replace(/"/g, '""');
    return /[",\n\r]/.test(safe) ? `"${safe}"` : safe;
  };
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Optimize an uploaded image in the browser before storing in Supabase Storage.
 */
export function optimizeImageFile(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/") || file.type === "image/gif") {
      resolve(file);
      return;
    }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(file);
        return;
      }
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: targetType }));
        },
        targetType,
        quality
      );
    };
    reader.readAsDataURL(file);
  });
}
