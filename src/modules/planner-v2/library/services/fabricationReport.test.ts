import { describe, expect, it, afterEach } from "vitest";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { buildFabricationReport, fabricationReportToCsv } from "./fabricationReport";

const request = `Crie uma cozinha limpa — ETAPA 1 — somente módulos inferiores e bancada. Em uma parede limpa, da esquerda para a direita: balcão 800 mm com 2 portas, gaveteiro 600 mm com 4 gavetas, balcão de pia 1200 mm com 2 portas e balcão 800 mm com 2 portas. Todos em MDF 18 mm. Não inclua aéreos, torre, geladeira, coifa, cooktop ou decoração.`;

describe("fabricação — lista de peças e ferragens", () => {
  afterEach(() => usePlannerStore.getState().newProject());

  it("gera relatório de peças físicas para os módulos reais", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(request);
    const state = usePlannerStore.getState();
    const report = buildFabricationReport(state.instances);

    expect(report.moduleCount).toBe(5);
    expect(report.modules.filter((module) => module.physicalPartCount > 0)).toHaveLength(5);
    expect(
      report.cutItems
        .filter((item) => item.role === "drawer-front")
        .reduce((sum, item) => sum + item.quantity, 0),
    ).toBe(4);
    expect(
      report.cutItems.some((item) => item.role === "countertop" && item.widthMm === 3440),
    ).toBe(true);
    expect(
      report.hardwareItems.some(
        (item) => item.hardwareId === "slide-hidden-soft-close" && item.quantity === 8,
      ),
    ).toBe(true);
    expect(report.warnings).toEqual([]);
  });

  it("exporta CSV com dimensões, material, veio e fita de borda", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(request);
    const csv = fabricationReportToCsv(
      buildFabricationReport(usePlannerStore.getState().instances),
    );

    expect(csv).toContain("largura_mm");
    expect(csv).toContain("profundidade_mm");
    expect(csv).toContain("veio");
    expect(csv).toContain("fita_frente");
    expect(csv.split("\n").length).toBeGreaterThan(5);
  });
});
