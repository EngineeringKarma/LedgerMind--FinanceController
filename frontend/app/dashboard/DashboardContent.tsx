"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TransactionTable from "@/components/TransactionTable";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import TrendChart from "@/components/TrendChart";
import AnomalyAlert from "@/components/AnomalyAlert";
import PnLCard from "@/components/PnLCard";
import ChartOfAccounts from "@/components/ChartOfAccounts";
import UploadCard from "@/components/UploadCard";
import {
  type CategorizedTransaction,
  type Report,
  generateReport,
  exportToCSV,
} from "@/lib/api";
import { authFetch } from "@/lib/auth";

interface SessionInfo {
  session_id: str;
  filename: str;
  row_count: number;
  created_at: str;
  categorization_status: str;
  progress: number;
  total_batches: number;
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");

  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
  }, [API_URL]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      fetchSessions();
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Check if categorization job needs to be started
        let catRes = await authFetch(`${API_URL}/categorize/${sessionId}/results`);
        if (catRes.status === 404) {
          // Trigger categorization job
          await authFetch(`${API_URL}/categorize/${sessionId}`, { method: "POST" });
        }

        let catData = null;
        for (let attempt = 0; attempt < 60; attempt++) {
          catRes = await authFetch(`${API_URL}/categorize/${sessionId}/results`);
          if (catRes.ok) {
            catData = await catRes.json();
            break;
          }
          if (catRes.status === 404 && attempt < 59) {
            setProcessing(true);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          throw new Error("Failed to load categorized data");
        }

        if (!catData) {
          throw new Error("Categorization is still processing. Please try again in a moment.");
        }

        setTransactions(catData.results);
        setProcessing(false);

        const reportData = await generateReport(sessionId!);
        setReport(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
        setProcessing(false);
      }
    }

    loadData();
  }, [sessionId, API_URL, fetchSessions]);

  const handleUploadComplete = useCallback(
    async (newSessionId: string) => {
      try {
        setLoading(true);
        setProcessing(true);
        await authFetch(`${API_URL}/categorize/${newSessionId}`, { method: "POST" });
      } catch (e) {
        console.error("Failed to trigger categorization:", e);
      }
      router.push(`/dashboard?session=${newSessionId}`);
    },
    [API_URL, router]
  );

  const handleDeleteSession = async (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await authFetch(`${API_URL}/sessions/${sId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExport = useCallback(() => {
    if (transactions.length > 0) {
      exportToCSV(transactions, `ledgermind-transactions-${sessionId}.csv`);
    }
  }, [transactions, sessionId]);

  // If no session ID in URL, render Upload & Sessions List Screen
  if (!sessionId) {
    return (
      <div className="max-w-[1200px] mx-auto py-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Settlement Data</h1>
          <p className="text-text-muted text-sm max-w-lg mx-auto">
            Upload your Razorpay settlement CSV file to start AI transaction categorization,
            anomaly detection, and P&L financial reporting.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <UploadCard onUploadComplete={handleUploadComplete} />
        </div>

        {sessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Previous Settlement Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <div
                  key={s.session_id}
                  onClick={() => router.push(`/dashboard?session=${s.session_id}`)}
                  className="glass-card p-5 cursor-pointer hover:border-accent-stamp/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-text-muted">ID: {s.session_id}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${s.categorization_status === "completed"
                            ? "bg-state-verified/15 text-state-verified"
                            : "bg-accent-stamp/15 text-accent-stamp"
                          }`}
                      >
                        {s.categorization_status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate mb-1">{s.filename}</p>
                    <p className="text-xs text-text-muted">
                      {s.row_count} transactions · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-accent-stamp font-medium hover:underline flex items-center gap-1">
                      View Report &rarr;
                    </span>
                    <button
                      onClick={(e) => handleDeleteSession(s.session_id, e)}
                      className="text-xs text-state-anomaly hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-stamp-hover border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">
            {processing ? "Categorization in progress..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-state-anomaly/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-state-anomaly" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-text-primary mb-2">Something went wrong</h2>
          <p className="text-text-muted text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-stamp text-white text-sm font-medium hover:bg-accent-stamp-hover transition-colors"
          >
            Upload New File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlement Report</h1>
          <p className="text-text-muted text-sm mt-1">
            Period: {report?.period || "—"} · Session: {sessionId}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Upload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          {report && <PnLCard summary={report.pnl_summary} />}
        </div>
        <div className="lg:col-span-2">
          {report && <ChartOfAccounts data={report.category_breakdown} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {report && <CategoryBreakdownChart data={report.category_breakdown} />}
        {report && <TrendChart data={report.monthly_trend} />}
      </div>

      {report && report.anomalies.length > 0 && (
        <div className="mb-6">
          <AnomalyAlert anomalies={report.anomalies} />
        </div>
      )}

      <TransactionTable transactions={transactions} onExport={handleExport} />
    </div>
  );
}
