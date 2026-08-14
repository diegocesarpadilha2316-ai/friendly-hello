import { describe, expect, it } from "vitest";
import {
  buildKitchenModule,
  kitchenGeometry,
  kitchenSpecFromLegacy,
  normalizeKitchenModule,
  planKitchen,
  splitRun,
  validateKitchenLayout,
  KITCHEN_DEFAULT_CONFIG,
  KITCHEN_MODULE_KINDS,
} from "../index";
import { resolveFurnitureRenderer } from "../../wardrobe";

const EPS = 1.5;

describe("Família cozinha — módulos", () => {
  it("monta todos os módulos do catálogo sem lançar", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const r = buildKitchenModule({ kind });
      expect(r.assembly.pieces.length, kind).toBeGreaterThan(0);
      expect(r.assembly.totals.boardAreaM2, kind).toBeGreaterThan(0);
    }
  });

  it("mantém todas as peças dentro do envelope declarado", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const r = buildKitchenModule({ kind });
      const { widthMm: W, heightMm: H, depthMm: D } = r.spec;
      for (const p of r.assembly.pieces) {
        expect(p.box.x, `${kind}/${p.id} x`).toBeGreaterThanOrEqual(-60);
        expect(p.box.x + p.box.width, `${kind}/${p.id} largura`).toBeLessThanOrEqual(W + 60);
        expect(p.box.y, `${kind}/${p.id} y`).toBeGreaterThanOrEqual(-EPS);
        expect(p.box.y + p.box.height, `${kind}/${p.id} altura`).toBeLessThanOrEqual(H + 120);
        expect(p.box.z + p.box.depth, `${kind}/${p.id} prof.`).toBeLessThanOrEqual(D + 60);
      }
    }
  });

  it("desconta rodapé e bancada da altura da caixa", () => {
    const spec = normalizeKitchenModule({ kind: "balcao", heightMm: 900 });
    const g = kitchenGeometry(spec);
    expect(g.plinthHeightMm).toBe(100);
    expect(g.countertopThicknessMm).toBe(20);
    expect(g.caseY0 + g.caseHeightMm + g.countertopThicknessMm).toBeCloseTo(900, 0);
  });

  it("recua a caixa para a porta não atravessar a lateral", () => {
    const spec = normalizeKitchenModule({ kind: "balcao", depthMm: 600 });
    const g = kitchenGeometry(spec);
    expect(g.caseDepthMm).toBe(600 - spec.thicknessMm);
    expect(g.frontZMm).toBe(g.caseDepthMm);
  });

  it("usa duas folhas a partir de 700 mm", () => {
    expect(normalizeKitchenModule({ kind: "balcao", widthMm: 600 }).doors).toBe(1);
    expect(normalizeKitchenModule({ kind: "balcao", widthMm: 800 }).doors).toBe(2);
  });

  it("aplica tampo de pedra com saliência e recorte de cuba", () => {
    const r = buildKitchenModule({ kind: "balcao-pia", countertop: { material: "quartzo" } });
    const top = r.assembly.pieces.find((p) => p.notes?.includes("bancada"));
    expect(top).toBeDefined();
    expect(r.spec.countertop.thicknessMm).toBe(20);
    expect(r.assembly.hardware.some((h) => h.notes?.includes("recorte de cuba"))).toBe(true);
  });

  it("balcão sem tampo não gera bancada", () => {
    const r = buildKitchenModule({ kind: "balcao", countertop: { material: "nenhum" } });
    expect(r.spec.countertop.material).toBe("nenhum");
    expect(r.assembly.pieces.some((p) => p.notes?.includes("bancada"))).toBe(false);
  });

  it("rodapé recuado altera altura e recuo", () => {
    const r = buildKitchenModule({ kind: "balcao", plinth: { kind: "recuado" } });
    expect(r.spec.plinth.heightMm).toBe(150);
    expect(r.spec.plinth.recessMm).toBe(90);
  });

  it("basculante recebe pistão a gás e abre pelo topo", () => {
    const r = buildKitchenModule({ kind: "aereo-basculante" });
    expect(r.assembly.hardware.some((h) => h.kind === "pistao")).toBe(true);
    expect(r.assembly.motions.some((m) => m.kind === "hinge" || m.kind === "lift")).toBe(true);
  });

  it("gaveteiro devolve rigs de deslizamento e corrediças", () => {
    const r = buildKitchenModule({ kind: "gaveteiro", drawers: 4 });
    expect(r.assembly.motions.filter((m) => m.kind === "slide").length).toBeGreaterThan(0);
    expect(r.assembly.hardware.some((h) => h.kind === "corredica")).toBe(true);
  });

  it("torre quente cria nichos de forno e micro-ondas", () => {
    const r = buildKitchenModule({ kind: "torre-quente", heightMm: 2200 });
    const notes = r.assembly.pieces.map((p) => p.notes ?? "").join(" ");
    expect(notes).toContain("nicho do forno");
    expect(notes).toContain("nicho do micro-ondas");
  });

  it("canto mágico traz o mecanismo articulado", () => {
    const r = buildKitchenModule({ kind: "canto-magico" });
    expect(r.assembly.hardware.some((h) => h.itemId === "kessebohmer-magic-corner")).toBe(true);
  });

  it("cristaleira usa frente de vidro", () => {
    const r = buildKitchenModule({ kind: "cristaleira" });
    expect(r.spec.glassFront).toBe(true);
    expect(r.assembly.pieces.some((p) => p.substrate === "vidro")).toBe(true);
  });

  it("converte módulo antigo com pia em balcão de pia", () => {
    const spec = kitchenSpecFromLegacy({
      subtype: "balcao",
      widthMm: 1200,
      heightMm: 900,
      depthMm: 600,
      params: { hasSink: true, "mod:handle": "cava", "mod:countertop": "porcelanato" },
    });
    expect(spec.kind).toBe("balcao-pia");
    expect(spec.countertop.material).toBe("porcelanato");
    expect(spec.handle).toBe("cava");
  });

  it("rotea módulos de cozinha para o renderer da família", () => {
    expect(resolveFurnitureRenderer({ subtype: "balcão" }).renderer).toBe("kitchen");
    expect(resolveFurnitureRenderer({ subtype: "Aéreo" }).renderer).toBe("kitchen");
    expect(resolveFurnitureRenderer({ subtype: "gaveteiro" }).renderer).toBe("dresser");
    expect(resolveFurnitureRenderer({ subtype: "roupeiro" }).renderer).toBe("wardrobe");
  });
});

describe("Kitchen Layout Engine", () => {
  it("divide um trecho livre em módulos legais", () => {
    for (const L of [1200, 2350, 3000, 4870]) {
      const parts = splitRun(L, KITCHEN_DEFAULT_CONFIG);
      expect(
        parts.reduce((a, b) => a + b, 0),
        String(L),
      ).toBe(L);
      for (const w of parts) {
        expect(w, `${L} → ${w}`).toBeGreaterThanOrEqual(KITCHEN_DEFAULT_CONFIG.minModuleWidthMm);
        expect(w).toBeLessThanOrEqual(KITCHEN_DEFAULT_CONFIG.maxModuleWidthMm);
      }
    }
  });

  it("cozinha reta: distribui balcões, aéreos e bancada contínua", () => {
    const result = planKitchen({
      shape: "reta",
      walls: [
        {
          id: "p1",
          lengthMm: 3600,
          heightMm: 2700,
          fixtures: [
            { id: "gel", kind: "geladeira", atMm: 0, widthMm: 800 },
            { id: "pia", kind: "pia", atMm: 1000, widthMm: 1200 },
            { id: "ck", kind: "cooktop", atMm: 2600, widthMm: 800 },
          ],
        },
      ],
    });
    expect(result.totals.baseCount).toBeGreaterThan(0);
    expect(result.totals.upperCount).toBeGreaterThan(0);
    expect(result.placements.some((p) => p.kind === "balcao-pia")).toBe(true);
    expect(result.placements.some((p) => p.kind === "balcao-cooktop")).toBe(true);
    expect(result.placements.some((p) => p.kind === "torre-geladeira")).toBe(true);
    expect(result.totals.countertopLengthMm).toBeGreaterThan(1000);
    expect(validateKitchenLayout(result).ok).toBe(true);
  });

  it("nenhum aéreo sobre janela, porta ou geladeira", () => {
    const result = planKitchen({
      shape: "reta",
      walls: [
        {
          id: "p1",
          lengthMm: 4000,
          fixtures: [
            { id: "jan", kind: "janela", atMm: 1500, widthMm: 1200 },
            { id: "gel", kind: "geladeira", atMm: 0, widthMm: 800 },
          ],
        },
      ],
    });
    const uppers = result.placements.filter((p) => p.level === "superior");
    for (const u of uppers) {
      const overJanela = u.xMm < 2700 && u.xMm + u.widthMm > 1500;
      const overGeladeira = u.xMm < 800;
      expect(overJanela, u.id).toBe(false);
      expect(overGeladeira, u.id).toBe(false);
    }
  });

  it("cozinha em L: cada parede recebe seu canto e não há colisão", () => {
    const result = planKitchen({
      shape: "L",
      walls: [
        {
          id: "a",
          lengthMm: 3200,
          cornerEnd: true,
          fixtures: [{ id: "pia", kind: "pia", atMm: 600 }],
        },
        {
          id: "b",
          lengthMm: 2400,
          cornerStart: true,
          fixtures: [{ id: "ck", kind: "cooktop", atMm: 1200 }],
        },
      ],
    });
    // o canto tem UM dono; a outra parede apenas reserva o retorno
    expect(result.placements.filter((p) => p.kind.startsWith("canto"))).toHaveLength(1);
    expect(result.reservations.some((x) => x.kind === "retorno-de-canto")).toBe(true);
    const v = validateKitchenLayout(result);
    expect(v.errors, JSON.stringify(v.errors)).toHaveLength(0);
  });

  it("ilha com cooktop e cuba vira módulos reais com bancada", () => {
    const result = planKitchen({
      shape: "ilha",
      walls: [{ id: "p1", lengthMm: 3000 }],
      island: { lengthMm: 2400, depthMm: 900, hasCooktop: true, hasSink: true },
    });
    const island = result.placements.filter((p) => p.wallId === "ilha");
    expect(island.length).toBeGreaterThan(1);
    expect(island.some((p) => p.kind === "balcao-cooktop")).toBe(true);
    expect(result.countertopRuns.some((r) => r.wallId === "ilha")).toBe(true);
  });

  it("aparelho maior que a parede é descartado com erro", () => {
    const result = planKitchen({
      shape: "reta",
      walls: [
        {
          id: "p1",
          lengthMm: 1000,
          fixtures: [{ id: "pia", kind: "pia", atMm: 200, widthMm: 1200 }],
        },
      ],
    });
    expect(result.dropped.length).toBeGreaterThan(0);
    expect(validateKitchenLayout(result).ok).toBe(false);
  });

  it("todo módulo planejado é montável pela biblioteca", () => {
    const result = planKitchen({
      shape: "L",
      walls: [
        {
          id: "a",
          lengthMm: 3400,
          cornerEnd: true,
          fixtures: [{ id: "pia", kind: "pia", atMm: 700 }],
        },
        {
          id: "b",
          lengthMm: 2600,
          cornerStart: true,
          fixtures: [{ id: "tq", kind: "torre-quente", atMm: 1800 }],
        },
      ],
    });
    for (const p of result.placements) {
      const built = buildKitchenModule(p.spec);
      expect(built.assembly.pieces.length, p.id).toBeGreaterThan(0);
    }
  });
});
