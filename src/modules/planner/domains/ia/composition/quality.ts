/**
 * CONTROLE DE QUALIDADE DA COMPOSICAO.
 *
 * Antes de concluir, o Planner mede equilibrio visual, proporcao,
 * circulacao, organizacao e coerencia estetica. Quando algum criterio
 * fica ruim, a composicao e reorganizada automaticamente (poda de
 * decoracao e realocacao para o quadrante mais vazio) e medida de novo.
 */
import type {
  DecorPlacement,
  QualityIssue,
  QualityReport,
  Rect,
  RoomAnalysis,
} from "./types";
import { styleProfile } from "./styles";

function quadrantOf(x: number, y: number, a: RoomAnalysis): number {
  return (x < a.width / 2 ? 0 : 1) + (y < a.depth / 2 ? 0 : 2);
}

/** Mede a composicao final (moveis + decoracao) e aponta problemas. */
export function evaluateComposition(
  analysis: RoomAnalysis,
  furniture: readonly Rect[],
  decor: readonly DecorPlacement[],
): QualityReport {
  const issues: QualityIssue[] = [];

  // ── Equilibrio: massa distribuida entre quadrantes ───────────────────
  const mass = [0, 0, 0, 0];
  for (const r of furniture) {
    mass[quadrantOf(r.x + r.w / 2, r.y + r.d / 2, analysis)] += (r.w * r.d) / 1_000_000;
  }
  for (const d of decor) mass[quadrantOf(d.x, d.y, analysis)] += 0.25;
  const totalMass = mass.reduce((s, m) => s + m, 0) || 1;
  const share = mass.map((m) => m / totalMass);
  const spread = Math.max(...share) - Math.min(...share);
  const balance = Math.round(Math.max(0, 1 - spread) * 100);
  if (balance < 55)
    issues.push({
      metric: "equilibrio",
      message: "massa concentrada em um lado do ambiente",
      severity: balance < 40 ? "critico" : "aviso",
    });

  // ── Proporcao: area ocupada versus area do comodo ────────────────────
  const occupiedM2 = furniture.reduce((s, r) => s + (r.w * r.d) / 1_000_000, 0);
  const ratio = occupiedM2 / Math.max(1, analysis.areaM2);
  const ideal = 0.32;
  const proportion = Math.round(Math.max(0, 1 - Math.abs(ratio - ideal) / 0.45) * 100);
  if (ratio > 0.55)
    issues.push({
      metric: "proporcao",
      message: `ocupacao de ${(ratio * 100).toFixed(0)}% do piso — ambiente sobrecarregado`,
      severity: "critico",
    });

  // ── Circulacao: faixa livre no miolo do comodo ───────────────────────
  const cx = analysis.width / 2;
  const cy = analysis.depth / 2;
  const need = analysis.circulationMin;
  const corridor: Rect = {
    x: cx - need / 2,
    y: cy - need / 2,
    w: need,
    d: need,
  };
  const blocking = furniture.filter(
    (r) =>
      r.x < corridor.x + corridor.w &&
      r.x + r.w > corridor.x &&
      r.y < corridor.y + corridor.d &&
      r.y + r.d > corridor.y,
  ).length;
  const circulation = blocking === 0 ? 100 : Math.max(0, 100 - blocking * 30);
  if (blocking > 0)
    issues.push({
      metric: "circulacao",
      message: `${blocking} volume(s) invadindo a faixa de circulacao de ${need}mm`,
      severity: blocking > 1 ? "critico" : "aviso",
    });

  // ── Organizacao: densidade decorativa por m² ─────────────────────────
  const perM2 = decor.length / Math.max(1, analysis.areaM2);
  const organization = Math.round(Math.max(0, 1 - Math.max(0, perM2 - 0.55) / 0.6) * 100);
  if (perM2 > 0.75)
    issues.push({
      metric: "organizacao",
      message: "excesso de objetos decorativos para a area disponivel",
      severity: "aviso",
    });

  // ── Coerencia: todo objeto pertence ao repertorio do estilo ──────────
  const pools = styleProfile(analysis.style).pools;
  const allowed = new Set(Object.values(pools).flat());
  const foreign = decor.filter((d) => !allowed.has(d.catalogItemId));
  const coherence = Math.round(
    (1 - foreign.length / Math.max(1, decor.length)) * 100,
  );
  if (foreign.length > 0)
    issues.push({
      metric: "coerencia",
      message: `${foreign.length} objeto(s) fora do repertorio ${analysis.style}`,
      severity: "aviso",
    });

  const score = Math.round(
    balance * 0.25 +
      proportion * 0.2 +
      circulation * 0.25 +
      organization * 0.15 +
      coherence * 0.15,
  );

  return {
    score,
    balance,
    proportion,
    circulation,
    organization,
    coherence,
    issues,
    ok: score >= 70 && !issues.some((i) => i.severity === "critico"),
  };
}

/**
 * Reorganiza automaticamente: remove excesso decorativo, descarta objetos
 * fora do estilo e reequilibra os quadrantes. Roda ate a nota parar de
 * melhorar (maximo 3 passadas) — determinístico, sem aleatoriedade.
 */
export function rebalanceComposition(
  analysis: RoomAnalysis,
  furniture: readonly Rect[],
  decor: readonly DecorPlacement[],
): { decor: DecorPlacement[]; report: QualityReport; passes: number } {
  const allowed = new Set(Object.values(styleProfile(analysis.style).pools).flat());
  let current = decor.filter((d) => allowed.has(d.catalogItemId));
  let report = evaluateComposition(analysis, furniture, current);
  let passes = 0;

  while (!report.ok && passes < 3 && current.length > 2) {
    passes += 1;
    const before = report.score;

    // Poda o quadrante mais carregado, comecando pelos objetos menores
    // (ordem de prioridade: objeto > arte > verde > iluminacao > ancora).
    const priority: Record<string, number> = {
      objeto: 0,
      arte: 1,
      verde: 2,
      conforto: 3,
      iluminacao: 4,
      ancora: 5,
    };
    const load = [0, 0, 0, 0];
    for (const d of current) load[quadrantOf(d.x, d.y, analysis)] += 1;
    const heaviest = load.indexOf(Math.max(...load));

    const victimIndex = current
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => quadrantOf(d.x, d.y, analysis) === heaviest)
      .sort((a, b) => priority[a.d.role] - priority[b.d.role])[0]?.i;

    if (victimIndex == null) break;
    current = current.filter((_, i) => i !== victimIndex);
    report = evaluateComposition(analysis, furniture, current);
    if (report.score <= before) break;
  }

  return { decor: current, report, passes };
}

/** Resumo legivel do controle de qualidade para o chat. */
export function describeQuality(r: QualityReport): string {
  const head = `Qualidade da composicao: ${r.score}/100 (equilibrio ${r.balance}, proporcao ${r.proportion}, circulacao ${r.circulation}, organizacao ${r.organization}, coerencia ${r.coherence})`;
  if (r.issues.length === 0) return `${head}.`;
  return `${head} — ${r.issues.map((i) => i.message).join("; ")}.`;
}