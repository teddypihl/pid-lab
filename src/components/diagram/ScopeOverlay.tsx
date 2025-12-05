// src/components/diagram/ScopeOverlay.tsx
import React from "react";

export type ResponseSample = {
  t: number;
  r: number;
  y: number;
};

interface ScopeOverlayProps {
  show: boolean;
  samples: ResponseSample[] | null;
  onClose: () => void;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

const computeCurveBounds = (samples: { t: number; y: number }[]) => {
  if (!samples.length) {
    return { tMin: 0, tMax: 1, yMin: 0, yMax: 1 };
  }

  const tMin = samples[0].t;
  const tMax = samples[samples.length - 1].t;

  let yMin = samples[0].y;
  let yMax = samples[0].y;

  for (const s of samples) {
    if (s.y < yMin) yMin = s.y;
    if (s.y > yMax) yMax = s.y;
  }

  if (yMax === yMin) {
    yMax = yMin + 1;
  } else {
    const pad = 0.05 * (yMax - yMin);
    yMin -= pad;
    yMax += pad;
  }

  return { tMin, tMax, yMin, yMax };
};

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({
  show,
  samples,
  onClose,
  viewBoxWidth,
  viewBoxHeight,
}) => {
  if (!show || !samples || samples.length <= 1) return null;

  const margin = 24;
  const panelWidth = viewBoxWidth - margin * 2;
  const panelHeight = viewBoxHeight - margin * 2;

  const panelX = margin;
  const panelY = margin;

  const innerPad = 20;
  const plotX0 = panelX + innerPad;
  const plotY0 = panelY + innerPad;
  const plotW = panelWidth - 2 * innerPad;
  const plotH = panelHeight - 2 * innerPad;

  const { tMin, tMax, yMin, yMax } = computeCurveBounds(
    samples.map(({ t, y }) => ({ t, y }))
  );

  const tRange = tMax - tMin || 1;
  const yRange = yMax - yMin || 1;

  const mapPoint = (t: number, y: number) => {
    const nx = (t - tMin) / tRange;
    const ny = (y - yMin) / yRange;
    const x = plotX0 + nx * plotW;
    const ySvg = plotY0 + (1 - ny) * plotH;
    return { x, y: ySvg };
  };

  const yPath = samples
    .map((s, i) => {
      const { x, y } = mapPoint(s.t, s.y);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const rPath = samples
    .map((s, i) => {
      const { x, y } = mapPoint(s.t, s.r);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <g>
      {/* panel-bakgrund */}
      <rect
        x={panelX}
        y={panelY}
        width={panelWidth}
        height={panelHeight}
        rx={10}
        ry={10}
        fill="#020617"
        stroke="#38bdf8"
        strokeWidth={1}
      />

      {/* titel */}
      <text x={panelX + 12} y={panelY + 16} fill="#e5e7eb" fontSize={11}>
        Scope – Step response
      </text>

      {/* close-knapp */}
      <g
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={panelX + panelWidth - 18}
          y={panelY + 8}
          width={10}
          height={10}
          rx={2}
          ry={2}
          fill="#111827"
          stroke="#4b5563"
          strokeWidth={0.7}
        />
        <text
          x={panelX + panelWidth - 13}
          y={panelY + 16}
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize={9}
        >
          ✕
        </text>
      </g>

      {/* plot bakgrund */}
      <rect
        x={plotX0}
        y={plotY0}
        width={plotW}
        height={plotH}
        fill="#020617"
        stroke="#1f2933"
        strokeWidth={0.7}
      />

      {/* grid horisontella */}
      {yTicks.map((t, i) => {
        const y = plotY0 + (1 - t) * plotH;
        return (
          <line
            key={`gy-${i}`}
            x1={plotX0}
            x2={plotX0 + plotW}
            y1={y}
            y2={y}
            stroke="#111827"
            strokeWidth={0.6}
            strokeDasharray="2 2"
          />
        );
      })}

      {/* grid vertikala */}
      {xTicks.map((t, i) => {
        const x = plotX0 + t * plotW;
        return (
          <line
            key={`gx-${i}`}
            x1={x}
            x2={x}
            y1={plotY0}
            y2={plotY0 + plotH}
            stroke="#111827"
            strokeWidth={0.6}
            strokeDasharray="2 2"
          />
        );
      })}

      {/* axlar */}
      <line
        x1={plotX0}
        x2={plotX0}
        y1={plotY0}
        y2={plotY0 + plotH}
        stroke="#e5e7eb"
        strokeWidth={0.8}
      />
      <line
        x1={plotX0}
        x2={plotX0 + plotW}
        y1={plotY0 + plotH}
        y2={plotY0 + plotH}
        stroke="#e5e7eb"
        strokeWidth={0.8}
      />

      {/* y tick labels */}
      {yTicks.map((t, i) => {
        const y = plotY0 + (1 - t) * plotH;
        const value = yMin + t * (yMax - yMin);
        return (
          <text
            key={`yl-${i}`}
            x={plotX0 - 4}
            y={y + 3}
            textAnchor="end"
            fontSize={8}
            fill="#9ca3af"
          >
            {value.toFixed(2)}
          </text>
        );
      })}

      {/* x tick labels (time) */}
      {xTicks.map((t, i) => {
        const x = plotX0 + t * plotW;
        const value = tMin + t * (tMax - tMin);
        return (
          <text
            key={`xl-${i}`}
            x={x}
            y={plotY0 + plotH + 10}
            textAnchor="middle"
            fontSize={8}
            fill="#9ca3af"
          >
            {value.toFixed(1)}
          </text>
        );
      })}

      {/* axel-etiketter */}
      <text
        x={plotX0 + plotW / 2}
        y={plotY0 + plotH + 20}
        textAnchor="middle"
        fontSize={9}
        fill="#9ca3af"
      >
        t [s]
      </text>
      <text
        x={plotX0 - 20}
        y={plotY0 + plotH / 2}
        textAnchor="middle"
        fontSize={9}
        fill="#9ca3af"
        transform={`rotate(-90 ${plotX0 - 20} ${plotY0 + plotH / 2})`}
      >
        y, r
      </text>

      {/* referens r(t) */}
      <path d={rPath} fill="none" stroke="#f97316" strokeWidth={1.3} />

      {/* utsignal y(t) */}
      <path d={yPath} fill="none" stroke="#38bdf8" strokeWidth={1.6} />

      {/* legend */}
      <rect
        x={plotX0 + plotW - 70}
        y={plotY0 + 4}
        width={66}
        height={22}
        rx={4}
        ry={4}
        fill="#020617"
        stroke="#1f2933"
        strokeWidth={0.7}
      />
      <line
        x1={plotX0 + plotW - 64}
        y1={plotY0 + 11}
        x2={plotX0 + plotW - 52}
        y2={plotY0 + 11}
        stroke="#38bdf8"
        strokeWidth={1.3}
      />
      <text
        x={plotX0 + plotW - 48}
        y={plotY0 + 13}
        fontSize={8}
        fill="#e5e7eb"
      >
        y(t)
      </text>
      <line
        x1={plotX0 + plotW - 64}
        y1={plotY0 + 18}
        x2={plotX0 + plotW - 52}
        y2={plotY0 + 18}
        stroke="#f97316"
        strokeWidth={1.3}
      />
      <text
        x={plotX0 + plotW - 48}
        y={plotY0 + 20}
        fontSize={8}
        fill="#e5e7eb"
      >
        r(t)
      </text>
    </g>
  );
};
