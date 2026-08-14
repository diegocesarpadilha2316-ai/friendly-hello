import type { ImportResult, ImporterWarning } from "../types";

export function validateImport(res: ImportResult): readonly ImporterWarning[] {
  const out: ImporterWarning[] = [...res.warnings];
  if (res.entities.length === 0 && !res.previewSvg) {
    out.push({
      code: "empty",
      message: "Arquivo importado não contém entidades reconhecidas.",
      severity: "warning",
    });
  }
  if (!res.bbox) {
    out.push({
      code: "no-bbox",
      message: "Sem bounding box detectado — escala pode ficar imprecisa.",
      severity: "info",
    });
  }
  if (res.scale.factorToMm <= 0) {
    out.push({ code: "bad-scale", message: "Fator de escala inválido.", severity: "error" });
  }
  return out;
}
