"use client";

import { useTheme, THEME_LIST, THEME_META, Theme } from "./ThemeProvider";

/* Swatch colors per theme — shown inline so switching is instant */
const SWATCHES: Record<Theme, string> = {
    vault: "#C98A3E",
    midnight: "#B88A3A",
    ledger: "#A07030",
    audit: "#8B5E20",
};

interface ThemeSwitcherProps {
    className?: string;
}

export default function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
    const { theme, setTheme } = useTheme();

    const handleKeyDown = (e: React.KeyboardEvent, current: Theme) => {
        const idx = THEME_LIST.indexOf(current);
        if (e.key === "ArrowRight") {
            e.preventDefault();
            setTheme(THEME_LIST[(idx + 1) % THEME_LIST.length]);
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            setTheme(THEME_LIST[(idx - 1 + THEME_LIST.length) % THEME_LIST.length]);
        }
    };

    return (
        <div
            className={`theme-switcher ${className}`}
            role="radiogroup"
            aria-label="Select theme"
        >
            {THEME_LIST.map((t) => {
                const meta = THEME_META[t];
                const isActive = theme === t;
                return (
                    <button
                        key={t}
                        id={`theme-btn-${t}`}
                        role="radio"
                        aria-checked={isActive}
                        aria-label={`${meta.name} theme — ${meta.description}`}
                        className={`theme-switcher-btn ${isActive ? "active" : ""}`}
                        onClick={() => setTheme(t)}
                        onKeyDown={(e) => handleKeyDown(e, t)}
                        tabIndex={isActive ? 0 : -1}
                    >
                        <span
                            className="theme-swatch"
                            style={{ background: SWATCHES[t] }}
                            aria-hidden="true"
                        />
                        {meta.name}
                    </button>
                );
            })}
        </div>
    );
}
