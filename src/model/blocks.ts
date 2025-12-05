// src/model/blocks.ts

export type BlockKind = "step" | "controller" | "plant" | "sum" | "scope";
export type ControllerType = "P" | "PI" | "PID";

export type BaseBlock = {
  id: string;
  kind: BlockKind;
  x: number;
  y: number;
};

export type StepBlock = BaseBlock & {
  kind: "step";
  params: {
    amplitude: number;
    startTime: number;
  };
};

export type ControllerBlock = BaseBlock & {
  kind: "controller";
  params: {
    type: ControllerType;
    kp: number;
    ki: number;
    kd: number;
  };
};

export type PlantBlock = BaseBlock & {
  kind: "plant";
  params: {
    K: number;
    T: number;
  };
};

// 🔸 gör SumBlock konsekvent med BaseBlock + riktiga params
export type SumBlock = BaseBlock & {
  kind: "sum";
  params: {
    signs: ("+" | "-")[]; // t.ex. ["+", "-"] = r - y_feedback
  };
};

export type ScopeBlock = BaseBlock & {
  kind: "scope";
  params: {};
};

export type AnyBlock =
  | StepBlock
  | ControllerBlock
  | PlantBlock
  | SumBlock
  | ScopeBlock;

export type Connection = {
  id: string;
  fromId: string;
  toId: string;
};

export const createDefaultBlock = (
  kind: BlockKind,
  idSuffix: number
): AnyBlock => {
  const base: BaseBlock = {
    id: `${kind}-${idSuffix}`,
    kind,
    x: 80 + idSuffix * 20,
    y: 70 + idSuffix * 10,
  };

  switch (kind) {
    case "step":
      return {
        ...base,
        kind: "step",
        params: { amplitude: 1, startTime: 0 },
      };
    case "controller":
      return {
        ...base,
        kind: "controller",
        params: { type: "PID", kp: 2, ki: 1, kd: 0.2 },
      };
    case "plant":
      return {
        ...base,
        kind: "plant",
        params: { K: 1, T: 1.5 },
      };
    case "sum":
      return {
        ...base,
        kind: "sum",
        params: {
          signs: ["+", "-"], // t.ex. r - y_feedback som standard
        },
      };
    case "scope":
      return {
        ...base,
        kind: "scope",
        params: {},
      };
  }
};
