import { describe, expect, it } from "vitest";
import { moduleIdForNaturalRequest, parseDesignIntent, parseKitchenComposition } from "./usePlannerStore";

describe("CompositionSpec natural de cozinha", () => {
  it("decompõe uma cozinha em ModuleSpec oficiais com espessura de MDF", () => {
    const spec = parseKitchenComposition("Crie uma cozinha com torre 700 mm, balcão 800 mm, gaveteiro 600 mm, pia 1200 mm e aéreos em cima, tudo em MDF 18 mm.");
    expect(spec).not.toBeNull();
    expect(spec?.thicknessMm).toEqual({ panelMm: 18, doorMm: 18, shelfMm: 18, backMm: 6 });
    expect(spec?.modules.map((module) => module.moduleId)).toEqual([
      "kitchen-tower-oven-microwave",
      "kitchen-base-2-doors",
      "kitchen-drawer-3",
      "kitchen-sink-cabinet",
      "kitchen-golden-upper-800",
    ]);
    expect(spec?.modules.find((module) => module.moduleId === "kitchen-sink-cabinet")?.dimensionsMm.width).toBe(1200);
  });

  it("mantém espessuras alternativas por pedido natural", () => {
    const spec = parseKitchenComposition("Monte uma cozinha com balcão 800 mm, gaveteiro 600 mm e pia 800 mm em MDF 25 mm.");
    expect(spec?.thicknessMm.panelMm).toBe(25);
    expect(spec?.modules).toHaveLength(3);
  });
});

it("roteia pedidos incrementais para as famílias oficiais", () => {
  expect(moduleIdForNaturalRequest("crie um aéreo de 800 mm com duas portas e três prateleiras")).toBe("kitchen-golden-upper-800");
  expect(moduleIdForNaturalRequest("adicione ao lado um aéreo de 600 com uma porta")).toBe("kitchen-upper-1-door");
  expect(moduleIdForNaturalRequest("embaixo faça um balcão de pia de 1200 com duas portas")).toBe("kitchen-sink-cabinet");
  expect(moduleIdForNaturalRequest("do lado direito quero um gaveteiro de 600 com quatro gavetas")).toBe("kitchen-drawer-4");
  expect(moduleIdForNaturalRequest("coloque uma torre para forno e micro-ondas no final")).toBe("kitchen-tower-oven-microwave");
});

it("produz DesignIntent com fabricação e sem coordenadas manuais", () => {
  const intent = parseDesignIntent("Crie uma cozinha com balcão 800 mm e gaveteiro 600 mm em MDF Freijó 18 mm, com puxador gola e bancada de granito. Gere a lista de corte, BOM e render.");
  expect(intent).not.toBeNull();
  expect(intent?.constraints.noManualPositioning).toBe(true);
  expect(intent?.constraints.requireLayoutEngine).toBe(true);
  expect(intent?.constraints.requireFabricationReport).toBe(true);
  expect(intent?.materials.body).toBe("mdf-freijo");
  expect(intent?.materials.countertop).toBe("stone-granite");
  expect(intent?.hardware.handle).toBe("handle-gola");
  expect(intent?.requestedOutputs).toEqual(["scene", "render", "cut-list", "bom"]);
});

it("decompõe o pedido final completo do documento sem móveis livres", () => {
  const spec = parseKitchenComposition("Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.");
  expect(spec?.modules.map((module) => module.moduleId)).toEqual([
    "kitchen-tower-oven-microwave",
    "kitchen-base-2-doors",
    "kitchen-drawer-4",
    "kitchen-sink-cabinet",
    "kitchen-golden-upper-800",
  ]);
  expect(spec?.thicknessMm.panelMm).toBe(18);
});
