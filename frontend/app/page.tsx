"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme, THEME_LIST, THEME_META } from "@/components/ThemeProvider";

/* Sample folio shown in the hero sheet. Deliberately messy descriptions,
   the way real Razorpay settlements arrive. */
const heroRows = [
  { id: "txn_MZk3Xy9p", date: "2026-07-14", who: "Flipkart Online Services", amount: "₹15,000.00", category: "Revenue", sub: "Product sales", confidence: "0.94", review: false },
  { id: "txn_Q2h5Ym9u", date: "2026-07-14", who: "Razorpay MDR recovery", amount: "₹−312.40", category: "Gateway fees", sub: "Payment processing", confidence: "0.96", review: false },
  { id: "txn_UmVmIzMz", date: "2026-07-15", who: "Adjustment, ref 3391", amount: "₹−4,200.00", category: "Refunds", sub: "Full refund", confidence: "0.61", review: true },
  { id: "txn_VFNfMTIx", date: "2026-07-15", who: "HDFC T+1 settlement", amount: "₹42,180.00", category: "Payouts", sub: "T+1 settlement", confidence: "0.91", review: false },
  { id: "txn_R1NUXzA3", date: "2026-07-16", who: "GST collected, July", amount: "₹−7,560.00", category: "Tax", sub: "GST collected", confidence: "0.88", review: false },
];

const sources = [
  { name: "Razorpay", note: "Settlements and MDR lines detected automatically", state: "Ready" },
  { name: "PayU", note: "Money and payout reports map to the same ledger", state: "Ready" },
  { name: "CCAvenue", note: "Net-settlement files reconcile without mapping", state: "Ready" },
  { name: "Stripe", note: "Payout exports fold into one folio", state: "Ready" },
  { name: "Custom CSV", note: "Any file with id, date, amount and narration", state: "One-click setup" },
];

const parallelJobs = [
  { desk: "Categoriser", task: "Read the July settlement", steps: ["Parsed 1,247 rows", "Batched in groups of 15", "Stamped every row with reasoning"] },
  { desk: "Fee checker", task: "Reconcile gateway charges", steps: ["Pulled MDR per transaction", "Matched 99.1% to payout", "Flagged 11 overcharges"] },
  { desk: "Anomaly watch", task: "Scan for unusual movement", steps: ["Compared fee ratio to June", "Found refund spike on 15 July", "Wrote a plain-language note"] },
  { desk: "Reporter", task: "Draft the month-end folio", steps: ["Totalled revenue and fees", "Built category breakdown", "Exported P&L as CSV"] },
];

const steps = [
  { title: "Upload", body: "Drop any settlement CSV. Columns are detected, nothing to map." },
  { title: "Categorise", body: "The agent reads each narration in batches of 15 and stamps a category with a confidence score." },
  { title: "Review", body: "Low-confidence rows surface first. Approve one by one or accept the verified pile in bulk." },
  { title: "Report", body: "P&L, category totals, monthly trend and anomaly notes generate from the stamped folio." },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [stampedCount, setStampedCount] = useState(heroRows.length);
  const [running, setRunning] = useState(false);
  const [ruleInput, setRuleInput] = useState("");
  const [rules, setRules] = useState([
    "Narration mentions MDR goes to Gateway fees",
    "T+1 settlement lines go to Payouts",
  ]);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const runDemo = () => {
    if (running) return;
    if (timer.current) clearInterval(timer.current);
    setRunning(true);
    setStampedCount(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setStampedCount(i);
      if (i >= heroRows.length && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
      }
    }, 450);
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    const value = ruleInput.trim();
    if (!value) return;
    setRules((prev) => [value, ...prev].slice(0, 5));
    setRuleInput("");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setEmailStatus("error");
      return;
    }
    setEmailStatus("success");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">LedgerMind</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#sources" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Sources</a>
            <a href="#close" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Month-end close</a>
            <a href="#custom" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Your rules</a>
            <Link
              href="/signin"
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90"
            >
              Open the ledger
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero: copy left, live folio right */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-16 lg:pt-20">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 max-w-[38rem]">
            <p className="folio-label mb-4">Settlement folio for July 2026</p>
            <h1 className="text-4xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.05] mb-5">
              The settlement ledger that stamps itself.
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed mb-8">
              Drop a Razorpay-style CSV. LedgerMind reads every messy narration,
              stamps each row with a category and a confidence score, and drafts
              the P&amp;L while you watch. Low confidence stays outlined for review.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/signin"
                className="px-6 py-3 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white font-medium text-center hover:opacity-90"
              >
                Upload a settlement
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)] font-medium text-center hover:border-[var(--color-accent)]"
              >
                Try the sample data
              </Link>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Four desks below. Pick one and the whole page changes with it,
              filings and stamps included.
            </p>
          </div>

          {/* Live folio sheet */}
          <div className="lg:col-span-7">
            <div className="ledger-sheet">
              <div className="ledger-sheet-head">
                <div>
                  <p className="text-sm font-semibold">July settlement</p>
                  <p className="text-xs text-[var(--color-text-muted)]">1,247 rows, Razorpay format</p>
                </div>
                <button
                  onClick={runDemo}
                  disabled={running}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50"
                >
                  {running ? "Stamping…" : stampedCount >= heroRows.length ? "Run it again" : "Stamp the folio"}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
                {THEME_LIST.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className="desk-btn"
                  >
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--color-accent)" }}
                    />
                    {THEME_META[t].name}
                  </button>
                ))}
                <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                  Desk: {THEME_META[theme].name}, {THEME_META[theme].axis.join(", ").toLowerCase()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Narration</th>
                      <th className="col-amount">Amount</th>
                      <th>Stamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heroRows.slice(0, stampedCount).map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <span className="block text-sm">{row.who}</span>
                          <span className="font-data block text-xs text-[var(--color-text-muted)]">
                            {row.id} · {row.date}
                          </span>
                        </td>
                        <td className="col-amount">{row.amount}</td>
                        <td>
                          <span
                            className="stamp-reveal inline-block"
                            style={{ animationDelay: `${i * 60}ms` }}
                          >
                            <span className={row.review ? "stamp-mark stamp-review" : "stamp-mark stamp-verified"}>
                              {row.category} · {row.confidence}
                            </span>
                          </span>
                          <span className="block text-xs text-[var(--color-text-muted)] mt-1">{row.sub}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {stampedCount >= heroRows.length
                    ? "One outlined stamp needs a human. The rest are filed."
                    : "Press stamp the folio to watch each row get marked."}
                </p>
                <p className="font-data text-sm">Net ₹12,45,678</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="folio-rule max-w-6xl mx-auto" />

      {/* Why it exists */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <p className="folio-label mb-3">Why this exists</p>
            <h2 className="text-3xl font-bold tracking-tight mb-5">Month-end close without the all-nighter.</h2>
            <p className="text-[var(--color-text-muted)] leading-relaxed mb-4 max-w-[62ch]">
              Settlement files never arrive clean. A payout total hides three fee
              lines, a refund hides inside an adjustment, tax sits in a separate
              export. Somebody has to read all of it before the books close.
            </p>
            <p className="text-[var(--color-text-muted)] leading-relaxed max-w-[62ch]">
              LedgerMind does that first read. It works through ambiguous
              narrations the way a controller would, shows its reasoning and a
              confidence score per row, and leaves the uncertain ones outlined
              for you. Deterministic checks catch fee spikes and refund jumps,
              so no flag ever rests on a bare assertion.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="card card-padded">
              <p className="text-sm font-semibold mb-1">July close, at a glance</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Taken from the stamped folio above.</p>
              <dl className="divide-y divide-[var(--color-border-subtle)]">
                {[
                  ["Revenue collected", "₹18,23,456"],
                  ["Gateway fees", "₹45,678"],
                  ["Refunds out", "₹1,12,340"],
                  ["Net settled", "₹12,45,678"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-2.5">
                    <dt className="text-sm text-[var(--color-text-muted)]">{k}</dt>
                    <dd className="font-data text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Every source, one ledger */}
      <section id="sources" className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="folio-label mb-3">Sources</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Every source, one ledger.</h2>
          <p className="text-[var(--color-text-muted)] max-w-[62ch] mb-8">
            A better export ships next quarter. Swap it in and keep closing.
            Never locked to one gateway, never left re-mapping columns.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((s) => (
              <div key={s.name} className="card card-padded">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{s.name}</p>
                  <span className={s.state === "Ready" ? "badge badge-verified" : "badge badge-review"}>
                    {s.state}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.note}</p>
              </div>
            ))}
            <div className="card card-padded border-dashed">
              <p className="font-semibold mb-2">Your next gateway</p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Send a sample export. If it has an id, a date, an amount and a
                narration, it fits the folio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All at once */}
      <section id="close" className="max-w-6xl mx-auto px-6 py-16">
        <p className="folio-label mb-3">Parallel close</p>
        <h2 className="text-3xl font-bold tracking-tight mb-3">A morning of close work in the time one job took.</h2>
        <p className="text-[var(--color-text-muted)] max-w-[62ch] mb-8">
          Every job runs in its own pane at the same time. Categorising,
          fee-checking, anomaly notes and the P&amp;L draft land together.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {parallelJobs.map((job) => (
            <div key={job.desk} className="pane">
              <div className="pane-header">
                <span className="pane-title">{job.desk}</span>
                <span className="badge badge-verified">Filed</span>
              </div>
              <div className="pane-content">
                <p className="text-sm font-medium mb-3">{job.task}</p>
                <ul className="space-y-2">
                  {job.steps.map((step) => (
                    <li key={step} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-verified)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Make it yours */}
      <section id="custom" className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6">
              <p className="folio-label mb-3">Your rules</p>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Describe a rule. Get a category.</h2>
              <p className="text-[var(--color-text-muted)] max-w-[58ch] mb-6">
                Say what you want in plain words, the way you would brief a
                junior controller. LedgerMind files it under your chart of
                accounts and applies it to the next upload.
              </p>
              <form onSubmit={addRule} className="card card-padded space-y-3">
                <label htmlFor="rule-input" className="block text-sm font-medium">
                  Write the rule as one sentence
                </label>
                <textarea
                  id="rule-input"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  rows={3}
                  placeholder="Any narration with UPI autopay goes to Subscription revenue."
                  className="input"
                />
                <button type="submit" className="btn btn-primary w-full">
                  File this rule
                </button>
              </form>
            </div>
            <div className="lg:col-span-6">
              <div className="ledger-sheet">
                <div className="ledger-sheet-head">
                  <p className="text-sm font-semibold">Chart of accounts</p>
                  <span className="badge badge-accent">{rules.length} active</span>
                </div>
                <ul className="divide-y divide-[var(--color-hairline)]">
                  {rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-3 px-4 py-3">
                      <span className="status-dot verified mt-1.5" aria-hidden="true" />
                      <span className="text-sm leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-3">
                Rules apply before the next categorise run. Remove one any time
                from Settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Start on your desk */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="ledger-sheet">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-10">
              <p className="folio-label mb-3">Start</p>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Put it on your desk.</h2>
              <p className="text-[var(--color-text-muted)] mb-7 max-w-[52ch]">
                One upload. Your first stamped folio in about a minute.
                Files stay in your workspace, and the sample set lets you try
                the whole close without sharing anything real.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signin"
                  className="btn btn-primary btn-lg flex-1 text-center"
                >
                  Upload a settlement
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-secondary btn-lg flex-1 text-center"
                >
                  Open sample folio
                </Link>
              </div>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-bg-well)] p-8 lg:p-10">
              <p className="text-sm font-semibold mb-4">What happens after you press upload</p>
              <ol className="space-y-4">
                {[
                  ["First", "Point LedgerMind at one folder of settlements. It never looks outside it."],
                  ["Then", "Ask for the July close. It finds the categories you already filed."],
                  ["Then", "Read the stamped folio. Approve the outlined rows, export the P&L."],
                ].map(([when, what], idx) => (
                  <li key={`${when}-${idx}`} className="flex gap-4">
                    <span className="stamp-mark stamp-verified shrink-0">{when}</span>
                    <span className="text-sm text-[var(--color-text-muted)] leading-relaxed">{what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* How it runs */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="folio-label mb-3">Passage of a file</p>
          <h2 className="text-3xl font-bold tracking-tight mb-8">From upload to insight in four passes.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((item, idx) => (
              <div key={item.title} className="card card-padded">
                <p className="font-data text-sm text-[var(--color-accent)] mb-2">Pass {idx + 1} of 4</p>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-left">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Hear when the next close gets faster.</h2>
        <p className="text-[var(--color-text-muted)] mb-6">
          One short note when LedgerMind learns a new source or check. No weekly digest.
        </p>
        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-label="Email address"
            className="input flex-1"
            disabled={emailStatus === "success"}
          />
          <button type="submit" className="btn btn-primary" disabled={emailStatus === "success"}>
            {emailStatus === "success" ? "On the list" : "Keep me posted"}
          </button>
        </form>
        {emailStatus === "success" && (
          <p className="mt-3 text-sm text-[var(--color-verified)]">Filed. You will hear from us once.</p>
        )}
        {emailStatus === "error" && (
          <p className="mt-3 text-sm text-[var(--color-anomaly)]">That email does not look complete. Check it and try again.</p>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">LedgerMind, settlement folio for July 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/signin" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Sign in</Link>
            <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Dashboard</Link>
            <a href="mailto:hello@ledgermind.ai" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
