// src/components/diagram/AddBlockHud.tsx
import React, { useState } from "react";
import type { BlockKind } from "../../model/blocks";

interface AddBlockHudProps {
  onAddBlock: (kind: BlockKind) => void;
}

export const AddBlockHud: React.FC<AddBlockHudProps> = ({ onAddBlock }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <foreignObject
      x={10}
      y={10}
      width={140}
      height={150}
      pointerEvents="none"
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          pointerEvents: "auto",
          fontSize: "11px",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid #64748b",
            background: "#020617",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "11px",
            outline: "none",
          }}
        >
          + Add ▾
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              left: 0,
              marginTop: "4px",
              width: "140px",
              borderRadius: "6px",
              border: "1px solid #475569",
              background: "#020617",
              boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { kind: "step" as const, label: "Step", sub: "input" },
              {
                kind: "controller" as const,
                label: "Controller",
                sub: "P / PI / PID",
              },
              {
                kind: "plant" as const,
                label: "Plant",
                sub: "first-order",
              },
              { kind: "sum" as const, label: "Sum Σ", sub: "feedback" },
              { kind: "scope" as const, label: "Scope", sub: "viewer" },
            ].map((item) => (
              <button
                key={item.kind}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBlock(item.kind);
                  setMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}{" "}
                <span style={{ color: "#9ca3af", fontSize: "10px" }}>
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </foreignObject>
  );
};
