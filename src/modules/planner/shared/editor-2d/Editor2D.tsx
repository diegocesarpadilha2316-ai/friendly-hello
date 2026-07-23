/**
 * Editor 2D Enterprise (Fase 3.2).
 *
 * Renderer SVG isolado — consome exclusivamente o `PlannerEditorProvider`
 * criado na Fase 3.1 para leitura/escrita do documento. Todo estado de
 * apresentação (ferramenta ativa, zoom/pan, seleção, camadas, arrasto)
 * vive local no componente e nunca é persistido.
 *
 * Integrações:
 *  - `updateProject` → dispara undo/redo/autosave já configurados.
 *  - Nenhum novo store/query/provider é criado.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MousePointer2, Hand, Minus, DoorOpen, Square, Layers, Grid3x3,
  RectangleHorizontal, Trash2, Copy, RotateCw, FlipHorizontal2, Eye, EyeOff,
  Lock, Unlock, Ruler, ZoomIn, ZoomOut, Maximize2,
} from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import type { PlannerProject, PlannerRoom } from "../types/project";
import {
  distance, mirror as reflect, normalizeRect, rectsIntersect,
  snapToGrid, type Point,
} from "./geometry";
import { listPrimitives } from "./serialization";
import { makePrimitiveId, removeNodes, upsertPrimitive, upsertPrimitives } from "./room-ops";
import type {
  Editor2DDraft, Editor2DLayerId, Editor2DLayerState, Editor2DPrimitive,
  Editor2DTool, Editor2DViewport,
} from "./types";

const DEFAULT_LAYERS: readonly Editor2DLayerState[] = [
  { id: "walls", label: "Paredes", visible: true, locked: false },
  { id: "openings", label: "Aberturas", visible: true, locked: false },
  { id: "floors", label: "Pisos", visible: true, locked: false },
  { id: "ceilings", label: "Tetos", visible: true, locked: false },
  { id: "guides", label: "Guias", visible: true, locked: false },
];

const TOOL_HOTKEYS: Record<string, Editor2DTool> = {
  v: "select", h: "pan", w: "wall", d: "door", n: "window",
  f: "floor", c: "ceiling", g: "guide",
};

const TOOL_ITEMS: readonly {
  id: Editor2DTool; label: string; icon: typeof MousePointer2; hint: string;
}[] = [
  { id: "select",  label: "Selecionar", icon: MousePointer2,        hint: "V" },
  { id: "pan",     label: "Pan",        icon: Hand,                  hint: "H" },
  { id: "wall",    label: "Parede",     icon: Minus,                 hint: "W" },
  { id: "door",    label: "Porta",      icon: DoorOpen,              hint: "D" },
  { id: "window",  label: "Janela",     icon: RectangleHorizontal,   hint: "N" },
  { id: "floor",   label: "Piso",       icon: Square,                hint: "F" },
  { id: "ceiling", label: "Teto",       icon: Layers,                hint: "C" },
  { id: "guide",   label: "Guia",       icon: Ruler,                 hint: "G" },
];

// ---------------------------------------------------------------------------
// Estado de apresentação local
// ---------------------------------------------------------------------------

interface ViewState {
  tool: Editor2DTool;
  grid: number;
  snap: boolean;
  angleSnap: boolean;
  showGrid: boolean;
  showRulers: boolean;
  layers: readonly Editor2DLayerState[];
  selection: ReadonlySet<string>;
}

type ViewAction =
  | { type: "tool"; tool: Editor2DTool }
  | { type: "grid"; grid: number }
  | { type: "toggle"; key: "snap" | "angleSnap" | "showGrid" | "showRulers" }
  | { type: "layer"; id: Editor2DLayerId; patch: Partial<Editor2DLayerState> }
  | { type: "select"; ids: ReadonlySet<string> };

function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "tool": return { ...state, tool: action.tool };
    case "grid": return { ...state, grid: Math.max(10, action.grid) };
    case "toggle": return { ...state, [action.key]: !state[action.key] };
    case "layer":
      return {
        ...state,
        layers: state.layers.map((l) => l.id === action.id ? { ...l, ...action.patch } : l),
      };
    case "select": return { ...state, selection: action.ids };
  }
}

const INITIAL_VIEW: ViewState = {
  tool: "select",
  grid: 100,
  snap: true,
  angleSnap: true,
  showGrid: true,
  showRulers: true,
  layers: DEFAULT_LAYERS,
  selection: new Set<string>(),
};

// ---------------------------------------------------------------------------
// Editor2D
// ---------------------------------------------------------------------------

export function Editor2D() {
  const { state, updateProject } = usePlannerEditor();
  const project = state.project;
  const environment = project?.environments.find((e) => e.id === state.selectedEnvironmentId);
  const room = environment?.rooms.find((r) => r.id === state.selectedRoomId) ?? null;

  if (!project || !environment || !room) {
    return (
      <div className="grid h-[560px] place-items-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
        Selecione um ambiente e cômodo para abrir o Editor 2D.
      </div>
    );
  }

  return (
    <Editor2DInner
      key={`${project.id}:${environment.id}:${room.id}`}
      project={project}
      environmentId={environment.id}
      room={room}
      onMutateRoom={(fn) => updateProject((p) => mutateRoom(p, environment.id, room.id, fn))}
    />
  );
}

function mutateRoom(
  project: PlannerProject,
  environmentId: string,
  roomId: string,
  fn: (room: PlannerRoom) => PlannerRoom,
): PlannerProject {
  return {
    ...project,
    environments: project.environments.map((env) => {
      if (env.id !== environmentId) return env;
      return {
        ...env,
        rooms: env.rooms.map((r) => (r.id === roomId ? fn(r) : r)),
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

interface InnerProps {
  project: PlannerProject;
  environmentId: string;
  room: PlannerRoom;
  onMutateRoom: (fn: (room: PlannerRoom) => PlannerRoom) => void;
}

function Editor2DInner({ room, onMutateRoom }: InnerProps) {
  const [view, dispatch] = useReducer(viewReducer, INITIAL_VIEW);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = useState<Editor2DViewport>(() => fitViewport(room, 640, 480));
  const [draft, setDraft] = useState<Editor2DDraft | null>(null);
  const [marquee, setMarquee] = useState<{ a: Point; b: Point } | null>(null);
  const [dragging, setDragging] = useState<{ origin: Point; last: Point; ids: readonly string[] } | null>(null);
  const [panning, setPanning] = useState<{ origin: Point } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [cursor, setCursor] = useState<Point | null>(null);

  const primitives = useMemo(() => listPrimitives(room), [room]);
  const layerMap = useMemo(() => {
    const m = new Map<Editor2DLayerId, Editor2DLayerState>();
    for (const l of view.layers) m.set(l.id, l);
    return m;
  }, [view.layers]);

  const visiblePrimitives = useMemo(
    () => primitives.filter((p) => (layerMap.get(p.layer)?.visible ?? true)),
    [primitives, layerMap],
  );

  // ---------------------- viewport helpers ----------------------
  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return { x: viewport.x + nx * viewport.w, y: viewport.y + ny * viewport.h };
  }, [viewport]);

  const snapPointWorld = useCallback((p: Point, shiftFree: boolean): Point => {
    if (!view.snap || shiftFree) return p;
    return { x: snapToGrid(p.x, view.grid), y: snapToGrid(p.y, view.grid) };
  }, [view.snap, view.grid]);

  const zoomAt = useCallback((factor: number, at: Point) => {
    setViewport((v) => {
      const w = clamp(v.w * factor, 200, room.dimensions.width * 8);
      const h = clamp(v.h * factor, 200, room.dimensions.depth * 8);
      const rx = (at.x - v.x) / v.w;
      const ry = (at.y - v.y) / v.h;
      return { x: at.x - rx * w, y: at.y - ry * h, w, h };
    });
  }, [room.dimensions.depth, room.dimensions.width]);

  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const b = svg.getBoundingClientRect();
    setViewport(fitViewport(room, b.width, b.height));
  }, [room]);

  // ---------------------- keyboard ----------------------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.code === "Space") { e.preventDefault(); setSpaceHeld(true); return; }
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && key === "a") { e.preventDefault(); dispatch({ type: "select", ids: new Set(primitives.map((p) => p.id)) }); return; }
      if (mod && key === "d") { e.preventDefault(); duplicateSelection(); return; }
      if (mod && key === "0") { e.preventDefault(); fit(); return; }
      if (mod && (key === "=" || key === "+")) { e.preventDefault(); if (cursor) zoomAt(0.8, cursor); return; }
      if (mod && key === "-") { e.preventDefault(); if (cursor) zoomAt(1.25, cursor); return; }
      if (key === "delete" || key === "backspace") { e.preventDefault(); deleteSelection(); return; }
      if (key === "r" && !mod) { e.preventDefault(); rotateSelection(90); return; }
      if (key === "m" && !mod) { e.preventDefault(); mirrorSelection(); return; }
      if (key === "escape") {
        setDraft(null); setMarquee(null);
        dispatch({ type: "select", ids: new Set() });
        return;
      }
      const tool = TOOL_HOTKEYS[key];
      if (tool && !mod) { e.preventDefault(); dispatch({ type: "tool", tool }); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primitives, view.selection, cursor, fit, zoomAt]);

  // ---------------------- hit test ----------------------
  function hitTest(world: Point): Editor2DPrimitive | null {
    // itera em ordem inversa: elementos "por cima" ganham
    for (let i = visiblePrimitives.length - 1; i >= 0; i--) {
      const p = visiblePrimitives[i];
      if (layerMap.get(p.layer)?.locked || p.locked) continue;
      if (isHit(p, world)) return p;
    }
    return null;
  }

  // ---------------------- mutations ----------------------
  function commitPrimitive(p: Editor2DPrimitive) {
    onMutateRoom((r) => upsertPrimitive(r, p));
  }
  function commitPrimitives(list: readonly Editor2DPrimitive[]) {
    onMutateRoom((r) => upsertPrimitives(r, list));
  }
  function deleteSelection() {
    if (view.selection.size === 0) return;
    const ids = new Set(view.selection);
    onMutateRoom((r) => removeNodes(r, ids));
    dispatch({ type: "select", ids: new Set() });
  }
  function duplicateSelection() {
    if (view.selection.size === 0) return;
    const dupes: Editor2DPrimitive[] = [];
    const nextIds = new Set<string>();
    for (const p of primitives) {
      if (!view.selection.has(p.id)) continue;
      const clone = clonePrimitive(p, 200);
      dupes.push(clone);
      nextIds.add(clone.id);
    }
    if (dupes.length === 0) return;
    commitPrimitives(dupes);
    dispatch({ type: "select", ids: nextIds });
  }
  function rotateSelection(deg: number) {
    const list: Editor2DPrimitive[] = [];
    for (const p of primitives) {
      if (!view.selection.has(p.id)) continue;
      list.push(rotatePrimitive(p, deg));
    }
    if (list.length) commitPrimitives(list);
  }
  function mirrorSelection() {
    const sel = primitives.filter((p) => view.selection.has(p.id));
    if (sel.length === 0) return;
    const bbox = primitivesBBox(sel);
    const axis = bbox.x + bbox.width / 2;
    commitPrimitives(sel.map((p) => mirrorPrimitive(p, axis)));
  }
  function moveSelection(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    const list: Editor2DPrimitive[] = [];
    for (const p of primitives) {
      if (!view.selection.has(p.id)) continue;
      list.push(translatePrimitive(p, dx, dy));
    }
    if (list.length) commitPrimitives(list);
  }

  // ---------------------- pointer handlers ----------------------
  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const world = clientToWorld(e.clientX, e.clientY);
    const snapped = snapPointWorld(world, e.shiftKey);
    setCursor(snapped);

    if (spaceHeld || view.tool === "pan" || e.button === 1) {
      setPanning({ origin: { x: e.clientX, y: e.clientY } });
      return;
    }

    if (view.tool === "select") {
      const hit = hitTest(world);
      if (hit) {
        const next = new Set(view.selection);
        if (e.shiftKey) next.has(hit.id) ? next.delete(hit.id) : next.add(hit.id);
        else if (!next.has(hit.id)) { next.clear(); next.add(hit.id); }
        dispatch({ type: "select", ids: next });
        setDragging({ origin: snapped, last: snapped, ids: [...next] });
      } else {
        if (!e.shiftKey) dispatch({ type: "select", ids: new Set() });
        setMarquee({ a: world, b: world });
      }
      return;
    }

    // Ferramentas de desenho — inicia draft
    if (view.tool === "guide") {
      // Guias são commit imediato (linha infinita).
      const axis: "h" | "v" = e.altKey ? "v" : "h";
      const p: Editor2DPrimitive = {
        id: makePrimitiveId("guide"),
        kind: "guide",
        layer: "guides",
        locked: false,
        axis,
        pos: axis === "h" ? snapped.y : snapped.x,
      };
      commitPrimitive(p);
      return;
    }

    setDraft({
      tool: view.tool as Editor2DDraft["tool"],
      x1: snapped.x, y1: snapped.y, x2: snapped.x, y2: snapped.y,
    });
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const world = clientToWorld(e.clientX, e.clientY);
    const snapped = snapPointWorld(world, e.shiftKey);
    setCursor(snapped);

    if (panning) {
      const dx = (e.clientX - panning.origin.x) * (viewport.w / (svgRef.current?.clientWidth || viewport.w));
      const dy = (e.clientY - panning.origin.y) * (viewport.h / (svgRef.current?.clientHeight || viewport.h));
      setViewport((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      setPanning({ origin: { x: e.clientX, y: e.clientY } });
      return;
    }

    if (dragging) {
      const dx = snapped.x - dragging.last.x;
      const dy = snapped.y - dragging.last.y;
      if (dx !== 0 || dy !== 0) {
        moveSelection(dx, dy);
        setDragging({ ...dragging, last: snapped });
      }
      return;
    }

    if (marquee) {
      setMarquee({ ...marquee, b: world });
      return;
    }

    if (draft) {
      setDraft({ ...draft, x2: snapped.x, y2: snapped.y });
    }
  }

  function onPointerUp() {
    setPanning(null);

    if (marquee) {
      const rect = normalizeRect(marquee.a, marquee.b);
      const ids = new Set<string>();
      for (const p of visiblePrimitives) {
        if (rectsIntersect(rect, primitiveBBox(p))) ids.add(p.id);
      }
      dispatch({ type: "select", ids });
      setMarquee(null);
      return;
    }

    if (dragging) { setDragging(null); return; }

    if (draft) {
      const commit = draftToPrimitive(draft);
      if (commit) commitPrimitive(commit);
      setDraft(null);
    }
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const world = clientToWorld(e.clientX, e.clientY);
    zoomAt(e.deltaY > 0 ? 1.1 : 0.9, world);
  }

  // ---------------------- render ----------------------
  const viewBox = `${viewport.x} ${viewport.y} ${viewport.w} ${viewport.h}`;
  const selectedList = primitives.filter((p) => view.selection.has(p.id));

  return (
    <div className="flex h-[720px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background">
      <Toolbar
        view={view}
        dispatch={dispatch}
        onFit={fit}
        onZoom={(f) => cursor && zoomAt(f, cursor)}
        onDelete={deleteSelection}
        onDuplicate={duplicateSelection}
        onRotate={() => rotateSelection(90)}
        onMirror={mirrorSelection}
        selectionCount={view.selection.size}
      />

      <div className="grid flex-1 grid-cols-[1fr,280px] overflow-hidden">
        <div className="relative overflow-hidden bg-muted/10">
          {view.showRulers && <Rulers viewport={viewport} grid={view.grid} />}
          <svg
            ref={svgRef}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full touch-none select-none"
            style={{ cursor: cursorFor(view.tool, spaceHeld, !!panning, !!dragging) }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            {view.showGrid && <GridLayer viewport={viewport} grid={view.grid} />}
            <RoomBoundary room={room} />
            <PrimitivesLayer
              primitives={visiblePrimitives}
              selection={view.selection}
              layers={layerMap}
            />
            {draft && <DraftLayer draft={draft} />}
            {marquee && <MarqueeLayer a={marquee.a} b={marquee.b} />}
            {cursor && <CursorHint cursor={cursor} />}
          </svg>
          <Minimap room={room} viewport={viewport} primitives={visiblePrimitives} onJump={setViewport} />
          <StatusBar cursor={cursor} viewport={viewport} grid={view.grid} />
        </div>

        <aside className="flex flex-col overflow-hidden border-l border-border/60 bg-background">
          <LayersPanel view={view} dispatch={dispatch} />
          <Inspector
            selection={selectedList}
            onPatch={(id, patch) => {
              const target = primitives.find((p) => p.id === id);
              if (!target) return;
              commitPrimitive({ ...target, ...patch } as Editor2DPrimitive);
            }}
          />
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes de UI
// ---------------------------------------------------------------------------

function Toolbar(props: {
  view: ViewState;
  dispatch: (a: ViewAction) => void;
  onFit: () => void;
  onZoom: (f: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onMirror: () => void;
  selectionCount: number;
}) {
  const { view, dispatch } = props;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-background/80 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-0.5">
        {TOOL_ITEMS.map((t) => {
          const active = view.tool === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => dispatch({ type: "tool", tool: t.id })}
              title={`${t.label} (${t.hint})`}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${active ? "bg-primary/15 text-primary" : ""}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <span className="mx-2 h-6 w-px bg-border/60" />
      <button
        type="button"
        onClick={() => dispatch({ type: "toggle", key: "snap" })}
        title="Snap à grade"
        className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs transition-colors hover:bg-muted ${view.snap ? "text-primary" : "text-muted-foreground"}`}
      >
        <Grid3x3 className="h-3.5 w-3.5" /> Snap
      </button>
      <select
        value={view.grid}
        onChange={(e) => dispatch({ type: "grid", grid: Number(e.target.value) })}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        title="Tamanho da grade (mm)"
      >
        {[10, 25, 50, 100, 250, 500, 1000].map((g) => (
          <option key={g} value={g}>{g} mm</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => dispatch({ type: "toggle", key: "showGrid" })}
        title="Mostrar grade"
        className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs transition-colors hover:bg-muted ${view.showGrid ? "text-primary" : "text-muted-foreground"}`}
      >
        Grade
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "toggle", key: "showRulers" })}
        title="Mostrar réguas"
        className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs transition-colors hover:bg-muted ${view.showRulers ? "text-primary" : "text-muted-foreground"}`}
      >
        Réguas
      </button>
      <span className="mx-2 h-6 w-px bg-border/60" />
      <Button size="sm" variant="ghost" onClick={() => props.onZoom(0.8)} title="Zoom in (Ctrl +)">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => props.onZoom(1.25)} title="Zoom out (Ctrl -)">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={props.onFit} title="Ajustar (Ctrl 0)">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <span className="mx-2 h-6 w-px bg-border/60" />
      <Button size="sm" variant="ghost" onClick={props.onDuplicate} disabled={!props.selectionCount} title="Duplicar (Ctrl D)">
        <Copy className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={props.onRotate} disabled={!props.selectionCount} title="Rotacionar 90° (R)">
        <RotateCw className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={props.onMirror} disabled={!props.selectionCount} title="Espelhar horizontal (M)">
        <FlipHorizontal2 className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={props.onDelete} disabled={!props.selectionCount} title="Remover (Del)">
        <Trash2 className="h-4 w-4" />
      </Button>
      <span className="ml-auto text-xs text-muted-foreground">
        {props.selectionCount ? `${props.selectionCount} selecionado(s)` : "Nenhuma seleção"}
      </span>
    </div>
  );
}

function GridLayer({ viewport, grid }: { viewport: Editor2DViewport; grid: number }) {
  // Densidade adaptativa: subir grade quando muito zoom-out.
  const step = adaptiveStep(grid, viewport.w);
  const lines: React.ReactElement[] = [];
  const startX = Math.floor(viewport.x / step) * step;
  const endX = viewport.x + viewport.w;
  const startY = Math.floor(viewport.y / step) * step;
  const endY = viewport.y + viewport.h;
  const stroke = viewport.w / 800;
  const boldEvery = step * 10;
  for (let x = startX; x <= endX; x += step) {
    const bold = Math.abs(x % boldEvery) < 0.001;
    lines.push(
      <line key={`vx${x}`} x1={x} y1={viewport.y} x2={x} y2={endY}
        stroke="currentColor" strokeOpacity={bold ? 0.22 : 0.09} strokeWidth={stroke} />,
    );
  }
  for (let y = startY; y <= endY; y += step) {
    const bold = Math.abs(y % boldEvery) < 0.001;
    lines.push(
      <line key={`hy${y}`} x1={viewport.x} y1={y} x2={endX} y2={y}
        stroke="currentColor" strokeOpacity={bold ? 0.22 : 0.09} strokeWidth={stroke} />,
    );
  }
  return <g className="text-foreground">{lines}</g>;
}

function Rulers({ viewport, grid }: { viewport: Editor2DViewport; grid: number }) {
  const step = adaptiveStep(grid, viewport.w) * 5;
  const startX = Math.floor(viewport.x / step) * step;
  const endX = viewport.x + viewport.w;
  const startY = Math.floor(viewport.y / step) * step;
  const endY = viewport.y + viewport.h;
  const ticksX: React.ReactElement[] = [];
  for (let x = startX; x <= endX; x += step) {
    const nx = ((x - viewport.x) / viewport.w) * 100;
    ticksX.push(
      <div key={`rx${x}`} style={{ left: `${nx}%` }}
        className="absolute top-0 h-full border-l border-border/40 pl-1 text-[10px] text-muted-foreground">
        {formatMm(x)}
      </div>,
    );
  }
  const ticksY: React.ReactElement[] = [];
  for (let y = startY; y <= endY; y += step) {
    const ny = ((y - viewport.y) / viewport.h) * 100;
    ticksY.push(
      <div key={`ry${y}`} style={{ top: `${ny}%` }}
        className="absolute left-0 w-full border-t border-border/40 pl-1 text-[10px] text-muted-foreground">
        {formatMm(y)}
      </div>,
    );
  }
  return (
    <>
      <div className="pointer-events-none absolute left-6 right-0 top-0 z-10 h-6 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="relative h-full w-full">{ticksX}</div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 top-6 z-10 w-6 border-r border-border/60 bg-background/70 backdrop-blur">
        <div className="relative h-full w-full">{ticksY}</div>
      </div>
    </>
  );
}

function RoomBoundary({ room }: { room: PlannerRoom }) {
  return (
    <rect
      x={0} y={0}
      width={room.dimensions.width} height={room.dimensions.depth}
      fill="hsl(var(--muted) / 0.15)"
      stroke="hsl(var(--primary))" strokeOpacity={0.35}
      strokeWidth={Math.max(6, room.dimensions.width / 400)}
      strokeDasharray={`${room.dimensions.width / 60} ${room.dimensions.width / 120}`}
    />
  );
}

function PrimitivesLayer(props: {
  primitives: readonly Editor2DPrimitive[];
  selection: ReadonlySet<string>;
  layers: Map<Editor2DLayerId, Editor2DLayerState>;
}) {
  return (
    <g>
      {props.primitives.map((p) => (
        <PrimitiveShape
          key={p.id}
          p={p}
          selected={props.selection.has(p.id)}
          locked={p.locked || !!props.layers.get(p.layer)?.locked}
        />
      ))}
    </g>
  );
}

function PrimitiveShape({ p, selected, locked }: {
  p: Editor2DPrimitive; selected: boolean; locked: boolean;
}) {
  const stroke = selected ? "hsl(var(--primary))" : "hsl(var(--foreground))";
  const opacity = locked ? 0.5 : 1;
  const sw = selected ? 4 : 2;

  switch (p.kind) {
    case "wall": {
      const len = distance({ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 });
      const midx = (p.x1 + p.x2) / 2;
      const midy = (p.y1 + p.y2) / 2;
      return (
        <g opacity={opacity}>
          <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
            stroke={stroke} strokeWidth={p.thickness}
            strokeLinecap="butt" strokeOpacity={selected ? 1 : 0.85} />
          <text x={midx} y={midy - p.thickness / 2 - 60} textAnchor="middle"
            fill="hsl(var(--muted-foreground))" fontSize={80}>
            {formatMm(len)}
          </text>
        </g>
      );
    }
    case "opening": {
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const fill = p.role === "door" ? "hsl(var(--accent) / 0.4)" : "hsl(var(--primary) / 0.25)";
      return (
        <g opacity={opacity} transform={`rotate(${p.rotation} ${cx} ${cy})`}>
          <rect x={p.x} y={p.y} width={p.width} height={p.height}
            fill={fill} stroke={stroke} strokeWidth={sw} />
          {p.role === "door" && (
            <path d={`M ${p.x} ${p.y + p.height} A ${p.width} ${p.width} 0 0 1 ${p.x + p.width} ${p.y}`}
              fill="none" stroke={stroke} strokeOpacity={0.5} strokeWidth={sw / 2} />
          )}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill="hsl(var(--muted-foreground))" fontSize={80}>
            {formatMm(p.width)}
          </text>
        </g>
      );
    }
    case "floor":
    case "ceiling":
      return (
        <g opacity={opacity}>
          <rect x={p.x} y={p.y} width={p.width} height={p.depth}
            fill={p.kind === "floor" ? "hsl(var(--muted) / 0.4)" : "hsl(var(--secondary) / 0.35)"}
            stroke={stroke} strokeWidth={sw} strokeDasharray={p.kind === "ceiling" ? "80 40" : undefined} />
          <text x={p.x + p.width / 2} y={p.y + p.depth / 2}
            textAnchor="middle" dominantBaseline="middle"
            fill="hsl(var(--muted-foreground))" fontSize={100}>
            {p.kind === "floor" ? "Piso" : "Teto"} · {formatMm(p.width)}×{formatMm(p.depth)}
          </text>
        </g>
      );
    case "guide":
      return p.axis === "h" ? (
        <line x1={-1e6} y1={p.pos} x2={1e6} y2={p.pos}
          stroke={selected ? "hsl(var(--primary))" : "hsl(var(--accent))"}
          strokeWidth={sw} strokeDasharray="40 40" opacity={opacity} />
      ) : (
        <line x1={p.pos} y1={-1e6} x2={p.pos} y2={1e6}
          stroke={selected ? "hsl(var(--primary))" : "hsl(var(--accent))"}
          strokeWidth={sw} strokeDasharray="40 40" opacity={opacity} />
      );
  }
}

function DraftLayer({ draft }: { draft: Editor2DDraft }) {
  const stroke = "hsl(var(--primary))";
  if (draft.tool === "wall") {
    const len = distance({ x: draft.x1, y: draft.y1 }, { x: draft.x2, y: draft.y2 });
    return (
      <g>
        <line x1={draft.x1} y1={draft.y1} x2={draft.x2} y2={draft.y2}
          stroke={stroke} strokeWidth={100} strokeOpacity={0.5} />
        <text x={(draft.x1 + draft.x2) / 2} y={(draft.y1 + draft.y2) / 2 - 60}
          textAnchor="middle" fill={stroke} fontSize={80}>
          {formatMm(len)}
        </text>
      </g>
    );
  }
  const r = normalizeRect({ x: draft.x1, y: draft.y1 }, { x: draft.x2, y: draft.y2 });
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.width} height={r.height}
        fill={stroke} fillOpacity={0.12} stroke={stroke} strokeWidth={3} strokeDasharray="60 40" />
      <text x={r.x + r.width / 2} y={r.y + r.height / 2}
        textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize={80}>
        {formatMm(r.width)} × {formatMm(r.height)}
      </text>
    </g>
  );
}

function MarqueeLayer({ a, b }: { a: Point; b: Point }) {
  const r = normalizeRect(a, b);
  return (
    <rect x={r.x} y={r.y} width={r.width} height={r.height}
      fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))"
      strokeWidth={2} strokeDasharray="40 30" />
  );
}

function CursorHint({ cursor }: { cursor: Point }) {
  return (
    <g pointerEvents="none">
      <circle cx={cursor.x} cy={cursor.y} r={40} fill="hsl(var(--primary))" fillOpacity={0.25} />
      <circle cx={cursor.x} cy={cursor.y} r={8} fill="hsl(var(--primary))" />
    </g>
  );
}

function Minimap({ room, viewport, primitives, onJump }: {
  room: PlannerRoom;
  viewport: Editor2DViewport;
  primitives: readonly Editor2DPrimitive[];
  onJump: (v: Editor2DViewport) => void;
}) {
  const W = 180, H = 120;
  const rw = room.dimensions.width;
  const rd = room.dimensions.depth;
  const scale = Math.min(W / rw, H / rd);
  const w = rw * scale;
  const h = rd * scale;
  return (
    <div className="absolute bottom-3 right-3 rounded-md border border-border/60 bg-background/85 p-1 backdrop-blur shadow-lg">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width;
          const ny = (e.clientY - rect.top) / rect.height;
          onJump({
            x: nx * rw - viewport.w / 2,
            y: ny * rd - viewport.h / 2,
            w: viewport.w, h: viewport.h,
          });
        }}
        className="cursor-crosshair"
      >
        <rect x={(W - w) / 2} y={(H - h) / 2} width={w} height={h}
          fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" />
        <g transform={`translate(${(W - w) / 2} ${(H - h) / 2}) scale(${scale})`}>
          {primitives.map((p) => {
            const b = primitiveBBox(p);
            return <rect key={p.id} x={b.x} y={b.y} width={Math.max(b.width, 40)} height={Math.max(b.height, 40)}
              fill="hsl(var(--foreground))" fillOpacity={0.4} />;
          })}
          <rect x={viewport.x} y={viewport.y} width={viewport.w} height={viewport.h}
            fill="none" stroke="hsl(var(--primary))" strokeWidth={30 / scale} />
        </g>
      </svg>
    </div>
  );
}

function StatusBar({ cursor, viewport, grid }: {
  cursor: Point | null; viewport: Editor2DViewport; grid: number;
}) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border/60 bg-background/85 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
      {cursor
        ? <>x: <span className="text-foreground">{formatMm(cursor.x)}</span> · y: <span className="text-foreground">{formatMm(cursor.y)}</span></>
        : "aguardando cursor"} · grid: {grid} mm · zoom: {(1000 / viewport.w * 100).toFixed(0)}%
    </div>
  );
}

function LayersPanel({ view, dispatch }: { view: ViewState; dispatch: (a: ViewAction) => void }) {
  return (
    <div className="border-b border-border/60 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Camadas</div>
      <ul className="space-y-1">
        {view.layers.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-sm">
            <button type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => dispatch({ type: "layer", id: l.id, patch: { visible: !l.visible } })}
              title={l.visible ? "Ocultar" : "Mostrar"}>
              {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => dispatch({ type: "layer", id: l.id, patch: { locked: !l.locked } })}
              title={l.locked ? "Destravar" : "Travar"}>
              {l.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <span className="flex-1 truncate">{l.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Inspector({ selection, onPatch }: {
  selection: readonly Editor2DPrimitive[];
  onPatch: (id: string, patch: Partial<Editor2DPrimitive>) => void;
}) {
  if (selection.length === 0) {
    return (
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspector</div>
        <p className="text-xs text-muted-foreground">
          Selecione um elemento para editar suas medidas. Atalhos: V select, W parede, D porta, N janela, F piso, C teto, G guia.
        </p>
      </div>
    );
  }
  if (selection.length > 1) {
    return (
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspector</div>
        <p className="text-xs text-muted-foreground">{selection.length} elementos selecionados. Use R (rotacionar), M (espelhar), Ctrl D (duplicar), Del (remover).</p>
      </div>
    );
  }
  const p = selection[0];
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspector</span>
        <span className="text-[10px] text-muted-foreground">{p.kind}{p.kind === "opening" ? ` · ${p.role}` : ""}</span>
      </div>
      <div className="space-y-2">
        {p.kind === "wall" && (
          <>
            <NumField label="X inicial" value={p.x1} onChange={(v) => onPatch(p.id, { x1: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Y inicial" value={p.y1} onChange={(v) => onPatch(p.id, { y1: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="X final" value={p.x2} onChange={(v) => onPatch(p.id, { x2: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Y final" value={p.y2} onChange={(v) => onPatch(p.id, { y2: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Espessura" value={p.thickness} onChange={(v) => onPatch(p.id, { thickness: v } as Partial<Editor2DPrimitive>)} />
          </>
        )}
        {p.kind === "opening" && (
          <>
            <NumField label="X" value={p.x} onChange={(v) => onPatch(p.id, { x: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Y" value={p.y} onChange={(v) => onPatch(p.id, { y: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Largura" value={p.width} onChange={(v) => onPatch(p.id, { width: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Altura" value={p.height} onChange={(v) => onPatch(p.id, { height: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Rotação (°)" value={p.rotation} onChange={(v) => onPatch(p.id, { rotation: v } as Partial<Editor2DPrimitive>)} />
          </>
        )}
        {(p.kind === "floor" || p.kind === "ceiling") && (
          <>
            <NumField label="X" value={p.x} onChange={(v) => onPatch(p.id, { x: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Y" value={p.y} onChange={(v) => onPatch(p.id, { y: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Largura" value={p.width} onChange={(v) => onPatch(p.id, { width: v } as Partial<Editor2DPrimitive>)} />
            <NumField label="Profundidade" value={p.depth} onChange={(v) => onPatch(p.id, { depth: v } as Partial<Editor2DPrimitive>)} />
          </>
        )}
        {p.kind === "guide" && (
          <NumField label={p.axis === "h" ? "Y" : "X"} value={p.pos}
            onChange={(v) => onPatch(p.id, { pos: v } as Partial<Editor2DPrimitive>)} />
        )}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function fitViewport(room: PlannerRoom, cw: number, ch: number): Editor2DViewport {
  const rw = room.dimensions.width;
  const rd = room.dimensions.depth;
  const pad = 400;
  const aspect = Math.max(cw, 1) / Math.max(ch, 1);
  let w = rw + pad * 2;
  let h = rd + pad * 2;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  return { x: -pad - (w - (rw + pad * 2)) / 2, y: -pad - (h - (rd + pad * 2)) / 2, w, h };
}

function adaptiveStep(base: number, viewportW: number): number {
  const scale = viewportW / 10000;
  const multiplier = Math.pow(2, Math.max(0, Math.floor(Math.log2(Math.max(scale, 0.25)))));
  return base * multiplier;
}

function formatMm(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(2)} m`;
  return `${Math.round(v)} mm`;
}

function cursorFor(tool: Editor2DTool, space: boolean, panning: boolean, dragging: boolean): string {
  if (space || panning || tool === "pan") return "grab";
  if (dragging) return "grabbing";
  if (tool === "select") return "default";
  return "crosshair";
}

function isHit(p: Editor2DPrimitive, world: Point): boolean {
  if (p.kind === "wall") {
    return pointToSegmentDistance(world, { x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 })
      <= Math.max(p.thickness / 2, 60);
  }
  if (p.kind === "guide") {
    return p.axis === "h" ? Math.abs(world.y - p.pos) <= 40 : Math.abs(world.x - p.pos) <= 40;
  }
  const b = primitiveBBox(p);
  return world.x >= b.x && world.x <= b.x + b.width && world.y >= b.y && world.y <= b.y + b.height;
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distance(p, a);
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1);
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function primitiveBBox(p: Editor2DPrimitive) {
  switch (p.kind) {
    case "wall":
      return normalizeRect({ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 });
    case "opening":
      return { x: p.x, y: p.y, width: p.width, height: p.height };
    case "floor":
    case "ceiling":
      return { x: p.x, y: p.y, width: p.width, height: p.depth };
    case "guide":
      return p.axis === "h"
        ? { x: -1e5, y: p.pos - 20, width: 2e5, height: 40 }
        : { x: p.pos - 20, y: -1e5, width: 40, height: 2e5 };
  }
}

function primitivesBBox(list: readonly Editor2DPrimitive[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of list) {
    const b = primitiveBBox(p);
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function translatePrimitive(p: Editor2DPrimitive, dx: number, dy: number): Editor2DPrimitive {
  switch (p.kind) {
    case "wall":
      return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
    case "opening":
    case "floor":
    case "ceiling":
      return { ...p, x: p.x + dx, y: p.y + dy };
    case "guide":
      return { ...p, pos: p.pos + (p.axis === "h" ? dy : dx) };
  }
}

function rotatePrimitive(p: Editor2DPrimitive, deg: number): Editor2DPrimitive {
  if (p.kind === "wall") {
    const cx = (p.x1 + p.x2) / 2, cy = (p.y1 + p.y2) / 2;
    const rad = (deg * Math.PI) / 180;
    const rot = (x: number, y: number) => ({
      x: cx + Math.cos(rad) * (x - cx) - Math.sin(rad) * (y - cy),
      y: cy + Math.sin(rad) * (x - cx) + Math.cos(rad) * (y - cy),
    });
    const a = rot(p.x1, p.y1); const b = rot(p.x2, p.y2);
    return { ...p, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }
  if (p.kind === "opening") return { ...p, rotation: (p.rotation + deg) % 360 };
  if (p.kind === "floor" || p.kind === "ceiling")
    return { ...p, width: p.depth, depth: p.width };
  if (p.kind === "guide") return { ...p, axis: p.axis === "h" ? "v" : "h" };
  return p;
}

function mirrorPrimitive(p: Editor2DPrimitive, axisX: number): Editor2DPrimitive {
  switch (p.kind) {
    case "wall":
      return { ...p, x1: reflect(p.x1, axisX), x2: reflect(p.x2, axisX) };
    case "opening":
    case "floor":
    case "ceiling":
      return { ...p, x: reflect(p.x + (p.kind === "opening" ? p.width : p.width), axisX) };
    case "guide":
      return p.axis === "v" ? { ...p, pos: reflect(p.pos, axisX) } : p;
  }
}

function clonePrimitive(p: Editor2DPrimitive, offset: number): Editor2DPrimitive {
  const id = makePrimitiveId(p.kind);
  const t = translatePrimitive(p, offset, offset);
  return { ...t, id } as Editor2DPrimitive;
}

function draftToPrimitive(d: Editor2DDraft): Editor2DPrimitive | null {
  if (d.tool === "wall") {
    if (distance({ x: d.x1, y: d.y1 }, { x: d.x2, y: d.y2 }) < 50) return null;
    return {
      id: makePrimitiveId("wall"),
      kind: "wall",
      layer: "walls",
      locked: false,
      x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2,
      thickness: 100,
    };
  }
  const r = normalizeRect({ x: d.x1, y: d.y1 }, { x: d.x2, y: d.y2 });
  if (r.width < 50 || r.height < 50) return null;
  if (d.tool === "door" || d.tool === "window") {
    return {
      id: makePrimitiveId("opening"),
      kind: "opening",
      role: d.tool,
      layer: "openings",
      locked: false,
      x: r.x, y: r.y, width: r.width, height: r.height, rotation: 0,
    };
  }
  if (d.tool === "floor" || d.tool === "ceiling") {
    return {
      id: makePrimitiveId(d.tool),
      kind: d.tool,
      layer: d.tool === "floor" ? "floors" : "ceilings",
      locked: false,
      x: r.x, y: r.y, width: r.width, depth: r.height,
    };
  }
  return null;
}
