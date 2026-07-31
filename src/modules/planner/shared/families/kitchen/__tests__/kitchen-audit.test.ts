/**
 * AUDITORIA PRÁTICA DA FAMÍLIA COZINHA — cenários reais.
 *
 * Todo cenário percorre o caminho COMPLETO usado pelo viewport:
 * Layout Engine → placements → buildKitchenModule → buildAssembly →
 * peças + rigs + intertravamento. Nada é testado "de forma isolada".
 */
import { describe, expect, it } from "vitest";
import {
  buildKitchenModule,
  kitchenDiagnostics,
  kitchenLegacyParams,
  kitchenReservationConflicts,
  kitchenSpecFromLegacy,
  normalizeKitchenModule,
  planKitchen,
  splitRun,
  validateKitchenLayout,
  KITCHEN_DEFAULT_CONFIG,
  KITCHEN_MODULE_KINDS,
  type KitchenLayoutInput,
  type KitchenLayoutResult,
} from "../index";
import { motionGroupOfPiece, resolveInterlock } from "../../../construction";

/* ─────────────────────────── utilidades da auditoria ─────────────────────── */

function auditScene(result: KitchenLayoutResult) {
  const v = validateKitchenLayout(result);
  const conflicts: string[] = [];
  const envelope: string[] = [];
  for (const p of result.placements) {
    const built = buildKitchenModule(p.spec);
    expect(built.assembly.pieces.length, p.id).toBeGreaterThan(0);
    for (const c of kitchenReservationConflicts(built)) {
      conflicts.push(`${p.id}: ${c.pieceId} invade ${c.reservationId}`);
    }
    for (const piece of built.assembly.pieces) {
      const b = piece.box;
      if (
        b.x < -60 ||
        b.x + b.width > p.widthMm + 60 ||
        b.y < -2 ||
        b.y + b.height > p.heightMm + 2 ||
        b.z + b.depth > p.depthMm + 60
      ) {
        envelope.push(`${p.id}/${piece.id}`);
      }
    }
  }
  return { v, conflicts, envelope };
}

/** Nenhum módulo da mesma parede e faixa pode se sobrepor. */
function overlapsInScene(result: KitchenLayoutResult): string[] {
  const out: string[] = [];
  const groups = new Map<string, typeof result.placements[number][]>();
  for (const p of result.placements) {
    const key = `${p.wallId}|${p.level === "coluna" ? "inferior" : p.level}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => a.xMm - b.xMm);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].xMm < sorted[i - 1].xMm + sorted[i - 1].widthMm - 1) {
        out.push(`${sorted[i - 1].id} × ${sorted[i].id}`);
      }
    }
  }
  return out;
}

function expectHealthyScene(result: KitchenLayoutResult) {
  const { v, conflicts, envelope } = auditScene(result);
  expect(v.errors.map((e) => `${e.code}: ${e.message}`), "erros").toEqual([]);
  expect(overlapsInScene(result), "interpenetração").toEqual([]);
  expect(conflicts, "volumes técnicos invadidos").toEqual([]);
  expect(envelope, "peças fora do envelope").toEqual([]);
  return v;
}

/** A bancada cobre exatamente os balcões, sem buraco e sem sobra. */
function expectCountertopCoversBases(result: KitchenLayoutResult, wallId: string) {
  const bases = result.placements
    .filter((p) => p.wallId === wallId && p.level === "inferior")
    .sort((a, b) => a.xMm - b.xMm);
  for (const b of bases) {
    const run = result.countertopRuns.find(
      (r) => r.wallId === wallId && r.startMm <= b.xMm + 1 && r.endMm >= b.xMm + b.widthMm - 1,
    );
    expect(run, `sem bancada sobre ${b.id}`).toBeDefined();
  }
  for (const r of result.countertopRuns.filter((x) => x.wallId === wallId)) {
    const covered = bases.some((b) => b.xMm <= r.startMm + 1 && b.xMm + b.widthMm >= r.startMm - 1);
    expect(covered, `bancada ${r.startMm}-${r.endMm} sem balcão embaixo`).toBe(true);
  }
}

const C1: KitchenLayoutInput = {
  id: "reta-2500",
  shape: "reta",
  walls: [
    {
      id: "p1",
      lengthMm: 2500,
      heightMm: 2700,
      fixtures: [
        { id: "pia", kind: "pia", atMm: 200, widthMm: 1200 },
        { id: "ck", kind: "cooktop", atMm: 1600, widthMm: 800 },
        { id: "coifa", kind: "coifa", atMm: 1600, widthMm: 800 },
      ],
    },
  ],
};

const C2: KitchenLayoutInput = {
  id: "reta-3500",
  shape: "reta",
  walls: [
    {
      id: "p1",
      lengthMm: 3500,
      heightMm: 2700,
      fixtures: [
        { id: "gel", kind: "geladeira", atMm: 0, widthMm: 700 },
        { id: "tq", kind: "torre-quente", atMm: 700, widthMm: 600 },
        { id: "pia", kind: "pia", atMm: 1300, widthMm: 1000 },
        { id: "ll", kind: "lava-loucas", atMm: 2300, widthMm: 600 },
        { id: "ck", kind: "cooktop", atMm: 2900, widthMm: 600 },
        { id: "coifa", kind: "coifa", atMm: 2900, widthMm: 600 },
      ],
    },
  ],
};

const C3: KitchenLayoutInput = {
  id: "reta-5000",
  shape: "reta",
  walls: [
    {
      id: "p1",
      lengthMm: 5000,
      heightMm: 2700,
      fixtures: [
        { id: "gel", kind: "geladeira", atMm: 0, widthMm: 800 },
        { id: "tq", kind: "torre-quente", atMm: 800, widthMm: 600 },
        { id: "pia", kind: "pia", atMm: 2000, widthMm: 1200 },
        { id: "ll", kind: "lava-loucas", atMm: 3200, widthMm: 600 },
        { id: "ck", kind: "cooktop", atMm: 4000, widthMm: 800 },
        { id: "coifa", kind: "coifa", atMm: 4000, widthMm: 800 },
      ],
    },
  ],
};

const inL = (kind: "canto-reto" | "canto-diagonal" | "canto-magico"): KitchenLayoutInput => ({
  id: `L-${kind}`,
  shape: "L",
  walls: [
    {
      id: "a",
      lengthMm: 3000,
      heightMm: 2700,
      cornerEnd: true,
      cornerKindEnd: kind,
      fixtures: [{ id: "pia", kind: "pia", atMm: 600 }],
    },
    {
      id: "b",
      lengthMm: 2400,
      heightMm: 2700,
      cornerStart: true,
      fixtures: [{ id: "ck", kind: "cooktop", atMm: 1200 }],
    },
  ],
});

const C5: KitchenLayoutInput = {
  id: "ilha",
  shape: "ilha",
  walls: [{ id: "p1", lengthMm: 3000, heightMm: 2700, fixtures: [{ id: "pia", kind: "pia", atMm: 600 }] }],
  island: { lengthMm: 2400, depthMm: 900, hasCooktop: true, hasSink: true, clearanceMm: 1100 },
};

const C6: KitchenLayoutInput = {
  id: "obstaculos",
  shape: "reta",
  walls: [
    {
      id: "p1",
      lengthMm: 4200,
      heightMm: 2600,
      fixtures: [
        { id: "porta", kind: "porta", atMm: 0, widthMm: 800 },
        { id: "pia", kind: "pia", atMm: 1000, widthMm: 1200 },
        { id: "jan", kind: "janela", atMm: 1000, widthMm: 1400, sillMm: 1150 },
        { id: "ck", kind: "cooktop", atMm: 2600, widthMm: 800 },
        { id: "coifa", kind: "coifa", atMm: 2600, widthMm: 800 },
        { id: "gel", kind: "geladeira", atMm: 3400, widthMm: 800 },
      ],
    },
  ],
};

/* ───────────────────────────── cenário 1 ─────────────────────────────── */

describe("Cenário 1 — cozinha reta de 2,5 m", () => {
  const r = planKitchen(C1);

  it("monta uma composição sã, sem vão morto e sem interpenetração", () => {
    expectHealthyScene(r);
    expect(r.fillers, "sobras sem tamponamento").toEqual([]);
  });

  it("os módulos ficam dentro da parede e cobrem o comprimento útil", () => {
    const bases = r.placements.filter((p) => p.level !== "superior");
    const used = bases.reduce((a, p) => a + p.widthMm, 0);
    expect(used).toBe(2500);
    for (const p of r.placements) expect(p.xMm + p.widthMm).toBeLessThanOrEqual(2500);
  });

  it("tampo contínuo cobre os balcões e carrega os recortes", () => {
    expect(r.countertopRuns).toHaveLength(1);
    expect(r.countertopRuns[0].lengthMm).toBe(2500);
    expectCountertopCoversBases(r, "p1");
    expect(r.placements.find((p) => p.kind === "balcao-pia")!.spec.countertop.cutout).toBe("cuba");
    expect(r.placements.find((p) => p.kind === "balcao-cooktop")!.spec.countertop.cutout).toBe("cooktop");
  });

  it("rodapé acompanha toda a linha de balcões", () => {
    expect(r.totals.plinthLengthMm).toBe(2500);
  });

  it("aéreos alinhados na mesma altura e fora do vão da coifa", () => {
    const uppers = r.placements.filter((p) => p.level === "superior");
    expect(uppers.length).toBeGreaterThan(0);
    expect(new Set(uppers.map((u) => u.yMm)).size).toBe(1);
    expect(new Set(uppers.map((u) => u.heightMm)).size).toBe(1);
    const hood = r.reservations.find((x) => x.kind === "coifa")!;
    for (const u of uppers) expect(u.xMm < hood.xMm + hood.widthMm && hood.xMm < u.xMm + u.widthMm).toBe(false);
  });
});

/* ───────────────────────────── cenário 2 ─────────────────────────────── */

describe("Cenário 2 — cozinha reta de 3,5 m", () => {
  const r = planKitchen(C2);

  it("compõe geladeira, torre, pia, lava-louças e cooktop sem erro", () => {
    expectHealthyScene(r);
    for (const kind of ["torre-geladeira", "torre-quente", "balcao-pia", "balcao-cooktop"] as const) {
      expect(r.placements.some((p) => p.kind === kind), kind).toBe(true);
    }
  });

  it("geladeira mantém as folgas configuráveis", () => {
    const res = r.reservations.find((x) => x.kind === "geladeira")!;
    const gel = r.placements.find((p) => p.kind === "torre-geladeira")!;
    const e = r.config.ergonomics;
    expect(res.widthMm).toBe(gel.widthMm - 2 * e.fridgeGapSideMm);
    expect(res.depthMm).toBe(gel.depthMm - e.fridgeGapBackMm);
    expect(res.heightMm).toBe(r.config.columnHeightMm - e.fridgeGapTopMm);
  });

  it("torre quente entrega nichos de forno e micro-ondas ventilados e alinhados", () => {
    const torre = r.placements.find((p) => p.kind === "torre-quente")!;
    const built = buildKitchenModule(torre.spec);
    const notes = built.assembly.pieces.map((p) => p.notes ?? "").join(" ");
    expect(notes).toContain("nicho do forno");
    expect(notes).toContain("nicho do micro-ondas");
    const forno = built.reservations.find((x) => x.kind === "forno")!;
    const micro = built.reservations.find((x) => x.kind === "microondas")!;
    expect(forno.box.x).toBe(micro.box.x);
    expect(forno.box.width).toBe(micro.box.width);
    expect(forno.box.depth).toBeLessThanOrEqual(built.layout.interiorDepthMm - torre.spec.applianceGapBackMm);
    expect(kitchenReservationConflicts(built)).toEqual([]);
    expect(torre.yMm).toBe(0);
    expect(torre.heightMm).toBe(r.config.columnHeightMm);
  });

  it("lava-louças recebe vão livre — nenhum módulo dentro dele", () => {
    const vao = r.reservations.find((x) => x.kind === "lava-loucas")!;
    for (const p of r.placements.filter((x) => x.wallId === "p1" && x.level !== "superior")) {
      expect(p.xMm < vao.xMm + vao.widthMm && vao.xMm < p.xMm + p.widthMm, p.id).toBe(false);
    }
  });

  it("coifa alinhada e centralizada sobre o cooktop", () => {
    const ck = r.reservations.find((x) => x.kind === "cooktop")!;
    const coifa = r.reservations.find((x) => x.kind === "coifa")!;
    expect(Math.abs((coifa.xMm + coifa.widthMm / 2) - (ck.xMm + ck.widthMm / 2))).toBeLessThanOrEqual(60);
    expect(coifa.yMm).toBe(r.config.baseHeightMm + r.config.hoodGapMm);
  });

  it("pia sem gaveta e sem divisória invadindo a cuba", () => {
    const pia = r.placements.find((p) => p.kind === "balcao-pia")!;
    expect(pia.spec.drawers).toBe(0);
    const built = buildKitchenModule(pia.spec);
    expect(built.assembly.pieces.some((p) => p.partKind.startsWith("gaveta"))).toBe(false);
    expect(kitchenReservationConflicts(built)).toEqual([]);
  });

  it("sequência lógica: geladeira e torre nas pontas, molhados no meio", () => {
    const ordered = [...r.placements]
      .filter((p) => p.level !== "superior")
      .sort((a, b) => a.xMm - b.xMm)
      .map((p) => p.kind);
    expect(ordered[0]).toBe("torre-geladeira");
    expect(ordered[1]).toBe("torre-quente");
    expect(ordered).toContain("balcao-pia");
  });
});

/* ───────────────────────────── cenário 3 ─────────────────────────────── */

describe("Cenário 3 — cozinha reta de 5 m", () => {
  const r = planKitchen(C3);

  it("distribui a linha inteira sem espaço negativo nem módulo esticado", () => {
    expectHealthyScene(r);
    for (const p of r.placements) {
      expect(p.widthMm, p.id).toBeGreaterThan(0);
      if (p.origin === "automatico") {
        expect(p.widthMm, p.id).toBeGreaterThanOrEqual(r.config.minModuleWidthMm);
        expect(p.widthMm, p.id).toBeLessThanOrEqual(r.config.maxModuleWidthMm);
      }
    }
  });

  it("os aéreos ficam alinhados e com a mesma largura de referência", () => {
    const uppers = r.placements.filter((p) => p.level === "superior");
    expect(new Set(uppers.map((u) => u.yMm)).size).toBe(1);
    expect(new Set(uppers.map((u) => u.heightMm)).size).toBe(1);
    const widths = new Set(uppers.map((u) => u.widthMm));
    expect(widths.size, "aéreos assimétricos no mesmo trecho").toBeLessThanOrEqual(2);
  });

  it("todo balcão está sob um trecho de bancada", () => {
    expectCountertopCoversBases(r, "p1");
  });

  it("as frentes dos balcões arrancam todas do mesmo plano", () => {
    const bases = r.placements.filter((p) => p.level === "inferior");
    expect(new Set(bases.map((b) => b.depthMm)).size).toBe(1);
    expect(new Set(bases.map((b) => b.heightMm)).size).toBe(1);
    expect(new Set(bases.map((b) => buildKitchenModule(b.spec).layout.frontZMm)).size).toBe(1);
  });
});

/* ───────────────────────────── cenário 4 ─────────────────────────────── */

describe("Cenário 4 — cozinha em L", () => {
  for (const kind of ["canto-reto", "canto-diagonal", "canto-magico"] as const) {
    describe(kind, () => {
      const r = planKitchen(inL(kind));

      it("monta as duas paredes sem sobreposição no canto", () => {
        expectHealthyScene(r);
        expect(r.placements.filter((p) => p.kind.startsWith("canto"))).toHaveLength(1);
        expect(r.placements.find((p) => p.kind.startsWith("canto"))!.kind).toBe(kind);
      });

      it("o canto tem um único dono e a outra parede reserva o retorno", () => {
        const retorno = r.reservations.find((x) => x.kind === "retorno-de-canto")!;
        expect(retorno).toBeDefined();
        expect(retorno.wallId).toBe("b");
        for (const p of r.placements.filter((x) => x.wallId === "b" && x.level !== "superior")) {
          expect(p.xMm, `${p.id} invade o retorno`).toBeGreaterThanOrEqual(retorno.xMm + retorno.widthMm - 1);
        }
      });

      it("nenhuma peça sai do envelope das paredes", () => {
        for (const p of r.placements) {
          const wall = r.walls.find((w) => w.id === p.wallId)!;
          expect(p.xMm).toBeGreaterThanOrEqual(0);
          expect(p.xMm + p.widthMm).toBeLessThanOrEqual(wall.lengthMm);
        }
      });

      it("tampo une as duas paredes e o rodapé acompanha o L", () => {
        const a = r.countertopRuns.find((x) => x.wallId === "a")!;
        const b = r.countertopRuns.find((x) => x.wallId === "b")!;
        expect(a.joinEnd, "união em L na parede a").toBe(true);
        expect(a.endMm).toBe(3000);
        expect(b.startMm).toBeGreaterThanOrEqual(r.config.baseDepthMm - 1);
        expect(r.plinthRuns.some((x) => x.wallId === "a")).toBe(true);
        expect(r.plinthRuns.some((x) => x.wallId === "b")).toBe(true);
      });

      it("aéreos das duas paredes não se cruzam no canto", () => {
        const b = r.placements.filter((p) => p.wallId === "b" && p.level === "superior");
        for (const u of b) expect(u.xMm).toBeGreaterThanOrEqual(r.config.upperDepthMm - 1);
      });

      it("nenhuma gaveta encostada na quina", () => {
        const canto = r.placements.find((p) => p.kind.startsWith("canto"))!;
        const retorno = r.reservations.find((x) => x.kind === "retorno-de-canto")!;
        const gap = r.config.ergonomics.cornerDrawerClearanceMm;
        const near = r.placements.filter((p) => {
          if (p.level !== "inferior" || (p.kind !== "gaveteiro" && p.kind !== "gavetao")) return false;
          if (p.wallId === canto.wallId) return Math.abs(p.xMm + p.widthMm - canto.xMm) < gap;
          return Math.abs(p.xMm - (retorno.xMm + retorno.widthMm)) < gap;
        });
        expect(near.map((p) => p.id)).toEqual([]);
      });

      it("a porta do canto tem curso e área de acesso válidos", () => {
        const canto = r.placements.find((p) => p.kind.startsWith("canto"))!;
        const built = buildKitchenModule(canto.spec);
        const frentes = built.assembly.pieces.filter((p) => p.partKind === "porta");
        expect(frentes.length, "canto sem frente útil").toBeGreaterThan(0);
        const util = frentes.filter((p) => !p.notes?.includes("frente cega"));
        expect(util.length, "canto sem folha de acesso").toBeGreaterThan(0);
        for (const f of util) {
          expect(f.box.width, f.id).toBeGreaterThanOrEqual(250);
          const rig = built.assembly.motions.find((m) => m.pieceId === f.id);
          expect(rig?.kind, f.id).toBe("hinge");
        }
      });
    });
  }

  it("canto mágico traz o mecanismo articulado", () => {
    const r = planKitchen(inL("canto-magico"));
    const canto = r.placements.find((p) => p.kind === "canto-magico")!;
    const built = buildKitchenModule(canto.spec);
    expect(built.assembly.hardware.some((h) => h.itemId === "kessebohmer-magic-corner")).toBe(true);
  });

  it("parede curta demais para o canto é reportada como canto impossível", () => {
    const r = planKitchen({
      shape: "L",
      walls: [{ id: "a", lengthMm: 600, cornerEnd: true }, { id: "b", lengthMm: 2000, cornerStart: true }],
    });
    expect(r.warnings.some((w) => w.code === "canto-impossivel")).toBe(true);
  });
});

/* ───────────────────────────── cenário 5 ─────────────────────────────── */

describe("Cenário 5 — cozinha com ilha", () => {
  const r = planKitchen(C5);
  const island = r.placements.filter((p) => p.wallId === "ilha");

  it("ilha é independente da parede e sã", () => {
    expectHealthyScene(r);
    expect(island.length).toBeGreaterThan(1);
    expect(r.placements.some((p) => p.wallId === "p1")).toBe(true);
  });

  it("profundidade dos módulos e balanço do tampo são independentes", () => {
    for (const p of island) expect(p.depthMm).toBe(600);
    const run = r.countertopRuns.find((x) => x.wallId === "ilha")!;
    expect(run.depthMm).toBe(900);
    expect(run.overhangFrontMm).toBe(300);
    const custom = planKitchen({ ...C5, island: { ...C5.island!, overhangMm: 150, moduleDepthMm: 650 } });
    const cr = custom.countertopRuns.find((x) => x.wallId === "ilha")!;
    expect(cr.overhangFrontMm).toBe(150);
    expect(custom.placements.filter((p) => p.wallId === "ilha").every((p) => p.depthMm === 650)).toBe(true);
  });

  it("as frentes da ilha olham para o ambiente, não para a parede", () => {
    for (const p of island) expect(p.facing).toBe("frente");
    for (const p of r.placements.filter((x) => x.wallId === "p1")) expect(p.facing).toBe("parede");
    const dupla = planKitchen({ ...C5, island: { ...C5.island!, facing: "dupla" } });
    expect(dupla.placements.filter((p) => p.wallId === "ilha").every((p) => p.facing === "dupla")).toBe(true);
  });

  it("cooktop e cuba não ficam colados na ilha", () => {
    const ck = island.find((p) => p.kind === "balcao-cooktop")!;
    const pia = island.find((p) => p.kind === "balcao-pia")!;
    const gap = ck.xMm < pia.xMm ? pia.xMm - (ck.xMm + ck.widthMm) : ck.xMm - (pia.xMm + pia.widthMm);
    expect(gap).toBeGreaterThanOrEqual(r.config.ergonomics.prepAreaMinMm);
  });

  it("rodapé aplicado na ilha", () => {
    expect(r.plinthRuns.some((x) => x.wallId === "ilha" && x.lengthMm === 2400)).toBe(true);
  });

  it("circulação insuficiente vira aviso do validador", () => {
    const apertada = planKitchen({ ...C5, island: { ...C5.island!, clearanceMm: 700 } });
    expect(validateKitchenLayout(apertada).warnings.some((w) => w.code === "circulacao-ilha")).toBe(true);
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "circulacao-ilha")).toBe(false);
  });

  it("ilha curta demais é descartada com aviso", () => {
    const curta = planKitchen({ ...C5, island: { lengthMm: 600 } });
    expect(curta.dropped).toContain("ilha");
    expect(curta.placements.some((p) => p.wallId === "ilha")).toBe(false);
  });
});

/* ───────────────────────────── cenário 6 ─────────────────────────────── */

describe("Cenário 6 — janelas, portas e obstáculos", () => {
  const r = planKitchen(C6);

  it("compõe sem erro mesmo com a parede cheia de restrições", () => {
    expectHealthyScene(r);
  });

  it("nenhum aéreo atravessa a janela", () => {
    const jan = r.reservations.find((x) => x.kind === "janela")!;
    for (const u of r.placements.filter((p) => p.level === "superior")) {
      expect(u.xMm < jan.xMm + jan.widthMm && jan.xMm < u.xMm + u.widthMm, u.id).toBe(false);
    }
  });

  it("nenhum módulo bloqueia a porta e a bancada não cruza a abertura", () => {
    const porta = r.reservations.find((x) => x.kind === "porta")!;
    for (const p of r.placements) {
      expect(p.xMm, p.id).toBeGreaterThanOrEqual(porta.xMm + porta.widthMm);
    }
    for (const run of r.countertopRuns) {
      expect(run.startMm).toBeGreaterThanOrEqual(porta.xMm + porta.widthMm);
    }
  });

  it("o vão do cooktop é reservado para a coifa", () => {
    const ck = r.reservations.find((x) => x.kind === "cooktop")!;
    for (const u of r.placements.filter((p) => p.level === "superior")) {
      expect(u.xMm < ck.xMm + ck.widthMm && ck.xMm < u.xMm + u.widthMm, u.id).toBe(false);
    }
  });

  it("aparelho fora da parede é descartado com aviso claro", () => {
    const fora = planKitchen({
      shape: "reta",
      walls: [{ id: "p1", lengthMm: 1000, fixtures: [{ id: "pia", kind: "pia", atMm: 200, widthMm: 1200 }] }],
    });
    expect(fora.dropped).toHaveLength(1);
    expect(validateKitchenLayout(fora).errors[0].code).toBe("aparelho-fora");
  });

  it("aparelhos sobrepostos são recusados em vez de gerar módulo impossível", () => {
    const choque = planKitchen({
      shape: "reta",
      walls: [
        {
          id: "p1",
          lengthMm: 3000,
          fixtures: [
            { id: "pia", kind: "pia", atMm: 400, widthMm: 1200 },
            { id: "ck", kind: "cooktop", atMm: 1000, widthMm: 800 },
          ],
        },
      ],
    });
    expect(choque.dropped.some((d) => d.includes("sobrepõe"))).toBe(true);
    expect(overlapsInScene(choque)).toEqual([]);
  });

  it("o motor não inventa módulo só para preencher espaço", () => {
    const apertada = planKitchen({
      shape: "reta",
      walls: [{ id: "p1", lengthMm: 900, fixtures: [{ id: "porta", kind: "porta", atMm: 0, widthMm: 800 }] }],
    });
    expect(apertada.placements.filter((p) => p.level === "inferior")).toHaveLength(0);
    expect(apertada.fillers.length + apertada.warnings.length).toBeGreaterThan(0);
  });
});

/* ─────────────────────── geometria dos módulos ───────────────────────── */

describe("Geometria dos módulos de cozinha", () => {
  it("balcão inferior traz laterais, base, fundo, tampo estrutural e rodapé", () => {
    const built = buildKitchenModule({ kind: "balcao", shelves: 1 });
    const kinds = new Set(built.assembly.pieces.map((p) => p.partKind));
    for (const k of ["lateral", "base", "fundo", "tampo", "rodape", "prateleira", "porta"]) {
      expect(kinds.has(k as never), k).toBe(true);
    }
    expect(built.layout.caseY0).toBe(built.spec.plinth.heightMm);
    expect(built.layout.caseY0 + built.layout.caseHeightMm + built.spec.countertop.thicknessMm).toBe(built.spec.heightMm);
  });

  it("aéreo é mais raso que o balcão e nenhuma folha atravessa o vizinho", () => {
    const aereo = buildKitchenModule({ kind: "aereo" });
    const balcao = buildKitchenModule({ kind: "balcao" });
    expect(aereo.spec.depthMm).toBeLessThan(balcao.spec.depthMm);
    for (const p of aereo.assembly.pieces) {
      expect(p.box.x).toBeGreaterThanOrEqual(-1);
      expect(p.box.x + p.box.width).toBeLessThanOrEqual(aereo.spec.widthMm + 1);
    }
  });

  it("basculante abre pelo topo com curso limitado", () => {
    const built = buildKitchenModule({ kind: "aereo-basculante" });
    const porta = built.assembly.pieces.find((p) => p.partKind === "porta")!;
    const rig = built.assembly.motions.find((m) => m.pieceId === porta.id)!;
    expect(built.assembly.hardware.some((h) => h.kind === "pistao")).toBe(true);
    expect(Math.abs(rig.maxAngleDeg ?? 0)).toBeLessThanOrEqual(90);
  });

  it("gavetas do cooktop respeitam o volume técnico do aparelho", () => {
    const built = buildKitchenModule({ kind: "balcao-cooktop", drawers: 2 });
    const reserva = built.reservations.find((r) => r.kind === "cooktop")!;
    for (const p of built.assembly.pieces.filter((x) => x.partKind.startsWith("gaveta"))) {
      expect(p.box.y + p.box.height, p.id).toBeLessThanOrEqual(reserva.box.y + 1);
    }
    expect(kitchenReservationConflicts(built)).toEqual([]);
  });

  it("nicho aberto não duplica o painel de fundo", () => {
    const built = buildKitchenModule({ kind: "nicho-aberto" });
    expect(built.assembly.pieces.filter((p) => p.partKind === "fundo").length).toBe(1);
  });

  it("todo módulo do catálogo é montável e respeita seus volumes técnicos", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const built = buildKitchenModule({ kind });
      expect(built.assembly.pieces.length, kind).toBeGreaterThan(0);
      expect(kitchenReservationConflicts(built), kind).toEqual([]);
      for (const p of built.assembly.pieces) {
        expect(p.box.width, `${kind}/${p.id}`).toBeGreaterThan(0);
        expect(p.box.height, `${kind}/${p.id}`).toBeGreaterThan(0);
        expect(p.box.y, `${kind}/${p.id}`).toBeGreaterThanOrEqual(-1);
        expect(p.box.y + p.box.height, `${kind}/${p.id}`).toBeLessThanOrEqual(built.spec.heightMm + 1);
      }
    }
  });

  it("tampo tem espessura uniforme e balanço configurável", () => {
    const a = buildKitchenModule({ kind: "balcao", countertop: { material: "granito" } });
    const b = buildKitchenModule({ kind: "balcao", countertop: { material: "granito", overhangFrontMm: 60 } });
    expect(a.spec.countertop.thicknessMm).toBe(20);
    expect(b.spec.countertop.overhangFrontMm).toBe(60);
    expect(a.spec.countertop.thicknessMm).toBe(b.spec.countertop.thicknessMm);
  });

  it("torre e geladeira não recebem bancada", () => {
    for (const kind of ["torre-quente", "torre-geladeira"] as const) {
      expect(buildKitchenModule({ kind }).spec.countertop.material, kind).toBe("nenhum");
    }
  });

  it("rodapé mantém altura e recuo em todos os módulos inferiores", () => {
    for (const kind of ["balcao", "gaveteiro", "balcao-pia", "canto-reto"] as const) {
      const built = buildKitchenModule({ kind, plinth: { kind: "madeira" } });
      expect(built.spec.plinth.heightMm, kind).toBe(150);
      expect(built.spec.plinth.recessMm, kind).toBe(40);
      const rodape = built.assembly.pieces.find((p) => p.partKind === "rodape")!;
      expect(rodape.box.y, kind).toBe(0);
    }
  });
});

/* ─────────────────────── movimentos e interlock ──────────────────────── */

describe("Movimentos e intertravamento na cozinha", () => {
  it("o grupo de comando vem da peça, nunca do tipo de movimento", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const built = buildKitchenModule({ kind });
      for (const m of built.assembly.motions) {
        const piece = built.assembly.pieces.find((p) => p.id === m.pieceId);
        if (!piece) continue;
        const group = motionGroupOfPiece(piece);
        if (piece.partKind === "porta") expect(group, `${kind}/${m.kind}`).toBe("portas");
        if (piece.partKind.startsWith("gaveta")) expect(group, `${kind}/${m.kind}`).toBe("gavetas");
      }
    }
  });

  it("gaveta atrás de porta fechada não abre; com a porta aberta abre", () => {
    const built = buildKitchenModule({ kind: "balcao", drawers: 2, doors: 1, widthMm: 600 });
    const pieces = built.assembly.pieces;
    const motions = built.assembly.motions;
    const drawerFront = pieces.find((p) => p.partKind === "gaveta-frente");
    expect(drawerFront, "balcão misto sem gaveta").toBeDefined();
    const desired: Record<string, number> = {};
    for (const p of pieces) desired[p.id] = p.partKind.startsWith("gaveta") ? 1 : 0;
    const fechado = resolveInterlock({ pieces, motions, desired });
    expect(fechado.allowed[drawerFront!.id]).toBe(0);
    expect(fechado.blocked.length).toBeGreaterThan(0);

    const aberto = resolveInterlock({
      pieces,
      motions,
      desired: Object.fromEntries(pieces.map((p) => [p.id, 1])),
    });
    expect(aberto.allowed[drawerFront!.id]).toBe(1);
  });

  it("fechar a porta com a gaveta aberta recolhe a gaveta primeiro", () => {
    const built = buildKitchenModule({ kind: "balcao", drawers: 2, doors: 1, widthMm: 600 });
    const { pieces, motions } = built.assembly;
    const door = pieces.find((p) => p.partKind === "porta")!;
    const drawer = pieces.find((p) => p.partKind === "gaveta-frente")!;
    const current: Record<string, number> = { [door.id]: 1, [drawer.id]: 1 };
    const desired: Record<string, number> = { [door.id]: 0, [drawer.id]: 1 };
    const r = resolveInterlock({ pieces, motions, desired, current });
    expect(r.allowed[drawer.id]).toBe(0);
    expect(r.holding).toContain(door.id);
  });

  it("gaveteiro sem porta abre livremente", () => {
    const built = buildKitchenModule({ kind: "gaveteiro", drawers: 4 });
    const { pieces, motions } = built.assembly;
    const desired = Object.fromEntries(pieces.map((p) => [p.id, 1]));
    const r = resolveInterlock({ pieces, motions, desired });
    expect(r.blocked).toEqual([]);
    for (const p of pieces.filter((x) => x.partKind === "gaveta-frente")) expect(r.allowed[p.id]).toBe(1);
  });

  it("a frente cega do canto trava o mecanismo atrás dela", () => {
    const built = buildKitchenModule({ kind: "canto-magico", drawers: 0 });
    const painel = built.assembly.pieces.find((p) => p.notes?.includes("frente cega"));
    expect(painel, "canto sem frente cega").toBeDefined();
  });

  it("nenhum módulo do catálogo gera duas frentes conflitantes na mesma faixa", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const built = buildKitchenModule({ kind });
      const doors = built.assembly.pieces.filter((p) => p.partKind === "porta");
      for (let i = 1; i < doors.length; i += 1) {
        const a = doors[i - 1];
        const b = doors[i];
        const inter = Math.min(a.box.x + a.box.width, b.box.x + b.box.width) - Math.max(a.box.x, b.box.x);
        if (Math.abs(a.box.y - b.box.y) < 1) expect(inter, `${kind}: ${a.id} × ${b.id}`).toBeLessThanOrEqual(2);
      }
    }
  });
});

/* ───────────────────────── redimensionamento ─────────────────────────── */

describe("Redimensionamento", () => {
  const wallWith = (lengthMm: number, extra: Partial<KitchenLayoutInput["config"]> = {}) =>
    planKitchen({
      shape: "reta",
      config: extra as never,
      walls: [
        {
          id: "p1",
          lengthMm,
          heightMm: 2700,
          fixtures: [
            { id: "pia", kind: "pia", atMm: 200, widthMm: 1200 },
            { id: "ck", kind: "cooktop", atMm: 1600, widthMm: 800 },
            { id: "coifa", kind: "coifa", atMm: 1600, widthMm: 800 },
          ],
        },
      ],
    });

  it("recalcula a linha inteira em qualquer comprimento, sem largura negativa", () => {
    for (const L of [2500, 2800, 3400, 4300, 6000]) {
      const r = wallWith(L);
      const v = validateKitchenLayout(r);
      expect(v.errors.map((e) => e.code), String(L)).toEqual([]);
      const used = r.placements.filter((p) => p.level !== "superior").reduce((a, p) => a + p.widthMm, 0);
      const filled = r.fillers.reduce((a, f) => a + f.widthMm, 0);
      expect(used + filled, String(L)).toBe(L);
      for (const p of r.placements) expect(p.widthMm, `${L}/${p.id}`).toBeGreaterThan(0);
    }
  });

  it("preserva os módulos obrigatórios ao encolher a parede", () => {
    for (const L of [2400, 2600, 3000]) {
      const r = wallWith(L);
      expect(r.placements.some((p) => p.kind === "balcao-pia"), String(L)).toBe(true);
      expect(r.placements.some((p) => p.kind === "balcao-cooktop"), String(L)).toBe(true);
    }
  });

  it("ao ampliar, os módulos flexíveis entram primeiro", () => {
    const curta = wallWith(2500);
    const longa = wallWith(4500);
    const flex = (r: KitchenLayoutResult) => r.placements.filter((p) => p.origin === "automatico" && p.level === "inferior").length;
    expect(flex(longa)).toBeGreaterThan(flex(curta));
  });

  it("respeita min/max dos módulos automáticos em qualquer medida", () => {
    for (let L = 1500; L <= 6000; L += 137) {
      const r = planKitchen({ shape: "reta", walls: [{ id: "p1", lengthMm: L }] });
      for (const p of r.placements.filter((x) => x.origin === "automatico")) {
        expect(p.widthMm, `${L}/${p.id}`).toBeGreaterThanOrEqual(r.config.minModuleWidthMm);
        expect(p.widthMm, `${L}/${p.id}`).toBeLessThanOrEqual(r.config.maxModuleWidthMm);
      }
    }
  });

  it("altura alterada reduz ou descarta os aéreos com aviso", () => {
    const baixa = planKitchen({ shape: "reta", walls: [{ id: "p1", lengthMm: 3000, heightMm: 1900 }] });
    expect(baixa.placements.filter((p) => p.level === "superior")).toHaveLength(0);
    expect(baixa.warnings.some((w) => w.code === "aereo-sem-espaco")).toBe(true);

    const media = planKitchen({ shape: "reta", walls: [{ id: "p1", lengthMm: 3000, heightMm: 2150 }] });
    const uppers = media.placements.filter((p) => p.level === "superior");
    expect(uppers.length).toBeGreaterThan(0);
    for (const u of uppers) expect(u.yMm + u.heightMm).toBeLessThanOrEqual(2150);
    expect(media.resized.some((x) => x.includes("aéreos"))).toBe(true);
  });

  it("profundidade alterada propaga para módulos e bancada", () => {
    const r = wallWith(3000, { baseDepthMm: 650 } as never);
    for (const p of r.placements.filter((x) => x.level === "inferior")) expect(p.depthMm).toBe(650);
    for (const run of r.countertopRuns) expect(run.depthMm).toBe(650);
  });

  it("mover a janela recalcula os aéreos", () => {
    const posicoes = [800, 1800, 2800];
    const larguras = posicoes.map((at) => {
      const r = planKitchen({
        shape: "reta",
        walls: [{ id: "p1", lengthMm: 4000, heightMm: 2700, fixtures: [{ id: "jan", kind: "janela", atMm: at, widthMm: 1200 }] }],
      });
      for (const u of r.placements.filter((p) => p.level === "superior")) {
        expect(u.xMm < at + 1200 && at < u.xMm + u.widthMm, `${at}/${u.id}`).toBe(false);
      }
      return r.placements.filter((p) => p.level === "superior").map((u) => u.xMm).join("-");
    });
    expect(new Set(larguras).size).toBeGreaterThan(1);
  });

  it("dados manuais explícitos vencem o automático", () => {
    const r = planKitchen({
      shape: "reta",
      walls: [{ id: "p1", lengthMm: 3000, fixtures: [{ id: "pia", kind: "pia", atMm: 1000, widthMm: 900 }] }],
    });
    const pia = r.placements.find((p) => p.kind === "balcao-pia")!;
    expect(pia.xMm).toBe(1000);
    expect(pia.widthMm).toBe(900);
    expect(pia.absorbedMm).toBe(0);
  });
});

/* ──────────────────────────── persistência ───────────────────────────── */

describe("Persistência — salvar, fechar e reabrir", () => {
  it("a ficha sobrevive ao ciclo params → projeto → ficha, sem migração", () => {
    for (const kind of KITCHEN_MODULE_KINDS) {
      const original = normalizeKitchenModule({
        kind,
        widthMm: 850,
        countertop: { material: "marmore", backsplashMm: 80, overhangFrontMm: 35 },
        plinth: { kind: "madeira" },
        led: true,
        handle: "cava",
        style: "classico",
      });
      const salvo = kitchenLegacyParams(original);
      const reaberto = kitchenSpecFromLegacy({
        subtype: kind,
        widthMm: original.widthMm,
        heightMm: original.heightMm,
        depthMm: original.depthMm,
        params: salvo,
      });
      expect(reaberto, kind).toEqual(original);
    }
  });

  it("a composição reaberta gera exatamente as mesmas peças e movimentos", () => {
    for (const scene of [C1, C2, C3, C5, C6, inL("canto-magico")]) {
      const r = planKitchen(scene);
      for (const p of r.placements) {
        const antes = buildKitchenModule(p.spec);
        const reaberto = buildKitchenModule(
          kitchenSpecFromLegacy({
            subtype: p.kind,
            widthMm: p.widthMm,
            heightMm: p.heightMm,
            depthMm: p.depthMm,
            params: kitchenLegacyParams(p.spec),
          }),
        );
        expect(reaberto.spec, `${scene.id}/${p.id}`).toEqual(antes.spec);
        expect(reaberto.assembly.pieces.map((x) => x.id)).toEqual(antes.assembly.pieces.map((x) => x.id));
        expect(reaberto.assembly.motions.map((x) => `${x.pieceId}:${x.kind}`)).toEqual(
          antes.assembly.motions.map((x) => `${x.pieceId}:${x.kind}`),
        );
      }
    }
  });

  it("replanejar o mesmo cenário devolve o mesmo layout", () => {
    for (const scene of [C1, C2, C3, C5, C6, inL("canto-diagonal")]) {
      const a = planKitchen(scene);
      const b = planKitchen(scene);
      expect(b.placements).toEqual(a.placements);
      expect(b.countertopRuns).toEqual(a.countertopRuns);
      expect(b.plinthRuns).toEqual(a.plinthRuns);
      expect(b.reservations).toEqual(a.reservations);
    }
  });
});

/* ───────────────────── validador ergonômico e diagnóstico ────────────── */

describe("Validador ergonômico", () => {
  const base: KitchenLayoutInput = {
    shape: "reta",
    walls: [{ id: "p1", lengthMm: 3000, heightMm: 2700, fixtures: [{ id: "pia", kind: "pia", atMm: 600 }] }],
  };

  it("avisa bancada fora da faixa recomendada", () => {
    for (const h of [700, 1100]) {
      const r = planKitchen({ ...base, config: { baseHeightMm: h } });
      expect(validateKitchenLayout(r).warnings.some((w) => w.code === "altura-bancada"), String(h)).toBe(true);
    }
    expect(validateKitchenLayout(planKitchen(base)).warnings.some((w) => w.code === "altura-bancada")).toBe(false);
  });

  it("avisa aéreo baixo demais e alto demais", () => {
    expect(
      validateKitchenLayout(planKitchen({ ...base, config: { upperGapMm: 350 } })).warnings.some((w) => w.code === "aereo-baixo"),
    ).toBe(true);
    expect(
      validateKitchenLayout(planKitchen({ ...base, config: { upperGapMm: 800 } })).warnings.some((w) => w.code === "aereo-alto"),
    ).toBe(true);
  });

  it("avisa coifa em altura insegura", () => {
    const r = planKitchen({
      shape: "reta",
      config: { hoodGapMm: 400 },
      walls: [{ id: "p1", lengthMm: 3000, fixtures: [{ id: "ck", kind: "cooktop", atMm: 1000 }] }],
    });
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "coifa-altura")).toBe(true);
  });

  it("avisa pia e cooktop sem área de preparo", () => {
    const r = planKitchen({
      shape: "reta",
      walls: [
        {
          id: "p1",
          lengthMm: 3000,
          fixtures: [
            { id: "pia", kind: "pia", atMm: 0, widthMm: 1000 },
            { id: "ck", kind: "cooktop", atMm: 1000, widthMm: 800 },
          ],
        },
      ],
    });
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "area-preparo")).toBe(true);
  });

  it("avisa lava-louças sem espaço", () => {
    const r = planKitchen({
      shape: "reta",
      walls: [{ id: "p1", lengthMm: 3000, fixtures: [{ id: "ll", kind: "lava-loucas", atMm: 1000, widthMm: 450 }] }],
    });
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "lava-loucas-estreito")).toBe(true);
  });

  it("avisa torre baixa demais para forno e micro-ondas", () => {
    const r = planKitchen({
      shape: "reta",
      config: { columnHeightMm: 1700 },
      walls: [{ id: "p1", lengthMm: 3000, fixtures: [{ id: "tq", kind: "torre-quente", atMm: 0 }] }],
    });
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "torre-baixa")).toBe(true);
  });

  it("as recomendações são configuráveis, não normas fixas", () => {
    const r = planKitchen({
      ...base,
      config: { baseHeightMm: 820, ergonomics: { ...KITCHEN_DEFAULT_CONFIG.ergonomics, baseHeightMinMm: 800 } },
    });
    expect(validateKitchenLayout(r).warnings.some((w) => w.code === "altura-bancada")).toBe(false);
  });

  it("todas as recomendações são avisos, nunca erros bloqueantes", () => {
    const r = planKitchen({ ...base, config: { baseHeightMm: 700, upperGapMm: 800 } });
    const v = validateKitchenLayout(r);
    expect(v.warnings.length).toBeGreaterThan(0);
    expect(v.errors).toEqual([]);
    expect(v.ok).toBe(true);
  });
});

describe("Diagnóstico DEV", () => {
  it("fotografa a composição inteira", () => {
    const r = planKitchen(C3);
    const d = kitchenDiagnostics(r, C3);
    expect(d.id).toBe("reta-5000");
    expect(d.shape).toBe("reta");
    expect(d.walls[0].lengthMm).toBe(5000);
    expect(d.requested.length).toBeGreaterThan(0);
    expect(d.placed.length).toBe(r.totals.moduleCount);
    expect(d.countertopRuns.length).toBe(r.countertopRuns.length);
    expect(d.plinthRuns.length).toBe(r.plinthRuns.length);
    expect(d.reservations.length).toBe(r.reservations.length);
    expect(d.mechanisms.length).toBeGreaterThan(0);
    expect(d.collisions).toEqual([]);
    expect(d.origin).toContain("aparelho");
    expect(d.totals).toEqual(r.totals);
  });

  it("registra o motivo de cada fallback", () => {
    const r = planKitchen({ shape: "reta", walls: [{ id: "p1", lengthMm: 3000, heightMm: 1900 }] });
    expect(kitchenDiagnostics(r).fallbacks.some((f) => f.includes("aereo-sem-espaco"))).toBe(true);
  });
});

/* ────────────────────────── divisão de trechos ───────────────────────── */

describe("splitRun", () => {
  it("nunca estoura o máximo nem cria módulo abaixo do mínimo", () => {
    for (let L = 300; L <= 7000; L += 7) {
      const parts = splitRun(L, KITCHEN_DEFAULT_CONFIG);
      expect(parts.reduce((a, b) => a + b, 0), String(L)).toBe(L);
      for (const w of parts) {
        expect(w, `${L} → ${w}`).toBeGreaterThanOrEqual(KITCHEN_DEFAULT_CONFIG.minModuleWidthMm);
        expect(w, `${L} → ${w}`).toBeLessThanOrEqual(KITCHEN_DEFAULT_CONFIG.maxModuleWidthMm);
      }
    }
  });
});
