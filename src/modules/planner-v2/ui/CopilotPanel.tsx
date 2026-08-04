import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type {
  ChatMessage,
  FurnitureSelection,
  RightPanelTab
} from "./planner-ui";

interface Props {
  activeTab: RightPanelTab;
  messages: ChatMessage[];
  selectedFurniture?: FurnitureSelection | null;
  onTabChange: (tab: RightPanelTab) => void;
  onSendMessage?: (message: string) => void;
  onUpdateSelected?: (patch: Partial<FurnitureSelection>) => void;
}

export function CopilotPanel({
  activeTab,
  messages,
  selectedFurniture,
  onTabChange,
  onSendMessage,
  onUpdateSelected
}: Props) {
  const [draft, setDraft] = useState("");

  const send = () => {
    const value = draft.trim();
    if (!value) return;
    onSendMessage?.(value);
    setDraft("");
  };

  return (
    <>
      <div className="dioris-right-tabs">
        {(["chat", "inspector", "materials", "hardware", "lighting"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => onTabChange(tab)}
          >
            {tab === "chat"
              ? "IA"
              : tab === "inspector"
                ? "Inspetor"
                : tab === "materials"
                  ? "Materiais"
                  : tab === "hardware"
                    ? "Ferragens"
                    : "Luz"}
          </button>
        ))}
      </div>

      <div className="dioris-right-content">
        {activeTab === "chat" && (
          <div className="dioris-chat">
            <div className="dioris-chat-messages">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`dioris-message ${
                    message.role === "user" ? "is-user" : ""
                  }`}
                >
                  {message.role === "assistant" && <Sparkles size={15} />}
                  <div>
                    <p>{message.content}</p>
                    {message.timestamp && <time>{message.timestamp}</time>}
                  </div>
                </article>
              ))}
            </div>

            <div className="dioris-quick-actions">
              <button type="button">+ Iluminação</button>
              <button type="button">+ Prateleira</button>
              <button type="button">+ Render</button>
              <button type="button">+ Orçamento</button>
            </div>

            <div className="dioris-composer">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") send();
                }}
                placeholder="Peça algo ao IA Copiloto..."
              />
              <button type="button" onClick={send} aria-label="Enviar mensagem">
                <Send size={17} />
              </button>
            </div>
          </div>
        )}

        {activeTab === "inspector" && (
          <div className="dioris-form">
            <label>
              Item selecionado
              <input value={selectedFurniture?.name ?? "Nenhum"} readOnly />
            </label>
            <label>
              Largura (mm)
              <input
                type="number"
                value={selectedFurniture?.widthMm ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ widthMm: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Altura (mm)
              <input
                type="number"
                value={selectedFurniture?.heightMm ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ heightMm: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Profundidade (mm)
              <input
                type="number"
                value={selectedFurniture?.depthMm ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ depthMm: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Posição X
              <input
                type="number"
                value={selectedFurniture?.positionX ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ positionX: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Posição Z
              <input
                type="number"
                value={selectedFurniture?.positionZ ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ positionZ: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Rotação
              <input
                type="number"
                value={selectedFurniture?.rotationDeg ?? 0}
                onChange={(event) =>
                  onUpdateSelected?.({ rotationDeg: Number(event.target.value) })
                }
              />
            </label>
          </div>
        )}

        {activeTab === "materials" && (
          <div className="dioris-swatch-grid">
            {[
              ["Freijó", "#c8a879"],
              ["Branco", "#ece9df"],
              ["Grafite", "#514b48"],
              ["Pedra", "#d4cbbd"],
              ["Metal", "#202020"],
              ["Vidro", "linear-gradient(135deg,#bfe4ed88,#ffffff22)"]
            ].map(([name, color]) => (
              <button
                type="button"
                key={name}
                className="dioris-swatch"
                style={{ background: color }}
              >
                <span>{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "hardware" && (
          <div className="dioris-form">
            <label>
              Dobradiças
              <select defaultValue="blum">
                <option value="blum">Blum Clip Top</option>
                <option value="fgv">FGV</option>
              </select>
            </label>
            <label>
              Corrediças
              <select defaultValue="legrabox">
                <option value="legrabox">Blum Legrabox</option>
                <option value="telescopic">Telescópica</option>
              </select>
            </label>
            <label>
              Puxador
              <select defaultValue="gola">
                <option value="gola">Gola</option>
                <option value="cava">Cava</option>
                <option value="perfil">Perfil</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </>
  );
}
