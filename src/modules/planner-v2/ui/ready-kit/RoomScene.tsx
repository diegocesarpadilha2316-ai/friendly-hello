import { usePlannerStore } from "./usePlannerStoreReady";
import { V2Viewport } from "../../viewport/V2Viewport";

export function RoomScene() {
  const selectFurniture = (id: string | null) => usePlannerStore.getState().selectFurniture(id);

  return (
    <div className="w-full h-full relative" onClick={() => selectFurniture(null)}>
      <V2Viewport />
    </div>
  );
}
