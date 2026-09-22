"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import ThemeSelector from "./ThemeSelector";
import { isLoggedIn, clearToken } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  // Initialize auth state synchronously to avoid effect setState
  const initialAuth = typeof window !== "undefined" ? isLoggedIn() : false;
  const [authenticated, setAuthenticated] = useState(initialAuth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!initialAuth) {
      router.push("/signin");
    }
  }, [initialAuth, router]);

  const handleLogout = () => {
    clearToken();
    setAuthenticated(false);
    router.push("/signin");
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar onLogout={handleLogout} collapsed={sidebarCollapsed} />
      <main className="flex-1 transition-all duration-200" style={{ marginLeft: sidebarCollapsed ? "64px" : "240px" }}>
        {/* Top Bar - Desk Surface */}
        <header className="sticky top-0 z-30 border-b border-border bg-bg-surface/80 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors"
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <ThemeSelector variant="pills" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors" title="New session (⌘N)">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors" title="Agents (⌘K)">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors" title="Open folder (⌘O)">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Session Tabs Strip */}
          <div className="border-t border-border px-4">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
                <button
                  role="tab"
                  aria-selected={true}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium whitespace-nowrap border border-accent/30"
                >
                  <span className="w-2 h-2 rounded-full bg-state-verified" />
                  <span>~/business</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9l3 3m0 0l-3 3m3-3H9" />
                  </svg>
                </button>
                <button
                  role="tab"
                  aria-selected={false}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-state-pending" />
                  <span>~/invoices</span>
                </button>
                <button
                  role="tab"
                  aria-selected={false}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-state-anomaly" />
                  <span>~/reports</span>
                </button>
                <button
                  role="tab"
                  aria-selected={false}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-text-dim" />
                  <span>~/tax</span>
                </button>
                <button
                  role="tab"
                  aria-selected={false}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-text-dim" />
                  <span>~/planning</span>
                </button>
                <button
                  role="tab"
                  aria-selected={false}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-text-dim" />
                  <span>~/operations</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}