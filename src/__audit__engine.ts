import { createProject, ensureProjectRoomShells } from "@/modules/planner/shared/factories/project";
import { applyLayout, type LayoutShape } from "@/modules/planner/domains/ia/services/layout";
import { matchDescription } from "@/modules/planner/domains/ia/services/matcher";

type Scenario = {
  name: string;
  roomType: any;
  width: number; depth: number;
  shape: LayoutShape;
  pieces: { description: string; count?: number }[];
};

const scenarios: Scenario[] = [
  { name: "Cozinha em L compacta", roomType: "cozinha", width: 3600, depth: 3000, shape: "L",
    pieces: [
      { description: "aéreo 3 portas 1200mm branco" },
      { description: "gaveteiro 4 gavetas 600mm" },
      { description: "torre forno micro-ondas" },
      { description: "balcão pia 1500mm" },
    ] },
  { name: "Cozinha linear grande", roomType: "cozinha", width: 4500, depth: 3200, shape: "linear",
    pieces: [
      { description: "aéreo 2 portas 800mm" , count: 3 },
      { description: "gaveteiro 4 gavetas 600mm", count: 2 },
    ] },
  { name: "Roupeiro 6 portas", roomType: "dormitorio", width: 3600, depth: 3000, shape: "linear",
    pieces: [
      { description: "roupeiro 6 portas 3000mm" },
    ] },
  { name: "Cozinha em U", roomType: "cozinha", width: 3600, depth: 3000, shape: "U",
    pieces: [
      { description: "aéreo 2 portas 800mm", count: 3 },
      { description: "gaveteiro 4 gavetas 600mm", count: 2 },
      { description: "balcão pia 1500mm" },
    ] },
  { name: "Closet completo", roomType: "closet", width: 3000, depth: 2400, shape: "U",
    pieces: [
      { description: "cabideiro 900mm", count: 2 },
      { description: "gaveteiro 4 gavetas 600mm", count: 2 },
      { description: "sapateira 900mm" },
    ] },
];

function overlaps(a: any, b: any) {
  const ax1 = a.x, ay1 = a.y, ax2 = a.x + a.w, ay2 = a.y + a.d;
  const bx1 = b.x, by1 = b.y, bx2 = b.x + b.w, by2 = b.y + b.d;
  return !(ax2 <= bx1 || bx2 <= ax1 || ay2 <= by1 || by2 <= ay1);
}

let hardFail = 0;
for (const sc of scenarios) {
  let proj = createProject({ tenantId: "t", ownerId: "u", name: sc.name,
    briefing: { environmentType: sc.roomType } as any });
  // force room with the requested size
  proj = ensureProjectRoomShells(proj);
  const env = proj.environments[0];
  const room = env.rooms[0];
  proj = { ...proj, environments: [ { ...env, rooms: [ { ...room, dimensions: { width: sc.width, depth: sc.depth, height: 2700 } } ] } ] };
  proj = ensureProjectRoomShells(proj); // rebuild shell to new size
  // ensureProjectRoomShells won't regenerate shell if room already has one — let's recreate manually via factories path:
  const env2 = proj.environments[0]; const room2 = env2.rooms[0];

  const res = applyLayout(proj, { environmentId: env2.id, roomId: room2.id },
    { shape: sc.shape, pieces: sc.pieces });

  // extract placed modules
  const finalRoom = res.project.environments[0].rooms[0];
  const modules = Object.values(finalRoom.nodes).filter((n:any) => n.kind === "module");
  const requested = sc.pieces.reduce((s,p)=>s+(p.count??1),0);

  // build AABBs
  const boxes = modules.map((m:any) => {
    const w = Number(m.params.width) || 600;
    const d = Number(m.params.depth) || 600;
    const x = Number(m.params.x) || 0; // center? or corner?
    const y = Number(m.params.y) || 0;
    return { id: m.id, label: m.label, w, d, x: x - w/2, y: y - d/2, cx: x, cy: y,
      doors: m.params.doors, drawers: m.params.drawers };
  });

  const inside = boxes.filter(b => b.x >= -5 && b.y >= -5 && b.x + b.w <= sc.width + 5 && b.y + b.d <= sc.depth + 5);
  const outside = boxes.length - inside.length;

  let collisions = 0;
  for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) if (overlaps(boxes[i], boxes[j])) collisions++;

  // wall attach: min distance to any wall < 200mm
  const attached = boxes.filter(b => {
    const d = Math.min(b.y, b.x, sc.width - (b.x+b.w), sc.depth - (b.y+b.d));
    return d < 200;
  }).length;

  const doorDrawerParams = boxes.filter(b => b.doors != null || b.drawers != null).length;

  const status = (res.placed === requested && outside === 0 && collisions === 0 && attached === boxes.length) ? "PASS" : "FAIL";
  if (status === "FAIL") hardFail++;
  console.log(`[${status}] ${sc.name} | placed=${res.placed}/${requested} outside=${outside} collisions=${collisions} attached=${attached}/${boxes.length} params(doors/drawers)=${doorDrawerParams}`);
  if (status === "FAIL") {
    console.log("  reasons:", res.reasons);
    for (const b of boxes) console.log(`   • ${b.label} @ (${b.x.toFixed(0)},${b.y.toFixed(0)}) ${b.w}x${b.d}  doors=${b.doors} drawers=${b.drawers}`);
  }
}

// matcher fidelity
console.log("\n--- Matcher fidelity ---");
for (const q of ["aéreo 3 portas 1200mm", "gaveteiro 4 gavetas 600mm", "roupeiro 6 portas 3000mm", "balcão pia 1500mm", "torre forno"]) {
  const m = matchDescription(q);
  console.log(m ? `  ✓ "${q}" → ${m.item.name}  doors=${m.params?.doors} drawers=${m.params?.drawers} W=${m.overrides.width}` : `  ✗ "${q}" NO MATCH`);
}

console.log(hardFail === 0 ? "\nAUDIT: PASS" : `\nAUDIT: ${hardFail} FAILURES`);
process.exit(hardFail === 0 ? 0 : 1);
