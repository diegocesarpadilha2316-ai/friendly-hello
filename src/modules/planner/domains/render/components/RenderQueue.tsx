import type { ReactNode } from "react";
import { Ban, RefreshCcw } from "lucide-react";
import { Button, StatusBadge, type StatusTone } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import type { RenderJob, RenderJobStatus } from "../types";

function tone(status: RenderJobStatus): StatusTone {
  switch (status) {
    case "done":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
      return "warning";
    case "queued":
      return "neutral";
    default:
      return "info";
  }
}

function Section({
  title,
  empty,
  action,
  isEmpty,
  children,
}: {
  title: string;
  empty: string;
  action?: ReactNode;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {action}
      </div>
      <div className="divide-y divide-border/40">
        {isEmpty ? (
          <div className="px-4 py-6 text-xs text-muted-foreground">{empty}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function JobRow({
  job,
  onCancel,
  onRetry,
}: {
  job: RenderJob;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  const pct = Math.round(job.progress * 100);
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{job.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <StatusBadge tone={tone(job.status)}>{job.status}</StatusBadge>
            <span>{job.stage}</span>
            {job.result ? (
              <span>
                {job.result.widthPx}×{job.result.heightPx} ·{" "}
                {(job.result.durationMs / 1000).toFixed(1)}s
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onCancel ? (
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancelar">
              <Ban className="h-4 w-4" />
            </Button>
          ) : null}
          {onRetry ? (
            <Button variant="ghost" size="icon" onClick={onRetry} aria-label="Repetir">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            job.status === "done"
              ? "bg-emerald-500/70"
              : job.status === "failed"
                ? "bg-destructive/70"
                : job.status === "cancelled"
                  ? "bg-amber-500/60"
                  : "bg-gradient-to-r from-primary/70 via-primary to-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  queue: readonly RenderJob[];
  history: readonly RenderJob[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClearHistory: () => void;
}

export function RenderQueue({ queue, history, onCancel, onRetry, onClearHistory }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Fila" empty="Nenhum render em andamento." isEmpty={queue.length === 0}>
        {queue.map((j) => (
          <JobRow key={j.id} job={j} onCancel={() => onCancel(j.id)} />
        ))}
      </Section>
      <Section
        title="Histórico"
        empty="Sem renders concluídos ainda."
        isEmpty={history.length === 0}
        action={
          history.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClearHistory}>
              Limpar
            </Button>
          ) : null
        }
      >
        {history.map((j) => (
          <JobRow key={j.id} job={j} onRetry={() => onRetry(j.id)} />
        ))}
      </Section>
    </div>
  );
}
