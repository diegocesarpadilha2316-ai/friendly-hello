import { Ruler, Move3D, Undo2, Redo2, Save } from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";

type Mode = "2d" | "3d";

export function EditorCanvas({ mode }: { mode: Mode }) {
  const { state, canUndo, canRedo, undo, redo, saveNow } = usePlannerEditor();
  const room = state.project?.environments
    .find((e) => e.id === state.selectedEnvironmentId)
    ?.rooms.find((r) => r.id === state.selectedRoomId);

  return (
    <div className="relative flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {mode === "2d" ? <Ruler className="h-4 w-4" /> : <Move3D className="h-4 w-4" />}
          <span>Editor {mode.toUpperCase()}</span>
          {room ? <span className="text-foreground/80">— {room.name}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo}>
            <Undo2 className="mr-1 h-4 w-4" />
            Desfazer
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo}>
            <Redo2 className="mr-1 h-4 w-4" />
            Refazer
          </Button>
          <Button size="sm" variant="ghost" onClick={saveNow}>
            <Save className="mr-1 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>
      <div className="grid flex-1 place-items-center bg-[radial-gradient(hsl(var(--muted-foreground)/0.15)_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="max-w-md text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Motor {mode === "2d" ? "2D" : "3D"} em preparação</p>
          <p className="mt-1">A fundação paramétrica está pronta. O renderer plugará neste canvas nas próximas fases sem tocar no estado global.</p>
        </div>
      </div>
    </div>
  );
}