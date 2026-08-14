/**
 * Gerador determinístico de sequência de montagem.
 */
import type { ProductionPart } from "../../types";
import type { AssemblyPlan, AssemblyStep, AssemblyStepKind } from "./types";

interface StepSeed {
  kind: AssemblyStepKind;
  title: string;
  description: string;
  minutes: number;
  tools: readonly string[];
  matchCategories: readonly string[];
}

const SEEDS: readonly StepSeed[] = [
  {
    kind: "separacao",
    title: "Separação de peças",
    description: "Conferir código, etiqueta e integridade de todas as peças do módulo.",
    minutes: 3,
    tools: ["leitor QR"],
    matchCategories: [],
  },
  {
    kind: "furacao",
    title: "Furação estrutural",
    description: "Furos de cavilha/minifix nas laterais e base.",
    minutes: 6,
    tools: ["furadeira", "gabarito 32mm"],
    matchCategories: ["lateral", "base", "tampo"],
  },
  {
    kind: "cavilha",
    title: "Aplicação de cavilhas",
    description: "Cola e insere cavilhas em base, tampo e prateleiras fixas.",
    minutes: 4,
    tools: ["cola PVA"],
    matchCategories: ["base", "tampo", "prateleira"],
  },
  {
    kind: "minifix",
    title: "Fixação minifix",
    description: "Aperta minifix entre laterais e horizontais.",
    minutes: 5,
    tools: ["chave allen"],
    matchCategories: ["lateral"],
  },
  {
    kind: "estrutura",
    title: "Montagem da estrutura",
    description: "Une laterais, base e tampo — esquadro obrigatório.",
    minutes: 8,
    tools: ["esquadro", "grampo"],
    matchCategories: ["lateral", "base", "tampo"],
  },
  {
    kind: "fundo",
    title: "Fixação do fundo",
    description: "Insere fundo encaixado e pina o perímetro.",
    minutes: 4,
    tools: ["pinador"],
    matchCategories: ["fundo"],
  },
  {
    kind: "prateleira",
    title: "Instalação de prateleiras",
    description: "Posiciona prateleiras móveis e fixas.",
    minutes: 3,
    tools: ["pinos 5mm"],
    matchCategories: ["prateleira"],
  },
  {
    kind: "porta",
    title: "Montagem de portas",
    description: "Fixa dobradiças, ajusta 3D e testa fechamento.",
    minutes: 6,
    tools: ["dobradiça blum"],
    matchCategories: ["porta"],
  },
  {
    kind: "gaveta",
    title: "Montagem de gavetas",
    description: "Monta caixa, fixa corrediça e regula frente.",
    minutes: 7,
    tools: ["corrediça tandem"],
    matchCategories: ["gaveta", "frente"],
  },
  {
    kind: "puxador",
    title: "Aplicação de puxadores",
    description: "Marca, fura e fixa puxadores/perfis.",
    minutes: 3,
    tools: ["gabarito puxador"],
    matchCategories: ["porta", "frente", "gaveta"],
  },
  {
    kind: "ferragem",
    title: "Ferragens complementares",
    description: "Cabideiros, suportes, pistões, LED e transformador.",
    minutes: 4,
    tools: ["parafusadeira"],
    matchCategories: ["ferragem", "iluminacao", "perfil"],
  },
  {
    kind: "regulagem",
    title: "Regulagem fina",
    description: "Alinha frentes, portas e gavetas (folgas e reveal).",
    minutes: 5,
    tools: ["régua reveal"],
    matchCategories: [],
  },
  {
    kind: "conferencia",
    title: "Conferência final",
    description: "Checklist de qualidade e liberação para expedição.",
    minutes: 3,
    tools: ["ficha QA"],
    matchCategories: [],
  },
];

export function buildAssemblyPlan(parts: readonly ProductionPart[]): AssemblyPlan {
  const byFurniture = new Map<string, { label: string; parts: ProductionPart[] }>();
  for (const p of parts) {
    const entry = byFurniture.get(p.furnitureId) ?? { label: p.furnitureLabel, parts: [] };
    entry.parts.push(p);
    byFurniture.set(p.furnitureId, entry);
  }
  const steps: AssemblyStep[] = [];
  let order = 1;
  byFurniture.forEach((entry, furnitureId) => {
    const cats = new Set(entry.parts.map((p) => p.category));
    SEEDS.forEach((seed) => {
      const relevant =
        seed.matchCategories.length === 0 ||
        seed.matchCategories.some((c) => cats.has(c as ProductionPart["category"]));
      if (!relevant) return;
      const partCodes = entry.parts
        .filter((p) =>
          seed.matchCategories.length === 0 ? true : seed.matchCategories.includes(p.category),
        )
        .map((p) => p.id.slice(-6).toUpperCase());
      steps.push({
        order: order++,
        furnitureId,
        furnitureLabel: entry.label,
        kind: seed.kind,
        title: seed.title,
        description: seed.description,
        estimatedMinutes: seed.minutes,
        toolset: seed.tools,
        partCodes,
      });
    });
  });
  const totalMinutes = steps.reduce((a, s) => a + s.estimatedMinutes, 0);
  return { steps, totalMinutes, totalSteps: steps.length };
}
