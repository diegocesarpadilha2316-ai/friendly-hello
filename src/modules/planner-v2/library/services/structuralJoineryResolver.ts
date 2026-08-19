import type {
  ResolvedStructuralJoint,
  StructuralJoineryResolution,
  StructuralJoineryResolverInput,
  StructuralJointRelation,
} from "../contracts/StructuralJoinery";
import type { ResolvedCarcassPanel } from "../contracts/CarcassConstructionRule";

const EPSILON = 0.001;

const relationParts: Record<StructuralJointRelation, { side: "side-left" | "side-right"; panel: "base" | "top" }> = {
  "side-left-to-base": { side: "side-left", panel: "base" },
  "side-right-to-base": { side: "side-right", panel: "base" },
  "side-left-to-top": { side: "side-left", panel: "top" },
  "side-right-to-top": { side: "side-right", panel: "top" },
};

function bounds(panel: ResolvedCarcassPanel) {
  return {
    x: [panel.positionMm.x - panel.dimensionsMm.width / 2, panel.positionMm.x + panel.dimensionsMm.width / 2] as const,
    y: [panel.positionMm.y - panel.dimensionsMm.height / 2, panel.positionMm.y + panel.dimensionsMm.height / 2] as const,
    z: [panel.positionMm.z - panel.dimensionsMm.depth / 2, panel.positionMm.z + panel.dimensionsMm.depth / 2] as const,
  };
}

function overlapsOrTouches(a: readonly [number, number], b: readonly [number, number]) {
  return a[0] <= b[1] + EPSILON && b[0] <= a[1] + EPSILON;
}

function contactCompatible(host: ResolvedCarcassPanel, target: ResolvedCarcassPanel) {
  const a = bounds(host);
  const b = bounds(target);
  return overlapsOrTouches(a.x, b.x) && overlapsOrTouches(a.y, b.y) && overlapsOrTouches(a.z, b.z);
}

function relationFace(relation: StructuralJointRelation) {
  const { side, panel } = relationParts[relation];
  return {
    hostFace: panel === "base" ? "T" as const : "B" as const,
    targetFace: side === "side-left" ? "R" as const : "L" as const,
  };
}

function findPanel(parts: readonly ResolvedCarcassPanel[], role: ResolvedCarcassPanel["role"]) {
  return parts.find((part) => part.role === role);
}

function invalidResolution(input: StructuralJoineryResolverInput, diagnostics: string[]): StructuralJoineryResolution {
  return {
    status: "INVALID",
    joints: [],
    diagnostics,
    carcassId: input.resolvedCarcass.id,
    ruleId: input.rule.id,
  };
}

export function resolveStructuralJoinery(input: StructuralJoineryResolverInput): StructuralJoineryResolution {
  const diagnostics = [...input.resolvedCarcass.diagnostics.map((item) => item.message)];
  if (input.resolvedCarcass.validationStatus === "INVALID") {
    return invalidResolution(input, ["ResolvedCarcass inválido.", ...diagnostics]);
  }
  if (input.rule.moduleDefinitionId !== input.moduleDefinitionId) {
    return invalidResolution(input, [
      `StructuralJoineryRule ${input.rule.id} não pertence a ${input.moduleDefinitionId}.`,
    ]);
  }
  if (input.connectorSpec.minimumPanelThicknessMm > 18) {
    return invalidResolution(input, ["A regra estrutural exige espessura superior à espessura do Golden."]);
  }

  const joints: ResolvedStructuralJoint[] = [];
  const depth = input.resolvedCarcass.dimensionsMm.depth;
  const frontZ = depth / 2 - input.rule.placement.frontOffsetFromRearMm;
  const rearZ = -depth / 2 + input.rule.placement.rearOffsetFromFrontMm;
  if (frontZ <= rearZ + input.rule.placement.minimumClearSpanMm) {
    return invalidResolution(input, [
      `Profundidade ${depth} mm não comporta os offsets declarados da policy sem sobreposição.`,
    ]);
  }

  for (const relation of input.rule.eligibleRelations) {
    const mapping = relationParts[relation];
    const side = findPanel(input.parts, mapping.side);
    const panel = findPanel(input.parts, mapping.panel);
    if (!side || !panel) {
      diagnostics.push(`Relação ${relation} sem host/target materializados no ResolvedCarcass.`);
      continue;
    }
    if ((side.thicknessMm ?? 0) < input.connectorSpec.minimumPanelThicknessMm || (panel.thicknessMm ?? 0) < input.connectorSpec.minimumPanelThicknessMm) {
      return invalidResolution(input, [
        `Relação ${relation} fora da espessura mínima de ${input.connectorSpec.minimumPanelThicknessMm} mm.`,
      ]);
    }
    if (!contactCompatible(panel, side)) {
      return invalidResolution(input, [`Relação ${relation} não possui contato geométrico compatível.`]);
    }

    const faces = relationFace(relation);
    [frontZ, rearZ].forEach((z, occurrenceIndex) => {
      const occurrence = (occurrenceIndex + 1) as 1 | 2;
      const id = `${input.instanceId}:${relation}:occurrence-${occurrence}`;
      const sideSign = mapping.side === "side-left" ? -1 : 1;
      const housingX = side.positionMm.x + sideSign * (side.dimensionsMm.width / 2 - input.connectorSpec.housingDiameterMm / 2 - input.connectorSpec.housingReferenceFromEdgeMm);
      joints.push({
        id,
        relationId: relation,
        relationOccurrence: occurrence,
        instanceId: input.instanceId,
        moduleDefinitionId: input.moduleDefinitionId,
        ruleId: input.rule.id,
        connectorHardwareId: input.rule.connectorHardwareId,
        manufacturingVariantId: input.rule.manufacturingVariantId,
        hostPartId: `${input.instanceId}:${panel.idSuffix}`,
        targetPartId: `${input.instanceId}:${side.idSuffix}`,
        hostFace: faces.hostFace,
        targetFace: faces.targetFace,
        jointAxis: "Y",
        positionMm: { x: housingX, y: panel.positionMm.y, z },
        positionSemantics: "family-application-rule",
        quantityIndex: joints.length + 1,
        assemblyStatus: "READY",
        machiningStatus: "INCOMPLETE",
        unknownParameters: ["targetBoltHoleDiameterMm", "targetBoltHoleDepthMm", "targetTool"],
        diagnostics: ["Housing Minifix documentado; furação do bolt permanece INCOMPLETE quando a fonte selecionada não fornece diâmetro/profundidade/tool."],
        provenance: {
          manufacturer: input.connectorSpec.provenance,
          applicationRule: input.rule.provenance,
        },
      });
    });
  }

  const status = diagnostics.length > 0 ? "INCOMPLETE" : joints.length > 0 ? "INCOMPLETE" : "INVALID";
  return {
    status,
    joints,
    diagnostics,
    carcassId: input.resolvedCarcass.id,
    ruleId: input.rule.id,
  };
}
