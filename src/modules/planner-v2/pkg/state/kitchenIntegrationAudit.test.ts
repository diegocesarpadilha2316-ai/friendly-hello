import { describe, expect, it } from "vitest";
import { buildModule } from "../../library/services/buildModule";
import { layoutKitchenModules, createTestWall } from "../../library/layout/KitchenLayoutEngine";
import { parseKitchenComposition } from "./usePlannerStore";

describe("Auditoria da cozinha de integração", () => {
  it("usa o pedido natural final e posiciona todos os módulos pela sequência da parede", () => {
    const spec = parseKitchenComposition(
      "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.",
    );
    expect(spec).not.toBeNull();
    const wall = createTestWall();
    const layout = layoutKitchenModules(spec?.modules ?? [], wall);
    expect(layout.valid, layout.issues.map((issue) => issue.message).join("; ")).toBe(true);
    expect(
      layout.placements.every((placement) => placement.supported && !placement.collision),
    ).toBe(true);
    expect(layout.countertops).toHaveLength(1);
    expect(layout.countertops[0].supportModuleIds).toEqual([
      "natural-base",
      "natural-drawer",
      "natural-sink",
    ]);
    expect(layout.applianceZones.some((zone) => zone.moduleId === "natural-tower")).toBe(true);

    const built: Array<{
      id: string;
      name: string;
      dimensionsMm: { width: number; height: number; depth: number };
      positionMm: { x: number; y: number; z: number };
    }> = [];
    for (const moduleSpec of spec?.modules ?? []) {
      const placement = layout.placements.find((item) => item.moduleId === moduleSpec.id);
      expect(placement).toBeDefined();
      const outcome = buildModule({
        instanceId: moduleSpec.id,
        moduleId: moduleSpec.moduleId,
        dimensionsMm: moduleSpec.dimensionsMm,
        thicknessMm: spec?.thicknessMm,
        positionMm: placement!.positionMm,
        room: { widthMm: 6200, depthMm: 5000, heightMm: 3000 },
        instances: built,
      });
      expect(outcome.ok, outcome.error).toBe(true);
      expect(
        outcome.validation?.valid,
        outcome.validation?.errors.map((error) => error.message).join("; "),
      ).toBe(true);
      expect(outcome.parts.length).toBeGreaterThan(0);
      expect(new Set(outcome.parts.map((part) => part.id)).size).toBe(outcome.parts.length);
      built.push({
        id: moduleSpec.id,
        name: moduleSpec.moduleId,
        dimensionsMm: outcome.dimensionsMm,
        positionMm: placement!.positionMm,
      });
    }
    expect(built).toHaveLength(5);
  });
});
