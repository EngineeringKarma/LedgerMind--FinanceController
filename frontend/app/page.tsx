"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeSelector from "@/components/ThemeSelector";

const pillars = [
  {
    number: "01",
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
    number: "02",
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
    number: "03",
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

const agents = [
  { name: "Claude Code", status: "ready", icon: "cc" },
  { name: "Codex", status: "ready", icon: "cx" },
  { name: "Antigravity", status: "ready", icon: "ag" },
  { name: "OpenCode", status: "setup", icon: "oc" },
  { name: "Hermes", status: "setup", icon: "hr" },
  { name: "Kimi", status: "setup", icon: "km" },
];

const previewMetrics = [
  { label: "Revenue", value: "₹18,23,456", trend: "+12.3%", positive: true },
  { label: "Gateway Fees", value: "₹45,678", trend: "-2.1%", positive: true },
  { label: "Net Settled", value: "₹12,45,678", trend: "+8.7%", positive: true },
];

const socialProof = [
  { label: "Transactions processed", value: "10,000+" },
  { label: "Categorization accuracy", value: "99.2%" },
  { label: "Avg processing time", value: "< 2s" },
  { label: "Businesses using LedgerMind", value: "50+" },
];

const downloadOptions = [
  {
    platform: "macOS 13+",
    label: "Apple Silicon",
    url: "https://github.com/mrdainami/nami/releases/latest/download/Nami-arm64.dmg",
    icon: "🍎",
  },
  {
    platform: "macOS 13+",
    label: "Intel",
    url: "https://github.com/mrdainami/nami/releases/latest/download/Nami-x64.dmg",
    icon: "🍎",
  },
  {
    platform: "Windows 10+",
    label: "x64",
    url: "https://github.com/mrdainami/nami/releases/latest/download/Nami-Setup-x64.exe",
    icon: "🪟",
  },
  {
    platform: "Windows 10+",
    label: "Arm64",
    url: "https://github.com/mrdainami/nami/releases/latest/download/Nami-Setup-arm64.exe",
    icon: "🪟",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setEmailStatus("error");
      return;
    }
    setEmailStatus("success");
    setEmail("");
    setTimeout(() => setEmailStatus("idle"), 3000);
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Navbar */}
      <header className="navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight font-display">LedgerMind</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              How it works
            </a>
            <a href="#themes" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Themes
            </a>
            <ThemeSelector variant="pills" />
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

              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight font-display">
                Your financial{" "}
                <span className="gradient-text">workspace</span>{" "}
                for the agent era
              </h1>

              <p className="text-lg text-text-muted mb-10 max-w-xl">
                Upload settlements. Watch AI categorize every transaction. Get P&L, trends, and anomalies — all at once. Choose your theme.
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
                <span>Toggle theme</span>
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

              {/* Theme indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-dim">
                <span>Current theme:</span>
                <span className="font-mono font-medium text-accent" id="current-theme-display">Light</span>
                <span className="text-text-dim">(hover a theme card to preview)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="features" className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="feature-card card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-accent/20" />
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-6">
                  {pillar.icon}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-text-muted mb-2">
                  <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-mono font-bold">
                    {pillar.number}
                  </span>
                  <span className="uppercase tracking-wide">{pillar.title}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-display">{pillar.number}</h3>
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
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
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
                  <h3 className="text-lg font-semibold font-display">{item.title}</h3>
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

      {/* Why It Exists - Founder Story */}
      <section id="why" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6 font-display">
                The finance controller I wish I had.
              </h2>
              <p className="text-lg text-text-muted mb-6 leading-relaxed">
                Just like most people, I was never a finance expert. Then AI agents changed what one person can do.
                Today they categorize my transactions, draft my reports, flag anomalies, and run my month-end close
                while I direct. LedgerMind is the workspace I built to work that way. I&apos;m giving it away because
                more people should get to build like this.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Prathamesh</p>
                  <p className="text-xs text-text-muted">founder, LedgerMind</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-lg font-semibold mb-6">Every source, one place</h3>
              <div className="space-y-3">
                {["Razorpay", "PayU", "CCAvenue", "Stripe", "Custom CSV"].map((source) => (
                  <div key={source} className="flex items-center justify-between p-3 bg-bg-base border border-border rounded-lg">
                    <span className="font-medium">{source}</span>
                    <span className="text-xs text-state-verified font-mono">● Ready</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Every Agent, One Place */}
      <section id="agents" className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
              Every agent, one place
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Run any of the top agents in one click. No more downloading ten different tools only to switch again next week.
              A better agent ships next month? Swap it in a click and keep working. Never locked in, never left behind.
            </p>
          </div>

          <div className="agent-grid">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className={`agent-card ${agent.status === "setup" ? "off" : ""}`}
              >
                <div className="agent-icon">
                  <span className="text-2xl font-bold text-accent">{agent.icon}</span>
                </div>
                <div className="agent-name">{agent.name}</div>
                <div className={`agent-status ${agent.status === "setup" ? "off" : ""}`}>
                  <i />
                  {agent.status === "ready" ? "Ready" : "One-click setup"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All At Once - Parallel Panes */}
      <section id="parallel" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
              All at once
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              A morning of work in the time one job used to take. Every job runs in its own pane, all at the same time.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-4">
            {[
              { agent: "Claude Code", goal: "Rewrite onboarding emails", lines: ["Read 8 drafts", "Match house voice", "Save all 8 to drafts"], status: "done" },
              { agent: "Codex", goal: "Ship pricing page", lines: ["Read approved copy", "Build section", "Push live"], status: "done" },
              { agent: "Hermes", goal: "Sort invoice folder", lines: ["Find every PDF", "Read 214 totals", "File by date & client"], status: "done" },
              { agent: "Kimi", goal: "Write October plan", lines: ["Read 14 notes", "Rank by revenue", "Write plan"], status: "done" },
            ].map((pane, i) => (
              <div key={i} className="pane">
                <div className="pane-header">
                  <span className="pane-title">{pane.agent}</span>
                  <span className={`pane-status ${pane.status === "done" ? "" : "working"}`}>
                    <span className="dot" />
                    {pane.status === "done" ? "Completed" : "Working"}
                  </span>
                </div>
                <div className="pane-content">
                  <b className="goal text-text-primary block mb-3">{pane.goal}</b>
                  <div className="pane-lines">
                    {pane.lines.map((line, li) => (
                      <div key={li} className="pane-line flex items-center gap-2">
                        <svg className="w-4 h-4 text-state-verified flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Make It Yours - Agent Builder */}
      <section id="customize" className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
              Make it yours
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Describe an agent. Get an agent. Say what you want in plain words, like &ldquo;read my week of notes and write the Friday client update.&rdquo;
              Seconds later it&apos;s on your shelf, ready to run.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Describe your agent
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors font-body"
                  rows={3}
                  placeholder="Read my week of notes and write the Friday update, in my voice."
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
                >
                  Create Agent
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Themes Showcase Section */}
      <section id="themes" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
              Two themes. One workflow.
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Light for clarity, Dark for focus. Switch instantly — your data, your agents, your preferences stay exactly where they are.
            </p>
          </div>

          <ThemeSelector variant="cards" />
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
              Put it on your desk.
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              One download. Your first job running in sixty seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {downloadOptions.map((opt) => (
              <a
                key={opt.label}
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-6 card-hover text-left group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <h3 className="font-semibold">{opt.platform}</h3>
                    <p className="text-xs text-text-muted">{opt.label}</p>
                  </div>
                </div>
                <div className="text-sm text-text-muted">
                  <p className="font-medium mb-1">Download for {opt.label}</p>
                  <p className="text-xs text-text-dim">One click install</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-12 max-w-2xl mx-auto text-center text-sm text-text-muted space-y-2">
            <p>Your files never leave your computer</p>
            <p>Works with the subscriptions you already pay for</p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 font-display">
            Want to hear when LedgerMind gets something new?
          </h2>
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg bg-bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors"
                disabled={emailStatus === "success"}
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
                disabled={emailStatus === "success"}
              >
                {emailStatus === "success" ? "Subscribed!" : "Keep me posted"}
              </button>
            </div>
            {emailStatus === "success" && (
              <p className="mt-3 text-sm text-state-verified">Got it. You&apos;re on the list.</p>
            )}
            {emailStatus === "error" && (
              <p className="mt-3 text-sm text-state-anomaly">Please enter a valid email.</p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
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
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}