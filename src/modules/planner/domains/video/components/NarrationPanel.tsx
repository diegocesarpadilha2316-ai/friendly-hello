import { MUSIC_MOODS, VOICE_PROVIDERS } from "../services/narration";
import type { VideoNarration } from "../types";

export interface NarrationPanelProps {
  readonly narration: VideoNarration;
  readonly onChange: (patch: Partial<VideoNarration>) => void;
}

export function NarrationPanel({ narration, onChange }: NarrationPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-2 text-[11px]">
      <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5">
        <span>Ativar narração</span>
        <input
          type="checkbox"
          checked={narration.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Idioma</span>
        <select
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1"
          value={narration.language}
          onChange={(e) => onChange({ language: e.target.value as VideoNarration["language"] })}
        >
          <option value="pt-BR">Português (BR)</option>
          <option value="en-US">Inglês (US)</option>
          <option value="es-ES">Espanhol (ES)</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Provider de voz</span>
        <select
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1"
          value={narration.voiceProvider ?? ""}
          onChange={(e) =>
            onChange({ voiceProvider: (e.target.value || undefined) as VideoNarration["voiceProvider"] })
          }
        >
          <option value="">(nenhum)</option>
          {VOICE_PROVIDERS.map((v) => (
            <option key={v.id} value={v.id} disabled={!v.available}>
              {v.label} {v.available ? "" : "(em breve)"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Texto</span>
        <textarea
          rows={3}
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px]"
          placeholder="Digite o roteiro / narração..."
          value={narration.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </label>

      <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5">
        <span>Legenda</span>
        <input
          type="checkbox"
          checked={narration.subtitle.enabled}
          onChange={(e) =>
            onChange({ subtitle: { ...narration.subtitle, enabled: e.target.checked } })
          }
        />
      </label>

      <label className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/10 px-2.5 py-1.5">
        <span>Trilha musical</span>
        <input
          type="checkbox"
          checked={narration.music.enabled}
          onChange={(e) => onChange({ music: { ...narration.music, enabled: e.target.checked } })}
        />
      </label>

      {narration.music.enabled ? (
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Mood</span>
          <select
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1"
            value={narration.music.mood}
            onChange={(e) =>
              onChange({
                music: { ...narration.music, mood: e.target.value as VideoNarration["music"]["mood"] },
              })
            }
          >
            {MUSIC_MOODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
