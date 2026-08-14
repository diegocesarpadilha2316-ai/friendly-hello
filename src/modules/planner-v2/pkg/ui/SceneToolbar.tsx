import {
  Box,
  DoorOpen,
  Eye,
  EyeOff,
  Footprints,
  Hand,
  Layers3,
  Menu,
  MousePointer2,
  ScanLine,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useState } from "react";
import { usePlannerStore } from "../state/usePlannerStore";
import { useImmersiveStore } from "../state/useImmersiveStore";

export function SceneToolbar() {
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const toolMode = usePlannerStore((s) => s.toolMode);
  const setToolMode = usePlannerStore((s) => s.setToolMode);
  const navigationMode = useImmersiveStore((s) => s.navigationMode);
  const setNavigationMode = useImmersiveStore((s) => s.setNavigationMode);
  const selectedPart = useImmersiveStore((s) => s.selectedPart);
  const mode = useImmersiveStore((s) => s.occlusionMode);
  const setMode = useImmersiveStore((s) => s.setOcclusionMode);
  const hideSelected = useImmersiveStore((s) => s.hideSelected);
  const showAll = useImmersiveStore((s) => s.showAll);
  const closeAll = useImmersiveStore((s) => s.closeAll);

  return (
    <>
      <div className="scene-toolbar">
        <button
          className={toolMode === "orbit" && navigationMode !== "walk" ? "active" : ""}
          onClick={() => {
            setNavigationMode("orbit");
            setToolMode("orbit");
          }}
        >
          <Box size={16} /> <span>Orbitar</span>
        </button>
        <button
          className={toolMode === "pan" ? "active" : ""}
          onClick={() => {
            setNavigationMode("orbit");
            setToolMode("pan");
          }}
        >
          <Hand size={16} /> <span>Pan</span>
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("dioris:zoom-in"))}>
          <ZoomIn size={16} /> <span>Zoom +</span>
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("dioris:zoom-out"))}>
          <ZoomOut size={16} /> <span>Zoom -</span>
        </button>
        <button
          className={toolMode === "select" ? "active" : ""}
          onClick={() => {
            setNavigationMode("inspect");
            setToolMode("select");
          }}
        >
          <MousePointer2 size={16} /> <span>Selecionar</span>
        </button>
        <button
          className={navigationMode === "walk" ? "active" : ""}
          onClick={() => setNavigationMode("walk")}
        >
          <Footprints size={16} /> <span>Entrar</span>
        </button>
        <button className="visibility-trigger" onClick={() => setVisibilityOpen((v) => !v)}>
          <Menu size={16} /> <span>Visibilidade</span>
        </button>
      </div>

      {visibilityOpen && (
        <div className="visibility-popover">
          <div className="visibility-head">
            <strong>Inspeção do móvel</strong>
            <button onClick={() => setVisibilityOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <button
            disabled={!selectedPart}
            className={mode === "xray" ? "active" : ""}
            onClick={() => {
              setMode(mode === "xray" ? "normal" : "xray");
              setVisibilityOpen(false);
            }}
          >
            <ScanLine size={17} />
            <span>
              <b>Raio-X</b>
              <small>Deixa os outros móveis transparentes</small>
            </span>
          </button>
          <button
            disabled={!selectedPart}
            className={mode === "isolate" ? "active" : ""}
            onClick={() => {
              setMode(mode === "isolate" ? "normal" : "isolate");
              setVisibilityOpen(false);
            }}
          >
            <Layers3 size={17} />
            <span>
              <b>Isolar</b>
              <small>Mostra somente o móvel selecionado</small>
            </span>
          </button>
          <button
            disabled={!selectedPart}
            onClick={() => {
              hideSelected();
              setVisibilityOpen(false);
            }}
          >
            <EyeOff size={17} />
            <span>
              <b>Ocultar selecionado</b>
              <small>Oculta sem apagar do projeto</small>
            </span>
          </button>
          <button
            onClick={() => {
              showAll();
              setVisibilityOpen(false);
            }}
          >
            <Eye size={17} />
            <span>
              <b>Mostrar tudo</b>
              <small>Restaura todos os móveis</small>
            </span>
          </button>
          <button
            onClick={() => {
              closeAll();
              setVisibilityOpen(false);
            }}
          >
            <DoorOpen size={17} />
            <span>
              <b>Fechar portas e gavetas</b>
              <small>Retorna todos os movimentos</small>
            </span>
          </button>
        </div>
      )}
    </>
  );
}
