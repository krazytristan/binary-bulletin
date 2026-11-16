import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Shared mobile-first responsive modal shell.
 * Renders as a nearly full-screen scrollable sheet on smartphones and a centered dialog on tablets/desktop.
 */
export default function ResponsiveModal({
  open = true,
  onClose,
  title,
  subtitle,
  headerBadge,
  headerActions,
  footer,
  maxWidthClass = "max-w-3xl",
  zIndexClass = "z-50",
  bodyClassName = "p-4 sm:p-6",
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} bg-slate-950/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4`}
      onClick={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white w-full ${maxWidthClass} max-h-[94dvh] sm:max-h-[92dvh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle || headerBadge || headerActions || onClose) && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {(subtitle || headerBadge) && (
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  {subtitle && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900">
                      {subtitle}
                    </span>
                  )}
                  {headerBadge}
                </div>
              )}
              {title && (
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {title}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {onClose && (
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={onClose}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${bodyClassName}`}>
          {children}
        </div>

        {footer && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
