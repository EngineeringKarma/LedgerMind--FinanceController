"use client";

import Link from "next/link";
import ThemeSelector from "@/components/ThemeSelector";

const pillars = [
  {
    title: "Every source, one ledger",
    description:
      "Import Razorpay, PayU, CCAvenue, Stripe, or custom CSV. One upload, unified schema, zero mapping headaches.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    title: "All at once",
    description:
      "Categorize 10,000 transactions in parallel batches. P&L, trends, anomalies — computed simultaneously, not sequentially.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Make it yours",
    description:
      "Train custom categories, set anomaly thresholds, define review rules. The agent learns your chart of accounts.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
  },
];

const socialProof = [
  { label: "Transactions processed", value: "10,000+" },
  { label: "Categorization accuracy", value: "99.2%" },
  { label: "Avg processing time", value: "< 2s" },
  { label: "Businesses using LedgerMind", value: "50+" },
];

const previewMetrics = [
  { label: "Revenue", value: "₹18,23,456", trend: "+12.3%", positive: true },
  { label: "Gateway Fees", value: "₹45,678", trend: "-2.1%", positive: true },
  { label: "Net Settled", value: "₹12,45,678", trend: "+8.7%", positive: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Navbar */}
      <header className="navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">LedgerMind</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              How it works
            </a>
            <a href="#desks" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Desks
            </a>
            <ThemeSelector />
            <Link
              href="/signin"
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Finance Controller
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Your financial{" "}
                <span className="gradient-text">desk</span>{" "}
                for the agent era
              </h1>

              <p className="text-lg text-text-muted mb-10 max-w-xl">
                Upload settlements. Watch AI categorize every transaction. Get P&L, trends, and anomalies — all at once. Choose your desk.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signin"
                  className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-center"
                >
                  Start Free Trial
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-bg-surface-hover transition-colors text-center"
                >
                  See How It Works
                </a>
              </div>

              {/* Keyboard hint */}
              <p className="mt-8 text-xs text-text-dim flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 text-xs bg-bg-elevated border border-border rounded font-mono">⌘K</kbd>
                <span>Cycle desks</span>
                <span className="mx-1">·</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-bg-elevated border border-border rounded font-mono">← →</kbd>
                <span>Navigate</span>
              </p>
            </div>

            {/* Right: Live Preview Mini Dashboard */}
            <div className="relative">
              <div className="glass-card rounded-2xl p-6 shadow-2xl">
                {/* Preview Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-state-verified/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-state-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">1,247 transactions categorized</p>
                      <p className="text-xs text-text-muted">Razorpay Settlement · Sep 2024</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono tabular-nums">₹12,45,678</p>
                    <p className="text-xs text-state-verified">+12.3% from last month</p>
                  </div>
                </div>

                {/* Live Metric Cards */}
                <div className="preview-dashboard mb-6">
                  {previewMetrics.map((metric) => (
                    <div key={metric.label} className="preview-card">
                      <p className="preview-label">{metric.label}</p>
                      <p className="preview-value">{metric.value}</p>
                      <p className={`preview-trend ${metric.positive ? "positive" : "negative"}`}>
                        {metric.trend} vs last month
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mini Chart Preview */}
                <div className="h-32 relative">
                  <svg viewBox="0 0 300 128" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,100 C50,80 100,60 150,50 C200,40 250,70 300,60 L300,128 L0,128 Z"
                      fill="url(#areaGradient)"
                    />
                    <path
                      d="M0,100 C50,80 100,60 150,50 C200,40 250,70 300,60"
                      stroke="var(--color-accent)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Data points */}
                    {[0, 50, 100, 150, 200, 250, 300].map((x, i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={[100, 80, 60, 50, 70, 65, 60][i]}
                        r="4"
                        fill="var(--color-bg-base)"
                        stroke="var(--color-accent)"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Desk indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-dim">
                <span>Current desk:</span>
                <span className="font-mono font-medium text-accent" id="current-desk-display">Paper</span>
                <span className="text-text-dim">(hover a pill to preview)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section (Nami-style) */}
      <section id="features" className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {pillars.map((pillar, idx) => (
              <article key={pillar.title} className="feature-card card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-accent/20" />
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-6">
                  {pillar.icon}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-text-muted mb-2">
                  <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-mono">
                    {idx + 1}
                  </span>
                  <span className="uppercase tracking-wide">{pillar.title}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{"0" + (idx + 1)}</h3>
                <p className="text-text-muted leading-relaxed">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              From upload to insight in four steps
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              No configuration required. Drop a file, watch it work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Upload", desc: "Drag any settlement CSV. Razorpay, PayU, CCAvenue, Stripe — auto-detected." },
              { step: "02", title: "Categorize", desc: "LLM processes in batches of 15. 99.2% accuracy. Confidence scores on every row." },
              { step: "03", title: "Review", desc: "Flagged items surface first. One-click approve, re-categorize, or bulk-accept." },
              { step: "04", title: "Analyze", desc: "P&L, category breakdown, monthly trends, anomaly alerts — generated instantly." },
            ].map((item) => (
              <div key={item.step} className="glass-card p-6 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-mono font-bold text-lg">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {socialProof.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold gradient-text mb-2 font-mono tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desks Showcase Section */}
      <section id="desks" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Six desks. One workflow.
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Each desk is a complete visual identity. Switch instantly — your data, your agents, your preferences stay exactly where they are.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: "paper", name: "Paper", desc: "Ink & cream — the classic ledger feel", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
              { id: "operator", name: "Operator", desc: "Dark ops — terminal aesthetic for power users", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
              { id: "glass", name: "Glass", desc: "Light & airy — clean transparency", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
              { id: "graphite", name: "Graphite", desc: "Glass at night — charcoal depth", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
              { id: "soft", name: "Soft", desc: "Off-white — warm minimalism", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
              { id: "dusk", name: "Dusk", desc: "Soft dark — lavender twilight", bg: "bg-gradient-to-br from-[var(--color-bg-base)] to-[var(--color-bg-surface)]" },
            ].map((desk) => (
              <button
                key={desk.id}
                onClick={() => {
                  // This would need theme context - simplified for showcase
                }}
                className={`glass-card p-6 card-hover text-left group ${desk.bg}`}
                style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`theme-pill-icon theme-${desk.id}`} style={{ width: 28, height: 28, borderRadius: 6 }} />
                  <div>
                    <h3 className="font-semibold">{desk.name}</h3>
                    <p className="text-xs text-text-muted">{desk.desc}</p>
                  </div>
                </div>
                <div className="preview-dashboard" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {previewMetrics.slice(0, 3).map((metric) => (
                    <div key={metric.label} className="preview-card" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                      <p className="preview-label" style={{ color: 'var(--color-text-dim)' }}>{metric.label}</p>
                      <p className="preview-value" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-data)' }}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-bg-surface">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Ready for your agent workspace?
          </h2>
          <p className="text-text-muted mb-10">
            Join thousands of businesses using LedgerMind to streamline their
            financial operations. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signin"
              className="px-8 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="https://github.com/mrdainami/nami"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-bg-surface-hover transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm text-text-muted">
                &copy; 2024 LedgerMind. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}