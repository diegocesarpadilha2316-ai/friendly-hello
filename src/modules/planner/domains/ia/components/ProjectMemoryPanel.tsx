/**
 * Etapa 10 — painel discreto "Memória do Projeto".
 *
 * Mostra estilo, materiais, preferências, decisões e pendências, e
 * permite Atualizar (recalcular resumo) e Limpar (com confirmação).
 */
import { useState } from "react";
import { Brain, ChevronDown, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import { useProjectMemory } from "../memory/use-project-memory";

function Row({ label, values }: { label: string; values: readonly string[] }) {
  if (!values.length) return null;
  return (
    <div className="flex gap-2 text-[11px] leading-relaxed">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground/90">
            {v}
          </span>
        ))}
      </span>
    </div>
  );
}

export function ProjectMemoryPanel({ className }: { className?: string }) {
  const { memory, recompute, clear } = useProjectMemory();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!memory) return null;

  const isEmpty =
    !memory.style &&
    !memory.materials.length &&
    !memory.preferences.length &&
    !memory.decisions.length &&
    !memory.constraints.length &&
    !memory.pendings.length;

  return (
    <div className={cn("border-b border-border/60 bg-muted/20 px-3 py-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">Memória do Projeto</span>
        <span className="flex-1 truncate opacity-80">
          {memory.executiveSummary || (isEmpty ? "sem contexto ainda" : "")}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="mt-2 space-y-1.5">
          <Row label="Estilo" values={memory.style ? [memory.style] : []} />
          <Row label="Materiais" values={memory.materials.map((m) => m.value)} />
          <Row label="Preferências" values={memory.preferences.map((m) => m.value)} />
          <Row label="Restrições" values={memory.constraints.map((m) => m.value)} />
          <Row label="Decisões" values={memory.decisions.map((m) => m.value)} />
          <Row label="Pendências" values={memory.pendings.map((p) => p.label)} />
          {isEmpty ? (
            <p className="text-[11px] text-muted-foreground">
              A memória é preenchida automaticamente conforme decisões forem aplicadas ao projeto.
            </p>
          ) : null}

          <div className="flex items-center gap-1 pt-1">
            <Button size="sm" variant="ghost" onClick={recompute} title="Recalcular resumo">
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Atualizar
            </Button>
            {confirming ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    clear();
                    setConfirming(false);
                  }}
                >
                  Confirmar limpeza
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar memória
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
