"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ─── ⌘K Command Palette ────────────────────────────────────────────────────
   Registered globally — ⌘K (Mac) or Ctrl+K (Win/Linux) opens the palette.
   ⌘K is RESERVED exclusively for this palette — no other feature may claim it.
   Theme switching uses the ThemeSwitcher UI component in the topbar, not ⌘K.
   ─────────────────────────────────────────────────────────────────────────── */

interface PaletteAction {
    id: string;
    label: string;
    category: string;
    path?: string;
    hint?: string;
}

const ACTIONS: PaletteAction[] = [
    /* Navigation */
    { id: "nav-dashboard", label: "Go to Dashboard", category: "Navigate", path: "/dashboard", hint: "↵" },
    { id: "nav-uploads", label: "Go to Uploads", category: "Navigate", path: "/uploads", hint: "↵" },
    { id: "nav-categorize", label: "Go to Categorize", category: "Navigate", path: "/categorize", hint: "↵" },
    { id: "nav-reconcile", label: "Go to Reconcile", category: "Navigate", path: "/reconcile", hint: "↵" },
    { id: "nav-fees", label: "Go to Fees & Tax", category: "Navigate", path: "/fees", hint: "↵" },
    { id: "nav-reports", label: "Go to Reports", category: "Navigate", path: "/reports", hint: "↵" },
    { id: "nav-auditlog", label: "Go to Audit Log", category: "Navigate", path: "/audit-log", hint: "↵" },
    { id: "nav-settings", label: "Go to Settings", category: "Navigate", path: "/settings", hint: "↵" },
    /* Actions */
    { id: "act-upload", label: "Upload CSV →", category: "Actions", path: "/uploads", hint: "⌘U" },
    { id: "act-categorize", label: "Run Categorization →", category: "Actions", path: "/categorize", hint: "⌘R" },
    { id: "act-reconcile", label: "Run Reconcile →", category: "Actions", path: "/reconcile", hint: "⌘⇧R" },
    /* Dev */
    { id: "dev-design", label: "Open Design Route →", category: "Dev", path: "/design", hint: "" },
];

export default function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setSelected(0);
    }, []);

    /* Register ⌘K / Ctrl+K globally */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape" && open) close();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, close]);

    /* Focus input when opened */
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    const filtered = ACTIONS.filter(
        (a) =>
            !query ||
            a.label.toLowerCase().includes(query.toLowerCase()) ||
            a.category.toLowerCase().includes(query.toLowerCase())
    );

    /* Group by category */
    const categories = Array.from(new Set(filtered.map((a) => a.category)));

    const allItems = filtered; // flat list for keyboard nav

    const fire = useCallback(
        (action: PaletteAction) => {
            close();
            if (action.path) router.push(action.path);
        },
        [close, router]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((s) => Math.min(s + 1, allItems.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
        }
        if (e.key === "Enter" && allItems[selected]) {
            fire(allItems[selected]);
        }
        if (e.key === "Escape") close();
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="command-palette-backdrop"
                onClick={close}
                aria-hidden="true"
            />

            {/* Palette */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="command-palette"
            >
                <input
                    ref={inputRef}
                    id="command-palette-input"
                    type="text"
                    className="command-palette-input"
                    placeholder="Search actions or jump to a section…"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                />

                <div
                    ref={listRef}
                    className="command-palette-list"
                    role="listbox"
                    aria-label="Actions"
                >
                    {filtered.length === 0 && (
                        <div style={{ padding: "var(--sp-md)", color: "var(--color-text-dim)", fontSize: "0.875rem", textAlign: "center" }}>
                            No matching actions
                        </div>
                    )}

                    {categories.map((cat) => {
                        const items = filtered.filter((a) => a.category === cat);
                        return (
                            <div key={cat}>
                                <div
                                    style={{
                                        padding: "var(--sp-xs) var(--sp-md)",
                                        fontSize: "0.625rem",
                                        fontWeight: 600,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "var(--color-text-dim)",
                                        marginTop: "var(--sp-xs)",
                                    }}
                                >
                                    {cat}
                                </div>
                                {items.map((action) => {
                                    const idx = allItems.indexOf(action);
                                    return (
                                        <button
                                            key={action.id}
                                            id={`palette-${action.id}`}
                                            role="option"
                                            aria-selected={idx === selected}
                                            className={`command-palette-item ${idx === selected ? "selected" : ""}`}
                                            onClick={() => fire(action)}
                                            onMouseEnter={() => setSelected(idx)}
                                        >
                                            <span>{action.label}</span>
                                            {action.hint && (
                                                <span className="command-palette-item-hint">{action.hint}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div
                    style={{
                        padding: "var(--sp-xs) var(--sp-md)",
                        borderTop: "var(--border-weight) solid var(--color-border)",
                        display: "flex",
                        gap: "var(--sp-md)",
                        fontSize: "0.6875rem",
                        color: "var(--color-text-dim)",
                    }}
                >
                    <span><kbd style={{ fontFamily: "inherit" }}>↑↓</kbd> navigate</span>
                    <span><kbd style={{ fontFamily: "inherit" }}>↵</kbd> open</span>
                    <span><kbd style={{ fontFamily: "inherit" }}>Esc</kbd> close</span>
                </div>
            </div>
        </>
    );
}
