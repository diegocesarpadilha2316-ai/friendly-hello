import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DataTable,
  EmptyState,
  MetricCard,
  PageContainer,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
} from "@/core/components/ui-kit";
import {
  useApiKeys,
  useBackupSettings,
  useBranding,
  useCompanySettings,
  useConfigurationExport,
  useCreateApiKey,
  useDeleteFlag,
  useFeatureFlags,
  useIntegrations,
  useLocalization,
  usePlatformSettings,
  useRevokeApiKey,
  useSecuritySettings,
  useTestIntegration,
  useUpdateCompanySettings,
  useUpsertBackup,
  useUpsertBranding,
  useUpsertFlag,
  useUpsertIntegration,
  useUpsertLocalization,
  useUpsertSecurity,
  type ApiKey,
  type FeatureFlag,
  type Integration,
} from "@/core/configuration";

type TabKey =
  | "empresa"
  | "plataforma"
  | "branding"
  | "integracoes"
  | "ia"
  | "seguranca"
  | "flags"
  | "storage"
  | "backups"
  | "regional"
  | "api-keys";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "empresa", label: "Empresa" },
  { key: "plataforma", label: "Plataforma" },
  { key: "branding", label: "Branding" },
  { key: "integracoes", label: "Integrações" },
  { key: "ia", label: "IA" },
  { key: "seguranca", label: "Segurança" },
  { key: "flags", label: "Feature Flags" },
  { key: "storage", label: "Storage" },
  { key: "backups", label: "Backups" },
  { key: "regional", label: "Regionalização" },
  { key: "api-keys", label: "API Keys" },
];

export const Route = createFileRoute("/_authenticated/configuracoes/")({
  head: () => ({
    meta: [
      { title: "Configurações Globais — Dioris Hub" },
      {
        name: "description",
        content:
          "Centro único de configurações da Dioris Hub — plataforma, branding, integrações, segurança, feature flags e backups multi-tenant.",
      },
      { property: "og:title", content: "Configurações Globais — Dioris Hub" },
      {
        property: "og:description",
        content:
          "Toda configuração da plataforma em um único Core, reutilizada por todos os módulos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfigurationPage,
});

function ConfigurationPage() {
  const [tab, setTab] = useState<TabKey>("empresa");
  const exportRun = useConfigurationExport();

  const download = async (format: "json" | "csv") => {
    const out = await exportRun.mutateAsync({ format });
    const blob = new Blob([out.content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dioris-configuration.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Core"
        title="Configurações Globais"
        description="Único centro de configurações da plataforma. Todos os módulos leem e gravam por aqui — sem stores paralelos."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => download("json")}
            >
              exportar JSON
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => download("csv")}
            >
              exportar flags CSV
            </button>
          </div>
        }
      />

      <nav className="mt-6 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm transition ${
              tab === t.key
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "empresa" && <CompanyTab />}
        {tab === "plataforma" && <PlatformTab />}
        {tab === "branding" && <BrandingTab />}
        {tab === "integracoes" && <IntegrationsTab category={undefined} />}
        {tab === "ia" && <IntegrationsTab category="ai" />}
        {tab === "seguranca" && <SecurityTab />}
        {tab === "flags" && <FlagsTab />}
        {tab === "storage" && <IntegrationsTab category="storage" />}
        {tab === "backups" && <BackupsTab />}
        {tab === "regional" && <LocalizationTab />}
        {tab === "api-keys" && <ApiKeysTab />}
      </div>
    </PageContainer>
  );
}

function CompanyTab() {
  const q = useCompanySettings();
  const save = useUpdateCompanySettings();
  const s = q.data;
  const [form, setForm] = useState<Record<string, string>>({});
  const get = (k: keyof NonNullable<typeof s>) =>
    form[k as string] ?? (s ? String(s[k] ?? "") : "");
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {[
        ["displayName", "Nome de exibição"],
        ["theme", "Tema (system|light|dark)"],
        ["locale", "Idioma"],
        ["timezone", "Fuso horário"],
        ["currency", "Moeda"],
        ["dateFormat", "Formato de data"],
        ["numberFormat", "Formato numérico"],
        ["units", "Unidades"],
      ].map(([k, label]) => (
        <label key={k} className="space-y-1 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <input
            className="w-full rounded-md border bg-background px-2 py-1.5"
            value={get(k as keyof NonNullable<typeof s>)}
            onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          />
        </label>
      ))}
      <div className="md:col-span-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          disabled={save.isPending}
          onClick={() => save.mutate({ ...(s ?? {}), ...form })}
        >
          {save.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </section>
  );
}

function PlatformTab() {
  const q = usePlatformSettings();
  if (!q.data) return <EmptyState title="Sem plataforma configurada" description="Aguardando registros globais." />;
  const p = q.data;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <MetricCard label="Nome" value={p.name} />
      <MetricCard label="Tema" value={p.theme} />
      <MetricCard label="Locale" value={p.defaultLocale} />
      <MetricCard label="Moeda" value={p.defaultCurrency} />
      <MetricCard label="Timezone" value={p.defaultTimezone} />
      <MetricCard label="Cor primária" value={p.primaryColor ?? "—"} />
    </div>
  );
}

function BrandingTab() {
  const q = useBranding();
  const save = useUpsertBranding();
  const [logo, setLogo] = useState("");
  const [icon, setIcon] = useState("");
  const b = q.data;
  return (
    <section className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Logo URL</span>
        <input
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={logo || (b?.logoUrl ?? "")}
          onChange={(e) => setLogo(e.target.value)}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Ícone URL</span>
        <input
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={icon || (b?.iconUrl ?? "")}
          onChange={(e) => setIcon(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={() =>
          save.mutate({
            logoUrl: logo || b?.logoUrl || null,
            iconUrl: icon || b?.iconUrl || null,
          })
        }
      >
        Salvar branding
      </button>
    </section>
  );
}

function IntegrationsTab({ category }: { category?: string }) {
  const q = useIntegrations();
  const upsert = useUpsertIntegration();
  const test = useTestIntegration();
  const [provider, setProvider] = useState("");
  const list = ((q.data ?? []) as readonly Integration[]).filter((i) =>
    category ? i.category === category : true,
  );
  const cols: DataTableColumn<Integration>[] = [
    { id: "provider", header: "Provedor", cell: (r) => r.provider },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    { id: "enabled", header: "Ativo", cell: (r) => <StatusBadge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "sim" : "não"}</StatusBadge> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge> },
    { id: "lastTested", header: "Último teste", cell: (r) => (r.lastTestedAt ? new Date(r.lastTestedAt).toLocaleString("pt-BR") : "—") },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => test.mutate(r.id)}>
            testar
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() =>
              upsert.mutate({ provider: r.provider, category: r.category, enabled: !r.enabled })
            }
          >
            {r.enabled ? "desativar" : "ativar"}
          </button>
        </div>
      ),
    },
  ];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Adicionar provedor</span>
          <input
            className="w-full rounded-md border bg-background px-2 py-1.5"
            placeholder="ex: openai, stripe, whatsapp"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          disabled={!provider}
          onClick={() => {
            upsert.mutate({ provider, category: category ?? "generic", enabled: false });
            setProvider("");
          }}
        >
          adicionar
        </button>
      </div>
      <DataTable data={list} columns={cols} getRowKey={(r) => r.id} empty="Sem integrações nesta categoria." />
    </section>
  );
}

function SecurityTab() {
  const q = useSecuritySettings();
  const save = useUpsertSecurity();
  const s = q.data;
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(form.require2fa ?? s?.require2fa)}
          onChange={(e) => setForm((f) => ({ ...f, require2fa: e.target.checked }))}
        />
        Exigir 2FA
      </label>
      {[
        ["sessionTtlSeconds", "TTL sessão (s)"],
        ["jwtTtlSeconds", "TTL JWT (s)"],
        ["passwordMinLength", "Tamanho mínimo senha"],
        ["rateLimitPerMin", "Rate limit/min"],
      ].map(([k, label]) => (
        <label key={k} className="space-y-1 text-sm">
          <span className="text-muted-foreground">{label}</span>
          <input
            type="number"
            className="w-full rounded-md border bg-background px-2 py-1.5"
            value={String(form[k] ?? (s ? (s as unknown as Record<string, number>)[k] ?? "") : "")}
            onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          />
        </label>
      ))}
      <div className="md:col-span-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() =>
            save.mutate({
              require2fa: Boolean(form.require2fa ?? s?.require2fa),
              sessionTtlSeconds: Number(form.sessionTtlSeconds ?? s?.sessionTtlSeconds ?? 604800),
              jwtTtlSeconds: Number(form.jwtTtlSeconds ?? s?.jwtTtlSeconds ?? 3600),
              passwordMinLength: Number(form.passwordMinLength ?? s?.passwordMinLength ?? 8),
              rateLimitPerMin: Number(form.rateLimitPerMin ?? s?.rateLimitPerMin ?? 120),
            })
          }
        >
          Salvar segurança
        </button>
      </div>
    </section>
  );
}

function FlagsTab() {
  const q = useFeatureFlags();
  const upsert = useUpsertFlag();
  const del = useDeleteFlag();
  const [key, setKey] = useState("");
  const list = (q.data ?? []) as readonly FeatureFlag[];
  const cols: DataTableColumn<FeatureFlag>[] = [
    { id: "key", header: "Chave", cell: (r) => r.key },
    { id: "module", header: "Módulo", cell: (r) => r.module ?? "—" },
    { id: "scope", header: "Escopo", cell: (r) => r.scope },
    { id: "enabled", header: "Ativa", cell: (r) => <StatusBadge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "sim" : "não"}</StatusBadge> },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => upsert.mutate({ key: r.key, enabled: !r.enabled, module: r.module ?? undefined, scope: r.scope })}
          >
            alternar
          </button>
          <button
            type="button"
            className="text-xs text-destructive hover:underline"
            onClick={() => del.mutate(r.id)}
          >
            remover
          </button>
        </div>
      ),
    },
  ];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Nova flag</span>
          <input
            className="w-full rounded-md border bg-background px-2 py-1.5"
            placeholder="ex: planner.ai.autosuggest"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          disabled={!key}
          onClick={() => {
            upsert.mutate({ key, enabled: false });
            setKey("");
          }}
        >
          criar
        </button>
      </div>
      <DataTable data={list} columns={cols} getRowKey={(r) => r.id} empty="Nenhuma flag cadastrada." />
    </section>
  );
}

function BackupsTab() {
  const q = useBackupSettings();
  const save = useUpsertBackup();
  const b = q.data;
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(form.enabled ?? b?.enabled)}
          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
        />
        Backup automático
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Frequência</span>
        <select
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={String(form.frequency ?? b?.frequency ?? "daily")}
          onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
        >
          <option value="hourly">hourly</option>
          <option value="daily">daily</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Retenção (dias)</span>
        <input
          type="number"
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={String(form.retentionDays ?? b?.retentionDays ?? 30)}
          onChange={(e) => setForm((f) => ({ ...f, retentionDays: e.target.value }))}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Storage provider</span>
        <input
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={String(form.storageProvider ?? b?.storageProvider ?? "supabase")}
          onChange={(e) => setForm((f) => ({ ...f, storageProvider: e.target.value }))}
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() =>
            save.mutate({
              enabled: Boolean(form.enabled ?? b?.enabled ?? false),
              frequency: (form.frequency ?? b?.frequency ?? "daily") as "hourly" | "daily" | "weekly" | "monthly",
              retentionDays: Number(form.retentionDays ?? b?.retentionDays ?? 30),
              storageProvider: String(form.storageProvider ?? b?.storageProvider ?? "supabase"),
            })
          }
        >
          Salvar backups
        </button>
      </div>
    </section>
  );
}

function LocalizationTab() {
  const q = useLocalization();
  const save = useUpsertLocalization();
  const l = q.data;
  const [defaultLocale, setDefault] = useState("");
  const [supported, setSupported] = useState("");
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Idioma padrão</span>
        <input
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={defaultLocale || l?.defaultLocale || "pt-BR"}
          onChange={(e) => setDefault(e.target.value)}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Suportados (vírgula)</span>
        <input
          className="w-full rounded-md border bg-background px-2 py-1.5"
          value={supported || (l?.supportedLocales ?? []).join(",")}
          onChange={(e) => setSupported(e.target.value)}
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() =>
            save.mutate({
              defaultLocale: defaultLocale || l?.defaultLocale || "pt-BR",
              supportedLocales: (supported || (l?.supportedLocales ?? ["pt-BR"]).join(","))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          Salvar regionalização
        </button>
      </div>
    </section>
  );
}

function ApiKeysTab() {
  const q = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const cols: DataTableColumn<ApiKey>[] = [
    { id: "name", header: "Nome", cell: (r) => r.name },
    { id: "prefix", header: "Prefixo", cell: (r) => <code className="text-xs">{r.prefix}</code> },
    { id: "scopes", header: "Escopos", cell: (r) => r.scopes.join(", ") || "—" },
    { id: "createdAt", header: "Criada", cell: (r) => new Date(r.createdAt).toLocaleString("pt-BR") },
    { id: "status", header: "Status", cell: (r) => <StatusBadge tone={r.revokedAt ? "danger" : "success"}>{r.revokedAt ? "revogada" : "ativa"}</StatusBadge> },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.revokedAt ? null : (
          <button type="button" className="text-xs text-destructive hover:underline" onClick={() => revoke.mutate(r.id)}>
            revogar
          </button>
        ),
    },
  ];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Nome da chave</span>
          <input
            className="w-full rounded-md border bg-background px-2 py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          disabled={!name}
          onClick={async () => {
            const out = await create.mutateAsync({ name, scopes: [] });
            setIssued(out.plainToken);
            setName("");
          }}
        >
          gerar
        </button>
      </div>
      {issued && (
        <div className="rounded-md border border-warning bg-warning/10 p-3 text-sm">
          Copie agora — esta chave não será mostrada novamente:
          <div className="mt-1 break-all font-mono text-xs">{issued}</div>
        </div>
      )}
      <DataTable data={(q.data ?? []) as ApiKey[]} columns={cols} getRowKey={(r) => r.id} empty="Nenhuma API key emitida." />
    </section>
  );
}

function statusTone(s: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (s === "healthy") return "success";
  if (s === "degraded") return "warning";
  if (s === "down") return "danger";
  return "neutral";
}