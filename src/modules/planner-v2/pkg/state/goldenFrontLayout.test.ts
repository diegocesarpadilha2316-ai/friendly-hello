import { describe, expect, it } from "vitest";
import type { FrontLayoutRule } from "../../library/contracts/FrontLayoutRule";
import { GOLDEN_2_DOOR_FRONT_LAYOUT_RULE } from "../../library/families/kitchen/frontLayoutRules";
import { buildDoors } from "../../library/families/kitchen/builders";
import { resolveFrontLayout } from "../../library/services/frontLayoutResolver";

function resolveGolden(width: number) {
  return resolveFrontLayout(
    {
      moduleDefinitionId: "kitchen-base-2-doors",
      cabinetWidthMm: width,
      cabinetHeightMm: 870,
      cabinetDepthMm: 580,
      frontBottomMm: 150,
      frontTopMm: 870,
      frontZMm: 299,
    },
    GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
  );
}

describe("Golden Front Layout Contract — Etapa 6", () => {
  it("resolve 900 mm por edges-first com simetria exata", () => {
    const layout = resolveGolden(900);
    expect(layout.validationStatus).toBe("READY");
    expect(layout.leftRevealMm).toBe(2);
    expect(layout.rightRevealMm).toBe(2);
    expect(layout.interFrontGapsMm).toEqual([2]);
    expect(layout.doorWidthsMm).toEqual([447, 447]);
    expect(layout.doorEdgesMm).toEqual([
      { left: -448, right: -1 },
      { left: 1, right: 448 },
    ]);
    expect(layout.doorCentersMm).toEqual([-224.5, 224.5]);
    expect(layout.doorCentersMm[0]).toBe(-layout.doorCentersMm[1]);
    expect(layout.pivotXByFrontMm).toEqual([-448, 448]);
    expect(layout.doorHeightMm).toBe(714);
    expect(layout.topRevealMm).toBe(3);
    expect(layout.bottomRevealMm).toBe(3);
    expect(2 + 447 + 2 + 447 + 2).toBe(900);
  });

  it("fecha simetricamente em todas as larguras exigidas do mesmo módulo", () => {
    for (const width of [600, 800, 900, 1000, 1200]) {
      const layout = resolveGolden(width);
      expect(layout.validationStatus).toBe("READY");
      expect(layout.doorWidthsMm[0]).toBe(layout.doorWidthsMm[1]);
      expect(layout.leftRevealMm).toBe(layout.rightRevealMm);
      expect(layout.doorCentersMm[0]).toBe(-layout.doorCentersMm[1]);
      expect(layout.doorEdgesMm[0].left + width / 2).toBe(2);
      expect(width / 2 - layout.doorEdgesMm[1].right).toBe(2);
      expect(2 + layout.doorWidthsMm[0] + 2 + layout.doorWidthsMm[1] + 2).toBe(width);
    }
  });

  it("escala 900→1000 sem alterar a regra nem os IDs semânticos", () => {
    const at900 = resolveGolden(900);
    const at1000 = resolveGolden(1000);
    expect(at1000.ruleId).toBe(at900.ruleId);
    expect(at1000.id).not.toBe(at900.id);
    expect(at1000.doorWidthsMm).toEqual([497, 497]);
    expect(at1000.doorCentersMm).toEqual([-249.5, 249.5]);
    expect(at1000.doorEdgesMm).toEqual([
      { left: -498, right: -1 },
      { left: 1, right: 498 },
    ]);
    expect(at1000.pivotXByFrontMm).toEqual([-498, 498]);
  });

  it("faz o builder consumir a regra, incluindo pivô, hinge side e hardware alinhado", () => {
    const parts = buildDoors("kitchen-base-2-doors", { width: 900, height: 870, depth: 580 }, {
      materialId: "mdf-freijo",
      toeKickMm: 150,
      doorLeaves: 2,
      hinge: "hinge-soft-close",
      mountingPlate: "mounting-plate-37-32",
      handle: "handle-bar",
    });
    const doors = parts.filter((part) => part.role === "door");
    expect(doors.map((door) => door.dimensionsMm.width)).toEqual([447, 447]);
    expect(doors.map((door) => door.positionMm.x)).toEqual([-224.5, 224.5]);
    expect(doors.map((door) => door.interactive?.hingeSide)).toEqual(["left", "right"]);
    expect(doors.map((door) => door.pivotMm?.x)).toEqual([-448, 448]);
    expect(parts.filter((part) => part.role === "hardware" && part.hardwareId === "hinge-soft-close").map((part) => part.positionMm.x)).toEqual([
      -413,
      -413,
      413,
      413,
    ]);
  });

  it("não aceita regra simétrica com reveals externos assimétricos", () => {
    const invalidSymmetryRule: FrontLayoutRule = {
      ...GOLDEN_2_DOOR_FRONT_LAYOUT_RULE,
      id: "test:asymmetric-reveal",
      leftRevealMm: 2,
      rightRevealMm: 4,
    };
    const layout = resolveFrontLayout(
      {
        moduleDefinitionId: "kitchen-base-2-doors",
        cabinetWidthMm: 900,
        cabinetHeightMm: 870,
        cabinetDepthMm: 580,
        frontBottomMm: 150,
        frontTopMm: 870,
        frontZMm: 299,
      },
      invalidSymmetryRule,
    );
    expect(layout.validationStatus).toBe("INCOMPLETE");
    expect(layout.diagnosticCodes).toEqual(["ASYMMETRIC_LAYOUT"]);
    expect(layout.diagnostics).toContain("Layout declarado simétrico possui reveals externos diferentes.");
    expect(layout.doorWidthsMm).toEqual([446, 446]);
    expect(layout.diagnosticCodes).toEqual(["ASYMMETRIC_LAYOUT"]);
    expect(2 + 446 + 2 + 446 + 4).toBe(900);
  });
});
