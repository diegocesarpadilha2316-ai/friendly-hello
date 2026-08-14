import { afterEach, describe, expect, it } from "vitest";
import { usePlannerStore } from "./usePlannerStore";

const request = "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.";

describe("cozinha linear natural no store", () => {
  afterEach(() => usePlannerStore.getState().newProject());

  it("executa IA → Layout Engine → biblioteca sem coordenadas manuais no pedido", () => {
    const store = usePlannerStore.getState();
    store.newProject();
    store.sendMessage(request);
    const instances = usePlannerStore.getState().instances;
    expect(instances).toHaveLength(5);
    expect(instances.map((instance) => instance.moduleDefinitionId)).toEqual([
      "kitchen-tower-oven-microwave",
      "kitchen-base-2-doors",
      "kitchen-drawer-4",
      "kitchen-sink-cabinet",
      "kitchen-golden-upper-800",
    ]);
    expect(instances.every((instance) => instance.layout?.supported === true && instance.layout?.collision === false)).toBe(true);
    expect(instances.map((instance) => instance.layout?.sequenceIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(instances[1].layout?.startX).toBe(instances[0].layout?.endX);
    expect(instances[2].layout?.startX).toBe(instances[1].layout?.endX);
    expect(instances[3].layout?.startX).toBe(instances[2].layout?.endX);
    expect(instances[4].layout?.wallId).toBe("wall-test-linear");
  });
});
