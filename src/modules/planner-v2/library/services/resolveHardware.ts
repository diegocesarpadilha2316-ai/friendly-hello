import type { HardwareDefinition } from "../contracts/HardwareDefinition";
import { HardwareRegistry } from "../registry/HardwareRegistry";

export function resolveHardware(
  hardwareIds: string[],
  overrides?: Record<string, string>
): HardwareDefinition[] {
  return hardwareIds
    .map((id) => overrides?.[id] ?? id)
    .map((id) => HardwareRegistry.get(id))
    .filter((item): item is HardwareDefinition => Boolean(item));
}