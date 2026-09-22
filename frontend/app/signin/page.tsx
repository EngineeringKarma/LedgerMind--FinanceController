"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSelector from "@/components/ThemeSelector";
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

  const handleOAuth = (provider: string) => {
    console.log(`Signing in with ${provider}`);
    setTimeout(() => {
      setToken("mock-oauth-token");
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-surface relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight font-display">LedgerMind</span>
          </Link>

          <h2 className="text-4xl font-bold tracking-tight mb-4 font-display">
            AI-Powered Finance Controller
          </h2>
          <p className="text-lg text-text-muted max-w-md">
            Automate transaction categorization, detect anomalies, and generate
            insights — all with the power of AI.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { value: "99.2%", label: "Accuracy" },
              { value: "<2s", label: "Processing" },
              { value: "10K+", label: "Transactions" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold gradient-text font-mono">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        <div className="p-8 flex justify-end">
          <ThemeSelector variant="dropdown" />
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold font-display">LedgerMind</span>
              </Link>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-2xl font-semibold tracking-tight mb-2 font-display">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-text-muted text-sm">
                {mode === "signin"
                  ? "Sign in to access your financial dashboard"
                  : "Get started with LedgerMind today"}
              </p>
            </div>

            {/* Form wrapped in glass-card */}
            <div className="glass-card p-8">
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuth("google")}
                  className="oauth-btn oauth-google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleOAuth("github")}
                  className="oauth-btn oauth-github"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Continue with GitHub
                </button>

                <button
                  onClick={() => handleOAuth("yahoo")}
                  className="oauth-btn oauth-yahoo"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.106 7.618l-4.36 8.764h2.508l4.36-8.764h-2.508zm6.894 2.146l-4.36 8.764h2.508l4.36-8.764h-2.508z" />
                  </svg>
                  Continue with Yahoo
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg-base text-text-muted">or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-muted mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-bg-surface border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-hover transition-colors"
                    placeholder="Min 6 characters"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-lg bg-state-anomaly/10 border border-state-anomaly/30 text-state-anomaly text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                {mode === "signin" ? "Don&apos;t have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                  }}
                  className="text-accent-hover hover:underline font-medium"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}