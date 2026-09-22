"use client";

import { useState, useMemo } from "react";
import { formatINR, formatPercent, type CategorizedTransaction } from "@/lib/api";

interface TransactionTableProps {
  transactions: CategorizedTransaction[];
  onExport?: () => void;
}

type SortField = "date" | "amount" | "category" | "confidence" | "counterparty";
type SortDir = "asc" | "desc";

const ROWS_PER_PAGE = 25;

export default function TransactionTable({ transactions, onExport }: TransactionTableProps) {
  const [filter, setFilter] = useState<"all" | "review" | "verified">("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => {
      if (filter === "review") return t.needs_review;
      if (filter === "verified") return !t.needs_review;
      return true;
    });

    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "date":
          aVal = a.date || "";
          bVal = b.date || "";
          break;
        case "amount":
          aVal = a.amount ?? 0;
          bVal = b.amount ?? 0;
          break;
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "confidence":
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case "counterparty":
          aVal = a.counterparty || "";
          bVal = b.counterparty || "";
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [transactions, filter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const reviewCount = transactions.filter((t) => t.needs_review).length;
  const verifiedCount = transactions.length - reviewCount;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with filters and export */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">
          Transactions ({transactions.length})
        </h3>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1 text-xs font-medium rounded transition-colors text-text-muted hover:text-text-primary hover:bg-bg-surface-hover border border-border"
            >
              Export CSV
            </button>
          )}
          <div className="flex gap-1">
            {(["all", "verified", "review"] as const).map((f) => (
<button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === f
                    ? "bg-accent/15 text-accent"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
                }`}
              >
                {f === "all" && "All"}
                {f === "verified" && `Verified (${verifiedCount})`}
                {f === "review" && `Review (${reviewCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th
                className="cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort("date")}
              >
                Date{sortIndicator("date")}
              </th>
              <th
                className="cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort("counterparty")}
              >
                Counterparty{sortIndicator("counterparty")}
              </th>
              <th
                className="text-right cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort("amount")}
              >
                Amount{sortIndicator("amount")}
              </th>
              <th
                className="cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort("category")}
              >
                Category{sortIndicator("category")}
              </th>
              <th
                className="text-right cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => handleSort("confidence")}
              >
                Confidence{sortIndicator("confidence")}
              </th>
              <th>Stamp</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((txn, i) => (
              <tr key={txn.transaction_id}>
                <td className="mono text-text-muted text-xs">
                  {txn.transaction_id.slice(0, 12)}
                </td>
                <td className="text-text-muted text-sm">{txn.date || "—"}</td>
                <td className="text-text-primary max-w-[200px] truncate text-sm">
                  {txn.counterparty || "—"}
                </td>
                <td className="mono text-right text-text-primary text-sm">
                  {txn.amount != null ? formatINR(txn.amount) : "—"}
                </td>
                <td>
                  <span className="text-text-primary text-sm">{txn.category}</span>
                  <span className="block text-text-dim text-xs">{txn.subcategory}</span>
                </td>
                <td className="mono text-right">
                  <span
                    className={
                      txn.confidence >= 0.7 ? "text-state-verified" : "text-state-anomaly"
                    }
                  >
                    {formatPercent(txn.confidence)}
                  </span>
                </td>
                <td>
                  <div
                    className="stamp-reveal"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {txn.needs_review ? (
                      <span className="stamp-badge stamp-review">Needs Review</span>
                    ) : (
                      <span className="stamp-badge stamp-verified">Verified</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-text-muted text-sm">
          No transactions match the current filter.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-xs text-text-muted">
            Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-xs rounded border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-xs text-text-muted">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 text-xs rounded border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
