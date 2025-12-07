// src/components/diagram/AddBlockHud.tsx
import React, { useState } from "react";
import type { BlockKind } from "../../model/blocks";

interface AddBlockHudProps {
  onAddBlock: (kind: BlockKind) => void;
  onRunSimulation: () => void;
}

export const AddBlockHud: React.FC<AddBlockHudProps> = ({
  onAddBlock,
  onRunSimulation,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const items: { kind: BlockKind; label: string; sub: string }[] = [
    { kind: "step",       label: "Step input",     sub: "reference r(t)" },
    { kind: "controller", label: "PID controller", sub: "P / PI / PID" },
    { kind: "plant",      label: "Plant",          sub: "1 / (Ts + 1)" },
    { kind: "sum",        label: "Sum",            sub: "Σ node" },
    { kind: "scope",      label: "Scope",          sub: "plot y(t)" },
  ];

  return (
    <foreignObject
      x={0}
      y={0}
      width={700}   // samma som SVG width
      height={260}  // samma som SVG height
      pointerEvents="none"
    >
      {/* 🔹 root: fyller hela ytan, så vi kan absolut-positionera Add */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          fontSize: 11,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          overflow: "visible",
        }}
      >
        {/* 🔸 RUN – centrerad upptill */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 0,
            pointerEvents: "auto",  
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRunSimulation();
            }}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid #10b981",
              background: "linear-gradient(to right, #22c55e, #a3e635)",
              color: "#022c22",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
              whiteSpace: "nowrap",
            }}
          >
            ▶ Run simulation
          </button>
        </div>

        {/* 🔸 ADD – fast i vänstra hörnet */}
        <div
          style={{
            position: "absolute",
            top: 0,   // flytta upp/ner
            left: 10,  // flytta vänster/höger
            pointerEvents: "auto", 
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #334155",
                background: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + Add block
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  width: 230,
                  padding: 8,
                  borderRadius: 12,
                  background: "#020617",
                  border: "1px solid #1e293b",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.8)",
                  zIndex: 10,
                }}
              >
                {items.map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddBlock(item.kind);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#020617";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: "#9ca3af", fontSize: 10 }}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </foreignObject>
  );
};
