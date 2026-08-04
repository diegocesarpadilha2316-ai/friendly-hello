import { Bot, Box, Menu, Settings2, X } from "lucide-react";
import { usePlannerStore } from "./usePlannerStoreReady";
import { Explorer } from "./Explorer";
import { RightPanel } from "./RightPanel";

export function MobileUI() {
  const drawerOpen = usePlannerStore((s) => s.mobileDrawerOpen);
  const sheetOpen = usePlannerStore((s) => s.mobileSheetOpen);
  const sheetHeight = usePlannerStore((s) => s.mobileSheetHeight);
  const setMobileDrawer = usePlannerStore((s) => s.setMobileDrawer);
  const setMobileSheet = usePlannerStore((s) => s.setMobileSheet);
  const setMobileSheetHeight = usePlannerStore((s) => s.setMobileSheetHeight);
  const setRightTab = usePlannerStore((s) => s.setRightTab);

  return (
    <>
      <div 
        className={`mobile-backdrop ${drawerOpen || sheetOpen ? "show" : ""}`} 
        onClick={() => {
          setMobileDrawer(false);
          setMobileSheet(false);
        }} 
      />


      <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        <Explorer />
      </div>

      <div
        className={`mobile-sheet ${sheetOpen ? "open" : ""}`}
        style={{ height: `${sheetHeight}%` }}
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <strong>IA Copiloto / Inspetor</strong>
          <div>
            {[25, 50, 100].map((height) => (
              <button key={height} onClick={() => setMobileSheetHeight(height as 25 | 50 | 100)}>
                {height === 25 ? "¼" : height === 50 ? "½" : "1"}
              </button>
            ))}
            <button onClick={() => setMobileSheet(false)}><X size={16} /></button>
          </div>
        </div>
        <div className="sheet-body"><RightPanel /></div>
      </div>

      <nav className="mobile-nav">
        <button onClick={() => setMobileDrawer(true)}><Menu size={19} /><span>Projeto</span></button>
        <button><Box size={19} /><span>3D</span></button>
        <button onClick={() => { setRightTab("chat"); setMobileSheet(true); }}><Bot size={19} /><span>IA</span></button>
        <button onClick={() => { setRightTab("inspector"); setMobileSheet(true); }}><Settings2 size={19} /><span>Propriedades</span></button>
      </nav>
    </>
  );
}
