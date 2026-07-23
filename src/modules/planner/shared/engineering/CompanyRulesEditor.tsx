/**
 * Editor de Regras de Fabricação da Empresa (Fase 3.5).
 * Escreve no `localStorage` via `saveRules` — sem provider novo. Ao
 * salvar, o Inspector já recalcula (a leitura acontece por `useMemo`
 * dependente de `tenantId`, portanto ao trocar de rota/refresh reflete).
 */
import { useMemo, useState } from "react";
import { Save, RotateCcw, Building2 } from "lucide-react";
import { Button } from "@/core/components/ui-kit";
import { useTenant } from "@/core/providers/TenantProvider";
import { MATERIAL_BRANDS, findBrand } from "./materials";
import { listHardware } from "./hardware";
import {
  ASSEMBLY_OPTIONS,
  BACK_OPTIONS,
  BASE_OPTIONS,
  DOOR_OPTIONS,
  DRAWER_OPTIONS,
  EDGE_OPTIONS,
  GRAIN_OPTIONS,
  HANDLE_OPTIONS,
} from "./standards";
import { defaultRules, loadRules, resetRules, saveRules } from "./company-rules";
import type { CompanyManufacturingRules, HardwareKind } from "./types";

export function CompanyRulesEditor() {
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const [rules, setRules] = useState<CompanyManufacturingRules>(() => loadRules(tenantId));
  const [savedAt, setSavedAt] = useState<string | null>(rules.updatedAt);
  const brand = useMemo(() => findBrand(rules.defaults.brandId), [rules.defaults.brandId]);
  const thicknesses = brand?.thicknesses.map((t) => t.mm) ?? [15, 18, 25];
  const finishes = brand?.finishes ?? [];

  function setDefaults<K extends keyof CompanyManufacturingRules["defaults"]>(
    key: K,
    value: CompanyManufacturingRules["defaults"][K],
  ) {
    setRules((r) => ({ ...r, defaults: { ...r.defaults, [key]: value } }));
  }
  function setHardware(kind: HardwareKind, id: string) {
    setRules((r) => ({
      ...r,
      defaults: { ...r.defaults, hardware: { ...r.defaults.hardware, [kind]: id } },
    }));
  }

  function save() {
    saveRules(rules);
    setSavedAt(new Date().toISOString());
  }
  function reset() {
    const d = resetRules(tenantId);
    setRules(d);
    setSavedAt(d.updatedAt);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Identificação" icon={Building2}>
        <Row label="Nome do padrão">
          <input
            value={rules.label}
            onChange={(e) => setRules((r) => ({ ...r, label: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
        </Row>
        <Row label="Empresa">
          <span className="text-sm text-muted-foreground">{activeCompany?.name ?? "—"}</span>
        </Row>
        <Row label="Última alteração">
          <span className="text-xs text-muted-foreground">
            {savedAt ? new Date(savedAt).toLocaleString() : "—"}
          </span>
        </Row>
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={save}>
            <Save className="mr-1 h-4 w-4" /> Salvar padrão
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Restaurar padrão Dioris
          </Button>
        </div>
      </Panel>

      <Panel title="Chapa & Acabamento">
        <SelectRow
          label="Marca preferencial"
          value={rules.defaults.brandId}
          onChange={(v) => setDefaults("brandId", v)}
          options={MATERIAL_BRANDS.map((b) => ({ value: b.id, label: `${b.label} (${b.category})` }))}
        />
        <SelectRow
          label="Acabamento default"
          value={rules.defaults.finishId}
          onChange={(v) => setDefaults("finishId", v)}
          options={finishes.map((f) => ({ value: f.id, label: f.label }))}
        />
        <SelectRow
          label="Espessura corpo"
          value={String(rules.defaults.thicknessMm)}
          onChange={(v) => setDefaults("thicknessMm", Number(v))}
          options={thicknesses.map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
        />
        <SelectRow
          label="Espessura fundo"
          value={String(rules.defaults.backThicknessMm)}
          onChange={(v) => setDefaults("backThicknessMm", Number(v))}
          options={[3, 6, 9, 15, 18].map((mm) => ({ value: String(mm), label: `${mm} mm` }))}
        />
        <SelectRow
          label="Fita de borda"
          value={rules.defaults.edge}
          onChange={(v) => setDefaults("edge", v as CompanyManufacturingRules["defaults"]["edge"])}
          options={EDGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Sentido do veio"
          value={rules.defaults.grain}
          onChange={(v) => setDefaults("grain", v as CompanyManufacturingRules["defaults"]["grain"])}
          options={GRAIN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </Panel>

      <Panel title="Fabricação">
        <SelectRow
          label="Fundo"
          value={rules.defaults.back}
          onChange={(v) => setDefaults("back", v as CompanyManufacturingRules["defaults"]["back"])}
          options={BACK_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Base"
          value={rules.defaults.base}
          onChange={(v) => setDefaults("base", v as CompanyManufacturingRules["defaults"]["base"])}
          options={BASE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Montagem"
          value={rules.defaults.assembly}
          onChange={(v) => setDefaults("assembly", v as CompanyManufacturingRules["defaults"]["assembly"])}
          options={ASSEMBLY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Porta"
          value={rules.defaults.door}
          onChange={(v) => setDefaults("door", v as CompanyManufacturingRules["defaults"]["door"])}
          options={DOOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Gaveta"
          value={rules.defaults.drawer}
          onChange={(v) => setDefaults("drawer", v as CompanyManufacturingRules["defaults"]["drawer"])}
          options={DRAWER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <SelectRow
          label="Puxador"
          value={rules.defaults.handle}
          onChange={(v) => setDefaults("handle", v as CompanyManufacturingRules["defaults"]["handle"])}
          options={HANDLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </Panel>

      <Panel title="Ferragens preferenciais">
        {(["dobradica", "corredica", "pistao", "trilho", "cabideiro", "perfil", "puxador", "amortecedor"] as HardwareKind[]).map(
          (kind) => (
            <SelectRow
              key={kind}
              label={kind}
              value={rules.defaults.hardware[kind] ?? ""}
              onChange={(v) => setHardware(kind, v)}
              options={[
                { value: "", label: "— nenhum —" },
                ...listHardware(kind).map((h) => ({ value: h.id, label: `${h.brand} · ${h.label}` })),
              ]}
            />
          ),
        )}
      </Panel>

      {(() => {
        const d = defaultRules(tenantId).defaults;
        void d;
        return null;
      })()}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex-1 text-right">{children}</span>
    </label>
  );
}
function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="capitalize text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[60%] flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}