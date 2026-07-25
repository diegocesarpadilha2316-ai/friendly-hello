import { History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button, StatusBadge } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";

export function VersionHistoryPanel() {
  const { versions, state, restoreVersion } = usePlannerEditor();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restoreVersion(id);
    } finally {
      setRestoringId(null);
    }
  };
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
              <div className="min-w-0">
                <p className="font-medium">{v.label}</p>
                <p className="text-xs text-muted-foreground">v{v.version} · {new Date(v.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone="neutral">v{v.version}</StatusBadge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId !== null}
                  title="Restaurar esta versão"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {restoringId === v.id ? "Restaurando…" : "Restaurar"}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}