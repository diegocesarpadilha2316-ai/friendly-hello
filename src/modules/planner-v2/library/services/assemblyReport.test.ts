import { describe, expect, it } from "vitest";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { buildAssemblyReport } from "./assemblyReport";

describe("assembly report — montagem fabricável", () => {
  it("gera sequência por módulo para a ETAPA 1", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage("Crie uma cozinha limpa — ETAPA 1: balcão 800 mm, gaveteiro 600 mm com 4 gavetas, pia 1200 mm e balcão 800 mm, somente inferiores, MDF 18 mm.");
    const report = buildAssemblyReport(usePlannerStore.getState().instances);

    expect(report.moduleCount).toBe(5);
    expect(report.warnings).toEqual([]);
    expect(report.steps.filter((step) => step.title.startsWith("Montar carcass"))).toHaveLength(5);
    expect(report.steps.some((step) => step.title.includes("caixas e corrediças"))).toBe(true);
    expect(report.steps.some((step) => step.title.includes("Inspeção final"))).toBe(true);
  });
});
