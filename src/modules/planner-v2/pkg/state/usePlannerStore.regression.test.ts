import { beforeEach, describe, expect, it } from "vitest";
import "../../library";
import { usePlannerStore } from "./usePlannerStore";
import { useRoomBuilderStore } from "./useRoomBuilderStore";

describe("FurnitureInstance V7 — regressões de interação", () => {
  beforeEach(() => {
    usePlannerStore.getState().newProject();
  });

  it("insere e seleciona um módulo oficial Kitchen", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors");
    expect(id).toBeTruthy();
    const state = usePlannerStore.getState();
    expect(state.instances).toHaveLength(1);
    expect(state.selectedId).toBe(id);
    expect(state.instances[0].selected).toBe(true);
  });

  it("desfaz e refaz uma transformação válida sem perder FurnitureInstance", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors");
    expect(id).toBeTruthy();
    const before = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    const accepted = usePlannerStore.getState().updateFurnitureInstance(id!, {
      rotationDeg: { ...before.rotationDeg, y: before.rotationDeg.y + 5 },
    });
    expect(accepted).toBe(true);
    expect(usePlannerStore.getState().canUndo()).toBe(true);
    usePlannerStore.getState().undo();
    const undone = usePlannerStore.getState().instances.find((item) => item.id === id)!;
    expect(undone.rotationDeg).toEqual(before.rotationDeg);
    expect(usePlannerStore.getState().canRedo()).toBe(true);
    usePlannerStore.getState().redo();
    expect(usePlannerStore.getState().instances.find((item) => item.id === id)?.rotationDeg.y).toBe(
      before.rotationDeg.y + 5,
    );
  });

  it("oculta, mostra, isola e restaura somente FurnitureInstance", () => {
    const first = usePlannerStore.getState().addFurnitureInstance("kitchen-base-2-doors");
    const second = usePlannerStore.getState().addFurnitureInstance("kitchen-base-1-door");
    expect(first && second).toBeTruthy();
    usePlannerStore.getState().hideFurnitureInstance(first!);
    expect(usePlannerStore.getState().instances.find((item) => item.id === first)?.visible).toBe(
      false,
    );
    usePlannerStore.getState().showFurnitureInstance(first!);
    usePlannerStore.getState().setInstanceIsolated(second!);
    const isolated = usePlannerStore.getState().instances;
    expect(isolated.find((item) => item.id === second)?.visible).toBe(true);
    expect(isolated.find((item) => item.id === first)?.visible).toBe(false);
    usePlannerStore.getState().showAllInstances();
    expect(
      usePlannerStore.getState().instances.every((item) => item.visible && !item.isIsolated),
    ).toBe(true);
  });

  it("alterna uma porta em grupo sem perder o FurnitureInstance pai", () => {
    const id = usePlannerStore.getState().addFurnitureInstance("kitchen-base-1-door");
    const instance = usePlannerStore.getState().instances.find((item) => item.id === id);
    const door = instance?.parts.find((part) => part.interactive?.type === "door");
    expect(id && door).toBeTruthy();
    usePlannerStore.getState().toggleInstanceAnimation(id!, door!.id);
    const updated = usePlannerStore.getState().instances.find((item) => item.id === id);
    expect(updated?.parts.find((part) => part.id === door!.id)?.parentInstanceId).toBe(id);
    expect(updated?.openStates?.[door!.groupId ?? door!.id]).toBe(1);
  });

  it("cria um módulo dimensionado por comando natural e reconstrói suas peças oficiais", () => {
    usePlannerStore.getState().sendMessage("crie um gaveteiro 800x870x580 mm");
    const instance = usePlannerStore.getState().instances[0];
    expect(instance?.moduleDefinitionId).toBe("kitchen-drawer-3");
    expect(instance?.dimensionsMm).toEqual({ width: 800, height: 870, depth: 580 });
    expect(instance?.parts.length).toBeGreaterThan(0);
    expect(usePlannerStore.getState().messages.at(-1)?.content).toContain("800 × 870 × 580 mm");
  });

  it("configura as dimensões da sala pelo comando natural oficial", () => {
    usePlannerStore.getState().sendMessage("configure a cozinha 4,6 x 3,6 m");
    const room = useRoomBuilderStore.getState();
    expect(room.width).toBe(4600);
    expect(room.depth).toBe(3600);
    expect(usePlannerStore.getState().messages.at(-1)?.content).toContain("4600 × 3600 mm");
  });

  it("calcula drag preview com Snap e mantém instâncias como fonte de verdade", () => {
    const id = usePlannerStore
      .getState()
      .addFurnitureInstance("kitchen-base-2-doors", { x: 0, y: 0, z: -1200 });
    expect(id).toBeTruthy();
    usePlannerStore.getState().setDragPreview("kitchen-base-2-doors", { x: 815, y: 0, z: -1200 });
    const preview = usePlannerStore.getState().dragPreview;
    expect(preview).toBeTruthy();
    expect(preview?.positionMm.x).toBe(800);
    expect(preview?.snapInfo).toContain("Encaixe");
  });
});
