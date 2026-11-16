import React, { useEffect, useRef, useState } from "react";
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
  const imgRef = useRef(null);
  const [status, setStatus] = useState(src ? "loading" : "error");
  const [dims, setDims] = useState(null);

  useEffect(() => {
    if (!src) {
      setStatus("error");
      setDims(null);
      return;
    }

    const img = imgRef.current;
    // Recover synchronously if the browser already decoded a cached image before mount/remount
    if (img && img.complete) {
      if (img.naturalWidth > 0) {
        setDims({
          width: img.naturalWidth,
          height: img.naturalHeight,
          orientation: classifyOrientation(img.naturalWidth, img.naturalHeight),
        });
        setStatus("loaded");
        return;
      }
      if (img.currentSrc) {
        setStatus("error");
        setDims(null);
        return;
      }
    }

    setStatus("loading");
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
  const hasExplicitWidth = /\bw-/.test(containerClassName);
  const hasFixedFrame = /\b(h-\d|h-\[|h-full|h-screen|min-h-|aspect-)/.test(
    containerClassName
  );

  // Adaptive frame defaults: fit inside fixed boxes without clipping, size naturally for free-flow article frames
  const defaultSizingClass =
    mode === "lightbox"
      ? "max-h-[85dvh] max-w-full w-auto h-auto mx-auto"
      : isContain
        ? hasFixedFrame
          ? "w-full h-full max-w-full max-h-full mx-auto"
          : "w-full h-auto max-w-full mx-auto"
        : "w-full h-full";

  if (!src || status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none ${
          !hasExplicitWidth ? "w-full" : ""
        } ${!hasFixedFrame ? "min-h-[140px]" : ""} ${containerClassName}`}
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
      className={`relative overflow-hidden ${!hasExplicitWidth ? "w-full" : ""} ${
        status === "loading" && !hasFixedFrame ? "min-h-[160px]" : ""
      } ${
        isContain ? "bg-[#F5F3EE]/80 flex items-center justify-center" : "bg-slate-100"
      } ${containerClassName}`}
    >
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/60 animate-pulse pointer-events-none z-0"
        />
      )}

      <img
        ref={imgRef}
        key={src}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        className={`relative z-10 ${defaultSizingClass} ${fitClass} opacity-100 print:max-w-full print:h-auto print:object-contain ${className}`}
      />

      {showDimensionsBadge && dims?.width > 0 && (
        <span className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[9px] font-mono uppercase tracking-wider pointer-events-none">
          {dims.width}&times;{dims.height} &middot; {dims.orientation}
        </span>
      )}
    </div>
  );
}
