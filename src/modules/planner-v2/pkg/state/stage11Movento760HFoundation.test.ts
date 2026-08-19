import { describe, expect, it } from "vitest";
import { GOLDEN_DRAWER_3_BOX_RULE, GOLDEN_DRAWER_3_ID, GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE, GOLDEN_DRAWER_3_SLIDE_RULE, GOLDEN_DRAWER_3_STACK_RULE } from "../../library/families/kitchen/drawerRules";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
import { resolveDrawerStack } from "../../library/services/drawerStackResolver";
import type { ResolvedCarcass } from "../../library/contracts/CarcassConstructionRule";

const variant = HardwareRegistry.getManufacturingVariant("slide-hidden-soft-close", "blum-movento-760h-nl500");
if (!variant || variant.manufacturingSpec.kind !== "runner") throw new Error("MOVENTO variant missing from test setup");
const industrialSpec = variant.manufacturingSpec;

function carcass(width: number, depth = 580): ResolvedCarcass {
  return {
    id: "test-carcass",
    moduleDefinitionId: GOLDEN_DRAWER_3_ID,
    dimensionsMm: { width, height: 870, depth },
    thicknessProfileMm: { panelMm: 18, shelfMm: 18, backMm: 18, doorMm: 18 },
    toeKickMm: 150,
    internalWidthMm: width - 36,
    internalHeightMm: 684,
    internalDepthMm: depth - 18,
    bodyHeightMm: 720,
    panels: [],
    validationStatus: "READY",
    diagnostics: [],
  };
}

describe("Stage 11 — pure MOVENTO 760H resolver", () => {
  it("uses official SKW and SKL equations for the pilot", () => {
    const result = resolveDrawerStack({
      moduleDefinitionId: GOLDEN_DRAWER_3_ID,
      carcass: carcass(800),
      stackRule: GOLDEN_DRAWER_3_STACK_RULE,
      boxRule: GOLDEN_DRAWER_3_BOX_RULE,
      slideRule: GOLDEN_DRAWER_3_SLIDE_RULE,
      industrialSlideRule: GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE,
      industrialSlideSpec: industrialSpec,
    });
    expect(result.status).toBe("READY");
    expect(result.industrialSlide).toMatchObject({
      nominalLengthMm: 500,
      drawerLengthMm: 490,
      drawerWidthMm: 722,
      drawerSideThicknessMm: 15,
      mountingStatus: "READY",
      machiningStatus: "INCOMPLETE",
    });
    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.boxWidthMm === 722 && item.boxDepthMm === 490)).toBe(true);
  });

  it("recalculates width while keeping the same verified nominal length", () => {
    const result = resolveDrawerStack({
      moduleDefinitionId: GOLDEN_DRAWER_3_ID,
      carcass: carcass(1000),
      stackRule: GOLDEN_DRAWER_3_STACK_RULE,
      boxRule: GOLDEN_DRAWER_3_BOX_RULE,
      slideRule: GOLDEN_DRAWER_3_SLIDE_RULE,
      industrialSlideRule: GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE,
      industrialSlideSpec: industrialSpec,
    });
    expect(result.status).toBe("READY");
    expect(result.industrialSlide?.drawerWidthMm).toBe(922);
    expect(result.industrialSlide?.drawerLengthMm).toBe(490);
  });

  it("fails explicitly when internal depth is smaller than SKL", () => {
    const result = resolveDrawerStack({
      moduleDefinitionId: GOLDEN_DRAWER_3_ID,
      carcass: carcass(800, 500),
      stackRule: GOLDEN_DRAWER_3_STACK_RULE,
      boxRule: GOLDEN_DRAWER_3_BOX_RULE,
      slideRule: GOLDEN_DRAWER_3_SLIDE_RULE,
      industrialSlideRule: GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE,
      industrialSlideSpec: industrialSpec,
    });
    expect(result.status).toBe("INVALID");
    expect(result.diagnostics).toContain("A abertura interna (482 mm) não comporta SKL 490 mm.");
  });

  it("rejects a non-official nominal length without falling back to visual-safe geometry", () => {
    const result = resolveDrawerStack({
      moduleDefinitionId: GOLDEN_DRAWER_3_ID,
      carcass: carcass(800),
      stackRule: GOLDEN_DRAWER_3_STACK_RULE,
      boxRule: GOLDEN_DRAWER_3_BOX_RULE,
      slideRule: GOLDEN_DRAWER_3_SLIDE_RULE,
      industrialSlideRule: { ...GOLDEN_DRAWER_3_INDUSTRIAL_SLIDE_RULE, nominalLengthMm: 515 },
      industrialSlideSpec: industrialSpec,
    });
    expect(result.status).toBe("INVALID");
    expect(result.diagnostics.some((message) => message.includes("não está entre os comprimentos nominais oficiais"))).toBe(true);
  });
});
