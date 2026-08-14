import { describe, expect, it } from "vitest";
import {
  buildWardrobe,
  legacyInteriorRecipe,
  normalizeWardrobeSpec,
  refitInteriorPlan,
  resolveWardrobeInterior,
  wardrobeCavity,
  wardrobeSpecFromLegacy,
} from "../index";
import { autoLayout, getInteriorPreset, insertModule, type InteriorPlan } from "../../../interior";
import type { ConstructionBox, ConstructionPiece } from "../../../construction";

/** Roupeiro de referência da etapa: 2400 × 2400 × 600, 3 colunas. */
const REF = {
  widthMm: 2400,
  heightMm: 2400,
  depthMm: 600,
  doors: 3,
  opening: "abrir" as const,
  columns: 3,
  drawers: 3,
  hangers: 2,
  shelvesPerColumn: 2,
  maleiro: true,
};

const metricsOf = (r: ReturnType<typeof buildWardrobe>) => ({
  interiorY0: r.layout.interiorY0,
  interiorHeightMm: r.layout.interiorHeightMm,
  innerWidthMm: r.layout.innerWidthMm,
});

function penetrates(a: ConstructionBox, b: ConstructionBox): boolean {
  const o = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0);
  return (
    o(a.x, a.x + a.width, b.x, b.x + b.width) > 1 &&
    o(a.y, a.y + a.height, b.y, b.y + b.height) > 1 &&
    o(a.z, a.z + a.depth, b.z, b.z + b.depth) > 1
  );
}

describe("Vão interno útil", () => {
  it("desconta laterais, base, tampo, fundo, rodapé e plano das frentes", () => {
    const r = buildWardrobe(REF);
    const c = wardrobeCavity(r.spec, metricsOf(r));
    expect(c.x).toBe(r.spec.thicknessMm);
    expect(c.widthMm).toBe(r.spec.widthMm - 2 * r.spec.thicknessMm);
    expect(c.y).toBe(r.layout.interiorY0);
    expect(c.heightMm).toBe(r.layout.interiorHeightMm);
    expect(c.z).toBe(r.spec.backThicknessMm);
    expect(c.depthMm).toBe(r.spec.depthMm - r.spec.backThicknessMm - r.spec.thicknessMm);
  });

  it("três colunas: divisórias internas e módulos dentro do vão", () => {
    const r = buildWardrobe(REF);
    const c = r.interior.cavity;
    expect(r.spec.columns).toBe(3);
    expect(
      r.interior.plan.placements.filter((p) => p.moduleId === "divisoria-vertical"),
    ).toHaveLength(2);
    for (const p of r.interior.plan.placements) {
      expect(p.box.x).toBeGreaterThanOrEqual(c.x - 1);
      expect(p.box.x + p.box.width).toBeLessThanOrEqual(c.x + c.widthMm + 1);
      expect(p.box.y).toBeGreaterThanOrEqual(c.y - 1);
      expect(p.box.y + p.box.height).toBeLessThanOrEqual(c.y + c.heightMm + 1);
      expect(p.box.z + p.box.depth).toBeLessThanOrEqual(c.z + c.depthMm + 1);
    }
  });
});

describe("Origem do layout", () => {
  it("parâmetros legados viram layout interno (nunca são perdidos)", () => {
    const spec = wardrobeSpecFromLegacy({
      widthMm: 2400,
      heightMm: 2400,
      depthMm: 600,
      params: { "mod:doors": 3, "mod:drawers": 3, "mod:cabideiros": 2, "mod:maleiro": true },
    });
    const r = buildWardrobe(spec);
    expect(r.interior.source).toBe("legado");
    const ids = r.interior.plan.placements.map((p) => p.moduleId);
    expect(ids.filter((i) => i === "gaveta-interna")).toHaveLength(3);
    expect(ids.filter((i) => i === "cabideiro")).toHaveLength(2);
  });

  it("ficha paramétrica nova resolve pelo mesmo caminho", () => {
    const r = buildWardrobe(normalizeWardrobeSpec(REF));
    expect(r.interior.source).toBe("legado");
    expect(r.interior.plan.placements.length).toBeGreaterThan(5);
  });

  it("layout explícito tem prioridade sobre legado e preset", () => {
    const base = buildWardrobe(REF);
    const explicito = insertModule(
      { id: "manual", cavity: base.interior.cavity, placements: [] },
      "prateleira",
      {
        kind: "coordenada",
        at: [base.interior.cavity.x, base.interior.cavity.y + 500, base.interior.cavity.z],
        size: { widthMm: 500, heightMm: 18, depthMm: 400 },
      },
    ).plan;

    const r = buildWardrobe({ ...REF, interior: { plan: explicito, presetId: "closet" } });
    expect(r.interior.source).toBe("explicito");
    expect(r.interior.plan.placements).toHaveLength(1);
  });

  it("preset do usuário é usado quando a ficha não tem interior manual", () => {
    const r = buildWardrobe({
      ...REF,
      drawers: 0,
      hangers: 0,
      shelvesPerColumn: 0,
      niches: 0,
      interior: { presetId: "closet" },
    });
    expect(r.interior.source).toBe("preset-usuario");
    expect(r.interior.recipeId).toBe("closet");
  });

  it("preset automático entra quando não há nada declarado", () => {
    const r = buildWardrobe({ ...REF, drawers: 0, hangers: 0, shelvesPerColumn: 0, niches: 0 });
    expect(r.interior.source).toBe("preset-automatico");
    expect(r.interior.plan.placements.length).toBeGreaterThan(0);
  });

  it("modo preset força o preset mesmo com params legados", () => {
    const r = buildWardrobe({
      ...REF,
      interior: { mode: "preset", presetId: "roupeiro-solteiro" },
    });
    expect(r.interior.source).toBe("preset-usuario");
  });

  it("fallback seguro: vão minúsculo nunca quebra o móvel", () => {
    const r = buildWardrobe({
      widthMm: 600,
      heightMm: 1200,
      depthMm: 300,
      doors: 1,
      drawers: 4,
      hangers: 2,
    });
    expect(r.assembly.pieces.length).toBeGreaterThan(4);
    expect(r.interior.validation.ok).toBe(true);
  });
});

describe("Módulos, colunas e redimensionamento", () => {
  it("distribui gavetas na coluna do gaveteiro", () => {
    const r = buildWardrobe({ ...REF, drawerColumn: 2 });
    const gav = r.interior.plan.placements.filter((p) => p.moduleId === "gaveta-interna");
    expect(gav).toHaveLength(3);
    const xs = new Set(gav.map((p) => Math.round(p.box.x)));
    expect(xs.size).toBe(1);
    expect([...xs][0]).toBeGreaterThan(r.interior.cavity.x + r.interior.cavity.widthMm / 2);
  });

  it("descarta com segurança módulo que não cabe, sem invalidar o plano", () => {
    const cavity = { ...buildWardrobe(REF).interior.cavity, heightMm: 700, depthMm: 300 };
    const r = autoLayout({ cavity, recipe: legacyInteriorRecipe(normalizeWardrobeSpec(REF)) });
    expect(r.validation.ok).toBe(true);
    expect(r.dropped.length).toBeGreaterThan(0);
  });

  it("redimensionar recalcula o interior sem quebrar o móvel", () => {
    for (const widthMm of [1200, 1800, 2400, 3000]) {
      const r = buildWardrobe({ ...REF, widthMm });
      expect(r.interior.validation.ok).toBe(true);
      expect(r.assembly.envelope.width).toBeCloseTo(widthMm, 0);
    }
  });

  it("layout explícito é reancorado proporcionalmente no novo vão", () => {
    const base = buildWardrobe(REF);
    const plan: InteriorPlan = base.interior.plan;
    const maior = { ...base.interior.cavity, widthMm: base.interior.cavity.widthMm * 1.5 };
    const refit = refitInteriorPlan(plan, maior);
    expect(refit.placements).toHaveLength(plan.placements.length);
    for (const p of refit.placements) {
      expect(p.box.x + p.box.width).toBeLessThanOrEqual(maior.x + maior.widthMm + 1);
    }
  });
});

describe("Montagem real (preset → WardrobeMesh)", () => {
  it("o preset chega ao AssemblyMesh como peças e rigs", () => {
    const r = buildWardrobe({
      ...REF,
      drawers: 0,
      hangers: 0,
      shelvesPerColumn: 0,
      interior: { presetId: "roupeiro-casal" },
    });
    expect(getInteriorPreset("roupeiro-casal")).toBeDefined();
    expect(r.assembly.pieces.length).toBeGreaterThan(20);
    expect(r.assembly.motions.some((m) => m.kind === "hinge")).toBe(true);
  });

  it("gaveta interna entra no Motion com rig de corrediça", () => {
    const r = buildWardrobe(REF);
    const gavetas = r.assembly.pieces.filter((p) => p.id.includes("gaveta-interna"));
    expect(gavetas.length).toBeGreaterThan(0);
    const slides = r.assembly.motions.filter(
      (m) => m.kind === "slide" && m.pieceId.includes("gaveta-interna"),
    );
    expect(slides.length).toBeGreaterThan(0);
  });

  it("nenhuma peça interna interpenetra outra", () => {
    const r = buildWardrobe(REF);
    const internas: ConstructionPiece[] = r.assembly.pieces.filter((p) =>
      ["prateleira", "divisoria", "gaveta-base", "gaveta-lateral"].includes(p.partKind),
    );
    for (let i = 0; i < internas.length; i++) {
      for (let j = i + 1; j < internas.length; j++) {
        expect(
          penetrates(internas[i].box, internas[j].box),
          `${internas[i].id} × ${internas[j].id}`,
        ).toBe(false);
      }
    }
  });

  it("nenhuma peça interna atravessa laterais, base, tampo ou fundo", () => {
    const r = buildWardrobe(REF);
    const c = r.interior.cavity;
    for (const p of r.interior.plan.placements) {
      expect(p.box.x).toBeGreaterThanOrEqual(c.x - 1);
      expect(p.box.x + p.box.width).toBeLessThanOrEqual(c.x + c.widthMm + 1);
      expect(p.box.z).toBeGreaterThanOrEqual(c.z - 1);
    }
  });
});

describe("Sem regressão em roupeiros antigos", () => {
  it("roupeiro antigo sem params continua montando", () => {
    const spec = wardrobeSpecFromLegacy({ widthMm: 2000, heightMm: 2200, depthMm: 550 });
    const r = buildWardrobe(spec);
    expect(r.assembly.pieces.length).toBeGreaterThan(5);
    expect(r.assembly.warnings.every((w) => w.code !== "componente-inexistente")).toBe(true);
  });

  it("a ficha original é preservada (nada é sobrescrito)", () => {
    const spec = normalizeWardrobeSpec(REF);
    const r = buildWardrobe(spec);
    expect(r.spec.drawers).toBe(spec.drawers);
    expect(r.spec.hangers).toBe(spec.hangers);
    expect(r.spec.shelvesPerColumn).toBe(spec.shelvesPerColumn);
    expect(r.spec.interior).toBeUndefined();
  });

  it("resolveWardrobeInterior é determinístico", () => {
    const spec = normalizeWardrobeSpec(REF);
    const m = metricsOf(buildWardrobe(spec));
    const a = resolveWardrobeInterior(spec, m);
    const b = resolveWardrobeInterior(spec, m);
    expect(JSON.stringify(a.plan)).toBe(JSON.stringify(b.plan));
  });
});
