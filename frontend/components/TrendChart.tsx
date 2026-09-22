"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatINR, type MonthlyTrend } from "@/lib/api";

interface TrendChartProps {
  data: MonthlyTrend[];
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1">
      <div className="font-medium text-text-primary">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-text-muted capitalize">{p.dataKey}</span>
          <span className="mono text-text-primary">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function LegendFormatter(value: string) {
  return <span className="text-text-muted text-xs capitalize">{value}</span>;
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <YAxis
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatINR(v)}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={LegendFormatter} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-state-verified)"
            strokeWidth={2}
            dot={{ fill: "var(--color-state-verified)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="fees"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ fill: "var(--color-accent)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="refunds"
            stroke="var(--color-state-anomaly)"
            strokeWidth={2}
            dot={{ fill: "var(--color-state-anomaly)", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="tax"
            stroke="#9B6EC6"
            strokeWidth={2}
            dot={{ fill: "#9B6EC6", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="chargebacks"
            stroke="#E07B54"
            strokeWidth={2}
            dot={{ fill: "#E07B54", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--color-text-dim)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "var(--color-text-dim)", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}