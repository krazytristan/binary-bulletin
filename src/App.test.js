import {
  formatDate,
  formatEventDateParts,
  cleanEditorialText,
  parseArticleBlocks,
  isMetadataTagExcerpt,
  getYouTubeId,
  getYouTubeEmbedUrl,
} from "./utils/editorial";
import {
  normalizeRole,
  hasPermission,
  getStatusMeta,
  EDITORIAL_ROLES,
} from "./utils/rbac";
import { slugify } from "./utils/cmsService";

test("formats YYYY-MM-DD dates without timezone day shift", () => {
  expect(formatDate("2026-07-20")).toBe("July 20, 2026");
  expect(formatEventDateParts("2026-07-20")).toEqual({
    monthShort: "Jul",
    day: 20,
    full: "Mon, July 20, 2026",
  });
});

test("cleans zero-width spaces, hashtags, and raw publication footers", () => {
  const raw = "\u200BImportant Notice\n\nBody text.\n\n#StaySafe #AMAOne\n\nTHE BINARY BULLETIN\nDecoding ideas, connecting minds.";
  expect(cleanEditorialText(raw)).toBe("Important Notice\n\nBody text.");
});

test("detects raw metadata tag excerpts", () => {
  expect(isMetadataTagExcerpt("LITERARY | September 28, 2026")).toBe(true);
  expect(isMetadataTagExcerpt("A new academic year has begun.")).toBe(false);
});

test("parses subheadings, blockquotes, and paragraphs for non-literary articles", () => {
  const blocks = parseArticleBlocks(
    "Lead paragraph.\n\nSection Title\n\n> Quoted statement.\n\nSecond paragraph."
  );
  expect(blocks).toEqual([
    { type: "paragraph", text: "Lead paragraph." },
    { type: "heading", text: "Section Title" },
    { type: "quote", text: "Quoted statement." },
    { type: "paragraph", text: "Second paragraph." },
  ]);
});

test("extracts YouTube embed URLs safely", () => {
  expect(getYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ", { autoplay: true })).toBe(
    "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
  );
});

test("normalizes legacy and editorial roles with RBAC permission guards", () => {
  expect(EDITORIAL_ROLES.length).toBe(9);
  expect(normalizeRole("admin")).toBe("Super Admin");
  expect(normalizeRole("user")).toBe("Staff Writer");
  expect(hasPermission("Super Admin", "manageUsers")).toBe(true);
  expect(hasPermission("Editor-in-Chief", "publishArticles")).toBe(true);
  expect(hasPermission("Staff Writer", "publishArticles")).toBe(false);
  expect(hasPermission("Staff Writer", "createArticle")).toBe(true);
  expect(hasPermission("Adviser", "viewActivityLogs")).toBe(true);
});

test("resolves editorial status metadata and generates SEO slugs", () => {
  expect(getStatusMeta("pending_review").label).toBe("Submitted for Review");
  expect(getStatusMeta("published").label).toBe("Published");
  expect(slugify("AMACC Lipa Wins Regional Tech Cup 2026!")).toBe(
    "amacc-lipa-wins-regional-tech-cup-2026"
  );
});
