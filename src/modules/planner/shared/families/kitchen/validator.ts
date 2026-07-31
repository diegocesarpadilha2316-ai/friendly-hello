/**
 * VALIDADOR DE COZINHA — auditoria estrutural e ergonômica do layout.
 *
 * Puro e determinístico: recebe o resultado do Layout Engine e devolve
 * problemas. Nada é corrigido aqui — quem corrige é o motor.
 */
import type { KitchenLayoutIssue, KitchenLayoutResult, KitchenPlacement } from "./layout-engine";

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

export function validateKitchenLayout(result: KitchenLayoutResult): KitchenValidation {
  const errors: KitchenLayoutIssue[] = [];
  const warnings: KitchenLayoutIssue[] = [...result.warnings.filter((w) => w.level !== "error")];
  errors.push(...result.warnings.filter((w) => w.level === "error"));

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

  /* ── 2. módulo fora da parede ── */
  for (const p of result.placements) {
    if (p.xMm < -1) {
      errors.push({ code: "fora-parede", level: "error", wallId: p.wallId, message: `${p.id} começa fora da parede.` });
    }
    if (p.widthMm < result.config.minModuleWidthMm) {
      warnings.push({
        code: "modulo-estreito",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} tem ${p.widthMm} mm — abaixo do mínimo produtivo.`,
      });
    }
    if (p.widthMm > result.config.maxModuleWidthMm + 1) {
      warnings.push({
        code: "modulo-largo",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} tem ${p.widthMm} mm — dividir para a porta não empenar.`,
      });
    }
  }

  /* ── 3. gaveta encostada na quina não abre ── */
  for (const p of result.placements) {
    const isDrawer = p.kind === "gaveteiro" || p.kind === "gavetao" || p.kind === "balcao-cooktop";
    if (!isDrawer) continue;
    const neighbours = byWallLevel.get(`${p.wallId}|inferior`) ?? [];
    const cornerAtLeft = neighbours.some(
      (n) => n.kind.startsWith("canto") && Math.abs(n.xMm + n.widthMm - p.xMm) < CORNER_DRAWER_CLEARANCE_MM,
    );
    const cornerAtRight = neighbours.some(
      (n) => n.kind.startsWith("canto") && Math.abs(p.xMm + p.widthMm - n.xMm) < CORNER_DRAWER_CLEARANCE_MM,
    );
    if (cornerAtLeft || cornerAtRight) {
      warnings.push({
        code: "gaveta-na-quina",
        level: "warn",
        wallId: p.wallId,
        message: `${p.id} está colado ao canto — prever tamponamento de ${CORNER_DRAWER_CLEARANCE_MM} mm para a gaveta abrir.`,
      });
    }
  }

  /* ── 4. bancada fragmentada ── */
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

  /* ── 5. área de trabalho mínima entre pia e cooktop ── */
  for (const [key, list] of byWallLevel) {
    if (!key.endsWith("inferior")) continue;
    const pia = list.find((p) => p.kind === "balcao-pia");
    const cook = list.find((p) => p.kind === "balcao-cooktop");
    if (pia && cook) {
      const gap =
        pia.xMm < cook.xMm ? cook.xMm - (pia.xMm + pia.widthMm) : pia.xMm - (cook.xMm + cook.widthMm);
      if (gap < 400) {
        warnings.push({
          code: "area-preparo",
          level: "warn",
          wallId: pia.wallId,
          message: `Apenas ${Math.max(0, Math.round(gap))} mm entre pia e cooktop — o ideal é 600 mm de preparo.`,
        });
      }
    }
  }

  /* ── 6. aéreo sobre cooktop sem coifa ── */
  const uppers = result.placements.filter((p) => p.level === "superior");
  for (const cook of result.placements.filter((p) => p.kind === "balcao-cooktop")) {
    const above = uppers.find((u) => u.wallId === cook.wallId && overlaps(u, cook));
    if (above) {
      warnings.push({
        code: "aereo-sobre-cooktop",
        level: "warn",
        wallId: cook.wallId,
        message: `${above.id} está sobre o cooktop — reservar o vão para a coifa.`,
      });
    }
  }

  /* ── 7. cozinha sem pia ── */
  if (result.placements.length > 0 && !result.placements.some((p) => p.kind === "balcao-pia")) {
    warnings.push({ code: "sem-pia", level: "info", message: "Nenhum módulo de pia definido no layout." });
  }

  return { ok: errors.length === 0, errors, warnings };
}