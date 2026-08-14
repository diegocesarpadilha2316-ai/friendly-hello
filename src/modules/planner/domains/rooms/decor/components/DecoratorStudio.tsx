import { useMemo } from "react";
import { Play, RotateCcw, Sparkles, Square, Undo2, Wand2 } from "lucide-react";
import { Button, EmptyState, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { DECORATOR_PROVIDERS } from "../providers";
import { StyleGallery } from "./StyleGallery";
import { SuggestionList } from "./SuggestionList";
import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { useDecoratorSession } from "../hooks/use-decorator-session";

export function DecoratorStudio() {
  const editor = usePlannerEditor();
  const ds = useDecoratorSession();

  const currentRoom = useMemo(() => {
    const project = editor.state.project;
    const env = project?.environments.find((e) => e.id === editor.state.selectedEnvironmentId);
    return env?.rooms.find((r) => r.id === editor.state.selectedRoomId) ?? null;
  }, [editor.state.project, editor.state.selectedEnvironmentId, editor.state.selectedRoomId]);

  const currentProvider = DECORATOR_PROVIDERS.find((p) => p.id === ds.session.providerId);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <aside className="space-y-4">
        <FormSection
          title="Modelo decorador"
          description="Nesta fase, todos os providers usam o motor heurístico local."
        >
          <select
            value={ds.session.providerId}
            onChange={(e) => ds.setProviderId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={ds.isBusy}
          >
            {DECORATOR_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.available ? "" : "(indisponível)"}
              </option>
            ))}
          </select>
          {currentProvider && (
            <p className="mt-2 text-xs text-muted-foreground">{currentProvider.description}</p>
          )}
        </FormSection>

        <FormSection title="Estilo" description="Escolha a linguagem visual desejada.">
          <StyleGallery value={ds.session.styleId} onChange={ds.setStyle} disabled={ds.isBusy} />
        </FormSection>

        <FormSection title="Execução" description="Analise o cômodo ativo e gere sugestões.">
          {!currentRoom ? (
            <p className="text-xs text-muted-foreground">
              Selecione um cômodo em Projetos para começar.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {ds.isBusy ? (
                <Button variant="outline" size="sm" onClick={ds.cancel}>
                  <Square className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              ) : (
                <Button size="sm" onClick={ds.analyze} disabled={!ds.canAnalyze}>
                  <Play className="mr-2 h-4 w-4" /> Sugerir decoração
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={ds.reset} disabled={ds.isBusy}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
              </Button>
            </div>
          )}
          {ds.session.error && <p className="mt-2 text-xs text-destructive">{ds.session.error}</p>}
        </FormSection>

        {ds.session.plan && (
          <FormSection title="Contexto detectado" description="Insumos considerados pela IA.">
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                Tipo:{" "}
                <strong className="text-foreground">{ds.session.plan.context.roomType}</strong>
              </li>
              <li>
                Área:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.areaM2.toFixed(1)} m²
                </strong>
              </li>
              <li>
                Circulação livre:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.circulationMm} mm
                </strong>
              </li>
              <li>
                Móveis existentes:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.existingFurnitureCount}
                </strong>
              </li>
              <li>
                Luminárias existentes:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.existingLightingCount}
                </strong>
              </li>
              <li>
                Portas:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.hasDoors ? "sim" : "não"}
                </strong>
              </li>
              <li>
                Janelas:{" "}
                <strong className="text-foreground">
                  {ds.session.plan.context.hasWindows ? "sim" : "não"}
                </strong>
              </li>
            </ul>
          </FormSection>
        )}
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Sugestões da IA Decoradora</div>
            <div className="text-sm text-muted-foreground">
              Aceite ou rejeite cada item — só o aceito é aplicado ao projeto.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={
                ds.session.status === "review"
                  ? "info"
                  : ds.session.status === "applied"
                    ? "success"
                    : ds.session.status === "analyzing"
                      ? "warning"
                      : ds.session.status === "error"
                        ? "danger"
                        : "neutral"
              }
            >
              {ds.session.status}
            </StatusBadge>
            <Button
              variant="outline"
              size="sm"
              onClick={ds.acceptAll}
              disabled={!ds.session.plan || ds.isBusy}
            >
              Aceitar todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={ds.rejectAll}
              disabled={!ds.session.plan || ds.isBusy}
            >
              Rejeitar todas
            </Button>
            {ds.session.appliedNodeIds.length > 0 && (
              <Button variant="outline" size="sm" onClick={ds.undoApplied}>
                <Undo2 className="mr-2 h-4 w-4" /> Desfazer aplicação
              </Button>
            )}
            <Button size="sm" onClick={ds.applyAccepted} disabled={!ds.canApply}>
              <Wand2 className="mr-2 h-4 w-4" /> Aplicar no cômodo
            </Button>
          </div>
        </div>

        {!ds.session.plan ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Selecione um estilo e gere sugestões"
            description="A IA Decoradora analisa o cômodo ativo (tamanho, circulação, móveis, aberturas) e propõe mobiliário, iluminação, materiais e paleta."
          />
        ) : (
          <>
            <BeforeAfterCompare
              room={currentRoom}
              beforeNodeIds={ds.session.beforeNodeIds}
              suggestions={ds.session.plan.suggestions}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Pendentes ({ds.pending.length})
                </div>
                <SuggestionList suggestions={ds.pending} onStatus={ds.setSuggestionStatus} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Decisões ({ds.accepted.length + ds.rejected.length})
                </div>
                <SuggestionList
                  suggestions={[...ds.accepted, ...ds.rejected]}
                  onStatus={ds.setSuggestionStatus}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
