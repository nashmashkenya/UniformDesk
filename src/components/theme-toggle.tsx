"use client";

import { useTheme } from "@/components/theme-provider";
import { THEMES } from "@/lib/themes";

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`theme-toggle grid gap-2 ${className}`}>
      {!compact && (
        <div className="text-xs font-semibold text-[var(--muted)]">
          Office theme
        </div>
      )}
      <div className="grid gap-2">
        {THEMES.map((item) => {
          const active = item.id === theme;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={`theme-option ${active ? "is-active" : ""}`}
              aria-pressed={active}
            >
              <span className="theme-swatch" aria-hidden>
                {item.swatch.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-[var(--muted)]">
                  {item.blurb}
                </span>
              </span>
              {active && <span className="theme-check">On</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
