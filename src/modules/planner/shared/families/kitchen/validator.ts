/**
 * VALIDADOR DE COZINHA — auditoria estrutural e ergonômica do layout.
 *
 * Puro e determinístico: recebe o resultado do Layout Engine e devolve
 * problemas. Nada é corrigido aqui — quem corrige é o motor.
 *
 * As regras ergonômicas são RECOMENDAÇÕES configuráveis
 * (`KitchenConfig.ergonomics`), não normas legais.
 */
import {
  isFixedWidthKind,
  type KitchenLayoutIssue,
  type KitchenLayoutResult,
  type KitchenPlacement,
} from "./layout-engine";

export interface KitchenValidation {
  readonly ok: boolean;
  readonly errors: readonly KitchenLayoutIssue[];
  readonly warnings: readonly KitchenLayoutIssue[];
}

/** Distância mínima entre a lateral do módulo e a quina, para a gaveta abrir. */
export const CORNER_DRAWER_CLEARANCE_MM = 100;
/** Vão mínimo de circulação entre bancada e ilha. */
export const WALKWAY_MIN_MM = 900;

function overlaps(a: KitchenPlacement, b: KitchenPlacement): boolean {
  return a.xMm < b.xMm + b.widthMm - 1 && b.xMm < a.xMm + a.widthMm - 1;
}

const DRAWER_KINDS = new Set(["gaveteiro", "gavetao", "balcao-cooktop"]);

export function validateKitchenLayout(result: KitchenLayoutResult): KitchenValidation {
  const errors: KitchenLayoutIssue[] = [];
  const warnings: KitchenLayoutIssue[] = [...result.warnings.filter((w) => w.level !== "error")];
  errors.push(...result.warnings.filter((w) => w.level === "error"));

  const cfg = result.config;
  const e = cfg.ergonomics;

  const byWallLevel = new Map<string, KitchenPlacement[]>();
  for (const p of result.placements) {
    const key = `${p.wallId}|${p.level === "coluna" ? "inferior" : p.level}`;
    const list = byWallLevel.get(key) ?? [];
    list.push(p);
    byWallLevel.set(key, list);
  }

  /* ── 1. colisão entre módulos da mesma faixa ── */
  for (const [key, list] of byWallLevel) {
    const sorted = [...list].sort((a, b) => a.xMm - b.xMm);
    for (let i = 1; i < sorted.length; i += 1) {
      if (overlaps(sorted[i - 1], sorted[i])) {
        errors.push({
          code: "colisao",
          level: "error",
          wallId: sorted[i].wallId,
          message: `Módulos sobrepostos em ${key}: ${sorted[i - 1].id} × ${sorted[i].id}.`,
        });
      }
    }
  }

  /* ── 2. módulo fora da parede / fora dos limites de largura ── */
  const wallLength = new Map(result.walls.map((w) => [w.id, w.lengthMm]));
  for (const p of result.placements) {
    if (p.xMm < -1) {
      errors.push({
        code: "fora-parede",
        level: "error",
        wallId: p.wallId,
        message: `${p.id} começa fora da parede.`,
      });
    }
    const len = wallLength.get(p.wallId);
    if (len !== undefined && p.xMm + p.widthMm > len + 1) {
      errors.push({
        code: "fora-parede",
        level: "error",
        wallId: p.wallId,
        message: `${p.id} termina em ${p.xMm + p.widthMm} mm, além dos ${len} mm da parede.`,
      });
    }
    if (p.widthMm <= 0) {
      errors.push({
        code: "largura-invalida",
        level: "error",
        wallId: p.wallId,
        message: `${p.id} tem largura não positiva.`,
      });
    }
    if (p.widthMm < cfg.minModuleWidthMm) {
      warnings.push({
        code: "modulo-estreito",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} tem ${p.widthMm} mm — abaixo do mínimo produtivo de ${cfg.minModuleWidthMm} mm.`,
      });
    }
    // Módulos ditados por aparelho/quina têm largura própria; o que não pode
    // ficar largo demais é a FOLHA (empena e bate no vizinho).
    if (!isFixedWidthKind(p.kind) && p.widthMm > cfg.maxModuleWidthMm + 1) {
      warnings.push({
        code: "modulo-largo",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} tem ${p.widthMm} mm — dividir para a porta não empenar.`,
      });
    }
    const leaves = p.spec.doors;
    if (leaves > 0 && p.widthMm / leaves > cfg.maxLeafWidthMm + 1) {
      warnings.push({
        code: "folha-larga",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id}: folha de ${Math.round(p.widthMm / leaves)} mm — acima de ${cfg.maxLeafWidthMm} mm, prever mais uma divisão.`,
      });
    }
  }

  /* ── 3. gaveta encostada na quina não abre ── */
  for (const p of result.placements) {
    if (!DRAWER_KINDS.has(p.kind)) continue;
    const neighbours = byWallLevel.get(`${p.wallId}|inferior`) ?? [];
    const nearCorner = neighbours.some(
      (n) =>
        n.kind.startsWith("canto") &&
        (Math.abs(n.xMm + n.widthMm - p.xMm) < e.cornerDrawerClearanceMm ||
          Math.abs(p.xMm + p.widthMm - n.xMm) < e.cornerDrawerClearanceMm),
    );
    const returnAtSide = result.reservations.some(
      (r) =>
        r.wallId === p.wallId &&
        r.kind === "retorno-de-canto" &&
        (Math.abs(r.xMm + r.widthMm - p.xMm) < e.cornerDrawerClearanceMm ||
          Math.abs(p.xMm + p.widthMm - r.xMm) < e.cornerDrawerClearanceMm),
    );
    if (nearCorner || returnAtSide) {
      warnings.push({
        code: "gaveta-na-quina",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} está colado ao canto — prever tamponamento de ${e.cornerDrawerClearanceMm} mm para a gaveta abrir.`,
      });
    }
  }

  /* ── 4. bancada ── */
  for (const run of result.countertopRuns) {
    if (run.lengthMm < 300) {
      warnings.push({
        code: "bancada-curta",
        level: "warn",
        wallId: run.wallId,
        message: `Trecho de bancada de ${run.lengthMm} mm — juntar ao trecho vizinho ou eliminar.`,
      });
    }
    if (run.lengthMm > 3000) {
      warnings.push({
        code: "bancada-emenda",
        level: "info",
        wallId: run.wallId,
        message: `Trecho de ${run.lengthMm} mm exige emenda na pedra.`,
      });
    }
  }
  // A bancada não pode cruzar uma abertura de porta.
  for (const door of result.reservations.filter((r) => r.kind === "porta")) {
    const crossing = result.countertopRuns.find(
      (r) =>
        r.wallId === door.wallId &&
        r.startMm < door.xMm + door.widthMm - 1 &&
        door.xMm < r.endMm - 1,
    );
    if (crossing) {
      errors.push({
        code: "tampo-sobre-porta",
        level: "error",
        wallId: door.wallId,
        message: `Bancada ${crossing.startMm}–${crossing.endMm} mm atravessa a abertura de porta.`,
      });
    }
  }

  /* ── 5. ergonomia da bancada e dos aéreos ── */
  if (cfg.baseHeightMm < e.baseHeightMinMm || cfg.baseHeightMm > e.baseHeightMaxMm) {
    warnings.push({
      code: "altura-bancada",
      level: "warn",
      message: `Bancada a ${cfg.baseHeightMm} mm — faixa recomendada ${e.baseHeightMinMm}–${e.baseHeightMaxMm} mm.`,
    });
  }
  if (result.placements.some((p) => p.level === "superior")) {
    if (cfg.upperGapMm < e.upperGapMinMm) {
      warnings.push({
        code: "aereo-baixo",
        level: "warn",
        message: `Aéreo a ${cfg.upperGapMm} mm da bancada — recomendado no mínimo ${e.upperGapMinMm} mm.`,
      });
    } else if (cfg.upperGapMm > e.upperGapMaxMm) {
      warnings.push({
        code: "aereo-alto",
        level: "warn",
        message: `Aéreo a ${cfg.upperGapMm} mm da bancada — acima de ${e.upperGapMaxMm} mm fica fora de alcance.`,
      });
    }
  }
  if (result.reservations.some((r) => r.kind === "coifa")) {
    if (cfg.hoodGapMm < e.hoodGapMinMm || cfg.hoodGapMm > e.hoodGapMaxMm) {
      warnings.push({
        code: "coifa-altura",
        level: "warn",
        message: `Coifa a ${cfg.hoodGapMm} mm da bancada — faixa segura ${e.hoodGapMinMm}–${e.hoodGapMaxMm} mm.`,
      });
    }
  }

  /* ── 6. área de preparo e apoio lateral ── */
  for (const [key, list] of byWallLevel) {
    if (!key.endsWith("inferior")) continue;
    const pia = list.find((p) => p.kind === "balcao-pia");
    const cook = list.find((p) => p.kind === "balcao-cooktop");
    if (pia && cook) {
      const gap =
        pia.xMm < cook.xMm
          ? cook.xMm - (pia.xMm + pia.widthMm)
          : pia.xMm - (cook.xMm + cook.widthMm);
      if (gap < e.prepAreaMinMm) {
        warnings.push({
          code: "area-preparo",
          level: "warn",
          wallId: pia.wallId,
          message: `Apenas ${Math.max(0, Math.round(gap))} mm entre pia e cooktop — o ideal são ${e.prepAreaMinMm} mm de preparo.`,
        });
      }
    }
    const len = wallLength.get(key.split("|")[0]);
    for (const p of list.filter((m) => m.kind === "balcao-pia" || m.kind === "balcao-cooktop")) {
      const leftFree = p.xMm;
      const rightFree = len === undefined ? e.sideSupportMinMm : len - (p.xMm + p.widthMm);
      if (Math.max(leftFree, rightFree) < e.sideSupportMinMm) {
        warnings.push({
          code: "apoio-lateral",
          level: "warn",
          wallId: p.wallId,
          message: `${p.id} sem ${e.sideSupportMinMm} mm de apoio em nenhum dos lados.`,
        });
      }
    }
  }

  /* ── 7. aéreo sobre o COOKTOP (o aparelho, não a caixa) ── */
  const uppers = result.placements.filter((p) => p.level === "superior");
  for (const cook of result.reservations.filter((r) => r.kind === "cooktop")) {
    const above = uppers.find(
      (u) =>
        u.wallId === cook.wallId &&
        u.xMm < cook.xMm + cook.widthMm - 1 &&
        cook.xMm < u.xMm + u.widthMm - 1,
    );
    if (above) {
      errors.push({
        code: "aereo-sobre-cooktop",
        level: "error",
        wallId: cook.wallId,
        message: `${above.id} ocupa o vão da coifa sobre o cooktop.`,
      });
    }
  }

  /* ── 8. aéreo atravessando janela ── */
  for (const janela of result.reservations.filter((r) => r.kind === "janela")) {
    const hit = uppers.find(
      (u) =>
        u.wallId === janela.wallId &&
        u.xMm < janela.xMm + janela.widthMm - 1 &&
        janela.xMm < u.xMm + u.widthMm - 1,
    );
    if (hit) {
      errors.push({
        code: "aereo-na-janela",
        level: "error",
        wallId: janela.wallId,
        message: `${hit.id} atravessa a janela.`,
      });
    }
  }

  /* ── 9. porta do ambiente bloqueada ── */
  for (const porta of result.reservations.filter((r) => r.kind === "porta")) {
    const blocking = result.placements.find(
      (p) =>
        p.wallId === porta.wallId &&
        p.xMm < porta.xMm + porta.widthMm + e.doorSwingClearanceMm &&
        porta.xMm - e.doorSwingClearanceMm < p.xMm + p.widthMm,
    );
    if (blocking) {
      errors.push({
        code: "porta-bloqueada",
        level: "error",
        wallId: porta.wallId,
        message: `${blocking.id} invade a abertura da porta (folga mínima ${e.doorSwingClearanceMm} mm).`,
      });
    }
  }

  /* ── 10. geladeira, lava-louças e forno ── */
  for (const gel of result.placements.filter((p) => p.kind === "torre-geladeira")) {
    const res = result.reservations.find((r) => r.kind === "geladeira" && r.wallId === gel.wallId);
    if (!res) continue;
    if (res.widthMm + 2 * e.fridgeGapSideMm > gel.widthMm + 1) {
      warnings.push({
        code: "geladeira-sem-folga",
        level: "warn",
        wallId: gel.wallId,
        message: `Nicho da geladeira sem as folgas de ${e.fridgeGapSideMm} mm.`,
      });
    }
  }
  for (const torre of result.placements.filter((p) => p.kind === "torre-quente")) {
    const forno = result.reservations.find((r) => r.kind === "forno" && r.wallId === torre.wallId);
    if (forno && forno.depthMm > torre.depthMm - e.ovenVentMm + 1) {
      warnings.push({
        code: "forno-sem-ventilacao",
        level: "warn",
        wallId: torre.wallId,
        message: `Nicho do forno sem os ${e.ovenVentMm} mm de ventilação traseira.`,
      });
    }
    if (torre.heightMm < 1900) {
      warnings.push({
        code: "torre-baixa",
        level: "warn",
        wallId: torre.wallId,
        message: `Torre quente de ${torre.heightMm} mm não comporta forno + micro-ondas com folga.`,
      });
    }
  }

  /* ── 11. cozinha sem pia ── */
  if (result.placements.length > 0 && !result.placements.some((p) => p.kind === "balcao-pia")) {
    warnings.push({
      code: "sem-pia",
      level: "info",
      message: "Nenhum módulo de pia definido no layout.",
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}
