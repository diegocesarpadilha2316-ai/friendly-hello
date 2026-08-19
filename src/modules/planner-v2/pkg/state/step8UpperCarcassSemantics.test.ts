import "../../library/index";
import { describe, expect, it } from "vitest";
import { resolveCarcassConstruction } from "../../library/services/carcassConstructionResolver";
import { buildCarcass } from "../../library/families/kitchen/builders";
import { GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE } from "../../library/families/kitchen/upperCarcassConstructionRules";

describe("Step 8.2 — Upper carcass semantic reproduction", () => {
  it("POST-FIX resolve Upper sem toe-kick como READY e sem representação de toe-kick", () => {
    const result = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-golden-upper-800",
      dimensionsMm: { width: 800, height: 700, depth: 350 },
      thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
      toeKickMm: 0,
      shelves: 3,
      rule: GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE,
    });
    expect(result.validationStatus).toBe("READY");
    expect(result.toeKickMm).toBe(0);
    expect(result.diagnostics).toEqual([]);
    expect(result.toeKick).toBeUndefined();
    expect(result.bodyHeightMm).toBe(700);
    expect(result.internalHeightMm).toBe(664);
    expect(result.panels.find((panel) => panel.role === "side-left")?.relation.relation).toBe("full-height");
    expect(result.panels.find((panel) => panel.role === "side-left")?.relation.references).not.toContain("toe-kick");
  });

  it("aplica a semântica de toe-kick por regra sem exceção de moduleDefinitionId", () => {
    const upper = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-golden-upper-800",
      dimensionsMm: { width: 800, height: 700, depth: 350 },
      thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
      toeKickMm: 0,
      shelves: 3,
      rule: GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE,
    });
    expect(upper.validationStatus).toBe("READY");

    const upperWithToe = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-golden-upper-800",
      dimensionsMm: { width: 800, height: 700, depth: 350 },
      thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
      toeKickMm: 10,
      shelves: 3,
      rule: GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE,
    });
    expect(upperWithToe.validationStatus).toBe("INVALID");
    expect(upperWithToe.diagnostics.map((item) => item.code)).toContain("UNEXPECTED_TOE_KICK");

    const base = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-base-2-doors",
      dimensionsMm: { width: 900, height: 870, depth: 580 },
      thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
      toeKickMm: 150,
      shelves: 1,
      rule: {
        id: "base-test",
        moduleDefinitionId: "kitchen-base-2-doors",
        sideRelation: "full-height-above-toe-kick",
        baseRelation: "between-sides",
        topRelation: "between-sides-flush-with-top",
        backRelation: "between-sides-flush-with-rear",
        shelfRelation: "between-sides-supported",
        toeKickRelation: "separate-profile-supported-by-feet",
        shelfSideClearanceMm: 2,
        shelfDepthInsetMm: 20,
        toeKickInsetMm: 20,
        edgeBandingEdgesByRole: {},
      },
    });
    expect(base.validationStatus).toBe("READY");
    expect(base.toeKick).toBeDefined();
    expect(base.toeKick!.dimensionsMm.height).toBe(150);
    expect(base.panels.find((panel) => panel.role === "side-left")?.relation.relation).toBe("full-height-above-toe-kick");

    const baseWithoutToe = resolveCarcassConstruction({
      moduleDefinitionId: "kitchen-base-2-doors",
      dimensionsMm: { width: 900, height: 870, depth: 580 },
      thicknessMm: { panelMm: 18, shelfMm: 18, backMm: 6 },
      toeKickMm: 0,
      shelves: 1,
      rule: {
        id: "base-test-no-toe",
        moduleDefinitionId: "kitchen-base-2-doors",
        sideRelation: "full-height-above-toe-kick",
        baseRelation: "between-sides",
        topRelation: "between-sides-flush-with-top",
        backRelation: "between-sides-flush-with-rear",
        shelfRelation: "between-sides-supported",
        toeKickRelation: "separate-profile-supported-by-feet",
        shelfSideClearanceMm: 2,
        shelfDepthInsetMm: 20,
        toeKickInsetMm: 20,
        edgeBandingEdgesByRole: {},
      },
    });
    expect(baseWithoutToe.validationStatus).toBe("INVALID");
    expect(baseWithoutToe.diagnostics.map((item) => item.code)).toContain("MISSING_REQUIRED_TOE_KICK");

    expect(() => buildCarcass("upper-instance-invalid", { width: 800, height: 700, depth: 350 }, {
      moduleDefinitionId: "kitchen-golden-upper-800",
      materialId: "mdf-white",
      toeKickMm: 10,
      shelves: 3,
      doorLeaves: 2,
    })).toThrow(/Carcass inválida/);
  });
});
