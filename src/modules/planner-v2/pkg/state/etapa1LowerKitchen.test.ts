import { afterEach, describe, expect, it } from "vitest";
import { usePlannerStore } from "./usePlannerStore";

const request = `Crie uma cozinha limpa — ETAPA 1 — somente módulos inferiores e bancada. Em uma parede limpa, da esquerda para a direita: balcão 800 mm com 2 portas, gaveteiro 600 mm com 4 gavetas, balcão de pia 1200 mm com 2 portas e balcão 800 mm com 2 portas. Todos em MDF 18 mm. Não inclua aéreos, torre, geladeira, coifa, cooktop ou decoração.`;

describe("ETAPA 1 — inferiores + bancada derivada", () => {
  afterEach(() => usePlannerStore.getState().newProject());

  it("cria somente os quatro inferiores pela sequência do Layout Engine e deriva uma bancada contínua", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(request);
    const state = usePlannerStore.getState();
    expect(state.instances).toHaveLength(5);
    expect(state.instances.map((instance) => instance.moduleDefinitionId)).toEqual([
      "kitchen-base-2-doors",
      "kitchen-drawer-4",
      "kitchen-sink-cabinet",
      "kitchen-base-2-doors",
      "kitchen-countertop",
    ]);
    const lower = state.instances.slice(0, 4);
    expect(lower.map((instance) => instance.layout?.sequenceIndex)).toEqual([0, 1, 2, 3]);
    expect(lower.map((instance) => instance.layout?.supported)).toEqual([true, true, true, true]);
    expect(lower.map((instance) => instance.layout?.collision)).toEqual([false, false, false, false]);
    expect(lower.map((instance) => instance.dimensionsMm.width)).toEqual([800, 600, 1200, 800]);
    expect(lower.reduce((sum, instance) => sum + instance.dimensionsMm.width, 0)).toBe(3400);
    expect(state.instances[4].layout?.moduleDefinitionId).toBe("kitchen-countertop");
    expect(state.instances[4].layout?.startX).toBe(lower[0].layout?.startX);
    expect(state.instances[4].layout?.endX).toBe(lower[3].layout?.endX);
    expect(state.instances[4].layout?.supported).toBe(true);
    expect(state.instances[4].layout?.collision).toBe(false);
    expect(state.instances[4].dimensionsMm.width).toBe(3400);
    expect(state.instances[4].dimensionsMm.height).toBe(20);
  });

  it("mantém engenharia real no gaveteiro e no balcão de pia, e abre/fecha componentes sem colisão", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(request);
    const state = usePlannerStore.getState();
    const drawer = state.instances.find((instance) => instance.moduleDefinitionId === "kitchen-drawer-4")!;
    const sink = state.instances.find((instance) => instance.moduleDefinitionId === "kitchen-sink-cabinet")!;
    expect(drawer.parts.filter((part) => part.role === "drawer-front")).toHaveLength(4);
    expect(drawer.parts.filter((part) => part.role === "drawer-side")).toHaveLength(8);
    expect(drawer.parts.filter((part) => part.role === "hardware" && part.hardwareId === "slide-hidden-soft-close")).toHaveLength(8);
    expect(sink.parts.filter((part) => part.role === "door")).toHaveLength(2);
    expect(sink.parts.some((part) => part.volumeType === "technical" && part.id.includes("siphon-zone"))).toBe(true);
    expect(sink.parts.some((part) => part.volumeType === "technical" && part.id.includes("plumbing-recess"))).toBe(true);
    const firstDrawer = drawer.parts.find((part) => part.role === "drawer-front")!;
    store.toggleInstanceAnimation(drawer.id, firstDrawer.groupId);
    expect(usePlannerStore.getState().instances.find((instance) => instance.id === drawer.id)?.openStates?.[firstDrawer.groupId!]).toBe(1);
    store.toggleInstanceAnimation(drawer.id, firstDrawer.groupId);
    expect(usePlannerStore.getState().instances.find((instance) => instance.id === drawer.id)?.openStates?.[firstDrawer.groupId!]).toBe(0);
    store.toggleInstanceAnimation(sink.id);
    expect(usePlannerStore.getState().instances.find((instance) => instance.id === sink.id)?.isOpen).toBe(true);
    expect(usePlannerStore.getState().lastLibraryError).toBeNull();
    store.closeAllAnimations();
    expect(usePlannerStore.getState().instances.every((instance) => !instance.isOpen && !instance.openAmount)).toBe(true);
  });
});

it("documenta a largura nominal sem folga escondida", () => {
  expect(800 + 600 + 1200 + 800).toBe(3400);
});

export { request as etapa1LowerKitchenRequest };

afterEach(() => usePlannerStore.getState().newProject());
