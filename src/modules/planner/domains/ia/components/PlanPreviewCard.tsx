/**
 * Etapa 11 — cartão do plano dentro do chat.
 *
 * Um único componente cobre preview, confirmação, progresso e resumo
 * final: o usuário vê sempre o mesmo bloco evoluindo, sem tela nova.
 */
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import type { PlanProgress, PlanStep, ProjectPlan } from "../planning";

export interface PlanPreviewCardProps {
  readonly plan: ProjectPlan;
  readonly progress: PlanProgress | null;
  readonly onExecute: () => void;
  readonly onConfirm: () => void;
  readonly onAnswer: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onCancel: () => void;
  readonly onRetry: () => void;
  readonly onRollback: () => void;
  readonly onRemoveStep: (stepId: string) => void;
  readonly onDismiss: () => void;
}

const IMPACT_LABEL: Record<ProjectPlan["estimatedImpact"], string> = {
  baixo: "impacto baixo",
  medio: "impacto médio",
  alto: "impacto alto",
  destrutivo: "operação destrutiva",
};

function StepIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (status === "completed") return <Check className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "failed") return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "skipped" || status === "cancelled" || status === "rolled_back")
    return <X className="h-3.5 w-3.5 text-muted-foreground" />;
  return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function PlanPreviewCard(props: PlanPreviewCardProps) {
  const { plan, progress } = props;
  const executing = plan.status === "executing";
  const paused = plan.status === "paused";
  const terminal =
    plan.status === "completed" ||
    plan.status === "partially_completed" ||
    plan.status === "cancelled" ||
    plan.status === "failed";
  const awaitingConfirm = plan.status === "awaiting_confirmation";
  const awaitingInfo = plan.status === "awaiting_information";
  const ready = plan.status === "ready" || plan.status === "draft";
  // Regra dura: fora de execução/estado terminal SEMPRE existe um botão
  // habilitado que inicia o plano — nunca um estado sem saída.
  const canStart = !executing && !terminal && !paused;

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{plan.title}</p>
          <p className="text-xs text-muted-foreground">
            {plan.steps.length} etapa(s) · {IMPACT_LABEL[plan.estimatedImpact]}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onDismiss}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar plano"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {progress && (executing || paused || terminal) && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {progress.current}/{progress.total} — {progress.title ?? "concluído"}
            {progress.agent ? ` · ${progress.agent}` : ""}
          </p>
        </div>
      )}

      {plan.missingInformation.length > 0 && awaitingInfo && (
        <ul className="mt-3 space-y-1 text-xs text-amber-500">
          {plan.missingInformation.map((m) => (
            <li key={m.key}>• {m.question}</li>
          ))}
        </ul>
      )}

      {plan.assumptions.length > 0 && !terminal && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {plan.assumptions.map((a) => (
            <li key={a.key}>• {a.label}</li>
          ))}
        </ul>
      )}

      <ol className="mt-3 space-y-1.5">
        {plan.steps.map((step) => (
          <li key={step.stepId} className="flex items-start gap-2">
            <span className="mt-0.5">
              <StepIcon status={step.status} />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 text-xs",
                step.status === "completed" && "text-muted-foreground line-through",
                (step.status === "skipped" || step.status === "cancelled") &&
                  "text-muted-foreground/70 line-through",
              )}
            >
              {step.position + 1}. {step.title}
              {step.destructive && <span className="ml-1 text-destructive">(destrutiva)</span>}
              {step.result && step.status === "failed" && (
                <span className="block text-destructive">{step.result.summary}</span>
              )}
            </span>
            {step.optional && step.status === "pending" && !executing && (
              <button
                type="button"
                onClick={() => props.onRemoveStep(step.stepId)}
                className="text-[10px] text-muted-foreground hover:text-destructive"
              >
                remover
              </button>
            )}
          </li>
        ))}
      </ol>

      {plan.finalReport && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
          {plan.finalReport.text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {canStart && ready && (
          <Button size="sm" onClick={props.onExecute}>
            <Play className="mr-1 h-3.5 w-3.5" /> Executar plano
          </Button>
        )}
        {canStart && awaitingConfirm && (
          <Button size="sm" onClick={props.onConfirm}>
            <Play className="mr-1 h-3.5 w-3.5" /> Confirmar e executar
          </Button>
        )}
        {canStart && awaitingInfo && (
          <Button size="sm" onClick={props.onAnswer}>
            <Play className="mr-1 h-3.5 w-3.5" /> Executar plano
          </Button>
        )}
        {canStart && !ready && !awaitingConfirm && !awaitingInfo && (
          <Button size="sm" onClick={props.onExecute}>
            <Play className="mr-1 h-3.5 w-3.5" /> Executar plano
          </Button>
        )}
        {executing && (
          <Button size="sm" variant="secondary" onClick={props.onPause}>
            <Pause className="mr-1 h-3.5 w-3.5" /> Pausar
          </Button>
        )}
        {paused && (
          <Button size="sm" onClick={props.onResume}>
            <Play className="mr-1 h-3.5 w-3.5" /> Retomar
          </Button>
        )}
        {(plan.status === "failed" || plan.status === "partially_completed") && (
          <Button size="sm" variant="secondary" onClick={props.onRetry}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Repetir falhas
          </Button>
        )}
        {!terminal && (
          <Button size="sm" variant="ghost" onClick={props.onCancel}>
            <X className="mr-1 h-3.5 w-3.5" /> Cancelar
          </Button>
        )}
        {plan.checkpointId && (
          <Button size="sm" variant="ghost" onClick={props.onRollback}>
            <Undo2 className="mr-1 h-3.5 w-3.5" /> Desfazer plano
          </Button>
        )}
      </div>
    </div>
  );
}