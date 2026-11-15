export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const ACCEPTED_IMAGE_INPUT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const DEFAULT_MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Determine orientation category from pixel dimensions.
 */
export function classifyOrientation(width, height) {
  if (!width || !height || width <= 0 || height <= 0) {
    return "landscape";
  }
  const diffRatio = Math.abs(width - height) / Math.max(width, height);
  if (diffRatio <= 0.1) return "square";
  return height > width ? "portrait" : "landscape";
}

/**
 * Compute adaptive CSS object-fit mode based on container intent and image orientation.
 */
export function resolveObjectFit({
  mode = "card",
  orientation = "landscape",
  fit = "auto",
} = {}) {
  if (fit === "contain" || fit === "cover") {
    return fit;
  }

  // Full-visibility contexts never crop or cut off uploaded visuals
  if (["article", "preview", "lightbox", "hero", "inline"].includes(mode)) {
    return "contain";
  }

  // Portrait posters/pubmats in general cards automatically preserve full details
  if (mode === "card" && orientation === "portrait") {
    return "contain";
  }

  return "cover";
}

/**
 * Synchronous check for supported image MIME type or filename extension.
 */
export function isSupportedImageType(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();

  if (ACCEPTED_IMAGE_MIME_TYPES.includes(type)) return true;
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Validate format, size, and readability of an image File before upload,
 * returning its true pixel dimensions, aspect ratio, and orientation.
 */
export function validateImageFile(
  file,
  { maxSizeBytes = DEFAULT_MAX_IMAGE_SIZE } = {}
) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ valid: false, error: "No image file selected." });
      return;
    }

    if (!isSupportedImageType(file)) {
      resolve({
        valid: false,
        error: "Unsupported file type. Please upload a JPG, JPEG, PNG, or WebP image.",
      });
      return;
    }

    if (file.size <= 0) {
      resolve({ valid: false, error: "The selected image file is empty." });
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      resolve({
        valid: false,
        error: `Image exceeds the ${maxMb} MB limit. Please select a smaller file.`,
      });
      return;
    }

    if (typeof Image === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {
      resolve({ valid: true, width: null, height: null, aspectRatio: null, orientation: "landscape" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);

      if (!width || !height) {
        resolve({
          valid: false,
          error: "Could not read valid image dimensions from this file.",
        });
        return;
      }

      resolve({
        valid: true,
        width,
        height,
        aspectRatio: Number((width / height).toFixed(4)),
        orientation: classifyOrientation(width, height),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: "This image file appears corrupted or unreadable.",
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Generate a lightweight proportional thumbnail File WITHOUT modifying the original File.
 */
export function createThumbnailFile(file, maxEdge = 480, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || typeof document === "undefined" || typeof Image === "undefined") {
      resolve(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (!width || !height) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      const scale = Math.min(1, maxEdge / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(objectUrl);

      const outputMime =
        file.type === "image/png" ? "image/png" : "image/webp";
      const baseName = (file.name || "image").replace(/\.[^/.]+$/, "");
      const ext = outputMime === "image/png" ? "png" : "webp";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(
            new File([blob], `thumb_${baseName}.${ext}`, { type: outputMime })
          );
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
