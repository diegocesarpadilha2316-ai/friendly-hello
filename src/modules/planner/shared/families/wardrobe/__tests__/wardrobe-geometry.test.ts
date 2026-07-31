/**
 * VALIDAÇÃO GEOMÉTRICA DO ROUPEIRO REAL (regressões encontradas na
 * validação visual do viewport): nenhuma peça pode sair do envelope
 * externo, nenhum módulo obrigatório pode ser descartado e as únicas
 * interpenetrações aceitas são os encaixes de fundo em rasgo.
 */
import { describe, expect, it } from "vitest";
import { buildWardrobe } from "../index";

const SIZES = [
  { widthMm: 1800, heightMm: 2200, depthMm: 550 },
  { widthMm: 2400, heightMm: 2400, depthMm: 600 },
  { widthMm: 3000, heightMm: 2600, depthMm: 650 },
];

const scenario = (s: (typeof SIZES)[number]) =>
  buildWardrobe({
    ...s,
    columns: 3,
    maleiro: true,
    doors: 3,
    drawers: 3,
    shelvesPerColumn: 2,
    hangers: 2,
    shoeRacks: 1,
    opening: "abrir" as const,
  });

/** Interpenetração em mm nos três eixos (0 = apenas encosto). */
function overlap(a: { x: number; y: number; z: number; width: number; height: number; depth: number },
                 b: typeof a) {
  const eps = 0.5;
  const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  const oz = Math.min(a.z + a.depth, b.z + b.depth) - Math.max(a.z, b.z);
  return ox > eps && oy > eps && oz > eps;
}

describe("roupeiro · geometria real no viewport", () => {
  for (const size of SIZES) {
    const label = `${size.widthMm}×${size.heightMm}×${size.depthMm}`;

    it(`${label} · nenhuma peça sai do envelope externo`, () => {
      const { assembly } = scenario(size);
      for (const piece of assembly.pieces) {
        const b = piece.box;
        expect(b.width, piece.id).toBeGreaterThan(0);
        expect(b.height, piece.id).toBeGreaterThan(0);
        expect(b.depth, piece.id).toBeGreaterThan(0);
        expect(b.x, piece.id).toBeGreaterThanOrEqual(-1);
        expect(b.y, piece.id).toBeGreaterThanOrEqual(-1);
        expect(b.z, piece.id).toBeGreaterThanOrEqual(-1);
        expect(b.x + b.width, piece.id).toBeLessThanOrEqual(size.widthMm + 1);
        expect(b.y + b.height, piece.id).toBeLessThanOrEqual(size.heightMm + 1);
        expect(b.z + b.depth, piece.id).toBeLessThanOrEqual(size.depthMm + 1);
      }
    });

    it(`${label} · só o fundo em rasgo interpenetra outra peça`, () => {
      const { assembly } = scenario(size);
      const bad: string[] = [];
      for (let i = 0; i < assembly.pieces.length; i++) {
        for (let j = i + 1; j < assembly.pieces.length; j++) {
          const a = assembly.pieces[i];
          const b = assembly.pieces[j];
          if (a.partKind === "fundo" || b.partKind === "fundo") continue;
          if (overlap(a.box, b.box)) bad.push(`${a.id} × ${b.id}`);
        }
      }
      expect(bad).toEqual([]);
    });

    it(`${label} · nenhum módulo obrigatório é descartado`, () => {
      const { interior } = scenario(size);
      expect(interior.dropped).toEqual([]);
      expect(interior.validation.errors).toEqual([]);
      const modules = interior.plan.placements.map((p) => p.moduleId);
      expect(modules).toContain("cabideiro");
      expect(modules).toContain("sapateira");
      expect(modules).toContain("gaveta-interna");
      expect(modules).toContain("prateleira");
      expect(modules.filter((m) => m === "gaveta-interna")).toHaveLength(3);
      expect(modules.filter((m) => m === "cabideiro")).toHaveLength(2);
    });

    it(`${label} · frentes internas ficam atrás do plano das portas`, () => {
      const { assembly, layout } = scenario(size);
      const fronts = assembly.pieces.filter((p) => p.partKind === "gaveta-frente");
      expect(fronts.length).toBeGreaterThan(0);
      for (const f of fronts) {
        expect(f.box.z + f.box.depth, f.id).toBeLessThanOrEqual(layout.frontZMm);
      }
      for (const door of assembly.pieces.filter((p) => p.partKind === "porta")) {
        // Toda folha fecha NO plano frontal — nem para dentro da caixa,
        // nem para fora do envelope declarado.
        expect(door.box.z, door.id).toBeGreaterThanOrEqual(layout.caseDepthMm - 19);
        expect(door.box.z + door.box.depth, door.id).toBeLessThanOrEqual(size.depthMm + 1);
        expect(door.box.z + door.box.depth, door.id).toBeGreaterThanOrEqual(layout.caseDepthMm - 1);
      }
    });
  }
});
