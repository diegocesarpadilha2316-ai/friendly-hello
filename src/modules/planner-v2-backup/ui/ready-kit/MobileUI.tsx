import { Bot, Box, Menu, Settings2, X, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const rightTab = usePlannerStore((s) => s.rightTab);
  const setRightTab = usePlannerStore((s) => s.setRightTab);
  const messages = usePlannerStore((s) => s.messages);
  const sendMessage = usePlannerStore((s) => s.sendMessage);
  
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && rightTab === "chat" && sheetOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, rightTab, sheetOpen]);

  const handleSend = () => {
    if (draft.trim()) {
      sendMessage(draft);
      setDraft("");
    }
  };

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
        style={{ height: `${sheetHeight}dvh` }}
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <strong>{rightTab === 'chat' ? 'IA Copiloto' : 'Inspetor'}</strong>
          <div>
            {[25, 50, 100].map((height) => (
              <button 
                key={height} 
                className={sheetHeight === height ? "active" : ""}
                onClick={() => setMobileSheetHeight(height as 25 | 50 | 100)}
              >
                {height === 25 ? "¼" : height === 50 ? "½" : "1"}
              </button>
            ))}
            <button onClick={() => setMobileSheet(false)}><X size={16} /></button>
          </div>
        </div>
        
        <div className="sheet-body">
          {rightTab === 'chat' ? (
            <div className="mobile-chat-container">
              <div className="mobile-messages">
                {messages.map((msg: any) => (
                  <article key={msg.id} className={`message ${msg.role}`}>
                    <p>{msg.content}</p>
                    <time>{msg.time}</time>
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mobile-ai-composer">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Peça algo ao IA Copiloto..."
                />
                <button type="button" onClick={handleSend}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <RightPanel />
          )}
        </div>
      </div>

      <nav className="mobile-nav">
        <button onClick={() => setMobileDrawer(true)}><Menu size={19} /><span>Projeto</span></button>
        <button><Box size={19} /><span>3D</span></button>
        <button 
          className={sheetOpen && rightTab === "chat" ? "active" : ""}
          onClick={() => { setRightTab("chat"); setMobileSheet(true); }}
        >
          <Bot size={19} /><span>IA</span>
        </button>
        <button 
          className={sheetOpen && rightTab === "inspector" ? "active" : ""}
          onClick={() => { setRightTab("inspector"); setMobileSheet(true); }}
        >
          <Settings2 size={19} /><span>Propriedades</span>
        </button>
      </nav>
    </>
  );
}
