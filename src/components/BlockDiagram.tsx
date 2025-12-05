// src/components/BlockDiagram.tsx
import React, { useRef, useState } from "react";
import type { AnyBlock, Connection, BlockKind } from "../model/blocks";

import { BlocksLayer } from "./diagram/BlocksLayer";
import { ConnectionsLayer } from "./diagram/ConnectionsLayer";
import { AddBlockHud } from "./diagram/AddBlockHud";
import { ScopeOverlay, type ResponseSample } from "./diagram/ScopeOverlay";

interface BlockDiagramProps {
  blocks: AnyBlock[];
  connections: Connection[];
  selectedId: string | null;
  connectMode: boolean;
  onSelect: (id: string | null) => void;
  onBlocksChange: (blocks: AnyBlock[]) => void;
  onCreateConnection: (fromId: string, toId: string) => void;
  onRemoveConnection: (id: string) => void;
  onAddBlock: (kind: BlockKind) => void;
  onScopeDoubleClick: () => void;
  showInlineResponse: boolean;
  responseCurve: ResponseSample[] | null;
  onCloseInlineResponse: () => void;
}

const VIEWBOX_WIDTH = 700;
const VIEWBOX_HEIGHT = 260;

export const BlockDiagram: React.FC<BlockDiagramProps> = ({
  blocks,
  connections,
  selectedId,
  connectMode,
  onSelect,
  onBlocksChange,
  onCreateConnection,
  onRemoveConnection,
  onAddBlock,
  onScopeDoubleClick,
  showInlineResponse,
  responseCurve,
  onCloseInlineResponse,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
  const [tempConnectEnd, setTempConnectEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const getBlockSize = (b: AnyBlock) => {
    const width = b.kind === "sum" ? 36 : 90;
    const height = b.kind === "sum" ? 36 : 46;
    return { width, height };
  };

  const clientToSvgCoords = (
    e: React.MouseEvent<SVGSVGElement | SVGRectElement>
  ) => {
    const svg = svgRef.current;
    if (!svg) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x = (px / rect.width) * VIEWBOX_WIDTH;
    const y = (py / rect.height) * VIEWBOX_HEIGHT;
    return { x, y };
  };

  const handleStartDrag = (
    id: string,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (connectMode) return;

    const { x: mouseX, y: mouseY } = clientToSvgCoords(e);
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    setDraggingId(id);
    setDragOffset({
      x: mouseX - block.x,
      y: mouseY - block.y,
    });
  };

  const handleConnectStart = (
    block: AnyBlock,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (!connectMode) return;
    setPendingSourceId(block.id);

    const { x, y } = clientToSvgCoords(e);
    setTempConnectEnd({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const { x: mouseX, y: mouseY } = clientToSvgCoords(e);

    if (draggingId && !connectMode) {
      const updated = blocks.map((b) =>
        b.id === draggingId
          ? {
              ...b,
              x: mouseX - dragOffset.x,
              y: mouseY - dragOffset.y,
            }
          : b
      );
      onBlocksChange(updated);
    } else if (connectMode && pendingSourceId) {
      setTempConnectEnd({ x: mouseX, y: mouseY });
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setDraggingId(null);

    if (connectMode && pendingSourceId) {
      const { x: mouseX, y: mouseY } = clientToSvgCoords(e);

      const target = blocks.find((b) => {
        const { width, height } = getBlockSize(b);
        return (
          b.id !== pendingSourceId &&
          mouseX >= b.x &&
          mouseX <= b.x + width &&
          mouseY >= b.y &&
          mouseY <= b.y + height
        );
      });

      if (target) {
        onCreateConnection(pendingSourceId, target.id);
      }

      setPendingSourceId(null);
      setTempConnectEnd(null);
    }
  };

  const handleBlockClick = (
    id: string,
    e: React.MouseEvent<SVGGElement, MouseEvent>
  ) => {
    e.stopPropagation();
    if (connectMode) return;
    onSelect(id);
  };

  const handleBlockDoubleClick = (
    block: AnyBlock,
    e: React.MouseEvent<SVGGElement, MouseEvent>
  ) => {
    e.stopPropagation();
    if (block.kind === "scope") {
      onScopeDoubleClick();
    }
  };

  const pendingSourceBlock = pendingSourceId
    ? blocks.find((b) => b.id === pendingSourceId)
    : undefined;

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center"
      style={{
        maxWidth: "720px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <h2 className="text-sm font-semibold mb-2 text-center">Diagram</h2>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          style={{
            width: "720px",
            height: "300px",
            display: "block",
            margin: "0 auto",
            borderRadius: "0.75rem",
            border: "1px solid #1e293b",
            backgroundColor: "#020617",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onClick={() => {
            onSelect(null);
          }}
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#e5e7eb" />
            </marker>
          </defs>

          {/* bakgrund + grid */}
          <rect
            x={0}
            y={0}
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill="#020617"
          />
          {[50, 100, 150, 200].map((y) => (
            <line
              key={y}
              x1={0}
              x2={VIEWBOX_WIDTH}
              y1={y}
              y2={y}
              stroke="#0f172a"
              strokeWidth={0.5}
            />
          ))}
          {[100, 200, 300, 400, 500, 600].map((x) => (
            <line
              key={x}
              x1={x}
              x2={x}
              y1={0}
              y2={VIEWBOX_HEIGHT}
              stroke="#0f172a"
              strokeWidth={0.5}
            />
          ))}

          <ConnectionsLayer
            blocks={blocks}
            connections={connections}
            getBlockSize={getBlockSize}
            connectMode={connectMode}
            pendingSourceBlock={pendingSourceBlock}
            tempConnectEnd={tempConnectEnd}
            onRemoveConnection={onRemoveConnection}
          />

          <BlocksLayer
            blocks={blocks}
            selectedId={selectedId}
            connectMode={connectMode}
            pendingSourceId={pendingSourceId}
            getBlockSize={getBlockSize}
            onBlockClick={handleBlockClick}
            onBlockDoubleClick={handleBlockDoubleClick}
            onStartDrag={handleStartDrag}
            onConnectStart={handleConnectStart}
          />

          <AddBlockHud onAddBlock={onAddBlock} />

          <ScopeOverlay
            show={showInlineResponse}
            samples={responseCurve}
            onClose={onCloseInlineResponse}
            viewBoxWidth={VIEWBOX_WIDTH}
            viewBoxHeight={VIEWBOX_HEIGHT}
          />
        </svg>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        Drag blocks to arrange your loop. Use the “Add block” HUD in the top-right,
        hold <span className="font-mono">P</span> and drag from one block to another to
        connect, Shift+click a connection to delete it, and press Delete to remove the
        selected block.
      </p>
    </section>
  );
};
