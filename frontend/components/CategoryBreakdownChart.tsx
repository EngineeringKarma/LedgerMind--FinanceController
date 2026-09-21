"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatINR, type CategoryBreakdown } from "@/lib/api";

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

const COLORS: Record<string, string> = {
  Revenue: "#4FA88F",
  Refunds: "#C1553D",
  "Gateway Fees": "#C98A3E",
  Payouts: "#6B8DB2",
  "Tax (GST/TDS)": "#8B6FC0",
  Chargebacks: "#D4A843",
  Settlements: "#5A9BD5",
  "Other/Uncategorized": "#5A6A7D",
};

const DEFAULT_COLORS = [
  "#C98A3E",
  "#4FA88F",
  "#6B8DB2",
  "#C1553D",
  "#8B6FC0",
  "#D4A843",
  "#5A9BD5",
  "#5A6A7D",
];

interface TooltipPayloadItem {
  payload: CategoryBreakdown;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <div className="font-medium text-text-primary">{d.category}</div>
      <div className="text-text-muted">{formatINR(d.total)}</div>
      <div className="text-text-dim">{d.count} transactions</div>
    </div>
  );
}

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.category}
                fill={COLORS[entry.category] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-text-muted text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
