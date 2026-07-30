import { describe, expect, it } from "vitest";
import { createRoomShell } from "@/modules/planner/shared";
import { analyzeRoom } from "./analyze";
import { composeLayout } from "./compose";
import { composeDecor } from "./decor";
import { rebalanceComposition } from "./quality";

describe("composicao", () => {
  it("analisa e compoe uma cozinha", () => {
    const nodes = createRoomShell("r1", 4200, 3200, 100);
    const room = {
      id: "r1", name: "Cozinha",
      dimensions: { width: 4200, depth: 3200, height: 2700 },
      nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
      nodeOrder: nodes.map((n) => n.id),
    } as never;
    const a = analyzeRoom(room, { environment: "cozinha", style: "minimalista" });
    expect(a.areaM2).toBeCloseTo(13.44, 1);
    expect(a.walls.top.hasWindow).toBe(true);
    expect(a.walls.top.allowsTall).toBe(false);
    const c = composeLayout(a, [
      { description: "balcão 800mm", count: 3 },
      { description: "torre forno 700mm" },
      { description: "aéreo 800mm", count: 3 },
    ]);
    expect(c.pieces.every((p) => p.wall)).toBe(true);
    expect(c.pieces.find((p) => p.description.includes("torre"))!.wall).not.toBe("top");
    const decor = composeDecor({ analysis: a, occupied: [{ x: 0, y: 0, w: 4200, d: 650 }], sizeOf: () => ({ w: 400, d: 400 }) });
    expect(decor.length).toBeGreaterThan(1);
    const { report } = rebalanceComposition(a, [{ x: 0, y: 0, w: 4200, d: 650 }], decor);
    expect(report.score).toBeGreaterThan(60);
  });
});
