import { Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { Button, EmptyState, StatusBadge } from "@/core/components/ui-kit";
import type { VideoJob, VideoJobStatus } from "../types";

const STATUS_TONE: Record<VideoJobStatus, "info" | "warning" | "success" | "danger" | "neutral"> = {
  queued: "neutral",
  planning: "info",
  "rendering-frames": "info",
  compositing: "info",
  encoding: "info",
  branding: "info",
  publishing: "info",
  done: "success",
  cancelled: "warning",
  failed: "danger",
};

export interface VideoQueueProps {
  readonly queue: readonly VideoJob[];
  readonly history: readonly VideoJob[];
  onCancel(id: string): void;
  onRetry(id: string): void;
  onClearHistory(): void;
}

export function VideoQueue({ queue, history, onCancel, onRetry, onClearHistory }: VideoQueueProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fila</h4>
          <StatusBadge tone="neutral">{queue.length}</StatusBadge>
        </div>
        {queue.length === 0 ? (
          <EmptyState title="Fila vazia" description="Envie um vídeo para começar." />
        ) : (
          <ul className="space-y-2">
            {queue.map((j) => (
              <JobRow key={j.id} job={j} onCancel={onCancel} />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/40 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Histórico</h4>
          <div className="flex items-center gap-2">
            <StatusBadge tone="neutral">{history.length}</StatusBadge>
            {history.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={onClearHistory}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar
              </Button>
            ) : null}
          </div>
        </div>
        {history.length === 0 ? (
          <EmptyState title="Sem histórico" description="Vídeos concluídos aparecem aqui." />
        ) : (
          <ul className="space-y-2">
            {history.map((j) => (
              <HistoryRow key={j.id} job={j} onRetry={onRetry} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function JobRow({ job, onCancel }: { job: VideoJob; onCancel: (id: string) => void }) {
  return (
    <li className="rounded-xl border border-border/50 bg-muted/10 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {job.status !== "queued" && job.status !== "done" && job.status !== "cancelled" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : null}
            <span className="truncate text-[12px] font-semibold">{job.title}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {job.stage} · {Math.round(job.progress * 100)}%
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={STATUS_TONE[job.status]}>{job.status}</StatusBadge>
          <Button variant="ghost" size="sm" onClick={() => onCancel(job.id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background/50 ring-1 ring-inset ring-border/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${Math.round(job.progress * 100)}%` }}
        />
      </div>
    </li>
  );
}

function HistoryRow({ job, onRetry }: { job: VideoJob; onRetry: (id: string) => void }) {
  return (
    <li className="rounded-xl border border-border/50 bg-muted/10 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold">{job.title}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {job.result
              ? `${job.result.widthPx}×${job.result.heightPx} · ${job.result.frameCount} frames · ${(job.result.durationMs / 1000).toFixed(1)}s`
              : job.stage}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={STATUS_TONE[job.status]}>{job.status}</StatusBadge>
          <Button variant="ghost" size="sm" onClick={() => onRetry(job.id)}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}
