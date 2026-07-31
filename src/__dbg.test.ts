import { it, expect } from "vitest";
import { buildLaundryModule, validateLaundryModule, planLaundryLayout } from "@/modules/planner/shared/families/laundry";
it("dbg", () => {
  const t = buildLaundryModule({ kind: "torre-tecnica" });
  console.log(t.spec.widthMm, t.spec.heightMm, t.spec.depthMm, JSON.stringify(validateLaundryModule(t).issues));
  const p = planLaundryLayout({ widthMm: 200, modules: [{ kind: "gabinete-tanque", widthMm: 1200 }] });
  console.log(p.source, p.placements.length, JSON.stringify(p.warnings));
  expect(true).toBe(true);
});
