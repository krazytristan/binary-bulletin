import React, { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { classifyOrientation, resolveObjectFit } from "../utils/imageUtils";

/**
 * Reusable adaptive image component for The Binary Bulletin.
 * Automatically inspects natural dimensions and orientation, prevents stretching
 * or clipping across desktop/tablet/mobile and print views, and provides fallbacks.
 */
export default function SmartImage({
  src,
  alt = "",
  mode = "card", // "article" | "hero" | "preview" | "lightbox" | "inline" | "card" | "thumbnail" | "avatar"
  fit = "auto", // "auto" | "contain" | "cover"
  containerClassName = "",
  className = "",
  fallbackLabel = "Visual Unavailable",
  fallbackIcon: FallbackIcon = Newspaper,
  loading = "lazy",
  onClick,
  showDimensionsBadge = false,
}) {
  const [status, setStatus] = useState(src ? "loading" : "error");
  const [dims, setDims] = useState(null);

  useEffect(() => {
    setStatus(src ? "loading" : "error");
    setDims(null);
  }, [src]);

  const handleLoad = (e) => {
    const img = e.currentTarget;
    const width = img.naturalWidth || 0;
    const height = img.naturalHeight || 0;
    setDims({
      width,
      height,
      orientation: classifyOrientation(width, height),
    });
    setStatus("loaded");
  };

  const handleError = () => {
    setStatus("error");
  };

  const resolvedFit = resolveObjectFit({
    mode,
    orientation: dims?.orientation || "landscape",
    fit,
  });

  const isContain = resolvedFit === "contain";
  const fitClass = isContain ? "object-contain" : "object-cover";

  // Adaptive frame defaults when no fixed aspect/height is imposed on full-article views
  const defaultSizingClass =
    mode === "lightbox"
      ? "max-h-[85vh] max-w-full w-auto h-auto mx-auto"
      : isContain
        ? "w-full h-auto max-w-full mx-auto"
        : "w-full h-full";

  if (!src || status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none ${containerClassName}`}
      >
        <FallbackIcon className="w-7 h-7 opacity-40 mb-1.5" />
        {fallbackLabel && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-center px-2">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        isContain ? "bg-[#F5F3EE]/80 flex items-center justify-center" : "bg-slate-100"
      } ${containerClassName}`}
    >
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/70 animate-pulse"
        />
      )}

      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        className={`${defaultSizingClass} ${fitClass} transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        } print:max-w-full print:h-auto print:object-contain ${className}`}
      />

      {showDimensionsBadge && dims?.width > 0 && (
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[9px] font-mono uppercase tracking-wider pointer-events-none">
          {dims.width}&times;{dims.height} &middot; {dims.orientation}
        </span>
      )}
    </div>
  );
}
