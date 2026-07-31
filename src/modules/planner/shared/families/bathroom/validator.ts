/**
 * VALIDADOR DA FAMÍLIA BANHEIRO.
 * Separa ERRO (o móvel não se sustenta) de RECOMENDAÇÃO ergonômica
 * configurável. Recomendação NÃO é norma legal.
 */
import { isDoor, isFinishPart, isFixedFront } from "../../construction/classification";
import { bathroomReservationConflicts, type BathroomBuildResult } from "./build";
import { BATHROOM_MODULE_PROFILES } from "./spec";
import { sinkFit, SINK_STRUCTURAL_CLEARANCE_MM } from "./sink";

export type BathroomIssueLevel = "erro" | "aviso" | "recomendacao";

export interface BathroomIssue {
  readonly code: string;
  readonly level: BathroomIssueLevel;
  readonly message: string;
}

export interface BathroomErgonomics {
  readonly counterHeightMm: [number, number];
  readonly mirrorBottomMm: [number, number];
  readonly sinkToWallMm: number;
  /** Margem técnica mínima (erro) entre cuba e lateral/divisória. */
  readonly sinkStructuralClearanceMm: number;
  readonly sideClearanceMm: number;
  readonly frontClearanceMm: number;
  readonly wallHungFloorGapMm: [number, number];
}

export const BATHROOM_ERGONOMICS: BathroomErgonomics = {
  counterHeightMm: [800, 950],
  mirrorBottomMm: [1000, 1200],
  sinkToWallMm: 100,
  sinkStructuralClearanceMm: SINK_STRUCTURAL_CLEARANCE_MM,
  sideClearanceMm: 50,
  frontClearanceMm: 600,
  wallHungFloorGapMm: [200, 500],
};

export interface BathroomValidation {
  readonly ok: boolean;
  readonly issues: readonly BathroomIssue[];
}

export function validateBathroomModule(
  result: BathroomBuildResult,
  ergonomics: BathroomErgonomics = BATHROOM_ERGONOMICS,
): BathroomValidation {
  const { spec, layout: g, assembly } = result;
  const p = BATHROOM_MODULE_PROFILES[spec.kind];
  const issues: BathroomIssue[] = [];
  const err = (code: string, message: string) => issues.push({ code, level: "erro", message });
  const warn = (code: string, message: string) => issues.push({ code, level: "aviso", message });
  const tip = (code: string, message: string) =>
    issues.push({ code, level: "recomendacao", message });

  /* medidas mínimas */
  if (spec.widthMm < p.minWidthMm) err("largura-minima", `largura ${spec.widthMm} mm abaixo do mínimo ${p.minWidthMm} mm`);
  if (spec.depthMm < p.minDepthMm) err("profundidade-minima", `profundidade ${spec.depthMm} mm abaixo do mínimo ${p.minDepthMm} mm`);
  if (spec.depthMm > p.maxDepthMm) warn("profundidade-maxima", `profundidade acima do usual (${p.maxDepthMm} mm)`);

  /* cuba × tampo × recorte */
  const s = spec.sink;
  if (s.type !== "nenhuma") {
    const fit = sinkFit({
      widthMm: spec.widthMm,
      thicknessMm: spec.thicknessMm,
      sink: s,
      countertopOverhangSideMm: spec.countertop.overhangSideMm,
      clearanceMm: ergonomics.sinkStructuralClearanceMm,
      topDepthMm: spec.depthMm + spec.countertop.overhangFrontMm - 40,
    });
    /* A cuba é comparada com a largura INTERNA útil, e a folga entra UMA vez
     * por vão (nunca duas vezes na mesma conta). */
    if (!fit.sinkFitsCabinet)
      err(
        "cuba-incompativel",
        `cuba ${fit.sinkCount > 1 ? "dupla " : ""}de ${fit.sinkWidthMm} mm não cabe na largura interna útil de ${fit.cabinetInnerWidthMm} mm`,
      );
    else if (!fit.clearanceOk)
      err(
        "folga-lateral-insuficiente",
        `folga lateral mínima de ${fit.requiredSideClearanceMm} mm não atendida: exige ${fit.requiredWidthMm} mm e há ${fit.cabinetInnerWidthMm} mm`,
      );
    if (!fit.depthOk) err("cuba-profunda", "cuba mais profunda que o tampo disponível");
    if (s.type !== "apoio" && spec.countertop.material === "nenhum")
      err("recorte-sem-tampo", "cuba de embutir/sobrepor exige tampo");
    if (spec.countertop.cutout !== "nenhum") {
      if (!fit.cutoutFitsTop)
        err(
          "recorte-fora-do-tampo",
          `recorte de ${fit.sinkCutoutWidthMm} mm ultrapassa o tampo de ${fit.topWidthMm} mm`,
        );
      if (s.cutoutDepthMm > spec.depthMm + spec.countertop.overhangFrontMm - 40)
        err("recorte-fora-profundidade", "recorte de cuba ultrapassa a profundidade do tampo");
    }
    if (s.hydraulicHeightMm > g.caseHeightMm)
      warn("reserva-alta", "reserva hidráulica maior que a altura da caixa");
    /* Distância cuba × parede é RECOMENDAÇÃO, não erro. */
    const sideGap = (fit.cabinetInnerWidthMm - fit.sinkCount * fit.sinkWidthMm) / (fit.sinkCount + 1);
    if (fit.sinkCount > 0 && sideGap < ergonomics.sinkToWallMm)
      tip(
        "cuba-proxima-parede",
        `folga recomendada de ${ergonomics.sinkToWallMm} mm entre cuba e lateral (atual ${Math.round(sideGap)} mm)`,
      );
  }

  /* hidráulica × mecanismos */
  const conflicts = bathroomReservationConflicts(result);
  for (const c of conflicts) {
    err("colisao-hidraulica", `${c.pieceId} invade o volume técnico ${c.reservationId}`);
  }

  /* mecanismos */
  for (const m of assembly.motions) {
    const piece = assembly.pieces.find((x) => x.id === m.pieceId);
    if (!piece) continue;
    if (isFixedFront(piece.partKind) || isFinishPart(piece.partKind))
      err("rig-indevido", `${piece.id} é peça fixa/acabamento e não pode ter rig`);
  }
  const drawerRun = Math.max(200, g.interiorDepthMm - 20);
  if (spec.drawers > 0 && drawerRun < 200) err("curso-gaveta", "gaveta sem curso livre");
  if (spec.doors > 0 && spec.widthMm / spec.doors > 700)
    warn("folha-larga", "folha de porta acima de 700 mm — considere dividir");

  /* instalação */
  if (spec.install === "suspenso") {
    if (g.floorGapMm <= 0) err("suspenso-no-piso", "módulo suspenso precisa de altura livre acima do piso");
    const [lo, hi] = ergonomics.wallHungFloorGapMm;
    if (g.floorGapMm < lo || g.floorGapMm > hi)
      tip("altura-suspenso", `altura livre recomendada entre ${lo} e ${hi} mm`);
    tip("ancoragem", "módulo suspenso: verificar ancoragem e carga da parede");
  }
  if (spec.install !== "suspenso" && spec.install !== "pes" && g.floorGapMm > 0)
    warn("gap-indevido", "módulo apoiado não deve ter folga sob a caixa");

  /* nível superior */
  if (p.level === "superior" && spec.kind !== "prateleira") {
    tip("altura-espelheira", `base da espelheira recomendada entre ${ergonomics.mirrorBottomMm[0]} e ${ergonomics.mirrorBottomMm[1]} mm do piso`);
  }
  if (p.level === "bancada" && spec.countertop.material !== "nenhum") {
    const [lo, hi] = ergonomics.counterHeightMm;
    const topFromFloor = g.topOfCountertopMm;
    if (topFromFloor < lo || topFromFloor > hi)
      tip("altura-bancada", `altura da bancada (${Math.round(topFromFloor)} mm) fora da faixa recomendada ${lo}–${hi} mm`);
  }

  /* acabamentos e tapa-vãos não podem se comportar como frente móvel */
  for (const piece of assembly.pieces) {
    if (piece.partKind !== "acabamento" && piece.partKind !== "tapa-vao") continue;
    if (assembly.motions.some((m) => m.pieceId === piece.id))
      err("acabamento-movel", `${piece.id} é acabamento e não pode se mover`);
  }
  const mirrorDoors = assembly.pieces.filter((x) => isDoor(x.partKind) && x.substrate === "espelho");
  if (spec.mirror === "porta" && mirrorDoors.length === 0)
    warn("espelho-sem-porta", "espelheira configurada com porta espelhada, mas nenhuma porta foi emitida");

  /* interpenetração grosseira entre peças estruturais */
  return { ok: !issues.some((i) => i.level === "erro"), issues };
}

export function bathroomErrors(v: BathroomValidation): readonly BathroomIssue[] {
  return v.issues.filter((i) => i.level === "erro");
}