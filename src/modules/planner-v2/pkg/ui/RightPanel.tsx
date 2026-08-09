import { Bot, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useState } from "react";
import { usePlannerStore } from "../state/usePlannerStore";
import type { RightTab } from "../types";

const tabs: { id: RightTab; label: string }[] = [
  { id: "chat", label: "IA" },
  { id: "inspector", label: "Inspetor" },
  { id: "materials", label: "Materiais" },
  { id: "hardware", label: "Ferragens" }
];

export function RightPanel() {
  const collapsed = usePlannerStore((s) => s.rightCollapsed);
  const toggleRight = usePlannerStore((s) => s.toggleRight);
  const rightTab = usePlannerStore((s) => s.rightTab);
  const setRightTab = usePlannerStore((s) => s.setRightTab);
  const messages = usePlannerStore((s) => s.messages);
  const sendMessage = usePlannerStore((s) => s.sendMessage);
  const furniture = usePlannerStore((s) => s.furniture);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const updateSelected = usePlannerStore((s) => s.updateSelected);
  const [draft, setDraft] = useState("");

  const selected = furniture.find((item) => item.id === selectedId);

  return (
    <aside className={`right-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-head">
        {!collapsed && <strong>IA Copiloto / Inspetor</strong>}
        <button type="button" onClick={toggleRight}>
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {collapsed ? (
        <div className="collapsed-icons"><Bot size={19} /></div>
      ) : (
        <>
          <div className="right-tabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={rightTab === tab.id ? "active" : ""}
                onClick={() => setRightTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="right-content">
            {rightTab === "chat" && (
              <div className="chat">
                <div className="messages">
                  {messages.map((message) => (
                    <article key={message.id} className={`message ${message.role}`}>
                      <p>{message.content}</p>
                      <time>{message.time}</time>
                    </article>
                  ))}
                </div>

                <div className="quick-actions">
                  <button onClick={() => sendMessage("Troque o MDF para Freijó")}>Trocar p/ Freijó</button>
                  <button onClick={() => sendMessage("Adicione fita LED nos aéreos")}>Adicionar LED</button>
                  <button onClick={() => sendMessage("Qual o valor estimado deste projeto?")}>Ver Orçamento</button>
                  <button onClick={() => sendMessage("Abra todas as portas e gavetas")}>Abrir Tudo</button>
                </div>

                <div className="composer">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        sendMessage(draft);
                        setDraft("");
                      }
                    }}
                    placeholder="Peça algo ao IA Copiloto..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sendMessage(draft);
                      setDraft("");
                    }}
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            )}

            {rightTab === "inspector" && (
              <div className="form">
                <label>
                  Item
                  <input value={selected?.name ?? "Nenhum"} readOnly />
                </label>
                <label>
                  Largura (m)
                  <input
                    type="number"
                    step="0.05"
                    value={selected?.size[0] ?? 0}
                    onChange={(event) =>
                      selected &&
                      updateSelected({
                        size: [
                          Number(event.target.value),
                          selected.size[1],
                          selected.size[2]
                        ]
                      })
                    }
                  />
                </label>
                <label>
                  Altura (m)
                  <input
                    type="number"
                    step="0.05"
                    value={selected?.size[1] ?? 0}
                    onChange={(event) =>
                      selected &&
                      updateSelected({
                        size: [
                          selected.size[0],
                          Number(event.target.value),
                          selected.size[2]
                        ]
                      })
                    }
                  />
                </label>
                <label>
                  Profundidade (m)
                  <input
                    type="number"
                    step="0.05"
                    value={selected?.size[2] ?? 0}
                    onChange={(event) =>
                      selected &&
                      updateSelected({
                        size: [
                          selected.size[0],
                          selected.size[1],
                          Number(event.target.value)
                        ]
                      })
                    }
                  />
                </label>
                <label>
                  Rotação
                  <input
                    type="number"
                    step="0.1"
                    value={selected?.rotationY ?? 0}
                    onChange={(event) => updateSelected({ rotationY: Number(event.target.value) })}
                  />
                </label>
              </div>
            )}

            {rightTab === "materials" && (
              <div className="swatches">
                {[
                  ["Freijó", "wood", "#7a4f2c"],
                  ["Taupe", "taupe", "#8b7564"],
                  ["Branco", "white", "#e8e5df"],
                  ["Grafite", "graphite", "#4a4745"],
                  ["Pedra", "stone", "#cbbba6"]
                ].map(([label, id, color]) => (
                  <button
                    type="button"
                    key={id}
                    className="swatch"
                    style={{ background: color }}
                    onClick={() => updateSelected({ material: id })}
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}

            {rightTab === "hardware" && (
              <div className="form">
                <label>Dobradiças<select><option>Blum Clip Top</option><option>FGV</option></select></label>
                <label>Corrediças<select><option>Blum Legrabox</option><option>Telescópica</option></select></label>
                <label>Puxador<select><option>Gola</option><option>Cava</option><option>Perfil</option></select></label>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
