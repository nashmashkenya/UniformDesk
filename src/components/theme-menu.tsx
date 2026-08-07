"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEMES } from "@/lib/themes";

export function ThemeMenu({ align = "right" }: { align?: "left" | "right" }) {
  const { theme } = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="nav-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Colour themes"
      >
        <span className="flex -space-x-1" aria-hidden>
          {current.swatch.slice(0, 3).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-full border border-white/40"
              style={{ background: color }}
            />
          ))}
        </span>
        <span className="hidden lg:inline">{current.label}</span>
      </button>
      {open && (
        <div
          className={`nav-dropdown theme-dropdown ${
            align === "left" ? "nav-dropdown-left" : "nav-dropdown-right"
          }`}
          role="menu"
        >
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}
