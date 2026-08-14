import { describe, expect, it } from "vitest";
import { usePlannerStore } from "../../pkg/state/usePlannerStore";
import { buildJoineryReport } from "./joineryReport";

describe("joinery report — usinagem paramétrica", () => {
  it("gera conexões e ferragens para a cozinha natural", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(
      "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.",
    );
    const report = buildJoineryReport(usePlannerStore.getState().instances);

    expect(report.warnings).toEqual([]);
    expect(report.operations.some((item) => item.kind === "confirmat")).toBe(true);
    expect(report.operations.some((item) => item.kind === "dowel")).toBe(true);
    expect(report.operations.some((item) => item.kind === "hinge-cup")).toBe(true);
    expect(report.operations.some((item) => item.kind === "slide-fixing")).toBe(true);
  });
});
