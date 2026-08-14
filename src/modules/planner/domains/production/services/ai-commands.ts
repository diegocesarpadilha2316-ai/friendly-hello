import type { ProductionAiCommand } from "../types";

export const PRODUCTION_AI_COMMANDS: readonly ProductionAiCommand[] = [
  {
    id: "producao.gerar",
    label: "Gerar produção",
    description: "Consolida peças, ferragens, corte, tempo, orçamento.",
    hint: "gere a produção deste projeto",
  },
  {
    id: "producao.lista-corte",
    label: "Gerar lista de corte",
    description: "Exporta a lista de corte pronta para a fábrica.",
    hint: "monte a lista de corte",
  },
  {
    id: "producao.orcamento",
    label: "Gerar orçamento",
    description: "Materiais + ferragens + mão de obra + margem.",
    hint: "faça o orçamento",
  },
  {
    id: "producao.etiquetas",
    label: "Gerar etiquetas",
    description: "QR + código de barras para cada peça.",
    hint: "gere as etiquetas",
  },
  {
    id: "producao.plano-corte",
    label: "Gerar plano de corte",
    description: "Otimiza chapas e mostra sobra/aproveitamento.",
    hint: "gere o plano de corte",
  },
  {
    id: "producao.cnc",
    label: "Gerar CNC",
    description: "Prepara G-Code / DXF para as máquinas cadastradas.",
    hint: "gere o pacote CNC",
  },
];

export function matchProductionCommand(text: string): ProductionAiCommand | null {
  const norm = text.toLowerCase();
  if (/plano.*corte/.test(norm)) return findCmd("producao.plano-corte");
  if (/lista.*corte/.test(norm)) return findCmd("producao.lista-corte");
  if (/etiqueta/.test(norm)) return findCmd("producao.etiquetas");
  if (/or[çc]amento/.test(norm)) return findCmd("producao.orcamento");
  if (/cnc|g\s*-?\s*code|dxf/.test(norm)) return findCmd("producao.cnc");
  if (/produ[cç][aã]o/.test(norm)) return findCmd("producao.gerar");
  return null;
}

function findCmd(id: ProductionAiCommand["id"]): ProductionAiCommand | null {
  return PRODUCTION_AI_COMMANDS.find((c) => c.id === id) ?? null;
}
