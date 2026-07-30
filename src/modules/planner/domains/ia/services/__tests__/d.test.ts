import { it } from "vitest";
import { parseEdits } from "/dev-server/src/modules/planner/domains/ia/services/edits";
import { countOf } from "/dev-server/src/modules/planner/domains/ia/services/spec";
it("dbg", () => {
  console.log("edits:", JSON.stringify(parseEdits("Coloque 4 gavetas internas.")));
  console.log("count:", countOf("coloque 4 gavetas internas.", "gaveta"));
  console.log("count prat:", countOf("coloque 4 gavetas internas.", "prateleir"));
  console.log("div:", countOf("coloque 4 gavetas internas.", "(?:divis|modul)"));
});
