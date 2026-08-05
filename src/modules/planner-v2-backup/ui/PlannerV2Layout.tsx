import { Explorer } from "./ready-kit/Explorer";
import { MobileUI } from "./ready-kit/MobileUI";
import { RightPanel } from "./ready-kit/RightPanel";
import { Topbar } from "./ready-kit/Topbar";
import { ViewportControls } from "./ready-kit/ViewportControls";
import { RoomScene } from "./ready-kit/RoomScene";

export function PlannerV2Layout() {
  return (
    <div className="app">
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
