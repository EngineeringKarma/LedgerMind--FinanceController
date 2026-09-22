"use client";

import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";

interface ThemeMeta {
  id: Theme;
  name: string;
  description: string;
  icon: React.ReactNode;
}

type Theme = "light" | "dark";

const THEME_META: Record<Theme, ThemeMeta> = {
  light: {
    id: "light",
    name: "Light",
    description: "Clean & crisp — default workspace",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  dark: {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes — low-light workflows",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
};

const THEME_ORDER: Theme[] = ["light", "dark"];

const PREVIEW_METRICS = [
  { label: "Revenue", value: "₹18,23,456" },
  { label: "Gateway Fees", value: "₹45,678" },
  { label: "Net Settled", value: "₹12,45,678" },
];

interface ThemeSelectorProps {
  className?: string;
  variant?: "cards" | "pills" | "dropdown";
}

export default function ThemeSelector({ className = "", variant = "cards" }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, currentTheme: Theme) => {
    const idx = THEME_ORDER.indexOf(currentTheme);
    let newIdx = idx;
    if (e.key === "ArrowRight") newIdx = (idx + 1) % THEME_ORDER.length;
    if (e.key === "ArrowLeft") newIdx = (idx - 1 + THEME_ORDER.length) % THEME_ORDER.length;
    if (e.key === "Home") newIdx = 0;
    if (e.key === "End") newIdx = THEME_ORDER.length - 1;
    if (newIdx !== idx) {
      e.preventDefault();
      setTheme(THEME_ORDER[newIdx]);
    }
    if (e.key === "Escape") {
      setIsMobileDropdownOpen(false);
    }
  };

  const handleThemeClick = (t: Theme) => {
    setTheme(t);
    setIsMobileDropdownOpen(false);
  };

  // Desktop: Card Grid (default)
  if (variant === "cards") {
    return (
      <div className={`theme-selector-cards ${className}`} role="radiogroup" aria-label="Select theme">
        {THEME_ORDER.map((t) => {
          const meta = THEME_META[t];
          const isActive = theme === t;
          return (
            <button
              key={t}
              role="radio"
              aria-checked={isActive}
              aria-label={`${meta.name} theme: ${meta.description}`}
              className={`theme-card ${isActive ? "active" : ""} theme-${t}`}
              onClick={() => handleThemeClick(t)}
              onKeyDown={(e) => handleKeyDown(e, t)}
              tabIndex={isActive ? 0 : -1}
            >
              <div className="theme-card-header">
                <div className="theme-card-icon theme-icon" aria-hidden="true" />
                <div className="theme-card-info">
                  <div className="theme-card-name">{meta.name}</div>
                  <div className="theme-card-desc">{meta.description}</div>
                </div>
              </div>
              <div className="theme-card-preview">
                {PREVIEW_METRICS.map((metric) => (
                  <div key={metric.label} className="theme-card-preview-item">
                    <div className="theme-card-preview-label">{metric.label}</div>
                    <div className="theme-card-preview-value">{metric.value}</div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Pill Strip (for navbar/dashboard)
  if (variant === "pills") {
    return (
      <div className={`themeband ${className}`} role="radiogroup" aria-label="Select theme">
        {THEME_ORDER.map((t) => {
          const meta = THEME_META[t];
          const isActive = theme === t;
          return (
            <button
              key={t}
              role="radio"
              aria-checked={isActive}
              aria-label={`${meta.name} theme`}
              className={`theme-pill ${isActive ? "active" : ""}`}
              onClick={() => setTheme(t)}
              onKeyDown={(e) => handleKeyDown(e, t)}
              tabIndex={isActive ? 0 : -1}
            >
              <span className={`theme-icon theme-${t}`} aria-hidden="true" />
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Mobile Dropdown
  return (
    <div className="relative theme-selector-mobile" style={{ display: "inline-flex" }}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-surface hover:bg-bg-surface-hover transition-colors"
        aria-label="Open theme selector"
        aria-expanded={isMobileDropdownOpen}
        aria-haspopup="listbox"
        onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
      >
        <span className={`theme-icon theme-${theme}`} style={{ width: 20, height: 20, borderRadius: 4 }} aria-hidden="true" />
      </button>

      {isMobileDropdownOpen && (
        <div
          ref={dropdownRef}
          className="theme-dropdown"
          role="listbox"
          aria-label="Available themes"
        >
          {THEME_ORDER.map((t) => {
            const meta = THEME_META[t];
            const isActive = theme === t;
            return (
              <button
                key={t}
                role="option"
                aria-selected={isActive}
                className={`theme-dropdown-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setTheme(t);
                  setIsMobileDropdownOpen(false);
                }}
              >
                <span className={`theme-icon theme-${t}`} aria-hidden="true" />
                <span>{meta.name}</span>
                <span className="text-xs text-text-muted ml-2">{meta.description}</span>
                {isActive && (
                  <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}