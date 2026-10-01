import type { Metadata } from "next";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export const metadata: Metadata = {
    title: "Design System Review — LedgerMind",
    description: "Dev-only token, typography, and component gallery",
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: "100dvh", background: "var(--color-bg-base)" }}>
            {/* Standalone topbar — no auth, no sidebar, pure review chrome */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    background: "color-mix(in srgb, var(--color-bg-surface) 92%, transparent)",
                    backdropFilter: "blur(8px)",
                    borderBottom: "var(--border-weight) solid var(--color-border)",
                    height: "52px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 var(--sp-lg)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
                    {/* Wordmark */}
                    <span
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: "var(--color-accent)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        LedgerMind
                    </span>
                    <span
                        style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--color-text-dim)",
                            background: "var(--color-bg-well)",
                            border: "var(--border-weight) solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "2px 6px",
                        }}
                    >
                        Design Route
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                        ⌘K command palette
                    </span>
                    <ThemeSwitcher />
                </div>
            </div>

            {children}
        </div>
    );
}
