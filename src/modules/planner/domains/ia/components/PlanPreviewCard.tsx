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
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onCancel: () => void;
  readonly onRetry: () => void;
  readonly onRollback: () => void;
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
  const failed = plan.status === "failed" || plan.status === "partially_completed";
  // O plano nunca depende de clique para iniciar: a execução é automática e
  // este cartão é apenas leitura (progresso + controles úteis).
  const waitingUser = awaitingConfirm || awaitingInfo;

  return (
    <div className="relative z-10 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border/60 bg-card/90 text-sm shadow-sm [touch-action:manipulation] [pointer-events:auto]">
      <div className="flex items-start justify-between gap-2 p-3 pb-0">
        <div className="min-w-0">
          <p className="break-words font-medium">{plan.title}</p>
          <p className="text-xs text-muted-foreground">
            {plan.steps.length} etapa(s) · {IMPACT_LABEL[plan.estimatedImpact]}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onDismiss}
          className="-mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded text-muted-foreground [touch-action:manipulation] hover:text-foreground"
          aria-label="Fechar plano"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[45vh] overflow-y-auto overscroll-contain px-3 pb-3">
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

      {awaitingConfirm && (
        <p className="mt-3 text-xs text-amber-500">
          Responda “sim” no chat para eu seguir com esta operação.
        </p>
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
          </li>
        ))}
      </ol>

      {plan.finalReport && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
          {plan.finalReport.text}
        </p>
      )}

      {failed && plan.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {plan.warnings.map((w, i) => (
            <li key={i} className="break-words">
              • {w}
            </li>
          ))}
        </ul>
      )}
      </div>

      {/* Card 100% somente leitura: nenhum botão de seleção/ação.
          Todo o controle acontece pela conversa no chat. */}
    </div>
  );
}