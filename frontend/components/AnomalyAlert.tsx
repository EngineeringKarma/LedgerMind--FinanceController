"use client";

import { type Anomaly, type AnomalySeverity } from "@/lib/api";

interface AnomalyAlertProps {
  anomalies: Anomaly[];
}

const SEVERITY_STYLES: Record<AnomalySeverity, string> = {
  high: "border-state-anomaly/40 bg-state-anomaly/8",
  medium: "border-state-pending/30 bg-state-pending/5",
  low: "border-border bg-bg-surface",
};

const SEVERITY_DOT: Record<AnomalySeverity, string> = {
  high: "bg-state-anomaly",
  medium: "bg-state-pending",
  low: "bg-text-dim",
};

export default function AnomalyAlert({ anomalies }: AnomalyAlertProps) {
  if (!anomalies.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
        <svg className="w-4 h-4 text-state-anomaly" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        Anomalies Detected ({anomalies.length})
      </h3>

      <div className="space-y-2">
        {anomalies.map((anomaly, i) => (
          <div
            key={i}
            className={`rounded-lg border px-4 py-3 ${
              SEVERITY_STYLES[anomaly.severity] || SEVERITY_STYLES.low
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  SEVERITY_DOT[anomaly.severity] || SEVERITY_DOT.low
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    {anomaly.type.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      anomaly.severity === "high"
                        ? "bg-state-anomaly/15 text-state-anomaly"
                        : anomaly.severity === "medium"
                          ? "bg-state-pending/15 text-state-pending"
                          : "bg-text-dim/15 text-text-dim"
                    }`}
                  >
                    {anomaly.severity}
                  </span>
                </div>
                <p className="text-sm text-text-primary">{anomaly.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
