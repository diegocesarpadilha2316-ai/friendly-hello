import { History } from "lucide-react";
import { StatusBadge } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";

export function VersionHistoryPanel() {
  const { versions, state } = usePlannerEditor();
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Histórico de versões</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {state.dirty ? "alterações não salvas" : state.lastSavedAt ? "sincronizado" : "sem alterações"}
        </span>
      </div>
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma versão salva ainda. Crie um snapshot para preservar um marco do projeto.
        </p>
      ) : (
        <ol className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="flex items-start justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{v.label}</p>
                <p className="text-xs text-muted-foreground">v{v.version} · {new Date(v.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <StatusBadge tone="neutral">v{v.version}</StatusBadge>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}