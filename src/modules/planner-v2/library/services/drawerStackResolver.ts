import type { ResolvedCarcass } from "../contracts/CarcassConstructionRule";
import type {
  DrawerBoxRule,
  DrawerReadiness,
  DrawerSlideApplicationRule,
  DrawerStackRule,
  ResolvedDrawerOpening,
  ResolvedDrawerStack,
} from "../contracts/DrawerRules";

export type DrawerStackInput = {
  moduleDefinitionId: string;
  carcass: ResolvedCarcass;
  stackRule: DrawerStackRule;
  boxRule: DrawerBoxRule;
  slideRule: DrawerSlideApplicationRule;
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

export function resolveDrawerStack(input: DrawerStackInput): ResolvedDrawerStack {
  const { carcass, stackRule, boxRule, slideRule } = input;
  const opening = resolveDrawerOpening(carcass);
  const diagnostics = [...opening.diagnostics];
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
  const boxWidthMm = carcass.internalWidthMm - slideRule.lateralClearanceLeftMm - slideRule.lateralClearanceRightMm;
  const boxDepthMm = carcass.internalDepthMm - slideRule.depthClearanceMm;
  const boxHeightMm = frontHeightMm - boxRule.sideHeightReductionMm;

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
      slideClearanceLeftMm: slideRule.lateralClearanceLeftMm,
      slideClearanceRightMm: slideRule.lateralClearanceRightMm,
      slideTravelMm: Math.max(0, Math.min(boxDepthMm, boxDepthMm * 0.85)),
    });
  }

  const stackBottomMm = items[0]?.frontBottomMm ?? 0;
  const stackTopMm = items.at(-1)?.frontTopMm ?? 0;
  const equationResidualMm = carcass.internalHeightMm - stackRule.topRevealMm - stackRule.bottomRevealMm - totalGapsMm - Math.max(0, frontHeightMm) * stackRule.drawerCount;
  if (Math.abs(equationResidualMm) > 0.001) diagnostics.push(`Equação das frentes não fecha: residual ${equationResidualMm} mm.`);
  if (Math.abs((stackTopMm - stackBottomMm) - (frontHeightMm * stackRule.drawerCount + totalGapsMm)) > 0.001) {
    diagnostics.push("Bounds verticais das frentes não preservam a distribuição declarada.");
  }

  return {
    status: diagnostics.some((message) => message.includes("insuficiente") || message.includes("inválid") || message.includes("não fecha") || message.includes("não preservam") || message.includes("<= 0"))
      ? "INVALID"
      : opening.status === "INVALID"
        ? "INVALID"
        : "READY",
    moduleDefinitionId: input.moduleDefinitionId,
    opening,
    ruleId: stackRule.id,
    drawerCount: stackRule.drawerCount,
    items,
    diagnostics: slideRule.manufacturingStatus === "INCOMPLETE"
      ? [...diagnostics, "Corrediça genérica sem dados industriais: manufacturing INCOMPLETE.", "Furação/machining de corrediça: INCOMPLETE."]
      : diagnostics,
  };
}
