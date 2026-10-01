"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

/* ─── Theme type: 2×2 system ─────────────────────────────────────────────
   vault    = dark  + dense  (default — primary brand identity)
   midnight = dark  + airy
   ledger   = light + airy
   audit    = light + dense
   ────────────────────────────────────────────────────────────────────────── */
export type Theme = "vault" | "midnight" | "ledger" | "audit";

export const THEME_LIST: Theme[] = ["vault", "midnight", "ledger", "audit"];

export const THEME_META: Record<
  Theme,
  { name: string; axis: [string, string]; description: string; dark: boolean; dense: boolean }
> = {
  vault: {
    name: "Vault",
    axis: ["Dark", "Dense"],
    description: "Deep navy + brass. Primary finance workspace.",
    dark: true,
    dense: true,
  },
  midnight: {
    name: "Midnight",
    axis: ["Dark", "Airy"],
    description: "Spacious dark mode — less claustrophobic for long sessions.",
    dark: true,
    dense: false,
  },
  ledger: {
    name: "Ledger",
    axis: ["Light", "Airy"],
    description: "Warm light mode — everyday bookkeeping feel.",
    dark: false,
    dense: false,
  },
  audit: {
    name: "Audit",
    axis: ["Light", "Dense"],
    description: "High-contrast, print-adjacent. Export and review mode.",
    dark: false,
    dense: true,
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

const STORAGE_KEY = "ledgermind-theme";
const DEFAULT_THEME: Theme = "vault"; // Brand default — must not change

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from storage after mount — FOUC guard in layout already set the
    // attribute so the visual is correct; we just sync React state with it.
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored && THEME_LIST.includes(stored) ? stored : DEFAULT_THEME;
    setThemeState(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((next: Theme) => {
    if (THEME_LIST.includes(next)) setThemeState(next);
  }, []);

  // Suppress children until mounted to avoid attribute mismatch
  // (FOUC guard already painted the correct theme via inline script)
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: DEFAULT_THEME, setTheme: () => { } }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}