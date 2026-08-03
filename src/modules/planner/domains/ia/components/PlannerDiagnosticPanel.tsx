import React from "react";
import { 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Box,
  Cpu,
  Layers
} from "lucide-react";
import { useDiagnostic } from "../services/diagnostics";
import { Button } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";

export function PlannerDiagnosticPanel() {
  const { isOpen, steps, setOpen, reset } = useDiagnostic();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (!isOpen || import.meta.env.PROD) return null;

  const copyReport = () => {
    const report = steps.map(s => {
      let text = `[${s.status.toUpperCase()}] ${s.name} (${s.durationMs || 0}ms)`;
      if (s.error) text += `\n  Erro: ${s.error}`;
      if (s.details) {
        text += `\n  Detalhes: ${JSON.stringify(s.details, null, 2)}`;
      }
      return text;
    }).join("\n\n---\n\n");
    
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="fixed right-4 top-20 z-[60] flex h-[600px] w-96 flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Diagnóstico Interno</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={copyReport} title="Copiar relatório">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {steps.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Cpu className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">Aguardando execução...</p>
          </div>
        )}
        
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={cn(
              "rounded-lg border bg-muted/30 p-2 transition-colors",
              step.status === "error" ? "border-destructive/50 bg-destructive/5" : "border-border"
            )}
          >
            <div 
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
            >
              <div className="flex items-center gap-2">
                {step.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {step.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {step.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                {step.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                <span className="text-xs font-medium">{step.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {step.durationMs !== undefined && (
                  <span className="text-[10px] text-muted-foreground">{step.durationMs}ms</span>
                )}
                {expandedId === step.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </div>

            {expandedId === step.id && (
              <div className="mt-2 space-y-2 border-t border-border/50 pt-2 text-[10px]">
                {step.error && (
                  <div className="rounded bg-destructive/10 p-1.5 font-mono text-destructive">
                    {step.details?.fullException || step.error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    <span>Renderer: {step.details?.renderer || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Box className="h-3 w-3" />
                    <span>Família: {step.details?.familyName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Módulos: {step.details?.moduleCount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className={cn("h-3 w-3", step.details?.objectCreated ? "text-green-500" : "text-muted-foreground")} />
                    <span>Object3D: {step.details?.objectCreated ? "Sim" : "Não"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="border-t border-border bg-muted/30 p-2 text-center">
        <Button variant="outline" size="xs" className="w-full text-[10px]" onClick={reset}>
          Limpar Diagnóstico
        </Button>
      </footer>
    </div>
  );
}
