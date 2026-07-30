/**
 * Indicador discreto e permanente do estado de sincronização do projeto.
 * Etapa 6 — o status principal NUNCA depende de toast: enquanto houver
 * problema, este indicador permanece visível com ação de retry.
 */
import { Check, CloudOff, Loader2, RefreshCw, TriangleAlert, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlannerEditor, type PlannerSyncStatus } from "../state/editor-context";

const LABELS: Record<PlannerSyncStatus, string> = {
  idle: "Auto Save",
  modified: "Alterações não salvas",
  saving: "Salvando…",
  saved: "Salvo",
  unsynced: "Não sincronizado",
  error: "Erro ao salvar",
  offline: "Sem conexão",
};

const TONES: Record<PlannerSyncStatus, string> = {
  idle: "border-border/60 bg-background/60 text-muted-foreground",
  modified: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  saving: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  saved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  unsynced: "border-destructive/50 bg-destructive/10 text-destructive-foreground",
  error: "border-destructive/50 bg-destructive/10 text-destructive-foreground",
  offline: "border-slate-500/50 bg-slate-500/10 text-slate-200",
};

function StatusIcon({ status }: { status: PlannerSyncStatus }) {
  switch (status) {
    case "saving":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    case "saved":
      return <Check className="h-3 w-3" />;
    case "modified":
      return <Pencil className="h-3 w-3" />;
    case "offline":
      return <CloudOff className="h-3 w-3" />;
    case "unsynced":
    case "error":
      return <TriangleAlert className="h-3 w-3" />;
    default:
      return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
  }
}

export function SyncStatusIndicator({ className }: { className?: string }) {
  const { syncStatus, syncError, retrySync } = usePlannerEditor();
  const needsRetry =
    syncStatus === "unsynced" || syncStatus === "error" || syncStatus === "offline";

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span
        role="status"
        aria-live="polite"
        title={syncError ?? LABELS[syncStatus]}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
          TONES[syncStatus],
        )}
      >
        <StatusIcon status={syncStatus} />
        {LABELS[syncStatus]}
      </span>
      {needsRetry ? (
        <button
          type="button"
          onClick={retrySync}
          className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-primary/50 hover:text-primary"
        >
          <RefreshCw className="h-3 w-3" /> Tentar novamente
        </button>
      ) : null}
    </span>
  );
}
