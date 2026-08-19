import type { FurnitureInstance } from "../contracts/FurnitureInstance";
import type { StructuralConnectorManufacturingSpec, StructuralJoineryResolution, StructuralJoineryRule } from "../contracts/StructuralJoinery";
import { ConstructionProfileRegistry } from "../registry/ConstructionProfileRegistry";
import { HardwareRegistry } from "../registry/HardwareRegistry";
import { resolveCarcassConstruction } from "./carcassConstructionResolver";
import { resolveStructuralJoinery } from "./structuralJoineryResolver";

export type StructuralJoineryApplication = {
  rule?: StructuralJoineryRule;
  spec?: StructuralConnectorManufacturingSpec;
  carcass?: ReturnType<typeof resolveCarcassConstruction>;
  resolution?: StructuralJoineryResolution;
  diagnostics: string[];
};

function resolvedThickness(instance: FurnitureInstance) {
  if (instance.thicknessMm) return instance.thicknessMm;
  const side = instance.parts.find((part) => part.role === "side-left" || part.role === "side-right");
  const back = instance.parts.find((part) => part.role === "back");
  const shelf = instance.parts.find((part) => part.role === "shelf");
  return {
    panelMm: side?.thicknessMm ?? 0,
    doorMm: instance.parts.find((part) => part.role === "door")?.thicknessMm ?? side?.thicknessMm ?? 0,
    shelfMm: shelf?.thicknessMm ?? side?.thicknessMm ?? 0,
    backMm: back?.thicknessMm ?? 0,
  };
}

function resolvedToeKickMm(instance: FurnitureInstance, rule: StructuralJoineryRule) {
  const toeKick = instance.parts.find((part) => part.role === "toe-kick" || part.hardwareId === "toe-kick-profile");
  if (toeKick) return toeKick.dimensionsMm.height;
  const firstFront = instance.parts.find((part) => part.role === "door" || part.role === "drawer-front");
  const bottomReveal = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId)?.frontLayoutRule?.bottomRevealMm;
  return firstFront && bottomReveal !== undefined ? firstFront.positionMm.y - firstFront.dimensionsMm.height / 2 - bottomReveal : 0;
}

export function resolveStructuralJoineryForInstance(instance: FurnitureInstance): StructuralJoineryApplication {
  const profile = ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId);
  const rule = profile?.structuralJoineryRule;
  if (!profile) return { diagnostics: ["FurnitureInstance não possui ConstructionProfile profissional."] };
  if (!rule) return { diagnostics: ["ConstructionProfile sem structuralJoineryRule; Upper permanece INCOMPLETE honestamente."] };

  const variant = HardwareRegistry.getManufacturingVariant(rule.connectorHardwareId, rule.manufacturingVariantId);
  const spec = variant?.manufacturingSpec.kind === "structural-connector" ? variant.manufacturingSpec : undefined;
  if (!spec) return { rule, diagnostics: ["Structural connector ManufacturerSpec ausente ou incompatível."] };

  const carcass = resolveCarcassConstruction({
    moduleDefinitionId: instance.moduleDefinitionId,
    dimensionsMm: instance.dimensionsMm,
    thicknessMm: resolvedThickness(instance),
    toeKickMm: resolvedToeKickMm(instance, rule),
    shelves: instance.parts.filter((part) => part.role === "shelf").length,
    rule: profile.carcassRule,
  });
  const resolution = resolveStructuralJoinery({
    instanceId: instance.id,
    moduleDefinitionId: instance.moduleDefinitionId,
    resolvedCarcass: carcass,
    rule,
    connectorSpec: spec,
    parts: carcass.panels,
  });
  return { rule, spec, carcass, resolution, diagnostics: resolution.diagnostics };
}
