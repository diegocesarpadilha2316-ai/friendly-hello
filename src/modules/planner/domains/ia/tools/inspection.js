/**
 * Etapa 9 — Revisão estruturada do projeto (`review_project`) e
 * verificação de circulação. Ambas são 100% consultivas: NUNCA alteram
 * o projeto automaticamente.
 */
import { findCatalogItem } from "@/modules/planner/shared";
import { furnitureOf, getActiveRoom, hasExplicitLabel, labelOf } from "./validation";
/** Largura mínima de passagem confortável adotada pelo Planner (mm). */
export const MIN_WALKWAY_MM = 800;
/** Passagem mínima recomendada entre bancadas opostas (mm). */
export const MIN_CORRIDOR_MM = 900;
function boxOf(f) {
  return {
    id: f.id,
    label: labelOf(f),
    x1: f.x,
    y1: f.y,
    x2: f.x + f.width,
    y2: f.y + f.depth,
  };
}
function overlapArea(a, b) {
  const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return w > 0 && h > 0 ? w * h : 0;
}
/** Itens decorativos podem se sobrepor legitimamente (tapete sob mesa). */
function isDecor(f) {
  const item = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
  if (!item) return false;
  return (
    item.category === "decoracao" ||
    item.category === "iluminacao" ||
    item.category === "textil" ||
    /tapete|pendente|luminaria|quadro|planta|vaso|espelho/i.test(item.id)
  );
}
/**
 * Diagnóstico de circulação. Trabalha apenas com o que o modelo conhece
 * (footprint 2D dos módulos e dimensões do cômodo). Não inventa precisão
 * normativa: quando faltam portas/janelas modeladas, isso é declarado.
 */
export function checkCirculation(project, ctx) {
  const room = getActiveRoom(project, ctx);
  if (!room) {
    return {
      ok: false,
      findings: [
        {
          severity: "error",
          category: "circulacao",
          title: "Sem cômodo ativo",
          description: "Nenhum cômodo está selecionado para análise.",
          suggestedAction: "Selecione um cômodo no editor e repita a verificação.",
        },
      ],
      freeAreaRatio: 0,
      minGapMm: null,
      note: "Análise não executada.",
    };
  }
  const furniture = furnitureOf(room).filter((f) => !isDecor(f));
  const findings = [];
  const roomArea = room.dimensions.width * room.dimensions.depth;
  const occupied = furniture.reduce((acc, f) => acc + f.width * f.depth, 0);
  const freeAreaRatio = roomArea > 0 ? Math.max(0, 1 - occupied / roomArea) : 0;
  // Módulos fora dos limites do cômodo.
  for (const f of furniture) {
    const b = boxOf(f);
    if (
      b.x1 < -1 ||
      b.y1 < -1 ||
      b.x2 > room.dimensions.width + 1 ||
      b.y2 > room.dimensions.depth + 1
    ) {
      findings.push({
        severity: "error",
        category: "limites",
        objectId: f.id,
        title: "Módulo fora do ambiente",
        description: `"${b.label}" ultrapassa os limites do cômodo (${room.dimensions.width}×${room.dimensions.depth} mm).`,
        suggestedAction: "Reposicione o módulo ou aumente as dimensões do cômodo.",
      });
    }
  }
  // Menor folga entre pares de módulos em faixas concorrentes.
  let minGap = null;
  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      const a = boxOf(furniture[i]);
      const b = boxOf(furniture[j]);
      const overlapsY = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0;
      const overlapsX = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0;
      if (overlapsY && !overlapsX) {
        const gap = Math.max(b.x1 - a.x2, a.x1 - b.x2);
        if (gap > 0) minGap = minGap === null ? gap : Math.min(minGap, gap);
      }
      if (overlapsX && !overlapsY) {
        const gap = Math.max(b.y1 - a.y2, a.y1 - b.y2);
        if (gap > 0) minGap = minGap === null ? gap : Math.min(minGap, gap);
      }
    }
  }
  if (minGap !== null && minGap < MIN_CORRIDOR_MM) {
    findings.push({
      severity: minGap < MIN_WALKWAY_MM ? "error" : "warning",
      category: "circulacao",
      title: "Passagem estreita entre módulos",
      description: `A menor passagem livre medida é de ${minGap} mm; o recomendado para circulação confortável é ${MIN_CORRIDOR_MM} mm.`,
      suggestedAction: "Reduza a profundidade de um dos lados ou reposicione os módulos.",
    });
  }
  if (freeAreaRatio < 0.3) {
    findings.push({
      severity: freeAreaRatio < 0.18 ? "error" : "warning",
      category: "circulacao",
      title: "Área livre insuficiente",
      description: `Apenas ${Math.round(freeAreaRatio * 100)}% da planta permanece livre depois dos módulos.`,
      suggestedAction: "Remova ou reduza módulos para liberar área de circulação.",
    });
  }
  const note =
    "Portas e janelas ainda não são modeladas como aberturas no cômodo; a análise considera apenas o footprint dos módulos e as dimensões do ambiente.";
  return {
    ok: findings.every((f) => f.severity !== "error"),
    findings,
    freeAreaRatio: Math.round(freeAreaRatio * 100) / 100,
    minGapMm: minGap,
    note,
  };
}
/** Revisão canônica do projeto — diagnóstico, nunca correção automática. */
export function reviewProject(project, ctx) {
  const findings = [];
  const room = getActiveRoom(project, ctx);
  if (!room) {
    findings.push({
      severity: "error",
      category: "vinculo",
      title: "Nenhum cômodo ativo",
      description: "O projeto não tem cômodo selecionado, então nada pôde ser revisado.",
      suggestedAction: "Abra um cômodo no editor e repita a revisão.",
    });
    return { findings, counts: { info: 0, warning: 0, error: 1 }, note: "Revisão incompleta." };
  }
  const all = furnitureOf(room);
  const structural = all.filter((f) => !isDecor(f));
  if (all.length === 0) {
    findings.push({
      severity: "info",
      category: "producao",
      title: "Ambiente vazio",
      description: `O cômodo "${room.name}" ainda não possui módulos.`,
      suggestedAction: "Peça a criação do ambiente ou insira módulos manualmente.",
    });
  }
  // Dimensões inválidas.
  for (const f of all) {
    if (f.width <= 0 || f.depth <= 0 || f.height <= 0) {
      findings.push({
        severity: "error",
        category: "dimensoes",
        objectId: f.id,
        title: "Dimensão inválida",
        description: `"${labelOf(f)}" tem medidas ${f.width}×${f.depth}×${f.height} mm.`,
        suggestedAction: "Corrija a largura, profundidade e altura do módulo.",
      });
    } else if (f.width > 6000 || f.height > 3000 || f.depth > 1500) {
      findings.push({
        severity: "warning",
        category: "dimensoes",
        objectId: f.id,
        title: "Dimensão fora do usual de fabricação",
        description: `"${labelOf(f)}" mede ${f.width}×${f.depth}×${f.height} mm — acima do módulo único produzível.`,
        suggestedAction: "Divida o módulo em unidades menores.",
      });
    }
  }
  // Sobreposição entre módulos estruturais.
  for (let i = 0; i < structural.length; i++) {
    for (let j = i + 1; j < structural.length; j++) {
      const a = boxOf(structural[i]);
      const b = boxOf(structural[j]);
      const area = overlapArea(a, b);
      const minArea = Math.min((a.x2 - a.x1) * (a.y2 - a.y1), (b.x2 - b.x1) * (b.y2 - b.y1));
      if (area > minArea * 0.1) {
        findings.push({
          severity: "error",
          category: "colisao",
          objectId: a.id,
          title: "Módulos sobrepostos",
          description: `"${a.label}" e "${b.label}" ocupam a mesma área (${Math.round(area / 1000)} cm² de interseção).`,
          suggestedAction: "Reposicione um dos módulos para eliminar a colisão.",
        });
      }
    }
  }
  // Material e identificação.
  for (const f of structural) {
    const params = f.params;
    const hasMaterial = Boolean(f.materialId || params.material || params.color);
    if (!hasMaterial) {
      findings.push({
        severity: "warning",
        category: "materiais",
        objectId: f.id,
        title: "Módulo sem material definido",
        description: `"${labelOf(f)}" não tem chapa/acabamento atribuído.`,
        suggestedAction: "Aplique um material do catálogo antes de orçar ou produzir.",
      });
    }
    if (!hasExplicitLabel(f)) {
      findings.push({
        severity: "warning",
        category: "identificacao",
        objectId: f.id,
        title: "Módulo sem identificação",
        description: "O módulo não possui nome, o que dificulta etiqueta e montagem.",
        suggestedAction: "Nomeie o módulo no Inspector.",
      });
    }
    if (!f.catalogItemId) {
      findings.push({
        severity: "warning",
        category: "vinculo",
        objectId: f.id,
        title: "Módulo sem vínculo de catálogo",
        description:
          "Sem item de catálogo o orçamento não consegue localizar preço nem ficha técnica.",
        suggestedAction: "Vincule o módulo a um item da biblioteca.",
      });
    }
    // Conflito aparente de abertura: portas que abrem contra um vizinho colado.
    const doors = Number(params["eng:doors"] ?? 0);
    if (doors > 0) {
      const b = boxOf(f);
      const blocked = structural.some((other) => {
        if (other.id === f.id) return false;
        const o = boxOf(other);
        const frontGap = o.y1 - b.y2;
        const overlapsX = Math.min(b.x2, o.x2) - Math.max(b.x1, o.x1) > 0;
        return overlapsX && frontGap >= 0 && frontGap < 300;
      });
      if (blocked) {
        findings.push({
          severity: "warning",
          category: "aberturas",
          objectId: f.id,
          title: "Abertura possivelmente obstruída",
          description: `"${labelOf(f)}" tem porta com menos de 300 mm livres à frente.`,
          suggestedAction: "Aumente o afastamento frontal ou troque para porta de correr.",
        });
      }
    }
  }
  // Circulação (reaproveita o mesmo motor).
  findings.push(
    ...checkCirculation(project, ctx).findings.filter((f) => f.category === "circulacao"),
  );
  // Prontidão para orçamento / produção / render.
  const semPreco = structural.filter((f) => {
    const item = f.catalogItemId ? findCatalogItem(f.catalogItemId) : null;
    return !item || typeof item.priceBRL !== "number";
  });
  if (semPreco.length > 0) {
    findings.push({
      severity: "info",
      category: "orcamento",
      title: "Itens sem preço cadastrado",
      description: `${semPreco.length} módulo(s) não têm preço no catálogo — o orçamento sairá parcial.`,
      suggestedAction: "Cadastre o preço no catálogo ou informe o valor manualmente.",
    });
  }
  if (structural.length > 0) {
    findings.push({
      severity: "info",
      category: "producao",
      title: "Dados de produção pendentes",
      description:
        "Fita de borda, sentido do veio, folgas e usinagem ainda usam os padrões da empresa, não valores confirmados por módulo.",
      suggestedAction: "Revise as regras de fabricação antes de liberar para a fábrica.",
    });
  }
  findings.push({
    severity: "info",
    category: "render",
    title: "Render disponível apenas em pré-visualização local",
    description: "A cena é preparada no viewport; não há render externo em fila nesta versão.",
    suggestedAction: "Use o preset de cena para melhorar a apresentação no próprio viewport.",
  });
  const counts = {
    info: findings.filter((f) => f.severity === "info").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    error: findings.filter((f) => f.severity === "error").length,
  };
  return {
    findings,
    counts,
    note: "Revisão consultiva — nenhuma alteração foi aplicada ao projeto.",
  };
}
