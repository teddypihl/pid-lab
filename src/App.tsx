// src/App.tsx
import React, { useState, useEffect } from "react";

import type {
  AnyBlock,
  BlockKind,
  Connection,
} from "./model/blocks";
import { createDefaultBlock } from "./model/blocks";

import { BlockDiagram } from "./components/BlockDiagram";
import { BlockProperties } from "./components/BlockProperties";
import { ResponseMetrics } from "./components/ResponseMetrics";

import { runSimulation, type Sample, type Metrics } from "./model/simulation";


const App: React.FC = () => {
  const [blocks, setBlocks] = useState<AnyBlock[]>([
    {
      id: "step-1",
      kind: "step",
      x: 60,
      y: 100,
      params: { amplitude: 1, startTime: 0 },
    },
    {
      id: "controller-1",
      kind: "controller",
      x: 220,
      y: 100,
      params: { type: "PID", kp: 2, ki: 1, kd: 0.2 },
    },
    {
      id: "plant-1",
      kind: "plant",
      x: 400,
      y: 100,
      params: { K: 1, T: 1.5 },
    },
    {
      id: "scope-1",
      kind: "scope",
      x: 560,
      y: 100,
      params: {},
    },
  ]);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [idCounter, setIdCounter] = useState(2);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const [connectMode, setConnectMode] = useState(false);
  const [showInlineResponse, setShowInlineResponse] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || undefined;
  const hasSelection = !!selectedBlock;

  // Keyboard: P för connectMode, Delete/Backspace för att radera valt block
  useEffect(() => {
    const isInputLike = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        setConnectMode(true);
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isInputLike(document.activeElement)
      ) {
        if (!selectedBlockId) return;
        e.preventDefault();

        const idToDelete = selectedBlockId;

        setBlocks((prev) => prev.filter((b) => b.id !== idToDelete));
        setConnections((prev) =>
          prev.filter((c) => c.fromId !== idToDelete && c.toId !== idToDelete)
        );
        setSelectedBlockId(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        setConnectMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedBlockId]);

  const handleAddBlock = (kind: BlockKind) => {
    const newId = idCounter;
    setIdCounter((c) => c + 1);
    const newBlock = createDefaultBlock(kind, newId);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (updated: AnyBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleCreateConnection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConnections((prev) => {
      if (prev.some((c) => c.fromId === fromId && c.toId === toId)) {
        return prev;
      }
      const id = `${fromId}->${toId}-${prev.length + 1}`;
      return [...prev, { id, fromId, toId }];
    });
  };

  const handleRemoveConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

// inne i App-komponenten

const handleRunSimulation = () => {
  try {
    const { samples: newSamples, metrics: newMetrics } = runSimulation(
      blocks,
      connections,
      { dt: 0.02, tEnd: 10 }
    );
    setSamples(newSamples);
    setMetrics(newMetrics);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Simulation failed due to an unknown error.";
    alert(msg);
  }
};

const handleScopeDoubleClick = () => {
  // kör samma sim som knappen
  handleRunSimulation();
  setShowInlineResponse(true);
};

// inlineResponseData (nu baserat på Sample från simulation.ts)
const inlineResponseData = samples.map((s) => ({
  t: s.t,
  r: s.r,
  y: s.y,
}));


  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            PID Lab – Block Diagram
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#9ca3af",
              marginTop: "4px",
              marginBottom: "10px",
            }}
          >
            Simulink-style editor: build a chain Step → Controller → Plant with arrows,
            then run a first-order simulation.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "#9ca3af",
            }}
          >
            <p style={{ margin: 0 }}>
              Hold{" "}
              <span style={{ fontFamily: "monospace", color: "#e5e7eb" }}>P</span> and
              drag from one block to another to connect them. Press{" "}
              <span style={{ fontFamily: "monospace", color: "#e5e7eb" }}>Delete</span>{" "}
              to remove the selected block.
            </p>
            <button
              onClick={handleRunSimulation}
              style={{
                marginTop: "4px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "#10b981",
                color: "#020617",
                cursor: "pointer",
              }}
            >
              Run simulation
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          position: "relative",
          flex: 1,
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "720px",
              maxWidth: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <BlockDiagram
              blocks={blocks}
              connections={connections}
              selectedId={selectedBlockId}
              connectMode={connectMode}
              onSelect={setSelectedBlockId}
              onBlocksChange={setBlocks}
              onCreateConnection={handleCreateConnection}
              onRemoveConnection={handleRemoveConnection}
              onAddBlock={handleAddBlock}
              
              onScopeDoubleClick={handleScopeDoubleClick}
              showInlineResponse={showInlineResponse}
              responseCurve={inlineResponseData}
              onCloseInlineResponse={() => setShowInlineResponse(false)}
            />

            <ResponseMetrics metrics={metrics} />
          </div>
        </div>

        {/* Floating Block properties – overlay, no layout shift */}
        {hasSelection && (
          <div
            style={{
              position: "absolute",
              right: "32px",
              top: "96px",
              width: "260px",
              backgroundColor: "#020617",
              borderRadius: "16px",
              border: "1px solid #1e293b",
              padding: "12px",
              fontSize: "13px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Block properties
            </h2>
            <BlockProperties block={selectedBlock} onChange={handleUpdateBlock} />
          </div>
        )}
      </main>

      <footer
        style={{
          fontSize: "11px",
          color: "#6b7280",
          padding: "8px 16px",
          borderTop: "1px solid #1e293b",
          textAlign: "center",
        }}
      >
        Built by Karl-Theodor Pihl · First-order PID Lab with a Simulink-style block &
        connection editor
      </footer>
    </div>
  );
};

export default App;
