import type { PlanningResource } from "./types";

export const DEFAULT_RESOURCES: readonly PlanningResource[] = [
  { id: "res-seccionadora", kind: "maquina", label: "Seccionadora Beam Saw", sector: "Corte", hoursPerDay: 8, status: "ativo", skills: ["corte"] },
  { id: "res-cnc-nesting", kind: "maquina", label: "CNC Nesting Rover", sector: "Usinagem", hoursPerDay: 8, status: "ativo", skills: ["cnc", "furacao"] },
  { id: "res-coladeira", kind: "maquina", label: "Coladeira de Borda", sector: "Acabamento", hoursPerDay: 8, status: "ativo", skills: ["colagem"] },
  { id: "res-furadeira", kind: "maquina", label: "Furadeira Múltipla", sector: "Usinagem", hoursPerDay: 8, status: "ativo", skills: ["furacao"] },
  { id: "res-lixadeira", kind: "maquina", label: "Lixadeira Automática", sector: "Acabamento", hoursPerDay: 8, status: "ativo", skills: ["lixamento"] },
  { id: "res-op-carlos", kind: "operador", label: "Carlos Silva", sector: "Corte", hoursPerDay: 8, status: "ativo", skills: ["corte", "cnc"] },
  { id: "res-op-marina", kind: "operador", label: "Marina Costa", sector: "Montagem", hoursPerDay: 8, status: "ativo", skills: ["montagem", "acabamento"] },
  { id: "res-op-rafael", kind: "operador", label: "Rafael Souza", sector: "Usinagem", hoursPerDay: 8, status: "ativo", skills: ["cnc", "furacao"] },
  { id: "res-op-julia", kind: "operador", label: "Julia Almeida", sector: "Acabamento", hoursPerDay: 8, status: "ativo", skills: ["colagem", "lixamento"] },
  { id: "res-setor-corte", kind: "setor", label: "Setor de Corte", sector: "Corte", hoursPerDay: 16, status: "ativo" },
  { id: "res-setor-usinagem", kind: "setor", label: "Setor de Usinagem", sector: "Usinagem", hoursPerDay: 16, status: "ativo" },
  { id: "res-setor-montagem", kind: "setor", label: "Setor de Montagem", sector: "Montagem", hoursPerDay: 16, status: "ativo" },
];

export function filterByKind(kind: PlanningResource["kind"]): readonly PlanningResource[] {
  return DEFAULT_RESOURCES.filter((r) => r.kind === kind);
}

export function findResource(id: string): PlanningResource | undefined {
  return DEFAULT_RESOURCES.find((r) => r.id === id);
}

export function resourcesBySector(sector: string): readonly PlanningResource[] {
  return DEFAULT_RESOURCES.filter((r) => r.sector === sector);
}