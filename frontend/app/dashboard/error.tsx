"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="glass-card p-8 max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-state-anomaly/15 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-state-anomaly" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-2">Dashboard Error</h2>
        <p className="text-text-muted text-sm mb-4">
          {error.message || "Failed to load the dashboard. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-border text-text-muted text-sm font-medium hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            Back to Upload
          </Link>
        </div>
      </div>
    </main>
  );
}
