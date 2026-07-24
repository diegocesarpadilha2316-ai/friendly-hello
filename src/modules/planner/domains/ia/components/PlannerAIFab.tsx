/**
 * Botão flutuante que abre o painel da IA sobre qualquer rota do Planner.
 * Consome o mesmo `PlannerEditorProvider` do editor — nada novo.
 */
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlannerAIPanel } from "./PlannerAIPanel";

export function PlannerAIFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar IA do Planner" : "Abrir IA do Planner"}
        className={cn(
          "fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full",
          "bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground",
          "shadow-[0_18px_50px_-12px_rgba(139,92,246,0.55)] ring-1 ring-white/10",
          "transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/60",
        )}
      >
        <Sparkles className="h-6 w-6" />
        <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/40 blur-2xl" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 h-[min(640px,calc(100vh-140px))]">
          <PlannerAIPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}