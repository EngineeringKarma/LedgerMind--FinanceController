"use client";

import { type CategoryBreakdown } from "@/lib/api";

interface ChartOfAccountsProps {
  data: CategoryBreakdown[];
}

export default function ChartOfAccounts({ data }: ChartOfAccountsProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 px-1">
        Chart of Accounts
      </h3>
      <div className="chart-of-accounts space-y-0.5">
        {data.map((item) => {
          const pct = (item.total / maxTotal) * 100;
          return (
            <div key={item.category} className="account-row group">
              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm truncate">{item.category}</div>
                <div className="relative mt-1 h-1 rounded-full bg-bg-base overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: "var(--color-accent)" }}
                  />
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <div className="text-text-primary text-sm tabular-nums">
                  ₹{item.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-text-dim text-[10px]">{item.count} txns</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}