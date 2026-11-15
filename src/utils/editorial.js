export const PUBLICATION = {
  name: "The Binary Bulletin",
  tagline: "Official Student Publication of AMA Computer College Lipa Campus",
  institution: "AMA Computer College Lipa Campus",
  shortInstitution: "AMA Lipa",
  location: "Lipa City, Batangas",
  motto: "Decoding ideas, connecting minds.",
  email: "binarybulletin@ama.edu.ph",
  facebookUrl: "https://web.facebook.com/profile.php?id=61581010768762",
};

/**
 * Safely format ISO timestamps or YYYY-MM-DD strings without local timezone day-shift.
 */
export function formatDate(dateInput, options = { month: "long", day: "numeric", year: "numeric" }) {
  if (!dateInput) return "";
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [year, month, day] = dateInput.trim().split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("en-US", options);
  }
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", options);
}

/**
 * Extract calendar badge parts safely for YYYY-MM-DD event dates.
 */
export function formatEventDateParts(dateInput) {
  if (!dateInput) return { monthShort: "TBA", day: "--", full: "Date TBA" };
  let dateObj;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [year, month, day] = dateInput.trim().split("-").map(Number);
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = new Date(dateInput);
  }
  if (Number.isNaN(dateObj.getTime())) {
    return { monthShort: "TBA", day: "--", full: "Date TBA" };
  }
  return {
    monthShort: dateObj.toLocaleDateString("en-US", { month: "short" }),
    day: dateObj.getDate(),
    full: dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

/**
 * Estimate reading time in minutes for journalistic copy.
 */
export function estimateReadingTime(text) {
  if (!text) return "1 min read";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

/**
 * Detect if an excerpt is actually just a raw "CATEGORY | Date" metadata tag.
 */
export function isMetadataTagExcerpt(excerpt) {
  if (!excerpt) return false;
  return /^[A-Z\s]+\|\s*[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(excerpt.trim());
}

/**
 * Strip zero-width characters, social hashtag footers, and redundant boilerplate sign-offs.
 */
export function cleanEditorialText(text, { stripSignOff = true, stripHashtags = true } = {}) {
  if (!text) return "";
  let cleaned = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (stripSignOff) {
    // Remove trailing raw publication colophon blocks already displayed in the site UI
    cleaned = cleaned
      .replace(
        /\n*(?:AMA Computer College Lipa(?: Campus)?\n+)?THE BINARY BULLETIN(?:\n+Decoding ideas, connecting minds\.)?(?:\n+The official bulletin delivering the pulse of AMA Lipa in every byte\.)?\s*$/i,
        ""
      )
      .trim();
  }

  if (stripHashtags) {
    // Remove trailing lines composed entirely of hashtags
    cleaned = cleaned.replace(/\n+(?:#[\w\d_]+\s*)+$/i, "").trim();
  }

  return cleaned;
}

/**
 * Convert raw article body text into structured blocks (headings, list items, paragraphs)
 * so plain-text subheadings and Markdown headings both render with editorial hierarchy.
 */
export function parseArticleBlocks(rawContent, { category } = {}) {
  const cleaned = cleanEditorialText(rawContent, { stripSignOff: true, stripHashtags: true });
  if (!cleaned) return [];

  const isLiterary = category?.toLowerCase() === "literary";

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    // Inline Markdown image ![alt](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
    if (imgMatch) {
      return { type: "image", alt: imgMatch[1] || "Editorial photograph", url: imgMatch[2] };
    }

    // Explicit Markdown heading
    if (/^#{1,3}\s+/.test(line)) {
      return { type: "heading", text: line.replace(/^#{1,3}\s+/, "") };
    }

    // Explicit blockquote
    if (/^>\s+/.test(line)) {
      return { type: "quote", text: line.replace(/^>\s+/, "") };
    }

    if (isLiterary) {
      return { type: "paragraph", text: line };
    }

    // Explicit bullet or numbered list line
    if (/^[-•✅📌🗓️📝📖🎓🏁📚]\s*/.test(line) || /^\d+\.\s+/.test(line)) {
      return {
        type: "bullet",
        text: line.replace(/^(?:[-•✅📌🗓️📝📖🎓🏁📚]\s*|\d+\.\s+)/, ""),
      };
    }

    // Heuristic for plain-text section subheadings in existing articles:
    // Short standalone line (<= 75 chars, >= 2 words), not ending in sentence punctuation,
    // and not the final line of an article.
    const wordCount = line.split(/\s+/).length;
    const endsWithPunctuation = /[.!?;:,"”'’]$/.test(line);
    const isAllCapsHeading = line === line.toUpperCase() && /[A-Z]/.test(line) && wordCount <= 8;
    const isShortTitleLine =
      wordCount >= 2 &&
      wordCount <= 10 &&
      line.length <= 75 &&
      !endsWithPunctuation &&
      index > 0 &&
      index < lines.length - 1;

    if (isAllCapsHeading || isShortTitleLine) {
      return { type: "heading", text: line };
    }

    return { type: "paragraph", text: line };
  });
}

/**
 * YouTube URL helpers shared across Home, The Binary Online, and Admin.
 */
export function isYouTubeUrl(url) {
  return Boolean(url && (url.includes("youtube.com") || url.includes("youtu.be")));
}

export function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}

export function getYouTubeEmbedUrl(url, { autoplay = false } = {}) {
  const id = getYouTubeId(url);
  if (!id) return url || "";
  return `https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1" : ""}`;
}

export function getYouTubeThumbnailUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}
