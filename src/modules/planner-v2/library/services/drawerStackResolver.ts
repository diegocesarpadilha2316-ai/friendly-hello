import type { ResolvedCarcass } from "../contracts/CarcassConstructionRule";
import type { RunnerManufacturingSpec } from "../contracts/HardwareManufacturingSpec";
import type {
  DrawerBoxRule,
  DrawerIndustrialSlideRule,
  DrawerReadiness,
  DrawerSlideApplicationRule,
  DrawerStackRule,
  ResolvedDrawerIndustrialSlide,
  ResolvedDrawerOpening,
  ResolvedDrawerStack,
} from "../contracts/DrawerRules";

export type DrawerStackInput = {
  moduleDefinitionId: string;
  carcass: ResolvedCarcass;
  stackRule: DrawerStackRule;
  boxRule: DrawerBoxRule;
  slideRule: DrawerSlideApplicationRule;
  industrialSlideRule?: DrawerIndustrialSlideRule;
  industrialSlideSpec?: RunnerManufacturingSpec;
  frontWidthMm?: number;
  frontThicknessMm?: number;
};

export function resolveDrawerOpening(carcass: ResolvedCarcass): ResolvedDrawerOpening {
  const diagnostics = [...carcass.diagnostics.map((item) => item.message)];
  const values = [carcass.internalWidthMm, carcass.internalHeightMm, carcass.internalDepthMm];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    diagnostics.push("A abertura interna da carcass deve possuir largura, altura e profundidade positivas.");
  }
  const status: DrawerReadiness = carcass.validationStatus === "INVALID" || diagnostics.length > 0 ? "INVALID" : "READY";
  return {
    status,
    internalWidthMm: carcass.internalWidthMm,
    internalHeightMm: carcass.internalHeightMm,
    internalDepthMm: carcass.internalDepthMm,
    diagnostics,
  };
}

function resolveIndustrialSlide(
  input: DrawerStackInput,
  opening: ResolvedDrawerOpening,
): ResolvedDrawerIndustrialSlide | undefined {
  const rule = input.industrialSlideRule;
  if (!rule) return undefined;

  const diagnostics: string[] = [];
  const spec = input.industrialSlideSpec;
  if (!spec) diagnostics.push("Especificação de fabricação Blum ausente no HardwareRegistry.");
  if (rule.moduleDefinitionId !== input.moduleDefinitionId) diagnostics.push("DrawerIndustrialSlideRule pertence a outra ModuleDefinition.");
  if (!spec || spec.kind !== "runner" || spec.family !== rule.family || spec.variant !== rule.variant) {
    diagnostics.push("A variante industrial MOVENTO selecionada não corresponde ao rule do piloto.");
  }
  if (spec && !spec.supportedNominalLengthsMm.includes(rule.nominalLengthMm)) {
    diagnostics.push(`NL ${rule.nominalLengthMm} mm não está entre os comprimentos nominais oficiais do MOVENTO 760H.`);
  }

  const drawerWidthMm = opening.internalWidthMm - 42;
  const drawerLengthMm = rule.nominalLengthMm - 10;
  if (!Number.isFinite(drawerWidthMm) || drawerWidthMm <= 0) diagnostics.push("SKW industrial <= 0.");
  if (!Number.isFinite(drawerLengthMm) || drawerLengthMm <= 0) diagnostics.push("SKL industrial <= 0.");
  if (spec && rule.drawerSideThicknessMm > spec.drawerDimensionRules.sidePanelMaximumThicknessMm) {
    diagnostics.push("A espessura lateral da caixa excede o máximo documentado pela Blum.");
  }
  if (opening.internalDepthMm < drawerLengthMm) {
    diagnostics.push(`A abertura interna (${opening.internalDepthMm} mm) não comporta SKL ${drawerLengthMm} mm.`);
  }

  const status: DrawerReadiness = diagnostics.length > 0 ? "INVALID" : "READY";
  return {
    status,
    ruleId: rule.id,
    manufacturer: rule.manufacturer,
    family: rule.family,
    variant: rule.variant,
    nominalLengthMm: rule.nominalLengthMm,
    drawerLengthMm,
    drawerWidthMm,
    drawerSideThicknessMm: rule.drawerSideThicknessMm,
    mountingStatus: rule.mountingStatus,
    machiningStatus: rule.machiningStatus,
    diagnostics,
  };
}

export function resolveDrawerStack(input: DrawerStackInput): ResolvedDrawerStack {
  const { carcass, stackRule, boxRule, slideRule } = input;
  const opening = resolveDrawerOpening(carcass);
  const industrialSlide = resolveIndustrialSlide(input, opening);
  const diagnostics = [...opening.diagnostics, ...(industrialSlide?.diagnostics ?? [])];
  const invalidRule =
    stackRule.moduleDefinitionId !== input.moduleDefinitionId ||
    boxRule.moduleDefinitionId !== input.moduleDefinitionId ||
    slideRule.moduleDefinitionId !== input.moduleDefinitionId ||
    !Number.isInteger(stackRule.drawerCount) ||
    stackRule.drawerCount <= 0 ||
    stackRule.topRevealMm < 0 ||
    stackRule.bottomRevealMm < 0 ||
    stackRule.interDrawerGapMm < 0 ||
    stackRule.distribution !== "equal";

  if (invalidRule) diagnostics.push("Drawer rules inválidas ou pertencentes a outra ModuleDefinition.");

  const totalGapsMm = Math.max(0, stackRule.drawerCount - 1) * stackRule.interDrawerGapMm;
  const frontOpeningHeightMm = carcass.internalHeightMm - stackRule.topRevealMm - stackRule.bottomRevealMm;
  const frontHeightMm = (frontOpeningHeightMm - totalGapsMm) / stackRule.drawerCount;
  const frontWidthMm = input.frontWidthMm ?? carcass.internalWidthMm;
  const boxWidthMm = industrialSlide?.status === "READY"
    ? industrialSlide.drawerWidthMm
    : carcass.internalWidthMm - slideRule.lateralClearanceLeftMm - slideRule.lateralClearanceRightMm;
  const boxDepthMm = industrialSlide?.status === "READY"
    ? industrialSlide.drawerLengthMm
    : carcass.internalDepthMm - slideRule.depthClearanceMm;
  const boxHeightMm = frontHeightMm - boxRule.sideHeightReductionMm;
  const slideClearanceLeftMm = industrialSlide?.status === "READY" ? (carcass.internalWidthMm - boxWidthMm) / 2 : slideRule.lateralClearanceLeftMm;
  const slideClearanceRightMm = industrialSlide?.status === "READY" ? (carcass.internalWidthMm - boxWidthMm) / 2 : slideRule.lateralClearanceRightMm;

  if (!Number.isFinite(frontHeightMm) || frontHeightMm <= 0) diagnostics.push("A equação das frentes não fecha uma altura positiva.");
  if (!Number.isFinite(frontWidthMm) || frontWidthMm <= 0) diagnostics.push("Largura da frente inválida.");
  if (!Number.isFinite(boxWidthMm) || boxWidthMm <= 0) diagnostics.push("Drawer box width <= 0 após clearances da corrediça.");
  if (!Number.isFinite(boxDepthMm) || boxDepthMm <= 0) diagnostics.push("Profundidade interna insuficiente para o drawer box.");
  if (!Number.isFinite(boxHeightMm) || boxHeightMm <= 0) diagnostics.push("Altura da caixa de gaveta insuficiente.");

  const baseYmm = carcass.toeKickMm + carcass.thicknessProfileMm.panelMm;
  const items = [];
  for (let index = 0; index < Math.max(0, stackRule.drawerCount); index += 1) {
    const frontBottomMm = baseYmm + stackRule.topRevealMm + index * (frontHeightMm + stackRule.interDrawerGapMm);
    const frontTopMm = frontBottomMm + frontHeightMm;
    items.push({
      drawerId: `drawer-${index + 1}`,
      index: index + 1,
      frontId: `drawer-front-${index + 1}`,
      frontWidthMm,
      frontHeightMm,
      frontCenterYmm: (frontBottomMm + frontTopMm) / 2,
      frontTopMm,
      frontBottomMm,
      gapAboveMm: index === 0 ? stackRule.topRevealMm : stackRule.interDrawerGapMm,
      gapBelowMm: index === stackRule.drawerCount - 1 ? stackRule.bottomRevealMm : stackRule.interDrawerGapMm,
      boxWidthMm,
      boxHeightMm,
      boxDepthMm,
      slideClearanceLeftMm,
      slideClearanceRightMm,
      slideTravelMm: industrialSlide?.status === "READY" ? boxDepthMm : Math.max(0, Math.min(boxDepthMm, boxDepthMm * 0.85)),
    });
  }

  const stackBottomMm = items[0]?.frontBottomMm ?? 0;
  const stackTopMm = items.at(-1)?.frontTopMm ?? 0;
  const equationResidualMm = carcass.internalHeightMm - stackRule.topRevealMm - stackRule.bottomRevealMm - totalGapsMm - Math.max(0, frontHeightMm) * stackRule.drawerCount;
  if (Math.abs(equationResidualMm) > 0.001) diagnostics.push(`Equação das frentes não fecha: residual ${equationResidualMm} mm.`);
  if (Math.abs((stackTopMm - stackBottomMm) - (frontHeightMm * stackRule.drawerCount + totalGapsMm)) > 0.001) {
    diagnostics.push("Bounds verticais das frentes não preservam a distribuição declarada.");
  }

  const hasGeometryError = diagnostics.some((message) =>
    message.includes("insuficiente") || message.includes("inválid") || message.includes("não fecha") || message.includes("não preservam") || message.includes("<= 0") || message.includes("não comporta") || message.includes("não está") || message.includes("ausente") || message.includes("não corresponde") || message.includes("excede"),
  );
  const industrialIncomplete = Boolean(industrialSlide && (industrialSlide.machiningStatus === "INCOMPLETE" || industrialSlide.mountingStatus === "INCOMPLETE"));
  const status: DrawerReadiness = hasGeometryError || opening.status === "INVALID" ? "INVALID" : "READY";
  const finalDiagnostics = industrialSlide
    ? [...diagnostics, ...(industrialIncomplete ? ["MOVENTO 760H: machining/furação CNC permanece INCOMPLETE apesar da montagem documental READY."] : [])]
    : slideRule.manufacturingStatus === "INCOMPLETE"
      ? [...diagnostics, "Corrediça genérica sem dados industriais: manufacturing INCOMPLETE.", "Furação/machining de corrediça: INCOMPLETE."]
      : diagnostics;

  return {
    status,
    moduleDefinitionId: input.moduleDefinitionId,
    opening,
    ruleId: stackRule.id,
    drawerCount: stackRule.drawerCount,
    items,
    diagnostics: finalDiagnostics,
    industrialSlide,
  };
}
