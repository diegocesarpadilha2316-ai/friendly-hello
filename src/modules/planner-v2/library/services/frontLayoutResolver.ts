import type {
  FrontLayoutDiagnosticCode,
  FrontLayoutRule,
  ResolvedFrontLayout,
} from "../contracts/FrontLayoutRule";

export interface FrontLayoutGeometryInput {
  moduleDefinitionId: string;
  cabinetWidthMm: number;
  cabinetHeightMm: number;
  cabinetDepthMm: number;
  frontBottomMm: number;
  frontTopMm: number;
  frontZMm: number;
}

const EPSILON_MM = 0.001;

function nearlyEqual(a: number, b: number, toleranceMm: number) {
  return Math.abs(a - b) <= toleranceMm;
}

export function resolveFrontLayout(
  input: FrontLayoutGeometryInput,
  rule: FrontLayoutRule,
): ResolvedFrontLayout {
  const diagnostics: string[] = [];
  const diagnosticCodes: FrontLayoutDiagnosticCode[] = [];
  const countIsValid = rule.frontCount === 1 || rule.frontCount === 2;
  const resolvedFrontCount = countIsValid ? rule.frontCount : 0;
  const frontSpanMm = input.frontTopMm - input.frontBottomMm;
  const frontHeightMm = frontSpanMm - rule.topRevealMm - rule.bottomRevealMm;
  const gaps = resolvedFrontCount === 2 ? [rule.interFrontGapMm] : [];
  const totalGapsMm = gaps.reduce((sum, gap) => sum + gap, 0);
  const availableWidthMm = input.cabinetWidthMm - rule.leftRevealMm - rule.rightRevealMm - totalGapsMm;
  const frontWidthMm = resolvedFrontCount > 0 ? availableWidthMm / resolvedFrontCount : 0;
  const edges: Array<{ left: number; right: number }> = [];
  const centers: number[] = [];
  const widths: number[] = [];
  const pivots: number[] = [];
  const hingeSides: Array<"left" | "right"> = [];

  if (!countIsValid) {
    diagnosticCodes.push("INVALID_FRONT_COUNT");
    diagnostics.push("Quantidade de frentes deve ser 1 ou 2.");
  }
  if (frontWidthMm <= 0 || frontHeightMm <= 0) {
    diagnosticCodes.push("ZERO_OR_NEGATIVE_FRONT_SIZE");
    diagnostics.push("Largura ou altura derivada de frente não é positiva.");
  }
  if (rule.leftRevealMm < 0 || rule.rightRevealMm < 0 || rule.interFrontGapMm < 0) {
    diagnosticCodes.push("NEGATIVE_GAP");
    diagnostics.push("Reveals e gaps não podem ser negativos.");
  }

  // Resolve edges from the left boundary first. Centers are derived afterward;
  // no incremental center formula can accumulate rounding error.
  let cursorMm = -input.cabinetWidthMm / 2 + rule.leftRevealMm;
  for (let index = 0; index < resolvedFrontCount; index += 1) {
    const left = cursorMm;
    const right = left + frontWidthMm;
    const center = (left + right) / 2;
    const hingeSide: "left" | "right" = resolvedFrontCount === 1 || index === 0 ? "left" : "right";
    edges.push({ left, right });
    centers.push(center);
    widths.push(frontWidthMm);
    hingeSides.push(hingeSide);
    pivots.push(hingeSide === "left" ? left : right);
    cursorMm = right + (gaps[index] ?? 0);
  }

  const closingSumMm =
    rule.leftRevealMm +
    widths.reduce((sum, width) => sum + width, 0) +
    totalGapsMm +
    rule.rightRevealMm;
  if (resolvedFrontCount > 0 && !nearlyEqual(closingSumMm, input.cabinetWidthMm, rule.toleranceMm)) {
    diagnosticCodes.push("FRONTS_OVERFLOW");
    diagnostics.push(`Fechamento horizontal inválido: ${closingSumMm} != ${input.cabinetWidthMm} mm.`);
  }

  if (rule.symmetric && resolvedFrontCount === 2) {
    if (!nearlyEqual(rule.leftRevealMm, rule.rightRevealMm, rule.toleranceMm)) {
      diagnosticCodes.push("ASYMMETRIC_LAYOUT");
      diagnostics.push("Layout declarado simétrico possui reveals externos diferentes.");
    }
    if (!nearlyEqual(widths[0] ?? 0, widths[1] ?? 0, rule.toleranceMm)) {
      diagnosticCodes.push("ASYMMETRIC_LAYOUT");
      diagnostics.push("Layout declarado simétrico possui larguras de frente diferentes.");
    }
    if (!nearlyEqual(centers[0] ?? 0, -(centers[1] ?? 0), rule.toleranceMm)) {
      diagnosticCodes.push("ASYMMETRIC_LAYOUT");
      diagnostics.push("Centros das frentes não são espelhos em relação ao eixo X.");
    }
  }

  const uniqueDiagnosticCodes = diagnosticCodes.filter((code, index) => diagnosticCodes.indexOf(code) === index);
  const validationStatus = uniqueDiagnosticCodes.length > 0
    ? uniqueDiagnosticCodes.some((code) => ["NEGATIVE_GAP", "FRONTS_OVERFLOW", "INVALID_FRONT_COUNT", "ZERO_OR_NEGATIVE_FRONT_SIZE"].includes(code))
      ? "INVALID"
      : "INCOMPLETE"
    : "READY";

  return {
    id: `${input.moduleDefinitionId}:${rule.id}:${input.cabinetWidthMm}x${input.cabinetHeightMm}x${input.cabinetDepthMm}`,
    ruleId: rule.id,
    moduleDefinitionId: input.moduleDefinitionId,
    cabinetWidthMm: input.cabinetWidthMm,
    cabinetHeightMm: input.cabinetHeightMm,
    cabinetDepthMm: input.cabinetDepthMm,
    frontCount: rule.frontCount,
    leftRevealMm: rule.leftRevealMm,
    rightRevealMm: rule.rightRevealMm,
    interFrontGapsMm: gaps,
    doorWidthsMm: widths,
    doorCentersMm: centers,
    doorEdgesMm: edges,
    topRevealMm: rule.topRevealMm,
    bottomRevealMm: rule.bottomRevealMm,
    doorHeightMm: frontHeightMm,
    frontZMm: input.frontZMm,
    hingeSides,
    pivotXByFrontMm: pivots,
    validationStatus,
    diagnostics,
    diagnosticCodes: uniqueDiagnosticCodes,
  };
}

export { EPSILON_MM };
