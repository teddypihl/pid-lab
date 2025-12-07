// src/components/diagram/BlocksLayer.tsx
// src/components/diagram/BlocksLayer.tsx
import React from "react";
import type {
  AnyBlock,
  ControllerBlock,
  PlantBlock,
} from "../../model/blocks";

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

        const textColor = isSelected || isPendingSource ? "#0f172a" : "#e5e7eb";
        const asController =
          b.kind === "controller" ? (b as ControllerBlock) : null;
        const asPlant = b.kind === "plant" ? (b as PlantBlock) : null;

        // small helper for nice numbers
        const fmt = (v: number) => {
          const abs = Math.abs(v);
          if (abs === 0) return "0";
          if (abs >= 1000 || abs < 0.001) return v.toExponential(1);
          const s = v.toFixed(2);
          return s.replace(/\.00$/, "");
        };


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
              // Σ block like before
              <text
                x={b.x + width / 2}
                y={b.y + height / 2 + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize={20}
                pointerEvents="none"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >
                Σ
              </text>
            ) : b.kind === "plant" && asPlant ? (
              // 🔹 Plant as K / (T s + 1)
              <>
                <line
                  x1={b.x + 14}
                  x2={b.x + width - 14}
                  y1={b.y + height / 2}
                  y2={b.y + height / 2}
                  stroke={textColor}
                  strokeWidth={0.8}
                />
                {/* numerator */}
                <text
                  x={b.x + width / 2}
                  y={b.y + height / 2 - 4}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={11}
                  pointerEvents="none"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  {fmt(asPlant.params.K)}
                </text>
                {/* denominator: T s + 1 */}
                <text
                  x={b.x + width / 2}
                  y={b.y + height / 2 + 11}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={11}
                  pointerEvents="none"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  {`${fmt(asPlant.params.T)} s + 1`}
                </text>
              </>
            ) : b.kind === "controller" && asController ? (
              // 🔹 Controller as transfer function (depends on P / PI / PID)
              (() => {
                const { type, kp, ki, kd } = asController.params;

                let numStr = "";
                let denStr = "";

                if (type === "P") {
                  // Gc(s) = Kp
                  numStr = `Kp = ${fmt(kp)}`;
                  denStr = "1";
                } else if (type === "PI") {
                  // Gc(s) = Kp + Ki/s = (Kp s + Ki) / s
                  numStr = `${fmt(kp)} s + ${fmt(ki)}`;
                  denStr = "s";
                } else {
                  // PID: Gc(s) = Kp + Ki/s + Kd s = (Kd s² + Kp s + Ki) / s
                  numStr = `${fmt(kd)} s² + ${fmt(kp)} s + ${fmt(ki)}`;
                  denStr = "s";
                }

                return (
                  <>
                    <line
                      x1={b.x + 10}
                      x2={b.x + width - 10}
                      y1={b.y + height / 2}
                      y2={b.y + height / 2}
                      stroke={textColor}
                      strokeWidth={0.8}
                    />
                    {/* numerator */}
                    <text
                      x={b.x + width / 2}
                      y={b.y + height / 2 - 4}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={10}
                      pointerEvents="none"
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      {numStr}
                    </text>
                    {/* denominator */}
                    <text
                      x={b.x + width / 2}
                      y={b.y + height / 2 + 11}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={10}
                      pointerEvents="none"
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      {denStr}
                    </text>
                  </>
                );
              })()
            ) : (
              // Step / Scope default label
              <text
                x={b.x + width / 2}
                y={b.y + height / 2 + 4}
                textAnchor="middle"
                fill={textColor}
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
