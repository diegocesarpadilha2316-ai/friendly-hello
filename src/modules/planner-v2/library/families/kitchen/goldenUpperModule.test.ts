import { describe, expect, it } from "vitest";
import "../../index";
import { buildModule } from "../../services/buildModule";
import { HardwareRegistry } from "../../registry/HardwareRegistry";
import { MaterialRegistry } from "../../registry/MaterialRegistry";

const room = { widthMm: 6000, depthMm: 5000, heightMm: 3000 };
const request = {
  instanceId: "golden-upper-800-test",
  moduleId: "kitchen-golden-upper-800",
  dimensionsMm: { width: 800, height: 700, depth: 350 },
  positionMm: { x: 0, y: 1500, z: -1600 },
  materialId: "mdf-freijo",
  hardwareOverrides: { handle: "handle-cava", hinge: "hinge-soft-close" },
  room,
};

describe("Golden Module — Aéreo 800×700×350 mm", () => {
  it("constrói sem erro e preserva as dimensões solicitadas", () => {
    const outcome = buildModule(request);
    expect(outcome.ok, outcome.error).toBe(true);
    expect(outcome.dimensionsMm).toEqual({ width: 800, height: 700, depth: 350 });
    expect(outcome.validation?.valid).toBe(true);
    expect(outcome.parts.every((part) => part.parentInstanceId === request.instanceId)).toBe(true);
  });

  it("gera caixa estrutural completa com laterais, base, topo, fundo e três prateleiras", () => {
    const outcome = buildModule(request);
    const parts = outcome.parts;
    expect(parts.filter((part) => part.role === "side-left")).toHaveLength(1);
    expect(parts.filter((part) => part.role === "side-right")).toHaveLength(1);
    expect(parts.filter((part) => part.role === "base")).toHaveLength(1);
    expect(parts.filter((part) => part.role === "top")).toHaveLength(1);
    expect(parts.filter((part) => part.role === "back")).toHaveLength(1);
    const shelves = parts.filter((part) => part.role === "shelf");
    expect(shelves).toHaveLength(3);
    expect(shelves.every((part) => part.dimensionsMm.width === 762)).toBe(true);
    expect(shelves.every((part) => part.dimensionsMm.height === 18)).toBe(true);
    expect(shelves.every((part) => part.dimensionsMm.depth === 330)).toBe(true);
    expect(parts.find((part) => part.role === "back")?.dimensionsMm).toEqual({ width: 764, height: 664, depth: 6 });
  });

  it("calcula duas portas com folgas perimetrais e encontro central", () => {
    const outcome = buildModule(request);
    const doors = outcome.parts.filter((part) => part.role === "door");
    expect(doors).toHaveLength(2);
    expect(doors.every((part) => part.dimensionsMm.width === 396)).toBe(true);
    expect(doors.every((part) => part.dimensionsMm.height === 696)).toBe(true);
    expect(doors.every((part) => part.dimensionsMm.depth === 18)).toBe(true);
    expect(doors.map((part) => part.positionMm.x)).toEqual([-200, 198]);
    expect(doors.every((part) => part.clearanceMm === 8)).toBe(true);
    expect(doors.every((part) => part.interactive?.type === "door" && part.pivotMm)).toBe(true);
  });

  it("aplica ferragens paramétricas reais e materiais válidos", () => {
    const outcome = buildModule(request);
    const handles = outcome.parts.filter((part) => part.hardwareId === "handle-cava");
    const hinges = outcome.parts.filter((part) => part.role === "hardware" && part.hardwareId === "hinge-soft-close");
    expect(handles).toHaveLength(2);
    expect(hinges).toHaveLength(2);
    expect(handles.every((part) => part.hardwareGeometry?.kind === "cava")).toBe(true);
    expect(MaterialRegistry.has("mdf-freijo")).toBe(true);
    expect(HardwareRegistry.get("handle-cava")?.dimensionsMm.depth).toBeGreaterThan(0);
    expect(outcome.parts.filter((part) => part.role === "door").every((part) => part.grainDirection === "vertical")).toBe(true);
    expect(outcome.parts.filter((part) => part.role === "shelf").every((part) => part.grainDirection === "horizontal")).toBe(true);
  });

  it("não cria rodapé ou pés em módulo aéreo e mantém IDs únicos", () => {
    const outcome = buildModule(request);
    expect(outcome.parts.some((part) => part.role === "toe-kick")).toBe(false);
    expect(outcome.parts.some((part) => part.name === "Pé regulável")).toBe(false);
    expect(new Set(outcome.parts.map((part) => part.id)).size).toBe(outcome.parts.length);
  });
});

function validateGoldenModuleMath() {
  const panel = 18;
  const back = 6;
  const width = 800;
  const height = 700;
  const depth = 350;
  const doorGap = 2;
  const innerWidth = width - panel * 2;
  const innerHeight = height - panel * 2;
  const doorWidth = (width - doorGap * 2) / 2 - doorGap;
  return { panel, back, width, height, depth, innerWidth, innerHeight, doorWidth };
}

it("documenta a auditoria matemática independente do Golden Module", () => {
  expect(validateGoldenModuleMath()).toEqual({ panel: 18, back: 6, width: 800, height: 700, depth: 350, innerWidth: 764, innerHeight: 664, doorWidth: 396 });
});

it("recalcula espessuras sem escalar o móvel externo", () => {
  const thin = buildModule({ ...request, instanceId: "golden-upper-15", thicknessMm: { panelMm: 15, doorMm: 15, shelfMm: 15, backMm: 6 } });
  const thick = buildModule({ ...request, instanceId: "golden-upper-25", thicknessMm: { panelMm: 25, doorMm: 25, shelfMm: 25, backMm: 9 } });
  expect(thin.ok).toBe(true);
  expect(thick.ok).toBe(true);
  expect(thin.dimensionsMm).toEqual(request.dimensionsMm);
  expect(thick.dimensionsMm).toEqual(request.dimensionsMm);
  expect(thin.parts.find((part) => part.role === "side-left")?.dimensionsMm.width).toBe(15);
  expect(thick.parts.find((part) => part.role === "side-left")?.dimensionsMm.width).toBe(25);
  expect(thin.parts.find((part) => part.role === "door")?.dimensionsMm.depth).toBe(15);
  expect(thick.parts.find((part) => part.role === "door")?.dimensionsMm.depth).toBe(25);
  expect(thin.parts.find((part) => part.role === "shelf")?.dimensionsMm.height).toBe(15);
  expect(thick.parts.find((part) => part.role === "shelf")?.dimensionsMm.height).toBe(25);
  expect(thin.parts.find((part) => part.role === "back" && part.name === "Fundo")?.dimensionsMm.depth).toBe(6);
  expect(thick.parts.find((part) => part.role === "back" && part.name === "Fundo")?.dimensionsMm.depth).toBe(9);
});
