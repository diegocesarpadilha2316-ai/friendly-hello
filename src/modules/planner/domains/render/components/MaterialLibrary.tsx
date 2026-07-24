import { PBR_MATERIALS } from "../services/materials";

export function MaterialLibrary() {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
      {PBR_MATERIALS.map((m) => (
        <div
          key={m.id}
          className="group rounded-xl border border-border/60 bg-muted/10 p-2 transition hover:border-primary/40"
        >
          <div
            className="aspect-square w-full rounded-lg ring-1 ring-inset ring-border/60"
            style={{
              background: `radial-gradient(120% 120% at 20% 20%, ${m.baseColorHex}, color-mix(in oklab, ${m.baseColorHex} 60%, #000))`,
            }}
          />
          <div className="mt-2 text-[11px] font-medium leading-tight">{m.label}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.family}</div>
          <div className="mt-1 flex flex-wrap gap-0.5">
            {m.maps.map((mp) => (
              <span
                key={mp.slot}
                title={mp.slot}
                className="rounded-sm bg-background/60 px-1 py-0.5 text-[8px] uppercase tracking-widest text-muted-foreground ring-1 ring-inset ring-border/60"
              >
                {mp.slot.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}