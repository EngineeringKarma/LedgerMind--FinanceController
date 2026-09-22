"use client";

import { formatINR, type PnLSummary } from "@/lib/api";

interface PnLCardProps {
  summary: PnLSummary;
}

const ITEMS: { key: keyof PnLSummary; label: string; color: string }[] = [
  { key: "revenue", label: "Revenue", color: "text-state-verified" },
  { key: "fees", label: "Fees & Payouts", color: "text-accent" },
  { key: "refunds", label: "Refunds", color: "text-state-anomaly" },
  { key: "tax", label: "Tax", color: "text-text-muted" },
  { key: "chargebacks", label: "Chargebacks", color: "text-state-anomaly" },
  { key: "net", label: "Net", color: "text-text-primary" },
];

export default function PnLCard({ summary }: PnLCardProps) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">P&L Summary</h3>
      <div className="space-y-3">
        {ITEMS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{label}</span>
            <span className={`mono text-sm font-medium ${color} tabular-nums`}>
              {formatINR(summary[key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
