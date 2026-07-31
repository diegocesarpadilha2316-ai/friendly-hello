import { describe, expect, it } from "vitest";
import { buildDresser, normalizeDresserSpec, dresserSpecFromLegacy } from "../index";
import {
  mechanismGroupId,
  openStatesByPiece,
  resolveInterlock,
  resolveMotion,
  type ConstructionMotion,
} from "../../../construction";
import { resolveFurnitureRenderer } from "../../wardrobe";

const G = mechanismGroupId;

describe("Família gaveteiro — Biblioteca Construtiva", () => {
  it("roteia gaveteiro para o novo pipeline (e não para o legado)", () => {
    for (const s of ["gaveteiro", "Gaveteiro", "cômoda", "dresser"]) {
      expect(resolveFurnitureRenderer({ subtype: s }).renderer).toBe("dresser");
    }
    expect(resolveFurnitureRenderer({ subtype: "estante" }).renderer).toBe("cabinet");
    expect(resolveFurnitureRenderer({ subtype: "roupeiro" }).renderer).toBe("wardrobe");
    expect(
      resolveFurnitureRenderer({ subtype: "modulo", catalogItemId: "mod-gaveteiro-3g" }).renderer,
    ).toBe("dresser");
  });

  it("monta 1 a N gavetas, todas com rig de corrediça", () => {
    for (const n of [1, 2, 3, 6, 8]) {
      const { assembly, spec } = buildDresser({ drawers: n, heightMm: 1400 });
      expect(spec.drawers).toBe(n);
      const fronts = assembly.pieces.filter((p) => p.partKind === "gaveta-frente");
      expect(fronts).toHaveLength(n);
      for (const f of fronts) {
        const m = assembly.motions.find((x) => x.pieceId === f.id);
        expect(m?.kind).toBe("slide");
        expect(m?.axis).toBe("z");
      }
    }
  });

  it("reaproveita os componentes da biblioteca (caixa + corrediça + batente)", () => {
    const { assembly } = buildDresser({ drawers: 3 });
    const kinds = new Set(assembly.pieces.map((p) => p.partKind));
    expect(kinds.has("lateral")).toBe(true);
    expect(kinds.has("tampo")).toBe(true);
    expect(kinds.has("gaveta-lateral")).toBe(true);
    expect(assembly.hardware.some((h) => h.kind === "corredica")).toBe(true);
    expect(assembly.hardware.some((h) => h.kind === "puxador")).toBe(true);
  });

  it("é paramétrico em largura, altura e profundidade", () => {
    const a = buildDresser({ widthMm: 400, heightMm: 700, depthMm: 400, drawers: 3 });
    const b = buildDresser({ widthMm: 1200, heightMm: 1100, depthMm: 600, drawers: 3 });
    expect(a.assembly.envelope.width).toBeLessThan(b.assembly.envelope.width);
    expect(a.assembly.envelope.height).toBeLessThan(b.assembly.envelope.height);
    expect(b.assembly.envelope.width).toBeLessThanOrEqual(1200 + 1);
  });

  it("frente sobreposta cobre a largura total; embutida fica entre as laterais", () => {
    const over = buildDresser({ front: "sobreposta", widthMm: 800, drawers: 3 });
    const inset = buildDresser({ front: "embutida", widthMm: 800, drawers: 3 });
    const w = (r: typeof over) =>
      r.assembly.pieces.filter((p) => p.partKind === "gaveta-frente")[0].box.width;
    expect(w(over)).toBe(800);
    expect(w(inset)).toBeLessThan(800);
  });

  it("nenhuma gaveta invade a outra (fechadas e abertas)", () => {
    const { assembly } = buildDresser({ drawers: 5, heightMm: 1200 });
    const motionByPiece = new Map<string, ConstructionMotion>();
    for (const m of assembly.motions) motionByPiece.set(m.pieceId, m);
    const fronts = assembly.pieces.filter((p) => p.partKind === "gaveta-frente");

    for (const state of [0, 0.5, 1]) {
      const spans = fronts.map((f) => {
        const m = motionByPiece.get(f.id)!;
        const t = resolveMotion(m, state);
        return {
          id: f.id,
          y0: f.box.y + t.translate[1],
          y1: f.box.y + f.box.height + t.translate[1],
        };
      });
      for (let i = 0; i < spans.length; i++) {
        for (let j = i + 1; j < spans.length; j++) {
          const o = Math.min(spans[i].y1, spans[j].y1) - Math.max(spans[i].y0, spans[j].y0);
          expect(o).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });

  it("nenhuma frente atravessa o corpo: fechada, a frente fica à frente do tampo", () => {
    const { assembly, spec } = buildDresser({ drawers: 4, depthMm: 500 });
    const tampo = assembly.pieces.find((p) => p.partKind === "tampo")!;
    for (const f of assembly.pieces.filter((p) => p.partKind === "gaveta-frente")) {
      expect(f.box.z).toBeGreaterThanOrEqual(tampo.box.z + tampo.box.depth - 30);
      expect(f.box.z + f.box.depth).toBeLessThanOrEqual(spec.depthMm + 12);
    }
  });

  it("abrir e fechar gavetas usa a mesma ponte de comandos do roupeiro", () => {
    const { assembly } = buildDresser({ drawers: 3 });
    const open = openStatesByPiece(assembly.pieces, { openDrawers: true });
    const drawers = assembly.pieces.filter((p) => p.partKind.startsWith("gaveta"));
    for (const d of drawers) expect(open[d.id]).toBe(1);

    const r = resolveInterlock({ pieces: assembly.pieces, motions: assembly.motions, desired: open });
    // Gaveteiro não tem frente cobrindo: nada é bloqueado.
    expect(r.blocked).toHaveLength(0);
    for (const d of drawers) expect(r.allowed[d.id]).toBe(1);

    const closed = openStatesByPiece(assembly.pieces, { openDrawers: false });
    const rc = resolveInterlock({
      pieces: assembly.pieces,
      motions: assembly.motions,
      desired: closed,
      current: open,
    });
    for (const d of drawers) expect(rc.allowed[d.id]).toBe(0);
  });

  it("todas as peças de uma gaveta pertencem ao mesmo grupo de mecanismo", () => {
    const { assembly } = buildDresser({ drawers: 3 });
    const groups = new Set(
      assembly.pieces.filter((p) => p.partKind.startsWith("gaveta")).map((p) => G(p.id)),
    );
    expect(groups.size).toBe(3);
  });

  it("converte gaveteiro legado (params soltos) sem perder informação", () => {
    const spec = dresserSpecFromLegacy({
      widthMm: 600,
      heightMm: 900,
      depthMm: 500,
      params: { "mod:drawers": "5", "mod:handle": "cava", "eng:plinthHeightMm": 120 },
    });
    expect(spec.drawers).toBe(5);
    expect(spec.handle).toBe("cava");
    expect(spec.plinthHeightMm).toBe(120);
  });

  it("normalização nunca lança e mantém pelo menos uma gaveta", () => {
    const s = normalizeDresserSpec({ drawers: -3, heightMm: 10, widthMm: NaN });
    expect(s.drawers).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(s.widthMm)).toBe(true);
  });

  it("é determinístico: mesma ficha, mesma montagem", () => {
    const a = JSON.stringify(buildDresser({ drawers: 4 }).assembly.pieces);
    const b = JSON.stringify(buildDresser({ drawers: 4 }).assembly.pieces);
    expect(a).toBe(b);
  });
});