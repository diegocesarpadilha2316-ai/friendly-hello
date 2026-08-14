import { describe, expect, it } from "vitest";
import {
  motionGroupOfPart,
  openStateForGroup,
  openStatesByPiece,
  resolveMotion,
  type ConstructionMotion,
} from "../index";
import { buildWardrobe } from "../../families/wardrobe";

const MM = 0.001;

/** Simula o que o viewport faz: estado da UI → estado da peça → transform. */
function frameOf(
  assembly: ReturnType<typeof buildWardrobe>["assembly"],
  controls: { openDoors?: boolean; openDrawers?: boolean },
) {
  const states = openStatesByPiece(assembly.pieces, controls);
  const byPiece = new Map<string, ConstructionMotion>();
  for (const m of assembly.motions) if (m.kind !== "static") byPiece.set(m.pieceId, m);
  return assembly.pieces.map((p) => {
    const m = byPiece.get(p.id);
    return {
      piece: p,
      moves: m ? resolveMotion(m, states[p.id] ?? 0) : null,
    };
  });
}

describe("Comandos da interface → mecanismos", () => {
  it("classifica cada peça no grupo certo", () => {
    expect(motionGroupOfPart("porta")).toBe("portas");
    expect(motionGroupOfPart("gaveta-frente")).toBe("gavetas");
    expect(motionGroupOfPart("gaveta-lateral")).toBe("gavetas");
    expect(motionGroupOfPart("prateleira")).toBe("mecanismos");
    expect(openStateForGroup("portas", { openDoors: true })).toBe(1);
    expect(openStateForGroup("portas", { openDoors: false })).toBe(0);
    expect(openStateForGroup("gavetas", { openDoors: true })).toBe(0);
  });

  it("o pivô da dobradiça acompanha a posição da porta no móvel", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir" });
    const doors = assembly.pieces.filter((p) => p.partKind === "porta");
    for (const d of doors) {
      const m = assembly.motions.find((x) => x.pieceId === d.id);
      expect(m, d.id).toBeDefined();
      const pivot = m!.pivot!;
      // O eixo tem de cair sobre uma das bordas verticais da própria folha.
      const left = d.box.x;
      const right = d.box.x + d.box.width;
      expect(Math.min(Math.abs(pivot[0] - left), Math.abs(pivot[0] - right))).toBeLessThanOrEqual(
        4,
      );
      // E no plano da folha, não no fundo do móvel.
      expect(Math.abs(pivot[2] - d.box.z)).toBeLessThanOrEqual(4);
    }
  });

  it("abrir portas gira as folhas de abrir e não mexe no resto", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir", drawers: 2 });
    const open = frameOf(assembly, { openDoors: true, openDrawers: false });

    const doors = open.filter((x) => x.piece.partKind === "porta");
    expect(doors).toHaveLength(2);
    for (const d of doors) expect(Math.abs(d.moves!.rotateDeg[1])).toBeGreaterThan(80);
    // Folhas opostas giram para fora (sentidos contrários).
    expect(Math.sign(doors[0].moves!.rotateDeg[1])).toBe(-Math.sign(doors[1].moves!.rotateDeg[1]));

    // Gavetas e estrutura permanecem paradas.
    for (const x of open.filter((y) => y.piece.partKind !== "porta")) {
      if (!x.moves) continue;
      expect(x.moves.translate).toEqual([0, 0, 0]);
      expect(x.moves.rotateDeg).toEqual([0, 0, 0]);
    }
  });

  it("fechar portas volta tudo para zero", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir" });
    for (const x of frameOf(assembly, { openDoors: false, openDrawers: false })) {
      if (!x.moves) continue;
      expect(x.moves.rotateDeg).toEqual([0, 0, 0]);
      expect(x.moves.translate).toEqual([0, 0, 0]);
    }
  });

  it("abrir gavetas puxa TODAS as peças da gaveta para a frente, juntas", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir", drawers: 2 });
    const open = frameOf(assembly, { openDoors: false, openDrawers: true });

    const drawerPieces = open.filter((x) => x.piece.partKind.startsWith("gaveta"));
    expect(drawerPieces.length).toBeGreaterThanOrEqual(8);
    const travels = new Set<number>();
    for (const d of drawerPieces) {
      expect(d.moves, d.piece.id).not.toBeNull();
      expect(d.moves!.translate[2]).toBeGreaterThan(100); // sai para +Z (frente)
      travels.add(d.moves!.translate[2]);
    }
    // A caixa inteira anda o mesmo curso — não se desmonta ao abrir.
    expect(travels.size).toBe(1);
    // Portas ficam paradas.
    for (const d of open.filter((x) => x.piece.partKind === "porta")) {
      expect(d.moves!.rotateDeg).toEqual([0, 0, 0]);
    }
  });

  it("fechar gavetas zera o curso", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, drawers: 2 });
    for (const x of frameOf(assembly, { openDrawers: false })) {
      if (!x.moves) continue;
      expect(x.moves.translate[2]).toBe(0);
    }
  });

  it("porta de correr responde a ABRIR PORTAS, não a abrir gavetas", () => {
    const { assembly } = buildWardrobe({ widthMm: 2700, doors: 3, opening: "correr", drawers: 2 });

    const asDoors = frameOf(assembly, { openDoors: true }).filter(
      (x) => x.piece.partKind === "porta",
    );
    expect(asDoors).toHaveLength(3);
    expect(asDoors.some((d) => Math.abs(d.moves!.translate[0]) > 100)).toBe(true);

    const asDrawers = frameOf(assembly, { openDrawers: true }).filter(
      (x) => x.piece.partKind === "porta",
    );
    for (const d of asDrawers) expect(d.moves!.translate).toEqual([0, 0, 0]);
  });

  it("as folhas de correr não atravessam o móvel ao abrir", () => {
    const { spec, assembly } = buildWardrobe({ widthMm: 2700, doors: 3, opening: "correr" });
    for (const x of frameOf(assembly, { openDoors: true })) {
      if (x.piece.partKind !== "porta") continue;
      const x0 = x.piece.box.x + x.moves!.translate[0];
      expect(x0).toBeGreaterThanOrEqual(-1);
      expect(x0 + x.piece.box.width).toBeLessThanOrEqual(spec.widthMm + 1);
    }
  });

  it("o curso convertido para metros fica em escala de móvel real", () => {
    const { assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir", drawers: 1 });
    const gav = frameOf(assembly, { openDrawers: true }).find((x) =>
      x.piece.partKind.startsWith("gaveta"),
    );
    expect((gav!.moves!.translate[2] ?? 0) * MM).toBeLessThan(0.8);
  });
});
