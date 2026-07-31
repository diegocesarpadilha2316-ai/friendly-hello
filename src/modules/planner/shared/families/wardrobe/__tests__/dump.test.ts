import { it } from "vitest";
import { buildWardrobe } from "@/modules/planner/shared/families/wardrobe";
it("dump", () => {
  const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir", maleiro: true });
  console.log(assembly.motions.map(m => `${m.kind}:${m.pieceId}`).join("\n"));
  console.log(assembly.pieces.filter(p=>p.partKind==="porta").map(p=>`${p.id}|${p.notes}`).join("\n"));
});
