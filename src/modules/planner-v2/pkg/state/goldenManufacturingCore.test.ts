import { beforeEach, describe, expect, it } from "vitest";
import "../../library";
import { usePlannerStore } from "./usePlannerStore";
import { buildFabricationReport } from "../../library/services/fabricationReport";
import { buildNestingPlanFromPartDefinitions } from "../../library/services/nestingPlan";

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

describe("Golden Manufacturing Module — Balcão 2 Portas", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: localStorageMock, dispatchEvent: () => true },
      configurable: true,
    });
    storage.clear();
    usePlannerStore.getState().newProject();
  });

  it("interpreta o comando completo com corpo branco e frente Louro Freijó", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors");
    expect(id).toBeTruthy();
    store.sendMessage(
      "Quero um Balcão 2 Portas com largura 900 mm, altura 870 mm, profundidade 580 mm, corpo branco, frente Louro Freijó e puxador Gola.",
    );
    const instance = usePlannerStore.getState().instances[0];
    expect(instance.dimensionsMm).toEqual({ width: 900, height: 870, depth: 580 });
    expect(instance.materialOverrides.body).toBe("mdf-white");
    expect(instance.materialOverrides.front).toBe("mdf-freijo");
    expect(instance.materialOverrides.door).toBe("mdf-freijo");
    expect(instance.hardwareOverrides.handle).toBe("handle-gola");
    expect(instance.parts.find((part) => part.role === "side-left")?.materialId).toBe("mdf-white");
    expect(instance.parts.find((part) => part.role === "door")?.materialId).toBe("mdf-freijo");
  });

  it("recalcula peças, cut-list e nesting em 900 → 1000 → 900 mm", () => {
    const store = usePlannerStore.getState();
    const id = store.addFurnitureInstance("kitchen-base-2-doors", undefined, { width: 900, height: 870, depth: 580 });
    expect(id).toBeTruthy();
    let instance = usePlannerStore.getState().instances[0];
    const beforeParts = instance.parts.map((part) => ({ id: part.id, width: part.dimensionsMm.width, height: part.dimensionsMm.height }));
    const beforeCut = buildFabricationReport([instance]);
    const beforeNesting = buildNestingPlanFromPartDefinitions(instance.parts);

    store.sendMessage("Altere a largura do Balcão 2 Portas para 1000 mm.");
    instance = usePlannerStore.getState().instances[0];
    expect(instance.dimensionsMm.width).toBe(1000);
    expect(instance.parts.map((part) => ({ id: part.id, width: part.dimensionsMm.width, height: part.dimensionsMm.height }))).not.toEqual(beforeParts);
    const afterCut = buildFabricationReport([instance]);
    const afterNesting = buildNestingPlanFromPartDefinitions(instance.parts);
    expect(afterCut.cutItems.map((item) => [item.key, item.quantity, item.widthMm, item.heightMm])).not.toEqual(
      beforeCut.cutItems.map((item) => [item.key, item.quantity, item.widthMm, item.heightMm]),
    );
    expect(afterNesting.boards.flatMap((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h]))).not.toEqual(
      beforeNesting.boards.flatMap((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h])),
    );

    store.sendMessage("Altere a largura do Balcão 2 Portas para 900 mm.");
    instance = usePlannerStore.getState().instances[0];
    expect(instance.dimensionsMm.width).toBe(900);
    const restoredCut = buildFabricationReport([instance]);
    const restoredNesting = buildNestingPlanFromPartDefinitions(instance.parts);
    expect(restoredCut.cutItems.map((item) => [item.key, item.quantity, item.widthMm, item.heightMm])).toEqual(
      beforeCut.cutItems.map((item) => [item.key, item.quantity, item.widthMm, item.heightMm]),
    );
    expect(restoredNesting.boards.flatMap((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h]))).toEqual(
      beforeNesting.boards.flatMap((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h])),
    );
  });

  it("mantém material, espessura, peças e fabricação após IA e reload", () => {
    const store = usePlannerStore.getState();
    expect(store.furniture).toEqual([]);
    expect(store.instances).toEqual([]);
    expect(store.selectedId).toBeNull();

    const id = store.addFurnitureInstance("kitchen-base-2-doors");
    expect(id).toBeTruthy();
    let state = usePlannerStore.getState();
    let instance = state.instances[0];
    expect(instance.moduleDefinitionId).toBe("kitchen-base-2-doors");
    expect(instance.thicknessMm).toEqual({ panelMm: 18, doorMm: 18, shelfMm: 18, backMm: 6 });
    expect(instance.parts.length).toBeGreaterThan(0);
    expect(instance.parts.filter((part) => part.role !== "hardware").every((part) => part.thicknessMm)).toBe(true);

    const initialReport = buildFabricationReport(state.instances);
    const initialNesting = buildNestingPlanFromPartDefinitions(instance.parts);
    expect(initialReport.warnings).toEqual([]);
    expect(initialReport.cutItems.every((item) => item.thicknessMm)).toBe(true);
    expect(initialNesting.boards.length).toBeGreaterThan(0);

    store.sendMessage("Altere este balcão para 800 mm de largura.");
    store.sendMessage("Altere a profundidade deste balcão para 550 mm.");
    store.sendMessage("Troque o puxador deste balcão para perfil.");
    state = usePlannerStore.getState();
    instance = state.instances[0];
    expect(instance.dimensionsMm.width).toBe(800);
    expect(instance.dimensionsMm.depth).toBe(550);
    expect(instance.hardwareOverrides.handle).toBe("handle-profile");
    expect(instance.parts.length).toBeGreaterThan(0);

    const beforeInvalid = JSON.stringify(instance);
    store.sendMessage("Deixe esse balcão com 50 mm de largura.");
    state = usePlannerStore.getState();
    expect(JSON.stringify(state.instances[0])).toBe(beforeInvalid);
    expect(state.messages.at(-1)?.content).toContain("mínimo");
    expect(state.messages.at(-1)?.content).toContain("50");

    const beforeSave = buildFabricationReport(state.instances);
    const beforeSaveNesting = buildNestingPlanFromPartDefinitions(state.instances[0].parts);
    expect(beforeSave.warnings).toEqual([]);
    expect(beforeSave.cutItems.every((item) => item.thicknessMm)).toBe(true);
    expect(store.saveProject()).toBe(true);

    usePlannerStore.setState((current) => ({ ...current, furniture: [], instances: [], selectedId: null }));
    expect(usePlannerStore.getState().instances).toEqual([]);
    expect(usePlannerStore.getState().loadProject()).toBe(true);
    state = usePlannerStore.getState();
    instance = state.instances[0];
    const afterReload = buildFabricationReport(state.instances);
    const afterReloadNesting = buildNestingPlanFromPartDefinitions(instance.parts);

    expect(instance.dimensionsMm).toEqual({ width: 800, height: 870, depth: 550 });
    expect(instance.thicknessMm).toEqual({ panelMm: 18, doorMm: 18, shelfMm: 18, backMm: 6 });
    expect(instance.hardwareOverrides.handle).toBe("handle-profile");
    expect(afterReload.warnings).toEqual([]);
    expect(afterReload.cutItems.map(({ key, quantity, widthMm, heightMm, depthMm, thicknessMm, materialId }) => ({ key, quantity, widthMm, heightMm, depthMm, thicknessMm, materialId })))
      .toEqual(beforeSave.cutItems.map(({ key, quantity, widthMm, heightMm, depthMm, thicknessMm, materialId }) => ({ key, quantity, widthMm, heightMm, depthMm, thicknessMm, materialId })));
    expect(afterReloadNesting.boards.map((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h])))
      .toEqual(beforeSaveNesting.boards.map((board) => board.placements.map((placement) => [placement.code, placement.x, placement.y, placement.w, placement.h])));
  });
});
