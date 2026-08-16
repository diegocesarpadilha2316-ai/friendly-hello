import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { ChatMessage, FurnitureItem, RightTab, SheetHeight, ToolMode } from "../types";
import type { FurnitureInstance } from "../../library/contracts/FurnitureInstance";
import type { DesignIntent } from "../../library/contracts/DesignIntent";
import type { ThicknessProfileMm } from "../../library/contracts/ModuleDefinition";
import { createTestWall, layoutKitchenModules } from "../../library/layout/KitchenLayoutEngine";
import type { LayoutModuleSpec, LayoutPlacement } from "../../library/layout/LayoutTypes";
import { buildModule } from "../../library/services/buildModule";
import { findKitchenSnapCandidate } from "../../library/services/snapKitchen";
import { validateOpeningClearance } from "../../library/services/validateOpeningClearance";
import { ModuleRegistry } from "../../library/registry/ModuleRegistry";
import { useRoomBuilderStore } from "./useRoomBuilderStore";
import { useImmersiveStore } from "./useImmersiveStore";
import {
  clearProjectStorage,
  loadProjectFromStorage,
  saveProjectToStorage,
  serializeProject,
} from "../../library/services/projectPersistence";
import { bootstrapLibrary } from "../../library";

bootstrapLibrary();

function createFurnitureInstanceId(existing: FurnitureInstance[]) {
  const stamp = Date.now();
  let suffix = 0;
  let id = `furniture-${stamp}`;
  while (existing.some((item) => item.id === id)) {
    suffix += 1;
    id = `furniture-${stamp}-${suffix}`;
  }
  return id;
}

function measurementToMm(raw: string, unit?: string) {
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  if (unit === "m") return Math.round(value * 1000);
  if (unit === "cm") return Math.round(value * 10);
  return Math.round(value);
}

function extractDimensionTuple(text: string) {
  const match = text.match(
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(mm|cm|m)?/i,
  );
  if (!match) return null;
  const unit = match[4]?.toLowerCase();
  const raw = [match[1], match[2], match[3]].filter(Boolean) as string[];
  const values = raw.map((value) => {
    if (unit) return measurementToMm(value, unit);
    const numeric = Number(value.replace(",", "."));
    return numeric < 200 ? measurementToMm(value, "cm") : measurementToMm(value);
  });
  if (values.some((value) => value === null)) return null;
  return values as number[];
}

export function moduleIdForNaturalRequest(text: string) {
  const isUpper =
    text.includes("aéreo") ||
    text.includes("aereo") ||
    text.includes("aéreos") ||
    text.includes("aereos");
  if (isUpper) {
    if (text.includes("vitrine") || text.includes("vidro")) return "kitchen-upper-glass-2-doors";
    if (text.includes("micro-ondas")) return "kitchen-upper-microwave";
    if (text.includes("coifa") || text.includes("depurador")) return "kitchen-upper-hood";
    if (text.includes("geladeira")) return "kitchen-upper-over-fridge";
    if (text.includes("nicho") || text.includes("aberto")) return "kitchen-upper-open-niche";
    if (text.includes("3 portas") || text.includes("três portas")) return "kitchen-upper-3-doors";
    if (text.includes("1 porta") || text.includes("uma porta")) return "kitchen-upper-1-door";
    if (text.includes("3 prateleiras") || text.includes("três prateleiras"))
      return "kitchen-golden-upper-800";
    return "kitchen-upper-2-doors";
  }
  if (text.includes("pia") || text.includes("cuba") || text.includes("sink"))
    return "kitchen-sink-cabinet";
  if (text.includes("cooktop") || text.includes("fogão")) return "kitchen-cooktop-cabinet";
  if (text.includes("gaveteiro") || text.includes("gaveta")) {
    if (text.includes("4 gavetas") || text.includes("quatro gavetas")) return "kitchen-drawer-4";
    if (text.includes("2 gavetas") || text.includes("duas gavetas")) return "kitchen-drawer-2";
    if (text.includes("1 gaveta") || text.includes("uma gaveta")) return "kitchen-drawer-1";
    return "kitchen-drawer-3";
  }
  if (text.includes("torre") || text.includes("forno") || text.includes("micro-ondas"))
    return "kitchen-tower-oven-microwave";
  if (text.includes("ilha")) return "kitchen-island-base";
  if (text.includes("balcão") || text.includes("balcao") || text.includes("base"))
    return "kitchen-base-2-doors";
  return null;
}

type KitchenCompositionModuleSpec = LayoutModuleSpec;
type PresetModuleEntry = {
  moduleId: string;
  positionMm: { x: number; y: number; z: number };
  dimensionsMm?: { width: number; height: number; depth: number };
  rotationDeg?: { x: number; y: number; z: number };
  materialId?: string;
  hardwareOverrides?: Record<string, string>;
};

type KitchenCompositionSpec = {
  thicknessMm: { panelMm: number; doorMm: number; shelfMm: number; backMm: number };
  modules: KitchenCompositionModuleSpec[];
  materials: { body: string; front: string; countertop: string };
  hardware: { handle: string; hinge: string; slide: string };
};

export function parseKitchenComposition(text: string): KitchenCompositionSpec | null {
  if (!/(crie|criar|monte|montar).*(cozinha|composição|composicao)/i.test(text)) return null;
  const thicknessMatch = text.match(/mdf[^0-9]*(15|18|25)\s*mm/i);
  const panelMm = thicknessMatch ? Number(thicknessMatch[1]) : 18;
  const thicknessMm = { panelMm, doorMm: panelMm, shelfMm: panelMm, backMm: 6 };
  const bodyMaterial = /freij[oó]/i.test(text)
    ? "mdf-freijo"
    : /grafite/i.test(text)
      ? "mdf-graphite"
      : /verde/i.test(text)
        ? "mdf-green"
        : /amadeirado|madeira/i.test(text)
          ? "mdf-wood-natural"
          : "mdf-white";
  const countertopMaterial = /granito|preto/i.test(text)
    ? "stone-granite"
    : /m[aá]rmore/i.test(text)
      ? "stone-marble"
      : /quartzo/i.test(text)
        ? "stone-quartz"
        : "stone-light";
  const handle = /gola/i.test(text)
    ? "handle-gola"
    : /cava/i.test(text)
      ? "handle-cava"
      : /perfil/i.test(text)
        ? "handle-profile"
        : "handle-bar";
  const materials = { body: bodyMaterial, front: bodyMaterial, countertop: countertopMaterial };
  const hardware = { handle, hinge: "hinge-soft-close", slide: "slide-hidden-soft-close" };
  const widthFrom = (pattern: RegExp, fallback: number) => {
    const match = text.match(pattern);
    return match ? (measurementToMm(match[1], match[2]) ?? fallback) : fallback;
  };
  const modules: KitchenCompositionModuleSpec[] = [];
  const wallId = "wall-test-linear";
  const relation = (
    anchor: "floor" | "wall" | "appliance-zone",
    sequenceIndex: number,
    anchorModuleId?: string,
  ) => ({
    wallId,
    anchor,
    sequenceIndex,
    anchorModuleId,
    alignment: "front" as const,
    clearanceMm: 0,
  });
  const lowerOnlyMarker =
    /(etapa\s*1|m[oó]dulos? inferiores?|somente a engenharia dos m[oó]dulos|sem a[eé]reos?)/i.test(
      text,
    );
  const explicitExclusions =
    /(?:n[aã]o\s+(?:inclua|adicione|quero)|sem)\s+(?:a[eé]reos?|torre|geladeira|frigor[ií]fico|coifa|depurador|cooktop|fog[aã]o|decora[cç][aã]o|planta)/i.test(
      text,
    );
  const lowerOnly =
    lowerOnlyMarker &&
    (explicitExclusions ||
      !/(?:inclua|adicione|quero)\s+(?:a[eé]reos?|torre|geladeira|frigor[ií]fico|coifa|depurador|cooktop|fog[aã]o)/i.test(
        text,
      ));
  if (lowerOnly) {
    const baseWidths = [
      ...text.matchAll(/balc(?:a|ã)o(?!\s+de\s+pia)[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/gi),
    ].map((match) => measurementToMm(match[1], match[2]) ?? 800);
    const baseWidthLeft = baseWidths[0] ?? 800;
    const baseWidthRight = baseWidths[1] ?? baseWidthLeft;
    modules.push({
      id: "etapa1-base-left",
      moduleId: "kitchen-base-2-doors",
      kind: "base",
      dimensionsMm: { width: baseWidthLeft, height: 870, depth: 580 },
      relation: relation("floor", 0),
    });
    modules.push({
      id: "etapa1-drawer",
      moduleId: "kitchen-drawer-4",
      kind: "drawer",
      dimensionsMm: {
        width: widthFrom(/gaveteiro[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 600),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 1),
    });
    modules.push({
      id: "etapa1-sink",
      moduleId: "kitchen-sink-cabinet",
      kind: "sink",
      dimensionsMm: {
        width: widthFrom(/pia[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 1200),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 2),
    });
    modules.push({
      id: "etapa1-base-right",
      moduleId: "kitchen-base-2-doors",
      kind: "base",
      dimensionsMm: { width: baseWidthRight, height: 870, depth: 580 },
      relation: relation("floor", 3),
    });
    return { thicknessMm, modules, materials, hardware };
  }
  if (/(torre|forno|micro-ondas)/i.test(text))
    modules.push({
      id: "natural-tower",
      moduleId: "kitchen-tower-oven-microwave",
      kind: "tower",
      dimensionsMm: {
        width: widthFrom(/torre[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 700),
        height: 2200,
        depth: 620,
      },
      relation: relation("appliance-zone", 0),
    });
  if (/(balcão|balcao).*(\d+)/i.test(text))
    modules.push({
      id: "natural-base",
      moduleId: "kitchen-base-2-doors",
      kind: "base",
      dimensionsMm: {
        width: widthFrom(/balc(?:ão|ao)[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 800),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 1),
    });
  if (/(gaveteiro|gavetas?)/i.test(text))
    modules.push({
      id: "natural-drawer",
      moduleId: /(4\s*gavetas?|quatro\s+gavetas?)/i.test(text)
        ? "kitchen-drawer-4"
        : /(2\s*gavetas?|duas\s+gavetas?)/i.test(text)
          ? "kitchen-drawer-2"
          : /(1\s*gaveta|uma\s+gaveta)/i.test(text)
            ? "kitchen-drawer-1"
            : "kitchen-drawer-3",
      kind: "drawer",
      dimensionsMm: {
        width: widthFrom(/gaveteiro[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 600),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 2),
    });
  if (/(pia|cuba)/i.test(text))
    modules.push({
      id: "natural-sink",
      moduleId: "kitchen-sink-cabinet",
      kind: "sink",
      dimensionsMm: {
        width: widthFrom(/pia[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 1200),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 3),
    });
  if (/(cooktop|fogão)/i.test(text))
    modules.push({
      id: "natural-cooktop",
      moduleId: "kitchen-cooktop-cabinet",
      kind: "cooktop",
      dimensionsMm: {
        width: widthFrom(/cooktop[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 800),
        height: 870,
        depth: 580,
      },
      relation: relation("floor", 4),
    });
  if (/(coifa|depurador)/i.test(text))
    modules.push({
      id: "natural-hood",
      moduleId: "kitchen-upper-hood",
      kind: "hood",
      dimensionsMm: { width: 800, height: 450, depth: 350 },
      relation: relation("wall", 5, "natural-cooktop"),
    });
  if (/(geladeira|frigorífico|fridge)/i.test(text))
    modules.push({
      id: "natural-fridge",
      moduleId: "kitchen-tower-fridge",
      kind: "tower",
      dimensionsMm: {
        width: widthFrom(/geladeira[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i, 900),
        height: 2200,
        depth: 700,
      },
      relation: relation("appliance-zone", 6),
    });
  if (/(aéreos?|aereos?)/i.test(text))
    modules.push({
      id: "natural-upper",
      moduleId: "kitchen-golden-upper-800",
      kind: "upper",
      dimensionsMm: { width: 800, height: 700, depth: 350 },
      relation: relation("wall", 7, "natural-base"),
    });
  return modules.length >= 2 ? { thicknessMm, modules, materials, hardware } : null;
}

export function parseDesignIntent(text: string): DesignIntent | null {
  const composition = parseKitchenComposition(text);
  if (!composition) return null;
  const normalized = text.toLowerCase();
  const requestedOutputs: DesignIntent["requestedOutputs"] = ["scene"];
  if (/render|imagem|vista|visual/i.test(normalized)) requestedOutputs.push("render");
  if (/lista\s+de\s+corte|corte|cut[- ]?list/i.test(normalized)) requestedOutputs.push("cut-list");
  if (/bom|materiais|ferragens|compras/i.test(normalized)) requestedOutputs.push("bom");
  if (/or[cç]amento|custo|pre[cç]o/i.test(normalized)) requestedOutputs.push("budget");
  if (/montagem|assembly|manual/i.test(normalized)) requestedOutputs.push("assembly-report");
  return {
    sourceText: text,
    domain: "kitchen",
    wallId: "wall-test-linear",
    thicknessMm: composition.thicknessMm,
    materials: composition.materials,
    hardware: composition.hardware,
    modules: composition.modules.map((module) => ({
      id: module.id,
      moduleId: module.moduleId,
      kind: (module.kind ?? "base") as DesignIntent["modules"][number]["kind"],
      dimensionsMm: module.dimensionsMm,
      sequenceIndex: module.relation.sequenceIndex,
      anchor: (module.relation.anchor === "countertop"
        ? "floor"
        : module.relation.anchor) as DesignIntent["modules"][number]["anchor"],
    })),
    constraints: {
      noManualPositioning: true,
      requireLayoutEngine: true,
      requireFabricationReport:
        requestedOutputs.includes("cut-list") ||
        requestedOutputs.includes("bom") ||
        /marcenaria|fabric[aá]vel|fabrica[cç][aã]o/i.test(normalized),
    },
    requestedOutputs,
  };
}

interface DragPreviewState {
  moduleId: string;
  positionMm: { x: number; y: number; z: number };
  valid: boolean;
  message: string | null;
  guides: string[];
  snapInfo: string | null;
}

interface PlannerState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  mobileDrawerOpen: boolean;
  mobileSheetOpen: boolean;
  mobileSheetHeight: SheetHeight;
  rightTab: RightTab;
  toolMode: ToolMode;
  gridVisible: boolean;
  lightsEnabled: boolean;
  selectedId: string | null;
  furniture: FurnitureItem[];
  messages: ChatMessage[];
  instances: FurnitureInstance[];
  lastLibraryError: string | null;
  snapEnabled: boolean;
  lastSnapMessage: string | null;
  dragPreview: DragPreviewState | null;
  historyVersion: number;

  toggleLeft: () => void;
  toggleRight: () => void;
  setMobileDrawer: (open: boolean) => void;
  setMobileSheet: (open: boolean) => void;
  setMobileSheetHeight: (height: SheetHeight) => void;
  setRightTab: (tab: RightTab) => void;
  setToolMode: (mode: ToolMode) => void;
  setGridVisible: (value: boolean) => void;
  setLightsEnabled: (value: boolean) => void;
  selectFurniture: (id: string | null) => void;
  updateSelected: (patch: Partial<FurnitureItem>) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleVisibility: (id: string) => void;
  sendMessage: (content: string) => void;

  addFurnitureInstance: (
    moduleId: string,
    positionMm?: { x: number; y: number; z: number },
    dimensionsMm?: { width: number; height: number; depth: number },
    thicknessMm?: ThicknessProfileMm,
    layout?: LayoutPlacement,
  ) => string | null;
  updateFurnitureInstance: (id: string, patch: Partial<FurnitureInstance>) => boolean;
  removeFurnitureInstance: (id: string) => void;
  duplicateFurnitureInstance: (id: string) => void;
  selectFurnitureInstance: (id: string | null) => void;
  hideFurnitureInstance: (id: string) => void;
  showFurnitureInstance: (id: string) => void;
  toggleInstanceAnimation: (id: string, partId?: string) => void;
  openAllAnimations: () => void;
  closeAllAnimations: () => void;
  setInstanceIsolated: (id: string | null) => void;
  toggleInstanceXRay: (id: string) => void;
  showAllInstances: () => void;
  lockFurnitureInstance: (id: string) => void;
  unlockFurnitureInstance: (id: string) => void;
  rebuildFurnitureInstance: (id: string) => void;
  validateFurnitureInstances: () => void;
  clearLibraryError: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  snapFurnitureInstance: (id: string) => void;
  setDragPreview: (moduleId: string, positionMm: { x: number; y: number; z: number }) => void;
  clearDragPreview: () => void;
  dropDragPreview: () => string | null;
  saveProject: () => boolean;
  loadProject: () => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  newProject: () => void;
  applyGoldenKitchen: () => void;
  applyPromobReference: () => void;
  applyGoldenModuleTest: () => void;
}

const initialFurniture: FurnitureItem[] = [
  {
    id: "base-1",
    name: "Armário Base",
    kind: "base",
    visible: true,
    selected: true,
    position: [-2.2, 0.36, -1.7],
    rotationY: 0,
    size: [1.5, 0.72, 0.56],
    material: "taupe",
  },
  {
    id: "base-2",
    name: "Balcão",
    kind: "base",
    visible: true,
    selected: false,
    position: [-0.65, 0.36, -1.7],
    rotationY: 0,
    size: [1.35, 0.72, 0.56],
    material: "taupe",
  },
  {
    id: "tower-1",
    name: "Torre Quente",
    kind: "tower",
    visible: true,
    selected: false,
    position: [2.3, 1.15, -1.7],
    rotationY: 0,
    size: [0.72, 2.3, 0.62],
    material: "wood",
  },
  {
    id: "upper-1",
    name: "Armário Aéreo",
    kind: "upper",
    visible: true,
    selected: false,
    position: [-0.6, 2.0, -1.75],
    rotationY: 0,
    size: [2.6, 0.78, 0.38],
    material: "taupe",
  },
  {
    id: "island-1",
    name: "Ilha Central",
    kind: "island",
    visible: true,
    selected: false,
    position: [0.4, 0.46, 0.25],
    rotationY: 0,
    size: [2.25, 0.92, 0.95],
    material: "stone",
  },
];

const initialMessages: ChatMessage[] = [];

type PlannerHistorySnapshot = Pick<
  PlannerState,
  "furniture" | "instances" | "selectedId" | "gridVisible" | "lightsEnabled" | "snapEnabled"
>;
const historyPast: PlannerHistorySnapshot[] = [];
const historyFuture: PlannerHistorySnapshot[] = [];
let historyApplying = false;

function snapshotPlannerState(state: PlannerState): PlannerHistorySnapshot {
  return {
    furniture: structuredClone(state.furniture),
    instances: structuredClone(state.instances),
    selectedId: state.selectedId,
    gridVisible: state.gridVisible,
    lightsEnabled: state.lightsEnabled,
    snapEnabled: state.snapEnabled,
  };
}

export const usePlannerStore = create<PlannerState>()(
  subscribeWithSelector((set, get) => ({
    leftCollapsed: false,
    rightCollapsed: false,
    mobileDrawerOpen: false,
    mobileSheetOpen: false,
    mobileSheetHeight: 50,
    rightTab: "chat",
    toolMode: "orbit",
    gridVisible: false,
    lightsEnabled: true,
    selectedId: "base-1",
    furniture: initialFurniture,
    messages: initialMessages,
    instances: [],
    lastLibraryError: null,
    snapEnabled: true,
    lastSnapMessage: null,
    dragPreview: null,
    historyVersion: 0,

    toggleLeft: () => set((s) => ({ ...s, leftCollapsed: !s.leftCollapsed })),
    toggleRight: () => set((s) => ({ ...s, rightCollapsed: !s.rightCollapsed })),
    setMobileDrawer: (open) => set((s) => ({ ...s, mobileDrawerOpen: open })),
    setMobileSheet: (open) => set((s) => ({ ...s, mobileSheetOpen: open })),
    setMobileSheetHeight: (height) => set((s) => ({ ...s, mobileSheetHeight: height })),
    setRightTab: (tab) => set((s) => ({ ...s, rightTab: tab })),
    setToolMode: (mode) => set((s) => ({ ...s, toolMode: mode })),
    setGridVisible: (value) => set((s) => ({ ...s, gridVisible: value })),
    setLightsEnabled: (value) => set((s) => ({ ...s, lightsEnabled: value })),

    saveProject: () => {
      const state = get();
      const room = useRoomBuilderStore.getState();
      const immersive = useImmersiveStore.getState();
      saveProjectToStorage(
        serializeProject({
          planner: {
            furniture: state.furniture,
            instances: state.instances,
            selectedId: state.selectedId,
            gridVisible: state.gridVisible,
            lightsEnabled: state.lightsEnabled,
            snapEnabled: state.snapEnabled,
          },
          room,
          immersive: {
            qualityMode: immersive.qualityMode,
            autoOcclusion: immersive.autoOcclusion,
          },
        }),
      );
      if (typeof window !== "undefined")
        window.dispatchEvent(new CustomEvent("dioris:project-saved"));
      return true;
    },

    loadProject: () => {
      const project = loadProjectFromStorage();
      if (!project) return false;
      const room = project.room;
      useRoomBuilderStore.getState().restoreRoom(room);
      const roomBounds = { widthMm: room.width, depthMm: room.depth, heightMm: room.height };
      const restored: FurnitureInstance[] = [];
      for (const saved of project.planner.instances) {
        const outcome = buildModule({
          instanceId: saved.id,
          moduleId: saved.moduleDefinitionId,
          dimensionsMm: saved.dimensionsMm,
          positionMm: saved.positionMm,
          rotationDeg: saved.rotationDeg,
          materialOverrides: saved.materialOverrides,
          hardwareOverrides: saved.hardwareOverrides,
          thicknessMm: saved.thicknessMm,
          room: roomBounds,
          instances: restored,
        });
        if (!outcome.ok) {
          set({
            lastLibraryError: `Projeto não restaurado: ${saved.name} — ${outcome.error ?? "posição inválida"}`,
          });
          return false;
        }
        restored.push({
          ...saved,
          parts: outcome.parts,
          dimensionsMm: outcome.dimensionsMm,
          thicknessMm: outcome.thicknessMm ?? saved.thicknessMm,
          selected: saved.id === project.planner.selectedId,
        });
      }
      set((state) => ({
        ...state,
        furniture: project.planner.furniture,
        instances: restored,
        selectedId: project.planner.selectedId,
        gridVisible: project.planner.gridVisible,
        lightsEnabled: project.planner.lightsEnabled,
        snapEnabled: project.planner.snapEnabled,
        lastLibraryError: null,
      }));
      useImmersiveStore.getState().setQualityMode(project.immersive.qualityMode);
      useImmersiveStore.getState().setAutoOcclusion(project.immersive.autoOcclusion);
      return true;
    },

    undo: () => {
      const previous = historyPast.pop();
      if (!previous) return;
      const current = snapshotPlannerState(get());
      historyFuture.push(current);
      historyApplying = true;
      set((state) => ({
        ...state,
        ...previous,
        historyVersion: state.historyVersion + 1,
        lastLibraryError: null,
      }));
      historyApplying = false;
      get().saveProject();
    },

    redo: () => {
      const next = historyFuture.pop();
      if (!next) return;
      const current = snapshotPlannerState(get());
      historyPast.push(current);
      historyApplying = true;
      set((state) => ({
        ...state,
        ...next,
        historyVersion: state.historyVersion + 1,
        lastLibraryError: null,
      }));
      historyApplying = false;
      get().saveProject();
    },

    canUndo: () => historyPast.length > 0,
    canRedo: () => historyFuture.length > 0,

    newProject: () => {
      // Limpa primeiro as instâncias no store. O RoomBuilder possui autosave e,
      // se for resetado antes, pode persistir o projeto antigo no envelope V4.
      set((state) => ({
        ...state,
        furniture: [],
        instances: [],
        selectedId: null,
        lastLibraryError: null,
        lastSnapMessage: null,
        dragPreview: null,
      }));
      historyPast.length = 0;
      historyFuture.length = 0;
      clearProjectStorage();
      useRoomBuilderStore.getState().resetRoom();
      useImmersiveStore.getState().showAll();
      useImmersiveStore.getState().setNavigationMode("orbit");
    },

    applyGoldenKitchen: () => {
      const before = snapshotPlannerState(get());
      historyApplying = true;
      get().newProject();
      useRoomBuilderStore.getState().applyReferencePreset();
      const modules: PresetModuleEntry[] = [
        {
          moduleId: "kitchen-tower-oven-microwave",
          positionMm: { x: -1900, y: 0, z: -1400 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-profile", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-base-2-doors",
          positionMm: { x: -1120, y: 0, z: -1400 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-profile" },
        },
        {
          moduleId: "kitchen-drawer-3",
          positionMm: { x: -300, y: 0, z: -1400 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-cava", slide: "slide-hidden-soft-close" },
        },
        {
          moduleId: "kitchen-sink-cabinet",
          positionMm: { x: 520, y: 0, z: -1400 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-cooktop-cabinet",
          positionMm: { x: 1320, y: 0, z: -1400 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-profile", slide: "slide-hidden-soft-close" },
        },
        {
          moduleId: "kitchen-base-2-doors",
          positionMm: { x: 1760, y: 0, z: -900 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-profile", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-drawer-3",
          positionMm: { x: 1760, y: 0, z: -220 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-cava", slide: "slide-hidden-soft-close" },
        },
        {
          moduleId: "kitchen-countertop",
          positionMm: { x: 100, y: 870, z: -1400 },
          dimensionsMm: { width: 3240, height: 20, depth: 600 },
          materialId: "stone-quartzite",
        },
        {
          moduleId: "kitchen-countertop",
          positionMm: { x: 1760, y: 870, z: -900 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          dimensionsMm: { width: 800, height: 20, depth: 600 },
          materialId: "stone-quartzite",
        },
        {
          moduleId: "kitchen-countertop",
          positionMm: { x: 1760, y: 870, z: -220 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          dimensionsMm: { width: 600, height: 20, depth: 600 },
          materialId: "stone-quartzite",
        },
        {
          moduleId: "kitchen-upper-2-doors",
          positionMm: { x: -1150, y: 1500, z: -1600 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-upper-glass-2-doors",
          positionMm: { x: -300, y: 1500, z: -1600 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-none" },
        },
        {
          moduleId: "kitchen-upper-2-doors",
          positionMm: { x: 650, y: 1500, z: -1600 },
          materialId: "mdf-freijo",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
      ];
      const createdIds: string[] = [];
      for (const entry of modules) {
        const id = get().addFurnitureInstance(
          entry.moduleId,
          entry.positionMm,
          "dimensionsMm" in entry ? entry.dimensionsMm : undefined,
        );
        if (!id) continue;
        createdIds.push(id);
        const current = get().instances.find((instance) => instance.id === id);
        if (!current) continue;
        get().updateFurnitureInstance(id, {
          rotationDeg: entry.rotationDeg ?? current.rotationDeg,
          materialOverrides: {
            ...current.materialOverrides,
            body: entry.materialId ?? "mdf-freijo",
            front: entry.materialId ?? "mdf-freijo",
            door: entry.materialId ?? "mdf-freijo",
            drawer: entry.materialId ?? "mdf-freijo",
            "drawer-front": entry.materialId ?? "mdf-freijo",
            edge: entry.materialId ?? "mdf-freijo",
            countertop: "stone-quartzite",
          },
        });
      }
      get().selectFurnitureInstance(null);
      historyApplying = false;
      historyPast.push(before);
      historyFuture.length = 0;
      get().saveProject();
      if (createdIds.length === 0)
        set((state) => ({
          ...state,
          lastLibraryError: "Não foi possível montar a Golden Kitchen no espaço atual.",
        }));
    },

    applyPromobReference: () => {
      const before = snapshotPlannerState(get());
      historyApplying = true;
      get().newProject();
      useRoomBuilderStore.getState().applyReferencePreset();
      const modules: PresetModuleEntry[] = [
        {
          moduleId: "kitchen-tower-oven-microwave",
          positionMm: { x: -1900, y: 0, z: -1400 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-profile", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-base-2-doors",
          positionMm: { x: -1250, y: 0, z: -1400 },
          dimensionsMm: { width: 700, height: 700, depth: 580 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-profile" },
        },
        {
          moduleId: "kitchen-drawer-4",
          positionMm: { x: -625, y: 0, z: -1400 },
          dimensionsMm: { width: 500, height: 700, depth: 600 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-cava", slide: "slide-hidden-soft-close" },
        },
        {
          moduleId: "kitchen-sink-cabinet",
          positionMm: { x: 100, y: 0, z: -1400 },
          dimensionsMm: { width: 800, height: 700, depth: 580 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-corner-base",
          positionMm: { x: 850, y: 0, z: -1050 },
          dimensionsMm: { width: 1000, height: 700, depth: 834 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-base-2-doors",
          positionMm: { x: 1350, y: 0, z: -250 },
          dimensionsMm: { width: 800, height: 700, depth: 600 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-profile" },
        },
        {
          moduleId: "kitchen-drawer-3",
          positionMm: { x: 1350, y: 0, z: 450 },
          dimensionsMm: { width: 500, height: 700, depth: 600 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-cava", slide: "slide-hidden-soft-close" },
        },
        {
          moduleId: "kitchen-countertop",
          positionMm: { x: -500, y: 710, z: -1400 },
          dimensionsMm: { width: 2750, height: 20, depth: 600 },
          materialId: "stone-granite",
        },
        {
          moduleId: "kitchen-countertop",
          positionMm: { x: 1350, y: 710, z: -650 },
          rotationDeg: { x: 0, y: 90, z: 0 },
          dimensionsMm: { width: 1900, height: 20, depth: 834 },
          materialId: "stone-granite",
        },
        {
          moduleId: "kitchen-upper-2-doors",
          positionMm: { x: -900, y: 1500, z: -1650 },
          dimensionsMm: { width: 970, height: 700, depth: 400 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
        {
          moduleId: "kitchen-upper-corner",
          positionMm: { x: 700, y: 1500, z: -1650 },
          dimensionsMm: { width: 960, height: 700, depth: 760 },
          materialId: "mdf-graphite",
          hardwareOverrides: { handle: "handle-gola", hinge: "hinge-soft-close" },
        },
      ];
      const createdIds: string[] = [];
      for (const entry of modules) {
        const id = get().addFurnitureInstance(entry.moduleId, entry.positionMm, entry.dimensionsMm);
        if (!id) continue;
        createdIds.push(id);
        const current = get().instances.find((instance) => instance.id === id);
        if (!current) continue;
        get().updateFurnitureInstance(id, {
          rotationDeg: entry.rotationDeg ?? current.rotationDeg,
          materialOverrides: {
            ...current.materialOverrides,
            body: entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-graphite",
            front: entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-green",
            door: entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-green",
            drawer: entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-green",
            "drawer-front": entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-green",
            edge: entry.moduleId === "kitchen-countertop" ? "stone-granite" : "mdf-green",
            countertop: "stone-granite",
          },
          hardwareOverrides: { ...current.hardwareOverrides, ...(entry.hardwareOverrides ?? {}) },
        });
      }
      get().selectFurnitureInstance(null);
      historyApplying = false;
      historyPast.push(before);
      historyFuture.length = 0;
      get().saveProject();
      if (createdIds.length === 0)
        set((state) => ({
          ...state,
          lastLibraryError: "Não foi possível montar a referência Promob.",
        }));
    },

    applyGoldenModuleTest: () => {
      const before = snapshotPlannerState(get());
      historyApplying = true;
      get().newProject();
      useRoomBuilderStore.getState().applyReferencePreset();
      const id = get().addFurnitureInstance(
        "kitchen-golden-upper-800",
        { x: 0, y: 1500, z: -1600 },
        { width: 800, height: 700, depth: 350 },
      );
      if (id) {
        get().updateFurnitureInstance(id, {
          materialOverrides: {
            body: "mdf-freijo",
            front: "mdf-freijo",
            door: "mdf-freijo",
            edge: "mdf-freijo",
          },
          hardwareOverrides: { handle: "handle-cava", hinge: "hinge-soft-close" },
        });
        get().selectFurnitureInstance(id);
      }
      historyApplying = false;
      historyPast.push(before);
      historyFuture.length = 0;
      get().saveProject();
      if (!id)
        set((state) => ({
          ...state,
          lastLibraryError: "Não foi possível criar o Golden Module no espaço atual.",
        }));
    },

    selectFurniture: (id) =>
      set((s) => ({
        ...s,
        selectedId: id,
        furniture: s.furniture.map((item) => ({
          ...item,
          selected: item.id === id,
        })),
      })),

    updateSelected: (patch) =>
      set((s) => ({
        ...s,
        furniture: s.furniture.map((item) =>
          item.id === s.selectedId ? { ...item, ...patch } : item,
        ),
      })),

    duplicateSelected: () => {
      const s = get();
      const selected = s.furniture.find((item) => item.id === s.selectedId);
      if (!selected) return;
      const clone = {
        ...selected,
        id: `${selected.id}-copy-${Date.now()}`,
        name: `${selected.name} (cópia)`,
        position: [
          selected.position[0] + 0.35,
          selected.position[1],
          selected.position[2] + 0.35,
        ] as [number, number, number],
        selected: true,
      };
      set((state) => ({
        ...state,
        selectedId: clone.id,
        furniture: [...state.furniture.map((item) => ({ ...item, selected: false })), clone],
      }));
    },

    deleteSelected: () =>
      set((s) => ({
        ...s,
        furniture: s.furniture.filter((item) => item.id !== s.selectedId),
        selectedId: null,
      })),

    toggleVisibility: (id) =>
      set((s) => ({
        ...s,
        furniture: s.furniture.map((item) =>
          item.id === id ? { ...item, visible: !item.visible } : item,
        ),
      })),

    sendMessage: (content) => {
      const normalized = content.trim().toLowerCase();
      const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      set((s) => ({
        ...s,
        messages: [...s.messages, { id: Date.now().toString(), role: "user", content, time: now }],
      }));
      const reply = (message: string) => {
        const replyTime = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        set((s) => ({
          ...s,
          messages: [
            ...s.messages,
            { id: `assistant-${Date.now()}`, role: "assistant", content: message, time: replyTime },
          ],
        }));
      };
      const selectedId = get().selectedId;
      const selected = selectedId
        ? get().instances.find((instance) => instance.id === selectedId)
        : undefined;

      const selectedDimensionMatch =
        normalized.match(
          /(?:largura|largo|width|altura|alto|height|profundidade|fundo|depth)[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i,
        ) ??
        normalized.match(
          /(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?[^0-9]{0,20}(?:largura|largo|width|altura|alto|height|profundidade|fundo|depth)/i,
        );
      const requestedHandle = /gola/i.test(normalized)
        ? "handle-gola"
        : /cava/i.test(normalized)
          ? "handle-cava"
          : /perfil/i.test(normalized)
            ? "handle-profile"
            : /puxador[^a-z]*(barra|bar)|puxador barra/i.test(normalized)
              ? "handle-bar"
              : null;
      if (selected && (selectedDimensionMatch || requestedHandle)) {
        const patch: Partial<FurnitureInstance> = {};
        if (selectedDimensionMatch) {
          const value = measurementToMm(selectedDimensionMatch[1], selectedDimensionMatch[2]);
          const dimensionPatch = { ...selected.dimensionsMm };
          if (/(largura|largo|width)/i.test(selectedDimensionMatch[0])) dimensionPatch.width = value ?? dimensionPatch.width;
          else if (/(altura|alto|height)/i.test(selectedDimensionMatch[0])) dimensionPatch.height = value ?? dimensionPatch.height;
          else dimensionPatch.depth = value ?? dimensionPatch.depth;
          patch.dimensionsMm = dimensionPatch;
        }
        if (requestedHandle) {
          patch.hardwareOverrides = { ...selected.hardwareOverrides, handle: requestedHandle };
        }
        const ok = get().updateFurnitureInstance(selected.id, patch);
        const current = get().instances.find((instance) => instance.id === selected.id);
        reply(
          ok
            ? `Atualizei ${current?.name ?? "o móvel selecionado"}${selectedDimensionMatch ? ` para ${current?.dimensionsMm.width} × ${current?.dimensionsMm.height} × ${current?.dimensionsMm.depth} mm` : ""}${requestedHandle ? ` com puxador ${requestedHandle}` : ""}.`
            : get().lastLibraryError ?? "A alteração foi bloqueada pela validação de medidas e clearance.",
        );
        return;
      }

      const roomMatch = normalized.match(
        /(?:cozinha|sala|ambiente)[^0-9]{0,24}(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(m|cm|mm)/i,
      );
      if (roomMatch) {
        const roomWidth = measurementToMm(roomMatch[1], roomMatch[3]);
        const roomDepth = measurementToMm(roomMatch[2], roomMatch[3]);
        if (roomWidth && roomDepth) {
          useRoomBuilderStore.getState().setDimension("width", roomWidth);
          useRoomBuilderStore.getState().setDimension("depth", roomDepth);
          reply(
            `Configurei a sala para ${roomWidth} × ${roomDepth} mm pelo store oficial de ambiente.`,
          );
          return;
        }
      }

      const compositionSpec = parseKitchenComposition(normalized);
      if (compositionSpec) {
        const roomForLayout = useRoomBuilderStore.getState();
        const wall = createTestWall(roomForLayout.width, roomForLayout.height, roomForLayout.depth);
        const layout = layoutKitchenModules(compositionSpec.modules, wall);
        if (!layout.valid) {
          reply(
            `A composição foi interpretada, mas o Layout Engine bloqueou o placement: ${layout.issues.map((issue) => issue.message).join(" ")}`,
          );
          return;
        }
        const created: string[] = [];
        for (const moduleSpec of compositionSpec.modules) {
          const placement = layout.placements.find((item) => item.moduleId === moduleSpec.id);
          if (!placement) continue;
          const id = get().addFurnitureInstance(
            moduleSpec.moduleId,
            placement.positionMm,
            moduleSpec.dimensionsMm,
            compositionSpec.thicknessMm,
            placement,
          );
          if (id) {
            get().updateFurnitureInstance(id, {
              materialOverrides: {
                body: compositionSpec.materials.body,
                front: compositionSpec.materials.front,
                door: compositionSpec.materials.front,
                drawer: compositionSpec.materials.front,
                "drawer-front": compositionSpec.materials.front,
                edge: compositionSpec.materials.front,
                countertop: compositionSpec.materials.countertop,
              },
              hardwareOverrides:
                compositionSpec.modules.find((item) => item.id === moduleSpec.id)?.kind === "drawer"
                  ? {
                      handle: compositionSpec.hardware.handle,
                      slide: compositionSpec.hardware.slide,
                    }
                  : {
                      handle: compositionSpec.hardware.handle,
                      hinge: compositionSpec.hardware.hinge,
                    },
            });
            created.push(id);
          }
        }
        const isLowerOnlyEtapa1 =
          compositionSpec.modules.length === 4 &&
          compositionSpec.modules.every((module) => module.relation.anchor === "floor") &&
          compositionSpec.modules.every((module) => module.id.startsWith("etapa1-"));
        const countertop = isLowerOnlyEtapa1 ? layout.countertops[0] : undefined;
        if (countertop) {
          const countertopPlacement: LayoutPlacement = {
            moduleId: countertop.id,
            moduleDefinitionId: "kitchen-countertop",
            wallId: countertop.wallId,
            anchor: "countertop",
            sequenceIndex: compositionSpec.modules.length,
            startX: countertop.startX,
            endX: countertop.endX,
            bottomY: countertop.topY,
            topY: countertop.topY + countertop.thicknessMm,
            depthMm: countertop.depthMm,
            positionMm: {
              x: (countertop.startX + countertop.endX) / 2,
              y: countertop.topY,
              z: wall.originMm.z + countertop.depthMm / 2,
            },
            previousModuleId: compositionSpec.modules.at(-1)?.id,
            supported: countertop.supported,
            collision: false,
            clearanceMm: 0,
          };
          const countertopId = get().addFurnitureInstance(
            "kitchen-countertop",
            countertopPlacement.positionMm,
            {
              width: countertop.endX - countertop.startX,
              height: countertop.thicknessMm,
              depth: countertop.depthMm,
            },
            compositionSpec.thicknessMm,
            countertopPlacement,
          );
          if (countertopId) {
            get().updateFurnitureInstance(countertopId, {
              materialOverrides: { countertop: compositionSpec.materials.countertop },
            });
            created.push(countertopId);
          }
        }
        if (created.length === compositionSpec.modules.length + (countertop ? 1 : 0)) {
          const moduleNames = compositionSpec.modules
            .map((module) => ModuleRegistry.get(module.moduleId)?.name ?? module.moduleId)
            .join(", ");
          const hasFabricationRequest =
            /corte|nesting|fabrica[cç][aã]o|marcenaria|bom|ferragens/i.test(normalized);
          const fabricationNotice = hasFabricationRequest
            ? "O Plano de Corte foi recalculado com lista de peças, nesting MaxRects, ferragens e usinagem."
            : "A aba Plano de Corte está disponível para gerar a lista de peças e o nesting deste projeto.";
          reply(
            `Projeto atualizado: ${moduleNames}. Foram construídos ${created.length} elementos com MDF ${compositionSpec.thicknessMm.panelMm} mm; corpo/frentes ${compositionSpec.materials.body}, bancada ${compositionSpec.materials.countertop}, puxador ${compositionSpec.hardware.handle}. ${fabricationNotice}`,
          );
        } else {
          reply(
            `Interpretei ${compositionSpec.modules.length} módulos (${created.length} construídos). Os itens não construídos foram bloqueados pelo Layout Engine para evitar uma fabricação inválida; revise as dimensões ou o espaço disponível.`,
          );
        }
        return;
      }

      const requestedModuleId = moduleIdForNaturalRequest(normalized);
      const requestedDimensions = extractDimensionTuple(normalized);
      const isCreationRequest = /(crie|criar|monte|montar|adicione|adicionar|coloque|insira)/i.test(
        normalized,
      );
      if (requestedModuleId && isCreationRequest && requestedDimensions) {
        const moduleDefinition = ModuleRegistry.get(requestedModuleId);
        const defaults = moduleDefinition?.defaultDimensionsMm ?? {
          width: 800,
          height: 870,
          depth: 580,
        };
        const [width, height, depth] = requestedDimensions;
        const instanceId = get().addFurnitureInstance(requestedModuleId, undefined, {
          width: width ?? defaults.width,
          height: height ?? defaults.height,
          depth: depth ?? defaults.depth,
        });
        if (instanceId) {
          const definition = ModuleRegistry.get(requestedModuleId);
          const current = get().instances.find((instance) => instance.id === instanceId);
          if (definition && current) {
            reply(
              `Criei ${definition.name} com ${current.dimensionsMm.width} × ${current.dimensionsMm.height} × ${current.dimensionsMm.depth} mm, validado pelo placement oficial.`,
            );
            return;
          }
        }
        reply("Não consegui criar esse módulo sem violar as dimensões ou o clearance da sala.");
        return;
      }

      if (
        (requestedModuleId as string | null) === "kitchen-countertop" &&
        normalized.includes("espessura")
      ) {
        const thicknessMatch = normalized.match(/espessura[^0-9]*(\d+(?:[.,]\d+)?)\s*(mm|cm)?/i);
        const thickness = thicknessMatch
          ? measurementToMm(thicknessMatch[1], thicknessMatch[2])
          : null;
        if (selected && thickness) {
          const ok = get().updateFurnitureInstance(selected.id, {
            dimensionsMm: { ...selected.dimensionsMm, height: thickness },
          });
          reply(
            ok
              ? `A bancada foi reconstruída com espessura de ${thickness} mm.`
              : "A espessura não passou na validação da bancada.",
          );
          return;
        }
      }

      if (normalized.includes("freij") || normalized.includes("freijo")) {
        if (selected) {
          get().updateFurnitureInstance(selected.id, {
            materialOverrides: { ...selected.materialOverrides, body: "mdf-freijo" },
          });
          reply(
            "Apliquei MDF Freijó ao corpo do móvel selecionado usando a mesma operação do Inspector.",
          );
        } else reply("Selecione um móvel para aplicar MDF Freijó.");
        return;
      }
      if (normalized.includes("grafite")) {
        if (selected) {
          get().updateFurnitureInstance(selected.id, {
            materialOverrides: { ...selected.materialOverrides, body: "mdf-graphite" },
          });
          reply("Apliquei MDF Grafite ao móvel selecionado.");
        } else reply("Selecione um móvel para aplicar MDF Grafite.");
        return;
      }
      if (
        normalized.includes("quartzito") ||
        normalized.includes("quartzo") ||
        normalized.includes("porcelanato")
      ) {
        if (selected && selected.moduleDefinitionId === "kitchen-countertop") {
          get().updateFurnitureInstance(selected.id, {
            materialOverrides: {
              ...selected.materialOverrides,
              countertop: normalized.includes("porcelanato")
                ? "stone-porcelain"
                : "stone-quartzite",
            },
          });
          reply("Atualizei a pedra da bancada selecionada.");
        } else reply("Selecione uma Bancada para trocar a pedra.");
        return;
      }
      if (
        normalized.includes("led") ||
        normalized.includes("luz quente") ||
        normalized.includes("ilumina")
      ) {
        get().setLightsEnabled(true);
        reply(
          "Ativei a iluminação da cena; o preset atual controla temperatura, intensidade e LED.",
        );
        return;
      }
      if (
        normalized.includes("golden kitchen") ||
        normalized.includes("cozinha golden") ||
        normalized.includes("montar cozinha profissional")
      ) {
        get().applyGoldenKitchen();
        reply(
          "Montei a Golden Kitchen usando os módulos paramétricos oficiais, Freijó, pedra e o preset de sala profissional.",
        );
        return;
      }
      if (
        normalized.includes("adicione uma ilha") ||
        normalized.includes("adicionar ilha") ||
        normalized.includes("coloque uma ilha")
      ) {
        const id = get().addFurnitureInstance("kitchen-island-base");
        reply(
          id
            ? "Adicionei uma ilha pela operação oficial da Biblioteca."
            : "Não foi possível adicionar a ilha sem violar o clearance da sala.",
        );
        return;
      }
      if (
        normalized.includes("gere um render") ||
        normalized.includes("gerar render") ||
        normalized.includes("render realista")
      ) {
        window.dispatchEvent(new CustomEvent("dioris:open-render-final"));
        reply("Abri o Render Final real para escolher vista e resolução.");
        return;
      }
      if (
        normalized.includes("gere um vídeo") ||
        normalized.includes("gerar vídeo") ||
        normalized.includes("video")
      ) {
        window.dispatchEvent(new CustomEvent("dioris:open-render-final"));
        reply("Abri o painel Render Final; o tour WebM usa a cena atual e a câmera do Planner.");
        return;
      }
      const currentCount = get().instances.length;
      if (/plano de corte|lista de corte|nesting|corte/i.test(normalized)) {
        set({ rightTab: "fabrication" });
        reply(
          currentCount > 0
            ? `Abri o Plano de Corte para ${currentCount} módulo(s). A lista física, o aproveitamento das chapas, as ferragens e as operações de usinagem foram recalculados agora.`
            : "Ainda não há módulos fabricáveis. Diga, por exemplo, 'crie uma cozinha de 3000 x 2400 mm em MDF 18 mm' e eu gero o Plano de Corte a partir do projeto.",
        );
        return;
      }
      if (/fechar|abrir|porta|gaveta/i.test(normalized)) {
        if (currentCount > 0) {
          if (/fechar/i.test(normalized)) get().closeAllAnimations();
          else get().openAllAnimations();
          reply(
            /fechar/i.test(normalized)
              ? `Fechei as frentes e gavetas dos ${currentCount} módulo(s) atuais.`
              : `Abri as frentes e gavetas dos ${currentCount} módulo(s) atuais para inspeção da ferragem e do interior.`,
          );
        } else reply("Ainda não há um módulo selecionado para abrir ou fechar.");
        return;
      }
      if (/ajuda|o que|comando|pode fazer/i.test(normalized)) {
        reply(
          "Posso criar cozinhas e armários por medidas, trocar MDF e pedra, configurar puxador, dobradiça e corrediça, abrir portas e gavetas, recalcular o Plano de Corte, gerar BOM e nesting, ajustar iluminação e abrir o Render Final.",
        );
        return;
      }
      reply(
        `Recebi “${content.trim()}”, mas esse pedido ainda não corresponde a uma operação reconhecida. Tente especificar ação + objeto + medida, por exemplo: “crie um gaveteiro de 600 x 870 x 580 mm”, “use MDF Freijó”, “abra as portas” ou “mostrar Plano de Corte”.`,
      );
    },

    addFurnitureInstance: (
      moduleId,
      requestedPositionMm,
      requestedDimensionsMm,
      thicknessMm,
      layout,
    ) => {
      const definition = ModuleRegistry.get(moduleId);
      if (!definition) return null;

      const id = createFurnitureInstanceId(get().instances);

      const room = useRoomBuilderStore.getState();
      const y =
        definition.placementRules.defaultHeightFromFloorMm ??
        (definition.placementRules.wallMounted
          ? definition.placementRules.minHeightFromFloorMm
          : 0);
      const requestedDimensions = requestedDimensionsMm ?? definition.defaultDimensionsMm;
      const halfWidth = requestedDimensions.width / 2;
      const halfDepth = requestedDimensions.depth / 2;
      const xCandidates = [
        room.width / 2 - halfWidth - 20,
        -room.width / 2 + halfWidth + 20,
        0,
        -room.width / 4,
        room.width / 4,
      ];
      const zCandidates = [
        -room.depth / 2 + halfDepth + 20,
        room.depth / 2 - halfDepth - 20,
        0,
        -room.depth / 4,
        room.depth / 4,
      ];
      const candidates = requestedPositionMm
        ? [requestedPositionMm]
        : xCandidates.flatMap((candidateX) =>
            zCandidates.map((candidateZ) => ({ x: candidateX, y, z: candidateZ })),
          );
      const roomBounds = { widthMm: room.width, depthMm: room.depth, heightMm: room.height };
      let positionMm = candidates[0];
      let outcome = buildModule({
        instanceId: id,
        moduleId,
        dimensionsMm: requestedDimensions,
        thicknessMm,
        positionMm,
        room: roomBounds,
        instances: get().instances,
      });

      for (const candidate of candidates.slice(1)) {
        if (outcome.ok) break;
        positionMm = candidate;
        outcome = buildModule({
          instanceId: id,
          moduleId,
          dimensionsMm: requestedDimensions,
          positionMm,
          room: roomBounds,
          instances: get().instances,
        });
      }

      if (!outcome.ok) {
        set((s) => ({ ...s, lastLibraryError: outcome.error || "Erro no build" }));
        return null;
      }

      const instance: FurnitureInstance = {
        id,
        moduleDefinitionId: moduleId,
        familyId: definition.familyId,
        name: definition.name,
          dimensionsMm: outcome.dimensionsMm,
          thicknessMm: outcome.thicknessMm,
          layout,
        positionMm,
        rotationDeg: { x: 0, y: 0, z: 0 },
        materialOverrides: {},
        hardwareOverrides: {},
        parts: outcome.parts,
        visible: true,
        locked: false,
        selected: true,
      };

      set((s) => ({
        ...s,
        instances: [...s.instances.map((i) => ({ ...i, selected: false })), instance],
        selectedId: id,
      }));

      return id;
    },

    updateFurnitureInstance: (id, patch) => {
      const state = get();
      const current = state.instances.find((item) => item.id === id);
      if (!current) return false;
      if (current.locked) {
        set({ lastLibraryError: "Móvel bloqueado: desbloqueie para editar posição ou dimensões." });
        return false;
      }

      const room = useRoomBuilderStore.getState();
      const updated = { ...current, ...patch };
      const outcome = buildModule({
        instanceId: id,
        moduleId: updated.moduleDefinitionId,
        dimensionsMm: updated.dimensionsMm,
        positionMm: updated.positionMm,
        rotationDeg: updated.rotationDeg,
        materialOverrides: updated.materialOverrides,
        hardwareOverrides: updated.hardwareOverrides,
        thicknessMm: updated.thicknessMm,
        room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height },
        instances: state.instances.filter((item) => item.id !== id),
      });

      if (!outcome.ok) {
        const issue = outcome.validation?.errors[0];
        const constraintText = issue?.constraints
          ? ` Limites: mínimo ${issue.constraints.min ?? "—"} mm, máximo ${issue.constraints.max ?? "—"} mm, solicitado ${issue.constraints.requested ?? "—"} mm.`
          : "";
        set({
          lastLibraryError: `${outcome.error ?? "Não foi possível atualizar o móvel."}${constraintText}`,
        });
        return false;
      }

      set((s) => ({
        ...s,
        lastLibraryError: null,
        instances: s.instances.map((item) =>
          item.id === id
              ? {
                  ...updated,
                  parts: outcome.parts,
                  dimensionsMm: outcome.dimensionsMm,
                  thicknessMm: outcome.thicknessMm ?? updated.thicknessMm,
                }
              : item,
        ),
      }));
      return true;
    },

    removeFurnitureInstance: (id) => {
      const state = get();
      const target = state.instances.find((item) => item.id === id);
      if (!target) return;
      if (target.locked) {
        set({ lastLibraryError: "Móvel bloqueado: desbloqueie para excluir." });
        return;
      }
      useImmersiveStore.getState().selectPart(null);
      useImmersiveStore.getState().closeAll();
      set((s) => ({
        ...s,
        instances: s.instances.filter((item) => item.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },

    duplicateFurnitureInstance: (id) => {
      const original = get().instances.find((i) => i.id === id);
      if (!original) return;

      const newId = createFurnitureInstanceId(get().instances);
      const room = useRoomBuilderStore.getState();
      const candidates = [
        { ...original.positionMm, x: original.positionMm.x + original.dimensionsMm.width + 40 },
        { ...original.positionMm, x: original.positionMm.x - original.dimensionsMm.width - 40 },
        { ...original.positionMm, z: original.positionMm.z + original.dimensionsMm.depth + 40 },
        { ...original.positionMm, z: original.positionMm.z - original.dimensionsMm.depth - 40 },
      ];

      const buildAt = (positionMm: { x: number; y: number; z: number }) =>
        buildModule({
          instanceId: newId,
          moduleId: original.moduleDefinitionId,
          dimensionsMm: original.dimensionsMm,
          positionMm,
          rotationDeg: original.rotationDeg,
          materialOverrides: original.materialOverrides,
          hardwareOverrides: original.hardwareOverrides,
          room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height },
          instances: get().instances,
        });

      let newPosition = candidates[0];
      let outcome = buildAt(newPosition);
      for (const candidate of candidates.slice(1)) {
        if (outcome.ok) break;
        newPosition = candidate;
        outcome = buildAt(candidate);
      }

      if (!outcome.ok) {
        set({
          lastLibraryError: outcome.error ?? "Não foi possível duplicar o móvel sem colisão.",
        });
        return;
      }

      const clone: FurnitureInstance = {
        ...original,
        id: newId,
        parts: outcome.parts,
        positionMm: newPosition,
        selected: true,
        isOpen: false,
        openAmount: 0,
        openStates: {},
      };

      set((s) => ({
        ...s,
        instances: [...s.instances.map((i) => ({ ...i, selected: false })), clone],
        selectedId: newId,
      }));
    },

    selectFurnitureInstance: (id) =>
      set((s) => ({
        ...s,
        selectedId: id,
        instances: s.instances.map((item) => ({ ...item, selected: item.id === id })),
      })),

    validateFurnitureInstances: () => {
      const room = useRoomBuilderStore.getState();
      const state = get();
      const invalid = state.instances
        .map((instance) =>
          buildModule({
            instanceId: instance.id,
            moduleId: instance.moduleDefinitionId,
            dimensionsMm: instance.dimensionsMm,
            positionMm: instance.positionMm,
            rotationDeg: instance.rotationDeg,
            materialOverrides: instance.materialOverrides,
            hardwareOverrides: instance.hardwareOverrides,
            room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height },
            instances: state.instances.filter((item) => item.id !== instance.id),
          }),
        )
        .find((outcome) => !outcome.ok);

      set({
        lastLibraryError: invalid?.error ?? null,
      });
    },

    rebuildFurnitureInstance: (id) => {
      const instance = get().instances.find((i) => i.id === id);
      if (!instance) return;

      const room = useRoomBuilderStore.getState();
      const outcome = buildModule({
        instanceId: instance.id,
        moduleId: instance.moduleDefinitionId,
        dimensionsMm: instance.dimensionsMm,
        positionMm: instance.positionMm,
        rotationDeg: instance.rotationDeg,
        materialOverrides: instance.materialOverrides,
        hardwareOverrides: instance.hardwareOverrides,
        room: { widthMm: room.width, depthMm: room.depth, heightMm: room.height },
        instances: get().instances.filter((item) => item.id !== id),
      });

      if (!outcome.ok) return;

      set((s) => ({
        ...s,
        instances: s.instances.map((i) =>
          i.id === id ? { ...i, parts: outcome.parts, dimensionsMm: outcome.dimensionsMm } : i,
        ),
      }));
    },

    hideFurnitureInstance: (id) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((item) => (item.id === id ? { ...item, visible: false } : item)),
      })),

    showFurnitureInstance: (id) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((item) => (item.id === id ? { ...item, visible: true } : item)),
      })),

    toggleInstanceAnimation: (id: string, partId?: string) => {
      const state = get();
      const target = state.instances.find((item) => item.id === id);
      if (!target) return;
      const currentPart = partId
        ? target.parts.find((part) => part.id === partId || part.groupId === partId)
        : undefined;
      const stateKey = currentPart?.groupId ?? currentPart?.id ?? partId;
      const willOpen =
        currentPart && stateKey ? !(target.openStates?.[stateKey] ?? 0) : !target.isOpen;
      const warnings = willOpen
        ? validateOpeningClearance(
            target,
            state.instances.filter((item) => item.id !== id),
            stateKey,
          )
        : [];
      if (willOpen && warnings.length > 0) {
        set({ lastLibraryError: `[opening-collision] ${warnings[0].message}` });
        return;
      }
      set((s) => ({
        ...s,
        lastLibraryError: null,
        instances: s.instances.map((item) => {
          if (item.id !== id) return item;

          if (partId) {
            const currentOpenStates = item.openStates || {};
            const key =
              item.parts.find((part) => part.id === partId || part.groupId === partId)?.groupId ??
              partId;
            const current = currentOpenStates[key] || 0;
            return {
              ...item,
              isOpen: false,
              openStates: {
                ...currentOpenStates,
                [key]: current > 0 ? 0 : 1,
              },
            };
          }

          const nextOpen = !item.isOpen;
          return {
            ...item,
            isOpen: nextOpen,
            openAmount: nextOpen ? 1 : 0,
            openStates: {},
          };
        }),
      }));
    },

    openAllAnimations: () => {
      const ids = get()
        .instances.filter((item) => !item.isOpen)
        .map((item) => item.id);
      ids.forEach((id) => get().toggleInstanceAnimation(id));
    },
    closeAllAnimations: () => {
      const s = get();
      const selectedId = s.selectedId;
      set((state) => ({
        ...state,
        instances: state.instances.map((i) => ({
          ...i,
          isOpen: false,
          openAmount: 0,
          openStates: {},
        })),
      }));
      useImmersiveStore.getState().closeAll();
      // Se houver uma instância selecionada, força o rebuild das peças para garantir sincronia visual
      if (selectedId) {
        get().rebuildFurnitureInstance(selectedId);
      }
    },

    setInstanceIsolated: (id: string | null) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((i) => ({
          ...i,
          isIsolated: id === null ? false : i.id === id,
          visible: id === null ? true : i.id === id,
        })),
      })),

    toggleInstanceXRay: (id: string) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((i) => (i.id === id ? { ...i, isXRay: !i.isXRay } : i)),
      })),

    showAllInstances: () =>
      set((s) => ({
        ...s,
        instances: s.instances.map((i) => ({
          ...i,
          visible: true,
          isIsolated: false,
          isXRay: false,
        })),
      })),

    lockFurnitureInstance: (id) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((item) => (item.id === id ? { ...item, locked: true } : item)),
      })),

    unlockFurnitureInstance: (id) =>
      set((s) => ({
        ...s,
        instances: s.instances.map((item) => (item.id === id ? { ...item, locked: false } : item)),
      })),

    clearLibraryError: () => set((s) => ({ ...s, lastLibraryError: null })),

    setDragPreview: (moduleId, positionMm) => {
      const room = useRoomBuilderStore.getState();
      const definition = ModuleRegistry.get(moduleId);
      if (!definition) {
        set({ dragPreview: null });
        return;
      }
      const previewInstance = {
        id: "drag-preview",
        moduleId,
        moduleDefinitionId: moduleId,
        name: definition.name,
        familyId: definition.familyId,
        dimensionsMm: definition.defaultDimensionsMm,
        positionMm,
        rotationDeg: { x: 0, y: 0, z: 0 },
        parts: [],
        visible: true,
        selected: false,
        locked: false,
        isOpen: false,
        isXRay: false,
        isIsolated: false,
        openStates: {},
        materialOverrides: {},
        hardwareOverrides: {},
      } as FurnitureInstance;
      const roomBounds = { widthMm: room.width, depthMm: room.depth, heightMm: room.height };
      const snapCandidate = get().snapEnabled
        ? findKitchenSnapCandidate(previewInstance, get().instances, roomBounds)
        : null;
      const effectivePosition = snapCandidate?.positionMm ?? positionMm;
      const halfWidth = definition.defaultDimensionsMm.width / 2;
      const halfDepth = definition.defaultDimensionsMm.depth / 2;
      const nearest = get()
        .instances.map((instance) => ({
          instance,
          distance: Math.hypot(
            instance.positionMm.x - effectivePosition.x,
            instance.positionMm.z - effectivePosition.z,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      const guides = [
        `Parede esquerda: ${Math.max(0, Math.round(room.width / 2 + effectivePosition.x - halfWidth))} mm`,
        `Parede direita: ${Math.max(0, Math.round(room.width / 2 - effectivePosition.x - halfWidth))} mm`,
        `Parede traseira: ${Math.max(0, Math.round(room.depth / 2 + effectivePosition.z - halfDepth))} mm`,
        `Piso: ${Math.max(0, Math.round(effectivePosition.y))} mm`,
        `Teto: ${Math.max(0, Math.round(room.height - effectivePosition.y - definition.defaultDimensionsMm.height))} mm`,
        ...(nearest ? [`Vizinho: ${Math.round(nearest.distance)} mm`] : []),
      ];
      const validation = buildModule({
        instanceId: "drag-preview",
        moduleId,
        dimensionsMm: definition.defaultDimensionsMm,
        positionMm: effectivePosition,
        room: roomBounds,
        instances: get().instances,
      });
      const snapInfo = snapCandidate
        ? `Encaixe ${snapCandidate.target} — ${Math.round(snapCandidate.distanceMm)} mm`
        : null;
      set({
        dragPreview: {
          moduleId,
          positionMm: effectivePosition,
          valid: validation.ok,
          message: validation.ok ? snapInfo : (validation.error ?? "Posição inválida"),
          guides,
          snapInfo,
        },
      });
    },

    clearDragPreview: () => set({ dragPreview: null }),

    dropDragPreview: () => {
      const preview = get().dragPreview;
      if (!preview || !preview.valid) return null;
      const id = get().addFurnitureInstance(preview.moduleId, preview.positionMm);
      set({ dragPreview: null });
      return id;
    },

    setSnapEnabled: (enabled) =>
      set({ snapEnabled: enabled, lastSnapMessage: enabled ? "Snap ativado" : "Snap desativado" }),

    snapFurnitureInstance: (id) => {
      const state = get();
      if (!state.snapEnabled) {
        set({ lastSnapMessage: "Snap desativado" });
        return;
      }
      const moving = state.instances.find((instance) => instance.id === id);
      if (!moving || moving.locked) return;
      const room = useRoomBuilderStore.getState();
      const candidate = findKitchenSnapCandidate(
        moving,
        state.instances.filter((instance) => instance.id !== id),
        { widthMm: room.width, depthMm: room.depth, heightMm: room.height },
      );
      if (!candidate) {
        set({ lastSnapMessage: "Nenhum encaixe próximo" });
        return;
      }
      get().updateFurnitureInstance(id, { positionMm: candidate.positionMm });
      set({
        lastSnapMessage: `Snap: ${candidate.target === "module" ? "móvel-móvel" : candidate.target}`,
      });
    },
  })),
);

if (typeof window !== "undefined") {
  (window as any).plannerV2Store = usePlannerStore;
  queueMicrotask(() => {
    usePlannerStore.getState().loadProject();
    const query = new URLSearchParams(window.location.search);
    if (query.get("goldenmodule") === "1") usePlannerStore.getState().applyGoldenModuleTest();
    else if (query.get("golden") === "1") usePlannerStore.getState().applyGoldenKitchen();
  });
}

let persistenceReady = false;
const plannerHistoryChanged = (state: PlannerState, previous: PlannerState) =>
  state.instances !== previous.instances ||
  state.furniture !== previous.furniture ||
  state.selectedId !== previous.selectedId ||
  state.gridVisible !== previous.gridVisible ||
  state.lightsEnabled !== previous.lightsEnabled ||
  state.snapEnabled !== previous.snapEnabled;

usePlannerStore.subscribe((state, previous) => {
  if (!plannerHistoryChanged(state, previous)) return;
  if (persistenceReady || typeof window === "undefined") {
    if (!historyApplying) {
      historyPast.push(snapshotPlannerState(previous));
      if (historyPast.length > 100) historyPast.shift();
      historyFuture.length = 0;
    }
  }
  if (!persistenceReady) return;
  const stored = loadProjectFromStorage();
  if (state.instances.length === 0 && (stored?.planner.instances.length ?? 0) > 0) return;
  state.saveProject();
});

if (typeof window !== "undefined") {
  setTimeout(() => {
    persistenceReady = true;
    useRoomBuilderStore.subscribe((state, previous) => {
      if (!persistenceReady) return;
      if (
        state.width !== previous.width ||
        state.depth !== previous.depth ||
        state.height !== previous.height ||
        state.wallThickness !== previous.wallThickness ||
        state.openings !== previous.openings ||
        state.referenceImage !== previous.referenceImage ||
        state.referenceName !== previous.referenceName ||
        state.referenceStyle !== previous.referenceStyle
      ) {
        usePlannerStore.getState().saveProject();
      }
    });
  }, 0);
}
