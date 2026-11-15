/**
 * Role-Based Access Control (RBAC) & Editorial Workflow State Machine
 * for The Binary Bulletin Digital Newsroom.
 */

export const EDITORIAL_ROLES = [
  "Super Admin",
  "Editor-in-Chief",
  "Managing Editor",
  "News Editor",
  "Section Editor",
  "Staff Writer",
  "Photojournalist",
  "Layout Artist",
  "Adviser",
];

// Normalize legacy database roles ('admin', 'user', 'Editor in Chief', etc.)
export function normalizeRole(rawRole) {
  if (!rawRole) return "Staff Writer";
  const r = String(rawRole).trim();
  const lower = r.toLowerCase();
  if (lower === "admin" || lower === "administrator" || lower === "super admin") {
    return "Super Admin";
  }
  if (lower === "editor in chief" || lower === "editor-in-chief") {
    return "Editor-in-Chief";
  }
  if (lower === "editor" || lower === "content editor" || lower === "managing editor") {
    return "Managing Editor";
  }
  if (lower === "news writer" || lower === "user" || lower === "staff writer" || lower === "reader") {
    return "Staff Writer";
  }
  const exact = EDITORIAL_ROLES.find((role) => role.toLowerCase() === lower);
  return exact || "Staff Writer";
}

export const ROLE_DESCRIPTIONS = {
  "Super Admin": "Full system, user, configuration, and publishing access.",
  "Editor-in-Chief": "Final editorial approval, publishing authority, and newsroom oversight.",
  "Managing Editor": "Manages editorial operations, assignments, workflow, and publication.",
  "News Editor": "Reviews, edits, and manages newsroom articles and schedules.",
  "Section Editor": "Manages articles and submissions within assigned publication sections.",
  "Staff Writer": "Creates, edits own drafts, and submits articles for editorial review.",
  Photojournalist: "Uploads, credits, and manages photographs and visual exhibits.",
  "Layout Artist": "Manages visual assets, banners, and multimedia presentations.",
  Adviser: "Supervisory monitoring, audit visibility, and editorial guidance.",
};

export const PERMISSIONS = {
  viewDashboard: EDITORIAL_ROLES,
  createArticle: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
    "Staff Writer",
  ],
  editAllArticles: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
  ],
  reviewArticles: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
    "Adviser",
  ],
  approveArticles: ["Super Admin", "Editor-in-Chief", "Managing Editor", "News Editor"],
  publishArticles: ["Super Admin", "Editor-in-Chief", "Managing Editor", "News Editor"],
  deleteArticles: ["Super Admin", "Editor-in-Chief", "Managing Editor"],
  manageCategories: ["Super Admin", "Editor-in-Chief", "Managing Editor"],
  manageMedia: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
    "Photojournalist",
    "Layout Artist",
  ],
  deleteMedia: ["Super Admin", "Editor-in-Chief", "Managing Editor", "Photojournalist"],
  manageHomepage: ["Super Admin", "Editor-in-Chief", "Managing Editor", "Layout Artist"],
  moderateComments: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Section Editor",
  ],
  manageUsers: ["Super Admin", "Editor-in-Chief"],
  manageSettings: ["Super Admin", "Editor-in-Chief"],
  viewAnalytics: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "News Editor",
    "Adviser",
  ],
  viewActivityLogs: [
    "Super Admin",
    "Editor-in-Chief",
    "Managing Editor",
    "Adviser",
  ],
};

export function hasPermission(role, permissionKey) {
  const normalized = normalizeRole(role);
  const allowed = PERMISSIONS[permissionKey];
  if (!allowed) return false;
  return allowed.includes(normalized);
}

export const ARTICLE_STATUSES = [
  { value: "draft", label: "Draft", badge: "bg-gray-100 text-gray-700 border-gray-300" },
  {
    value: "pending_review",
    label: "Submitted for Review",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    value: "in_review",
    label: "Editorial Review",
    badge: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    value: "revision_required",
    label: "Revision Required",
    badge: "bg-orange-100 text-orange-900 border-orange-300",
  },
  {
    value: "approved",
    label: "Approved",
    badge: "bg-teal-100 text-teal-900 border-teal-300",
  },
  {
    value: "scheduled",
    label: "Scheduled",
    badge: "bg-indigo-100 text-indigo-900 border-indigo-300",
  },
  {
    value: "published",
    label: "Published",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    value: "rejected",
    label: "Rejected",
    badge: "bg-red-100 text-red-900 border-red-300",
  },
  {
    value: "archived",
    label: "Archived",
    badge: "bg-slate-200 text-slate-700 border-slate-400",
  },
];

export function getStatusMeta(status) {
  const normalized = (status || "draft").toLowerCase();
  return (
    ARTICLE_STATUSES.find((s) => s.value === normalized) || {
      value: normalized,
      label: normalized.replace(/_/g, " "),
      badge: "bg-gray-100 text-gray-700 border-gray-300",
    }
  );
}
