import { describe, expect, it } from "vitest";
import {
  mechanismGroupId,
  openStatesByPiece,
  resolveInterlock,
  resolveMotion,
  type ConstructionMotion,
  type ConstructionPiece,
} from "../index";
import { buildWardrobe } from "../../families/wardrobe";

type Ctrl = { openDoors?: boolean; openDrawers?: boolean };

function scene(input: Parameters<typeof buildWardrobe>[0]) {
  const { assembly, spec } = buildWardrobe(input);
  const motionByPiece = new Map<string, ConstructionMotion>();
  for (const m of assembly.motions) motionByPiece.set(m.pieceId, m);

  const doors = assembly.pieces.filter((p) => p.partKind === "porta");
  const drawers = assembly.pieces.filter((p) => p.partKind.startsWith("gaveta"));

  /** Estado permitido a partir dos botões + estado real da animação. */
  const solve = (ctrl: Ctrl, current?: Record<string, number>) =>
    resolveInterlock({
      pieces: assembly.pieces,
      motions: assembly.motions,
      desired: openStatesByPiece(assembly.pieces, ctrl),
      current,
    });

  /** Simula a animação até estabilizar (mesmo laço do viewport). */
  const simulate = (ctrl: Ctrl, start: Record<string, number> = {}, frames = 240) => {
    const cur: Record<string, number> = { ...start };
    const trace: Record<string, number>[] = [];
    for (let f = 0; f < frames; f++) {
      const { allowed } = solve(ctrl, cur);
      for (const p of assembly.pieces) {
        const target = allowed[p.id] ?? 0;
        cur[p.id] = (cur[p.id] ?? 0) + (target - (cur[p.id] ?? 0)) * 0.12;
      }
      trace.push({ ...cur });
    }
    return { cur, trace };
  };

  /** Caixa da peça no espaço do móvel, já com o movimento aplicado. */
  const boxAt = (piece: ConstructionPiece, state: number) => {
    const m = motionByPiece.get(piece.id);
    const b = piece.box;
    if (!m || m.kind === "static") return b;
    const t = resolveMotion(m, state);
    if (m.kind === "slide") {
      return {
        ...b,
        x: b.x + t.translate[0],
        y: b.y + t.translate[1],
        z: b.z + t.translate[2],
      };
    }
    // Dobradiça: projeção da folha no plano XZ ao girar em torno do pivô.
    const a = Math.abs((t.rotateDeg[1] ?? 0) * (Math.PI / 180));
    const proj = b.width * Math.cos(a);
    const px = t.pivot[0];
    const left = b.x < px ? px - proj : px;
    return { ...b, x: left, width: Math.max(1, proj), depth: b.depth + b.width * Math.sin(a) };
  };

  return { spec, assembly, doors, drawers, motionByPiece, solve, simulate, boxAt };
}

const G = mechanismGroupId;

describe("Intertravamento de mecanismos", () => {
  it("porta de abrir FECHADA bloqueia a gaveta da mesma coluna", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const r = s.solve({ openDrawers: true }, {});
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(0);
    expect(r.blocked.length).toBeGreaterThan(0);
    expect(r.blocked[0].reason).toBe("porta-fechada");
    expect(r.blocked[0].message).toMatch(/abra a porta/i);
  });

  it("porta ACIMA do ângulo seguro libera a gaveta", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const open: Record<string, number> = {};
    for (const d of s.doors) open[d.id] = 1; // 90°
    const r = s.solve({ openDoors: true, openDrawers: true }, open);
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(1);
    expect(r.blocked).toHaveLength(0);
  });

  it("porta PARCIALMENTE aberta mantém o bloqueio", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    // Estados cujo ângulo real ainda está abaixo do limite seguro (80°).
    for (const frac of [0.03, 0.1, 0.2]) {
      const partial: Record<string, number> = {};
      for (const d of s.doors) partial[d.id] = frac;
      const r = s.solve({ openDoors: true, openDrawers: true }, partial);
      const angle = Math.abs(resolveMotion(s.motionByPiece.get(s.doors[0].id)!, frac).rotateDeg[1]);
      expect(angle).toBeLessThan(80);
      for (const d of s.drawers) expect(r.allowed[d.id]).toBe(0);
      expect(r.blocked[0].reason).toBe("porta-parcial");
    }

    // Assim que o ângulo cruza o limite, o vão é liberado.
    const safe: Record<string, number> = {};
    for (const d of s.doors) safe[d.id] = 0.45;
    const angleSafe = Math.abs(
      resolveMotion(s.motionByPiece.get(s.doors[0].id)!, 0.45).rotateDeg[1],
    );
    expect(angleSafe).toBeGreaterThanOrEqual(80);
    const free = s.solve({ openDoors: true, openDrawers: true }, safe);
    for (const d of s.drawers) expect(free.allowed[d.id]).toBe(1);
  });

  it("folha de correr COBRINDO a coluna bloqueia a gaveta", () => {
    const s = scene({
      widthMm: 2400,
      doors: 2,
      opening: "correr",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const r = s.solve({ openDrawers: true }, {});
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(0);
    expect(r.blocked[0].reason).toBe("folha-cobrindo");
  });

  it("folha de correr FORA da coluna libera a gaveta", () => {
    const s = scene({
      widthMm: 2400,
      doors: 2,
      opening: "correr",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const open: Record<string, number> = {};
    for (const d of s.doors) open[d.id] = 1;
    const r = s.solve({ openDoors: true, openDrawers: true }, open);
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(1);
  });

  it("uma coluna livre NÃO desbloqueia a coluna vizinha", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    // Abre apenas a folha que NÃO cobre a coluna da gaveta.
    const drawerSpan = [s.drawers[0].box.x, s.drawers[0].box.x + s.drawers[0].box.width];
    const other = s.doors.find(
      (d) => d.box.x + d.box.width <= drawerSpan[0] + 1 || d.box.x >= drawerSpan[1] - 1,
    )!;
    const own = s.doors.find((d) => d.id !== other.id)!;
    const r = s.solve({ openDoors: true, openDrawers: true }, { [other.id]: 1, [own.id]: 0 });
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(0);
    expect(r.blocked[0].byPieceId).toBe(own.id);
  });

  it("botão Abrir gavetas abre só o que tem acesso livre", () => {
    // 2 colunas, gaveteiro na coluna 0; abrimos apenas a porta da coluna 0.
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const own = s.doors.find((d) => d.box.x < s.drawers[0].box.x + s.drawers[0].box.width - 30)!;
    const r = s.solve({ openDoors: true, openDrawers: true }, { [own.id]: 1 });
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(1);
    expect(r.blocked).toHaveLength(0);
  });

  it("a porta NÃO fecha atravessando a gaveta aberta", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const cur: Record<string, number> = {};
    for (const d of s.doors) cur[d.id] = 1;
    for (const d of s.drawers) cur[d.id] = 1; // tudo aberto
    const r = s.solve({ openDoors: false, openDrawers: false }, cur);
    const own = s.doors.find((d) => r.holding.includes(d.id))!;
    expect(own).toBeDefined();
    expect(r.allowed[own.id]).toBe(1); // segura aberta
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(0); // recolhe primeiro
  });

  it("ao fechar tudo, a sequência recolhe as gavetas ANTES das portas", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const start = s.simulate({ openDoors: true, openDrawers: true }).cur;
    for (const d of s.drawers) expect(start[d.id]).toBeGreaterThan(0.95);

    const { cur, trace } = s.simulate({ openDoors: false, openDrawers: false }, start);
    const gaveta = s.drawers[0].id;
    const porta = s.doors.find((d) => d.box.x <= s.drawers[0].box.x + 30)!.id;
    const closedAt = (id: string) => trace.findIndex((f) => (f[id] ?? 0) <= 0.05);
    expect(closedAt(gaveta)).toBeGreaterThanOrEqual(0);
    expect(closedAt(porta)).toBeGreaterThan(closedAt(gaveta));
    for (const p of [...s.doors, ...s.drawers]) expect(cur[p.id]).toBeLessThan(0.05);
  });

  it("nenhuma peça atravessa outra durante a animação", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 3,
      columns: 2,
      drawerColumn: 0,
    });
    const sequences: Array<[Ctrl, Record<string, number>]> = [];
    const opened = s.simulate({ openDoors: true, openDrawers: true }).cur;
    sequences.push([{ openDoors: true, openDrawers: true }, {}]);
    sequences.push([{ openDoors: false, openDrawers: false }, opened]);
    sequences.push([{ openDrawers: true }, {}]);

    for (const [ctrl, start] of sequences) {
      const { trace } = s.simulate(ctrl, start, 120);
      for (const frame of trace) {
        for (const drawer of s.drawers) {
          const db = s.boxAt(drawer, frame[drawer.id] ?? 0);
          const drawerFront = db.z + db.depth;
          for (const door of s.doors) {
            const pb = s.boxAt(door, frame[door.id] ?? 0);
            const sameColumn =
              Math.min(pb.x + pb.width, db.x + db.width) - Math.max(pb.x, db.x) > 30;
            if (!sameColumn) continue;
            // Se a folha ainda tapa a coluna, a gaveta não pode ter avançado.
            expect(drawerFront).toBeLessThanOrEqual(pb.z + pb.depth + 1);
          }
        }
      }
    }
  });

  it("gavetas de colunas diferentes são avaliadas de forma independente", () => {
    const a = scene({
      widthMm: 2400,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const b = scene({
      widthMm: 2400,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 1,
    });
    const groupsA = new Set(a.drawers.map((d) => G(d.id)));
    const groupsB = new Set(b.drawers.map((d) => G(d.id)));
    expect(groupsA.size).toBe(2);
    expect(groupsB.size).toBe(2);
    // Cada gaveteiro é bloqueado pela folha da SUA faixa, não por qualquer uma.
    const ra = a.solve({ openDrawers: true }, {});
    const rb = b.solve({ openDrawers: true }, {});
    expect(ra.blocked[0].byPieceId).not.toBe(rb.blocked[0].byPieceId);
  });

  it("todas as peças de uma gaveta bloqueada ficam paradas juntas", () => {
    const s = scene({
      widthMm: 1800,
      doors: 2,
      opening: "abrir",
      drawers: 2,
      columns: 2,
      drawerColumn: 0,
    });
    const r = s.solve({ openDrawers: true }, {});
    const byGroup = new Map<string, number[]>();
    for (const d of s.drawers) {
      const g = G(d.id);
      byGroup.set(g, [...(byGroup.get(g) ?? []), r.allowed[d.id] ?? 0]);
    }
    for (const states of byGroup.values()) expect(new Set(states).size).toBe(1);
  });

  it("móvel sem portas não bloqueia nada", () => {
    const s = scene({ widthMm: 900, doors: 0, drawers: 3, columns: 1, drawerColumn: 0 });
    const r = s.solve({ openDrawers: true }, {});
    expect(r.blocked).toHaveLength(0);
    for (const d of s.drawers) expect(r.allowed[d.id]).toBe(1);
  });
});
