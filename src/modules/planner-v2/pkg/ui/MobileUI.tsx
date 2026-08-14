import { useState, useRef, useEffect } from "react";
import { Bot, Box, Camera, Menu, Settings2, X, Send } from "lucide-react";
import { usePlannerStore } from "../state/usePlannerStore";
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
  const rightTab = usePlannerStore((s) => s.rightTab);
  const messages = usePlannerStore((s) => s.messages);
  const sendMessage = usePlannerStore((s) => s.sendMessage);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (sheetOpen && rightTab === "chat") {
      scrollToBottom();
    }
  }, [messages, sheetOpen, rightTab]);

  return (
    <>
      <div
        className={`mobile-backdrop ${drawerOpen ? "show" : ""}`}
        onClick={() => setMobileDrawer(false)}
      />

      <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        <Explorer />
      </div>

      <div
        className={`mobile-sheet ${sheetOpen ? "open" : ""}`}
        style={{ height: sheetHeight === 100 ? "100dvh" : `${sheetHeight}%` }}
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
            <button onClick={() => setMobileSheet(false)}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="sheet-body">
          {sheetOpen && rightTab === "chat" ? (
            <div className="mobile-chat-overlay">
              <div className="mobile-messages">
                {messages.map((message) => (
                  <article key={message.id} className={`message ${message.role}`}>
                    <p>{message.content}</p>
                    <time>{message.time}</time>
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="mobile-composer">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage(draft);
                      setDraft("");
                    }
                  }}
                  placeholder="Peça algo ao IA Copiloto..."
                />
                <button
                  onClick={() => {
                    sendMessage(draft);
                    setDraft("");
                  }}
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-panel-wrapper">
              <RightPanel />
            </div>
          )}
        </div>
      </div>

      <nav className="mobile-nav">
        <button
          onClick={() => {
            setMobileDrawer(true);
            setMobileSheet(false);
          }}
        >
          <Menu size={19} />
          <span>Projeto</span>
        </button>
        <button
          onClick={() => {
            setMobileDrawer(false);
            setMobileSheet(false);
          }}
        >
          <Box size={19} />
          <span>3D</span>
        </button>
        <button
          onClick={() => {
            setMobileDrawer(false);
            setRightTab("chat");
            setMobileSheet(true);
            setMobileSheetHeight(100);
          }}
        >
          <Bot size={19} />
          <span>IA</span>
        </button>
        <button
          onClick={() => {
            setMobileDrawer(false);
            setRightTab("inspector");
            setMobileSheet(true);
            setMobileSheetHeight(50);
          }}
        >
          <Settings2 size={19} />
          <span>Propriedades</span>
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("dioris:open-render-final"))}>
          <Camera size={19} />
          <span>Render</span>
        </button>
      </nav>
    </>
  );
}
