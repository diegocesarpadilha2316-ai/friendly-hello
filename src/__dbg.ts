import { buildLaundryModule, validateLaundryModule, planLaundryLayout } from "@/modules/planner/shared/families/laundry";
const t = buildLaundryModule({ kind: "torre-maquinas" });
console.log(JSON.stringify(validateLaundryModule(t).issues, null, 1));
const s = buildLaundryModule({ kind: "modulo-lavadora", appliance: { kind: "lavadora-superior" }, countertop: { material: "granito" } });
console.log(JSON.stringify(validateLaundryModule(s).issues, null, 1));
console.log(JSON.stringify(buildLaundryModule({kind:"modulo-lavadora",widthMm:700}).reservations.map(r=>r.kind)));
const p = planLaundryLayout({ widthMm: 320, preset: "area-servico-completa" });
console.log(p.source, JSON.stringify(p.placements.map(x=>[x.kind,x.widthMm])));
