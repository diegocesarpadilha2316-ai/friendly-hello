import { useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { HardwareRegistry } from "../../library/registry/HardwareRegistry";
import { buildAssemblyReport } from "../../library/services/assemblyReport";
import {
  buildFabricationReport,
  fabricationReportToCsv,
} from "../../library/services/fabricationReport";
import { buildJoineryReport } from "../../library/services/joineryReport";
import { buildNestingPlanFromPartDefinitions } from "../../library/services/nestingPlan";
import { MaterialRegistry } from "../../library/registry/MaterialRegistry";
import type { FurnitureInstance } from "../../library/contracts/FurnitureInstance";
import { usePlannerStore } from "../state/usePlannerStore";
import type { RightTab } from "../types";

const tabs: { id: RightTab; label: string }[] = [
  { id: "chat", label: "IA" },
  { id: "inspector", label: "Inspetor" },
  { id: "materials", label: "Materiais" },
  { id: "hardware", label: "Ferragens" },
  { id: "fabrication", label: "Fabricação" },
];

const materials = [
  ["Branco", "mdf-white", "#e8e5df"],
  ["Freijó", "mdf-wood-natural", "#7a4f2c"],
  ["Verde", "mdf-green", "#4f6f52"],
  ["Grafite", "mdf-graphite", "#4a4745"],
  ["Taupe", "mdf-taupe", "#8b7564"],
] as const;

const materialSlots = [
  ["Corpo", "body"],
  ["Frente", "front"],
  ["Fundo", "back"],
  ["Bancada", "countertop"],
] as const;

const hardwareOptions = [
  ["Puxador", "handle", "handle-bar", "handle"],
  ["Corrediças", "slide", "slide-hidden-soft-close", "slide"],
  ["Dobradiças", "hinge", "hinge-soft-close", "hinge"],
] as const;

export function RightPanel() {
  const collapsed = usePlannerStore((s) => s.rightCollapsed);
  const toggleRight = usePlannerStore((s) => s.toggleRight);
  const rightTab = usePlannerStore((s) => s.rightTab);
  const toolMode = usePlannerStore((s) => s.toolMode);
  const setToolMode = usePlannerStore((s) => s.setToolMode);
  const setRightTab = usePlannerStore((s) => s.setRightTab);
  const messages = usePlannerStore((s) => s.messages);
  const sendMessage = usePlannerStore((s) => s.sendMessage);
  const furniture = usePlannerStore((s) => s.furniture);
  const instances = usePlannerStore((s) => s.instances);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const updateSelected = usePlannerStore((s) => s.updateSelected);
  const updateInstance = usePlannerStore((s) => s.updateFurnitureInstance);
  const deleteInstance = usePlannerStore((s) => s.removeFurnitureInstance);
  const duplicateInstance = usePlannerStore((s) => s.duplicateFurnitureInstance);
  const toggleAnimation = usePlannerStore((s) => s.toggleInstanceAnimation);
  const closeAll = usePlannerStore((s) => s.closeAllAnimations);
  const isolate = usePlannerStore((s) => s.setInstanceIsolated);
  const toggleXRay = usePlannerStore((s) => s.toggleInstanceXRay);
  const showAll = usePlannerStore((s) => s.showAllInstances);
  const lockInstance = usePlannerStore((s) => s.lockFurnitureInstance);
  const unlockInstance = usePlannerStore((s) => s.unlockFurnitureInstance);
  const snapEnabled = usePlannerStore((s) => s.snapEnabled);
  const setSnapEnabled = usePlannerStore((s) => s.setSnapEnabled);
  const snapInstance = usePlannerStore((s) => s.snapFurnitureInstance);
  const lastSnapMessage = usePlannerStore((s) => s.lastSnapMessage);
  const [draft, setDraft] = useState("");
  const [materialSlot, setMaterialSlot] = useState<
    keyof FurnitureInstance["materialOverrides"] | "body"
  >("body");
  const fabricationReport = buildFabricationReport(instances);
  const assemblyReport = buildAssemblyReport(instances);
  const joineryReport = buildJoineryReport(instances);
  const nestingPlan = buildNestingPlanFromPartDefinitions(instances.flatMap((item) => item.parts));
  const downloadCutList = () => {
    const blob = new Blob([fabricationReportToCsv(fabricationReport)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dioris-lista-de-corte.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selected = furniture.find((item) => item.id === selectedId);
  const instance = instances.find((item) => item.id === selectedId);
  const activeInstance = instance;
  const isV2 = Boolean(activeInstance);
  const availableMaterials = activeInstance
    ? MaterialRegistry.list().filter((item) => {
        const category = item.category;
        if (materialSlot === "countertop") return ["stone", "metal"].includes(category);
        if (materialSlot === "front") return ["mdf", "glass", "mirror"].includes(category);
        return category === "mdf";
      })
    : materials.map(([label, id, color]) => ({
        name: label,
        id,
        baseColor: color,
        category: "mdf" as const,
      }));

  const setDimension = (axis: "width" | "height" | "depth", value: number) => {
    if (!activeInstance) return;
    updateInstance(activeInstance.id, {
      dimensionsMm: { ...activeInstance.dimensionsMm, [axis]: value },
    });
  };

  const setPosition = (axis: "x" | "y" | "z", value: number) => {
    if (!activeInstance) return;
    updateInstance(activeInstance.id, {
      positionMm: { ...activeInstance.positionMm, [axis]: value },
    });
  };

  return (
    <aside className={`right-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-head">
        {!collapsed && <strong>IA Copiloto / Inspetor</strong>}
        <button
          type="button"
          onClick={toggleRight}
          aria-label={collapsed ? "Expandir painel direito" : "Recolher painel direito"}
          title={collapsed ? "Expandir painel direito" : "Recolher painel direito"}
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {collapsed ? (
        <div className="collapsed-icons">
          <Bot size={19} />
        </div>
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
                  <button type="button" onClick={closeAll}>
                    Fechar Tudo
                  </button>
                  <button type="button" onClick={showAll}>
                    Mostrar Tudo
                  </button>
                  <button type="button" onClick={() => sendMessage("Trocar material")}>
                    Trocar material
                  </button>
                  <button type="button" onClick={() => sendMessage("Ver orçamento")}>
                    Ver orçamento
                  </button>
                </div>
                <div className="composer">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && draft.trim()) {
                        sendMessage(draft.trim());
                        setDraft("");
                      }
                    }}
                    placeholder="Peça algo ao IA Copiloto..."
                  />
                  <button
                    type="button"
                    aria-label="Enviar mensagem"
                    title="Enviar mensagem"
                    onClick={() => {
                      if (!draft.trim()) return;
                      sendMessage(draft.trim());
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
                  <input value={instance?.name ?? selected?.name ?? "Nenhum"} readOnly />
                </label>

                {activeInstance ? (
                  <>
                    <div className="form-actions">
                      <button type="button" onClick={() => toggleAnimation(activeInstance.id)}>
                        {activeInstance.isOpen ? "Fechar Tudo" : "Abrir Tudo"}
                      </button>
                      <button type="button" onClick={() => deleteInstance(activeInstance.id)}>
                        Excluir
                      </button>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() =>
                          isolate(activeInstance.isIsolated ? null : activeInstance.id)
                        }
                      >
                        {activeInstance.isIsolated ? "Sair do Isolar" : "Isolar"}
                      </button>
                      <button type="button" onClick={() => toggleXRay(activeInstance.id)}>
                        {activeInstance.isXRay ? "Sair do Raio-X" : "Raio-X"}
                      </button>
                      <button type="button" onClick={() => duplicateInstance(activeInstance.id)}>
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          activeInstance.locked
                            ? unlockInstance(activeInstance.id)
                            : lockInstance(activeInstance.id)
                        }
                      >
                        {activeInstance.locked ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                    <div
                      className="transform-modes"
                      role="toolbar"
                      aria-label="Modos de transformação"
                    >
                      {(
                        [
                          ["move", "Mover"],
                          ["rotate", "Rotacionar"],
                          ["dimensions", "Medidas"],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          className={toolMode === mode ? "active" : ""}
                          onClick={() => setToolMode(mode)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {toolMode === "move" && (
                      <div className="form-actions transform-controls">
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              positionMm: {
                                ...activeInstance.positionMm,
                                x: activeInstance.positionMm.x - 50,
                              },
                            })
                          }
                        >
                          X −
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              positionMm: {
                                ...activeInstance.positionMm,
                                x: activeInstance.positionMm.x + 50,
                              },
                            })
                          }
                        >
                          X +
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              positionMm: {
                                ...activeInstance.positionMm,
                                z: activeInstance.positionMm.z - 50,
                              },
                            })
                          }
                        >
                          Z −
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              positionMm: {
                                ...activeInstance.positionMm,
                                z: activeInstance.positionMm.z + 50,
                              },
                            })
                          }
                        >
                          Z +
                        </button>
                      </div>
                    )}
                    {toolMode === "rotate" && (
                      <div className="form-actions transform-controls">
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              rotationDeg: {
                                ...activeInstance.rotationDeg,
                                y: activeInstance.rotationDeg.y - 15,
                              },
                            })
                          }
                        >
                          −15°
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInstance(activeInstance.id, {
                              rotationDeg: {
                                ...activeInstance.rotationDeg,
                                y: activeInstance.rotationDeg.y + 15,
                              },
                            })
                          }
                        >
                          +15°
                        </button>
                      </div>
                    )}
                    <div className="form-actions">
                      <button type="button" onClick={() => snapInstance(activeInstance.id)}>
                        Aplicar Snap
                      </button>
                      <button type="button" onClick={() => setSnapEnabled(!snapEnabled)}>
                        {snapEnabled ? "Snap ligado" : "Snap desligado"}
                      </button>
                    </div>
                    {lastSnapMessage && <small className="panel-note">{lastSnapMessage}</small>}
                    {(["width", "height", "depth"] as const).map((axis) => (
                      <label key={axis}>
                        {axis === "width"
                          ? "Largura"
                          : axis === "height"
                            ? "Altura"
                            : "Profundidade"}{" "}
                        (mm)
                        <input
                          type="number"
                          step={10}
                          value={activeInstance.dimensionsMm[axis]}
                          onChange={(event) => setDimension(axis, Number(event.target.value))}
                        />
                      </label>
                    ))}
                    {(["x", "y", "z"] as const).map((axis) => (
                      <label key={axis}>
                        Posição {axis.toUpperCase()} (mm)
                        <input
                          type="number"
                          step={50}
                          value={activeInstance.positionMm[axis]}
                          onChange={(event) => setPosition(axis, Number(event.target.value))}
                        />
                      </label>
                    ))}
                    <label>
                      Rotação Y (graus)
                      <input
                        type="number"
                        step={1}
                        value={activeInstance.rotationDeg.y}
                        onChange={(event) =>
                          updateInstance(activeInstance.id, {
                            rotationDeg: {
                              ...activeInstance.rotationDeg,
                              y: Number(event.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Largura (m)
                      <input
                        type="number"
                        step={0.05}
                        value={selected?.size[0] ?? 0}
                        onChange={(event) =>
                          selected &&
                          updateSelected({
                            size: [Number(event.target.value), selected.size[1], selected.size[2]],
                          })
                        }
                      />
                    </label>
                    <label>
                      Altura (m)
                      <input
                        type="number"
                        step={0.05}
                        value={selected?.size[1] ?? 0}
                        onChange={(event) =>
                          selected &&
                          updateSelected({
                            size: [selected.size[0], Number(event.target.value), selected.size[2]],
                          })
                        }
                      />
                    </label>
                    <label>
                      Profundidade (m)
                      <input
                        type="number"
                        step={0.05}
                        value={selected?.size[2] ?? 0}
                        onChange={(event) =>
                          selected &&
                          updateSelected({
                            size: [selected.size[0], selected.size[1], Number(event.target.value)],
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {rightTab === "materials" && (
              <div className="swatches">
                {activeInstance && (
                  <label className="material-slot">
                    Aplicar em
                    <select
                      value={materialSlot}
                      onChange={(event) =>
                        setMaterialSlot(event.target.value as typeof materialSlot)
                      }
                    >
                      {materialSlots.map(([label, slot]) => (
                        <option key={slot} value={slot}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {availableMaterials.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`swatch ${activeInstance?.materialOverrides[materialSlot] === item.id ? "active" : ""}`}
                    style={{ background: item.baseColor }}
                    onClick={() => {
                      if (activeInstance)
                        updateInstance(activeInstance.id, {
                          materialOverrides: {
                            ...activeInstance.materialOverrides,
                            [materialSlot]: item.id,
                          },
                        });
                      else if (selected) updateSelected({ material: item.id });
                    }}
                  >
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {rightTab === "hardware" && (
              <div className="form">
                {hardwareOptions.map(([label, role, fallback, category]) => (
                  <label key={role}>
                    {label}
                    <select
                      value={activeInstance?.hardwareOverrides[role] ?? fallback}
                      onChange={(event) =>
                        activeInstance &&
                        updateInstance(activeInstance.id, {
                          hardwareOverrides: {
                            ...activeInstance.hardwareOverrides,
                            [role]: event.target.value,
                          },
                        })
                      }
                    >
                      <option value={fallback}>{label} padrão</option>
                      {HardwareRegistry.listByCategory(
                        category as "handle" | "slide" | "hinge",
                      ).map((hardware) => (
                        <option key={hardware.id} value={hardware.id}>
                          {hardware.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            )}

            {rightTab === "fabrication" && (
              <div className="form fabrication-panel">
                <div className="form-actions">
                  <strong>{fabricationReport.moduleCount} módulos</strong>
                  <span>
                    {fabricationReport.cutItems.reduce((sum, item) => sum + item.quantity, 0)} peças
                    físicas
                  </span>
                  <button type="button" onClick={downloadCutList}>
                    Baixar CSV
                  </button>
                </div>
                {fabricationReport.warnings.length > 0 && (
                  <div className="panel-note">Avisos: {fabricationReport.warnings.join(" ")}</div>
                )}
                <h4>Lista de corte</h4>
                <div className="fabrication-list">
                  {fabricationReport.cutItems.map((item) => (
                    <div key={item.key} className="fabrication-row">
                      <strong>
                        {item.quantity}× {item.names.join(" / ")}
                      </strong>
                      <small>
                        {item.widthMm} × {item.heightMm} × {item.depthMm} mm · {item.materialId}
                      </small>
                    </div>
                  ))}
                </div>
                <h4>Nesting MaxRects</h4>
                <div className="form-actions">
                  <span>{nestingPlan.statistics.boardsCount} chapas</span>
                  <span>
                    {Math.round(nestingPlan.statistics.avgUsageRatio * 100)}% aproveitamento
                  </span>
                </div>
                {nestingPlan.unplaced.length > 0 && (
                  <div className="panel-note">
                    Peças não colocadas: {nestingPlan.unplaced.length}
                  </div>
                )}
                <h4>Usinagem</h4>
                <div className="form-actions">
                  <span>{joineryReport.operations.length} operações</span>
                  <span>{joineryReport.warnings.length} avisos</span>
                </div>
                <h4>Ferragens</h4>
                {fabricationReport.hardwareItems.map((item) => (
                  <div key={item.hardwareId} className="fabrication-row">
                    <strong>
                      {item.quantity}× {item.hardwareId}
                    </strong>
                    <small>{item.moduleIds.join(", ")}</small>
                  </div>
                ))}
                <h4>Montagem</h4>
                <div className="fabrication-list">
                  {assemblyReport.steps.map((step) => (
                    <div key={step.id} className="fabrication-row">
                      <strong>
                        {step.order}. {step.title}
                      </strong>
                      <small>{step.instruction}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
