import { describe, expect, it } from "vitest";
import {
  INTERIOR_MODULES,
  INTERIOR_PRESETS,
  autoLayout,
  boxOverlap,
  buildInteriorAssembly,
  duplicateModule,
  getInteriorModule,
  getInteriorPreset,
  insertModule,
  interiorModuleCount,
  interiorPlanToSlots,
  listInteriorModules,
  moveModule,
  pickPreset,
  registerInteriorModule,
  removeModule,
  resizeModule,
  resolveInteriorBox,
  splitCavityColumns,
  splitCavityRows,
  swapModules,
  unregisterInteriorModule,
  validateInteriorPlan,
  type InteriorCavity,
  type InteriorModuleDef,
  type InteriorPlan,
} from "../index";

const cavity: InteriorCavity = {
  id: "vao",
  x: 0,
  y: 0,
  z: 0,
  widthMm: 2200,
  heightMm: 2400,
  depthMm: 550,
};

const emptyPlan: InteriorPlan = { id: "plano", cavity, placements: [] };

describe("Catálogo e registro", () => {
  it("expõe os módulos internos registrados", () => {
    expect(INTERIOR_MODULES.length).toBeGreaterThanOrEqual(19);
    expect(interiorModuleCount()).toBe(INTERIOR_MODULES.length);
    for (const id of [
      "prateleira",
      "cabideiro",
      "sapateira",
      "maleiro",
      "gaveta-interna",
      "adega",
    ]) {
      expect(getInteriorModule(id)).toBeDefined();
    }
  });

  it("todo módulo declara ficha completa e resolve para componentes existentes", () => {
    for (const m of INTERIOR_MODULES) {
      expect(m.name.length).toBeGreaterThan(2);
      expect(m.min.widthMm).toBeLessThanOrEqual(m.max.widthMm);
      expect(m.min.heightMm).toBeLessThanOrEqual(m.max.heightMm);
      expect(m.min.depthMm).toBeLessThanOrEqual(m.max.depthMm);
      expect(m.parts.length).toBeGreaterThan(0);
      expect(m.families.length).toBeGreaterThan(0);
    }
  });

  it("filtra por categoria e família", () => {
    expect(listInteriorModules({ category: "penduracao" }).length).toBeGreaterThan(0);
    expect(listInteriorModules({ family: "cristaleira" }).some((m) => m.id === "adega")).toBe(true);
    expect(listInteriorModules({ query: "gaveta" }).length).toBeGreaterThan(0);
  });

  it("aceita um módulo novo sem tocar no núcleo", () => {
    const custom: InteriorModuleDef = {
      ...getInteriorModule("prateleira")!,
      id: "prateleira-teste",
      name: "Prateleira de teste",
    };
    registerInteriorModule(custom);
    expect(getInteriorModule("prateleira-teste")).toBeDefined();

    const r = insertModule(emptyPlan, "prateleira-teste", {
      kind: "coordenada",
      at: [0, 800, 0],
      size: { widthMm: 600, heightMm: 18, depthMm: 500 },
    });
    expect(r.applied).toBe(true);
    expect(interiorPlanToSlots(r.plan)[0].component).toBe("prateleira");
    unregisterInteriorModule("prateleira-teste");
  });
});

describe("Posicionamento", () => {
  it("posiciona por coluna, linha, nicho, vão e coordenada", () => {
    const def = getInteriorModule("prateleira")!;
    const col = resolveInteriorBox(cavity, def, { kind: "coluna", index: 1, of: 4 }).box;
    expect(col.x).toBeCloseTo(550, 0);
    expect(col.width).toBeCloseTo(550, 0);

    const row = resolveInteriorBox(cavity, def, { kind: "linha", index: 2, of: 4 }).box;
    expect(row.y).toBeCloseTo(1200, 0);

    const niches = splitCavityColumns(cavity, 2);
    const nicho = resolveInteriorBox(
      cavity,
      def,
      { kind: "nicho", nicheId: niches[1].id },
      { niches },
    ).box;
    expect(nicho.x).toBeCloseTo(1100, 0);

    const vao = resolveInteriorBox(cavity, def, { kind: "vao", fromYMm: 400, toYMm: 418 }).box;
    expect(vao.y).toBe(400);
    expect(vao.height).toBe(18);

    const coord = resolveInteriorBox(cavity, def, {
      kind: "coordenada",
      at: [100, 900, 0],
      size: { widthMm: 400, heightMm: 18, depthMm: 500 },
    }).box;
    expect([coord.x, coord.y, coord.width]).toEqual([100, 900, 400]);
  });

  it("respeita ancoragem de topo do maleiro", () => {
    const def = getInteriorModule("maleiro")!;
    const b = resolveInteriorBox(cavity, def, { kind: "vao", fromYMm: 0, toYMm: 400 }).box;
    expect(b.y + b.height).toBeCloseTo(cavity.heightMm, 0);
  });

  it("limita dimensões fora do intervalo do módulo", () => {
    const def = getInteriorModule("gaveta-interna")!;
    const r = resolveInteriorBox(cavity, def, { kind: "vao", fromYMm: 0, toYMm: 2000 });
    expect(r.box.height).toBe(def.max.heightMm);
    expect(r.warnings.some((w) => w.code === "dimensao-ajustada")).toBe(true);
  });

  it("divide o vão em colunas e linhas coerentes", () => {
    const cols = splitCavityColumns(cavity, 3);
    expect(cols).toHaveLength(3);
    expect(cols[2].x + cols[2].widthMm).toBeCloseTo(cavity.widthMm, 0);
    const rows = splitCavityRows(cavity, 4);
    expect(rows[3].y + rows[3].heightMm).toBeCloseTo(cavity.heightMm, 0);
  });
});

describe("Validador estrutural", () => {
  it("detecta colisão entre módulos", () => {
    const a = insertModule(emptyPlan, "prateleira", {
      kind: "coordenada",
      at: [0, 1000, 0],
      size: { widthMm: 600, heightMm: 18, depthMm: 500 },
    });
    expect(a.applied).toBe(true);
    const b = insertModule(a.plan, "prateleira", {
      kind: "coordenada",
      at: [0, 1005, 0],
      size: { widthMm: 600, heightMm: 18, depthMm: 500 },
    });
    expect(b.applied).toBe(false);
    expect(b.validation.errors.some((e) => e.code === "colisao")).toBe(true);
  });

  it("peças que apenas se encostam não são colisão", () => {
    const a = { x: 0, y: 0, z: 0, width: 100, height: 100, depth: 100 };
    const b = { x: 100, y: 0, z: 0, width: 100, height: 100, depth: 100 };
    expect(boxOverlap(a, b)).toBe(0);
  });

  it("rejeita módulo fora do vão e medida impossível", () => {
    const fora: InteriorPlan = {
      ...emptyPlan,
      placements: [
        {
          id: "p1",
          moduleId: "prateleira",
          box: { x: 2000, y: 0, z: 0, width: 600, height: 18, depth: 500 },
          origin: "manual",
        },
      ],
    };
    expect(validateInteriorPlan(fora).errors.some((e) => e.code === "fora-do-vao")).toBe(true);

    const impossivel: InteriorPlan = {
      ...emptyPlan,
      placements: [
        {
          id: "p1",
          moduleId: "gaveta-interna",
          box: { x: 0, y: 0, z: 0, width: 600, height: 180, depth: 120 },
          origin: "manual",
        },
      ],
    };
    const v = validateInteriorPlan(impossivel);
    expect(v.ok).toBe(false);
    expect(v.errors.map((e) => e.code)).toContain("fora-dos-limites");
  });

  it("aplica as regras próprias do módulo (cabideiro precisa de altura e profundidade)", () => {
    const baixo: InteriorPlan = {
      ...emptyPlan,
      placements: [
        {
          id: "p1",
          moduleId: "cabideiro",
          box: { x: 0, y: 0, z: 0, width: 900, height: 900, depth: 380 },
          origin: "manual",
        },
      ],
    };
    const v = validateInteriorPlan(baixo);
    expect(v.errors.some((e) => e.code === "profundidade-minima")).toBe(true);
  });

  it("respeita o limite de instâncias por vão", () => {
    const placements = [0, 1, 2].map((i) => ({
      id: `c${i}`,
      moduleId: "cabideiro",
      box: { x: 0, y: i * 800, z: 0, width: 900, height: 780, depth: 500 },
      origin: "manual" as const,
    }));
    const v = validateInteriorPlan({ ...emptyPlan, placements });
    expect(v.errors.some((e) => e.code === "limite-instancias")).toBe(true);
  });
});

describe("Layout Engine", () => {
  it("monta um roupeiro casal automaticamente e sem colisões", () => {
    const r = autoLayout({ cavity, recipe: getInteriorPreset("roupeiro-casal")! });
    expect(r.validation.ok).toBe(true);
    expect(r.plan.placements.length).toBeGreaterThan(8);
    const ids = new Set(r.plan.placements.map((p) => p.moduleId));
    for (const expected of ["maleiro", "cabideiro", "prateleira", "gaveta-interna", "sapateira"]) {
      expect(ids.has(expected)).toBe(true);
    }
    expect(ids.has("divisoria-vertical")).toBe(true);
  });

  it("nenhum módulo do auto layout ultrapassa o vão", () => {
    const r = autoLayout({ cavity, recipe: getInteriorPreset("roupeiro-casal")! });
    for (const p of r.plan.placements) {
      expect(p.box.x).toBeGreaterThanOrEqual(-1);
      expect(p.box.x + p.box.width).toBeLessThanOrEqual(cavity.widthMm + 1);
      expect(p.box.y + p.box.height).toBeLessThanOrEqual(cavity.heightMm + 1);
    }
  });

  it("descarta faixas que não cabem em vão apertado, sem gerar plano inválido", () => {
    const pequeno: InteriorCavity = { ...cavity, widthMm: 700, heightMm: 900, depthMm: 450 };
    const r = autoLayout({ cavity: pequeno, recipe: getInteriorPreset("roupeiro-casal")! });
    expect(r.validation.ok).toBe(true);
    expect(r.dropped.length).toBeGreaterThan(0);
  });

  it("todos os presets geram planos válidos", () => {
    for (const preset of INTERIOR_PRESETS) {
      const r = autoLayout({ cavity, recipe: preset });
      expect(r.validation.errors, `${preset.id}: ${JSON.stringify(r.validation.errors)}`).toEqual(
        [],
      );
      expect(r.plan.placements.length).toBeGreaterThan(0);
    }
  });

  it("escolhe preset por família e largura", () => {
    expect(pickPreset("roupeiro", cavity).id).toBe("roupeiro-casal");
    expect(pickPreset("roupeiro", { ...cavity, widthMm: 900 }).id).toBe("roupeiro-solteiro");
    expect(pickPreset("cristaleira", cavity).id).toBe("cristaleira");
  });
});

describe("Editor de módulos", () => {
  const base = autoLayout({
    cavity,
    recipe: {
      id: "teste",
      label: "Teste",
      families: ["roupeiro"],
      dividers: false,
      columns: [{ bands: [{ module: "prateleira", heightMm: 400, repeat: 4 }] }],
    },
  }).plan;

  it("insere, remove e duplica", () => {
    const ins = insertModule(base, "nicho", {
      kind: "coordenada",
      at: [0, 1800, 0],
      size: { widthMm: 500, heightMm: 400, depthMm: 400 },
    });
    expect(ins.applied).toBe(true);
    expect(ins.plan.placements).toHaveLength(base.placements.length + 1);

    const dup = duplicateModule(ins.plan, ins.plan.placements.at(-1)!.id, [600, 0, 0]);
    expect(dup.applied).toBe(true);

    const rem = removeModule(dup.plan, dup.plan.placements.at(-1)!.id);
    expect(rem.applied).toBe(true);
    expect(rem.plan.placements).toHaveLength(ins.plan.placements.length);
  });

  it("rejeita duplicação que causa sobreposição", () => {
    const dup = duplicateModule(base, base.placements[0].id, [0, 0, 0]);
    expect(dup.applied).toBe(false);
    expect(dup.plan).toBe(base);
  });

  it("move e rejeita movimento para fora do vão", () => {
    const ok = moveModule(base, base.placements[0].id, [0, 30, 0]);
    expect(ok.applied).toBe(true);
    const fora = moveModule(base, base.placements[0].id, [0, 5000, 0]);
    expect(fora.applied).toBe(false);
  });

  it("redimensiona dentro dos limites do módulo", () => {
    const r = resizeModule(base, base.placements[0].id, { widthMm: 5000 });
    expect(r.applied).toBe(true);
    expect(r.plan.placements[0].box.width).toBe(getInteriorModule("prateleira")!.max.widthMm);
  });

  it("troca a posição de dois módulos", () => {
    const [a, b] = base.placements;
    const r = swapModules(base, a.id, b.id);
    expect(r.applied).toBe(true);
    const na = r.plan.placements.find((p) => p.id === a.id)!;
    expect(na.box.y).toBe(b.box.y);
  });
});

describe("Composição na Biblioteca Construtiva", () => {
  it("converte o plano em slots e monta peças reais", () => {
    const r = autoLayout({ cavity, recipe: getInteriorPreset("closet")! });
    const slots = interiorPlanToSlots(r.plan);
    expect(slots.length).toBeGreaterThanOrEqual(r.plan.placements.length);

    const assembly = buildInteriorAssembly(r.plan, { label: "Interior closet" });
    expect(assembly.pieces.length).toBeGreaterThan(10);
    expect(assembly.totals.boardAreaM2).toBeGreaterThan(0);
    // Gavetas do interior mantêm o rig de corrediça da biblioteca.
    expect(assembly.motions.some((m) => m.kind === "slide")).toBe(true);
  });

  it("as peças montadas permanecem dentro do envelope do vão", () => {
    const r = autoLayout({ cavity, recipe: getInteriorPreset("roupeiro-casal")! });
    const assembly = buildInteriorAssembly(r.plan);
    for (const piece of assembly.pieces) {
      expect(piece.box.x).toBeGreaterThanOrEqual(-30);
      expect(piece.box.x + piece.box.width).toBeLessThanOrEqual(cavity.widthMm + 30);
      expect(piece.box.y + piece.box.height).toBeLessThanOrEqual(cavity.heightMm + 30);
    }
  });
});
