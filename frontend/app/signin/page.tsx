"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { login, register, setToken } from "@/lib/auth";

type AuthMode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const fn = mode === "signin" ? login : register;
        const data = await fn(email, password);
        setToken(data.access_token);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, router]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex">
      {/* Left folio panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-60" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <span className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="text-xl font-semibold">LedgerMind</span>
          </Link>

          <p className="folio-label mb-3">The audited ledger</p>
          <h2 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Close the month like somebody double-checked it.
          </h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed mb-10 max-w-[52ch]">
            Every transaction stamped with a category, a confidence score and
            the reasoning behind it. Uncertain rows stay outlined for review,
            anomaly flags stay deterministic and explainable.
          </p>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-md">
            {[
              ["Stamped with reasoning", "Every row"],
              ["Batches of 15", "Per agent call"],
              ["Review threshold", "Below 0.70"],
              ["Anomaly checks", "Rule based"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-[var(--color-text-muted)]">{k}</dt>
                <dd className="font-data text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 flex justify-end">
          <ThemeSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
                  </svg>
                </span>
                <span className="text-lg font-semibold">LedgerMind</span>
              </Link>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mb-7">
              {mode === "signin"
                ? "Sign in to open your settlement folios"
                : "One account holds every source and folio"}
            </p>

            <div className="card card-padded">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-sm text-[var(--color-text-muted)] mb-1.5">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-sm text-[var(--color-text-muted)] mb-1.5">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input"
                    placeholder="Min 6 characters"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-anomaly-bg)] border border-[var(--color-anomaly-border)] text-[var(--color-anomaly)] text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full btn-lg"
                >
                  {loading
                    ? "Checking the books…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
                {mode === "signin" ? "No account yet?" : "Already filed with us?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                  }}
                  className="text-[var(--color-accent)] font-medium hover:underline"
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
              <Link href="/" className="hover:text-[var(--color-text-primary)]">Back to the folio</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
