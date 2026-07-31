import { describe, it, expect } from "vitest";
import { buildKitchenModule, kitchenReservationConflicts, KITCHEN_MODULE_KINDS, normalizeKitchenModule, kitchenLegacyParams, kitchenSpecFromLegacy, planKitchen, validateKitchenLayout } from "../index";
import { motionGroupOfPiece } from "../../../construction";

describe("audit2", () => {
  it("volumes tecnicos", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const r = buildKitchenModule({ kind });
      const c = kitchenReservationConflicts(r);
      if (c.length) console.log(kind, JSON.stringify(c));
      // grupos de comando
      const groups = new Set(r.assembly.pieces.map(p => `${p.partKind}:${motionGroupOfPiece(p)}`));
      const slideNonDrawer = r.assembly.motions.filter(m => m.kind === "slide").map(m => {
        const p = r.assembly.pieces.find(x => x.id === m.pieceId)!;
        return `${p.partKind}->${motionGroupOfPiece(p)}`;
      });
      console.log(kind, "reserv:", r.reservations.length, "slide:", [...new Set(slideNonDrawer)].join(","), "|", [...groups].join(" "));
    }
  });
  it("roundtrip", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const a = normalizeKitchenModule({ kind, widthMm: 850, countertop: { material: "marmore", backsplashMm: 80 }, plinth: { kind: "madeira" }, led: true });
      const b = kitchenSpecFromLegacy({ subtype: kind, widthMm: a.widthMm, heightMm: a.heightMm, depthMm: a.depthMm, params: kitchenLegacyParams(a) });
      if (JSON.stringify(a) !== JSON.stringify(b)) console.log("DIFF", kind, JSON.stringify(a), JSON.stringify(b));
      expect(JSON.stringify(b), kind).toBe(JSON.stringify(a));
    }
  });
  it("resize", () => {
    for (const L of [1800, 2500, 3500, 5000, 6200]) {
      const r = planKitchen({ shape:"reta", walls:[{id:"p1",lengthMm:L,heightMm:2700,fixtures:[{id:"pia",kind:"pia",atMm:200,widthMm:1200}]}]});
      const v = validateKitchenLayout(r);
      const tot = r.placements.filter(p=>p.level!=="superior").reduce((a,p)=>a+p.widthMm,0);
      console.log(L, "base+col=", tot, "mods", r.totals.moduleCount, "err", v.errors.map(e=>e.code).join(","), "resized", r.resized.length, "fillers", r.fillers.length);
      expect(v.errors, String(L)).toHaveLength(0);
    }
    for (const h of [2200, 2400, 2700]) {
      const r = planKitchen({ shape:"reta", config:{ upperGapMm: 500 }, walls:[{id:"p1",lengthMm:3000,heightMm:h}]});
      console.log("H", h, r.placements.filter(p=>p.level==="superior").map(p=>p.heightMm).join(","), r.warnings.map(w=>w.code).join(","));
    }
  });
});
