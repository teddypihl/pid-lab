// src/components/ResponseMetrics.tsx
import React from "react";

type Metrics = {
  overshootPct: number | null;
  riseTime: number | null;
  settlingTime: number | null;
  steadyStateError: number | null;
};

interface ResponseMetricsProps {
  metrics: Metrics | null;
}

export const ResponseMetrics: React.FC<ResponseMetricsProps> = ({ metrics }) => {
  const hasData =
    metrics &&
    (metrics.overshootPct !== null ||
      metrics.riseTime !== null ||
      metrics.settlingTime !== null ||
      metrics.steadyStateError !== null);

  return (
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        padding: "12px 14px",
        fontSize: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "8px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Response metrics
        </h2>
        <span
          style={{
            fontSize: "10px",
            color: "#9ca3af",
          }}
        >
          First-order step response
        </span>
      </div>

      {!hasData && (
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          Run a simulation to see overshoot, rise time, settling time and
          steady-state error.
        </p>
      )}

      {hasData && metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {/* Overshoot */}
          <MetricCard
            label="Overshoot"
            value={
              metrics.overshootPct !== null
                ? `${metrics.overshootPct.toFixed(1)} %`
                : "—"
            }
            helper="Peak above final value"
          />

          {/* Rise time */}
          <MetricCard
            label="Rise time"
            value={
              metrics.riseTime !== null ? `${metrics.riseTime.toFixed(2)} s` : "—"
            }
            helper="≈ first time reaching 90% of y∞"
          />

          {/* Settling time */}
          <MetricCard
            label="Settling time"
            value={
              metrics.settlingTime !== null
                ? `${metrics.settlingTime.toFixed(2)} s`
                : "—"
            }
            helper="Within ±2% band of y∞"
          />

          {/* Steady-state error */}
          <MetricCard
            label="Steady-state error"
            value={
              metrics.steadyStateError !== null
                ? `${metrics.steadyStateError.toFixed(3)}`
                : "—"
            }
            helper="e∞ = r∞ − y∞"
          />
        </div>
      )}
    </section>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, helper }) => {
  return (
    <div
      style={{
        borderRadius: "10px",
        border: "1px solid #111827",
        padding: "8px 10px",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%)",
        minHeight: "54px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#9ca3af",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#e5e7eb",
          marginBottom: helper ? "2px" : 0,
        }}
      >
        {value}
      </div>
      {helper && (
        <div
          style={{
            fontSize: "9px",
            color: "#6b7280",
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
};

export default ResponseMetrics;
