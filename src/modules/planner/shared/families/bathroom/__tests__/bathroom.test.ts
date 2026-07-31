import { describe, expect, it } from "vitest";
import {
  bathroomFromLegacy,
  bathroomReservationConflicts,
  buildBathroomModule,
  isBathroomFurniture,
  normalizeBathroomModule,
  planBathroomLayout,
  validateBathroomModule,
  BATHROOM_MODULE_KINDS,
  BATHROOM_PRESETS,
  pickBathroomPreset,
  siphonSpansMm,
} from "../index";
import { resolveFurnitureRenderer } from "../../wardrobe/detect";
import { buildKitchenModule } from "../../kitchen";
import { buildWardrobe } from "../../wardrobe";
import { buildDresser } from "../../dresser";

const has = (r: ReturnType<typeof buildBathroomModule>, re: RegExp) =>
  r.assembly.pieces.some((p) => re.test(p.id) || re.test(p.partKind));

describe("banheiro — módulos básicos", () => {
  for (const kind of BATHROOM_MODULE_KINDS) {
    it(`monta ${kind} sem erro estrutural`, () => {
      const r = buildBathroomModule({ kind });
      expect(r.assembly.pieces.length).toBeGreaterThan(0);
      const v = validateBathroomModule(r);
      expect(v.issues.filter((i) => i.level === "erro")).toEqual([]);
    });
  }

  it("gabinete de 2 portas emite 2 portas com rig", () => {
    const r = buildBathroomModule({ kind: "gabinete-2-portas", widthMm: 900 });
    const doors = r.assembly.pieces.filter((p) => p.partKind === "porta");
    expect(doors).toHaveLength(2);
    expect(r.assembly.motions.filter((m) => doors.some((d) => d.id === m.pieceId))).toHaveLength(2);
  });

  it("gabinete com gavetão emite uma única gaveta", () => {
    const r = buildBathroomModule({ kind: "gabinete-gavetao", sink: { type: "nenhuma" } });
    const fronts = r.assembly.pieces.filter((p) => p.partKind === "gaveta-frente");
    expect(fronts.length).toBe(1);
  });
});

describe("banheiro — instalação", () => {
  it("suspenso mantém todas as peças acima do piso", () => {
    const r = buildBathroomModule({ kind: "gabinete-suspenso", install: "suspenso", floorGapMm: 300 });
    expect(r.layout.floorGapMm).toBe(300);
    expect(Math.min(...r.assembly.pieces.map((p) => p.box.y))).toBeGreaterThanOrEqual(300);
    expect(r.assembly.hardware.some((h) => h.id === "ancoragem")).toBe(true);
  });

  it("apoiado no piso não deixa volume livre inferior", () => {
    const r = buildBathroomModule({ kind: "gabinete-piso", install: "rodape" });
    expect(r.layout.floorGapMm).toBe(0);
    expect(Math.min(...r.assembly.pieces.map((p) => p.box.y))).toBe(0);
  });

  it("com pés registra ferragem e altura", () => {
    const r = buildBathroomModule({ kind: "gabinete-1-porta", install: "pes", feetHeightMm: 120 });
    expect(r.layout.floorGapMm).toBe(120);
    expect(r.assembly.hardware.some((h) => h.id === "pes")).toBe(true);
  });
});

describe("banheiro — cubas e volumes hidráulicos", () => {
  it("cuba central reserva sifão no centro", () => {
    const r = buildBathroomModule({ kind: "cuba-central", widthMm: 900 });
    const sif = r.reservations.find((x) => x.kind === "sifao")!;
    expect(sif).toBeTruthy();
    expect(sif.box.x + sif.box.width / 2).toBeCloseTo(450, 0);
  });

  it("cuba deslocada move a reserva para a esquerda", () => {
    const r = buildBathroomModule({ kind: "cuba-deslocada", widthMm: 1200 });
    const sif = r.reservations.find((x) => x.kind === "sifao")!;
    expect(sif.box.x + sif.box.width / 2).toBeLessThan(600);
  });

  it("cuba dupla gera duas reservas de sifão", () => {
    const r = buildBathroomModule({ kind: "cuba-dupla", widthMm: 1600 });
    expect(r.reservations.filter((x) => x.kind === "sifao")).toHaveLength(2);
    expect(siphonSpansMm(r.spec)).toHaveLength(2);
  });

  it("nenhuma peça invade volume hidráulico", () => {
    for (const kind of ["cuba-central", "cuba-deslocada", "cuba-dupla", "gabinete-gavetas"] as const) {
      const r = buildBathroomModule({ kind, widthMm: 1200 });
      expect(bathroomReservationConflicts(r)).toEqual([]);
    }
  });

  it("fundo é recortado quando existe reserva hidráulica", () => {
    const r = buildBathroomModule({ kind: "cuba-central", widthMm: 900 });
    const fundos = r.assembly.pieces.filter((p) => p.partKind === "fundo");
    expect(fundos.length).toBeGreaterThan(1);
    expect(r.decisions.some((d) => d.action === "fundo-recortado")).toBe(true);
  });

  it("prateleira incompatível com sifão é removida com motivo", () => {
    const r = buildBathroomModule({
      kind: "gabinete-2-portas",
      widthMm: 800,
      heightMm: 600,
      shelves: 2,
      sink: { type: "embutir", hydraulicHeightMm: 600 },
    });
    expect(r.decisions.some((d) => d.action === "prateleira-removida")).toBe(true);
    expect(r.assembly.pieces.some((p) => p.partKind === "prateleira")).toBe(false);
  });
});

describe("banheiro — gaveta em U", () => {
  const uDrawer = () =>
    buildBathroomModule({
      kind: "gabinete-gavetas",
      widthMm: 1200,
      heightMm: 600,
      drawers: 2,
      sink: { type: "embutir" },
    });

  it("gera frente única + duas caixas", () => {
    const r = uDrawer();
    expect(r.decisions.some((d) => d.action === "gaveta-em-u")).toBe(true);
    expect(r.mechanisms.length).toBeGreaterThan(0);
    const g = r.mechanisms[0];
    const pieces = r.assembly.pieces.filter((p) => p.id.includes(`:${g}:`));
    expect(pieces.filter((p) => p.partKind === "gaveta-frente")).toHaveLength(1);
    expect(pieces.filter((p) => p.partKind === "gaveta-lateral").length).toBeGreaterThanOrEqual(4);
  });

  it("abre como UM mecanismo (curso único, mesmo prefixo)", () => {
    const r = uDrawer();
    const g = r.mechanisms[0];
    const motions = r.assembly.motions.filter((m) => m.pieceId.includes(`:${g}:`));
    expect(motions.length).toBeGreaterThan(0);
    const travels = new Set(motions.map((m) => JSON.stringify(m.axis ?? null)));
    expect(travels.size).toBe(1);
  });

  it("respeita o volume do sifão", () => {
    expect(bathroomReservationConflicts(uDrawer())).toEqual([]);
  });

  it("sem largura lateral suficiente a gaveta vira porta", () => {
    const r = buildBathroomModule({
      kind: "gabinete-gavetas",
      widthMm: 500,
      depthMm: 300,
      drawers: 1,
      allowUDrawer: false,
      sink: { type: "embutir", siphonMm: 260 },
    });
    expect(r.decisions.some((d) => ["gaveta-vira-porta", "gaveta-reduzida"].includes(d.action))).toBe(true);
  });
});

describe("banheiro — acabamentos, espelhos e tapa-vãos", () => {
  it("rodabanca sai como acabamento, não como frente", () => {
    const r = buildBathroomModule({ kind: "cuba-central", countertop: { backsplashMm: 100 } });
    const rb = r.assembly.pieces.find((p) => p.id.includes("rodabanca"))!;
    expect(rb.partKind).toBe("acabamento");
    expect(r.assembly.motions.some((m) => m.pieceId === rb.id)).toBe(false);
  });

  it("tapa-vão é peça real com medidas e lista de corte", () => {
    const r = buildBathroomModule({ kind: "tapa-vao", widthMm: 80, heightMm: 700, depthMm: 460 });
    const piece = r.assembly.pieces.find((p) => p.partKind === "tapa-vao")!;
    expect(piece).toBeTruthy();
    expect(piece.box.width).toBe(80);
    expect(piece.box.height).toBe(700);
    expect(r.assembly.motions).toHaveLength(0);
  });

  it("espelho fixo não recebe rig; porta espelhada recebe", () => {
    const fixo = buildBathroomModule({ kind: "espelheira", mirror: "fixo", doors: 0 });
    const espelho = fixo.assembly.pieces.find((p) => p.substrate === "espelho")!;
    expect(espelho.partKind).toBe("acabamento");
    expect(fixo.assembly.motions.some((m) => m.pieceId === espelho.id)).toBe(false);

    const porta = buildBathroomModule({ kind: "espelheira", mirror: "porta", doors: 2 });
    const portas = porta.assembly.pieces.filter((p) => p.partKind === "porta");
    expect(portas).toHaveLength(2);
    expect(portas.every((p) => p.substrate === "espelho")).toBe(true);
    expect(porta.assembly.motions.filter((m) => portas.some((d) => d.id === m.pieceId))).toHaveLength(2);
  });

  it("nenhum acabamento recebe rig em nenhum módulo", () => {
    for (const kind of BATHROOM_MODULE_KINDS) {
      const r = buildBathroomModule({ kind });
      const finish = r.assembly.pieces.filter((p) => p.partKind === "acabamento" || p.partKind === "tapa-vao");
      for (const f of finish) {
        expect(r.assembly.motions.some((m) => m.pieceId === f.id)).toBe(false);
      }
    }
  });
});

describe("banheiro — layout engine e presets", () => {
  it("configuração explícita vence o preset", () => {
    const r = planBathroomLayout({
      widthMm: 1600,
      preset: "banheiro-casal",
      modules: [{ kind: "gabinete-1-porta", widthMm: 600 }],
    });
    expect(r.source).toBe("explicito");
    expect(r.placements).toHaveLength(1);
  });

  it("nunca sobrescreve configuração manual legada", () => {
    const r = planBathroomLayout({
      widthMm: 1200,
      legacyModules: [{ kind: "gabinete-gavetas", widthMm: 1200 }],
    });
    expect(r.source).toBe("legado");
    expect(r.placements[0].kind).toBe("gabinete-gavetas");
  });

  it("preset automático escolhe pela largura", () => {
    expect(pickBathroomPreset(600).id).toBe("lavabo-compacto");
    expect(pickBathroomPreset(900).id).toBe("banheiro-pequeno");
    expect(pickBathroomPreset(1200).id).toBe("banheiro-padrao");
    expect(pickBathroomPreset(1600).id).toBe("banheiro-casal");
    expect(planBathroomLayout({ widthMm: 900 }).source).toBe("preset-automatico");
  });

  it("entre paredes gera tapa-vãos reais e nenhuma sobra", () => {
    const r = planBathroomLayout({ widthMm: 1300, preset: "gabinete-entre-paredes", betweenWalls: true });
    expect(r.fillers.length).toBeGreaterThan(0);
    expect(r.leftoverMm).toBe(0);
    for (const f of r.fillers) expect(f.widthMm).toBeGreaterThan(0);
  });

  it("não transforma toda sobra em tapa-vão", () => {
    const r = planBathroomLayout({ widthMm: 2000, modules: [{ kind: "gabinete-1-porta", widthMm: 600 }] });
    expect(r.fillers).toHaveLength(0);
    expect(r.leftoverMm).toBeGreaterThan(0);
  });

  it("fallback mínimo seguro quando nada cabe", () => {
    const r = planBathroomLayout({ widthMm: 320, modules: [{ kind: "cuba-dupla", widthMm: 1600 }] });
    expect(r.source).toBe("fallback");
    expect(r.placements.length).toBeGreaterThan(0);
  });

  it("todos os presets declaram módulos e cuba", () => {
    for (const p of Object.values(BATHROOM_PRESETS)) {
      expect(p.required.length).toBeGreaterThan(0);
      expect(p.sink).toBeTruthy();
      expect(p.technical.length).toBeGreaterThan(0);
    }
  });
});

describe("banheiro — cenários de validação", () => {
  it("1. lavabo 600 mm com espelho fixo", () => {
    const r = buildBathroomModule({
      kind: "gabinete-1-porta",
      widthMm: 600,
      depthMm: 350,
      mirror: "fixo",
      sink: { type: "apoio" },
    });
    expect(r.assembly.pieces.filter((p) => p.partKind === "porta")).toHaveLength(1);
    expect(validateBathroomModule(r).ok).toBe(true);
  });

  it("2. banheiro 900 mm suspenso com cuba central", () => {
    const r = buildBathroomModule({ kind: "cuba-central", widthMm: 900, install: "suspenso" });
    expect(r.layout.floorGapMm).toBeGreaterThan(0);
    expect(validateBathroomModule(r).ok).toBe(true);
  });

  it("3. banheiro 1200 mm com gaveta em U e cuba deslocada", () => {
    const r = buildBathroomModule({ kind: "cuba-deslocada", widthMm: 1200, drawers: 2, opening: "gaveta" });
    expect(bathroomReservationConflicts(r)).toEqual([]);
  });

  it("4. banheiro 1600 mm com cuba dupla e torre", () => {
    const layout = planBathroomLayout({ widthMm: 2000, preset: "gabinete-com-torre" });
    expect(layout.placements.some((p) => p.kind === "torre-lateral")).toBe(true);
    for (const p of layout.placements) {
      expect(validateBathroomModule(buildBathroomModule(p.module)).ok).toBe(true);
    }
  });

  it("8. módulos internos se adaptam à cuba deslocada", () => {
    const centro = buildBathroomModule({ kind: "cuba-central", widthMm: 1200, drawers: 2, opening: "gaveta" });
    const desloc = buildBathroomModule({ kind: "cuba-deslocada", widthMm: 1200, drawers: 2, opening: "gaveta" });
    const boxOf = (r: typeof centro) =>
      r.assembly.pieces.filter((p) => p.partKind === "gaveta-lateral").map((p) => p.box.x);
    expect(boxOf(centro)).not.toEqual(boxOf(desloc));
  });
});

describe("banheiro — legado e roteamento", () => {
  it("detecta aliases de banheiro", () => {
    for (const s of ["banheiro", "lavabo", "vanity", "espelheira", "gabinete-de-banheiro"]) {
      expect(resolveFurnitureRenderer({ subtype: s }).renderer).toBe("bathroom");
    }
    expect(resolveFurnitureRenderer({ subtype: "x", catalogItemId: "cat-bathroom-vanity" }).renderer).toBe(
      "bathroom",
    );
  });

  it("não rouba roteamento de outras famílias", () => {
    expect(resolveFurnitureRenderer({ subtype: "roupeiro" }).renderer).toBe("wardrobe");
    expect(resolveFurnitureRenderer({ subtype: "gaveteiro" }).renderer).toBe("dresser");
    expect(resolveFurnitureRenderer({ subtype: "balcao" }).renderer).toBe("kitchen");
  });

  it("converte parâmetros legados em memória", () => {
    const legacy = {
      subtype: "gabinete-banheiro",
      widthMm: 1000,
      params: { "mod:doors": 2, "mod:cuba": "embutir", "eng:tampo": "granito", "mod:instalacao": "suspenso" },
    };
    expect(isBathroomFurniture(legacy)).toBe(true);
    const input = bathroomFromLegacy(legacy);
    const spec = normalizeBathroomModule(input);
    expect(spec.doors).toBe(2);
    expect(spec.sink.type).toBe("embutir");
    expect(spec.install).toBe("suspenso");
    // dados originais intactos
    expect(legacy.params["mod:doors"]).toBe(2);
  });

  it("persistência é determinística (mesma ficha → mesma montagem)", () => {
    const input = { kind: "cuba-deslocada" as const, widthMm: 1200, drawers: 2, opening: "gaveta" as const };
    const a = buildBathroomModule(input);
    const b = buildBathroomModule(buildBathroomModule(input).spec);
    expect(b.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}`)).toEqual(
      a.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}`),
    );
  });
});

describe("banheiro — não-regressão nas famílias já aprovadas", () => {
  it("cozinha, roupeiro e gaveteiro continuam montando", () => {
    expect(buildKitchenModule({ kind: "balcao" }).assembly.pieces.length).toBeGreaterThan(0);
    expect(buildWardrobe({ widthMm: 2400, heightMm: 2400, depthMm: 600 }).assembly.pieces.length).toBeGreaterThan(0);
    expect(buildDresser({ widthMm: 900 }).assembly.pieces.length).toBeGreaterThan(0);
  });

  it("canto diagonal da cozinha mantém abas fixas sem rig", () => {
    const r = buildKitchenModule({ kind: "canto-diagonal" });
    const fixas = r.assembly.pieces.filter((p) => p.partKind === "frente-fixa");
    expect(fixas.length).toBeGreaterThan(0);
    for (const f of fixas) expect(r.assembly.motions.some((m) => m.pieceId === f.id)).toBe(false);
  });
});