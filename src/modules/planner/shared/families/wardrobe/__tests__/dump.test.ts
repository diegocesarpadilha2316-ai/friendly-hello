import { it } from "vitest";
import { buildWardrobe } from "../index";
import { resolveMotion } from "../../../construction";
it("dump", () => {
  const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir", drawers: 2 });
  const ids = new Set(assembly.pieces.map(p=>p.id));
  for (const m of assembly.motions) {
    console.log(m.kind, m.pieceId, "existsPiece=", ids.has(m.pieceId), "pivot=", JSON.stringify(m.pivot), "axis", m.axis, "travel", m.maxTravelMm, "ang", m.maxAngleDeg, "=>", JSON.stringify(resolveMotion(m,1)));
  }
  console.log("DOORBOX", JSON.stringify(assembly.pieces.filter(p=>p.partKind==="porta").map(p=>[p.id,p.box])));
});
