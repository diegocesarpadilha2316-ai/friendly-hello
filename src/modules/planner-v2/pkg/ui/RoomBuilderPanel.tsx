import { DoorOpen, ImagePlus, RotateCcw, Trash2, Upload, PanelsTopLeft } from "lucide-react";
import { ChangeEvent } from "react";
import { OpeningSpec, WallSide, useRoomBuilderStore } from "../state/useRoomBuilderStore";
import { usePlannerStore } from "../state/usePlannerStore";

const wallNames: Record<WallSide, string> = {
  back: "Parede do fundo",
  left: "Parede esquerda",
  right: "Parede direita",
};

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.05,
}: {
  label: string;
  value: number; // mm
  onChange: (value: number) => void;
  min: number; // m
  max: number; // m
  step?: number;
}) {
  return (
    <label className="builder-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          value={value / 1000}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value) * 1000)}
        />
        <small>m</small>
      </div>
    </label>
  );
}

function OpeningEditor({ opening }: { opening: OpeningSpec }) {
  const updateOpening = useRoomBuilderStore((s) => s.updateOpening);
  const removeOpening = useRoomBuilderStore((s) => s.removeOpening);

  return (
    <div className="opening-card">
      <div className="opening-title">
        <strong>
          {opening.type === "door" ? "Porta" : "Janela"} — {wallNames[opening.wall]}
        </strong>
        <button type="button" onClick={() => removeOpening(opening.id)}>
          <Trash2 size={14} />
        </button>
      </div>

      <NumberField
        label="Posição lateral"
        value={opening.offset}
        min={-4}
        max={4}
        onChange={(offset) => updateOpening(opening.id, { offset })}
      />
      <NumberField
        label="Largura"
        value={opening.width}
        min={0.45}
        max={3}
        onChange={(width) => updateOpening(opening.id, { width })}
      />
      <NumberField
        label="Altura"
        value={opening.height}
        min={0.45}
        max={2.6}
        onChange={(height) => updateOpening(opening.id, { height })}
      />

      {opening.type === "window" && (
        <NumberField
          label="Altura do peitoril"
          value={opening.sill}
          min={0.3}
          max={1.8}
          onChange={(sill) => updateOpening(opening.id, { sill })}
        />
      )}
    </div>
  );
}

export function RoomBuilderPanel() {
  const width = useRoomBuilderStore((s) => s.width);
  const depth = useRoomBuilderStore((s) => s.depth);
  const height = useRoomBuilderStore((s) => s.height);
  const openings = useRoomBuilderStore((s) => s.openings);
  const setDimension = useRoomBuilderStore((s) => s.setDimension);
  const addOpening = useRoomBuilderStore((s) => s.addOpening);
  const resetRoom = useRoomBuilderStore((s) => s.resetRoom);
  const validateFurnitureInstances = usePlannerStore((s) => s.validateFurnitureInstances);

  const setRoomDimension = (key: "width" | "depth" | "height", value: number) => {
    setDimension(key, value);
    validateFurnitureInstances();
  };

  return (
    <div className="builder-panel">
      <div className="builder-section-title">
        <PanelsTopLeft size={16} />
        <div>
          <strong>Construir ambiente</strong>
          <small>Edite as medidas da casa em tempo real.</small>
        </div>
      </div>

      <NumberField
        label="Largura interna"
        value={width}
        min={1.8}
        max={12}
        onChange={(value) => setRoomDimension("width", value)}
      />
      <NumberField
        label="Profundidade interna"
        value={depth}
        min={1.8}
        max={12}
        onChange={(value) => setRoomDimension("depth", value)}
      />
      <NumberField
        label="Pé-direito"
        value={height}
        min={2.2}
        max={4}
        onChange={(value) => setRoomDimension("height", value)}
      />

      <div className="builder-actions-title">
        <PanelsTopLeft size={15} />
        <span>Adicionar abertura</span>
      </div>

      <div className="opening-buttons">
        {(["back", "left", "right"] as WallSide[]).map((wall) => (
          <div key={wall}>
            <small>{wallNames[wall]}</small>
            <button type="button" onClick={() => addOpening("door", wall)}>
              <DoorOpen size={14} /> Porta
            </button>
            <button type="button" onClick={() => addOpening("window", wall)}>
              <PanelsTopLeft size={14} /> Janela
            </button>
          </div>
        ))}
      </div>

      <div className="opening-list">
        {openings.map((opening) => (
          <OpeningEditor key={opening.id} opening={opening} />
        ))}
      </div>

      <button className="builder-reset" type="button" onClick={resetRoom}>
        <RotateCcw size={15} />
        Restaurar ambiente padrão
      </button>
    </div>
  );
}

export function ImageReferencePanel() {
  const referenceImage = useRoomBuilderStore((s) => s.referenceImage);
  const referenceName = useRoomBuilderStore((s) => s.referenceName);
  const setReferenceImage = useRoomBuilderStore((s) => s.setReferenceImage);
  const applyReferencePreset = useRoomBuilderStore((s) => s.applyReferencePreset);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(String(reader.result), file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="builder-panel">
      <div className="builder-section-title">
        <ImagePlus size={16} />
        <div>
          <strong>Imagem de referência</strong>
          <small>Envie uma foto do ambiente ou do móvel desejado.</small>
        </div>
      </div>

      <label className="reference-upload">
        <Upload size={20} />
        <strong>Escolher uma imagem</strong>
        <small>JPG, PNG ou WEBP</small>
        <input type="file" accept="image/*" onChange={handleImage} />
      </label>

      {referenceImage && (
        <>
          <div className="reference-preview">
            <img src={referenceImage} alt="Referência enviada" />
          </div>
          <p className="reference-name">{referenceName}</p>
          <button type="button" className="apply-reference" onClick={applyReferencePreset}>
            Criar prévia inspirada na imagem
          </button>
          <button
            type="button"
            className="remove-reference"
            onClick={() => setReferenceImage(null, null)}
          >
            Remover imagem
          </button>
        </>
      )}

      <div className="vision-note">
        <strong>Como funcionará no Dioris real</strong>
        <p>
          A imagem será enviada ao modelo de visão. Ele deverá identificar cômodo, paredes, portas,
          janelas, cores, materiais, eletrodomésticos e disposição aproximada, gerar um plano
          editável e pedir confirmação antes de criar.
        </p>
        <p>
          Nesta prévia local, o botão aplica um preset demonstrativo. A análise por IA deverá ser
          conectada pela Lovable ao endpoint de visão do projeto.
        </p>
      </div>
    </div>
  );
}
