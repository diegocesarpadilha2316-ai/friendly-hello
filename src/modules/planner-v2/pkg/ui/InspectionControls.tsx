import { Eye, EyeOff, Layers3, ScanLine, Undo2 } from "lucide-react";
import { useImmersiveStore } from "../state/useImmersiveStore";

function rootId(id: string | null) {
  if (!id) return null;
  return id.replace(/-(left-door|right-door|drawer-[123])$/, "");
}

export function InspectionControls() {
  const selectedPart = useImmersiveStore((s) => s.selectedPart);
  const mode = useImmersiveStore((s) => s.occlusionMode);
  const setMode = useImmersiveStore((s) => s.setOcclusionMode);
  const toggleHidden = useImmersiveStore((s) => s.toggleHidden);
  const showAll = useImmersiveStore((s) => s.showAll);
  const selectedRoot = rootId(selectedPart);
  return <div className="inspection-toolbar">
    <button disabled={!selectedPart} className={mode === "xray" ? "active" : ""} onClick={() => setMode(mode === "xray" ? "normal" : "xray")}><ScanLine size={16}/>Raio-X</button>
    <button disabled={!selectedPart} className={mode === "isolate" ? "active" : ""} onClick={() => setMode(mode === "isolate" ? "normal" : "isolate")}><Layers3 size={16}/>Isolar</button>
    <button disabled={!selectedRoot} onClick={() => selectedRoot && toggleHidden(selectedRoot)}><EyeOff size={16}/>Ocultar</button>
    <button onClick={showAll}><Eye size={16}/>Mostrar tudo</button>
    <button onClick={() => setMode("normal")}><Undo2 size={16}/>Normal</button>
  </div>;
}
