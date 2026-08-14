export type JoineryOperationKind =
  | "minifix-head"
  | "minifix-body"
  | "dowel"
  | "confirmat"
  | "hinge-cup"
  | "hinge-fixing"
  | "slide-fixing"
  | "handle-through"
  | "free-drilling";

export type JoineryFace = "F1" | "F2" | "T" | "B" | "L" | "R";

export interface JoineryDefinition {
  id: string;
  moduleInstanceId: string;
  partId: string;
  kind: JoineryOperationKind;
  face: JoineryFace;
  positionMm: { x: number; y: number };
  diameterMm: number;
  depthMm: number;
  angleDeg?: number;
  tool: string;
  hardwareId?: string;
  notes?: string;
}
