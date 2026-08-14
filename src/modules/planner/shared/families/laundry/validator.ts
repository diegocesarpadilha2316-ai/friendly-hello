/**
 * VALIDADOR DA FAMÍLIA LAVANDERIA.
 * Separa ERRO (o móvel não se sustenta / o aparelho não funciona),
 * AVISO (funciona mas merece atenção) e RECOMENDAÇÃO ergonômica.
 * Recomendação NUNCA vira erro.
 */
import { applianceEnvelopeMm, isTopLoader } from "./appliances";
import {
  laundryGeometryFaults,
  laundryReservationConflicts,
  type LaundryBuildResult,
} from "./build";
import { LAUNDRY_MODULE_PROFILES } from "./spec";
import { minWidthForTubMm, tubFit, TUB_STRUCTURAL_CLEARANCE_MM } from "./tub";
import { appliancesStackHeightMm, BOARD_TRAVEL_MM } from "./modules";

export type LaundryIssueLevel = "erro" | "aviso" | "recomendacao";

export interface LaundryIssue {
  readonly code: string;
  readonly level: LaundryIssueLevel;
  readonly message: string;
}

export interface LaundryErgonomics {
  readonly counterHeightMm: [number, number];
  readonly upperBottomMm: [number, number];
  readonly circulationMm: number;
  readonly tubStructuralClearanceMm: number;
  readonly maintenanceMm: number;
  readonly ventilationMm: number;
  readonly wallHungFloorGapMm: [number, number];
}

export const LAUNDRY_ERGONOMICS: LaundryErgonomics = {
  counterHeightMm: [850, 1000],
  upperBottomMm: [1400, 1600],
  circulationMm: 800,
  tubStructuralClearanceMm: TUB_STRUCTURAL_CLEARANCE_MM,
  maintenanceMm: 50,
  ventilationMm: 50,
  wallHungFloorGapMm: [200, 500],
};

export interface LaundryValidation {
  readonly ok: boolean;
  readonly issues: readonly LaundryIssue[];
}

export function validateLaundryModule(
  result: LaundryBuildResult,
  ergonomics: LaundryErgonomics = LAUNDRY_ERGONOMICS,
): LaundryValidation {
  const { spec, layout: g, assembly } = result;
  const p = LAUNDRY_MODULE_PROFILES[spec.kind];
  const issues: LaundryIssue[] = [];
  const err = (code: string, message: string) => issues.push({ code, level: "erro", message });
  const warn = (code: string, message: string) => issues.push({ code, level: "aviso", message });
  const tip = (code: string, message: string) =>
    issues.push({ code, level: "recomendacao", message });

  /* ── medidas mínimas ── */
  if (spec.widthMm < p.minWidthMm)
    err("largura-minima", `largura ${spec.widthMm} mm abaixo do mínimo ${p.minWidthMm} mm`);
  if (spec.depthMm < p.minDepthMm)
    err(
      "profundidade-minima",
      `profundidade ${spec.depthMm} mm abaixo do mínimo ${p.minDepthMm} mm`,
    );
  if (spec.depthMm > p.maxDepthMm)
    warn("profundidade-maxima", `profundidade acima do usual (${p.maxDepthMm} mm)`);

  /* ── aparelhos: envelope, ventilação, manutenção, aberturas ── */
  const a = spec.appliance;
  if (a.kind !== "nenhum") {
    const env = applianceEnvelopeMm(a);
    if (spec.widthMm < env.widthMm + 2 * spec.thicknessMm)
      err(
        "maquina-nao-cabe",
        `nicho de ${spec.widthMm} mm não acomoda ${a.kind} (${env.widthMm} mm + laterais)`,
      );
    const needed = appliancesStackHeightMm(spec);
    if (g.interiorHeightMm + 2 * spec.thicknessMm < needed)
      err(
        "altura-maquina",
        `altura interna de ${Math.round(g.interiorHeightMm)} mm insuficiente para ${needed} mm de aparelho(s)`,
      );
    if (g.caseDepthMm < env.depthMm)
      err(
        "profundidade-maquina",
        `profundidade útil de ${Math.round(g.caseDepthMm)} mm menor que o aparelho (${env.depthMm} mm)`,
      );
    if (a.ventilation && spec.closedBack)
      err("ventilacao-bloqueada", "aparelho ventilado exige fundo aberto ou recortado");
    if (a.serviceMm < ergonomics.maintenanceMm)
      tip("manutencao", `reserve ao menos ${ergonomics.maintenanceMm} mm para manutenção`);
    if (!a.water) warn("sem-agua", `${a.kind} declarado sem ponto de água`);
    if (!a.drain) warn("sem-esgoto", `${a.kind} declarado sem ponto de esgoto`);
    if (!a.power) warn("sem-eletrico", `${a.kind} declarado sem ponto elétrico`);

    /* abertura frontal × abertura superior */
    if (isTopLoader(a)) {
      if (spec.countertop.material !== "nenhum")
        err("tampo-sobre-maquina-superior", "máquina de abertura superior nunca recebe tampo");
      if (a.topLidMm <= 0)
        err("abertura-superior", "máquina de abertura superior sem curso de tampa declarado");
    } else if (a.doorOpening === "frontal" && a.doorArcMm <= 0) {
      err("abertura-frontal", "máquina frontal sem curso de porta declarado");
    }
    if (spec.appliance.kind === "torre" && !spec.stackingKit)
      warn("torre-sem-kit", "torre sem kit de empilhamento declarado");
  }

  /* ── tanque, sifão e válvula ── */
  const t = spec.tub;
  if (t.type !== "nenhum") {
    const fit = tubFit({
      widthMm: spec.widthMm,
      thicknessMm: spec.thicknessMm,
      tub: t,
      countertopOverhangSideMm: spec.countertop.overhangSideMm,
      topDepthMm: spec.depthMm + spec.countertop.overhangFrontMm - 40,
    });
    if (!fit.sinkFitsCabinet)
      err(
        "tanque-incompativel",
        `tanque de ${fit.sinkWidthMm} mm não cabe na largura interna útil de ${fit.cabinetInnerWidthMm} mm`,
      );
    else if (!fit.clearanceOk)
      err(
        "folga-tanque",
        `folga estrutural de ${ergonomics.tubStructuralClearanceMm} mm não atendida: exige ${fit.requiredWidthMm} mm e há ${fit.cabinetInnerWidthMm} mm`,
      );
    if (!fit.depthOk) err("tanque-profundo", "tanque mais profundo que o tampo disponível");
    if (spec.widthMm < minWidthForTubMm(t, spec.thicknessMm))
      err("largura-tanque", `largura insuficiente para o tanque ${t.type}`);
    if (t.type !== "independente" && t.type !== "compacto" && spec.countertop.material === "nenhum")
      err("tanque-sem-tampo", "tanque embutido/esculpido exige tampo");
    if (t.hydraulicHeightMm > g.caseHeightMm)
      warn("reserva-alta", "reserva hidráulica maior que a altura da caixa");
  }

  /* ── volumes técnicos invadidos (hidráulica, ventilação, vassoura, tábua) ── */
  for (const c of laundryReservationConflicts(result)) {
    err("colisao-tecnica", `${c.pieceId} invade o volume técnico ${c.reservationId}`);
  }

  /* ── geometria degenerada / fora do envelope ── */
  for (const f of laundryGeometryFaults(result)) err("geometria", f);

  /* ── cestos, tábua, vassoureiro ── */
  if (spec.basket !== "nenhum" && spec.baskets <= 0)
    warn("cesto-vazio", `cesto ${spec.basket} configurado sem quantidade`);
  if (spec.board !== "nenhum") {
    const travel = spec.board === "vertical" ? spec.heightMm : g.interiorDepthMm;
    if (travel < BOARD_TRAVEL_MM)
      warn(
        "tabua-curso",
        `curso de ${Math.round(travel)} mm menor que ${BOARD_TRAVEL_MM} mm da tábua`,
      );
  }
  if (p.broomZone) {
    if (spec.broomZoneMm <= 0)
      err("vassoura-sem-zona", "vassoureiro sem reserva vertical de vassouras");
    else if (spec.broomZoneMm > g.interiorHeightMm)
      err("vassoura-alem", "reserva de vassouras maior que a altura interna");
    else if (spec.broomZoneMm < 1200)
      tip("vassoura-curta", "reserva de vassouras recomendada a partir de 1200 mm");
  }

  /* ── tampo e rodabanca ── */
  if (spec.countertop.material !== "nenhum" && !p.countertop)
    warn("tampo-indevido", `${spec.kind} normalmente não recebe tampo`);
  if (p.level === "bancada" && spec.countertop.material !== "nenhum") {
    const [lo, hi] = ergonomics.counterHeightMm;
    const top = g.topOfCountertopMm;
    if (top < lo || top > hi)
      tip(
        "altura-bancada",
        `altura da bancada (${Math.round(top)} mm) fora da faixa recomendada ${lo}–${hi} mm`,
      );
  }
  if (spec.kind === "rodabanca" && spec.heightMm > 200)
    warn("rodabanca-alta", "rodabanca acima de 200 mm — confirme intenção de frontão");

  /* ── módulos suspensos ── */
  if (spec.install === "suspenso") {
    const [lo, hi] = ergonomics.wallHungFloorGapMm;
    if (p.level === "bancada" && (spec.floorGapMm < lo || spec.floorGapMm > hi))
      tip("gap-suspenso", `folga do piso recomendada entre ${lo} e ${hi} mm`);
  } else if (spec.floorGapMm > 0 && spec.install !== "pes") {
    warn("gap-indevido", "módulo apoiado não deve ter folga sob a caixa");
  }
  if (p.level === "superior") {
    tip(
      "altura-aereo",
      `base do aéreo recomendada entre ${ergonomics.upperBottomMm[0]} e ${ergonomics.upperBottomMm[1]} mm do piso`,
    );
  }

  /* ── acabamentos e tapa-vãos não podem se comportar como frente móvel ── */
  for (const piece of assembly.pieces) {
    if (piece.partKind !== "acabamento" && piece.partKind !== "tapa-vao") continue;
    if (assembly.motions.some((m) => m.pieceId === piece.id))
      err("acabamento-movel", `${piece.id} é acabamento e não pode se mover`);
  }

  /* ── rigs órfãos ── */
  for (const m of assembly.motions) {
    if (m.kind === "static") continue;
    if (!assembly.pieces.some((x) => x.id === m.pieceId))
      err("rig-orfao", `rig de ${m.pieceId} sem peça correspondente`);
  }

  return { ok: !issues.some((i) => i.level === "erro"), issues };
}

export function laundryErrors(v: LaundryValidation): readonly LaundryIssue[] {
  return v.issues.filter((i) => i.level === "erro");
}

export function laundryWarnings(v: LaundryValidation): readonly LaundryIssue[] {
  return v.issues.filter((i) => i.level === "aviso");
}

export function laundryRecommendations(v: LaundryValidation): readonly LaundryIssue[] {
  return v.issues.filter((i) => i.level === "recomendacao");
}
