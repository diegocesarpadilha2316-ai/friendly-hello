import { Explorer } from "./components/Explorer";
import { MobileUI } from "./components/MobileUI";
import { RightPanel } from "./components/RightPanel";
import { Topbar } from "./components/Topbar";
import { ViewportControls } from "./components/ViewportControls";
import { RoomScene } from "./scene/RoomScene";
import "./styles/app.css";

export default function App() {
  return (
    <div className="app">
      <Topbar />

      <main className="workspace">
        <Explorer />

        <section className="viewport">
          <RoomScene />
          <ViewportControls />
          <MobileUI />
        </section>

        <RightPanel />
      </main>

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
