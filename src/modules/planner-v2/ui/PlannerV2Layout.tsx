import { useEffect, useRef, useState, type DragEvent } from "react";
import { usePlannerStore } from "../pkg/state/usePlannerStore";
import { Topbar } from "../pkg/ui/Topbar";
import { Explorer } from "../pkg/ui/Explorer";
import { RightPanel } from "../pkg/ui/RightPanel";
import { MobileUI } from "../pkg/ui/MobileUI";
import { ViewportControls } from "../pkg/ui/ViewportControls";
import { InspectionControls } from "../pkg/ui/InspectionControls";
import { RenderFinalPanel } from "../pkg/ui/RenderFinalPanel";
import { TransformGizmoOverlay } from "../pkg/ui/TransformGizmoOverlay";
import { useRoomBuilderStore } from "../pkg/state/useRoomBuilderStore";
import { RoomScene } from "../pkg/scene/RoomScene";
import "../pkg/styles/package.css";

export function PlannerV2Layout() {
  const leftCollapsed = usePlannerStore((s) => s.leftCollapsed);
  const rightCollapsed = usePlannerStore((s) => s.rightCollapsed);
  const dragPreview = usePlannerStore((s) => s.dragPreview);
  const setDragPreview = usePlannerStore((s) => s.setDragPreview);
  const dropDragPreview = usePlannerStore((s) => s.dropDragPreview);
  const clearDragPreview = usePlannerStore((s) => s.clearDragPreview);
  const viewportRef = useRef<HTMLElement>(null);
  const snapEnabled = usePlannerStore((s) => s.snapEnabled);
  const [fps, setFps] = useState<number | null>(null);
  const [renderFinalOpen, setRenderFinalOpen] = useState(false);
  const [saved, setSaved] = useState(() => typeof window !== "undefined" && Boolean(window.localStorage.getItem("dioris.planner-v2.project.v4")));
  const naturalIntegrationStarted = useRef(false);

  useEffect(() => {
    if (naturalIntegrationStarted.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("naturalKitchen") !== "1" && params.get("promobReference") !== "1") return;
    naturalIntegrationStarted.current = true;
    if (params.get("promobReference") === "1") {
      const timer = window.setTimeout(() => usePlannerStore.getState().applyPromobReference(), 700);
      return () => window.clearTimeout(timer);
    }
    const naturalRequest = params.get("etapa1") === "1"
      ? "Crie uma cozinha limpa — ETAPA 1 — somente módulos inferiores e bancada. Em uma parede limpa, da esquerda para a direita: balcão 800 mm com 2 portas, gaveteiro 600 mm com 4 gavetas, balcão de pia 1200 mm com 2 portas e balcão 800 mm com 2 portas. Todos em MDF 18 mm. Não inclua aéreos, torre, geladeira, coifa, cooktop ou decoração."
      : "Crie uma cozinha nessa parede. Quero uma torre de forno e micro-ondas na esquerda, um balcão de 800 com duas portas, um gaveteiro de 600 com quatro gavetas, um balcão de pia de 1200 com duas portas e aéreos em cima. Use MDF 18 mm.";
    const timer = window.setTimeout(() => {
      const store = usePlannerStore.getState();
      store.newProject();
      store.sendMessage(naturalRequest);
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onFps = (event: Event) => setFps((event as CustomEvent<number>).detail);
    const onSaved = () => setSaved(true);
    const onOpenRender = () => setRenderFinalOpen(true);
    window.addEventListener("dioris:fps", onFps);
    window.addEventListener("dioris:project-saved", onSaved);
    window.addEventListener("dioris:open-render-final", onOpenRender);
    return () => {
      window.removeEventListener("dioris:fps", onFps);
      window.removeEventListener("dioris:project-saved", onSaved);
      window.removeEventListener("dioris:open-render-final", onOpenRender);
    };
  }, []);

  const updateDragPosition = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const moduleId = event.dataTransfer.getData("application/x-dioris-module") || dragPreview?.moduleId;
    const element = viewportRef.current;
    if (!moduleId || !element) return;
    const rect = element.getBoundingClientRect();
    const room = useRoomBuilderStore.getState();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * room.width;
    const z = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * room.depth;
    setDragPreview(moduleId, { x, y: 0, z });
  };

  const updateTouchPosition = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || !dragPreview) return;
    event.preventDefault();
    const element = viewportRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const room = useRoomBuilderStore.getState();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * room.width;
    const z = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * room.depth;
    setDragPreview(dragPreview.moduleId, { x, y: 0, z });
  };

  return (
    <div className={`app ${leftCollapsed ? "left-collapsed" : ""} ${rightCollapsed ? "right-collapsed" : ""}`}>
      <Topbar />

      <main className="workspace">
        <Explorer />

        <section
          ref={viewportRef}
          className={`viewport ${dragPreview ? `dragging-module ${dragPreview.valid ? "drop-valid" : "drop-invalid"}` : ""}`}
          onDragOver={updateDragPosition}
          onDrop={(event) => {
            event.preventDefault();
            dropDragPreview();
          }}
          onPointerMove={updateTouchPosition}
          onPointerUp={(event) => {
            if (event.pointerType === "touch" && dragPreview) dropDragPreview();
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearDragPreview();
          }}
        >
          <RoomScene />
          {dragPreview && (
            <div className="drag-preview-feedback" role="status" aria-live="polite">
              <strong>{dragPreview.valid ? "Posição válida" : "Posição inválida"}</strong>
              <span>{dragPreview.message ?? "Solte para adicionar"}</span>
              <div className="drag-guides">{dragPreview.guides.map((guide) => <span key={guide}>{guide}</span>)}</div>
            </div>
          )}
          <TransformGizmoOverlay />
          <InspectionControls />
          <ViewportControls />
        </section>

        <RightPanel />
      </main>

      <MobileUI />
      {renderFinalOpen && <RenderFinalPanel onClose={() => setRenderFinalOpen(false)} />}

      <footer className="statusbar">
        <span className="ready">● READY</span>
        <span>FPS {fps ?? "—"}</span>
        <span>UNIDADE mm</span>
        <span>SNAP {snapEnabled ? "ATIVO" : "INATIVO"}</span>
        <span className="grow" />
        <span>{saved ? "PROJETO SALVO ✓" : "PROJETO NÃO SALVO"}</span>
      </footer>
    </div>
  );
}
