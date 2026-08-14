import { useMemo } from "react";
import { Play, RotateCcw, Sparkles, Square, Wand2 } from "lucide-react";
import { Button, EmptyState, FormSection, StatusBadge } from "@/core/components/ui-kit";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { useVisionSession } from "../hooks/use-vision-session";
import { VISION_PROVIDERS } from "../providers";
import { VisionCorrections } from "./VisionCorrections";
import { VisionPreview } from "./VisionPreview";
import { VisionStages } from "./VisionStages";
import { VisionUploader } from "./VisionUploader";

export function VisionStudio() {
  const editor = usePlannerEditor();
  const vs = useVisionSession();
  const project = editor.state.project;

  const referenceUrl = vs.mergedModel
    ? vs.session.uploads.find((u) => u.id === vs.mergedModel!.sourceUploadIds[0])?.previewUrl
    : vs.session.uploads[0]?.previewUrl;

  const environments = useMemo(() => project?.environments ?? [], [project]);

  const currentProvider = VISION_PROVIDERS.find((p) => p.id === vs.session.providerId);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <aside className="space-y-4">
        <FormSection
          title="Modelo de visão"
          description="Nesta fase todos os providers rodam em modo local (sem API externa)."
        >
          <select
            value={vs.session.providerId}
            onChange={(e) => vs.setProviderId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={vs.isBusy}
          >
            {VISION_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.available ? "" : "(indisponível)"}
              </option>
            ))}
          </select>
          {currentProvider && (
            <p className="mt-2 text-xs text-muted-foreground">{currentProvider.description}</p>
          )}
        </FormSection>

        <FormSection
          title="Fotos do ambiente"
          description="Envie uma ou mais imagens para análise."
        >
          <VisionUploader
            uploads={vs.session.uploads}
            onAdd={vs.addFiles}
            onRemove={vs.removeUpload}
            onClear={vs.clearUploads}
            disabled={vs.isBusy}
          />
        </FormSection>

        <FormSection
          title="Execução"
          description="Rode a análise simulada — pronto para IA real no futuro."
        >
          <div className="flex flex-wrap items-center gap-2">
            {vs.session.status === "processing" ? (
              <Button variant="outline" size="sm" onClick={vs.cancel}>
                <Square className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            ) : (
              <Button size="sm" onClick={vs.analyze} disabled={!vs.canAnalyze}>
                <Play className="mr-2 h-4 w-4" /> Analisar ambiente
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={vs.reset} disabled={vs.isBusy}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
          </div>
          {vs.session.error && <p className="mt-2 text-xs text-destructive">{vs.session.error}</p>}
        </FormSection>

        <FormSection title="Progresso" description="Etapas emitidas em tempo real.">
          <VisionStages stages={vs.session.stages} />
        </FormSection>
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Reconstrução</div>
            <div className="text-sm text-muted-foreground">
              Foto original × estrutura detectada × prévia do ambiente.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              tone={
                vs.session.status === "review" || vs.session.status === "applied"
                  ? "success"
                  : vs.session.status === "processing"
                    ? "warning"
                    : vs.session.status === "error"
                      ? "danger"
                      : "neutral"
              }
            >
              {vs.session.status}
            </StatusBadge>
            {vs.mergedModel && (
              <Button
                size="sm"
                onClick={() =>
                  vs.applyToProject({
                    environmentId: environments[0]?.id ?? null,
                    environmentName: "Reconstruído por IA de Visão",
                  })
                }
                disabled={!vs.canApply || !project}
              >
                <Wand2 className="mr-2 h-4 w-4" /> Aplicar no projeto
              </Button>
            )}
          </div>
        </div>

        {vs.mergedModel ? (
          <>
            <VisionPreview model={vs.mergedModel} photoUrl={referenceUrl} />
            <VisionCorrections model={vs.mergedModel} onPatch={vs.updateCorrections} />
          </>
        ) : (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Envie fotos e execute a análise"
            description="A IA de Visão irá detectar paredes, piso, teto, portas e janelas — e preparar a reconstrução paramétrica pronta para o Planner."
          />
        )}
      </section>
    </div>
  );
}
