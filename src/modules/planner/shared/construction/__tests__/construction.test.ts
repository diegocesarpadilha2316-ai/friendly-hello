import { describe, expect, it } from "vitest";
import {
  buildAssembly,
  buildComponent,
  getComponent,
  listComponents,
  repeatAlongX,
  resolveMotion,
  stackAlongY,
} from "../index";

describe("Biblioteca construtiva", () => {
  it("registra os 15 componentes", () => {
    expect(listComponents()).toHaveLength(15);
    for (const id of [
      "porta-abrir",
      "porta-correr",
      "gaveta",
      "frente-gaveta",
      "prateleira",
      "divisoria-vertical",
      "cabideiro",
      "maleiro",
      "nicho",
      "rodape",
      "tampo",
      "lateral",
      "fundo",
      "base",
      "painel",
    ] as const) {
      expect(getComponent(id), id).toBeDefined();
    }
  });

  it("normaliza parâmetros inválidos sem lançar", () => {
    const r = buildComponent("porta-abrir", { widthMm: -50, heightMm: NaN, hingeCount: 99 });
    expect(r.pieces).toHaveLength(1);
    expect(r.pieces[0].box.width).toBeGreaterThan(0);
  });

  it("calcula dobradiças pela altura da porta", () => {
    const alta = buildComponent("porta-abrir", { heightMm: 2400 });
    const baixa = buildComponent("porta-abrir", { heightMm: 700 });
    const q = (r: typeof alta) => r.hardware.find((h) => h.kind === "dobradica")?.qty ?? 0;
    expect(q(alta)).toBeGreaterThan(q(baixa));
  });

  it("gera folhas sobrepostas na porta de correr", () => {
    const r = buildComponent("porta-correr", {
      widthMm: 2700,
      leaves: 3,
      tracks: 3,
      overlapMm: 30,
    });
    expect(r.pieces).toHaveLength(3);
    expect(r.motions.every((m) => m.kind === "slide")).toBe(true);
  });

  it("gaveta desconta folga da corrediça e devolve rig de deslizamento", () => {
    const r = buildComponent("gaveta", { widthMm: 600, depthMm: 500 });
    expect(r.pieces.find((p) => p.partKind === "gaveta-lateral")).toBeDefined();
    expect(r.hardware.some((h) => h.kind === "corredica")).toBe(true);
    expect(r.motions[0].axis).toBe("z");
  });

  it("alerta flecha em prateleira de vão longo", () => {
    const r = buildComponent("prateleira", { widthMm: 1400, thicknessMm: 15, loadKg: 40 });
    expect(r.warnings.some((w) => w.code === "flecha")).toBe(true);
  });

  it("compõe um móvel a partir de componentes reutilizados", () => {
    const asm = buildAssembly({
      id: "teste",
      label: "Composição de teste",
      slots: [
        { id: "lat-e", component: "lateral", at: [0, 0, 0], params: { heightMm: 2400 } },
        { id: "lat-d", component: "lateral", at: [1200, 0, 0], params: { heightMm: 2400 } },
        { id: "fundo", component: "fundo", params: { widthMm: 1200, heightMm: 2400 } },
        ...repeatAlongX(
          { component: "porta-abrir", params: { widthMm: 600, heightMm: 2000 }, role: "porta" },
          2,
          600,
        ),
        ...stackAlongY(
          { component: "gaveta", params: { widthMm: 560 }, role: "gaveta" },
          3,
          220,
          100,
        ),
      ],
    });
    expect(asm.totals.slotCount).toBe(8);
    expect(asm.totals.boardAreaM2).toBeGreaterThan(0);
    expect(asm.hardware.some((h) => h.kind === "corredica")).toBe(true);
    expect(asm.envelope.width).toBeGreaterThan(1000);
  });

  it("resolve transformação de abertura sem animar", () => {
    const r = buildComponent("porta-abrir", { swing: "esquerda", maxAngleDeg: 110 });
    expect(Math.abs(resolveMotion(r.motions[0], 1).rotateDeg[1])).toBeCloseTo(110, 0);
    expect(resolveMotion(r.motions[0], 0).rotateDeg[1]).toBe(0);
  });
});
