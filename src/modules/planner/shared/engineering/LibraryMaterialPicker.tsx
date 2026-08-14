/**
 * Seletor de materiais da Biblioteca Dioris — usado pelo Inspector para
 * aplicar `materialId` ao móvel/peça selecionada. Toda mutação passa
 * por `updateProject()` do PlannerEditorProvider.
 */
import { useState } from "react";
import { Layers } from "lucide-react";
import { useLibraryMaterial, useLibrarySearch } from "../../domains/catalog/hooks/use-library";

interface Props {
  materialId?: string;
  onApply: (materialId: string | null) => void;
}

export function LibraryMaterialPicker({ materialId, onApply }: Props) {
  const current = useLibraryMaterial(materialId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { items, loading } = useLibrarySearch(open ? query : "");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 p-2">
        <div
          className="h-8 w-8 shrink-0 rounded border border-border/60"
          style={{
            background: current?.textureUrl
              ? `url(${current.textureUrl}) center/cover`
              : (current?.colorHex ?? "transparent"),
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">
            {current?.pattern ?? current?.colorName ?? materialId ?? "Nenhum material"}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {current
              ? [current.manufacturer, current.line, `${current.thicknessMm}mm`]
                  .filter(Boolean)
                  .join(" · ")
              : "Aplique um material oficial da Biblioteca Dioris"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
        >
          {open ? "Fechar" : "Trocar"}
        </button>
        {materialId ? (
          <button
            type="button"
            onClick={() => onApply(null)}
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] hover:bg-muted"
          >
            Remover
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-2">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por padrão, cor, fabricante…"
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-muted-foreground">Carregando…</div>
            ) : items.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-muted-foreground">
                Nenhum material encontrado.
              </div>
            ) : (
              <ul className="space-y-1">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onApply(m.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md border border-border/40 bg-muted/10 p-1.5 text-left hover:bg-muted/40"
                    >
                      <div
                        className="h-8 w-8 shrink-0 rounded border border-border/60"
                        style={{
                          background: m.textureUrl
                            ? `url(${m.textureUrl}) center/cover`
                            : (m.colorHex ?? "transparent"),
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs">{m.pattern ?? m.colorName ?? m.id}</div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {[m.manufacturer, m.line, `${m.thicknessMm}mm`]
                            .filter(Boolean)
                            .join(" · ")}
                          {m.pricePerM2 != null ? ` · R$ ${m.pricePerM2.toFixed(2)}/m²` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
