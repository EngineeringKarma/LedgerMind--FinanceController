"use client";

import { useTheme, THEME_LIST, THEME_META, Theme } from "./ThemeProvider";
import ThemeSwitcher from "./ThemeSwitcher";

interface ThemeSelectorProps {
  className?: string;
  variant?: "cards" | "pills" | "dropdown";
}

export default function ThemeSelector({ className = "", variant = "pills" }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "pills") {
    return <ThemeSwitcher className={className} />;
  }

  /* Card Grid variant — 4 themes */
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`} role="radiogroup" aria-label="Select theme">
      {THEME_LIST.map((t) => {
        const meta = THEME_META[t];
        const isActive = theme === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`flex flex-col gap-2 p-3 text-left rounded-lg border transition-all cursor-pointer ${isActive
                ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] shadow-sm"
                : "bg-[var(--color-bg-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
              }`}
            onClick={() => setTheme(t)}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[var(--color-text-primary)]">{meta.name}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-well)] text-[var(--color-text-dim)] border border-[var(--color-border)]">
                {meta.axis.join(" · ")}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{meta.description}</p>
          </button>
        );
      })}
    </div>
  );
}