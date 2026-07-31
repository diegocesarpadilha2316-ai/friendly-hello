import { describe, it } from "vitest";
import { planKitchen, validateKitchenLayout, buildKitchenModule, type KitchenLayoutInput, type KitchenLayoutResult } from "../index";

function report(name: string, input: KitchenLayoutInput) {
  const r: KitchenLayoutResult = planKitchen(input);
  const v = validateKitchenLayout(r);
  const lines: string[] = [`\n===== ${name} =====`];
  for (const p of [...r.placements].sort((a,b)=> a.wallId.localeCompare(b.wallId) || a.level.localeCompare(b.level) || a.xMm-b.xMm)) {
    lines.push(`  ${p.wallId} ${p.level.padEnd(9)} x=${String(p.xMm).padStart(5)} w=${String(p.widthMm).padStart(4)} y=${p.yMm} h=${p.heightMm} d=${p.depthMm} ${p.kind} [${p.role}]`);
  }
  lines.push(`  runs: ${r.countertopRuns.map(x=>`${x.wallId}:${x.startMm}-${x.endMm}`).join(", ")}`);
  lines.push(`  dropped: ${JSON.stringify(r.dropped)}`);
  lines.push(`  errors: ${v.errors.map(e=>e.code+": "+e.message).join(" | ")}`);
  lines.push(`  warns: ${v.warnings.map(e=>e.code).join(", ")}`);
  // envelope check per module
  for (const p of r.placements) {
    const b = buildKitchenModule(p.spec);
    for (const pc of b.assembly.pieces) {
      if (pc.box.x < -60 || pc.box.x+pc.box.width > p.widthMm+60 || pc.box.y < -2 || pc.box.y+pc.box.height > p.heightMm+2 || pc.box.z+pc.box.depth > p.depthMm+60)
        lines.push(`  !! ENVELOPE ${p.id}/${p.kind}/${pc.id} box=${JSON.stringify(pc.box)} env=${p.widthMm}x${p.heightMm}x${p.depthMm}`);
    }
  }
  console.log(lines.join("\n"));
}

describe("audit", () => {
  it("dump", () => {
    report("C1 reta 2.5m", { shape:"reta", walls:[{ id:"p1", lengthMm:2500, heightMm:2700, fixtures:[
      {id:"pia",kind:"pia",atMm:200,widthMm:1200},{id:"ck",kind:"cooktop",atMm:1600,widthMm:800},{id:"coifa",kind:"coifa",atMm:1600,widthMm:800}]}]});
    report("C2 reta 3.5m", { shape:"reta", walls:[{ id:"p1", lengthMm:3500, heightMm:2700, fixtures:[
      {id:"gel",kind:"geladeira",atMm:0,widthMm:700},{id:"tq",kind:"torre-quente",atMm:700,widthMm:600},
      {id:"pia",kind:"pia",atMm:1300,widthMm:1000},{id:"ll",kind:"lava-loucas",atMm:2300,widthMm:600},
      {id:"ck",kind:"cooktop",atMm:2700,widthMm:800},{id:"coifa",kind:"coifa",atMm:2700,widthMm:800}]}]});
    report("C3 reta 5m", { shape:"reta", walls:[{ id:"p1", lengthMm:5000, heightMm:2700, fixtures:[
      {id:"gel",kind:"geladeira",atMm:0,widthMm:800},{id:"tq",kind:"torre-quente",atMm:800,widthMm:600},
      {id:"pia",kind:"pia",atMm:2000,widthMm:1200},{id:"ll",kind:"lava-loucas",atMm:3200,widthMm:600},
      {id:"ck",kind:"cooktop",atMm:4000,widthMm:800},{id:"coifa",kind:"coifa",atMm:4000,widthMm:800}]}]});
    report("C4 L", { shape:"L", walls:[
      { id:"a", lengthMm:3000, cornerEnd:true, fixtures:[{id:"pia",kind:"pia",atMm:600}]},
      { id:"b", lengthMm:2400, cornerStart:true, fixtures:[{id:"ck",kind:"cooktop",atMm:1200}]}]});
    report("C5 ilha", { shape:"ilha", walls:[{id:"p1",lengthMm:3000,fixtures:[{id:"pia",kind:"pia",atMm:600}]}], island:{lengthMm:2400,depthMm:900,hasCooktop:true,hasSink:true}});
    report("C6 obstaculos", { shape:"reta", walls:[{ id:"p1", lengthMm:4200, heightMm:2600, fixtures:[
      {id:"porta",kind:"porta",atMm:0,widthMm:800},{id:"pia",kind:"pia",atMm:1000,widthMm:1200},
      {id:"jan",kind:"janela",atMm:1000,widthMm:1400,sillMm:1100},{id:"ck",kind:"cooktop",atMm:2600,widthMm:800},
      {id:"coifa",kind:"coifa",atMm:2600,widthMm:800},{id:"gel",kind:"geladeira",atMm:3400,widthMm:800}]}]});
  });
});
