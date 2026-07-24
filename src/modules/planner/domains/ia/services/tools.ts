/**
 * Ferramentas da IA do Planner.
 *
 * Cada tool é uma função PURA que recebe o `PlannerProject` atual + args
 * e retorna um novo `PlannerProject`. Nenhuma tool cria store, provider,
 * cópia do projeto ou motor paralelo — todas alimentam o MESMO objeto
 * paramétrico persistido pelo `PlannerEditorProvider`. Isso preserva
 * Undo/Redo, Autosave, Histórico e a sincronização 2D/3D/Engenharia.
 */
import type {
  PlannerProject,
  PlannerRoom,
  PlannerEnvironment,
} from "@/modules/planner/shared";
import {
  CATALOG_ITEMS,
  findCatalogItem,
  insertItemIntoProject,
  listPrimitives,
  makePrimitiveId,
  upsertPrimitive,
  removeNodes,
  fromPrimitive,
  type CatalogItem,
  type CatalogSubtype,
  type Editor2DPrimitive,
} from "@/modules/planner/shared";

export interface ToolContext {
  environmentId: string;
  roomId: string;
  selectionIds?: readonly string[];
}

export interface ToolExecutionResult {
  project: PlannerProject;
  summary: string;
  affectedIds: readonly string[];
}

// ─────────────────────────── helpers ───────────────────────────

function getRoom(project: PlannerProject, ctx: ToolContext): PlannerRoom | null {
  const env = project.environments.find((e) => e.id === ctx.environmentId);
  return env?.rooms.find((r) => r.id === ctx.roomId) ?? null;
}

function updateRoom(
  project: PlannerProject,
  ctx: ToolContext,
  fn: (room: PlannerRoom) => PlannerRoom,
): PlannerProject {
  return {
    ...project,
    environments: project.environments.map((env) =>
      env.id !== ctx.environmentId
        ? env
        : {
            ...env,
            rooms: env.rooms.map((r) => (r.id === ctx.roomId ? fn(r) : r)),
            updatedAt: new Date().toISOString(),
          },
    ),
  };
}

function furnitureInRoom(room: PlannerRoom): Extract<Editor2DPrimitive, { kind: "furniture" }>[] {
  return listPrimitives(room).filter(
    (p): p is Extract<Editor2DPrimitive, { kind: "furniture" }> => p.kind === "furniture",
  );
}

function pickItemsBySubtype(subtype: CatalogSubtype | string): CatalogItem[] {
  return CATALOG_ITEMS.filter((i) => i.subtype === subtype);
}

function firstItem(subtype: CatalogSubtype | string): CatalogItem | null {
  return pickItemsBySubtype(subtype)[0] ?? null;
}

function applySelection(
  room: PlannerRoom,
  ctx: ToolContext,
): Extract<Editor2DPrimitive, { kind: "furniture" }>[] {
  const all = furnitureInRoom(room);
  if (!ctx.selectionIds || ctx.selectionIds.length === 0) return all;
  const set = new Set(ctx.selectionIds);
  return all.filter((f) => set.has(f.id));
}

function mutateFurniture(
  project: PlannerProject,
  ctx: ToolContext,
  targets: readonly Extract<Editor2DPrimitive, { kind: "furniture" }>[],
  mutator: (p: Extract<Editor2DPrimitive, { kind: "furniture" }>) =>
    Extract<Editor2DPrimitive, { kind: "furniture" }>,
): PlannerProject {
  return updateRoom(project, ctx, (room) => {
    let r = room;
    for (const t of targets) r = upsertPrimitive(r, mutator(t));
    return r;
  });
}

// ─────────────────────────── inserts ───────────────────────────

export function toolInsertItem(
  project: PlannerProject,
  ctx: ToolContext,
  args: { catalogItemId?: string; subtype?: string; count?: number; at?: { x: number; y: number } },
): ToolExecutionResult {
  const item =
    (args.catalogItemId && findCatalogItem(args.catalogItemId)) ||
    (args.subtype && firstItem(args.subtype));
  if (!item) {
    return { project, summary: `Nenhum item do catálogo compatível com "${args.subtype ?? args.catalogItemId}".`, affectedIds: [] };
  }
  const count = Math.max(1, Math.min(20, args.count ?? 1));
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Selecione um cômodo antes de inserir.", affectedIds: [] };

  const startX = args.at?.x ?? room.dimensions.width / 2;
  const startY = args.at?.y ?? room.dimensions.depth / 2;
  const step = item.parametric.defaults.width + 40;

  let next = project;
  for (let i = 0; i < count; i++) {
    next = insertItemIntoProject(next, ctx, item, {
      at: { x: startX + i * step, y: startY },
    });
  }
  return {
    project: next,
    summary: `${count}× ${item.name} inserido${count > 1 ? "s" : ""} em ${room.name}.`,
    affectedIds: [],
  };
}

// ───── presets de ambiente (cozinha/closet/quarto/…) ─────

interface RoomPreset {
  label: string;
  items: ReadonlyArray<{ subtype: CatalogSubtype; qty: number }>;
  style?: string;
}

const ROOM_PRESETS: Readonly<Record<string, RoomPreset>> = {
  cozinha: {
    label: "Cozinha moderna",
    items: [
      { subtype: "balcao", qty: 2 },
      { subtype: "aereo", qty: 3 },
      { subtype: "gaveteiro", qty: 1 },
      { subtype: "torre", qty: 1 },
      { subtype: "tampo", qty: 1 },
      { subtype: "ilha", qty: 1 },
    ],
    style: "moderno",
  },
  closet: {
    label: "Closet completo",
    items: [
      { subtype: "closet", qty: 3 },
      { subtype: "gaveteiro", qty: 2 },
      { subtype: "prateleira", qty: 4 },
    ],
    style: "minimalista",
  },
  dormitorio: {
    label: "Dormitório",
    items: [
      { subtype: "roupeiro", qty: 1 },
      { subtype: "painel", qty: 1 },
      { subtype: "gaveteiro", qty: 1 },
    ],
  },
  sala: {
    label: "Sala integrada",
    items: [
      { subtype: "painel", qty: 1 },
      { subtype: "cristaleira", qty: 1 },
      { subtype: "nicho", qty: 3 },
    ],
  },
  escritorio: {
    label: "Home office",
    items: [
      { subtype: "bancada", qty: 1 },
      { subtype: "gaveteiro", qty: 1 },
      { subtype: "prateleira", qty: 3 },
    ],
  },
  banheiro: {
    label: "Banheiro",
    items: [
      { subtype: "gaveteiro", qty: 1 },
      { subtype: "espelho", qty: 1 },
      { subtype: "nicho", qty: 2 },
    ],
  },
};

export function toolCreateRoomPreset(
  project: PlannerProject,
  ctx: ToolContext,
  args: { preset: string; style?: string },
): ToolExecutionResult {
  const preset = ROOM_PRESETS[args.preset];
  if (!preset) {
    return {
      project,
      summary: `Não conheço o ambiente "${args.preset}". Tente cozinha, closet, dormitório, sala, escritório ou banheiro.`,
      affectedIds: [],
    };
  }
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Selecione um cômodo antes de criar o ambiente.", affectedIds: [] };

  let next = project;
  let x = 300;
  const y = room.dimensions.depth / 2;
  let inserted = 0;
  for (const { subtype, qty } of preset.items) {
    const item = firstItem(subtype);
    if (!item) continue;
    for (let i = 0; i < qty; i++) {
      next = insertItemIntoProject(next, ctx, item, { at: { x, y } });
      x += item.parametric.defaults.width + 40;
      inserted++;
    }
  }
  return {
    project: next,
    summary: `${preset.label} criado — ${inserted} peças inseridas em ${room.name}.`,
    affectedIds: [],
  };
}

// ───── mutações em lote (material/cor/estilo/abrir/etc.) ─────

export function toolChangeMaterial(
  project: PlannerProject,
  ctx: ToolContext,
  args: { material: string },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Não há móveis para alterar.", affectedIds: [] };
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: { ...f.params, material: args.material },
  }));
  return {
    project: next,
    summary: `Material trocado para "${args.material}" em ${targets.length} móvel(is).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolChangeColor(
  project: PlannerProject,
  ctx: ToolContext,
  args: { color: string },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Não há móveis para colorir.", affectedIds: [] };
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: { ...f.params, color: args.color },
  }));
  return {
    project: next,
    summary: `Acabamento trocado para "${args.color}" em ${targets.length} móvel(is).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolResize(
  project: PlannerProject,
  ctx: ToolContext,
  args: { factor?: number; width?: number; depth?: number; height?: number },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nenhum móvel selecionado.", affectedIds: [] };
  const factor = args.factor ?? 1;
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    width: Math.max(100, Math.round(args.width ?? f.width * factor)),
    depth: Math.max(100, Math.round(args.depth ?? f.depth * factor)),
    height: Math.max(100, Math.round(args.height ?? f.height * factor)),
  }));
  const label = args.factor
    ? `redimensionamento ×${factor}`
    : `dimensões ${args.width ?? "-"}×${args.depth ?? "-"}×${args.height ?? "-"} mm`;
  return { project: next, summary: `${targets.length} móvel(is) — ${label}.`, affectedIds: targets.map((t) => t.id) };
}

export function toolOpenAll(
  project: PlannerProject,
  ctx: ToolContext,
  args: { target: "doors" | "drawers" | "all"; open: boolean },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  const keyDoor = "open:doors";
  const keyDraw = "open:drawers";
  const next = mutateFurniture(project, ctx, targets, (f) => {
    const params = { ...f.params };
    if (args.target === "doors" || args.target === "all") params[keyDoor] = args.open;
    if (args.target === "drawers" || args.target === "all") params[keyDraw] = args.open;
    return { ...f, params };
  });
  const label = args.target === "doors" ? "portas" : args.target === "drawers" ? "gavetas" : "portas e gavetas";
  return {
    project: next,
    summary: `${args.open ? "Abri" : "Fechei"} ${label} de ${targets.length} móvel(is).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolToggleLED(
  project: PlannerProject,
  ctx: ToolContext,
  args: { on: boolean },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: { ...f.params, "led:on": args.on, "led:kelvin": 3000 },
  }));
  if (args.on && targets.length === 0) {
    // se não há móveis, insere fita LED como iluminação de ambiente
    const led = findCatalogItem("led-fita");
    if (led) {
      const ins = insertItemIntoProject(project, ctx, led, {
        at: { x: room.dimensions.width / 2, y: 300 },
      });
      return { project: ins, summary: "LED de ambiente adicionado.", affectedIds: [] };
    }
  }
  return {
    project: next,
    summary: `LEDs ${args.on ? "ligados" : "desligados"} em ${targets.length} móvel(is).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolChangeHardware(
  project: PlannerProject,
  ctx: ToolContext,
  args: { kind: "puxador" | "dobradica" | "corredica" | "pistao"; value: string },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  const key = `eng:hardware:${args.kind}`;
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: { ...f.params, [key]: args.value },
  }));
  return {
    project: next,
    summary: `${args.kind} atualizado para "${args.value}" em ${targets.length || "todos os"} móvel(is).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolDuplicate(
  project: PlannerProject,
  ctx: ToolContext,
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nada para duplicar.", affectedIds: [] };
  const next = updateRoom(project, ctx, (r) => {
    let out = r;
    for (const t of targets) {
      const clone: Editor2DPrimitive = {
        ...t,
        id: makePrimitiveId("furniture"),
        x: t.x + 200,
        y: t.y + 100,
      };
      out = upsertPrimitive(out, clone);
    }
    return out;
  });
  return { project: next, summary: `${targets.length} móvel(is) duplicado(s).`, affectedIds: [] };
}

export function toolRotate(
  project: PlannerProject,
  ctx: ToolContext,
  args: { degrees: number },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nada para rotacionar.", affectedIds: [] };
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    rotation: ((f.rotation ?? 0) + args.degrees) % 360,
  }));
  return {
    project: next,
    summary: `${targets.length} móvel(is) rotacionado(s) em ${args.degrees}°.`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolMirror(
  project: PlannerProject,
  ctx: ToolContext,
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nada para espelhar.", affectedIds: [] };
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: { ...f.params, "eng:mirrored": !(f.params["eng:mirrored"] === true) },
  }));
  return { project: next, summary: `${targets.length} móvel(is) espelhado(s).`, affectedIds: targets.map((t) => t.id) };
}

export function toolRemove(
  project: PlannerProject,
  ctx: ToolContext,
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nada para remover.", affectedIds: [] };
  const next = updateRoom(project, ctx, (r) => removeNodes(r, new Set(targets.map((t) => t.id))));
  return {
    project: next,
    summary: `${targets.length} móvel(is) removido(s).`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolCenter(
  project: PlannerProject,
  ctx: ToolContext,
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const targets = applySelection(room, ctx);
  if (targets.length === 0) return { project, summary: "Nada para centralizar.", affectedIds: [] };
  const cx = room.dimensions.width / 2;
  const cy = room.dimensions.depth / 2;
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    x: cx - f.width / 2,
    y: cy - f.depth / 2,
  }));
  return { project: next, summary: `${targets.length} móvel(is) centralizado(s).`, affectedIds: [] };
}

export function toolSetStyle(
  project: PlannerProject,
  ctx: ToolContext,
  args: { style: string },
): ToolExecutionResult {
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const styleMap: Record<string, { color: string; material: string }> = {
    minimalista: { color: "Branco TX", material: "MDF 18mm" },
    classico: { color: "Nogueira", material: "MDF 18mm" },
    industrial: { color: "Grafite", material: "MDF 18mm" },
    luxo: { color: "Carvalho Naturale", material: "MDF 18mm" },
    moderno: { color: "Grafite", material: "MDF 18mm" },
  };
  const style = styleMap[args.style];
  if (!style) return { project, summary: `Estilo "${args.style}" não reconhecido.`, affectedIds: [] };
  const targets = furnitureInRoom(room);
  const next = mutateFurniture(project, ctx, targets, (f) => ({
    ...f,
    params: {
      ...f.params,
      color: style.color,
      material: style.material,
      "eng:style": args.style,
    },
  }));
  return {
    project: next,
    summary: `Estilo "${args.style}" aplicado — ${targets.length} peças harmonizadas.`,
    affectedIds: targets.map((t) => t.id),
  };
}

export function toolPanelRipado(
  project: PlannerProject,
  ctx: ToolContext,
  args: { width?: number; height?: number },
): ToolExecutionResult {
  const item = findCatalogItem("mod-painel-tv");
  if (!item) return { project, summary: "Painel indisponível no catálogo.", affectedIds: [] };
  const room = getRoom(project, ctx);
  if (!room) return { project, summary: "Sem cômodo ativo.", affectedIds: [] };
  const next = insertItemIntoProject(project, ctx, item, {
    at: { x: room.dimensions.width / 2, y: 200 },
    overrides: { width: args.width ?? 2400, height: args.height ?? 2400 },
    params: { style: "ripado", "eng:ripado": true },
  });
  return { project: next, summary: "Painel ripado adicionado.", affectedIds: [] };
}

// Registro para descoberta/documentação (futuro Marketplace de tools).
export type ToolName =
  | "insert_item"
  | "create_room_preset"
  | "change_material"
  | "change_color"
  | "resize"
  | "open_all"
  | "toggle_led"
  | "change_hardware"
  | "duplicate"
  | "rotate"
  | "mirror"
  | "remove"
  | "center"
  | "set_style"
  | "panel_ripado";

export interface ToolDescriptor {
  name: ToolName;
  label: string;
  description: string;
}

export const PLANNER_TOOL_REGISTRY: readonly ToolDescriptor[] = [
  { name: "insert_item", label: "Inserir peça", description: "Adiciona um item da biblioteca ao cômodo ativo." },
  { name: "create_room_preset", label: "Criar ambiente", description: "Monta um ambiente completo (cozinha, closet, etc.)." },
  { name: "change_material", label: "Trocar material", description: "Substitui o material dos móveis." },
  { name: "change_color", label: "Trocar acabamento", description: "Substitui a cor/acabamento dos móveis." },
  { name: "resize", label: "Redimensionar", description: "Altera largura/profundidade/altura." },
  { name: "open_all", label: "Abrir/fechar", description: "Abre ou fecha portas e gavetas." },
  { name: "toggle_led", label: "Iluminação LED", description: "Liga/desliga LEDs ou adiciona fita." },
  { name: "change_hardware", label: "Trocar ferragem", description: "Puxadores, dobradiças, corrediças, pistões." },
  { name: "duplicate", label: "Duplicar", description: "Duplica o item selecionado." },
  { name: "rotate", label: "Rotacionar", description: "Gira os móveis em graus." },
  { name: "mirror", label: "Espelhar", description: "Espelha o móvel." },
  { name: "remove", label: "Remover", description: "Remove o móvel." },
  { name: "center", label: "Centralizar", description: "Centraliza no cômodo." },
  { name: "set_style", label: "Aplicar estilo", description: "Minimalista, clássico, industrial, luxo, moderno." },
  { name: "panel_ripado", label: "Painel ripado", description: "Insere um painel decorativo ripado." },
];

// Bindings entre nomes e funções — usados pelo executor.
export const TOOL_FUNCTIONS = {
  insert_item: toolInsertItem,
  create_room_preset: toolCreateRoomPreset,
  change_material: toolChangeMaterial,
  change_color: toolChangeColor,
  resize: toolResize,
  open_all: toolOpenAll,
  toggle_led: toolToggleLED,
  change_hardware: toolChangeHardware,
  duplicate: (p: PlannerProject, c: ToolContext) => toolDuplicate(p, c),
  rotate: toolRotate,
  mirror: (p: PlannerProject, c: ToolContext) => toolMirror(p, c),
  remove: (p: PlannerProject, c: ToolContext) => toolRemove(p, c),
  center: (p: PlannerProject, c: ToolContext) => toolCenter(p, c),
  set_style: toolSetStyle,
  panel_ripado: toolPanelRipado,
} as const;

// Sinal explícito de que `fromPrimitive` e `PlannerEnvironment` são reexportados
// apenas para conveniência de futuras tools sem tocar o barrel do domínio.
export { fromPrimitive };
export type { PlannerEnvironment };