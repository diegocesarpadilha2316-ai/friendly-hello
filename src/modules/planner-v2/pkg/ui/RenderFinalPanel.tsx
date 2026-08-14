import { useState } from "react";

type RenderView = "front" | "three-quarter-left" | "three-quarter-right" | "island" | "detail" | "overview" | "top" | "lateral";
type RenderQuality = "quick" | "quality" | "maximum";

const views: Array<{ id: RenderView; label: string }> = [
  { id: "front", label: "Frontal" },
  { id: "three-quarter-left", label: "3/4 esquerda" },
  { id: "three-quarter-right", label: "3/4 direita" },
  { id: "island", label: "Ilha" },
  { id: "detail", label: "Close-up material" },
  { id: "overview", label: "Geral" },
  { id: "top", label: "Topo técnico" },
  { id: "lateral", label: "Lateral técnica" },
];

export function RenderFinalPanel({ onClose }: { onClose: () => void }) {
  const [quality, setQuality] = useState<RenderQuality>("quality");
  const [status, setStatus] = useState("Pronto para renderizar a cozinha atual.");
  const [busy, setBusy] = useState(false);
  const resolution = quality === "quick" ? { width: 1280, height: 720 } : quality === "maximum" ? { width: 2560, height: 1440 } : { width: 1920, height: 1080 };

  const render = (view: RenderView) => {
    setBusy(true);
    setStatus(`Renderizando ${view} em ${resolution.width}×${resolution.height}...`);
    window.dispatchEvent(new CustomEvent("dioris:render-image", { detail: { view, quality, ...resolution } }));
    window.setTimeout(() => { setBusy(false); setStatus(`Solicitação ${view} enviada ao pipeline PNG real.`); }, 600);
  };

  const renderAll = () => views.forEach((view, index) => window.setTimeout(() => render(view.id), index * 900));
  const video = (preset: "quick" | "professional" | "client") => {
    setBusy(true);
    setStatus(`Tour ${preset} iniciado; o arquivo será WebM real quando suportado.`);
    window.dispatchEvent(new CustomEvent("dioris:render-video", { detail: { preset } }));
    window.setTimeout(() => setBusy(false), 800);
  };

  return (
    <aside className="render-final-panel" role="dialog" aria-label="Render Final">
      <div className="render-final-header"><div><strong>Render Final</strong><span>Pipeline separado do viewport de edição</span></div><button type="button" className="render-close" onClick={onClose} aria-label="Fechar Render Final">×</button></div>
      <p className="render-final-copy">A captura usa a cena real sem alterar FurnitureInstance, seleção, abertura ou persistência.</p>
      <label className="render-quality-label" htmlFor="render-quality">Qualidade de exportação</label>
      <select id="render-quality" value={quality} onChange={(event) => setQuality(event.target.value as RenderQuality)}>
        <option value="quick">Render rápido — 1280×720</option>
        <option value="quality">Render qualidade — 1920×1080</option>
        <option value="maximum">Render máxima — 2560×1440</option>
      </select>
      <div className="render-view-grid">{views.map((view) => <button type="button" key={view.id} onClick={() => render(view.id)} disabled={busy}>{view.label}</button>)}</div>
      <button type="button" className="render-all-button" onClick={renderAll} disabled={busy}>Gerar as vistas V10 de evidência</button>
      <div className="render-video-section"><strong>Vídeo de apresentação</strong><div className="render-video-grid"><button type="button" onClick={() => video("quick")} disabled={busy}>Tour rápido</button><button type="button" onClick={() => video("professional")} disabled={busy}>Tour profissional</button><button type="button" onClick={() => video("client")} disabled={busy}>Apresentação cliente</button></div></div>
      <div className={`render-status ${busy ? "is-busy" : ""}`} role="status" aria-live="polite">{status}</div>
      <small className="render-format-note">PNG fiel ao projeto paramétrico. Vídeo WebM via MediaRecorder quando suportado pelo navegador.</small>
    </aside>
  );
}
