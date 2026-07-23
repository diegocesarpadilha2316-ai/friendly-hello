import { Ruler, Move3D, Undo2, Redo2, Save } from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import { Editor2D } from "../editor-2d";

type Mode = "2d" | "3d";

export function EditorCanvas({ mode }: { mode: Mode }) {
  const { state, canUndo, canRedo, undo, redo, saveNow } = usePlannerEditor();
  const room = state.project?.environments
    .find((e) => e.id === state.selectedEnvironmentId)
    ?.rooms.find((r) => r.id === state.selectedRoomId);

  if (mode === "2d") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span>Editor 2D {room ? `— ${room.name}` : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo}>
              <Undo2 className="mr-1 h-4 w-4" /> Desfazer
            </Button>
            <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo}>
              <Redo2 className="mr-1 h-4 w-4" /> Refazer
            </Button>
            <Button size="sm" variant="ghost" onClick={saveNow}>
              <Save className="mr-1 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
        <Editor2D />
      </div>
    );
  }

  return (
    <div className="relative flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Move3D className="h-4 w-4" />
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
          <p className="font-semibold text-foreground">Motor 3D em preparação</p>
          <p className="mt-1">A fundação paramétrica está pronta. O renderer plugará neste canvas nas próximas fases sem tocar no estado global.</p>
        </div>
      </div>
    </div>
  );
}