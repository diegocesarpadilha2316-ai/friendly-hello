import type {
  CarcassConstructionRule,
  CarcassDiagnostic,
  ResolvedCarcass,
  ResolvedCarcassPanel,
  ResolvedCarcassToeKick,
} from "../contracts/CarcassConstructionRule";
import type { Dimensions3, ThicknessProfileMm } from "../contracts/ModuleDefinition";

export type CarcassConstructionInput = {
  moduleDefinitionId: string;
  dimensionsMm: Dimensions3;
  thicknessMm: ThicknessProfileMm;
  toeKickMm: number;
  shelves: number;
  rule: CarcassConstructionRule;
};

function profile(input: ThicknessProfileMm): Required<ThicknessProfileMm> {
  const panelMm = input.panelMm ?? 18;
  return {
    panelMm,
    doorMm: input.doorMm ?? panelMm,
    shelfMm: input.shelfMm ?? panelMm,
    backMm: input.backMm ?? 6,
  };
}

function panel(
  idSuffix: ResolvedCarcassPanel["idSuffix"],
  role: ResolvedCarcassPanel["role"],
  name: string,
  dimensionsMm: Dimensions3,
  positionMm: { x: number; y: number; z: number },
  thicknessMm: number,
  materialSlot: ResolvedCarcassPanel["materialSlot"],
  grainDirection: ResolvedCarcassPanel["grainDirection"],
  edgeBandingEdges: ResolvedCarcassPanel["edgeBandingEdges"],
  relation: ResolvedCarcassPanel["relation"],
): ResolvedCarcassPanel {
  return {
    idSuffix,
    role,
    name,
    dimensionsMm,
    positionMm,
    thicknessMm,
    materialSlot,
    grainDirection,
    edgeBandingEdges,
    relation,
  };
}

function diagnostic(code: CarcassDiagnostic["code"], message: string, partId?: string): CarcassDiagnostic {
  return { code, message, partId };
}

export function resolveCarcassConstruction(input: CarcassConstructionInput): ResolvedCarcass {
  const { dimensionsMm: dims, rule } = input;
  const thicknessMm = profile(input.thicknessMm);
  const diagnostics: CarcassDiagnostic[] = [];
  const panelMm = thicknessMm.panelMm;
  const bodyBottomMm = rule.toeKickRelation === "none" ? 0 : input.toeKickMm;
  const bodyHeightMm = dims.height - bodyBottomMm;
  const internalWidthMm = dims.width - 2 * panelMm;
  const internalHeightMm = bodyHeightMm - 2 * panelMm;
  const internalDepthMm = dims.depth - thicknessMm.backMm;

  if ([dims.width, dims.height, dims.depth].some((value) => !Number.isFinite(value) || value <= 0)) {
    diagnostics.push(diagnostic("INVALID_DIMENSIONS", "Dimensões externas devem ser finitas e positivas."));
  }
  if (!Number.isFinite(input.toeKickMm) || input.toeKickMm < 0) {
    diagnostics.push(diagnostic("INVALID_TOE_KICK", "Toe kick deve ser finito e não negativo."));
  } else if (rule.toeKickRelation === "none" && input.toeKickMm !== 0) {
    diagnostics.push(diagnostic("UNEXPECTED_TOE_KICK", "Esta regra não permite toe kick."));
  } else if (rule.toeKickRelation === "separate-profile-supported-by-feet" && input.toeKickMm <= 0) {
    diagnostics.push(diagnostic("MISSING_REQUIRED_TOE_KICK", "Esta regra exige toe kick positivo."));
  }
  if ([panelMm, thicknessMm.shelfMm, thicknessMm.backMm].some((value) => !Number.isFinite(value) || value <= 0)) {
    diagnostics.push(diagnostic("INVALID_PANEL_THICKNESS", "Espessuras de painel, prateleira e fundo devem ser positivas."));
  }
  if (internalWidthMm < 0) {
    diagnostics.push(diagnostic("NEGATIVE_INTERNAL_WIDTH", `Largura interna negativa: ${internalWidthMm} mm.`));
  }
  if (internalHeightMm < 0) {
    diagnostics.push(diagnostic("NEGATIVE_INTERNAL_HEIGHT", `Altura interna negativa: ${internalHeightMm} mm.`));
  }

  const bodyHeight = Math.max(0, bodyHeightMm);
  const innerWidth = Math.max(0, internalWidthMm);
  const innerHeight = Math.max(0, internalHeightMm);
  const edgeBanding = (role: ResolvedCarcassPanel["role"]) => rule.edgeBandingEdgesByRole[role] ?? [];
  const panels: ResolvedCarcassPanel[] = [
    panel(
      "side-left",
      "side-left",
      "Lateral esquerda",
      { width: panelMm, height: bodyHeight, depth: dims.depth },
      { x: -(dims.width - panelMm) / 2, y: bodyBottomMm + bodyHeight / 2, z: 0 },
      panelMm,
      "body",
      "vertical",
      edgeBanding("side-left"),
      { relation: rule.sideRelation, references: rule.toeKickRelation === "none" ? ["cabinet-envelope"] : ["cabinet-envelope", "toe-kick"], explanation: rule.toeKickRelation === "none" ? "Lateral esquerda ocupa toda a altura estrutural do aéreo." : "Lateral esquerda ocupa a altura estrutural acima do rodapé." },
    ),
    panel(
      "side-right",
      "side-right",
      "Lateral direita",
      { width: panelMm, height: bodyHeight, depth: dims.depth },
      { x: (dims.width - panelMm) / 2, y: bodyBottomMm + bodyHeight / 2, z: 0 },
      panelMm,
      "body",
      "vertical",
      edgeBanding("side-right"),
      { relation: rule.sideRelation, references: rule.toeKickRelation === "none" ? ["cabinet-envelope"] : ["cabinet-envelope", "toe-kick"], explanation: rule.toeKickRelation === "none" ? "Lateral direita ocupa toda a altura estrutural do aéreo." : "Lateral direita é o espelho geométrico da lateral esquerda." },
    ),
    panel(
      "base",
      "base",
      "Base",
      { width: innerWidth, height: panelMm, depth: dims.depth },
      { x: 0, y: bodyBottomMm + panelMm / 2, z: 0 },
      panelMm,
      "body",
      "horizontal",
      edgeBanding("base"),
      { relation: rule.baseRelation, references: ["side-left", "side-right"], explanation: "Base fica entre as laterais e ocupa o vão interno." },
    ),
    panel(
      "top",
      "top",
      "Topo",
      { width: innerWidth, height: panelMm, depth: dims.depth },
      { x: 0, y: dims.height - panelMm / 2, z: 0 },
      panelMm,
      "body",
      "horizontal",
      edgeBanding("top"),
      { relation: rule.topRelation, references: ["side-left", "side-right", "cabinet-top"], explanation: "Topo é um painel inteiro entre as laterais e nivelado ao topo do gabinete." },
    ),
    panel(
      "back",
      "back",
      "Fundo",
      { width: innerWidth, height: innerHeight, depth: thicknessMm.backMm },
      { x: 0, y: bodyBottomMm + bodyHeight / 2, z: -dims.depth / 2 + thicknessMm.backMm / 2 },
      thicknessMm.backMm,
      "back",
      "none",
      edgeBanding("back"),
      { relation: rule.backRelation, references: ["side-left", "side-right", "base", "top"], explanation: "Fundo recuado no plano traseiro, independente da espessura do corpo." },
    ),
  ];

  for (let index = 0; index < Math.max(0, Math.floor(input.shelves)); index += 1) {
    const ratio = (index + 1) / (Math.max(0, Math.floor(input.shelves)) + 1);
    const shelfY = bodyBottomMm + panelMm + innerHeight * ratio;
    panels.push(
      panel(
        `shelf-${index + 1}`,
        "shelf",
        `Prateleira ${index + 1}`,
        { width: Math.max(0, innerWidth - rule.shelfSideClearanceMm), height: thicknessMm.shelfMm, depth: Math.max(thicknessMm.shelfMm, dims.depth - rule.shelfDepthInsetMm) },
        { x: 0, y: shelfY, z: 10 },
        thicknessMm.shelfMm,
        "body",
        "horizontal",
        edgeBanding("shelf"),
        { relation: rule.shelfRelation, references: ["side-left", "side-right", "shelf-support"], explanation: "Prateleira fica entre as laterais e é suportada pelos componentes de apoio existentes." },
      ),
    );
  }

  const toeKick: ResolvedCarcassToeKick | undefined = rule.toeKickRelation === "separate-profile-supported-by-feet" && input.toeKickMm > 0
    ? {
        idSuffix: "toe-kick",
        role: "toe-kick",
        dimensionsMm: { width: innerWidth, height: input.toeKickMm, depth: rule.toeKickInsetMm },
        positionMm: { x: 0, y: input.toeKickMm / 2, z: dims.depth / 2 - rule.toeKickInsetMm - rule.toeKickInsetMm / 2 },
        relation: {
          relation: rule.toeKickRelation,
          references: ["leg-adjustable"],
          explanation: "Rodapé é perfil separado apoiado pelo sistema de pés reguláveis.",
        },
      }
    : undefined;

  const left = panels.find((item) => item.role === "side-left");
  const right = panels.find((item) => item.role === "side-right");
  if (left && right && Math.abs(left.positionMm.x + right.positionMm.x) > 0.001) {
    diagnostics.push(diagnostic("ASYMMETRIC_SIDES", "As laterais não são espelhadas no eixo X."));
  }
  if (internalWidthMm >= 0 && panels.some((item) => item.role === "base" && item.dimensionsMm.width !== internalWidthMm)) {
    diagnostics.push(diagnostic("STRUCTURAL_GAP", "A largura da base não fecha o vão entre as laterais.", "base"));
  }

  return {
    id: `${rule.id}:${dims.width}x${dims.height}x${dims.depth}`,
    moduleDefinitionId: input.moduleDefinitionId,
    dimensionsMm: dims,
    thicknessProfileMm: thicknessMm,
    toeKickMm: input.toeKickMm,
    internalWidthMm,
    internalHeightMm,
    internalDepthMm,
    bodyHeightMm,
    panels,
    toeKick,
    validationStatus: diagnostics.some((item) => item.code === "INVALID_DIMENSIONS" || item.code === "INVALID_TOE_KICK" || item.code === "UNEXPECTED_TOE_KICK" || item.code === "MISSING_REQUIRED_TOE_KICK" || item.code === "INVALID_PANEL_THICKNESS" || item.code.startsWith("NEGATIVE_") || item.code === "ASYMMETRIC_SIDES" || item.code === "STRUCTURAL_GAP")
      ? "INVALID"
      : "READY",
    diagnostics,
  };
}

export function validateResolvedCarcass(carcass: ResolvedCarcass): ResolvedCarcass["diagnostics"] {
  return carcass.diagnostics;
}
