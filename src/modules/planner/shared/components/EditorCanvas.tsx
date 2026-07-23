import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Ruler, Move3D, Undo2, Redo2, Save } from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import { Editor2D } from "../editor-2d";

const Viewport3D = lazy(() =>
  import("../editor-3d/Viewport3D").then((m) => ({ default: m.Viewport3D })),
);

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-2">
          <Move3D className="h-4 w-4" />
          <span>Ambiente 3D {room ? `— ${room.name}` : ""}</span>
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
      <ClientOnly
        fallback={
          <div className="grid h-[620px] place-items-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
            Carregando ambiente 3D…
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="grid h-[620px] place-items-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
              Inicializando motor 3D…
            </div>
          }
        >
          <Viewport3D />
        </Suspense>
      </ClientOnly>
    </div>
  );
}