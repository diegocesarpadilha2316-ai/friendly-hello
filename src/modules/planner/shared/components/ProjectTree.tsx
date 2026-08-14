/**
 * ProjectTree — árvore hierárquica estilo Blender do projeto ativo.
 *
 * Fonte de verdade: PlannerEditorProvider (state.project). Toda mutação
 * passa exclusivamente por updateProject() para preservar
 * autosave / undo / redo / histórico. Nenhum store paralelo é criado.
 *
 * Ações por item:
 *   • Selecionar (clique)                • Mostrar / Ocultar
 *   • Renomear (F2 / duplo clique)       • Travar / Destravar
 *   • Duplicar                           • Cor de identificação
 *   • Excluir                            • Reordenar (↑ / ↓)
 *
 * Convenções de metadados em nós paramétricos (persistidos em `params`,
 * campo já tipado como Record<string, string|number|boolean|null>):
 *   • params.__hidden : boolean          • params.__locked : boolean
 *   • params.__color  : string (hex)
 *
 * Os viewports 2D/3D podem consultar essas chaves para refletir o estado
 * (feature progressiva — a metadata é preservada mesmo antes disso).
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Home,
  Layers,
  Box,
  DoorOpen,
  Lightbulb,
  Wrench,
  Palette,
  Package,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import type {
  PlannerProject,
  PlannerEnvironment,
  PlannerRoom,
  PlannerParametricNode,
  PlannerParametricNodeKind,
} from "@/modules/planner/shared/types/project";

// ---------------------------------------------------------------------------
// Helpers — metadados armazenados dentro de node.params
// ---------------------------------------------------------------------------

function nodeMeta(node: PlannerParametricNode): {
  hidden: boolean;
  locked: boolean;
  color: string | null;
} {
  const p = node.params ?? {};
  return {
    hidden: p.__hidden === true,
    locked: p.__locked === true,
    color: typeof p.__color === "string" ? p.__color : null,
  };
}

function withNodeParam(
  node: PlannerParametricNode,
  key: string,
  value: string | number | boolean | null,
): PlannerParametricNode {
  const next = { ...(node.params ?? {}) };
  if (value === null) delete next[key];
  else next[key] = value;
  return { ...node, params: next };
}

// Node kind → ícone/rótulo
const KIND_META: Record<
  PlannerParametricNodeKind,
  { label: string; icon: typeof Box; tone: string }
> = {
  wall: { label: "Paredes", icon: Layers, tone: "text-sky-400" },
  floor: { label: "Piso", icon: Package, tone: "text-amber-400" },
  ceiling: { label: "Teto", icon: Package, tone: "text-slate-400" },
  opening: { label: "Aberturas", icon: DoorOpen, tone: "text-emerald-400" },
  module: { label: "Móveis", icon: Box, tone: "text-primary" },
  hardware: { label: "Ferragens", icon: Wrench, tone: "text-fuchsia-400" },
  material: { label: "Materiais", icon: Palette, tone: "text-orange-400" },
};

const KIND_ORDER: PlannerParametricNodeKind[] = [
  "wall",
  "floor",
  "ceiling",
  "opening",
  "module",
  "hardware",
  "material",
];

const COLOR_PALETTE = [
  "#6366f1", // primary
  "#22c55e", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#a855f7", // violet
  "#ec4899", // pink
  null, // limpar
] as const;

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ProjectTree({ className }: { className?: string }) {
  const { state, updateProject, select } = usePlannerEditor();
  const project = state.project;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = useState<string | null>(null);

  const toggleCollapse = useCallback(
    (id: string) => setCollapsed((m) => ({ ...m, [id]: !m[id] })),
    [],
  );

  const isCollapsed = (id: string) => collapsed[id] === true;

  if (!project) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-md border border-dashed border-border/60 p-6 text-xs text-muted-foreground",
          className,
        )}
      >
        Nenhum projeto ativo.
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Layers className="h-3 w-3" /> Estrutura
        </div>
        <span className="text-[10px] text-muted-foreground/70">
          {project.environments.length} ambiente(s)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-sm">
        {/* Raiz — projeto */}
        <TreeRow
          depth={0}
          icon={<Home className="h-3.5 w-3.5 text-primary" />}
          label={project.name}
          hint="Projeto"
          collapsed={isCollapsed(project.id)}
          onToggle={() => toggleCollapse(project.id)}
          isRenaming={renaming === project.id}
          onRenameStart={() => setRenaming(project.id)}
          onRenameEnd={(name) => {
            if (name) updateProject((p) => ({ ...p, name }));
            setRenaming(null);
          }}
          selected={false}
        />

        {!isCollapsed(project.id) &&
          project.environments.map((env, envIndex) => (
            <EnvironmentBranch
              key={env.id}
              env={env}
              envIndex={envIndex}
              envCount={project.environments.length}
              collapsedMap={collapsed}
              onToggle={toggleCollapse}
              renaming={renaming}
              setRenaming={setRenaming}
              selectedEnvironmentId={state.selectedEnvironmentId}
              selectedRoomId={state.selectedRoomId}
              onSelect={select}
              onUpdate={updateProject}
            />
          ))}
      </div>

      <div className="border-t border-border/60 bg-background/40 px-3 py-2 text-[10px] text-muted-foreground/80">
        Duplo-clique renomeia · Arraste ↑↓ para reordenar
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Env → Room → Kind group → Node
// ---------------------------------------------------------------------------

function EnvironmentBranch({
  env,
  envIndex,
  envCount,
  collapsedMap,
  onToggle,
  renaming,
  setRenaming,
  selectedEnvironmentId,
  selectedRoomId,
  onSelect,
  onUpdate,
}: {
  env: PlannerEnvironment;
  envIndex: number;
  envCount: number;
  collapsedMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  renaming: string | null;
  setRenaming: (id: string | null) => void;
  selectedEnvironmentId: string | null;
  selectedRoomId: string | null;
  onSelect: (patch: { environmentId?: string | null; roomId?: string | null }) => void;
  onUpdate: (fn: (p: PlannerProject) => PlannerProject) => void;
}) {
  const collapsed = collapsedMap[env.id] === true;
  const isSel = env.id === selectedEnvironmentId;

  return (
    <div className="mb-0.5">
      <TreeRow
        depth={1}
        icon={<Home className="h-3.5 w-3.5 text-emerald-400" />}
        label={env.name}
        hint={`${env.rooms.length} cômodo(s)`}
        collapsed={collapsed}
        onToggle={() => onToggle(env.id)}
        selected={isSel}
        onSelect={() => onSelect({ environmentId: env.id, roomId: env.rooms[0]?.id ?? null })}
        isRenaming={renaming === env.id}
        onRenameStart={() => setRenaming(env.id)}
        onRenameEnd={(name) => {
          if (name)
            onUpdate((p) => ({
              ...p,
              environments: p.environments.map((e) => (e.id === env.id ? { ...e, name } : e)),
            }));
          setRenaming(null);
        }}
        actions={
          <ItemActionsMenu
            onDuplicate={() =>
              onUpdate((p) => ({
                ...p,
                environments: [
                  ...p.environments,
                  {
                    ...env,
                    id: cryptoRandom(),
                    name: `${env.name} (cópia)`,
                    rooms: env.rooms.map((r) => ({ ...r, id: cryptoRandom() })),
                  },
                ],
              }))
            }
            onDelete={() => {
              if (!confirm(`Excluir ambiente "${env.name}"?`)) return;
              onUpdate((p) => ({
                ...p,
                environments: p.environments.filter((e) => e.id !== env.id),
              }));
            }}
            onMoveUp={
              envIndex > 0
                ? () =>
                    onUpdate((p) => {
                      const arr = [...p.environments];
                      [arr[envIndex - 1], arr[envIndex]] = [arr[envIndex], arr[envIndex - 1]];
                      return { ...p, environments: arr };
                    })
                : undefined
            }
            onMoveDown={
              envIndex < envCount - 1
                ? () =>
                    onUpdate((p) => {
                      const arr = [...p.environments];
                      [arr[envIndex + 1], arr[envIndex]] = [arr[envIndex], arr[envIndex + 1]];
                      return { ...p, environments: arr };
                    })
                : undefined
            }
            onRename={() => setRenaming(env.id)}
          />
        }
      />

      {!collapsed &&
        env.rooms.map((room, roomIndex) => (
          <RoomBranch
            key={room.id}
            env={env}
            room={room}
            roomIndex={roomIndex}
            roomCount={env.rooms.length}
            collapsedMap={collapsedMap}
            onToggle={onToggle}
            renaming={renaming}
            setRenaming={setRenaming}
            selected={room.id === selectedRoomId}
            onSelect={onSelect}
            onUpdate={onUpdate}
          />
        ))}
    </div>
  );
}

function RoomBranch({
  env,
  room,
  roomIndex,
  roomCount,
  collapsedMap,
  onToggle,
  renaming,
  setRenaming,
  selected,
  onSelect,
  onUpdate,
}: {
  env: PlannerEnvironment;
  room: PlannerRoom;
  roomIndex: number;
  roomCount: number;
  collapsedMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  renaming: string | null;
  setRenaming: (id: string | null) => void;
  selected: boolean;
  onSelect: (patch: { environmentId?: string | null; roomId?: string | null }) => void;
  onUpdate: (fn: (p: PlannerProject) => PlannerProject) => void;
}) {
  const collapsed = collapsedMap[room.id] === true;

  // Agrupa nós por kind
  const grouped = useMemo(() => {
    const buckets: Partial<Record<PlannerParametricNodeKind, PlannerParametricNode[]>> = {};
    for (const nodeId of room.nodeOrder) {
      const n = room.nodes[nodeId];
      if (!n) continue;
      const arr = (buckets[n.kind] ?? []) as PlannerParametricNode[];
      arr.push(n);
      buckets[n.kind] = arr;
    }
    return buckets;
  }, [room.nodes, room.nodeOrder]);

  const patchRoom = (fn: (r: PlannerRoom) => PlannerRoom) =>
    onUpdate((p) => ({
      ...p,
      environments: p.environments.map((e) =>
        e.id === env.id ? { ...e, rooms: e.rooms.map((r) => (r.id === room.id ? fn(r) : r)) } : e,
      ),
    }));

  return (
    <div className="mb-0.5">
      <TreeRow
        depth={2}
        icon={<Package className="h-3.5 w-3.5 text-sky-400" />}
        label={room.name}
        hint={`${room.dimensions.width}×${room.dimensions.depth}×${room.dimensions.height} mm`}
        collapsed={collapsed}
        onToggle={() => onToggle(room.id)}
        selected={selected}
        onSelect={() => onSelect({ environmentId: env.id, roomId: room.id })}
        isRenaming={renaming === room.id}
        onRenameStart={() => setRenaming(room.id)}
        onRenameEnd={(name) => {
          if (name) patchRoom((r) => ({ ...r, name }));
          setRenaming(null);
        }}
        actions={
          <ItemActionsMenu
            onDuplicate={() =>
              onUpdate((p) => ({
                ...p,
                environments: p.environments.map((e) =>
                  e.id === env.id
                    ? {
                        ...e,
                        rooms: [
                          ...e.rooms,
                          { ...room, id: cryptoRandom(), name: `${room.name} (cópia)` },
                        ],
                      }
                    : e,
                ),
              }))
            }
            onDelete={() => {
              if (!confirm(`Excluir cômodo "${room.name}"?`)) return;
              onUpdate((p) => ({
                ...p,
                environments: p.environments.map((e) =>
                  e.id === env.id ? { ...e, rooms: e.rooms.filter((r) => r.id !== room.id) } : e,
                ),
              }));
            }}
            onMoveUp={
              roomIndex > 0
                ? () =>
                    onUpdate((p) => ({
                      ...p,
                      environments: p.environments.map((e) => {
                        if (e.id !== env.id) return e;
                        const arr = [...e.rooms];
                        [arr[roomIndex - 1], arr[roomIndex]] = [arr[roomIndex], arr[roomIndex - 1]];
                        return { ...e, rooms: arr };
                      }),
                    }))
                : undefined
            }
            onMoveDown={
              roomIndex < roomCount - 1
                ? () =>
                    onUpdate((p) => ({
                      ...p,
                      environments: p.environments.map((e) => {
                        if (e.id !== env.id) return e;
                        const arr = [...e.rooms];
                        [arr[roomIndex + 1], arr[roomIndex]] = [arr[roomIndex], arr[roomIndex + 1]];
                        return { ...e, rooms: arr };
                      }),
                    }))
                : undefined
            }
            onRename={() => setRenaming(room.id)}
          />
        }
      />

      {!collapsed &&
        KIND_ORDER.map((kind) => {
          const items = grouped[kind];
          if (!items || items.length === 0) return null;
          const groupId = `${room.id}:${kind}`;
          const groupCollapsed = collapsedMap[groupId] === true;
          const KindIcon = KIND_META[kind].icon;
          return (
            <div key={groupId} className="mb-0.5">
              <TreeRow
                depth={3}
                icon={<KindIcon className={cn("h-3.5 w-3.5", KIND_META[kind].tone)} />}
                label={KIND_META[kind].label}
                hint={`${items.length}`}
                collapsed={groupCollapsed}
                onToggle={() => onToggle(groupId)}
                selected={false}
                muted
              />
              {!groupCollapsed &&
                items.map((node, idx) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    depth={4}
                    isRenaming={renaming === node.id}
                    onRenameStart={() => setRenaming(node.id)}
                    onRenameEnd={(name) => {
                      if (name)
                        patchRoom((r) => ({
                          ...r,
                          nodes: { ...r.nodes, [node.id]: { ...node, label: name } },
                        }));
                      setRenaming(null);
                    }}
                    onToggleHidden={() => {
                      const meta = nodeMeta(node);
                      patchRoom((r) => ({
                        ...r,
                        nodes: {
                          ...r.nodes,
                          [node.id]: withNodeParam(node, "__hidden", !meta.hidden),
                        },
                      }));
                    }}
                    onToggleLocked={() => {
                      const meta = nodeMeta(node);
                      patchRoom((r) => ({
                        ...r,
                        nodes: {
                          ...r.nodes,
                          [node.id]: withNodeParam(node, "__locked", !meta.locked),
                        },
                      }));
                    }}
                    onSetColor={(color) => {
                      patchRoom((r) => ({
                        ...r,
                        nodes: {
                          ...r.nodes,
                          [node.id]: withNodeParam(node, "__color", color),
                        },
                      }));
                    }}
                    onDuplicate={() => {
                      const newId = cryptoRandom();
                      patchRoom((r) => ({
                        ...r,
                        nodes: {
                          ...r.nodes,
                          [newId]: { ...node, id: newId, label: `${node.label} (cópia)` },
                        },
                        nodeOrder: [...r.nodeOrder, newId],
                      }));
                    }}
                    onDelete={() => {
                      patchRoom((r) => {
                        const nodes = { ...r.nodes };
                        delete nodes[node.id];
                        return {
                          ...r,
                          nodes,
                          nodeOrder: r.nodeOrder.filter((n) => n !== node.id),
                        };
                      });
                    }}
                    onMoveUp={
                      idx > 0
                        ? () => {
                            patchRoom((r) => {
                              const order = [...r.nodeOrder];
                              const globalIdx = order.indexOf(node.id);
                              const prevId = items[idx - 1]?.id;
                              const prevGlobalIdx = prevId ? order.indexOf(prevId) : -1;
                              if (globalIdx < 0 || prevGlobalIdx < 0) return r;
                              [order[globalIdx], order[prevGlobalIdx]] = [
                                order[prevGlobalIdx],
                                order[globalIdx],
                              ];
                              return { ...r, nodeOrder: order };
                            });
                          }
                        : undefined
                    }
                    onMoveDown={
                      idx < items.length - 1
                        ? () => {
                            patchRoom((r) => {
                              const order = [...r.nodeOrder];
                              const globalIdx = order.indexOf(node.id);
                              const nextId = items[idx + 1]?.id;
                              const nextGlobalIdx = nextId ? order.indexOf(nextId) : -1;
                              if (globalIdx < 0 || nextGlobalIdx < 0) return r;
                              [order[globalIdx], order[nextGlobalIdx]] = [
                                order[nextGlobalIdx],
                                order[globalIdx],
                              ];
                              return { ...r, nodeOrder: order };
                            });
                          }
                        : undefined
                    }
                  />
                ))}
            </div>
          );
        })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node row com controles de meta
// ---------------------------------------------------------------------------

function NodeRow({
  node,
  depth,
  isRenaming,
  onRenameStart,
  onRenameEnd,
  onToggleHidden,
  onToggleLocked,
  onSetColor,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  node: PlannerParametricNode;
  depth: number;
  isRenaming: boolean;
  onRenameStart: () => void;
  onRenameEnd: (name: string | null) => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onSetColor: (color: string | null) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const meta = nodeMeta(node);
  const [colorOpen, setColorOpen] = useState(false);

  return (
    <TreeRow
      depth={depth}
      icon={<Box className="h-3.5 w-3.5 text-muted-foreground/70" />}
      label={node.label}
      hint=""
      dimmed={meta.hidden}
      selected={false}
      isRenaming={isRenaming}
      onRenameStart={onRenameStart}
      onRenameEnd={onRenameEnd}
      alwaysVisibleActions={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title={meta.hidden ? "Mostrar" : "Ocultar"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHidden();
            }}
            className={cn(
              "rounded p-0.5 transition-colors",
              meta.hidden
                ? "text-muted-foreground/50 hover:text-foreground"
                : "text-foreground/80 hover:text-foreground",
            )}
          >
            {meta.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <div className="relative">
            <button
              type="button"
              title="Cor de identificação"
              onClick={(e) => {
                e.stopPropagation();
                setColorOpen((v) => !v);
              }}
              className="rounded"
            >
              <span
                className="block h-2.5 w-2.5 rounded-full ring-1 ring-border/70"
                style={{
                  backgroundColor:
                    meta.color ??
                    (COLOR_PALETTE[
                      Math.abs(hashCode(node.id)) % (COLOR_PALETTE.length - 1)
                    ] as string),
                }}
              />
            </button>
            {colorOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-1 flex gap-1 rounded-md border border-border/60 bg-popover p-1.5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {COLOR_PALETTE.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSetColor(c ?? null);
                      setColorOpen(false);
                    }}
                    className="h-4 w-4 rounded-full ring-1 ring-border/60 hover:scale-110"
                    style={{ backgroundColor: c ?? "transparent" }}
                    title={c ?? "Limpar"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
      actions={
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={meta.locked ? "Destravar" : "Travar"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLocked();
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {meta.locked ? (
              <Lock className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
          <ItemActionsMenu
            compact
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRename={onRenameStart}
          />
        </div>
      }
    />
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ---------------------------------------------------------------------------
// Linha genérica da árvore
// ---------------------------------------------------------------------------

function TreeRow({
  depth,
  icon,
  label,
  hint,
  collapsed,
  onToggle,
  selected,
  onSelect,
  isRenaming,
  onRenameStart,
  onRenameEnd,
  actions,
  alwaysVisibleActions,
  muted,
  dimmed,
}: {
  depth: number;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  isRenaming?: boolean;
  onRenameStart?: () => void;
  onRenameEnd?: (name: string | null) => void;
  actions?: React.ReactNode;
  alwaysVisibleActions?: React.ReactNode;
  muted?: boolean;
  dimmed?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(label);

  useEffect(() => {
    if (isRenaming) {
      setDraft(label);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isRenaming, label]);

  const commit = () => onRenameEnd?.(draft.trim() || null);
  const cancel = () => onRenameEnd?.(null);

  return (
    <div
      role="treeitem"
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 text-xs transition-colors",
        selected ? "bg-primary/15 text-foreground" : "hover:bg-muted/60",
        muted && "text-muted-foreground",
        dimmed && "opacity-50",
      )}
      style={{ paddingLeft: depth * 12 + 4 }}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRenameStart?.();
      }}
    >
      {onToggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expandir" : "Recolher"}
        >
          <ChevronRight className={cn("h-3 w-3 transition-transform", !collapsed && "rotate-90")} />
        </button>
      ) : (
        <span className="w-4" />
      )}
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {isRenaming ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="flex-1 rounded border border-input bg-background px-1.5 py-0.5 text-xs"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate py-1">{label}</span>
      )}
      {hint && !isRenaming && (
        <span className="hidden text-[10px] text-muted-foreground/70 group-hover:inline">
          {hint}
        </span>
      )}
      {alwaysVisibleActions && <div className="flex items-center">{alwaysVisibleActions}</div>}
      {actions && (
        <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

function ItemActionsMenu({
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRename,
  compact,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRename?: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
          compact && "p-0.5",
        )}
        title="Mais ações"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-md border border-border/60 bg-popover p-1 text-xs shadow-lg">
            {onRename && (
              <MenuItem
                onClick={() => {
                  onRename();
                  setOpen(false);
                }}
                label="Renomear"
                icon={<Wrench className="h-3 w-3" />}
              />
            )}
            <MenuItem
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
              label="Duplicar"
              icon={<Copy className="h-3 w-3" />}
            />
            {onMoveUp && (
              <MenuItem
                onClick={() => {
                  onMoveUp();
                  setOpen(false);
                }}
                label="Mover ↑"
                icon={<ArrowUp className="h-3 w-3" />}
              />
            )}
            {onMoveDown && (
              <MenuItem
                onClick={() => {
                  onMoveDown();
                  setOpen(false);
                }}
                label="Mover ↓"
                icon={<ArrowDown className="h-3 w-3" />}
              />
            )}
            <div className="my-1 h-px bg-border/60" />
            <MenuItem
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              label="Excluir"
              icon={<Trash2 className="h-3 w-3" />}
              danger
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-muted",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

// Sentinel para tree-shaking friendly re-export via barrel
export const __ProjectTreeMarker = true as const;
// unused-guard: também exportado para uso futuro nos viewports 2D/3D
// que consultem os metadados abaixo diretamente.
export const NODE_META_KEYS = {
  hidden: "__hidden",
  locked: "__locked",
  color: "__color",
} as const;

function _keepImports() {
  return <Lightbulb className="hidden" />;
}
