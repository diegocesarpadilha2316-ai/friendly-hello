/**
 * Fase 3.16 — Painel do Configurador Paramétrico Enterprise.
 *
 * 100% derivado de useConfigurator (que só consome PlannerEditorProvider).
 * Zero providers, zero stores, zero migrations. Design Dioris dark-first.
 */
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useConfigurator } from "../hooks";
import { CONFIGURATOR_SUGGESTIONS } from "../services";
import type {
  AiProviderStub,
  ConfiguratorField,
  ConfiguratorGroup,
  HistoryEntry,
} from "../types";

const TABS = [
  { id: "propriedades", label: "Propriedades" },
  { id: "configurador", label: "Configurador" },
  { id: "comandos", label: "Comandos IA" },
  { id: "componentes", label: "Abrir/Fechar" },
  { id: "walk", label: "Walk / FPS" },
  { id: "camadas", label: "Camadas" },
  { id: "alinhar", label: "Alinhar" },
  { id: "duplicar", label: "Duplicar" },
  { id: "snap", label: "Snap" },
  { id: "historico", label: "Histórico" },
  { id: "ia", label: "Provedores IA" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const GROUP_LABEL: Record<ConfiguratorGroup, string> = {
  medidas: "Medidas",
  estrutura: "Estrutura",
  portas: "Portas",
  gavetas: "Gavetas",
  nichos: "Nichos",
  ferragens: "Ferragens",
  iluminacao: "Iluminação",
  material: "Material",
  acabamento: "Acabamento",
};

export function ConfiguratorPanel() {
  const cfg = useConfigurator();
  const [tab, setTab] = useState<TabId>("propriedades");
  const [prompt, setPrompt] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const modules = cfg.snapshot.modules;

  if (!cfg.snapshot.project) {
    return (
      <EmptyState
        title="Abra um projeto no Planner"
        description="O Configurador Paramétrico opera sobre o projeto ativo. Selecione ou crie um projeto para começar."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
        <div className="text-xs uppercase tracking-widest text-primary">Fase 3.16 · Configurador Paramétrico</div>
        <div className="text-lg font-semibold">IA de Projeto + Edição Total em Tempo Real</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Seleção · Configurador · Chat IA · Walk/FPS · Camadas · Snap · Alinhar · Duplicar · Histórico · Multi-provider.
          Toda alteração passa por updateProject() — undo/redo/autosave/versionamento nativos.
        </div>
      </div>

      {/* Módulos + seleção */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="text-xs text-muted-foreground">
          {modules.length} módulos · {cfg.selection.length} selecionado(s)
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={cfg.undo} disabled={!cfg.canUndo}>↶ Undo</Button>
          <Button variant="outline" size="sm" onClick={cfg.redo} disabled={!cfg.canRedo}>↷ Redo</Button>
          <Button variant="outline" size="sm" onClick={cfg.clearSelection} disabled={cfg.selection.length === 0}>Limpar</Button>
        </div>
      </div>

      {modules.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {modules.map((m) => {
            const isSel = cfg.selection.includes(m.id);
            const hidden = !!cfg.hiddenIds[m.id];
            const locked = !!cfg.lockedIds[m.id];
            return (
              <button
                key={m.id}
                onClick={(e) => (e.shiftKey ? cfg.toggleSelection(m.id) : cfg.selectOne(m.id))}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs transition-colors",
                  isSel ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent/40",
                  hidden && "opacity-40",
                  locked && "italic",
                )}
                title={`${m.label}${hidden ? " · oculto" : ""}${locked ? " · bloqueado" : ""}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "propriedades" && <PropertiesSub cfg={cfg} />}
      {tab === "configurador" && <ConfiguratorSub cfg={cfg} />}
      {tab === "comandos" && (
        <CommandsSub
          prompt={prompt}
          setPrompt={setPrompt}
          lastCommand={lastCommand}
          onRun={() => {
            const c = cfg.runCommand(prompt);
            setLastCommand(c ? c.summary : "Comando não reconhecido");
          }}
        />
      )}
      {tab === "componentes" && <OpenCloseSub cfg={cfg} />}
      {tab === "walk" && <WalkSub cfg={cfg} />}
      {tab === "camadas" && <LayersSub cfg={cfg} />}
      {tab === "alinhar" && <AlignSub cfg={cfg} />}
      {tab === "duplicar" && <DuplicateSub cfg={cfg} />}
      {tab === "snap" && <SnapSub cfg={cfg} />}
      {tab === "historico" && <HistorySub history={cfg.snapshot.history} />}
      {tab === "ia" && <AiProvidersSub providers={cfg.snapshot.providers} />}
    </div>
  );
}

type Cfg = ReturnType<typeof useConfigurator>;

// ─── Propriedades ───────────────────────────────────────────────

function PropertiesSub({ cfg }: { cfg: Cfg }) {
  const nodes = cfg.snapshot.selection;
  if (nodes.length === 0) return <EmptyState title="Sem seleção" description="Clique em um módulo para ver propriedades." />;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((n) => (
        <div key={n.id} className="rounded-lg border border-border bg-card p-3">
          <div className="text-sm font-semibold">{n.label}</div>
          <div className="text-[11px] text-muted-foreground">{n.kind}</div>
          <div className="mt-2 space-y-1 text-xs">
            {Object.entries(n.params).slice(0, 12).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/50 py-0.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="tabular-nums">{String(v ?? "—")}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Configurador Paramétrico ───────────────────────────────────

function ConfiguratorSub({ cfg }: { cfg: Cfg }) {
  const schema = cfg.snapshot.schema;
  if (!schema) return <EmptyState title="Selecione um único módulo" description="O configurador exibe os parâmetros de um módulo por vez." />;

  const groups = useMemo(() => {
    const acc = new Map<ConfiguratorGroup, ConfiguratorField[]>();
    for (const f of schema.fields) {
      const list = acc.get(f.group) ?? [];
      list.push(f);
      acc.set(f.group, list);
    }
    return Array.from(acc.entries());
  }, [schema]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Módulo: {schema.label}</div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(([g, fields]) => (
          <div key={g} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{GROUP_LABEL[g]}</div>
            <div className="space-y-2">
              {fields.map((f) => (
                <FieldRow key={f.key} field={f} onChange={(v) => cfg.setField(f.key, v)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ field, onChange }: { field: ConfiguratorField; onChange: (v: string | number | boolean) => void }) {
  if (field.kind === "number") {
    return (
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{field.label}{field.unit ? ` (${field.unit})` : ""}</span>
        <input
          type="number"
          value={field.value}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right tabular-nums"
        />
      </label>
    );
  }
  if (field.kind === "boolean") {
    return (
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{field.label}</span>
        <input type="checkbox" checked={field.value} onChange={(e) => onChange(e.target.checked)} />
      </label>
    );
  }
  if (field.kind === "select") {
    return (
      <label className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{field.label}</span>
        <select
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-40 rounded-md border border-border bg-background px-2 py-1"
        >
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{field.label}</span>
      <input
        type="text"
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 rounded-md border border-border bg-background px-2 py-1"
      />
    </label>
  );
}

// ─── Comandos IA ────────────────────────────────────────────────

function CommandsSub({
  prompt, setPrompt, onRun, lastCommand,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  onRun: () => void;
  lastCommand: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {CONFIGURATOR_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex.: aumente para 2,80 · troque para Carvalho · 4 gavetas · abra as portas"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button onClick={onRun}>Executar</Button>
      </div>
      {lastCommand && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">✓ {lastCommand}</div>
      )}
      <div className="text-[11px] text-muted-foreground">
        Sem seleção → o comando é aplicado a todos os módulos. Com seleção → apenas aos selecionados.
      </div>
    </div>
  );
}

// ─── Abrir/Fechar ───────────────────────────────────────────────

function OpenCloseSub({ cfg }: { cfg: Cfg }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={cfg.openAllDoors}>Abrir todas as portas</Button>
        <Button variant="outline" onClick={cfg.closeAllDoors}>Fechar portas</Button>
        <Button onClick={cfg.openAllDrawers}>Abrir todas as gavetas</Button>
        <Button variant="outline" onClick={cfg.closeAllDrawers}>Fechar gavetas</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <PercentControl label="Portas" onSet={(pct) => cfg.openPercent(pct, "doors")} />
        <PercentControl label="Gavetas" onSet={(pct) => cfg.openPercent(pct, "drawers")} />
      </div>
    </div>
  );
}

function PercentControl({ label, onSet }: { label: string; onSet: (pct: number) => void }) {
  const [pct, setPct] = useState(50);
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 text-xs font-semibold">{label} — abertura</div>
      <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" />
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">{pct}%</span>
        <div className="flex gap-1">
          <button className="rounded border border-border px-2 py-0.5" onClick={() => onSet(30)}>30%</button>
          <button className="rounded border border-border px-2 py-0.5" onClick={() => onSet(50)}>50%</button>
          <button className="rounded border border-border px-2 py-0.5" onClick={() => onSet(100)}>100%</button>
          <Button size="sm" onClick={() => onSet(pct)}>Aplicar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Walk / FPS ─────────────────────────────────────────────────

function WalkSub({ cfg }: { cfg: Cfg }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {cfg.snapshot.walk.map((m) => (
        <button
          key={m.id}
          onClick={() => cfg.setWalkMode(m.id)}
          className={cn(
            "rounded-lg border p-3 text-left transition-colors",
            cfg.walkMode === m.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent/40",
          )}
        >
          <div className="text-sm font-semibold">{m.label}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{m.description}</div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <StatusBadge tone={m.collision ? "success" : "neutral"}>{m.collision ? "colisão" : "sem colisão"}</StatusBadge>
            <StatusBadge tone={m.gravity ? "success" : "neutral"}>{m.gravity ? "gravidade" : "livre"}</StatusBadge>
            <StatusBadge tone="info">FOV {m.fov}°</StatusBadge>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Camadas ────────────────────────────────────────────────────

function LayersSub({ cfg }: { cfg: Cfg }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {cfg.snapshot.layers.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="h-6 w-6 rounded" style={{ background: l.color }} />
          <div className="flex-1">
            <div className="text-sm font-semibold">{l.label}</div>
            <div className="text-[11px] text-muted-foreground">{l.description} · {l.count} itens</div>
          </div>
          <button
            className={cn("rounded-md border px-2 py-1 text-[10px]", l.visible ? "border-primary text-primary" : "border-border text-muted-foreground")}
            onClick={() => cfg.toggleLayerVisible(l.id)}
          >
            {l.visible ? "visível" : "oculta"}
          </button>
          <button
            className={cn("rounded-md border px-2 py-1 text-[10px]", l.locked ? "border-amber-500 text-amber-500" : "border-border text-muted-foreground")}
            onClick={() => cfg.toggleLayerLocked(l.id)}
          >
            {l.locked ? "bloqueada" : "livre"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Alinhamento ────────────────────────────────────────────────

function AlignSub({ cfg }: { cfg: Cfg }) {
  const disabled = cfg.selection.length < 2;
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        {disabled ? "Selecione 2+ módulos para habilitar alinhamento." : `${cfg.selection.length} módulos selecionados.`}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {cfg.snapshot.align.map((a) => (
          <button
            key={a.id}
            disabled={disabled}
            className="rounded-lg border border-border bg-card p-3 text-left text-xs transition-colors hover:bg-accent/40 disabled:opacity-40"
          >
            <div className="font-semibold">{a.label}</div>
            <div className="text-[11px] text-muted-foreground">{a.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Duplicar/Espelhar/Rotacionar ───────────────────────────────

function DuplicateSub({ cfg }: { cfg: Cfg }) {
  const disabled = cfg.selection.length !== 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        {disabled ? "Selecione UM módulo para duplicar, espelhar ou rotacionar." : "1 módulo selecionado."}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled} onClick={cfg.duplicate}>Duplicar módulo</Button>
        <Button disabled={disabled} variant="outline" onClick={cfg.mirror}>Espelhar</Button>
        <Button disabled={disabled} variant="outline" onClick={() => cfg.rotate(90)}>Rotacionar 90°</Button>
        <Button disabled={disabled} variant="outline" onClick={() => cfg.rotate(-90)}>Rotacionar -90°</Button>
        <Button disabled={disabled} variant="outline" onClick={() => cfg.rotate(180)}>Rotacionar 180°</Button>
      </div>
    </div>
  );
}

// ─── Snap ───────────────────────────────────────────────────────

function SnapSub({ cfg }: { cfg: Cfg }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
      {cfg.snapshot.snapping.map((s) => (
        <div key={s.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{s.label}</div>
            <StatusBadge tone={s.enabled ? "success" : "neutral"}>{s.enabled ? "ligado" : "desligado"}</StatusBadge>
          </div>
          <div className="text-[11px] text-muted-foreground">Tolerância {s.toleranceMm} mm</div>
        </div>
      ))}
    </div>
  );
}

// ─── Histórico ──────────────────────────────────────────────────

function HistorySub({ history }: { history: readonly HistoryEntry[] }) {
  if (history.length === 0) return <EmptyState title="Sem histórico" description="Faça alterações no projeto para registrar o histórico." />;
  const cols: DataTableColumn<HistoryEntry>[] = [
    { id: "v", header: "Versão", cell: (r) => <span className="tabular-nums">v{r.version}</span> },
    { id: "when", header: "Quando", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.when).toLocaleString("pt-BR")}</span> },
    { id: "who", header: "Quem", cell: (r) => r.author },
    { id: "sum", header: "Resumo", cell: (r) => r.summary },
    { id: "chg", header: "Alterações", cell: (r) => (
      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        {r.changes.slice(0, 4).map((c, i) => (
          <div key={i}>· <span className="font-mono">{c.field}</span>: {c.before} → {c.after}</div>
        ))}
        {r.changes.length > 4 && <div>… +{r.changes.length - 4} alteração(ões)</div>}
      </div>
    ) },
  ];
  return <DataTable columns={cols} data={[...history]} getRowKey={(r) => r.id} />;
}

// ─── Provedores IA (stubs) ──────────────────────────────────────

function AiProvidersSub({ providers }: { providers: readonly AiProviderStub[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {providers.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{p.label}</div>
            <StatusBadge tone={p.status === "ready" ? "success" : "neutral"}>{p.status}</StatusBadge>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{p.capabilities.join(" · ")}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {p.models.map((m) => (
              <span key={m} className="rounded border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{m}</span>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-[11px] text-muted-foreground md:col-span-2 lg:col-span-3">
        Hooks preparados — nenhum provedor está conectado. A ativação real de OpenAI / Gemini / Claude / Mistral / OSS acontecerá em fases futuras via Core AI Gateway.
      </div>
    </div>
  );
}