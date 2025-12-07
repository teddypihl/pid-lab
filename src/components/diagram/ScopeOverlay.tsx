// src/components/diagram/ScopeOverlay.tsx
import React, { useEffect, useMemo, useState } from "react";

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

/**
 * Inline scope overlay inside the main SVG.
 * - Plots r(t) and y(t)
 * - Nice grid and axes
 * - Zoom:
 *    - Drag with left mouse button over the plot to zoom (X-axis/time)
 *    - +/- buttons in top-right zoom in/out around the current center
 */
export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({
  show,
  samples,
  onClose,
  viewBoxWidth,
  viewBoxHeight,
}) => {
  if (!show || !samples || samples.length < 2) {
    return null;
  }

  // Sort by time
  const sorted = useMemo(
    () => [...samples].sort((a, b) => a.t - b.t),
    [samples]
  );

  const globalTMin = sorted[0].t;
  const globalTMax = sorted[sorted.length - 1].t || globalTMin + 1e-6;

  // Current X-domain
  const [xDomain, setXDomain] = useState<{ min: number; max: number }>({
    min: globalTMin,
    max: globalTMax,
  });

  // Reset zoom when samples or show-state changes
  useEffect(() => {
    if (!sorted.length) return;
    const t0 = sorted[0].t;
    const t1 = sorted[sorted.length - 1].t || t0 + 1e-6;
    setXDomain({ min: t0, max: t1 });
  }, [sorted, show]);

  const xMin = xDomain.min;
  const xMax = xDomain.max;
  const xSpan = Math.max(xMax - xMin, 1e-6);

  // Visible samples in current window
  const visibleSamples = useMemo(
    () => sorted.filter((s) => s.t >= xMin && s.t <= xMax),
    [sorted, xMin, xMax]
  );

  if (visibleSamples.length < 2) {
    return null;
  }

  // Y-domain for r(t) and y(t) in visible region
  const { yMin, yMax } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;

    visibleSamples.forEach((s) => {
      minVal = Math.min(minVal, s.r, s.y);
      maxVal = Math.max(maxVal, s.r, s.y);
    });

    if (!isFinite(minVal) || !isFinite(maxVal)) {
      minVal = -1;
      maxVal = 1;
    }

    // Include 0 so axis looks nicer
    minVal = Math.min(minVal, 0);
    maxVal = Math.max(maxVal, 0);

    const span = maxVal - minVal || 1;
    const pad = span * 0.08;
    minVal -= pad;
    maxVal += pad;

    return { yMin: minVal, yMax: maxVal };
  }, [visibleSamples]);

  const ySpan = Math.max(yMax - yMin, 1e-6);

  // Card geometry inside the viewBox
  
  const outerX = viewBoxWidth * 0.02;
  const outerY = viewBoxHeight * 0.04;
  const outerW = viewBoxWidth * 0.96;
  const outerH = viewBoxHeight * 0.9;


  const plotX0 = outerX + 42;
  const plotX1 = outerX + outerW - 40;
  const plotY0 = outerY + 26;
  const plotY1 = outerY + outerH - 32;



  const plotW = plotX1 - plotX0;
  const plotH = plotY1 - plotY0;

  const xForT = (t: number) =>
    plotX0 + ((t - xMin) / xSpan) * plotW;

  const yForVal = (v: number) =>
    plotY1 - ((v - yMin) / ySpan) * plotH;

  const buildPath = (key: "y" | "r") =>
    visibleSamples
      .map((s, i) => {
        const x = xForT(s.t);
        const y = yForVal(s[key]);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  const pathY = buildPath("y");
  const pathR = buildPath("r");

  // Simple tick generator
  const buildTicks = (min: number, max: number, count: number) => {
    const span = max - min;
    if (span <= 0) return [min];
    const step = span / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(min + i * step);
    }
    return ticks;
  };

  const xTicks = buildTicks(xMin, xMax, 6);
  const yTicks = buildTicks(yMin, yMax, 5);

  // Zoom helpers
  const zoomX = (factor: number) => {
    // factor > 1 => zoom in, < 1 => zoom out
    const center = (xMin + xMax) / 2;
    const currentSpan = xMax - xMin;
    const newSpanRaw = currentSpan / factor;
    const globalSpan = globalTMax - globalTMin || 1e-6;

    const newSpan =
      newSpanRaw >= globalSpan ? globalSpan : Math.max(newSpanRaw, globalSpan * 0.02);

    let newMin = center - newSpan / 2;
    let newMax = center + newSpan / 2;

    if (newMin < globalTMin) {
      newMin = globalTMin;
      newMax = newMin + newSpan;
    }
    if (newMax > globalTMax) {
      newMax = globalTMax;
      newMin = newMax - newSpan;
    }

    setXDomain({ min: newMin, max: newMax });
  };

  const resetZoom = () => {
    setXDomain({ min: globalTMin, max: globalTMax });
  };

  // Drag-to-zoom state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);

  const clampToPlotX = (x: number) =>
    Math.max(plotX0, Math.min(plotX0 + plotW, x));

  const handlePlotMouseDown = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const xView = (px / rect.width) * viewBoxWidth;
    const xClamped = clampToPlotX(xView);

    setDragStartX(xClamped);
    setDragCurrentX(xClamped);
  };

  const handlePlotMouseMove = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (dragStartX == null) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const xView = (px / rect.width) * viewBoxWidth;
    const xClamped = clampToPlotX(xView);

    setDragCurrentX(xClamped);
    
    
  };

  const handlePlotMouseUp = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (dragStartX == null || dragCurrentX == null) {
      setDragStartX(null);
      setDragCurrentX(null);
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const x0 = Math.min(dragStartX, dragCurrentX);
    const x1 = Math.max(dragStartX, dragCurrentX);

    setDragStartX(null);
    setDragCurrentX(null);

    if (x1 - x0 < 8) {
      // Click, not a real drag → do nothing
      return;

      
    }

    const t0 = xMin + ((x0 - plotX0) / plotW) * xSpan;
    const t1 = xMin + ((x1 - plotX0) / plotW) * xSpan;

    if (t1 - t0 <= 1e-6) return;

    setXDomain({ min: t0, max: t1 });
  };

  const selectionRect =
    dragStartX != null && dragCurrentX != null ? (
      <rect
        x={Math.min(dragStartX, dragCurrentX)}
        y={plotY0}
        width={Math.abs(dragCurrentX - dragStartX)}
        height={plotH}
        fill="rgba(59,130,246,0.18)"
        stroke="#3b82f6"
        strokeDasharray="4 2"
      />
    ) : null;

  return (
    <g onClick={(e) => e.stopPropagation()}>
      {/* Dark backdrop */}
      <rect
        x={0}
        y={0}
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="rgba(15,23,42,0.85)"
      />

      {/* Card */}
      <rect
        x={outerX}
        y={outerY}
        width={outerW}
        height={outerH}
        rx={12}
        fill="#020617"
        stroke="#1e293b"
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={outerX + 16}
        y={outerY + 20}
        fontSize={11}
        fill="#e5e7eb"
      >
        Step response
      </text>

      {/* Close button */}
      <g
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={outerX + outerW - 24}
          y={outerY + 8}
          width={16}
          height={16}
          rx={4}
          fill="#020617"
          stroke="#4b5563"
        />
        <text
          x={outerX + outerW - 16}
          y={outerY + 19}
          fontSize={10}
          textAnchor="middle"
          fill="#e5e7eb"
        >
          ×
        </text>
      </g>

      {/* Zoom +/- */}
      <g>
        <g
          onClick={(e) => {
            e.stopPropagation();
            zoomX(1.4);
          }}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={outerX + outerW - 24}
            y={outerY + 32}
            width={16}
            height={16}
            rx={4}
            fill="#020617"
            stroke="#4b5563"
          />
          <text
            x={outerX + outerW - 16}
            y={outerY + 43}
            fontSize={10}
            textAnchor="middle"
            fill="#e5e7eb"
          >
            +
          </text>
        </g>
        <g
          onClick={(e) => {
            e.stopPropagation();
            zoomX(1 / 1.4);
          }}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={outerX + outerW - 24}
            y={outerY + 52}
            width={16}
            height={16}
            rx={4}
            fill="#020617"
            stroke="#4b5563"
          />
          <text
            x={outerX + outerW - 16}
            y={outerY + 63}
            fontSize={10}
            textAnchor="middle"
            fill="#e5e7eb"
          >
            –
          </text>
        </g>
      </g>

      {/* Reset zoom link */}
      <text
        x={outerX + 16}
        y={outerY + outerH - 10}
        fontSize={9}
        fill="#9ca3af"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          resetZoom();
        }}
      >
        Reset zoom
      </text>

            {/* Plot background */}
      <rect
        x={plotX0}
        y={plotY0}
        width={plotW}
        height={plotH}
        fill="#020617"
        stroke="#111827"
        strokeWidth={1}
        // ⬇⬇⬇ aktiverar drag-zoom
        onMouseDown={handlePlotMouseDown}
        onMouseMove={handlePlotMouseMove}
        onMouseUp={handlePlotMouseUp}
        onMouseLeave={handlePlotMouseUp}
        style={{ cursor: "crosshair" }}
      />

      {/* Nicer grid: horizontal */}
      {yTicks.map((val, i) => {
        const y = yForVal(val);
        const isZero = Math.abs(val) < 1e-8;
        return (
          <g key={`yh-${i}`}>
            <line
              x1={plotX0}
              x2={plotX0 + plotW}
              y1={y}
              y2={y}
              stroke={isZero ? "#4b5563" : "#111827"}
              strokeWidth={isZero ? 1.1 : 0.6}
              strokeDasharray={isZero ? "none" : "2 2"}
            />
            <text
              x={plotX0 - 6}
              y={y + 3}
              fontSize={8}
              textAnchor="end"
              fill="#6b7280"
            >
              {val.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Vertical grid */}
      {xTicks.map((t, i) => {
        const x = xForT(t);
        return (
          <g key={`xv-${i}`}>
            <line
              x1={x}
              x2={x}
              y1={plotY0}
              y2={plotY0 + plotH}
              stroke="#111827"
              strokeWidth={0.6}
              strokeDasharray="2 2"
            />
            <text
              x={x}
              y={plotY0 + plotH + 12}
              fontSize={8}
              textAnchor="middle"
              fill="#6b7280"
            >
              {t.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Selection rectangle while dragging */}
      {selectionRect}

      {/* y(t) */}
      <path
        d={pathY}
        fill="none"
        stroke="#22c55e"
        strokeWidth={1.8}
      />

      {/* r(t) */}
      <path
        d={pathR}
        fill="none"
        stroke="#f97316"
        strokeWidth={1.3}
      />

      {/* Legend */}
      <rect
        x={plotX0 + 8}
        y={plotY0 + 8}
        width={90}
        height={30}
        rx={8}
        fill="rgba(15,23,42,0.9)"
        stroke="#1e293b"
        strokeWidth={0.8}
      />
      <line
        x1={plotX0 + 16}
        y1={plotY0 + 18}
        x2={plotX0 + 32}
        y2={plotY0 + 18}
        stroke="#22c55e"
        strokeWidth={1.8}
      />
      <text
        x={plotX0 + 40}
        y={plotY0 + 21}
        fontSize={8}
        fill="#e5e7eb"
      >
        y(t)
      </text>
      <line
        x1={plotX0 + 16}
        y1={plotY0 + 26}
        x2={plotX0 + 32}
        y2={plotY0 + 26}
        stroke="#f97316"
        strokeWidth={1.3}
      />
      <text
        x={plotX0 + 40}
        y={plotY0 + 29}
        fontSize={8}
        fill="#e5e7eb"
      >
        r(t)
      </text>
    </g>
  );
};
