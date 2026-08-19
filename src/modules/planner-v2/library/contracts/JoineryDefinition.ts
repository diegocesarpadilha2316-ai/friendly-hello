export type JoineryOperationKind =
  | "minifix-head"
  | "minifix-body"
  | "dowel"
  | "confirmat"
  | "hinge-cup"
  | "hinge-fixing"
  | "mounting-plate-placement"
  | "mounting-plate-fixing"
  | "slide-fixing"
  | "handle-through"
  | "gola-profile"
  | "adjustable-foot"
  | "toe-kick-profile"
  | "toe-kick-clip"
  | "shelf-support"
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
  /** Stable references to related physical/hardware parts in the same instance. */
  relatedPartIds?: string[];
  /** Neutral structured parameters; not a CAM toolpath. */
  parameters?: Record<string, string | number | boolean | null>;
  notes?: string;
}
