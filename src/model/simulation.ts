// src/simulation.ts
import type {
  AnyBlock,
  Connection,
  StepBlock,
  ControllerBlock,
  PlantBlock,
  SumBlock,
} from "./blocks";




export type Sample = {
  t: number;
  r: number;
  y: number;
  u: number;
};

export type Metrics = {
  overshootPct: number | null;
  riseTime: number | null;
  settlingTime: number | null;
  steadyStateError: number | null;
};

// Bygg huvudkedja från ett Step-block längs pilarna
function buildMainChain(
  blocks: AnyBlock[],
  connections: Connection[]
): AnyBlock[] {
  if (!blocks.length) return [];

  const stepBlocks = blocks.filter((b) => b.kind === "step");
  if (!stepBlocks.length) return [];

  const stepWithNoIncoming =
    stepBlocks.find((b) => !connections.some((c) => c.toId === b.id)) ??
    stepBlocks[0];

  const chain: AnyBlock[] = [];
  const visited = new Set<string>();
  let current: AnyBlock | undefined = stepWithNoIncoming;

  while (current && !visited.has(current.id)) {
    chain.push(current);
    visited.add(current.id);

    const outgoing = connections.filter((c) => c.fromId === current!.id);
    if (!outgoing.length) break;

    // välj den pil vars target har minsta x → "vänster" kedja
    let nextConn = outgoing[0];
    if (outgoing.length > 1) {
      let best = outgoing[0];
      let bestX = Infinity;
      for (const c of outgoing) {
        const target = blocks.find((b) => b.id === c.toId);
        if (target && target.x < bestX) {
          bestX = target.x;
          best = c;
        }
      }
      nextConn = best;
    }

    const nextBlock = blocks.find((b) => b.id === nextConn.toId);
    if (!nextBlock) break;
    current = nextBlock;
  }

  return chain;
}

export function computeMetrics(samples: Sample[]): Metrics {
  if (samples.length === 0) {
    return {
      overshootPct: null,
      riseTime: null,
      settlingTime: null,
      steadyStateError: null,
    };
  }

  const last = samples[samples.length - 1];
  const yss = last.y;
  const rFinal = last.r;
  const steadyStateError = rFinal - yss;

  const maxY = samples.reduce((m, s) => (s.y > m ? s.y : m), samples[0].y);

  let overshootPct: number | null = null;
  if (Math.abs(yss) > 1e-6) {
    overshootPct = ((maxY - yss) / Math.abs(yss)) * 100;
    if (overshootPct < 0) overshootPct = 0;
  }

  let riseTime: number | null = null;
  if (Math.abs(yss) > 1e-6) {
    const target = 0.9 * yss;
    const cross = samples.find((s) =>
      yss >= 0 ? s.y >= target : s.y <= target
    );
    if (cross) riseTime = cross.t;
  }

  let settlingTime: number | null = null;
  if (Math.abs(yss) > 1e-6) {
    const tol = 0.02 * Math.abs(yss);
    let lastOutside: Sample | null = null;
    for (const s of samples) {
      if (Math.abs(s.y - yss) > tol) {
        lastOutside = s;
      }
    }
    settlingTime = lastOutside ? lastOutside.t : 0;
  }

  return {
    overshootPct,
    riseTime,
    settlingTime,
    steadyStateError,
  };
}

type RunSimOptions = {
  dt?: number;
  tEnd?: number;
};

// Huvudsimulering med stöd för:
// - Step
// - (valfritt) Sum som error-node
// - (valfritt) Controller
// - En eller flera Plant i serie
export function runSimulation(
  blocks: AnyBlock[],
  connections: Connection[],
  opts: RunSimOptions = {}
): { samples: Sample[]; metrics: Metrics } {
  const dt = opts.dt ?? 0.02;
  const tEnd = opts.tEnd ?? 10;

  const chain = buildMainChain(blocks, connections);
  if (!chain.length) {
    throw new Error("No connected chain found from a Step block.");
  }

  const stepIndex = chain.findIndex((b) => b.kind === "step");
  if (stepIndex === -1) {
    throw new Error("No Step block found in the connected chain.");
  }

  const firstPlantIndex = chain.findIndex(
    (b, i) => b.kind === "plant" && i > stepIndex
  );
  if (firstPlantIndex === -1) {
    throw new Error(
      "Simulation needs at least one Plant block after the Step in the chain."
    );
  }

  const ctrlIndex = chain.findIndex(
    (b, i) => b.kind === "controller" && i > stepIndex && i < firstPlantIndex
  );

  const sumIndex = chain.findIndex(
    (b, i) =>
      b.kind === "sum" &&
      i > stepIndex &&
      (ctrlIndex === -1 ? i < firstPlantIndex : i < ctrlIndex)
  );

  const stepBlock = chain[stepIndex] as StepBlock;
  const plantBlocks = chain
    .map((b, i) => ({ b, i }))
    .filter(({ b, i }) => b.kind === "plant" && i >= firstPlantIndex)
    .map(({ b }) => b as PlantBlock);

  if (!plantBlocks.length) {
    throw new Error("No Plant blocks found in the forward path.");
  }

  const ctrlBlock =
    ctrlIndex === -1 ? undefined : (chain[ctrlIndex] as ControllerBlock);
  const sumBlock =
    sumIndex === -1 ? undefined : (chain[sumIndex] as SumBlock);

  // Incoming connections till sum-blocket (om det finns)
  const sumIncoming = sumBlock
    ? connections.filter((c) => c.toId === sumBlock.id)
    : [];

  // Plant-states (cascade: output från plant_i in i plant_{i+1})
  const plantStates = plantBlocks.map(() => 0);

  const ctrlType = ctrlBlock?.params.type ?? "P";
  const kp = ctrlBlock?.params.kp ?? 0;
  const ki = ctrlBlock?.params.ki ?? 0;
  const kd = ctrlBlock?.params.kd ?? 0;

  let t = 0;
  let integral = 0;
  let prevError = 0;

  const samples: Sample[] = [];

  while (t <= tEnd + 1e-9) {
    // nuvarande output från sista plant: y(k)
    const yCurrent = plantStates.length
      ? plantStates[plantStates.length - 1]
      : 0;

    // referens
    const r =
      t >= stepBlock.params.startTime ? stepBlock.params.amplitude : 0;

    // beräkna error via Σ om den finns, annars unity feedback (r - y)
    let error: number;

    if (sumBlock) {
      const inputs: number[] = [];

      for (const conn of sumIncoming) {
        const src = blocks.find((b) => b.id === conn.fromId);
        if (!src) continue;

        let v = 0;

        if (src.kind === "step") {
          v = r;
        } else if (src.kind === "plant") {
          // hitta rätt plant-state
          const pIndex = plantBlocks.findIndex((p) => p.id === src.id);
          if (pIndex >= 0) {
            v = plantStates[pIndex];
          } else {
            v = yCurrent; // fallback: använd sista plantens y
          }
        } else {
          // andra blocktyper kan få egen logik senare
          v = 0;
        }

        inputs.push(v);
      }

      const signs = sumBlock.params.signs ?? [];
      let sumOut = 0;
      for (let i = 0; i < inputs.length; i++) {
        const sign = signs[i] ?? "+";
        const sgn = sign === "-" ? -1 : 1;
        sumOut += sgn * inputs[i];
      }
      error = sumOut;
    } else {
      // gammal standard: r - y
      error = r - yCurrent;
    }

    const derivative = (error - prevError) / dt;

    let u = 0;
    if (!ctrlBlock) {
      // ingen controller → u = error (eller r, men error ger vettig stabilitet)
      u = error;
    } else {
      switch (ctrlType) {
        case "P":
          u = kp * error;
          break;
        case "PI":
          integral += error * dt;
          u = kp * error + ki * integral;
          break;
        case "PID":
        default:
          integral += error * dt;
          u = kp * error + ki * integral + kd * derivative;
          break;
      }
    }

    // uppdatera alla plants i serie
    let currentInput = u;
    for (let i = 0; i < plantBlocks.length; i++) {
      const pb = plantBlocks[i];
      const K = pb.params.K;
      const T = pb.params.T;

      const y_i = plantStates[i];
      const dy = (-y_i + K * currentInput) / T;
      const yNext = y_i + dy * dt;
      plantStates[i] = yNext;

      currentInput = yNext; // cascaded: output → input till nästa
    }

    const yNew = plantStates[plantStates.length - 1];

    samples.push({ t, r, y: yNew, u });

    prevError = error;
    t += dt;
  }

  const metrics = computeMetrics(samples);
  return { samples, metrics };
}
