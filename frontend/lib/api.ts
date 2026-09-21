import { authFetch } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Transaction {
  transaction_id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  counterparty: string;
  status: string;
}

export interface CategorizedTransaction {
  transaction_id: string;
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string;
  needs_review: boolean;
  // Original transaction fields for display in the transaction table
  date: string | null;
  amount: number | null;
  type: string | null;
  description: string | null;
  counterparty: string | null;
  status: string | null;
}

export interface PnLSummary {
  revenue: number;
  fees: number;
  refunds: number;
  tax: number;
  chargebacks: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  fees: number;
  refunds: number;
  tax: number;
  chargebacks: number;
  net: number;
}

export type AnomalySeverity = "low" | "medium" | "high";

export interface Anomaly {
  type: string;
  description: string;
  severity: AnomalySeverity;
}

export interface Report {
  period: string;
  pnl_summary: PnLSummary;
  category_breakdown: CategoryBreakdown[];
  monthly_trend: MonthlyTrend[];
  anomalies: Anomaly[];
}

export interface UploadResponse {
  session_id: string;
  transaction_count: number;
}

export interface CategorizeResponse {
  job_id: string;
  status: string;
  session_id: string;
}

export interface JobStatus {
  job_id: string;
  session_id: string;
  status: string;
  progress: number;
  total_batches: number;
  categorized_count: number;
  needs_review_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  results?: CategorizedTransaction[];
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function categorize(sessionId: string): Promise<CategorizeResponse> {
  const res = await authFetch(`${API_URL}/categorize/${sessionId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Categorization failed" }));
    throw new Error(err.detail || "Categorization failed");
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await authFetch(`${API_URL}/jobs/${jobId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Job fetch failed" }));
    throw new Error(err.detail || "Job fetch failed");
  }

  return res.json();
}

export async function pollJobUntilComplete(
  jobId: string,
  onProgress?: (status: JobStatus) => void,
  maxWaitMs: number = 600000
): Promise<JobStatus> {
  const start = Date.now();
  const interval = 1000;

  while (Date.now() - start < maxWaitMs) {
    const status = await getJobStatus(jobId);
    onProgress?.(status);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("Categorization timed out");
}

export async function generateReport(sessionId: string): Promise<Report> {
  const res = await authFetch(`${API_URL}/reports/generate/${sessionId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Report generation failed" }));
    throw new Error(err.detail || "Report generation failed");
  }

  return res.json();
}

export async function getReport(sessionId: string): Promise<Report> {
  const res = await authFetch(`${API_URL}/reports/${sessionId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Report fetch failed" }));
    throw new Error(err.detail || "Report fetch failed");
  }

  return res.json();
}

export async function getTransactions(sessionId: string): Promise<{ session_id: string; transactions: Transaction[] }> {
  const res = await authFetch(`${API_URL}/upload/${sessionId}/transactions`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Transaction fetch failed" }));
    throw new Error(err.detail || "Transaction fetch failed");
  }

  return res.json();
}

export function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${(amount / 100000).toFixed(2)}L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function exportToCSV(transactions: CategorizedTransaction[], filename: string): void {
  const headers = ["Transaction ID", "Date", "Counterparty", "Amount", "Category", "Subcategory", "Confidence", "Status", "Needs Review"];
  const rows = transactions.map(t => [
    t.transaction_id,
    t.date || "",
    t.counterparty || "",
    (t.amount ?? 0).toString(),
    t.category,
    t.subcategory,
    (t.confidence * 100).toFixed(0) + "%",
    t.needs_review ? "Needs Review" : "Verified",
    t.needs_review ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
