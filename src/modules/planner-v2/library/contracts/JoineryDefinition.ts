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
  | "runner-installation"
  | "handle-through"
  | "gola-profile"
  | "adjustable-foot"
  | "toe-kick-profile"
  | "toe-kick-clip"
  | "shelf-support"
  | "free-drilling";

export type JoineryFace = "F1" | "F2" | "T" | "B" | "L" | "R";
export type JoineryManufacturingRole = "ASSEMBLY" | "MACHINING" | "HARDWARE_VISUAL" | "PROFILE";
export type JoineryTruthStatus = "READY" | "INCOMPLETE" | "NOT_REQUIRED";
export interface JoineryCapabilityReadiness {
  scope: string;
  status: JoineryTruthStatus;
  missingParameters: string[];
  source: "PROFILE_RULE" | "MANUFACTURER_SPEC" | "SEMANTIC_ASSEMBLY" | "LEGACY_DEFAULT";
  reason: string;
}

export interface JoineryDefinition {
  id: string;
  moduleInstanceId: string;
  partId: string;
  kind: JoineryOperationKind;
  face?: JoineryFace;
  positionMm?: { x: number; y: number };
  /** Posição 3D no sistema local do módulo para relações estruturais; não é toolpath. */
  position3dMm?: { x: number; y: number; z: number };
  diameterMm?: number;
  depthMm?: number;
  angleDeg?: number;
  tool?: string;
  manufacturingRole: JoineryManufacturingRole;
  truthStatus: JoineryTruthStatus;
  unknownParameters: string[];
  source: "PROFILE_RULE" | "MANUFACTURER_SPEC" | "SEMANTIC_ASSEMBLY" | "LEGACY_DEFAULT";
  ruleId?: string;
  manufacturerSpecId?: string;
  provenance?: { sourceId: string; sourceRevision?: string; url?: string };
  hardwareId?: string;
  hardwareVariantId?: string;
  /** Stable references to related physical/hardware parts in the same instance. */
  relatedPartIds?: string[];
  /** Neutral structured parameters; not a CAM toolpath. */
  parameters?: Record<string, string | number | boolean | null>;
  notes?: string;
}
