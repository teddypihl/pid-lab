// src/components/BlockProperties.tsx
import React from "react";
import type {
  AnyBlock,
  StepBlock,
  ControllerBlock,
  PlantBlock,
  SumBlock,
} from "../model/blocks";

type Props = {
  block?: AnyBlock;
  onChange: (block: AnyBlock) => void;
};

export const BlockProperties: React.FC<Props> = ({ block, onChange }) => {
  if (!block) {
    return (
      <div
        style={{
          fontSize: "12px",
          color: "#9ca3af",
        }}
      >
        Select a block in the diagram to edit its parameters.
      </div>
    );
  }

  // --- Helpers ---
  const updateStep = (partial: Partial<StepBlock["params"]>) => {
    if (block.kind !== "step") return;
    onChange({
      ...block,
      params: {
        ...block.params,
        ...partial,
      },
    });
  };

  const updateController = (partial: Partial<ControllerBlock["params"]>) => {
    if (block.kind !== "controller") return;
    onChange({
      ...block,
      params: {
        ...block.params,
        ...partial,
      },
    });
  };

  const updatePlant = (partial: Partial<PlantBlock["params"]>) => {
    if (block.kind !== "plant") return;
    onChange({
      ...block,
      params: {
        ...block.params,
        ...partial,
      },
    });
  };

  const updateSum = (partial: Partial<SumBlock["params"]>) => {
    if (block.kind !== "sum") return;
    onChange({
      ...block,
      params: {
        ...block.params,
        ...partial,
      },
    });
  };

  const commonHeader = (label: string, subtitle?: string) => (
    <div
      style={{
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginTop: "2px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );

  const fieldWrapper: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#9ca3af",
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#020617",
    borderRadius: 6,
    border: "1px solid #1f2937",
    padding: "4px 6px",
    fontSize: "12px",
    color: "#e5e7eb",
    outline: "none",
  };

  // --- Per block-typ ---

  // STEP
  if (block.kind === "step") {
    const step = block as StepBlock;
    return (
      <div>
        {commonHeader("Step input", "Amplitude and start time")}
        <div style={fieldWrapper}>
          <label style={labelStyle}>Amplitude</label>
          <input
            type="number"
            value={step.params.amplitude}
            onChange={(e) => updateStep({ amplitude: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={fieldWrapper}>
          <label style={labelStyle}>Start time [s]</label>
          <input
            type="number"
            value={step.params.startTime}
            onChange={(e) => updateStep({ startTime: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>
    );
  }

  // CONTROLLER
  if (block.kind === "controller") {
    const ctrl = block as ControllerBlock;
    const { type, kp, ki, kd } = ctrl.params;

    const typeButton = (t: ControllerBlock["params"]["type"], label: string) => {
      const active = type === t;
      return (
        <button
          type="button"
          onClick={() => updateController({ type: t })}
          style={{
            flex: 1,
            padding: "4px 0",
            borderRadius: 6,
            border: active ? "1px solid #22c55e" : "1px solid #1f2937",
            background: active ? "#064e3b" : "#020617",
            color: active ? "#bbf7d0" : "#e5e7eb",
            fontSize: "11px",
            cursor: "pointer",
            transition: "background 120ms ease, border-color 120ms ease",
          }}
        >
          {label}
        </button>
      );
    };

    return (
      <div>
        {commonHeader("Controller", "P / PI / PID gains")}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {typeButton("P", "P")}
          {typeButton("PI", "PI")}
          {typeButton("PID", "PID")}
        </div>

        <div style={fieldWrapper}>
          <label style={labelStyle}>Kp</label>
          <input
            type="number"
            value={kp}
            onChange={(e) => updateController({ kp: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>

        {(type === "PI" || type === "PID") && (
          <div style={fieldWrapper}>
            <label style={labelStyle}>Ki</label>
            <input
              type="number"
              value={ki}
              onChange={(e) =>
                updateController({ ki: Number(e.target.value) })
              }
              style={inputStyle}
            />
          </div>
        )}

        {type === "PID" && (
          <div style={fieldWrapper}>
            <label style={labelStyle}>Kd</label>
            <input
              type="number"
              value={kd}
              onChange={(e) =>
                updateController({ kd: Number(e.target.value) })
              }
              style={inputStyle}
            />
          </div>
        )}
      </div>
    );
  }

  // PLANT
  if (block.kind === "plant") {
    const plant = block as PlantBlock;
    const { K, T } = plant.params;

    return (
      <div>
        {commonHeader("Plant", "First-order system dy/dt = (-y + K·u)/T")}
        <div style={fieldWrapper}>
          <label style={labelStyle}>Gain K</label>
          <input
            type="number"
            value={K}
            onChange={(e) => updatePlant({ K: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={fieldWrapper}>
          <label style={labelStyle}>Time constant T [s]</label>
          <input
            type="number"
            value={T}
            onChange={(e) => updatePlant({ T: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>
    );
  }

  // SUM (Σ)
   // SUM (Σ)
  if (block.kind === "sum") {
    const sum = block as SumBlock;

    // 🔧 Viktigt: typa signs korrekt som ("+"|"-")[]
    const signs: ("+" | "-")[] =
      sum.params.signs && sum.params.signs.length > 0
        ? sum.params.signs
        : ["+"];

    const updateSignAt = (index: number, sign: "+" | "-") => {
      const next: ("+" | "-")[] = [...signs];
      next[index] = sign;
      updateSum({ signs: next });
    };

    const addInput = () => {
      const next: ("+" | "-")[] = [...signs, "+" as const];
      updateSum({ signs: next });
    };

    const removeInput = (index: number) => {
      if (signs.length <= 1) return; // minst en input
      const next = signs.filter((_, i) => i !== index) as ("+" | "-")[];
      updateSum({ signs: next });
    };


    return (
      <div>
        {commonHeader(
          "Sum block (Σ)",
          "Combine incoming arrows with + / - signs"
        )}

        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginBottom: 8,
          }}
        >
          Each incoming connection uses the next sign in this list.{" "}
          <span style={{ color: "#e5e7eb" }}>["+","-"]</span> corresponds to{" "}
          <span style={{ color: "#e5e7eb" }}>r - y_feedback</span>.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {signs.map((sign, index) => {
            const isPlus = sign !== "-";
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  backgroundColor: "#020617",
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  padding: "4px 6px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                  }}
                >
                  Input {index + 1}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateSignAt(index, "+")}
                    style={{
                      minWidth: 26,
                      padding: "2px 0",
                      borderRadius: 6,
                      border: isPlus
                        ? "1px solid #22c55e"
                        : "1px solid #1f2937",
                      background: isPlus ? "#064e3b" : "#020617",
                      color: isPlus ? "#bbf7d0" : "#e5e7eb",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSignAt(index, "-")}
                    style={{
                      minWidth: 26,
                      padding: "2px 0",
                      borderRadius: 6,
                      border: !isPlus
                        ? "1px solid #f97316"
                        : "1px solid #1f2937",
                      background: !isPlus ? "#7c2d12" : "#020617",
                      color: !isPlus ? "#fed7aa" : "#e5e7eb",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={() => removeInput(index)}
                    style={{
                      marginLeft: 4,
                      padding: "2px 6px",
                      borderRadius: 6,
                      border: "1px solid #4b5563",
                      background: "transparent",
                      color: "#9ca3af",
                      fontSize: "10px",
                      cursor: signs.length > 1 ? "pointer" : "default",
                      opacity: signs.length > 1 ? 1 : 0.4,
                    }}
                    disabled={signs.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addInput}
          style={{
            width: "100%",
            padding: "4px 0",
            borderRadius: 8,
            border: "1px dashed #4b5563",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          + Add input
        </button>
      </div>
    );
  }

  // SCOPE
  if (block.kind === "scope") {
    return (
      <div>
        {commonHeader("Scope", "Viewer for the step response")}
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          Double-click the Scope block in the diagram to open the inline step
          response view.
        </div>
      </div>
    );
  }

  // fallback (borde aldrig nås)
  return null;
};
