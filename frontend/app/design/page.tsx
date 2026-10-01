"use client";

import { useState } from "react";
import { THEME_META, THEME_LIST, Theme } from "@/components/ThemeProvider";

/* ─── Section heading ──────────────────────────────────────────────────────── */
function SectionHeading({ n, title }: { n: string; title: string }) {
    return (
        <div style={{ marginBottom: "var(--sp-lg)", paddingBottom: "var(--sp-sm)", borderBottom: "var(--border-weight) solid var(--color-border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--color-accent)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>§{n}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>{title}</h2>
        </div>
    );
}

/* ─── Token swatch ─────────────────────────────────────────────────────────── */
function TokenSwatch({ name, value, css }: { name: string; value?: string; css: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)", padding: "var(--sp-xs) 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: `var(${css})`, border: "var(--border-weight) solid var(--color-border)", flexShrink: 0 }} />
            <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-primary)" }}>{css}</div>
                {value && <div style={{ fontSize: "0.6875rem", color: "var(--color-text-dim)" }}>{value}</div>}
            </div>
        </div>
    );
}

/* ─── Specimen card wrapper ─────────────────────────────────────────────── */
function SpecimenCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="card card-padded" style={{ marginBottom: "var(--sp-md)" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: "var(--sp-sm)" }}>{title}</div>
            {children}
        </div>
    );
}

/* ─── Theme matrix card ─────────────────────────────────────────────────── */
function ThemeMatrixCard({ id }: { id: Theme }) {
    const meta = THEME_META[id];
    const swatchBg: Record<Theme, string> = {
        vault: "#0F1B2D", midnight: "#111827", ledger: "#F8F9FA", audit: "#FFFFFF",
    };
    const swatchAccent: Record<Theme, string> = {
        vault: "#C98A3E", midnight: "#B88A3A", ledger: "#A07030", audit: "#8B5E20",
    };
    return (
        <div className="card card-padded" style={{ flex: 1, minWidth: 140 }}>
            <div style={{ width: "100%", height: 56, borderRadius: "var(--radius-md)", background: swatchBg[id], border: "var(--border-weight) solid var(--color-border)", marginBottom: "var(--sp-sm)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: swatchAccent[id] }} />
                <div style={{ width: 24, height: 4, borderRadius: 2, background: `${swatchAccent[id]}55` }} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>{meta.name}</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 2 }}>{meta.description}</div>
            <div style={{ display: "flex", gap: 4, marginTop: "var(--sp-sm)" }}>
                {meta.axis.map((a) => (
                    <span key={a} style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", background: "var(--color-bg-well)", border: "var(--border-weight) solid var(--color-border)", borderRadius: "var(--radius-xs)", padding: "2px 5px", color: "var(--color-text-dim)" }}>{a}</span>
                ))}
            </div>
        </div>
    );
}

/* ─── Static live-task-pane specimen ────────────────────────────────────── */
const JOB_STEPS = [
    { id: "upload", label: "CSV uploaded — 247 rows parsed", state: "done" },
    { id: "rules", label: "Rule-based pre-classification", state: "done" },
    { id: "llm", label: "LLM batch categorization (batch 3/6)", state: "active" },
    { id: "report", label: "Report generation", state: "pending" },
];

function CheckIcon({ filled }: { filled: boolean }) {
    if (filled) return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="var(--color-verified)" fillOpacity=".15" stroke="var(--color-verified)" strokeWidth="1.25" />
            <path d="M5 8l2.2 2.2L11 6" stroke="var(--color-verified)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="var(--color-border)" strokeWidth="1.25" />
        </svg>
    );
}

export default function DesignPage() {
    const [stampRevealed, setStampRevealed] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);

    return (
        <main style={{ padding: "var(--sp-lg)", maxWidth: 1100, margin: "0 auto" }}>

            {/* ── § 01  Theme System ────────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="01" title="Theme System — 2×2 Matrix" />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "var(--sp-lg)", maxWidth: 640 }}>
                    Use the switcher in the topbar to cycle all 4 themes. The switch is instant (CSS variable + <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>data-theme</code> on <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>&lt;html&gt;</code>), with no page reload. FOUC guard in layout reads localStorage before first paint.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--sp-md)" }}>
                    {THEME_LIST.map((id) => <ThemeMatrixCard key={id} id={id} />)}
                </div>
                <div style={{ marginTop: "var(--sp-md)", fontSize: "0.8125rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    Density axis: <strong style={{ color: "var(--color-text-primary)" }}>Dense</strong> (Vault + Audit) — tighter padding, smaller radius, hairline borders<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong style={{ color: "var(--color-text-primary)" }}>Airy</strong>  (Midnight + Ledger) — generous whitespace, softer corners, same tokens
                </div>
            </div>

            {/* ── § 02  Color Tokens ───────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="02" title="Color Tokens (live — change theme to see)" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--sp-md)" }}>
                    <SpecimenCard title="Backgrounds">
                        <TokenSwatch css="--color-bg-base" name="bg-base" />
                        <TokenSwatch css="--color-bg-surface" name="bg-surface" />
                        <TokenSwatch css="--color-bg-surface-hover" name="bg-surface-hover" />
                        <TokenSwatch css="--color-bg-elevated" name="bg-elevated" />
                        <TokenSwatch css="--color-bg-well" name="bg-well" />
                    </SpecimenCard>
                    <SpecimenCard title="Text">
                        <div style={{ padding: "var(--sp-xs) 0", fontFamily: "var(--font-display)", fontSize: "0.9375rem", color: "var(--color-text-primary)", fontWeight: 600 }}>text-primary</div>
                        <div style={{ padding: "var(--sp-xs) 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>text-muted</div>
                        <div style={{ padding: "var(--sp-xs) 0", fontSize: "0.875rem", color: "var(--color-text-dim)" }}>text-dim</div>
                    </SpecimenCard>
                    <SpecimenCard title="Accent — Brass">
                        <TokenSwatch css="--color-accent" name="accent" />
                        <TokenSwatch css="--color-accent-hover" name="accent-hover" />
                        <TokenSwatch css="--color-accent-deep" name="accent-deep" />
                        <TokenSwatch css="--color-accent-dim" name="accent-dim" />
                    </SpecimenCard>
                    <SpecimenCard title="State">
                        <TokenSwatch css="--color-verified" name="verified" />
                        <TokenSwatch css="--color-anomaly" name="anomaly" />
                        <TokenSwatch css="--color-pending" name="pending" />
                    </SpecimenCard>
                    <SpecimenCard title="Borders">
                        <TokenSwatch css="--color-border" name="border" />
                        <TokenSwatch css="--color-border-subtle" name="border-subtle" />
                        <TokenSwatch css="--color-hairline" name="hairline" />
                    </SpecimenCard>
                </div>
            </div>

            {/* ── § 03  Typography ─────────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="03" title="Typography" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)" }}>
                    <SpecimenCard title="Space Grotesk — UI chrome, headers">
                        {[["400", "Transaction categorized successfully"], ["500", "Revenue ₹18,23,456.00"], ["600", "Audit Log — September 2026"], ["700", "LedgerMind Dashboard"]].map(([w, t]) => (
                            <div key={w} style={{ marginBottom: "var(--sp-sm)", fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: Number(w), color: "var(--color-text-primary)" }}>
                                <span style={{ fontSize: "0.625rem", color: "var(--color-text-dim)", fontWeight: 400, marginRight: 8, fontFamily: "var(--font-mono)" }}>{w}</span>{t}
                            </div>
                        ))}
                    </SpecimenCard>
                    <SpecimenCard title="JetBrains Mono — amounts, IDs, timestamps">
                        {[["400", "txn_MZk3Xy9pQr"], ["500", "₹1,84,23,456.00"], ["600", "2026-09-24T14:31:24+05:30"]].map(([w, t]) => (
                            <div key={w} style={{ marginBottom: "var(--sp-sm)", fontFamily: "var(--font-mono)", fontSize: "0.9375rem", fontWeight: Number(w), color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ fontSize: "0.625rem", color: "var(--color-text-dim)", fontWeight: 400, marginRight: 8 }}>{w}</span>{t}
                            </div>
                        ))}
                        <div style={{ marginTop: "var(--sp-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "right" }}>
                                {["₹1,23,456.00", "₹98,765.43", "₹1,00,000.00",
                                    "₹     456.78", "₹  8,901.23", "₹    123.45"].map((v) => (
                                        <span key={v} style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
                                    ))}
                            </div>
                            <div style={{ marginTop: 4, fontSize: "0.5625rem", color: "var(--color-text-dim)" }}>↑ tabular figures keep amounts column-aligned</div>
                        </div>
                    </SpecimenCard>
                </div>
            </div>

            {/* ── § 04  Spacing + Radius ────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="04" title="Spacing & Radius (structural — varies by density)" />
                <SpecimenCard title="Spacing scale (--sp-*)">
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--sp-md)", flexWrap: "wrap" }}>
                        {["xs", "sm", "md", "lg", "xl", "2xl"].map((s) => (
                            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ width: `var(--sp-${s})`, height: `var(--sp-${s})`, background: "var(--color-accent-dim)", border: "var(--border-weight) solid var(--color-accent)", borderRadius: 2 }} />
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--color-text-dim)" }}>--sp-{s}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "var(--sp-sm)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Switch to a dense theme (Vault/Audit) to see smaller boxes — same tokens, different resolved values.
                    </div>
                </SpecimenCard>
                <SpecimenCard title="Border radius (--radius-*)">
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--sp-md)", flexWrap: "wrap" }}>
                        {["xs", "sm", "md", "lg"].map((r) => (
                            <div key={r} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 48, height: 48, background: "var(--color-accent-dim)", border: "var(--border-weight) solid var(--color-accent)", borderRadius: `var(--radius-${r})` }} />
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--color-text-dim)" }}>--radius-{r}</span>
                            </div>
                        ))}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 48, height: 28, background: "var(--color-accent-dim)", border: "var(--border-weight) solid var(--color-accent)", borderRadius: "var(--radius-pill)" }} />
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "var(--color-text-dim)" }}>--radius-pill</span>
                        </div>
                    </div>
                </SpecimenCard>
            </div>

            {/* ── § 05  Components ─────────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="05" title="Component Gallery" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-md)" }}>

                    {/* Buttons */}
                    <SpecimenCard title="Buttons">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-sm)", alignItems: "center" }}>
                            <button className="btn btn-primary">Primary action</button>
                            <button className="btn btn-secondary">Secondary</button>
                            <button className="btn btn-ghost">Ghost</button>
                            <button className="btn btn-danger">Delete</button>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-sm)", alignItems: "center", marginTop: "var(--sp-sm)" }}>
                            <button className="btn btn-primary btn-sm">Small primary</button>
                            <button className="btn btn-secondary btn-sm">Small sec.</button>
                            <button className="btn btn-primary" disabled>Disabled</button>
                        </div>
                    </SpecimenCard>

                    {/* Badges */}
                    <SpecimenCard title="Badges / Stamps">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-sm)", alignItems: "center" }}>
                            <span className="badge badge-verified stamp-reveal" style={{ animationDelay: "0.1s" }}>✓ Verified</span>
                            <span className="badge badge-review">⚑ Needs Review</span>
                            <span className="badge badge-anomaly">⚠ Anomaly</span>
                            <span className="badge badge-accent">Gateway Fees</span>
                        </div>
                        <div style={{ marginTop: "var(--sp-sm)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Verified badge uses stamp-reveal animation on entry. Review badge uses dashed border to signal "not finalised."
                        </div>
                    </SpecimenCard>

                    {/* KPI Cards */}
                    <SpecimenCard title="KPI Cards">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-sm)" }}>
                            <div className="kpi-card">
                                <div className="kpi-label">Revenue</div>
                                <div className="kpi-value">₹18.2L</div>
                                <div className="kpi-trend up">↑ 12.4%</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">Gateway Fees</div>
                                <div className="kpi-value">₹45,678</div>
                                <div className="kpi-trend down">↑ 3.2% (higher)</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-label">Net Settled</div>
                                <div className="kpi-value">₹12.4L</div>
                                <div className="kpi-trend up">↑ 8.1%</div>
                            </div>
                        </div>
                    </SpecimenCard>

                    {/* Status dots */}
                    <SpecimenCard title="Status Indicators">
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
                            {[
                                { state: "running", label: "Categorization running" },
                                { state: "verified", label: "Reconciliation matched" },
                                { state: "anomaly", label: "Fee spike detected" },
                                { state: "pending", label: "Awaiting review" },
                                { state: "idle", label: "No active job" },
                            ].map(({ state, label }) => (
                                <div key={state} style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                                    <span className={`status-dot ${state}`} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </SpecimenCard>

                    {/* Ledger table */}
                    <SpecimenCard title="Ledger Table — Stamp Reveal on click">
                        <div style={{ overflow: "hidden", borderRadius: "var(--radius-md)", border: "var(--border-weight) solid var(--color-border)" }}>
                            <table className="ledger-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th className="col-amount">Amount</th>
                                        <th>Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: "txn_MZk3X", desc: "MDR charges for UPI transaction", type: "fee", amt: "-₹142.50", cat: "Gateway Fees", state: "verified" },
                                        { id: "txn_AbC7Y", desc: "Adjustment - Ref #3391", type: "refund", amt: "-₹2,400.00", cat: "Needs Review", state: "review" },
                                        { id: "txn_PqR9Z", desc: "Customer payment - Invoice #6649", type: "payment", amt: "+₹33,022.40", cat: "Revenue", state: "verified" },
                                    ].map((row) => (
                                        <tr key={row.id}>
                                            <td className="col-id">{row.id}</td>
                                            <td style={{ color: "var(--color-text-primary)" }}>{row.desc}</td>
                                            <td><span className="badge badge-accent" style={{ fontSize: "0.6875rem" }}>{row.type}</span></td>
                                            <td className="col-amount" style={{ color: row.amt.startsWith("-") ? "var(--color-anomaly)" : "var(--color-verified)" }}>{row.amt}</td>
                                            <td>
                                                <span
                                                    className={`badge ${row.state === "verified" ? "badge-verified" : "badge-review"} ${stampRevealed ? "stamp-reveal" : ""}`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => setStampRevealed(true)}
                                                >
                                                    {row.cat}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: "var(--sp-sm)" }} onClick={() => setStampRevealed(false)}>
                            ↺ Reset stamp animation
                        </button>
                    </SpecimenCard>

                    {/* Upload zone */}
                    <SpecimenCard title="Upload Zone">
                        <div className="upload-zone">
                            <div style={{ fontSize: "1.5rem", marginBottom: "var(--sp-sm)" }}>📑</div>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Drop settlement CSV here</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>or click to select — max 10 MB</div>
                        </div>
                    </SpecimenCard>

                    {/* Input */}
                    <SpecimenCard title="Form Input">
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
                            <input className="input" placeholder="Search transactions…" />
                            <input className="input" defaultValue="txn_MZk3Xy9pQr" style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }} />
                        </div>
                    </SpecimenCard>

                </div>
            </div>

            {/* ── § 06  Live Task Pane ──────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="06" title="Live Task Pane — Categorization Job" />
                <div style={{ maxWidth: 400 }}>
                    <div className="task-pane">
                        <div className="task-pane-header">
                            <span className="status-dot running" />
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>Categorization Job</span>
                            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>3 / 6 batches</span>
                        </div>
                        <div className="task-pane-steps">
                            {JOB_STEPS.map((step) => (
                                <div key={step.id} className={`task-step ${step.state}`}>
                                    <span className="task-step-icon">
                                        {step.state === "done" && <CheckIcon filled={true} />}
                                        {step.state === "active" && <span className="status-dot running" style={{ marginTop: 4 }} />}
                                        {step.state === "pending" && <CheckIcon filled={false} />}
                                    </span>
                                    <span>{step.label}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: "var(--sp-sm) var(--sp-md)", borderTop: "var(--border-weight) solid var(--color-border)", display: "flex", gap: "var(--sp-sm)" }}>
                            <button className="btn btn-ghost btn-sm">Cancel</button>
                            <button className="btn btn-secondary btn-sm" disabled>View Results</button>
                        </div>
                    </div>
                    <div style={{ marginTop: "var(--sp-sm)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        This pattern maps to the backend <code style={{ fontFamily: "var(--font-mono)" }}>GET /jobs/{"{job_id}"}</code> polling endpoint. Steps come from real job status.
                    </div>
                </div>
            </div>

            {/* ── § 07  Command Palette ─────────────────────────────────────────── */}
            <div style={{ marginBottom: "var(--sp-2xl)" }}>
                <SectionHeading n="07" title="Command Palette (⌘K)" />
                <SpecimenCard title="Static specimen — press ⌘K anywhere on this page">
                    <div style={{ position: "relative" }}>
                        {/* Static mock of the palette UI */}
                        <div
                            style={{
                                border: "var(--border-weight) solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                overflow: "hidden",
                                boxShadow: "var(--shadow-lg)",
                                maxWidth: 520,
                            }}
                        >
                            <input
                                className="command-palette-input"
                                placeholder="Search actions or jump to a section…"
                                style={{ pointerEvents: "none" }}
                                readOnly
                            />
                            <div style={{ padding: "var(--sp-xs) 0", borderBottom: "var(--border-weight) solid var(--color-border)" }}>
                                <div style={{ padding: "var(--sp-xs) var(--sp-md)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)" }}>Navigate</div>
                                {["Dashboard", "Categorize", "Audit Log", "Settings"].map((label, i) => (
                                    <div key={label} className={`command-palette-item ${i === 0 ? "selected" : ""}`} style={{ pointerEvents: "none" }}>
                                        <span>{`Go to ${label}`}</span>
                                        <span className="command-palette-item-hint">↵</span>
                                    </div>
                                ))}
                                <div style={{ padding: "var(--sp-xs) var(--sp-md)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)", marginTop: "var(--sp-xs)" }}>Actions</div>
                                {["Upload CSV →", "Run Categorization →"].map((label) => (
                                    <div key={label} className="command-palette-item" style={{ pointerEvents: "none" }}>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: "var(--sp-xs) var(--sp-md)", display: "flex", gap: "var(--sp-md)", fontSize: "0.6875rem", color: "var(--color-text-dim)" }}>
                                <span>↑↓ navigate</span>
                                <span>↵ open</span>
                                <span>Esc close</span>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--sp-md)" }} onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }); document.dispatchEvent(e); }}>
                        Open live palette (⌘K)
                    </button>
                </SpecimenCard>
            </div>

        </main>
    );
}
