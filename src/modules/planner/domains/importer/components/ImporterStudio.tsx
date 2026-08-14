/**
 * Fase 3.27 — Studio de Importação CAD/BIM (Dark First, Desktop First).
 * Consome exclusivamente serviços/hook do próprio domínio + PlannerEditorProvider.
 */
import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Eye,
  Layers as LayersIcon,
  Ruler,
  Palette,
  Wand2,
  ShieldCheck,
  PlayCircle,
  Clock,
  Download,
  FileWarning,
  Lock,
  Unlock,
} from "lucide-react";
import { Button, StatusBadge, EmptyState } from "@/core/components/ui-kit";
import { useImporter } from "../hooks/use-importer";
import { describeImport, exportImport, listUnits } from "../services";
import type { ImporterExportFormat, ImporterUnit } from "../types";

type TabId =
  | "arquivos"
  | "preview"
  | "camadas"
  | "escala"
  | "materiais"
  | "conversao"
  | "correcoes"
  | "importar"
  | "historico";

const TABS: readonly { id: TabId; label: string; icon: typeof Upload }[] = [
  { id: "arquivos", label: "Arquivos", icon: Upload },
  { id: "preview", label: "Pré-visualização", icon: Eye },
  { id: "camadas", label: "Camadas", icon: LayersIcon },
  { id: "escala", label: "Escala", icon: Ruler },
  { id: "materiais", label: "Materiais", icon: Palette },
  { id: "conversao", label: "Conversão", icon: Wand2 },
  { id: "correcoes", label: "Correções", icon: ShieldCheck },
  { id: "importar", label: "Importação", icon: PlayCircle },
  { id: "historico", label: "Histórico", icon: Clock },
];

export function ImporterStudio() {
  const [tab, setTab] = useState<TabId>("arquivos");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    result,
    loading,
    layers,
    history,
    importFromFile,
    setUnit,
    setLayerVisible,
    setLayerLocked,
    attachToProject,
    clear,
    clearHistory,
  } = useImporter();

  const summary = useMemo(() => (result ? describeImport(result) : ""), [result]);

  function onPick() {
    inputRef.current?.click();
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await importFromFile(f);
    if (inputRef.current) inputRef.current.value = "";
  }

  function download(format: ImporterExportFormat) {
    if (!result || typeof window === "undefined") return;
    const blob = exportImport(result, format);
    const data = typeof blob.content === "string" ? blob.content : new Uint8Array(blob.content);
    const url = URL.createObjectURL(new Blob([data], { type: blob.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = blob.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Importação e Compatibilidade CAD/BIM</h2>
          <p className="text-xs text-muted-foreground">
            DWG · DXF · IFC · OBJ · FBX · GLB · glTF · STL · STEP · IGES · SKP · PDF · Imagens · SVG
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <StatusBadge tone="warning">Processando…</StatusBadge> : null}
          {result ? (
            <StatusBadge tone="success">{result.entities.length} entidades</StatusBadge>
          ) : null}
          {result?.warnings.length ? (
            <StatusBadge tone="warning">{result.warnings.length} avisos</StatusBadge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors " +
              (tab === t.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-background/60")
            }
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".dwg,.dxf,.ifc,.obj,.fbx,.glb,.gltf,.stl,.step,.stp,.iges,.igs,.skp,.pdf,.png,.jpg,.jpeg,.webp,.svg"
        onChange={onFile}
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border/40 bg-background/40 p-3">
        {tab === "arquivos" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onPick}>
                <Upload className="mr-1 h-4 w-4" /> Selecionar arquivo
              </Button>
              {result ? (
                <Button size="sm" variant="ghost" onClick={clear}>
                  Limpar
                </Button>
              ) : null}
            </div>
            {result ? (
              <div className="rounded-md border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
                <div className="text-sm font-medium text-foreground">{result.filename}</div>
                <div>{summary}</div>
              </div>
            ) : (
              <EmptyState
                title="Nenhum arquivo carregado"
                description="Aceita DWG, DXF, IFC, OBJ, FBX, GLB, glTF, STL, STEP, IGES, SKP, PDF, imagens e SVG."
                icon={<Upload className="h-6 w-6" />}
              />
            )}
          </div>
        ) : tab === "preview" ? (
          result?.previewSvg ? (
            <div className="grid place-items-center">
              <div
                className="w-full max-w-2xl rounded-md border border-border/60 bg-[#0b1220] p-2"
                dangerouslySetInnerHTML={{ __html: result.previewSvg }}
              />
            </div>
          ) : (
            <EmptyState
              title="Sem pré-visualização"
              description="Formatos vetoriais (DXF, OBJ, SVG) geram preview automaticamente."
              icon={<Eye className="h-6 w-6" />}
            />
          )
        ) : tab === "camadas" ? (
          layers.length ? (
            <div className="space-y-1">
              {layers.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-muted-foreground">· {l.count}</span>
                    {l.role ? <StatusBadge tone="info">{l.role}</StatusBadge> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setLayerVisible(l.id)}>
                      <Eye className={"h-3.5 w-3.5 " + (l.visible ? "" : "opacity-30")} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setLayerLocked(l.id)}>
                      {l.locked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem camadas"
              description="Importe um arquivo vetorial para visualizar as camadas."
              icon={<LayersIcon className="h-6 w-6" />}
            />
          )
        ) : tab === "escala" ? (
          result ? (
            <div className="space-y-3 text-xs">
              <div className="rounded-md border border-border/60 bg-background/50 p-3">
                Unidade detectada: <strong>{result.scale.detectedUnit}</strong> · fator{" "}
                {result.scale.factorToMm} mm
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Forçar unidade:</span>
                {listUnits().map((u) => (
                  <Button
                    key={u}
                    size="sm"
                    variant={result.scale.overrideUnit === u ? "secondary" : "ghost"}
                    onClick={() => setUnit(u as ImporterUnit)}
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Sem escala"
              description="Importe um arquivo para ajustar a escala."
              icon={<Ruler className="h-6 w-6" />}
            />
          )
        ) : tab === "materiais" ? (
          result?.materials.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {result.materials.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border border-border/60 bg-background/50 p-2 text-xs"
                >
                  <div className="mb-1 h-10 rounded" style={{ background: m.color ?? "#333" }} />
                  <div className="font-medium">{m.name}</div>
                  {m.color ? <div className="text-muted-foreground">{m.color}</div> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem materiais"
              description="Materiais são detectados via meta dos entities ou glTF."
              icon={<Palette className="h-6 w-6" />}
            />
          )
        ) : tab === "conversao" ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(["dxf", "dwg", "glb", "obj", "svg", "pdf"] as ImporterExportFormat[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant="secondary"
                disabled={!result}
                onClick={() => download(f)}
              >
                <Download className="mr-1 h-4 w-4" /> Exportar {f.toUpperCase()}
              </Button>
            ))}
          </div>
        ) : tab === "correcoes" ? (
          result?.warnings.length ? (
            <div className="space-y-1">
              {result.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-border/60 bg-background/50 p-2 text-xs"
                >
                  <FileWarning
                    className={
                      "mt-0.5 h-4 w-4 " +
                      (w.severity === "error"
                        ? "text-destructive"
                        : w.severity === "warning"
                          ? "text-amber-400"
                          : "text-sky-400")
                    }
                  />
                  <div>
                    <div className="font-medium">{w.code}</div>
                    <div className="text-muted-foreground">{w.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem correções pendentes"
              description="Todos os avisos foram resolvidos."
              icon={<ShieldCheck className="h-6 w-6" />}
            />
          )
        ) : tab === "importar" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Ao confirmar, o resumo determinístico do arquivo é anexado ao projeto via
              <code className="mx-1 rounded bg-muted/40 px-1">updateProject()</code>
              (Undo/Redo/Autosave/Histórico preservados). A geometria é materializada em passes
              subsequentes pelo Editor 2D/3D e IA Visão.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={attachToProject} disabled={!result}>
                <PlayCircle className="mr-1 h-4 w-4" /> Anexar ao projeto
              </Button>
            </div>
          </div>
        ) : history.length ? (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={clearHistory}>
                Limpar histórico
              </Button>
            </div>
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 px-2 py-1.5 text-xs"
              >
                <div>
                  <span className="font-medium">{h.filename}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {h.format.toUpperCase()} · {h.entities} entidades · {h.warnings} avisos
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sem histórico"
            description="Importações recentes aparecerão aqui."
            icon={<Clock className="h-6 w-6" />}
          />
        )}
      </div>
    </div>
  );
}
