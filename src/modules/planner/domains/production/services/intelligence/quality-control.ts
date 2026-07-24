import type { ProductionReport } from "../../types";
import type { QualityCheck, QualityChecklist } from "./types";

export function buildQualityChecklist(report: ProductionReport): QualityChecklist {
  const checks: QualityCheck[] = [];

  const critical = [...report.parts].sort((a, b) => b.areaM2 - a.areaM2).slice(0, 3);
  for (const p of critical) {
    checks.push({
      id: `dim-${p.id}`,
      kind: "dimensional",
      title: `Conferir dimensões ${p.label}`,
      description: `Medidas nominais ${p.widthMm}×${p.heightMm}×${p.thicknessMm} mm — tolerância ±0,5 mm.`,
      required: true,
      targetPartCode: p.id,
      severity: "critical",
    });
  }

  const withTape = report.parts.filter((p) => p.edgeMetersEach > 0).slice(0, 3);
  for (const p of withTape) {
    checks.push({
      id: `fita-${p.id}`,
      kind: "fita-borda",
      title: `Fita de borda ${p.label}`,
      description: `Verificar adesão e alinhamento de ${p.edgeMetersEach.toFixed(2)} m por peça.`,
      required: true,
      targetPartCode: p.id,
      severity: "warn",
    });
  }

  checks.push({ id: "fur-geral", kind: "furacao", title: "Furações minifix / cavilha", description: "Conferir centros, profundidade e face conforme plano de usinagem.", required: true, severity: "critical" });
  checks.push({ id: "fer-bom", kind: "ferragens", title: `Ferragens BOM (${report.hardware.length} itens)`, description: "Contagem de dobradiças, corrediças, puxadores e parafusos antes da montagem.", required: true, severity: "critical" });
  checks.push({ id: "mnt-geral", kind: "montagem", title: "Esquadro e prumo de módulos", description: "Verificar diagonais, esquadro, regulagem de portas e alinhamento de gavetas.", required: true, severity: "critical" });
  checks.push({ id: "est-geral", kind: "estetica", title: "Inspeção estética final", description: "Riscos, manchas, uniformidade de cor e brilho.", required: false, severity: "warn" });
  checks.push({ id: "emb-geral", kind: "embalagem", title: "Embalagem e identificação", description: "Filme stretch, cantoneiras, etiqueta QR legível e romaneio conferido.", required: true, severity: "warn" });

  const criticalCount = checks.filter((c) => c.severity === "critical").length;
  const reworkRatePct = Math.min(15, Math.max(1, Math.round((report.totals.parts / Math.max(1, report.totals.modules)) * 0.4)));
  const defectRatePct = Math.max(1, Math.round(reworkRatePct / 2));
  return { totalChecks: checks.length, criticalChecks: criticalCount, checks, reworkRatePct, defectRatePct };
}