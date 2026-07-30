import { History, RotateCcw, BookmarkPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, StatusBadge } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import { SyncStatusIndicator } from "./SyncStatusIndicator";

export function VersionHistoryPanel() {
  const { versions, state, restoreVersion, snapshotVersion } = usePlannerEditor();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating || !state.project) return;
    setCreating(true); // trava anti clique-duplo
    try {
      const name =
        label.trim() ||
        `Checkpoint ${new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;
      const ok = await snapshotVersion(name);
      if (ok) {
        setLabel("");
        toast.success("Versão salva", { description: name });
      } else {
        toast.error("Não foi possível salvar a versão");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: string, versionLabel: string) => {
    if (restoringId) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        `Restaurar a versão “${versionLabel}”?\n\nO estado atual será preservado automaticamente como um checkpoint antes da restauração.`,
      );
    if (!confirmed) return;
    setRestoringId(id);
    try {
      const ok = await restoreVersion(id);
      if (ok) toast.success("Versão restaurada", { description: versionLabel });
      else
        toast.error("Restauração não sincronizada", {
          description: "As alterações estão salvas neste dispositivo. Tente sincronizar novamente.",
        });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Histórico de versões</h3>
        <SyncStatusIndicator className="ml-auto" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome da versão (opcional)"
          maxLength={200}
          disabled={!state.project || creating}
          className="h-8 min-w-0 flex-1 rounded-md border border-border/60 bg-background/60 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
        <Button size="sm" onClick={handleCreate} disabled={!state.project || creating}>
          {creating ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
          )}
          {creating ? "Salvando…" : "Salvar versão"}
        </Button>
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
                  onClick={() => handleRestore(v.id, v.label)}
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