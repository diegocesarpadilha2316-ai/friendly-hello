import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Ruler, Move3D, Undo2, Redo2, Save, PanelLeftOpen, PanelLeftClose, Boxes, Wrench } from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { usePlannerEditor } from "../state/editor-context";
import { Editor2D } from "../editor-2d";
import { LibraryPanel, findCatalogItem, insertItemIntoProject } from "../library";
import { Inspector } from "../engineering";

const Viewport3D = lazy(() =>
  import("../editor-3d/Viewport3D").then((m) => ({ default: m.Viewport3D })),
);

type Mode = "2d" | "3d";

export function EditorCanvas({ mode }: { mode: Mode }) {
  const { state, canUndo, canRedo, undo, redo, saveNow, updateProject } = usePlannerEditor();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const room = state.project?.environments
    .find((e) => e.id === state.selectedEnvironmentId)
    ?.rooms.find((r) => r.id === state.selectedRoomId);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/x-dioris-catalog-item");
    if (!id || !state.project || !state.selectedEnvironmentId || !state.selectedRoomId) return;
    const item = findCatalogItem(id);
    if (!item) return;
    const envId = state.selectedEnvironmentId;
    const roomId = state.selectedRoomId;
    updateProject((p) => insertItemIntoProject(p, { environmentId: envId, roomId }, item));
  }

  if (mode === "2d") {
    return (
      <div
        className="flex flex-col gap-2"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/x-dioris-catalog-item")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={onDrop}
      >
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span>Editor 2D {room ? `— ${room.name}` : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={libraryOpen ? "secondary" : "ghost"}
              onClick={() => setLibraryOpen((v) => !v)}
              title="Biblioteca (arraste peças para inserir)"
            >
              {libraryOpen ? <PanelLeftClose className="mr-1 h-4 w-4" /> : <PanelLeftOpen className="mr-1 h-4 w-4" />}
              <Boxes className="mr-1 h-4 w-4" /> Biblioteca
            </Button>
            <Button
              size="sm"
              variant={inspectorOpen ? "secondary" : "ghost"}
              onClick={() => setInspectorOpen((v) => !v)}
              title="Inspector de engenharia do móvel selecionado"
            >
              <Wrench className="mr-1 h-4 w-4" /> Engenharia
            </Button>
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
        <EditorLayout
          libraryOpen={libraryOpen}
          inspectorOpen={inspectorOpen}
        />
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

function EditorLayout({
  libraryOpen,
  inspectorOpen,
}: {
  libraryOpen: boolean;
  inspectorOpen: boolean;
}) {
  const left = libraryOpen ? "360px" : null;
  const right = inspectorOpen ? "340px" : null;
  const cols = [left, "1fr", right].filter(Boolean).join(" ");
  return (
    <div className="grid min-h-0 gap-2" style={{ gridTemplateColumns: cols }}>
      {libraryOpen ? (
        <div className="h-[720px] min-h-0">
          <LibraryPanel variant="compact" />
        </div>
      ) : null}
      <Editor2D />
      {inspectorOpen ? (
        <div className="h-[720px] min-h-0">
          <Inspector />
        </div>
      ) : null}
    </div>
  );
}