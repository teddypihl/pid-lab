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
            : b.kind === "plant"
            ? "Plant"
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
              <text
                x={b.x + width / 2}
                y={b.y + height / 2 + 4}
                textAnchor="middle"
                fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
                fontSize={20}
              >
                Σ
              </text>
            ) : (
              <text
                x={b.x + width / 2}
                y={b.y + height / 2 + 4}
                textAnchor="middle"
                fill={isSelected || isPendingSource ? "#0f172a" : "#e5e7eb"}
                fontSize={12}
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
