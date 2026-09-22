"use client";

import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";

interface ThemeMeta {
  id: Theme;
  name: string;
  description: string;
}

type Theme = "paper" | "operator" | "glass" | "graphite" | "soft" | "dusk";

const THEME_META: Record<Theme, ThemeMeta> = {
  paper: {
    id: "paper",
    name: "Paper",
    description: "Ink & cream — physical ledger feel",
  },
  operator: {
    id: "operator",
    name: "Operator",
    description: "Dark ops — terminal aesthetic",
  },
  glass: {
    id: "glass",
    name: "Glass",
    description: "Light & airy — clean transparency",
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    description: "Glass at night — charcoal depth",
  },
  soft: {
    id: "soft",
    name: "Soft",
    description: "Off-white — warm minimalism",
  },
  dusk: {
    id: "dusk",
    name: "Dusk",
    description: "Soft dark — lavender twilight",
  },
};

const THEME_ORDER: Theme[] = ["paper", "operator", "glass", "graphite", "soft", "dusk"];

interface ThemeSelectorProps {
  className?: string;
}

export default function ThemeSelector({ className = "" }: ThemeSelectorProps) {
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

  return (
    <>
      {/* Desktop: Horizontal Pill Strip */}
      <div className={`hidden md:inline-flex theme-selector ${className}`} role="radiogroup" aria-label="Select theme">
        {THEME_ORDER.map((t) => {
          const meta = THEME_META[t];
          const isActive = theme === t;
          return (
            <button
              key={t}
              role="radio"
              aria-checked={isActive}
              aria-label={`${meta.name} theme: ${meta.description}`}
              className={`theme-pill ${isActive ? "active" : ""} theme-${t}`}
              onClick={() => setTheme(t)}
              onKeyDown={(e) => handleKeyDown(e, t)}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="theme-pill-icon" aria-hidden="true" />
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: Dropdown Button + Menu */}
      <div className="md:hidden relative theme-selector-mobile">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-surface hover:bg-bg-surface-hover transition-colors"
          aria-label="Open theme selector"
          aria-expanded={isMobileDropdownOpen}
          aria-haspopup="listbox"
          onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
        >
          <span className={`theme-pill-icon theme-${theme}`} style={{ width: 20, height: 20 }} aria-hidden="true" />
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
                  <span className={`theme-pill-icon theme-${t}`} aria-hidden="true" />
                  <span>{meta.name}</span>
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
    </>
  );
}