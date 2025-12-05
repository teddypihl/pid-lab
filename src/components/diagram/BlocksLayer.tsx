// src/components/diagram/BlocksLayer.tsx
import React from "react";
import type { AnyBlock } from "../../model/blocks";

interface BlocksLayerProps {
  blocks: AnyBlock[];
  selectedId: string | null;
  connectMode: boolean;
  pendingSourceId: string | null;
  getBlockSize: (b: AnyBlock) => { width: number; height: number };
  onBlockClick: (id: string, e: React.MouseEvent<SVGGElement, MouseEvent>) => void;
  onBlockDoubleClick: (
    block: AnyBlock,
    e: React.MouseEvent<SVGGElement, MouseEvent>
  ) => void;
  onStartDrag: (id: string, e: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
  onConnectStart: (
    block: AnyBlock,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => void;
}

export const BlocksLayer: React.FC<BlocksLayerProps> = ({
  blocks,
  selectedId,
  connectMode,
  pendingSourceId,
  getBlockSize,
  onBlockClick,
  onBlockDoubleClick,
  onStartDrag,
  onConnectStart,
}) => {
  return (
    <>
      {blocks.map((b) => {
        const isSelected = b.id === selectedId;
        const isPendingSource = pendingSourceId === b.id && connectMode;
        const label =
          b.kind === "step"
            ? "Step"
            : b.kind === "controller"
            ? "PID"
            : b.kind === "sum"
            ? "Σ"
            : "Scope";

        const { width, height } = getBlockSize(b);
        const rx = b.kind === "scope" ? 0 : 8;

        return (
          <g
            key={b.id}
            onClick={(e) => onBlockClick(b.id, e)}
            onDoubleClick={(e) => onBlockDoubleClick(b, e)}
          >
            <rect
              x={b.x}
              y={b.y}
              width={width}
              height={height}
              rx={rx}
              ry={rx}
              fill={
                isPendingSource
                  ? "#22c55e"
                  : isSelected
                  ? "#0ea5e9"
                  : "#020617"
              }
              stroke={
                isPendingSource
                  ? "#4ade80"
                  : isSelected
                  ? "#38bdf8"
                  : "#e5e7eb"
              }
              strokeWidth={isSelected || isPendingSource ? 2 : 1.4}
              onMouseDown={(e) =>
                connectMode ? onConnectStart(b, e) : onStartDrag(b.id, e)
              }
            />
            {b.kind === "sum" ? (
  // Σ like before
  <text
    x={b.x + width / 2}
    y={b.y + height / 2 + 4}
    textAnchor="middle"
    fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
    fontSize={20}
    pointerEvents="none"
    style={{ userSelect: "none", WebkitUserSelect: "none" }}
  >
    Σ
  </text>
) : b.kind === "plant" ? (
  // 🔧 Simulink-style 1/(Ts+1) block
  <>
    {/* fraction bar */}
    <line
      x1={b.x + 14}
      x2={b.x + width - 14}
      y1={b.y + height / 2}
      y2={b.y + height / 2}
      stroke={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
      strokeWidth={0.8}
    />

    {/* numerator */}
    <text
      x={b.x + width / 2}
      y={b.y + height / 2 - 4}
      textAnchor="middle"
      fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
      fontSize={11}
      pointerEvents="none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      1
    </text>

    {/* denominator: T s + 1 */}
    <text
      x={b.x + width / 2}
      y={b.y + height / 2 + 11}
      textAnchor="middle"
      fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
      fontSize={11}
      pointerEvents="none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {`${(b as any).params.T ?? 1} s + 1`}
    </text>
  </>
) : b.kind === "controller" ? (
  // (optional) keep PID nice and clear
  <text
    x={b.x + width / 2}
    y={b.y + height / 2 + 4}
    textAnchor="middle"
    fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
    fontSize={13}
    pointerEvents="none"
    style={{ userSelect: "none", WebkitUserSelect: "none" }}
  >
    PID
  </text>
) : (
  // Step / Scope
  <text
    x={b.x + width / 2}
    y={b.y + height / 2 + 4}
    textAnchor="middle"
    fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
    fontSize={12}
    pointerEvents="none"
    style={{ userSelect: "none", WebkitUserSelect: "none" }}
  >
    {label}
  </text>
)}

          </g>
        );
      })}
    </>
  );
};
