// src/components/ResponseChart.tsx
import React from "react";

type Sample = {
  t: number;
  r: number;
  y: number;
  u: number;
};

interface ResponseChartProps {
  samples: Sample[];
}

export const ResponseChart: React.FC<ResponseChartProps> = ({ samples }) => {
  if (!samples.length) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-4">
        <h2 className="text-sm font-semibold mb-2">Response</h2>
        <p className="text-xs text-slate-400">
          No simulation data yet. Click &quot;Run simulation&quot; to generate a
          response using the current Step, Controller and Plant blocks.
        </p>
      </section>
    );
  }

  // enkel skalning av data till en svg-yta
  const width = 600;
  const height = 200;
  const padding = 30;

  const tMin = samples[0].t;
  const tMax = samples[samples.length - 1].t;

  let vMin = Infinity;
  let vMax = -Infinity;
  for (const s of samples) {
    vMin = Math.min(vMin, s.r, s.y);
    vMax = Math.max(vMax, s.r, s.y);
  }
  if (vMin === vMax) {
    vMin -= 1;
    vMax += 1;
  }

  const scaleX = (t: number) =>
    padding +
    ((t - tMin) / (tMax - tMin || 1)) * (width - 2 * padding);

  const scaleY = (v: number) =>
    height -
    padding -
    ((v - vMin) / (vMax - vMin || 1)) * (height - 2 * padding);

  const buildPath = (key: "r" | "y") => {
    return samples
      .map((s, i) => {
        const x = scaleX(s.t);
        const y = scaleY(s[key]);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const rPath = buildPath("r");
  const yPath = buildPath("y");

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-4">
      <h2 className="text-sm font-semibold mb-2">Response</h2>
      <p className="text-xs text-slate-400 mb-2">
        Simple custom plot of reference r(t) and output y(t).
      </p>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-full h-56 bg-slate-950 rounded-xl border border-slate-800"
        >
          {/* axlar */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#4b5563"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#4b5563"
            strokeWidth={1}
          />

          {/* referens */}
          <path d={rPath} fill="none" stroke="#facc15" strokeWidth={2} />
          {/* utsignal */}
          <path d={yPath} fill="none" stroke="#22c55e" strokeWidth={2} />

          {/* små labels */}
          <text
            x={padding + 5}
            y={padding + 10}
            fill="#facc15"
            fontSize={10}
          >
            r(t)
          </text>
          <text
            x={padding + 5}
            y={padding + 22}
            fill="#22c55e"
            fontSize={10}
          >
            y(t)
          </text>
        </svg>
      </div>
    </section>
  );
};
