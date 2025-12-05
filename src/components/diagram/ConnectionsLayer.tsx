// src/components/diagram/ConnectionsLayer.tsx
import React from "react";
import type { AnyBlock, Connection } from "../../model/blocks";

interface ConnectionsLayerProps {
  blocks: AnyBlock[];
  connections: Connection[];
  getBlockSize: (b: AnyBlock) => { width: number; height: number };
  connectMode: boolean;
  pendingSourceBlock?: AnyBlock;
  tempConnectEnd: { x: number; y: number } | null;
  onRemoveConnection: (id: string) => void;
}

// enkel manhattan-rutt: horisontellt – vertikalt – horisontellt
function manhattanRoute(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number }[] {
  const midX = (x1 + x2) / 2;
  return [
    { x: x1, y: y1 },
    { x: midX, y: y1 },
    { x: midX, y: y2 },
    { x: x2, y: y2 },
  ];
}

const buildPointsAttr = (pts: { x: number; y: number }[]) =>
  pts.map((p) => `${p.x},${p.y}`).join(" ");

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({
  blocks,
  connections,
  getBlockSize,
  connectMode,
  pendingSourceBlock,
  tempConnectEnd,
  onRemoveConnection,
}) => {
  return (
    <>
      {/* permanenta connections med 90°-hörn */}
      {connections.map((c) => {
        const from = blocks.find((b) => b.id === c.fromId);
        const to = blocks.find((b) => b.id === c.toId);
        if (!from || !to) return null;

        const { width: wFrom, height: hFrom } = getBlockSize(from);
        const { width: wTo, height: hTo } = getBlockSize(to);

        const x1 = from.x + wFrom;
        const y1 = from.y + hFrom / 2;
        const x2 = to.x;
        const y2 = to.y + hTo / 2;

        const pts = manhattanRoute(x1, y1, x2, y2);
        const pointsAttr = buildPointsAttr(pts);

        return (
          <g key={c.id}>
            {/* synlig polyline */}
            <polyline
              points={pointsAttr}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1.8}
              markerEnd="url(#arrow)"
            />
            {/* osynlig tjock hitbox för Shift+click-delete */}
            <polyline
              points={pointsAttr}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              pointerEvents="stroke"
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  onRemoveConnection(c.id);
                }
              }}
            />
          </g>
        );
      })}

      {/* temporär linje i connect-läge – också 90° */}
      {connectMode &&
        pendingSourceBlock &&
        tempConnectEnd &&
        (() => {
          const { width, height } = getBlockSize(pendingSourceBlock);
          const x1 = pendingSourceBlock.x + width;
          const y1 = pendingSourceBlock.y + height / 2;
          const x2 = tempConnectEnd.x;
          const y2 = tempConnectEnd.y;

          const pts = manhattanRoute(x1, y1, x2, y2);
          const pointsAttr = buildPointsAttr(pts);

          return (
            <polyline
              points={pointsAttr}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              markerEnd="url(#arrow)"
            />
          );
        })()}
    </>
  );
};
