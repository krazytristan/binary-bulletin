import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

/**
 * Mobile-friendly search & collapsible filter bar.
 * Full-width search stays immediately accessible while secondary dropdowns collapse on mobile (<md).
 */
export default function ResponsiveFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  searchAriaLabel = "Search records",
  activeFilterCount = 0,
  children,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-2.5">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label={searchAriaLabel}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm sm:text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
          />
        </div>

        {children && (
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
            className={`md:hidden inline-flex items-center gap-1.5 px-3 min-h-[42px] rounded-lg border text-xs font-bold shrink-0 transition ${
              filtersOpen || activeFilterCount > 0
                ? "bg-blue-900 text-white border-blue-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-400 text-blue-950 font-black leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {children && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>

      {children && filtersOpen && (
        <div className="md:hidden grid grid-cols-1 gap-2.5 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          {children}
        </div>
      )}
    </div>
  );
}
