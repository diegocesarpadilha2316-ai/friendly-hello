import { Bot, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useState } from "react";
import { usePlannerStore } from "./usePlannerStoreReady";
import type { RightTab } from "./types";

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
  const instances = usePlannerStore((s) => s.instances || []);
  const updateInstance = usePlannerStore((s) => s.updateFurnitureInstance);
  const deleteInstance = usePlannerStore((s) => s.removeFurnitureInstance);
  const toggleAnim = usePlannerStore((s) => s.toggleInstanceAnimation);

  const [draft, setDraft] = useState("");

  const selected = furniture.find((item: any) => item.id === selectedId);
  const instance = instances.find((item: any) => item.id === selectedId);
  const isV2 = !!instance;
  const current = instance || selected;


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
      )}

      {!collapsed && (
        <div className="right-content">
          {rightTab === "chat" && (
            <div className="chat">
              <div className="messages">
                {messages.map((message: any) => (
                  <article key={message.id} className={`message ${message.role}`}>
                    <p>{message.content}</p>
                    <time>{message.time}</time>
                  </article>
                ))}
              </div>

              <div className="quick-actions">
                <button>+ Iluminação</button>
                <button>+ Prateleira</button>
                <button>+ Render</button>
                <button>+ Orçamento</button>
              </div>

              <div className="composer">
                <input
                  value={draft}
                  onChange={(event: any) => setDraft(event.target.value)}
                  onKeyDown={(event: any) => {
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
                <input value={current?.name ?? "Nenhum"} readOnly />
              </label>
              {isV2 && (
                <div className="form-actions" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                   <button 
                    type="button" 
                    className="secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                    onClick={() => toggleAnim(selectedId)}
                   >
                    {instance.isOpen ? 'Fechar Tudo' : 'Abrir Tudo'}
                   </button>
                   <button 
                    type="button" 
                    className="danger"
                    style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#ef4444', color: 'white' }}
                    onClick={() => deleteInstance(selectedId)}
                   >
                    Excluir
                   </button>
                 </div>
              )}
              
              {isV2 && (
                <div className="form-actions" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                   <button 
                    type="button" 
                    className={instance.isIsolated ? "active" : ""}
                    style={{ flex: 1, padding: '8px', fontSize: '10px' }}
                    onClick={() => usePlannerStore.getState().setInstanceIsolated(instance.isIsolated ? null : selectedId)}
                   >
                    Isolar
                   </button>
                   <button 
                    type="button" 
                    className={instance.isXRay ? "active" : ""}
                    style={{ flex: 1, padding: '8px', fontSize: '10px' }}
                    onClick={() => usePlannerStore.getState().toggleInstanceXRay(selectedId)}
                   >
                    Raio-X
                   </button>
                   <button 
                    type="button" 
                    style={{ flex: 1, padding: '8px', fontSize: '10px' }}
                    onClick={() => usePlannerStore.getState().duplicateFurnitureInstance(selectedId)}
                   >
                    Duplicar
                   </button>
                </div>
              )}

              <label>
                Largura ({isV2 ? 'mm' : 'm'})
                <input
                  type="number"
                  step={isV2 ? 10 : 0.05}
                  value={isV2 ? instance.dimensionsMm.width : (selected?.size[0] ?? 0)}
                  onChange={(event: any) => {
                    const val = Number(event.target.value);
                    if (isV2) {
                      updateInstance(selectedId, { dimensionsMm: { ...instance.dimensionsMm, width: val } });
                    } else if (selected) {
                      updateSelected({ size: [val, selected.size[1], selected.size[2]] });
                    }
                  }}
                />
              </label>
              <label>
                Altura ({isV2 ? 'mm' : 'm'})
                <input
                  type="number"
                  step={isV2 ? 10 : 0.05}
                  value={isV2 ? instance.dimensionsMm.height : (selected?.size[1] ?? 0)}
                  onChange={(event: any) => {
                    const val = Number(event.target.value);
                    if (isV2) {
                      updateInstance(selectedId, { dimensionsMm: { ...instance.dimensionsMm, height: val } });
                    } else if (selected) {
                      updateSelected({ size: [selected.size[0], val, selected.size[2]] });
                    }
                  }}
                />
              </label>
              <label>
                Profundidade ({isV2 ? 'mm' : 'm'})
                <input
                  type="number"
                  step={isV2 ? 10 : 0.05}
                  value={isV2 ? instance.dimensionsMm.depth : (selected?.size[2] ?? 0)}
                  onChange={(event: any) => {
                    const val = Number(event.target.value);
                    if (isV2) {
                      updateInstance(selectedId, { dimensionsMm: { ...instance.dimensionsMm, depth: val } });
                    } else if (selected) {
                      updateSelected({ size: [selected.size[0], selected.size[1], val] });
                    }
                  }}
                />
              </label>
              <label>
                Posição X ({isV2 ? 'mm' : 'm'})
                <input
                  type="number"
                  step={isV2 ? 50 : 0.05}
                  value={isV2 ? instance.positionMm.x : (selected?.position[0] ?? 0)}
                  onChange={(event: any) => {
                    const val = Number(event.target.value);
                    if (isV2) {
                      updateInstance(selectedId, { positionMm: { ...instance.positionMm, x: val } });
                    } else {
                      updateSelected({ position: [val, selected.position[1], selected.position[2]] });
                    }
                  }}
                />
              </label>

              <label>
                Largura (m)
                <input
                  type="number"
                  step="0.05"
                  value={selected?.size[0] ?? 0}
                  onChange={(event: any) =>
                    selected &&
                    updateSelected({
                      size: [
                        Number((event.target as HTMLInputElement).value),
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
                  onChange={(event: any) =>
                    selected &&
                    updateSelected({
                      size: [
                        selected.size[0],
                        Number((event.target as HTMLInputElement).value),
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
                  onChange={(event: any) =>
                    selected &&
                    updateSelected({
                      size: [
                        selected.size[0],
                        selected.size[1],
                        Number((event.target as HTMLInputElement).value)
                      ]
                    })
                  }
                />
              </label>
              <label>
                Rotação
                <input
                  type="number"
                  step={1}
                  value={isV2 ? instance.rotationDeg.y : (selected?.rotationY ?? 0)}
                  onChange={(event: any) => {
                    const val = Number(event.target.value);
                    if (isV2) {
                      updateInstance(selectedId, { rotationDeg: { ...instance.rotationDeg, y: val } });
                    } else {
                      updateSelected({ rotationY: val });
                    }
                  }}
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
                  onClick={() => {
                    if (isV2) {
                      updateInstance(selectedId, { materialOverrides: { '*': id } });
                    } else {
                      updateSelected({ material: id });
                    }
                  }}

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
      )}
    </aside>
  );
}
