import { describe, expect, it } from "vitest";
import "../../index";
import { professionalKitchenModules } from "./professionalModules";
import { buildModule } from "../../services/buildModule";
import { findKitchenSnapCandidate } from "../../services/snapKitchen";
import { validateOpeningClearance } from "../../services/validateOpeningClearance";
import type { FurnitureInstance } from "../../contracts/FurnitureInstance";
import { MaterialRegistry } from "../../registry/MaterialRegistry";

describe("Cozinha Profissional V1", () => {
  const room = { widthMm: 6000, depthMm: 5000, heightMm: 3000 };

  it("registra exatamente os 38 módulos profissionais solicitados", () => {
    expect(professionalKitchenModules).toHaveLength(38);
    expect(new Set(professionalKitchenModules.map((module) => module.id)).size).toBe(38);
  });

  it.each(professionalKitchenModules.map((module) => [module.name, module] as const))("constrói %s por peças independentes", (_name, module) => {
    const outcome = buildModule({
      instanceId: `test-${module.id}`,
      moduleId: module.id,
      dimensionsMm: module.defaultDimensionsMm,
      positionMm: { x: 0, y: module.kind === "upper" ? 1500 : 0, z: 0 },
      room,
      instances: [],
    });

    expect(outcome.ok, outcome.error).toBe(true);
    expect(outcome.parts.length).toBeGreaterThan(0);
    expect(new Set(outcome.parts.map((part) => part.id)).size).toBe(outcome.parts.length);
    expect(outcome.parts.every((part) => part.parentInstanceId === `test-${module.id}`)).toBe(true);
  });

  it("gera caixa completa para gavetas, zona de pia e recorte de cooktop", () => {
    const drawer = buildModule({ instanceId: "drawer", moduleId: "kitchen-drawer-4", room });
    const sink = buildModule({ instanceId: "sink", moduleId: "kitchen-sink-cabinet", room });
    const cooktop = buildModule({ instanceId: "cooktop", moduleId: "kitchen-cooktop-cabinet", room });

    expect(drawer.parts.filter((part) => part.role === "drawer-side")).toHaveLength(8);
    expect(drawer.parts.some((part) => part.name.includes("Traseira gaveta"))).toBe(true);
    expect(sink.parts.some((part) => part.name.includes("Zona técnica"))).toBe(true);
    expect(cooktop.parts.some((part) => part.name.includes("Recorte técnico"))).toBe(true);
  });

  it("classifica volumes e mantém a trajetória de abertura verificável", () => {
    const drawer = buildModule({ instanceId: "volume-drawer", moduleId: "kitchen-drawer-4", room });
    const flapModule = professionalKitchenModules.find((module) => module.name.toLowerCase().includes("basculante"));
    const flap = flapModule ? buildModule({ instanceId: "volume-flap", moduleId: flapModule.id, room }) : null;
    expect(drawer.parts.filter((part) => part.interactive?.type === "drawer").every((part) => part.volumeType === "opening")).toBe(true);
    expect(drawer.parts.some((part) => part.volumeType === "technical")).toBe(true);
    expect(flap?.parts.some((part) => part.interactive?.type === "flap" && part.volumeType === "opening")).toBe(true);

    const first = {
      id: "opening-a",
      moduleDefinitionId: "kitchen-base-2-doors",
      familyId: "kitchen",
      name: "Balcão A",
      dimensionsMm: { width: 800, height: 870, depth: 580 },
      positionMm: { x: 0, y: 0, z: -1200 },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialOverrides: {}, hardwareOverrides: {}, parts: [{
        id: "opening-a:door",
        moduleId: "opening-a",
        parentInstanceId: "opening-a",
        role: "door",
        name: "Porta teste",
        dimensionsMm: { width: 400, height: 700, depth: 18 },
        positionMm: { x: 0, y: 400, z: 0 },
        rotationDeg: { x: 0, y: 0, z: 0 },
        materialId: "mdf-branco",
        volumeType: "opening",
        clearanceMm: 8,
        groupId: "opening-a:door",
        interactive: { type: "door", hingeSide: "left", maxOpenAngleDeg: 95 },
      }],
      visible: true, locked: false, selected: false,
    } as FurnitureInstance;
    const other = {
      ...first,
      id: "opening-b",
      name: "Balcão B",
      positionMm: { x: 300, y: 0, z: -1200 },
      parts: [{
        id: "opening-b:body",
        moduleId: "opening-b",
        parentInstanceId: "opening-b",
        role: "base",
        name: "Corpo vizinho",
        dimensionsMm: { width: 800, height: 870, depth: 580 },
        positionMm: { x: 0, y: 400, z: 140 },
        rotationDeg: { x: 0, y: 0, z: 0 },
        materialId: "mdf-branco",
        volumeType: "physical",
      }],
    } as FurnitureInstance;
    const warnings = validateOpeningClearance(first, [other]);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("colide");
    expect(validateOpeningClearance(first, [other], "opening-a:door")).toHaveLength(1);
  });

  it("preserva pivots de dobradiça em portas e basculante", () => {
    const doors = buildModule({ instanceId: "pivot-doors", moduleId: "kitchen-base-2-doors", room });
    const flapDefinition = professionalKitchenModules.find((module) => module.name.toLowerCase().includes("basculante"));
    const flap = flapDefinition ? buildModule({ instanceId: "pivot-flap", moduleId: flapDefinition.id, room }) : null;
    expect(doors.parts.filter((part) => part.interactive?.type === "door").every((part) => part.pivotMm)).toBe(true);
    expect(flap?.parts.find((part) => part.interactive?.type === "flap")?.pivotMm?.y).toBeGreaterThan(0);
  });

  it("mantém interiores estruturais em torres e cantos", () => {
    const tower = buildModule({ instanceId: "tower-layout", moduleId: "kitchen-tower-oven-microwave", room });
    const corner = buildModule({ instanceId: "corner-pivot", moduleId: "kitchen-corner-base", room });
    expect(tower.parts.filter((part) => part.role === "divider").length).toBeGreaterThanOrEqual(1);
    expect(tower.parts.filter((part) => part.volumeType === "technical").length).toBeGreaterThanOrEqual(2);
    expect(corner.parts.find((part) => part.interactive?.type === "door")?.pivotMm).toBeTruthy();
  });

  it("gera pés reguláveis físicos nos módulos apoiados no piso", () => {
    const base = buildModule({ instanceId: "base-feet", moduleId: "kitchen-base-2-doors", room });
    const upper = buildModule({ instanceId: "upper-no-feet", moduleId: "kitchen-upper-2-doors", room });
    expect(base.parts.filter((part) => part.name === "Pé regulável")).toHaveLength(4);
    expect(upper.parts.filter((part) => part.name === "Pé regulável")).toHaveLength(0);
  });

  it("insere aéreos e bancadas em alturas estruturais coerentes", () => {
    const upper = professionalKitchenModules.find((module) => module.id === "kitchen-upper-2-doors");
    const countertop = professionalKitchenModules.find((module) => module.id === "kitchen-countertop");
    const base = professionalKitchenModules.find((module) => module.id === "kitchen-base-2-doors");
    expect(upper?.placementRules.defaultHeightFromFloorMm).toBe(1500);
    expect(countertop?.placementRules.defaultHeightFromFloorMm).toBe(870);
    expect(base?.placementRules.defaultHeightFromFloorMm ?? 0).toBe(0);
  });

  it("gera ferragens reais de gola e cava como peças paramétricas", () => {
    const gola = buildModule({ instanceId: "gola", moduleId: "kitchen-base-2-doors", hardwareOverrides: { handle: "handle-gola" }, room });
    const cava = buildModule({ instanceId: "cava", moduleId: "kitchen-drawer-4", hardwareOverrides: { handle: "handle-cava" }, room });
    const golaPart = gola.parts.find((part) => part.role === "hardware" && part.hardwareId === "handle-gola");
    const cavaPart = cava.parts.find((part) => part.role === "hardware" && part.hardwareId === "handle-cava");
    expect(golaPart?.hardwareGeometry).toEqual({ kind: "gola", lipMm: 8, recessMm: 16 });
    expect(cavaPart?.hardwareGeometry).toEqual({ kind: "cava", lipMm: 6, recessMm: 12 });
    expect(golaPart?.dimensionsMm.height).toBeGreaterThan(30);
    expect(cavaPart?.dimensionsMm.depth).toBeGreaterThan(18);
  });

  it("expõe presets profissionais de MDF, pedra e metal", () => {
    expect(["mdf-black", "mdf-freijo", "mdf-oak", "mdf-walnut", "stone-granite", "stone-marble", "stone-quartz", "metal-chrome", "metal-brass"].every((id) => Boolean(MaterialRegistry.get(id)))).toBe(true);
  });

  it("encontra Snap entre módulos e para parede dentro da tolerância", () => {
    const make = (id: string, x: number, z: number): FurnitureInstance => ({
      id,
      moduleDefinitionId: "kitchen-base-2-doors",
      familyId: "kitchen",
      name: id,
      dimensionsMm: { width: 800, height: 870, depth: 580 },
      positionMm: { x, y: 0, z },
      rotationDeg: { x: 0, y: 0, z: 0 },
      materialOverrides: {},
      hardwareOverrides: {},
      parts: [],
      visible: true,
      locked: false,
      selected: false,
    });

    const first = make("a", 0, -1200);
    const second = make("b", 815, -1200);
    const candidate = findKitchenSnapCandidate(second, [first], { widthMm: 4800, depthMm: 3800, heightMm: 2700 });
    expect(candidate?.target).toBe("module");
    expect(candidate?.positionMm.x).toBe(800);

    const wall = findKitchenSnapCandidate(make("c", 0, -1595), [], { widthMm: 4800, depthMm: 3800, heightMm: 2700 });
    expect(wall?.target).toBe("back-wall");
    expect(wall?.positionMm.z).toBe(-1600);

    const floorMoving = make("floor", 0, -1200);
    floorMoving.positionMm.y = 8;
    const floor = findKitchenSnapCandidate(floorMoving, [], { widthMm: 4800, depthMm: 3800, heightMm: 2700 });
    expect(floor?.target).toBe("floor");
    expect(floor?.positionMm.y).toBe(0);

    const ceilingMoving = make("ceiling", 0, -1200);
    ceilingMoving.positionMm.y = 1840;
    const ceiling = findKitchenSnapCandidate(ceilingMoving, [], { widthMm: 4800, depthMm: 3800, heightMm: 2700 });
    expect(ceiling?.target).toBe("ceiling");
    expect(ceiling?.positionMm.y).toBe(1830);

    const verticalNeighbor = make("vertical-neighbor", 0, -1200);
    verticalNeighbor.positionMm.y = 0;
    const verticalMoving = make("vertical-moving", 0, -1200);
    verticalMoving.positionMm.y = 878;
    const vertical = findKitchenSnapCandidate(verticalMoving, [verticalNeighbor], { widthMm: 4800, depthMm: 3800, heightMm: 2700 });
    expect(vertical?.target).toBe("module");
    expect(vertical?.positionMm.y).toBe(870);
  });
});
