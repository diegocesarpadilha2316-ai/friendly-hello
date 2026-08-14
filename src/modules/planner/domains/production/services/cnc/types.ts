/**
 * Fase 3.19 — CNC Enterprise.
 * Contratos puros. Zero providers, zero stores, zero migrations.
 * Mutações no projeto continuam via updateProject().
 */
export type CncBrand =
  "homag" | "biesse" | "scm" | "rover" | "morbidelli" | "weeke" | "holzher" | "vitap" | "generic";

export type CncFormat = "gcode" | "bpp" | "cix" | "cid3" | "dxf" | "nc" | "mpr" | "xml";

export type CncOperationKind =
  | "drill-through"
  | "drill-blind"
  | "countersink"
  | "drill-angled"
  | "minifix"
  | "cavilha"
  | "screw"
  | "confirmat"
  | "hinge"
  | "slide"
  | "piston"
  | "hanger"
  | "led-profile"
  | "groove-back"
  | "groove-led"
  | "rebate"
  | "pocket"
  | "partial-rebate"
  | "slot-horizontal"
  | "slot-vertical"
  | "channel"
  | "circular"
  | "rectangular"
  | "glass"
  | "mirror"
  | "custom";

export type CncToolKind =
  "drill" | "end-mill" | "ball-mill" | "vee-mill" | "saw" | "disc" | "countersink-tool" | "special";

export interface CncMachine {
  readonly id: string;
  readonly brand: CncBrand;
  readonly model: string;
  readonly axes: 3 | 4 | 5;
  readonly formats: readonly CncFormat[];
  readonly bedX: number;
  readonly bedY: number;
  readonly bedZ: number;
  readonly maxRpm: number;
  readonly maxFeed: number;
  readonly toolChanger: boolean;
  readonly notes?: string;
}

export interface CncTool {
  readonly id: string;
  readonly kind: CncToolKind;
  readonly label: string;
  readonly diameterMm: number;
  readonly lengthMm: number;
  readonly rpm: number;
  readonly feedMmMin: number;
  readonly maxDepthMm: number;
  readonly material: "wood" | "mdf" | "glass" | "aluminum" | "acrylic" | "universal";
  readonly lifetimeMin: number;
}

export interface CncOperation {
  readonly id: string;
  readonly partId: string;
  readonly partCode: string;
  readonly kind: CncOperationKind;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly widthMm?: number;
  readonly heightMm?: number;
  readonly diameterMm?: number;
  readonly depthMm: number;
  readonly angleDeg?: number;
  readonly toolId: string;
  readonly estimatedSec: number;
  readonly notes?: string;
}

export interface CncProgram {
  readonly id: string;
  readonly machineId: string;
  readonly format: CncFormat;
  readonly partCode: string;
  readonly operations: readonly CncOperation[];
  readonly tools: readonly CncTool[];
  readonly code: string;
  readonly estimatedMin: number;
  readonly generatedAt: string;
}

export interface CncIssue {
  readonly severity: "info" | "warn" | "error";
  readonly kind:
    | "duplicate-drill"
    | "collision"
    | "flipped-part"
    | "wrong-grain"
    | "out-of-bounds"
    | "impossible-channel"
    | "incompatible-tool"
    | "impossible-operation";
  readonly operationId?: string;
  readonly partCode?: string;
  readonly message: string;
}

export interface CncSimulationFrame {
  readonly t: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly toolId: string;
  readonly operationId: string;
  readonly rpm: number;
  readonly feed: number;
}

export interface CncSimulation {
  readonly partCode: string;
  readonly machineId: string;
  readonly frames: readonly CncSimulationFrame[];
  readonly totalMin: number;
  readonly toolChanges: number;
  readonly issues: readonly CncIssue[];
}
