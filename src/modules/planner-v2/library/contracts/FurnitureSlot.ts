export type FurnitureSlot =
  | "body"
  | "front"
  | "door"
  | "back"
  | "shelf"
  | "edge"
  | "handle"
  | "hinge"
  | "toe-kick"
  | "countertop"
  | "drawer"
  | "drawer-front"
  | "slide";

export const FURNITURE_SLOTS = [
  "body",
  "front",
  "door",
  "back",
  "shelf",
  "edge",
  "handle",
  "hinge",
  "toe-kick",
  "countertop",
  "drawer",
  "drawer-front",
  "slide",
] as const satisfies readonly FurnitureSlot[];

const FURNITURE_SLOT_SET = new Set<string>(FURNITURE_SLOTS);

export type FurnitureSlotMap = Partial<Record<FurnitureSlot, string>>;

export type FurnitureSlotDiagnostics = {
  known: FurnitureSlot[];
  legacy: string[];
  invalid: string[];
  warnings: string[];
};

export function isFurnitureSlot(value: string): value is FurnitureSlot {
  return FURNITURE_SLOT_SET.has(value);
}

/**
 * Validates the semantic vocabulary without rejecting legacy extension keys.
 * Unknown non-empty keys remain usable by existing families and are reported as
 * legacy so saved projects and third-party modules are not broken.
 */
export function validateFurnitureSlotMap(
  values: Record<string, string> | undefined,
): FurnitureSlotDiagnostics {
  const known: FurnitureSlot[] = [];
  const legacy: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const [slot, value] of Object.entries(values ?? {})) {
    if (!value || !value.trim()) {
      invalid.push(slot);
      warnings.push(`Slot ${slot} possui valor vazio.`);
      continue;
    }
    if (isFurnitureSlot(slot)) known.push(slot);
    else {
      legacy.push(slot);
      warnings.push(`Slot legado/desconhecido preservado: ${slot}.`);
    }
  }

  return { known, legacy, invalid, warnings };
}

export function mergeFurnitureSlotMaps(
  ...maps: Array<Record<string, string> | undefined>
): Record<string, string> {
  return Object.assign({}, ...maps.filter(Boolean));
}
