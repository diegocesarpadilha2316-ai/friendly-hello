import { afterEach, describe, expect, it } from "vitest";
import { usePlannerStore } from "./usePlannerStore";

describe("Golden Kitchen preset", () => {
  afterEach(() => {
    usePlannerStore.getState().newProject();
  });

  it("creates a coherent parametric composition with real material overrides", () => {
    usePlannerStore.getState().applyGoldenKitchen();
    const instances = usePlannerStore.getState().instances;
    expect(instances.length).toBeGreaterThanOrEqual(6);
    expect(
      instances.some((instance) => instance.moduleDefinitionId === "kitchen-tower-oven-microwave"),
    ).toBe(true);
    expect(instances.every((instance) => instance.parts.length > 0)).toBe(true);
    expect(instances.some((instance) => instance.materialOverrides.body === "mdf-freijo")).toBe(
      true,
    );
    expect(
      instances.some((instance) => instance.materialOverrides.countertop === "stone-quartzite"),
    ).toBe(true);
  });

  it("records the preset as one undoable project operation", () => {
    usePlannerStore.getState().applyGoldenKitchen();
    const goldenCount = usePlannerStore.getState().instances.length;
    expect(goldenCount).toBeGreaterThan(0);
    usePlannerStore.getState().undo();
    expect(usePlannerStore.getState().instances.length).toBe(0);
    usePlannerStore.getState().redo();
    expect(usePlannerStore.getState().instances.length).toBe(goldenCount);
  });
});
