/**
 * Metadados globais da plataforma Dioris Hub.
 * Fonte única — não duplicar em módulos.
 */
export const app = {
  name: "Dioris Hub",
  shortName: "Dioris",
  description:
    "Plataforma modular Dioris Hub — fundação enterprise para módulos de Planner, Sites, CRM, Financeiro, Marketplace, Automação e IA.",
  locale: "pt-BR",
  modules: [
    "planner",
    "sites",
    "systems",
    "crm",
    "finance",
    "marketplace",
    "automation",
    "ai",
  ] as const,
} as const;

export type AppModule = (typeof app.modules)[number];
