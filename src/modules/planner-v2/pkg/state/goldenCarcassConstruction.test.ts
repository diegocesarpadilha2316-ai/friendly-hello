import { describe, expect, it } from "vitest";
import { buildCarcass } from "../../library/families/kitchen/builders";
import { GOLDEN_CARCASS_CONSTRUCTION_RULE } from "../../library/families/kitchen/carcassConstructionRules";
import { resolveCarcassConstruction, validateResolvedCarcass } from "../../library/services/carcassConstructionResolver";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildNestingPlanFromPartDefinitions, validateNestingIntegrity } from "../../library/services/nestingPlan";
import { usePlannerStore } from "./usePlannerStore";
import { buildModule } from "../../library/services/buildModule";

const goldenInput = (overrides: Partial<Parameters<typeof resolveCarcassConstruction>[0]> = {}) => ({
  moduleDefinitionId: "kitchen-base-2-doors",
  dimensionsMm: { width: 900, height: 870, depth: 580 },
  thicknessMm: { panelMm: 18, doorMm: 18, shelfMm: 18, backMm: 6 },
  toeKickMm: 150,
  shelves: 1,
  rule: GOLDEN_CARCASS_CONSTRUCTION_RULE,
  ...overrides,
});

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

function setupStore() {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock, dispatchEvent: () => true, CustomEvent: class CustomEvent { constructor(public type: string) {} } },
    configurable: true,
  });
  storage.clear();
  usePlannerStore.getState().newProject();
}

describe("Golden Carcass Construction — Etapa 7", () => {
  it("resolve a caixa Golden 900×870×580 com relações construtivas explícitas", () => {
    const resolved = resolveCarcassConstruction(goldenInput());
    expect(resolved.validationStatus).toBe("READY");
    expect(resolved.internalWidthMm).toBe(864);
    expect(resolved.internalHeightMm).toBe(684);
    expect(resolved.internalDepthMm).toBe(574);
    expect(resolved.bodyHeightMm).toBe(720);
    expect(resolved.panels.map((panel) => panel.idSuffix)).toEqual([
      "side-left", "side-right", "base", "top", "back", "shelf-1",
    ]);
    expect(resolved.toeKick).toBeDefined();
    expect(resolved.toeKick!.dimensionsMm).toEqual({ width: 864, height: 150, depth: 20 });
    expect(resolved.toeKick!.positionMm).toEqual({ x: 0, y: 75, z: 260 });

    const snapshot = Object.fromEntries(resolved.panels.map((panel) => [panel.idSuffix, {
      role: panel.role,
      dimensionsMm: panel.dimensionsMm,
      positionMm: panel.positionMm,
      thicknessMm: panel.thicknessMm,
      materialSlot: panel.materialSlot,
      grainDirection: panel.grainDirection,
      edgeBandingEdges: panel.edgeBandingEdges,
      relation: panel.relation.relation,
    }]));
    expect(snapshot).toEqual({
      "side-left": {
        role: "side-left",
        dimensionsMm: { width: 18, height: 720, depth: 580 },
        positionMm: { x: -441, y: 510, z: 0 },
        thicknessMm: 18,
        materialSlot: "body",
        grainDirection: "vertical",
        edgeBandingEdges: ["front"],
        relation: "full-height-above-toe-kick",
      },
      "side-right": {
        role: "side-right",
        dimensionsMm: { width: 18, height: 720, depth: 580 },
        positionMm: { x: 441, y: 510, z: 0 },
        thicknessMm: 18,
        materialSlot: "body",
        grainDirection: "vertical",
        edgeBandingEdges: ["front"],
        relation: "full-height-above-toe-kick",
      },
      base: {
        role: "base",
        dimensionsMm: { width: 864, height: 18, depth: 580 },
        positionMm: { x: 0, y: 159, z: 0 },
        thicknessMm: 18,
        materialSlot: "body",
        grainDirection: "horizontal",
        edgeBandingEdges: ["front"],
        relation: "between-sides",
      },
      top: {
        role: "top",
        dimensionsMm: { width: 864, height: 18, depth: 580 },
        positionMm: { x: 0, y: 861, z: 0 },
        thicknessMm: 18,
        materialSlot: "body",
        grainDirection: "horizontal",
        edgeBandingEdges: ["front"],
        relation: "between-sides-flush-with-top",
      },
      back: {
        role: "back",
        dimensionsMm: { width: 864, height: 684, depth: 6 },
        positionMm: { x: 0, y: 510, z: -287 },
        thicknessMm: 6,
        materialSlot: "back",
        grainDirection: "none",
        edgeBandingEdges: [],
        relation: "between-sides-flush-with-rear",
      },
      "shelf-1": {
        role: "shelf",
        dimensionsMm: { width: 862, height: 18, depth: 560 },
        positionMm: { x: 0, y: 510, z: 10 },
        thicknessMm: 18,
        materialSlot: "body",
        grainDirection: "horizontal",
        edgeBandingEdges: ["front"],
        relation: "between-sides-supported",
      },
    });
  });

  it("mantém laterais espelhadas e a base entre elas em toda a matriz de larguras", () => {
    for (const width of [600, 800, 900, 1000, 1200]) {
      const resolved = resolveCarcassConstruction(goldenInput({ dimensionsMm: { width, height: 870, depth: 580 } }));
      const left = resolved.panels.find((panel) => panel.role === "side-left")!;
      const right = resolved.panels.find((panel) => panel.role === "side-right")!;
      const base = resolved.panels.find((panel) => panel.role === "base")!;
      expect(resolved.validationStatus).toBe("READY");
      expect(left.positionMm.x).toBe(-right.positionMm.x);
      expect(left.dimensionsMm).toEqual(right.dimensionsMm);
      expect(base.dimensionsMm.width).toBe(width - 36);
      expect(resolved.internalWidthMm).toBe(width - 36);
    }
  });

  it("mantém a regra determinística nas profundidades e separa fundo de corpo", () => {
    for (const depth of [500, 550, 580, 600]) {
      const resolved = resolveCarcassConstruction(goldenInput({ dimensionsMm: { width: 900, height: 870, depth } }));
      const left = resolved.panels.find((panel) => panel.role === "side-left")!;
      const back = resolved.panels.find((panel) => panel.role === "back")!;
      const shelf = resolved.panels.find((panel) => panel.role === "shelf")!;
      expect(left.dimensionsMm.depth).toBe(depth);
      expect(back.dimensionsMm.depth).toBe(6);
      expect(back.positionMm.z).toBe(-depth / 2 + 3);
      expect(shelf.dimensionsMm.depth).toBe(Math.max(18, depth - 20));
      expect(resolved.thicknessProfileMm.panelMm).toBe(18);
      expect(resolved.thicknessProfileMm.backMm).toBe(6);
    }
  });

  it("mantém alturas válidas e deriva o espaço interno sem alterar o Front Layout", () => {
    for (const height of [720, 870, 900]) {
      const resolved = resolveCarcassConstruction(goldenInput({ dimensionsMm: { width: 900, height, depth: 580 } }));
      const left = resolved.panels.find((panel) => panel.role === "side-left")!;
      const back = resolved.panels.find((panel) => panel.role === "back")!;
      expect(left.dimensionsMm.height).toBe(height - 150);
      expect(back.dimensionsMm.height).toBe(height - 150 - 36);
      expect(resolved.internalHeightMm).toBe(height - 186);
    }
  });

  it("faz o builder consumir a mesma resolução, inclusive quando a espessura muda na fixture", () => {
    const thicknessMm = { panelMm: 25, doorMm: 18, shelfMm: 25, backMm: 9 };
    const resolved = resolveCarcassConstruction(goldenInput({ thicknessMm }));
    const parts = buildCarcass("kitchen-base-2-doors", { width: 900, height: 870, depth: 580 }, {
      materialId: "mdf-white",
      moduleDefinitionId: "kitchen-base-2-doors",
      thicknessMm,
      toeKickMm: 150,
      shelves: 1,
      doorLeaves: 2,
    });
    for (const panel of resolved.panels) {
      const part = parts.find((candidate) => candidate.id === `kitchen-base-2-doors:${panel.idSuffix}`);
      expect(part).toBeDefined();
      expect(part?.dimensionsMm).toEqual(panel.dimensionsMm);
      expect(part?.positionMm).toEqual(panel.positionMm);
      expect(part?.grainDirection).toBe(panel.grainDirection);
    }
    const base = parts.find((part) => part.id.endsWith(":base"))!;
    const back = parts.find((part) => part.id.endsWith(":back"))!;
    expect(base.dimensionsMm.width).toBe(850);
    expect(back.dimensionsMm.depth).toBe(9);
  });

  it("preserva a identidade definition/instance no caminho real store → buildModule → PartDefinitions", () => {
    setupStore();
    const store = usePlannerStore.getState();
    const createdId = store.addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 900, height: 870, depth: 580 });
    expect(createdId).toBeTruthy();
    const instance = usePlannerStore.getState().instances.find((item) => item.id === createdId)!;
    expect(instance.id).not.toBe(instance.moduleDefinitionId);
    expect(instance.moduleDefinitionId).toBe("kitchen-base-2-doors");

    const rebuilt = buildModule({
      moduleId: instance.moduleDefinitionId,
      instanceId: instance.id,
      dimensionsMm: instance.dimensionsMm,
      materialOverrides: instance.materialOverrides,
      hardwareOverrides: instance.hardwareOverrides,
      thicknessMm: instance.thicknessMm,
    });
    expect(rebuilt.ok).toBe(true);
    expect(rebuilt.parts.every((part) => part.moduleId === instance.id)).toBe(true);
    expect(rebuilt.parts.filter((part) => part.role === "side-left")[0]?.id).toBe(`${instance.id}:side-left`);
    expect(rebuilt.parts.filter((part) => part.role === "base")[0]?.groupId).toBeUndefined();

    const resolved = resolveCarcassConstruction(goldenInput({ moduleDefinitionId: instance.moduleDefinitionId }));
    expect(resolved.moduleDefinitionId).toBe("kitchen-base-2-doors");
    expect(rebuilt.parts.find((part) => part.id === `${instance.id}:base`)?.dimensionsMm).toEqual({ width: 864, height: 18, depth: 580 });
  });

  it("preserva IDs estruturais e a resolução no ciclo de dimensões, movimento e rotação", () => {
    const at900 = resolveCarcassConstruction(goldenInput());
    const at1000 = resolveCarcassConstruction(goldenInput({ dimensionsMm: { width: 1000, height: 870, depth: 580 } }));
    const restored900 = resolveCarcassConstruction(goldenInput());
    const at600Depth = resolveCarcassConstruction(goldenInput({ dimensionsMm: { width: 900, height: 870, depth: 600 } }));
    const restored580Depth = resolveCarcassConstruction(goldenInput());
    expect(at900.id).toBe(restored900.id);
    expect(at900.panels.map((panel) => panel.idSuffix)).toEqual(at1000.panels.map((panel) => panel.idSuffix));
    expect(at900.panels.map((panel) => panel.idSuffix)).toEqual(restored900.panels.map((panel) => panel.idSuffix));
    expect(at600Depth.panels.map((panel) => panel.idSuffix)).toEqual(restored580Depth.panels.map((panel) => panel.idSuffix));
    expect(restored580Depth).toEqual(at900);
  });

  it("alimenta cut-list e nesting diretamente pelas PartDefinitions do resolver", () => {
    setupStore();
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: 0 }, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const fabrication = buildFabricationReport([instance]);
    const nesting = buildNestingPlanFromPartDefinitions(instance.parts);
    const integrity = validateNestingIntegrity(instance.parts, nesting);
    expect(fabrication.cutItems.some((item) => item.role === "base" && item.widthMm === 864 && item.thicknessMm === 18)).toBe(true);
    expect(fabrication.cutItems.some((item) => item.role === "back" && item.depthMm === 6 && item.thicknessMm === 6)).toBe(true);
    expect(fabrication.cutItems.some((item) => item.role === "shelf" && item.widthMm === 862 && item.depthMm === 560)).toBe(true);
    expect(integrity.missingInNesting).toEqual([]);
    expect(integrity.duplicateInNesting).toEqual([]);
    expect(integrity.unknownInNesting).toEqual([]);
  });

  it("detecta dimensões inviáveis e não retorna uma carcass fabricável", () => {
    const resolved = resolveCarcassConstruction(goldenInput({
      dimensionsMm: { width: 30, height: 120, depth: 100 },
      thicknessMm: { panelMm: 25, doorMm: 25, shelfMm: 25, backMm: 9 },
    }));
    expect(resolved.validationStatus).toBe("INVALID");
    expect(resolved.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining([
      "NEGATIVE_INTERNAL_WIDTH",
      "NEGATIVE_INTERNAL_HEIGHT",
    ]));
    expect(validateResolvedCarcass(resolved)).toEqual(resolved.diagnostics);
  });
});
