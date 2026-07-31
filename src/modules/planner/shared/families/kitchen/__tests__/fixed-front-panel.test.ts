/**
 * PAINÉIS FRONTAIS FIXOS — o canto diagonal emitia suas abas como `porta`,
 * fazendo o sistema tratá-las como folhas móveis sem rig.
 *
 * Os testes percorrem o caminho real do viewport: spec → buildKitchenModule
 * → peças + rigs → motionGroup → intertravamento.
 */
import { describe, expect, it } from "vitest";
import { buildKitchenModule, normalizeKitchenModule, planKitchen, type KitchenLayoutInput } from "../index";
import {
  buildAssembly,
  classifyFront,
  isFixedFront,
  motionGroupOfPiece,
  openStateForGroup,
  openStatesByPiece,
  resolveInterlock,
  resolveMotion,
  type ConstructionPiece,
} from "../../../construction";

const diagonal = () =>
  buildKitchenModule(
    normalizeKitchenModule({ kind: "canto-diagonal", widthMm: 900, heightMm: 850, depthMm: 600 }),
  );

const wings = (pieces: readonly ConstructionPiece[]) =>
  pieces.filter((p) => p.frontRole === "aba-canto");

describe("canto diagonal — abas fixas", () => {
  it("1. a aba fixa não recebe rig", () => {
    const built = diagonal();
    const w = wings(built.assembly.pieces);
    expect(w.length).toBe(2);
    for (const piece of w) {
      expect(isFixedFront(piece.partKind)).toBe(true);
      expect(piece.partKind).not.toBe("porta");
      expect(built.assembly.motions.some((m) => m.pieceId === piece.id)).toBe(false);
    }
  });

  it("2. 'Abrir portas' não movimenta a aba fixa", () => {
    const built = diagonal();
    const states = openStatesByPiece(built.assembly.pieces, { openDoors: true, openDrawers: true });
    for (const piece of wings(built.assembly.pieces)) {
      expect(motionGroupOfPiece(piece)).toBe("fixo");
      expect(states[piece.id]).toBe(0);
      expect(openStateForGroup("fixo", { openDoors: true, openDrawers: true })).toBe(0);
    }
  });

  it("3. 'Fechar portas' não altera a transformação da aba fixa", () => {
    const built = diagonal();
    for (const piece of wings(built.assembly.pieces)) {
      const motion = built.assembly.motions.find((m) => m.pieceId === piece.id);
      expect(motion).toBeUndefined();
      const open = openStatesByPiece(built.assembly.pieces, { openDoors: true })[piece.id];
      const shut = openStatesByPiece(built.assembly.pieces, { openDoors: false })[piece.id];
      expect(open).toBe(shut);
    }
  });

  it("4. a aba fixa não é contada como mecanismo", () => {
    const built = diagonal();
    const mechanisms = built.assembly.pieces.filter(
      (p) => motionGroupOfPiece(p) !== "fixo" && motionGroupOfPiece(p) !== "mecanismos",
    );
    // Só a folha central é mecanismo de porta.
    expect(mechanisms.filter((p) => motionGroupOfPiece(p) === "portas").length).toBe(1);
    expect(wings(built.assembly.pieces).every((p) => motionGroupOfPiece(p) === "fixo")).toBe(true);
  });

  it("5. a aba fixa não bloqueia gaveta 'por ser confundida com porta'", () => {
    // Gaveta atrás de uma aba fixa: o bloqueio existe (é físico), mas a razão
    // é 'frente-fixa' — nunca 'porta-fechada'/'abra a porta desta coluna'.
    const built = diagonal();
    const wing = wings(built.assembly.pieces)[0];
    const gaveta: ConstructionPiece = {
      id: "teste:gaveta-1",
      partKind: "gaveta-frente",
      label: "Gaveta teste",
      box: { ...wing.box, z: wing.box.z - 300, depth: 280 },
      thicknessMm: 18,
      grain: "horizontal",
      substrate: "chapa",
    };
    const result = resolveInterlock({
      pieces: [...built.assembly.pieces, gaveta],
      motions: [
        ...built.assembly.motions,
        {
          pieceId: gaveta.id,
          kind: "slide",
          axis: "z",
          maxTravelMm: 400,
          direction: -1,
          durationMs: 600,
          easing: "ease-out",
        },
      ],
      desired: { [gaveta.id]: 1 },
      current: {},
    });
    const block = result.blocked.find((b) => b.byPieceId === wing.id);
    if (block) {
      expect(block.reason).toBe("frente-fixa");
      expect(block.message).not.toMatch(/Abra a porta/);
    }
  });

  it("6. a geometria do canto diagonal permanece dentro do envelope", () => {
    const spec = normalizeKitchenModule({ kind: "canto-diagonal", widthMm: 900, heightMm: 850, depthMm: 600 });
    const built = buildKitchenModule(spec);
    for (const p of built.assembly.pieces) {
      expect(p.box.x, p.id).toBeGreaterThanOrEqual(-60);
      expect(p.box.x + p.box.width, p.id).toBeLessThanOrEqual(spec.widthMm + 60);
      expect(p.box.y + p.box.height, p.id).toBeLessThanOrEqual(spec.heightMm + 2);
    }
  });

  it("7. não surge abertura entre a aba fixa e a folha móvel", () => {
    const built = diagonal();
    const [left, right] = wings(built.assembly.pieces).sort((a, b) => a.box.x - b.box.x);
    const door = built.assembly.pieces.find((p) => p.partKind === "porta");
    expect(door).toBeDefined();
    // As frentes se tocam (sem vão) na horizontal.
    expect(door!.box.x).toBeCloseTo(left.box.x + left.box.width, 1);
    expect(right.box.x).toBeCloseTo(door!.box.x + door!.box.width, 1);
    // E ficam no mesmo plano frontal e na mesma altura.
    expect(left.box.z).toBeCloseTo(door!.box.z, 1);
    expect(left.box.height).toBeCloseTo(door!.box.height, 1);
  });

  it("8. cozinha em L com canto diagonal continua sem interpenetração", () => {
    const input: KitchenLayoutInput = {
      walls: [
        { id: "a", lengthMm: 3000, heightMm: 2600, cornerKindEnd: "canto-diagonal" },
        { id: "b", lengthMm: 2400, heightMm: 2600 },
      ],
      shape: "L",
    };
    const plan = planKitchen(input);
    const errors = plan.warnings.filter((w) => w.level === "error");
    expect(errors, errors.map((e) => e.message).join("\n")).toHaveLength(0);
    for (const placement of plan.placements) {
      const built = buildKitchenModule(placement.spec);
      // Nenhuma peça fixa carrega rig em nenhum módulo da cena.
      for (const piece of built.assembly.pieces) {
        if (isFixedFront(piece.partKind)) {
          expect(built.assembly.motions.some((m) => m.pieceId === piece.id), piece.id).toBe(false);
        }
      }
    }
  });

  it("9. cantos reto e mágico continuam corretos", () => {
    for (const kind of ["canto-reto", "canto-magico"] as const) {
      const built = buildKitchenModule(
        normalizeKitchenModule({ kind, widthMm: 900, heightMm: 850, depthMm: 600 }),
      );
      expect(built.assembly.pieces.length).toBeGreaterThan(0);
      // A frente cega deixou de ser porta e não ganhou rig.
      for (const piece of built.assembly.pieces.filter((p) => isFixedFront(p.partKind))) {
        expect(built.assembly.motions.some((m) => m.pieceId === piece.id)).toBe(false);
      }
      // A porta móvel do canto continua com dobradiça.
      const door = built.assembly.pieces.find((p) => p.partKind === "porta");
      if (door) {
        const motion = built.assembly.motions.find((m) => m.pieceId === door.id);
        expect(motion?.kind).toBe("hinge");
        expect(resolveMotion(motion!, 1).rotateDeg.some((d) => d !== 0)).toBe(true);
      }
    }
  });
});

describe("taxonomia de frentes", () => {
  it("distingue os seis tipos de frente", () => {
    const piece = (partKind: ConstructionPiece["partKind"], frontRole?: ConstructionPiece["frontRole"]) =>
      ({ partKind, frontRole }) as Pick<ConstructionPiece, "partKind" | "frontRole">;

    const hinge = { pieceId: "x", kind: "hinge", axis: "y", direction: 1, durationMs: 600, easing: "ease-out" } as const;
    const slide = { pieceId: "x", kind: "slide", axis: "x", direction: 1, durationMs: 600, easing: "ease-out" } as const;
    expect(classifyFront(piece("porta"), hinge)).toBe("porta-abrir");
    expect(classifyFront(piece("porta"), slide)).toBe("porta-correr");
    expect(classifyFront(piece("gaveta-frente"))).toBe("gaveta-frente");
    expect(classifyFront(piece("frente-fixa", "painel-fixo"))).toBe("painel-fixo");
    expect(classifyFront(piece("tapa-vao", "tapa-vao"))).toBe("tapa-vao");
    expect(classifyFront(piece("frente-fixa", "aba-canto"))).toBe("aba-canto");
    expect(classifyFront(piece("lateral"))).toBeNull();
  });

  it("um painel avulso nunca é emitido como porta", () => {
    const assembly = buildAssembly({
      id: "t",
      label: "Painel",
      slots: [{ id: "p", component: "painel", params: { widthMm: 1200, heightMm: 2400, treatment: "liso" } }],
    });
    const front = assembly.pieces[0];
    expect(front.partKind).toBe("frente-fixa");
    expect(motionGroupOfPiece(front)).toBe("fixo");
    expect(assembly.motions).toHaveLength(0);
  });
});