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
import {
  classifyOrientation,
  resolveObjectFit,
  isSupportedImageType,
  validateImageFile,
  formatFileSize,
} from "./utils/imageUtils";

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

test("classifies image orientations and resolves object-fit behavior cleanly", () => {
  expect(classifyOrientation(1600, 900)).toBe("landscape");
  expect(classifyOrientation(800, 1200)).toBe("portrait");
  expect(classifyOrientation(1000, 1020)).toBe("square");
  expect(classifyOrientation(0, 0)).toBe("landscape");

  expect(resolveObjectFit({ mode: "article", orientation: "landscape" })).toBe("contain");
  expect(resolveObjectFit({ mode: "preview", orientation: "landscape" })).toBe("contain");
  expect(resolveObjectFit({ mode: "lightbox", orientation: "square" })).toBe("contain");
  expect(resolveObjectFit({ mode: "card", orientation: "portrait" })).toBe("contain");
  expect(resolveObjectFit({ mode: "card", orientation: "landscape" })).toBe("cover");
  expect(resolveObjectFit({ mode: "thumbnail", orientation: "portrait" })).toBe("cover");
  expect(resolveObjectFit({ mode: "card", orientation: "portrait", fit: "cover" })).toBe("cover");
});

test("validates supported image formats and formats file sizes", async () => {
  expect(isSupportedImageType({ type: "image/jpeg", name: "photo.jpg" })).toBe(true);
  expect(isSupportedImageType({ type: "image/png", name: "graphic.png" })).toBe(true);
  expect(isSupportedImageType({ type: "image/webp", name: "banner.webp" })).toBe(true);
  expect(isSupportedImageType({ type: "", name: "campus.jpeg" })).toBe(true);
  expect(isSupportedImageType({ type: "image/gif", name: "anim.gif" })).toBe(false);
  expect(isSupportedImageType({ type: "application/pdf", name: "issue.pdf" })).toBe(false);

  expect(formatFileSize(512)).toBe("512 B");
  expect(formatFileSize(2048)).toBe("2.0 KB");
  expect(formatFileSize(2 * 1024 * 1024)).toBe("2.00 MB");

  const emptyResult = await validateImageFile(null);
  expect(emptyResult.valid).toBe(false);

  const gifFile = new File(["gif"], "test.gif", { type: "image/gif" });
  const unsupportedResult = await validateImageFile(gifFile);
  expect(unsupportedResult.valid).toBe(false);
  expect(unsupportedResult.error).toMatch(/JPG, JPEG, PNG, or WebP/i);

  const zeroBytePng = new File([], "empty.png", { type: "image/png" });
  const zeroResult = await validateImageFile(zeroBytePng);
  expect(zeroResult.valid).toBe(false);
  expect(zeroResult.error).toMatch(/empty/i);
});
