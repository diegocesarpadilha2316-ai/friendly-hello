import { describe, expect, it } from "vitest";
import {
  applyWardrobePatch,
  buildWardrobe,
  describeWardrobe,
  isWardrobeSubtype,
  mirroredDoorIndexes,
  normalizeWardrobeSpec,
  wardrobeSpecFromLegacy,
} from "../index";
import type { ConstructionPiece } from "../../../construction";

const doors = (pieces: readonly ConstructionPiece[]) => pieces.filter((p) => p.partKind === "porta");
const kind = (pieces: readonly ConstructionPiece[], k: string) =>
  pieces.filter((p) => p.partKind === k);
const hw = (a: ReturnType<typeof buildWardrobe>["assembly"], k: string) =>
  a.hardware.filter((h) => h.kind === k).reduce((n, h) => n + h.qty, 0);

describe("Família roupeiro — cenários reais", () => {
  it("1) 2,70 × 2,40 × 0,60 · 3 portas de correr · espelho central · maleiro · 2 gavetas · 2 cabideiros", () => {
    const { spec, assembly, layout } = buildWardrobe({
      widthMm: 2700,
      heightMm: 2400,
      depthMm: 600,
      doors: 3,
      opening: "correr",
      maleiro: true,
      drawers: 2,
      hangers: 2,
      mirror: { has: true, position: "central" },
    });

    expect(spec.opening).toBe("correr");
    expect(doors(assembly.pieces)).toHaveLength(3);
    // Espelho apenas na folha central.
    expect(doors(assembly.pieces).filter((p) => p.substrate === "espelho")).toHaveLength(1);
    expect(doors(assembly.pieces)[1].substrate).toBe("espelho");
    // Trilhos separados: nenhuma folha compartilha o mesmo Z da vizinha.
    const zs = doors(assembly.pieces).map((p) => p.box.z);
    expect(new Set(zs).size).toBe(3);
    // Maleiro em roupeiro de correr fica INTERNO (folhas cobrem a altura toda).
    expect(layout.maleiroHeightMm).toBeGreaterThan(0);
    expect(doors(assembly.pieces)[0].box.height).toBeGreaterThan(2000);
    // Interior exatamente como pedido.
    expect(kind(assembly.pieces, "gaveta-lateral")).toHaveLength(4); // 2 gavetas × 2 laterais
    expect(assembly.pieces.filter((p) => p.label.startsWith("Cabideiro"))).toHaveLength(2);
    expect(hw(assembly, "trilho")).toBeGreaterThan(0);
    expect(hw(assembly, "corredica")).toBeGreaterThan(0);
    // Envelope respeita a ficha.
    expect(assembly.envelope.width).toBeCloseTo(2700, 0);
    expect(assembly.envelope.height).toBeLessThanOrEqual(2400);
  });

  it("2) 1,80 m · 2 portas de abrir", () => {
    const { spec, assembly } = buildWardrobe({ widthMm: 1800, doors: 2, opening: "abrir" });
    expect(spec.doors).toBe(2);
    expect(spec.columns).toBe(2);
    const folhas = doors(assembly.pieces);
    expect(folhas).toHaveLength(2);
    // Pivô correto: folha esquerda abre pela esquerda, direita pela direita.
    const m = assembly.motions.filter((x) => x.kind === "hinge");
    expect(m).toHaveLength(2);
    expect(m[0].direction).toBe(1);
    expect(m[1].direction).toBe(-1);
    expect(hw(assembly, "dobradica")).toBeGreaterThanOrEqual(8);
    // Uma divisória entre as duas colunas.
    expect(kind(assembly.pieces, "divisoria")).toHaveLength(1);
  });

  it("3) 3,20 m · 4 portas de abrir · 4 gavetas · nicho central", () => {
    const { spec, assembly } = buildWardrobe({
      widthMm: 3200,
      doors: 4,
      opening: "abrir",
      drawers: 4,
      niches: 1,
    });
    expect(spec.columns).toBe(4);
    expect(doors(assembly.pieces)).toHaveLength(4);
    expect(kind(assembly.pieces, "gaveta-base")).toHaveLength(4);
    // Nicho: laterais próprias + base + topo.
    expect(assembly.pieces.some((p) => (p.notes ?? "").includes("nicho 1"))).toBe(true);
    // Gaveteiro e nicho na mesma coluna não se sobrepõem.
    const gav = assembly.pieces.filter((p) => (p.notes ?? "").includes("gaveta"));
    const nicho = assembly.pieces.filter((p) => (p.notes ?? "").includes("nicho 1"));
    const topoGaveta = Math.max(...gav.map((p) => p.box.y + p.box.height));
    const baseNicho = Math.min(...nicho.map((p) => p.box.y));
    expect(baseNicho).toBeGreaterThan(topoGaveta);
  });

  it("4) sem portas — closet aberto", () => {
    const { spec, assembly } = buildWardrobe({
      widthMm: 2400,
      opening: "sem-porta",
      hangers: 2,
      shelvesPerColumn: 3,
    });
    expect(spec.doors).toBe(0);
    expect(doors(assembly.pieces)).toHaveLength(0);
    expect(assembly.motions.filter((m) => m.kind === "hinge")).toHaveLength(0);
    // Estrutura e interior continuam existindo.
    expect(kind(assembly.pieces, "lateral").length).toBeGreaterThanOrEqual(2);
    expect(kind(assembly.pieces, "prateleira").length).toBeGreaterThan(0);
    expect(hw(assembly, "cabideiro")).toBe(2);
  });

  it("5) alteração cirúrgica de 3 para 4 portas preserva o restante", () => {
    const antes = normalizeWardrobeSpec({
      widthMm: 2700,
      heightMm: 2400,
      depthMm: 600,
      doors: 3,
      opening: "abrir",
      drawers: 3,
      hangers: 2,
      maleiro: true,
      mirror: { has: true, position: "central" },
    });
    const depois = applyWardrobePatch(antes, { doors: 4 });

    expect(depois.doors).toBe(4);
    expect(depois.columns).toBe(4); // colunas acompanham as portas de abrir
    // Tudo o mais intacto.
    const ignore = new Set(["doors", "columns", "drawerColumn"]);
    for (const k of Object.keys(antes) as (keyof typeof antes)[]) {
      if (ignore.has(k)) continue;
      expect(depois[k], k).toEqual(antes[k]);
    }
    expect(doors(buildWardrobe(depois).assembly.pieces)).toHaveLength(4);
  });

  it("6) de correr para abrir preserva interior e dimensões", () => {
    const antes = normalizeWardrobeSpec({
      widthMm: 2700,
      heightMm: 2400,
      depthMm: 600,
      doors: 3,
      opening: "correr",
      drawers: 2,
      hangers: 2,
      shelvesPerColumn: 2,
      niches: 1,
      maleiro: true,
    });
    const depois = applyWardrobePatch(antes, { opening: "abrir" });

    expect(depois.opening).toBe("abrir");
    expect(depois.widthMm).toBe(antes.widthMm);
    expect(depois.heightMm).toBe(antes.heightMm);
    expect(depois.depthMm).toBe(antes.depthMm);
    expect(depois.doors).toBe(antes.doors);
    expect(depois.drawers).toBe(antes.drawers);
    expect(depois.hangers).toBe(antes.hangers);
    expect(depois.shelvesPerColumn).toBe(antes.shelvesPerColumn);
    expect(depois.niches).toBe(antes.niches);
    expect(depois.maleiro).toBe(true);

    const a = buildWardrobe(antes).assembly;
    const b = buildWardrobe(depois).assembly;
    expect(a.motions.every((m) => m.kind !== "hinge")).toBe(true);
    expect(b.motions.filter((m) => m.kind === "hinge")).toHaveLength(3);
    // Interior idêntico em quantidade de peças internas.
    const interior = (x: typeof a) =>
      x.pieces.filter((p) => ["prateleira", "gaveta-base", "divisoria"].includes(p.partKind)).length;
    expect(interior(b)).toBe(interior(a));
  });
});

describe("Compatibilidade com projetos antigos", () => {
  it("reconhece os subtipos da família", () => {
    expect(isWardrobeSubtype("roupeiro")).toBe(true);
    expect(isWardrobeSubtype("guarda-roupa")).toBe(true);
    expect(isWardrobeSubtype("balcao")).toBe(false);
  });

  it("converte params soltos do formato antigo em memória", () => {
    const spec = wardrobeSpecFromLegacy({
      widthMm: 2700,
      heightMm: 2400,
      depthMm: 600,
      params: {
        "mod:doors": 3,
        "mod:opening": "correr",
        "mod:drawers": "2",
        "mod:cabideiros": 2,
        "mod:maleiro": true,
        "mod:mirror": true,
        "mod:mirrorPosition": "central",
        "mod:handle": "cava",
      },
    });
    expect(spec.doors).toBe(3);
    expect(spec.opening).toBe("correr");
    expect(spec.drawers).toBe(2);
    expect(spec.hangers).toBe(2);
    expect(spec.mirror).toEqual({ has: true, position: "central" });
    expect(mirroredDoorIndexes(spec).has(1)).toBe(true);
    expect(() => buildWardrobe(spec)).not.toThrow();
  });

  it("roupeiro antigo sem nenhum param continua abrindo", () => {
    const spec = wardrobeSpecFromLegacy({ widthMm: 2000, heightMm: 2200, depthMm: 550 });
    const { assembly } = buildWardrobe(spec);
    expect(assembly.pieces.length).toBeGreaterThan(5);
    expect(assembly.warnings.every((w) => w.code !== "componente-inexistente")).toBe(true);
    expect(describeWardrobe(spec)).toContain("2000×2200×550 mm");
  });

  it("params fora de faixa não quebram a montagem", () => {
    const { spec, assembly } = buildWardrobe({
      widthMm: -1,
      heightMm: 99999,
      doors: 99,
      drawers: 99,
      opening: "correr",
    });
    expect(spec.widthMm).toBeGreaterThan(0);
    expect(spec.doors).toBeLessThanOrEqual(6);
    expect(assembly.pieces.length).toBeGreaterThan(0);
  });
});
