import { DoorOpen, Eye, Footprints, MousePointer2, Orbit, PanelTopClose } from "lucide-react";
import { useImmersiveStore } from "../state/useImmersiveStore";

export function ImmersiveControls() {
  const navigationMode = useImmersiveStore((s) => s.navigationMode);
  const qualityMode = useImmersiveStore((s) => s.qualityMode);
  const selectedPart = useImmersiveStore((s) => s.selectedPart);
  const setNavigationMode = useImmersiveStore((s) => s.setNavigationMode);
  const setQualityMode = useImmersiveStore((s) => s.setQualityMode);
  const closeAll = useImmersiveStore((s) => s.closeAll);

  return (
    <>
      <div className="immersive-toolbar">
        <button
          type="button"
          className={navigationMode === "orbit" ? "active" : ""}
          onClick={() => setNavigationMode("orbit")}
        >
          <Orbit size={16} />
          Orbitar
        </button>
        <button
          type="button"
          className={navigationMode === "walk" ? "active" : ""}
          onClick={() => setNavigationMode("walk")}
        >
          <Footprints size={16} />
          Entrar
        </button>
        <button
          type="button"
          className={navigationMode === "inspect" ? "active" : ""}
          onClick={() => setNavigationMode("inspect")}
        >
          <MousePointer2 size={16} />
          Inspecionar
        </button>
        <button type="button" onClick={closeAll}>
          <PanelTopClose size={16} />
          Fechar tudo
        </button>
        <button
          type="button"
          className={qualityMode === "presentation" ? "active" : ""}
          onClick={() =>
            setQualityMode(qualityMode === "presentation" ? "realistic" : "presentation")
          }
        >
          <Eye size={16} />
          {qualityMode === "presentation" ? "Realista" : "Apresentação"}
        </button>
      </div>

      <div className="immersive-help">
        <DoorOpen size={16} />
        <span>
          Clique em portas e gavetas para abrir. No modo Entrar, clique na cena e use WASD.
        </span>
      </div>

      {selectedPart && (
        <div className="selected-detail">
          Selecionado: <strong>{selectedPart}</strong>
        </div>
      )}
    </>
  );
}
