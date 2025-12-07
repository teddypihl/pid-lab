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

const WORLD_MIN_X = -2000;
const WORLD_MAX_X = VIEWBOX_WIDTH + 2000;  // 700 + 2000 = 2700
const WORLD_MIN_Y = -1000;
const WORLD_MAX_Y = VIEWBOX_HEIGHT + 1500; // 260 + 1500 = 1760
const GRID_SPACING = 50; // avstånd mellan grid-linjer

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const INITIAL_ZOOM = 1.0; // mitten av spannet




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
  const wrapperRef = useRef<HTMLDivElement | null>(null);  // ⬅️ NY
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

  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isPanKey, setIsPanKey] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const GRID_SIZE = 10; // hur tätt blocken snäpper

  

  // 🔹 Hjälp-funktion: zooma runt mitten av viewBox
  const applyZoomAtCenter = (newZoom: number) => {
    const clampedZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));

    const cx = VIEWBOX_WIDTH / 2;
    const cy = VIEWBOX_HEIGHT / 2;

    const centerWorldX = (cx - pan.x) / zoom;
    const centerWorldY = (cy - pan.y) / zoom;

    setZoom(clampedZoom);
    setPan({
      x: cx - clampedZoom * centerWorldX,
      y: cy - clampedZoom * centerWorldY,
    });
  };






    React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setIsPanKey(true);
      }
    };



    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setIsPanKey(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);



      React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();   // ⬅️ stoppa PAGE scroll
      event.stopPropagation();

      const ZOOM_STEP = 0.1;
      const direction = event.deltaY > 0 ? -1 : 1; // scroll upp = zooma in
      const targetZoom = zoom + direction * ZOOM_STEP;

      applyZoomAtCenter(targetZoom);
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleNativeWheel);
    };
  }, [zoom, pan]); // zoom & pan i deps eftersom vi använder dem i handlern




  const getBlockSize = (b: AnyBlock) => {
    const width = b.kind === "sum" ? 36 : 90;
    const height = b.kind === "sum" ? 36 : 46;
    return { width, height };
  };

  const clientToDiagramCoords = (
    e: React.MouseEvent<SVGSVGElement | SVGRectElement>
  ) => {
    const svg = svgRef.current;
    if (!svg) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // först: koordinater i viewBox
    const vx = (px / rect.width) * VIEWBOX_WIDTH;
    const vy = (py / rect.height) * VIEWBOX_HEIGHT;

    // sedan: backa ur pan & zoom till "diagram-koordinater"
    const x = (vx - pan.x) / zoom;
    const y = (vy - pan.y) / zoom;
    return { x, y };
  };


  const handleStartDrag = (
    id: string,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (connectMode) return;

    const { x: mouseX, y: mouseY } = clientToDiagramCoords(e);
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    setDraggingId(id);
    setDragOffset({
      x: mouseX - block.x,
      y: mouseY - block.y,
    });
  };

    const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isPanKey) return; // bara när man håller D
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    panStartRef.current = { x: px, y: py };
    panOriginRef.current = { x: pan.x, y: pan.y };
    setIsPanning(true);
  };



  const handleConnectStart = (
    block: AnyBlock,
    e: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (!connectMode) return;
    setPendingSourceId(block.id);

    const { x, y } = clientToDiagramCoords(e);
    setTempConnectEnd({ x, y });
  };

  const snapToGrid = (value: number) =>
    Math.round(value / GRID_SIZE) * GRID_SIZE;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = svgRef.current;
    if (!svg) return;

    // 1) Pan om vi håller D och har startat panning
    if (isPanning && panStartRef.current) {
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const dxPx = px - panStartRef.current.x;
      const dyPx = py - panStartRef.current.y;

      // px → viewBox-enheter
      const dx = (dxPx / rect.width) * VIEWBOX_WIDTH;
      const dy = (dyPx / rect.height) * VIEWBOX_HEIGHT;

      setPan({
        x: panOriginRef.current.x + dx,
        y: panOriginRef.current.y + dy,
      });
      return;
    }

    // 2) Vanlig drag/connection-logik i diagram-koordinater
    const { x: mouseX, y: mouseY } = clientToDiagramCoords(e);

    if (draggingId && !connectMode) {
      const updated = blocks.map((b) => {
        if (b.id !== draggingId) return b;

        const { width, height } = getBlockSize(b);
        //const margin = 8;

        let x = snapToGrid(mouseX - dragOffset.x);
        let y = snapToGrid(mouseY - dragOffset.y);

        // clamp så blocken inte hamnar halvvägs utanför
         x = Math.max(WORLD_MIN_X, Math.min(x, WORLD_MAX_X - width));
        y = Math.max(WORLD_MIN_Y, Math.min(y, WORLD_MAX_Y - height));

        return { ...b, x, y };
      });

      onBlocksChange(updated);
    } else if (connectMode && pendingSourceId) {
      setTempConnectEnd({ x: mouseX, y: mouseY });
    }
  };


  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setDraggingId(null);
    setIsPanning(false);
    panStartRef.current = null;

    if (connectMode && pendingSourceId) {
      const { x: mouseX, y: mouseY } = clientToDiagramCoords(e);

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
      <p className="text-xs text-slate-500 mt-2">
          Drag blocks around to arrange your loop. Use the “Add block” button in the top-left to add blocks.
          <br />
          Hold <span className="font-mono">D</span> to pan and use your mouse wheel or trackpad scroll to zoom.
          Hold <span className="font-mono">P</span> and drag from one block to another to
          make a connection, Shift+click a connection to delete it, and press Delete to remove a
          selected block.
        </p>
  
<div
  ref={wrapperRef}
  className="relative"
  style={{
    overscrollBehavior: "contain", // eller "none", båda funkar
    maxHeight: "320px",
    overflow: "hidden",
  }}
>
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
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "none",      // hjälper med touchpad/gestures
    }}
    onMouseMove={handleMouseMove}
    onMouseDown={handleSvgMouseDown}
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

{/* Allt som ska zoomas/pannas */}
<g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
  {/* Grid över hela "världen" */}
  {(() => {
     const lines: React.ReactElement[] = [];


    // horisontella linjer
    for (let y = WORLD_MIN_Y; y <= WORLD_MAX_Y; y += GRID_SPACING) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={WORLD_MIN_X}
          x2={WORLD_MAX_X}
          y1={y}
          y2={y}
          stroke="rgba(226, 232, 240, 0.25)"   // lite ljus, synlig men inte störig
          strokeWidth={0.7}
        />
      );
    }

    // vertikala linjer
    for (let x = WORLD_MIN_X; x <= WORLD_MAX_X; x += GRID_SPACING) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          x2={x}
          y1={WORLD_MIN_Y}
          y2={WORLD_MAX_Y}
          stroke="rgba(226, 232, 240, 0.25)"
          strokeWidth={0.7}
        />
      );
    }

    return lines;
  })()}

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
</g>



 <AddBlockHud
  onAddBlock={onAddBlock}
  onRunSimulation={onScopeDoubleClick}  // 🔹 återanvänder samma logik som dubbelklick på scope
  />



  {/* Bara recenter-knapp i övre högra hörnet */}
{/* Bara recenter-knapp i övre högra hörnet */}
<foreignObject
  x={VIEWBOX_WIDTH - 46}
  y={2}
  width={30}
  height={30}
>
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto",
    }}
  >
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setPan({ x: 0, y: 0 });
        setZoom(INITIAL_ZOOM);
      }}
      style={{
        width: "100%",          // hela 36x36 ytan
        height: "100%",
        borderRadius: "999px",
        border: "1px solid #334155",
        background: "#020617",
        color: "#e5e7eb",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        lineHeight: 1,
      }}
      title="Recenter view"
    >
      ⌖
    </button>
  </div>
</foreignObject>


  <ScopeOverlay
  show={showInlineResponse}
  samples={responseCurve}
  onClose={onCloseInlineResponse}
  viewBoxWidth={VIEWBOX_WIDTH}
  viewBoxHeight={VIEWBOX_HEIGHT}
  />
        </svg>
      </div>

      
    </section>
  );
};
