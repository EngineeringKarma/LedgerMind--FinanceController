"use client";

import { useState, useCallback } from "react";
import { login, register, setToken } from "@/lib/auth";

interface AuthCardProps {
  onAuthComplete: () => void;
}

export default function AuthCard({ onAuthComplete }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
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
        const fn = mode === "login" ? login : register;
        const data = await fn(email, password);
        setToken(data.access_token);
        onAuthComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, onAuthComplete]
  );

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            LedgerMind
          </h1>
          <p className="text-text-muted text-sm">
            AI Finance Controller — Sign in to continue
          </p>
        </div>

        <div className="glass-card p-6">
          {/* Tab Toggle */}
          <div className="flex mb-6 bg-bg-base rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-stamp transition-colors"
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
                className="w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-stamp transition-colors"
                placeholder="Min 6 characters"
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded bg-state-anomaly/10 border border-state-anomaly/30 text-state-anomaly text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent-stamp text-bg-base text-sm font-medium hover:bg-accent-stamp-hover transition-colors disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
