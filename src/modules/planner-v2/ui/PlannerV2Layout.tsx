import { useEffect } from "react";
import { usePlannerStore } from "../pkg/state/usePlannerStore";
import { Topbar } from "../pkg/ui/Topbar";
import { Explorer } from "../pkg/ui/Explorer";
import { RightPanel } from "../pkg/ui/RightPanel";
import { MobileUI } from "../pkg/ui/MobileUI";
import { ViewportControls } from "../pkg/ui/ViewportControls";
import { RoomScene } from "../pkg/scene/RoomScene";
import "../pkg/styles/package.css";

export function PlannerV2Layout() {
  const leftCollapsed = usePlannerStore((s) => s.leftCollapsed);
  const rightCollapsed = usePlannerStore((s) => s.rightCollapsed);

  return (
    <div className={`app ${leftCollapsed ? "left-collapsed" : ""} ${rightCollapsed ? "right-collapsed" : ""}`}>
      <Topbar />

      <main className="workspace">
        <Explorer />

        <section className="viewport">
          <RoomScene />
          <ViewportControls />
        </section>

        <RightPanel />
      </main>

      <MobileUI />

      <footer className="statusbar">
        <span className="ready">● READY</span>
        <span>FPS 60</span>
        <span>UNIDADE mm</span>
        <span>SNAP ATIVO</span>
        <span className="grow" />
        <span>AUTOSAVE ✓</span>
      </footer>
    </div>
  );
}
