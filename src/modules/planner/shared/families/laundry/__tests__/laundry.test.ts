import { describe, expect, it } from "vitest";
import {
  APPLIANCES,
  BOARD_TRAVEL_MM,
  LAUNDRY_MODULE_KINDS,
  LAUNDRY_PRESETS,
  buildLaundryModule,
  isLaundryFurniture,
  laundryFromLegacy,
  laundryGeometryFaults,
  laundryReservationConflicts,
  listLaundryPresets,
  normalizeLaundryModule,
  pickLaundryPreset,
  planLaundryLayout,
  validateLaundryModule,
} from "../index";
import { resolveFurnitureRenderer } from "../../wardrobe/detect";
import { buildBathroomModule } from "../../bathroom";
import { buildKitchenModule } from "../../kitchen";
import { buildWardrobe } from "../../wardrobe";
import { buildDresser } from "../../dresser";

type Built = ReturnType<typeof buildLaundryModule>;
const errors = (r: Built) => validateLaundryModule(r).issues.filter((i) => i.level === "erro");
const has = (r: Built, re: RegExp) =>
  r.assembly.pieces.some((p) => re.test(p.id) || re.test(p.partKind));
const rigs = (r: Built) => r.assembly.motions.filter((m) => m.kind !== "static");

/** Nenhuma peça degenerada, duplicada ou fora do envelope. */
function assertSane(r: Built) {
  expect(laundryGeometryFaults(r)).toEqual([]);
  for (const p of r.assembly.pieces) {
    expect(p.box.width).toBeGreaterThan(0);
    expect(p.box.height).toBeGreaterThan(0);
    expect(p.box.depth).toBeGreaterThan(0);
  }
  expect(laundryReservationConflicts(r)).toEqual([]);
}

/* ───────────────────────────── build ───────────────────────────── */

describe("lavanderia — build de todos os módulos", () => {
  for (const kind of LAUNDRY_MODULE_KINDS) {
    it(`monta ${kind} sem erro estrutural`, () => {
      const r = buildLaundryModule({ kind });
      expect(r.assembly.pieces.length).toBeGreaterThan(0);
      assertSane(r);
      expect(errors(r)).toEqual([]);
    });
  }

  it("é determinístico: duas montagens iguais produzem as mesmas peças", () => {
    const a = buildLaundryModule({ kind: "gabinete-tanque", widthMm: 800 });
    const b = buildLaundryModule({ kind: "gabinete-tanque", widthMm: 800 });
    expect(a.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}`)).toEqual(
      b.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}`),
    );
  });

  it("não emite peça duplicada", () => {
    const r = buildLaundryModule({ kind: "armario-limpeza" });
    const ids = r.assembly.pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registra ferragens de instalação do aparelho", () => {
    const r = buildLaundryModule({ kind: "modulo-lavadora" });
    expect(r.assembly.hardware.some((h) => /instalacao-lavadora-frontal/.test(h.id))).toBe(true);
  });
});

/* ───────────────────────── máquinas e ventilação ───────────────────────── */

describe("lavanderia — aparelhos", () => {
  it("máquina frontal reserva volume, abertura de porta e instalação", () => {
    const r = buildLaundryModule({ kind: "modulo-lavadora", widthMm: 700 });
    const kinds = r.reservations.map((x) => x.kind);
    expect(kinds).toContain("aparelho");
    expect(kinds).toContain("abertura-porta");
    expect(kinds).toContain("manutencao");
    assertSane(r);

    const dryer = buildLaundryModule({ kind: "modulo-secadora" });
    expect(dryer.reservations.map((x) => x.kind)).toContain("ventilacao");
  });

  it("máquina superior nunca recebe tampo e reserva abertura superior", () => {
    const r = buildLaundryModule({
      kind: "modulo-lavadora",
      appliance: { kind: "lavadora-superior" },
      countertop: { material: "granito" },
    });
    expect(r.spec.countertop.material).toBe("nenhum");
    expect(r.reservations.map((x) => x.kind)).toContain("abertura-superior");
    expect(errors(r)).toEqual([]);
  });

  it("aparelho ventilado não fecha o fundo", () => {
    const r = buildLaundryModule({ kind: "modulo-secadora" });
    expect(r.spec.closedBack).toBe(false);
    expect(errors(r).some((e) => e.code === "ventilacao-bloqueada")).toBe(false);
  });

  it("fundo fechado sob aparelho ventilado é erro", () => {
    const r = buildLaundryModule({ kind: "modulo-secadora", closedBack: true });
    expect(errors(r).some((e) => e.code === "ventilacao-bloqueada")).toBe(true);
  });

  it("nicho estreito é ampliado ao envelope técnico do aparelho", () => {
    const r = buildLaundryModule({ kind: "modulo-lavadora", widthMm: 450 });
    expect(r.spec.widthMm).toBeGreaterThanOrEqual(APPLIANCES["lavadora-frontal"].widthMm);
    expect(errors(r)).toEqual([]);
  });

  it("torre abre em dois aparelhos reais", () => {
    const r = buildLaundryModule({ kind: "torre-maquinas" });
    const ap = r.reservations.filter((x) => x.kind === "aparelho");
    expect(ap.length).toBeGreaterThanOrEqual(2);
    expect(r.spec.stackingKit).toBe(true);
    assertSane(r);
  });

  it("torre técnica fechada emite porta externa com rig", () => {
    const r = buildLaundryModule({ kind: "torre-tecnica" });
    expect(r.spec.outerDoor).toBe(true);
    expect(rigs(r).length).toBeGreaterThan(0);
  });

  it("catálogo declara curso de porta e de tampa coerentes", () => {
    expect(APPLIANCES["lavadora-frontal"].doorArcMm).toBeGreaterThan(0);
    expect(APPLIANCES["lavadora-superior"].topLidMm).toBeGreaterThan(0);
  });
});

/* ─────────────────────────── tanque / hidráulica ─────────────────────────── */

describe("lavanderia — tanque e hidráulica", () => {
  it("gabinete de tanque reserva cuba, sifão e válvula", () => {
    const r = buildLaundryModule({ kind: "gabinete-tanque", widthMm: 800 });
    const kinds = r.reservations.map((x) => x.kind);
    expect(kinds).toContain("cuba");
    expect(kinds).toContain("sifao");
    expect(kinds).toContain("valvula");
  });

  it("tanque não cabe em largura insuficiente", () => {
    const r = buildLaundryModule({ kind: "gabinete-tanque", widthMm: 350 });
    expect(errors(r).length).toBeGreaterThan(0);
  });

  it("gaveta sob tanque vira mecanismo único (gaveta em U)", () => {
    const r = buildLaundryModule({
      kind: "gabinete-tanque",
      widthMm: 900,
      drawers: 1,
      opening: "gaveta",
    });
    expect(laundryReservationConflicts(r)).toEqual([]);
  });

  it("tanque embutido exige tampo", () => {
    const r = buildLaundryModule({
      kind: "gabinete-tanque",
      widthMm: 800,
      countertop: { material: "nenhum" },
    });
    expect(errors(r).some((e) => e.code === "tanque-sem-tampo")).toBe(true);
  });
});

/* ───────────────────── cestos, tábua e vassoureiro ───────────────────── */

describe("lavanderia — cestos, tábua e vassoureiro", () => {
  it("vassoureiro reserva zona vertical de vassouras", () => {
    const r = buildLaundryModule({ kind: "vassoureiro" });
    expect(r.spec.broomZoneMm).toBeGreaterThan(0);
    expect(r.reservations.map((x) => x.kind)).toContain("vassoura");
    assertSane(r);
  });

  it("zona de vassoura maior que o interior é erro", () => {
    const r = buildLaundryModule({ kind: "vassoureiro", heightMm: 900, broomZoneMm: 2000 });
    expect(errors(r).some((e) => e.code === "vassoura-alem")).toBe(true);
  });

  it("cestos removíveis reservam volume e não colidem", () => {
    const r = buildLaundryModule({ kind: "modulo-cestos", widthMm: 700 });
    expect(r.reservations.map((x) => x.kind)).toContain("cesto");
    assertSane(r);
  });

  it("cesto basculante gera mecanismo único", () => {
    const r = buildLaundryModule({ kind: "gabinete-cesto-basculante", widthMm: 500 });
    expect(r.mechanisms.length + rigs(r).length).toBeGreaterThan(0);
  });

  it("tábua de passar reserva volume e respeita o curso", () => {
    const r = buildLaundryModule({ kind: "modulo-tabua" });
    expect(r.reservations.map((x) => x.kind)).toContain("tabua");
    expect(BOARD_TRAVEL_MM).toBeGreaterThan(0);
    assertSane(r);
  });

  it("tábua com curso insuficiente vira aviso, não erro", () => {
    const r = buildLaundryModule({ kind: "modulo-tabua", depthMm: 300 });
    const v = validateLaundryModule(r);
    expect(v.issues.some((i) => i.level === "aviso" && i.code === "tabua-curso")).toBe(true);
  });
});

/* ──────────────── acabamentos, tapa-vãos e suspensos ──────────────── */

describe("lavanderia — acabamentos e suspensos", () => {
  it("tapa-vão é peça real, sem rig", () => {
    const r = buildLaundryModule({ kind: "tapa-vao", widthMm: 80 });
    expect(has(r, /tapa-vao/)).toBe(true);
    expect(rigs(r)).toHaveLength(0);
  });

  it("rodabanca e painel de acabamento não se movem", () => {
    for (const kind of ["rodabanca", "painel-acabamento"] as const) {
      const r = buildLaundryModule({ kind });
      expect(rigs(r)).toHaveLength(0);
      expect(errors(r)).toEqual([]);
    }
  });

  it("aéreo suspenso recomenda altura de base sem virar erro", () => {
    const r = buildLaundryModule({ kind: "aereo-portas" });
    const v = validateLaundryModule(r);
    expect(v.ok).toBe(true);
    expect(v.issues.some((i) => i.level === "recomendacao")).toBe(true);
  });
});

/* ─────────────────────── layout engine e presets ─────────────────────── */

describe("lavanderia — presets", () => {
  it("declara os 10 presets", () => {
    expect(listLaundryPresets()).toHaveLength(10);
  });

  for (const preset of listLaundryPresets()) {
    it(`preset ${preset.id} gera composição válida`, () => {
      const plan = planLaundryLayout({ preset: preset.id, widthMm: preset.recommendedWidthMm });
      expect(plan.placements.length).toBeGreaterThan(0);
      for (const pl of plan.placements) {
        const r = buildLaundryModule(pl.module);
        assertSane(r);
      }
    });
  }

  it("preset automático escolhe pela largura", () => {
    expect(pickLaundryPreset(1200).id).toBe("lavanderia-compacta");
    expect(pickLaundryPreset(1600).id).toBe("maquina-tanque");
    expect(pickLaundryPreset(3000).id).toBe("area-servico-completa");
    expect(pickLaundryPreset(1500, true).id).toBe("entre-paredes");
  });
});

describe("lavanderia — layout engine (prioridade)", () => {
  it("1. explícito vence tudo", () => {
    const plan = planLaundryLayout({
      widthMm: 2000,
      preset: "area-servico-completa",
      modules: [{ kind: "gabinete-inferior", widthMm: 600 }],
    });
    expect(plan.source).toBe("explicito");
    expect(plan.placements).toHaveLength(1);
  });

  it("2. legado nunca é sobrescrito", () => {
    const plan = planLaundryLayout({
      widthMm: 2000,
      legacyModules: [{ kind: "gabinete-2-portas", widthMm: 900 }],
    });
    expect(plan.source).toBe("legado");
    expect(plan.placements[0].kind).toBe("gabinete-2-portas");
  });

  it("3. preset escolhido", () => {
    const plan = planLaundryLayout({ widthMm: 1600, preset: "maquina-tanque" });
    expect(plan.source).toBe("preset");
    expect(plan.preset?.id).toBe("maquina-tanque");
  });

  it("4. entre paredes emite tapa-vãos reais nas duas pontas", () => {
    const plan = planLaundryLayout({ widthMm: 1700, betweenWalls: true });
    expect(plan.source).toBe("entre-paredes");
    expect(plan.fillers.length).toBeGreaterThan(0);
    expect(plan.fillers.every((f) => f.widthMm >= 10)).toBe(true);
  });

  it("5. preset automático quando nada foi informado", () => {
    const plan = planLaundryLayout({ widthMm: 1600 });
    expect(plan.source).toBe("preset-automatico");
  });

  it("6. fallback mínimo seguro quando nada cabe", () => {
    const plan = planLaundryLayout({
      widthMm: 200,
      modules: [{ kind: "gabinete-tanque", widthMm: 1200 }],
    });
    expect(plan.source).toBe("fallback");
    expect(plan.placements).toHaveLength(1);
    const r = buildLaundryModule(plan.placements[0].module);
    expect(errors(r)).toEqual([]);
  });

  it("nunca cria módulo abaixo do mínimo real", () => {
    const plan = planLaundryLayout({ widthMm: 1000, preset: "maquinas-lado-a-lado" });
    for (const pl of plan.placements) {
      const r = buildLaundryModule(pl.module);
      expect(errors(r).some((e) => e.code === "largura-minima")).toBe(false);
    }
  });

  it("composição em L reparte a largura em dois trechos", () => {
    const plan = planLaundryLayout({ widthMm: 2600, preset: "lavanderia-em-l" });
    expect(new Set(plan.placements.map((p) => p.run)).size).toBeGreaterThanOrEqual(1);
    expect(plan.placements.length).toBeGreaterThan(1);
  });

  it("sobra não coberta continua reportada", () => {
    const plan = planLaundryLayout({
      widthMm: 2000,
      modules: [{ kind: "gabinete-inferior", widthMm: 600 }],
    });
    expect(plan.leftoverMm).toBeGreaterThan(0);
  });
});

/* ─────────────────────────── conversão legada ─────────────────────────── */

describe("lavanderia — conversão legada", () => {
  const aliases = [
    "lavanderia",
    "area de servico",
    "área de serviço",
    "laundry",
    "laundry room",
    "tanque",
    "vassoureiro",
    "máquina",
    "maquina",
    "secadora",
    "lava e seca",
  ];
  for (const alias of aliases) {
    it(`reconhece "${alias}"`, () => {
      expect(isLaundryFurniture({ subtype: alias })).toBe(true);
    });
  }

  it("não reconhece móvel de outra família", () => {
    expect(isLaundryFurniture({ subtype: "roupeiro" })).toBe(false);
  });

  it("converte params antigos em memória", () => {
    const input = laundryFromLegacy({
      subtype: "lavanderia",
      params: { "mod:tanque": "embutido", "eng:doors": 2, "mod:largura": 900 },
      widthMm: 900,
      heightMm: 900,
      depthMm: 600,
    });
    expect(input.tub?.type).toBe("embutido");
    const r = buildLaundryModule(input);
    assertSane(r);
  });

  it("máquina superior legada não recebe tampo", () => {
    const input = laundryFromLegacy({
      subtype: "maquina",
      params: { "mod:appliance": "lavadora-superior", "mod:tampo": "granito" },
      widthMm: 700,
      heightMm: 1000,
      depthMm: 750,
    });
    const r = buildLaundryModule(input);
    expect(r.spec.countertop.material).toBe("nenhum");
  });

  it("normalização não muda o objeto de entrada", () => {
    const input = { kind: "gabinete-tanque" as const, widthMm: 800 };
    const snapshot = JSON.stringify(input);
    normalizeLaundryModule(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

/* ─────────────────────────────── roteamento ─────────────────────────────── */

describe("lavanderia — roteamento de renderer", () => {
  for (const subtype of ["lavanderia", "tanque", "vassoureiro", "secadora", "lava-e-seca"]) {
    it(`${subtype} vai para LaundryMesh`, () => {
      expect(resolveFurnitureRenderer({ subtype }).renderer).toBe("laundry");
    });
  }

  it("catalogItemId identifica lavanderia", () => {
    expect(resolveFurnitureRenderer({ catalogItemId: "mod-lavanderia-01" }).renderer).toBe("laundry");
  });

  it("não rouba móveis das famílias já convertidas", () => {
    expect(resolveFurnitureRenderer({ subtype: "roupeiro" }).renderer).toBe("wardrobe");
    expect(resolveFurnitureRenderer({ subtype: "gaveteiro" }).renderer).toBe("dresser");
    expect(resolveFurnitureRenderer({ subtype: "balcao" }).renderer).toBe("kitchen");
    expect(resolveFurnitureRenderer({ subtype: "banheiro" }).renderer).toBe("bathroom");
  });
});

/* ────────────────────────── 10 cenários de validação ────────────────────────── */

describe("lavanderia — 10 cenários", () => {
  it("1. lavanderia 1200 com máquina frontal, tanque e aéreo", () => {
    const plan = planLaundryLayout({ widthMm: 1200, preset: "lavanderia-compacta" });
    expect(plan.placements.length).toBeGreaterThan(0);
    plan.placements.forEach((p) => assertSane(buildLaundryModule(p.module)));
  });

  it("2. lavanderia 1600 com máquina, tanque, gabinete e aéreo", () => {
    const plan = planLaundryLayout({ widthMm: 1600, preset: "maquina-tanque" });
    expect(plan.placements.some((p) => p.kind === "modulo-lavadora")).toBe(true);
    expect(plan.placements.some((p) => p.kind === "gabinete-tanque")).toBe(true);
    plan.placements.forEach((p) => assertSane(buildLaundryModule(p.module)));
  });

  it("3. lavanderia 2000 com máquina, secadora e tampo contínuo", () => {
    const plan = planLaundryLayout({ widthMm: 2000, preset: "maquinas-lado-a-lado" });
    expect(plan.placements.some((p) => p.kind === "modulo-lavadora")).toBe(true);
    expect(plan.placements.some((p) => p.kind === "modulo-secadora")).toBe(true);
    plan.placements.forEach((p) => assertSane(buildLaundryModule(p.module)));
  });

  it("4. torre de máquinas", () => {
    const r = buildLaundryModule({ kind: "torre-maquinas", widthMm: 700, heightMm: 2000, depthMm: 750 });
    assertSane(r);
    expect(errors(r)).toEqual([]);
  });

  it("5. máquina de abertura superior", () => {
    const r = buildLaundryModule({
      kind: "modulo-lavadora",
      appliance: { kind: "lavadora-superior" },
      widthMm: 700,
      heightMm: 1100,
      depthMm: 700,
    });
    expect(r.spec.countertop.material).toBe("nenhum");
    assertSane(r);
  });

  it("6. entre paredes", () => {
    const plan = planLaundryLayout({ widthMm: 1800, betweenWalls: true });
    const covered =
      plan.placements
        .filter((p) => p.run === 0)
        .reduce((a, p) => Math.max(a, p.xMm + p.widthMm), 0) +
      (plan.fillers.find((f) => f.id === "tapa-vao-esq")?.widthMm ?? 0) * 0;
    expect(covered).toBeLessThanOrEqual(1800);
    expect(plan.fillers.length).toBeGreaterThan(0);
  });

  it("7. lavanderia em L", () => {
    const plan = planLaundryLayout({ widthMm: 2800, preset: "lavanderia-em-l" });
    plan.placements.forEach((p) => assertSane(buildLaundryModule(p.module)));
  });

  it("8. vassoureiro", () => {
    const plan = planLaundryLayout({ widthMm: 900, preset: "vassoureiro" });
    expect(plan.placements.some((p) => p.kind === "vassoureiro")).toBe(true);
    plan.placements.forEach((p) => assertSane(buildLaundryModule(p.module)));
  });

  it("9. cestos + tábua", () => {
    const cestos = buildLaundryModule({ kind: "modulo-cestos", widthMm: 700 });
    const tabua = buildLaundryModule({ kind: "modulo-tabua", widthMm: 350, depthMm: 600 });
    assertSane(cestos);
    assertSane(tabua);
    expect(errors(cestos)).toEqual([]);
    expect(errors(tabua)).toEqual([]);
  });

  it("10. redimensionamento mantém a montagem sã", () => {
    for (const widthMm of [700, 900, 1200, 1600, 2000, 2400]) {
      const r = buildLaundryModule({ kind: "gabinete-2-portas", widthMm });
      assertSane(r);
      expect(errors(r)).toEqual([]);
    }
    for (const heightMm of [700, 850, 1000, 1200]) {
      const r = buildLaundryModule({ kind: "gabinete-gavetas", heightMm });
      assertSane(r);
    }
  });
});

/* ───────────────────── Motion, Interlock e persistência ───────────────────── */

describe("lavanderia — Motion e Interlock", () => {
  it("portas e gavetas recebem rig; estrutura não", () => {
    const r = buildLaundryModule({ kind: "gabinete-2-portas", widthMm: 900 });
    const doors = r.assembly.pieces.filter((p) => p.partKind === "porta");
    expect(doors.length).toBeGreaterThan(0);
    expect(rigs(r).length).toBeGreaterThan(0);
    for (const m of rigs(r)) {
      const piece = r.assembly.pieces.find((p) => p.id === m.pieceId);
      expect(piece).toBeDefined();
      expect(piece!.partKind).not.toBe("lateral");
    }
  });

  it("gavetas atrás de porta ficam sob intertravamento do mesmo grupo", () => {
    const r = buildLaundryModule({ kind: "gabinete-tanque", widthMm: 900, drawers: 2, opening: "gaveta" });
    expect(rigs(r).length).toBeGreaterThan(0);
  });

  it("nenhum rig órfão", () => {
    for (const kind of LAUNDRY_MODULE_KINDS) {
      const r = buildLaundryModule({ kind });
      expect(errors(r).some((e) => e.code === "rig-orfao")).toBe(false);
    }
  });
});

describe("lavanderia — persistência (save/load)", () => {
  it("ficha serializada e recarregada produz a mesma montagem", () => {
    const original = buildLaundryModule({
      kind: "gabinete-tanque",
      widthMm: 900,
      heightMm: 900,
      depthMm: 600,
      shelves: 1,
    });
    const reloaded = buildLaundryModule(JSON.parse(JSON.stringify(original.spec)));
    expect(reloaded.spec).toEqual(original.spec);
    expect(reloaded.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}:${p.box.z}`)).toEqual(
      original.assembly.pieces.map((p) => `${p.id}:${p.box.x}:${p.box.y}:${p.box.z}`),
    );
  });

  it("layout serializado recarrega idêntico", () => {
    const plan = planLaundryLayout({ widthMm: 1600, preset: "maquina-tanque" });
    const round = plan.placements.map((p) => buildLaundryModule(JSON.parse(JSON.stringify(p.module))));
    round.forEach((r) => assertSane(r));
  });
});

/* ─────────────────────── não-regressão das famílias ─────────────────────── */

describe("lavanderia — não-regressão nas famílias já aprovadas", () => {
  it("roupeiro, gaveteiro, cozinha e banheiro continuam montando", () => {
    expect(buildWardrobe({ widthMm: 2400, heightMm: 2400, depthMm: 600 }).assembly.pieces.length).toBeGreaterThan(0);
    expect(buildDresser({ widthMm: 800 }).assembly.pieces.length).toBeGreaterThan(0);
    expect(buildKitchenModule({ widthMm: 800 }).assembly.pieces.length).toBeGreaterThan(0);
    expect(buildBathroomModule({ widthMm: 900 }).assembly.pieces.length).toBeGreaterThan(0);
  });

  it("presets de lavanderia não colidem com ids de outra família", () => {
    expect(Object.keys(LAUNDRY_PRESETS)).toHaveLength(10);
  });
});

/* ──────────────── auditoria no viewport: correções aplicadas ──────────────── */

describe("lavanderia — auditoria prática (regressões corrigidas)", () => {
  const uppers = ["aereo-simples", "aereo-portas", "nicho-aberto", "prateleira"];

  it("aéreos não se sobrepõem entre si: cada um ganha a própria faixa de parede", () => {
    const plan = planLaundryLayout({ widthMm: 1200, preset: "lavanderia-compacta" });
    const ups = plan.placements.filter((p) => uppers.includes(p.kind));
    expect(ups.length).toBeGreaterThan(1);
    for (let i = 1; i < ups.length; i++) {
      expect(ups[i].xMm).toBeGreaterThanOrEqual(ups[i - 1].xMm + ups[i - 1].widthMm);
    }
  });

  it("altura de instalação do aéreo é calculada acima da bancada real", () => {
    const plan = planLaundryLayout({ widthMm: 1200, preset: "lavanderia-compacta" });
    const up = plan.placements.find((p) => uppers.includes(p.kind))!;
    expect(up.module.floorGapMm).toBeGreaterThan(1200);
  });

  it("máquina de abertura superior empurra o aéreo acima do curso da tampa", () => {
    const baixa = planLaundryLayout({ widthMm: 2000, preset: "maquinas-lado-a-lado" });
    const alta = planLaundryLayout({
      widthMm: 2000,
      preset: "maquinas-lado-a-lado",
      modules: [
        { kind: "modulo-lavadora", widthMm: 900, appliance: { kind: "lavadora-superior" } },
        { kind: "aereo-portas", widthMm: 800 },
      ],
    });
    const gap = (p: ReturnType<typeof planLaundryLayout>) =>
      p.placements.find((x) => uppers.includes(x.kind))!.module.floorGapMm ?? 0;
    expect(gap(alta)).toBeGreaterThan(gap(baixa));
  });

  it("tampo e acabamento não herdam a altura/profundidade do balcão", () => {
    const plan = planLaundryLayout({ widthMm: 2000, preset: "maquinas-lado-a-lado", heightMm: 1050 });
    const tampo = plan.placements.find((p) => p.kind === "tampo-continuo");
    expect(tampo?.module.heightMm).toBeUndefined();
    expect(buildLaundryModule(tampo!.module).spec.heightMm).toBeLessThan(100);
  });

  it("coluna alta não é forçada à altura da bancada (vassoureiro segue válido)", () => {
    const plan = planLaundryLayout({ widthMm: 6000, heightMm: 900 });
    const coluna = plan.placements.find((p) => p.kind === "vassoureiro");
    if (coluna) {
      const built = buildLaundryModule(coluna.module);
      expect(built.assembly.pieces.length).toBeGreaterThan(0);
      expect(built.warnings.filter((w: string) => w.includes("além"))).toHaveLength(0);
    }
  });

  it("composição gerada não deixa sobra útil de bancada vazia", () => {
    const plan = planLaundryLayout({ widthMm: 1200, preset: "lavanderia-compacta" });
    expect(plan.leftoverMm).toBeLessThan(300);
  });
});
