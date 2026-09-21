"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    title: "AI Categorization",
    description: "Automatically categorize transactions using advanced LLM models with 99.2% accuracy.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    title: "Real-time Analytics",
    description: "Interactive dashboards with P&L statements, trend analysis, and category breakdowns.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Anomaly Detection",
    description: "Identify suspicious transactions and unusual patterns before they become problems.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    title: "Multi-source Import",
    description: "Import settlement data from Razorpay, PayU, CCAvenue, and custom CSV formats.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

const stats = [
  { value: "10,000+", label: "Transactions Processed" },
  { value: "99.2%", label: "Categorization Accuracy" },
  { value: "<2s", label: "Average Processing Time" },
  { value: "50+", label: "Happy Businesses" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Navbar */}
      <header className="navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-stamp flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">LedgerMind</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#stats" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              About
            </a>
            <ThemeToggle />
            <Link
              href="/signin"
              className="px-4 py-2 rounded-lg bg-accent-stamp text-white text-sm font-medium hover:bg-accent-stamp-hover transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-stamp/10 border border-accent-stamp/20 text-accent-stamp-hover text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Finance
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Smart Transaction{" "}
              <span className="gradient-text">Categorization</span>{" "}
              for Modern Businesses
            </h1>

            <p className="text-lg text-text-muted mb-8 max-w-2xl">
              Automate your financial reporting with AI that understands your transactions.
              Upload settlement data, let LedgerMind categorize and analyze it, and get
              actionable insights in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signin"
                className="px-6 py-3 rounded-lg bg-accent-stamp text-white font-medium hover:bg-accent-stamp-hover transition-colors text-center"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="px-6 py-3 rounded-lg border border-border text-text-primary font-medium hover:bg-bg-surface-hover transition-colors text-center"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-state-verified/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-state-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">1,247 transactions categorized</p>
                  <p className="text-xs text-text-muted">Razorpay Settlement - Sep 2024</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold font-mono tabular-nums">₹12,45,678</p>
                  <p className="text-xs text-state-verified">+12.3% from last month</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Revenue", value: "₹18,23,456", color: "text-state-verified" },
                  { label: "Fees", value: "₹45,678", color: "text-state-anomaly" },
                  { label: "Refunds", value: "₹12,345", color: "text-state-pending" },
                  { label: "Net", value: "₹12,45,678", color: "text-accent-stamp-hover" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-bg-base/50">
                    <p className="text-xs text-text-muted mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold font-mono tabular-nums ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything you need to manage finances
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              From automated categorization to intelligent anomaly detection,
              LedgerMind gives you complete control over your financial data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card card-hover">
                <div className="w-12 h-12 rounded-lg bg-accent-stamp/10 flex items-center justify-center text-accent-stamp-hover mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-bg-surface">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to automate your finances?
          </h2>
          <p className="text-text-muted mb-8">
            Join thousands of businesses using LedgerMind to streamline their
            financial operations. Start your free trial today.
          </p>
          <Link
            href="/signin"
            className="inline-flex px-8 py-3 rounded-lg bg-accent-stamp text-white font-medium hover:bg-accent-stamp-hover transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-stamp flex items-center justify-center">
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
