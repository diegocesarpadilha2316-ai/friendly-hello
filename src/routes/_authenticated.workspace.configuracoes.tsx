import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Settings, Shield, Plug, KeyRound, Flag, Palette, HardDriveDownload,
  Globe2, Bell, Sparkles, Image as ImageIcon, Star, Building2, LayoutDashboard,
} from "lucide-react";
import {
  PageContainer, PageHeader, ModuleCard, FormSection, StatusBadge, EmptyState,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useLocalization, useUpsertLocalization,
  useCompanySettings, useUpdateCompanySettings,
  useSecuritySettings, useUpsertSecurity,
  useIntegrations, useTestIntegration,
  useApiKeys, useCreateApiKey, useRevokeApiKey,
  useFeatureFlags, useUpsertFlag, useDeleteFlag,
  useBackupSettings, useUpsertBackup,
  useBranding, useUpsertBranding,
  useConfigurationExport,
} from "@/core/configuration/use-configuration";
import { useNotificationPreferences, useNotificationMetrics } from "@/core/notifications/use-notifications";
import { useAIMetrics, useAIModels } from "@/core/ai/use-ai";
import { useAssetsStats } from "@/core/assets/use-assets";
import { useApiGatewaySnapshot } from "@/core/api-gateway/use-api-gateway";
import { useTenant } from "@/core/providers/TenantProvider";

export const Route = createFileRoute("/_authenticated/workspace/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Workspace | Dioris Hub" },
      { name: "description", content: "Personalize completamente seu Workspace: interface, regionalização, notificações, segurança, IA, API e mais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceConfig,
});

const THEMES = ["system", "dark", "light"] as const;
const LOCALES = ["pt-BR", "en-US", "es-ES"] as const;
const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/Lisbon", "UTC"] as const;
const CURRENCIES = ["BRL", "USD", "EUR"] as const;
const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;
const NUMBER_FORMATS = ["pt-BR", "en-US", "de-DE"] as const;
const DENSITIES = ["comfortable", "compact"] as const;
const BACKUP_FREQ = ["hourly", "daily", "weekly", "monthly"] as const;
const HOME_PAGES = [
  { value: "/workspace", label: "Dashboard do Workspace" },
  { value: "/workspace/empresa", label: "Minha Empresa" },
  { value: "/workspace/equipe", label: "Equipe" },
  { value: "/workspace/creditos", label: "Créditos" },
  { value: "/admin", label: "Admin Center" },
];

function WorkspaceConfig() {
  const localization = useLocalization();
  const upsertLoc = useUpsertLocalization();
  const company = useCompanySettings();
  const upsertCompany = useUpdateCompanySettings();
  const security = useSecuritySettings();
  const upsertSecurity = useUpsertSecurity();
  const integrations = useIntegrations();
  const testIntegration = useTestIntegration();
  const apiKeys = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const flags = useFeatureFlags();
  const upsertFlag = useUpsertFlag();
  const deleteFlag = useDeleteFlag();
  const backup = useBackupSettings();
  const upsertBackup = useUpsertBackup();
  const branding = useBranding();
  const upsertBranding = useUpsertBranding();
  const exportCfg = useConfigurationExport();
  const { activeCompany } = useTenant();

  const [displayName, setDisplayName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [theme, setTheme] = useState<string>("dark");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");
  const [dateFormat, setDateFormat] = useState<string>("dd/MM/yyyy");
  const [numberFormat, setNumberFormat] = useState<string>("pt-BR");
  const [density, setDensity] = useState<string>("comfortable");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [accentColor, setAccentColor] = useState("#06B6D4");
  const [collapsedMenu, setCollapsedMenu] = useState(false);
  const [defaultHome, setDefaultHome] = useState("/workspace");
  const [favoriteModule, setFavoriteModule] = useState("planner");
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    if (localization.data) setLocale(localization.data.defaultLocale);
  }, [localization.data]);
  useEffect(() => {
    if (!company.data) return;
    setTheme(company.data.theme ?? "dark");
    setTimezone(company.data.timezone ?? "America/Sao_Paulo");
    setCurrency(company.data.currency ?? "BRL");
    setDisplayName(company.data.displayName ?? "");
    setDateFormat(company.data.dateFormat ?? "dd/MM/yyyy");
    setNumberFormat(company.data.numberFormat ?? "pt-BR");
    const meta = (company.data.metadata ?? {}) as Record<string, unknown>;
    setTradeName(String(meta.tradeName ?? ""));
    setDensity(String(meta.density ?? "comfortable"));
    setPrimaryColor(String(meta.primaryColor ?? "#8B5CF6"));
    setAccentColor(String(meta.accentColor ?? "#06B6D4"));
    setCollapsedMenu(Boolean(meta.collapsedMenu));
    setDefaultHome(String(meta.defaultHome ?? "/workspace"));
    setFavoriteModule(String(meta.favoriteModule ?? "planner"));
  }, [company.data]);

  const activeIntegrations = useMemo(
    () => (integrations.data ?? []).filter((i) => i.enabled).length,
    [integrations.data],
  );
  const activeKeys = useMemo(
    () => (apiKeys.data ?? []).filter((k) => !k.revokedAt).length,
    [apiKeys.data],
  );

  const saveGeneral = () => {
    upsertCompany.mutate(
      {
        displayName,
        timezone,
        currency,
        dateFormat,
        numberFormat,
        metadata: { ...(company.data?.metadata ?? {}), tradeName },
      },
      {
        onSuccess: () => toast.success("Dados gerais salvos"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
    upsertLoc.mutate({ defaultLocale: locale }, { onError: (e) => toast.error((e as Error).message) });
  };

  const saveInterface = () => {
    upsertCompany.mutate(
      {
        theme,
        metadata: {
          ...(company.data?.metadata ?? {}),
          density, primaryColor, accentColor, collapsedMenu,
        },
      },
      {
        onSuccess: () => toast.success("Interface atualizada"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const savePreferences = () => {
    upsertCompany.mutate(
      {
        metadata: {
          ...(company.data?.metadata ?? {}),
          defaultHome, favoriteModule,
        },
      },
      {
        onSuccess: () => toast.success("Preferências salvas"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Configurações"
        description={`Personalize completamente o Workspace de ${activeCompany?.name ?? "sua empresa"}.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportCfg.mutate(
                { format: "json" },
                {
                  onSuccess: (payload) => {
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `dioris-config-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  },
                  onError: (e) => toast.error((e as Error).message),
                },
              )
            }
            disabled={exportCfg.isPending}
          >
            Exportar configurações
          </Button>
        }
      />

      <Tabs defaultValue="geral" className="mt-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="geral"><Settings className="mr-1 h-3.5 w-3.5" />Geral</TabsTrigger>
          <TabsTrigger value="empresa"><Building2 className="mr-1 h-3.5 w-3.5" />Empresa</TabsTrigger>
          <TabsTrigger value="interface"><Palette className="mr-1 h-3.5 w-3.5" />Interface</TabsTrigger>
          <TabsTrigger value="regiao"><Globe2 className="mr-1 h-3.5 w-3.5" />Regionalização</TabsTrigger>
          <TabsTrigger value="notif"><Bell className="mr-1 h-3.5 w-3.5" />Notificações</TabsTrigger>
          <TabsTrigger value="seg"><Shield className="mr-1 h-3.5 w-3.5" />Segurança</TabsTrigger>
          <TabsTrigger value="ia"><Sparkles className="mr-1 h-3.5 w-3.5" />IA</TabsTrigger>
          <TabsTrigger value="assets"><ImageIcon className="mr-1 h-3.5 w-3.5" />Assets</TabsTrigger>
          <TabsTrigger value="api"><KeyRound className="mr-1 h-3.5 w-3.5" />API</TabsTrigger>
          <TabsTrigger value="pref"><Star className="mr-1 h-3.5 w-3.5" />Preferências</TabsTrigger>
        </TabsList>

        {/* GERAL */}
        <TabsContent value="geral" className="mt-6">
          <FormSection title="Dados gerais" description="Identificação e formatos exibidos em toda a plataforma.">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Nome da empresa</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
              <div><Label>Nome fantasia</Label><Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} /></div>
              <div><Label>Idioma</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOCALES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fuso horário</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Moeda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Formato de data</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DATE_FORMATS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Formato numérico</Label>
                <Select value={numberFormat} onValueChange={setNumberFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NUMBER_FORMATS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveGeneral} disabled={upsertCompany.isPending || upsertLoc.isPending}>Salvar</Button>
            </div>
          </FormSection>
        </TabsContent>

        {/* EMPRESA */}
        <TabsContent value="empresa" className="mt-6">
          <FormSection title="Minha empresa" description="Edite informações comerciais completas na área dedicada.">
            <div className="grid gap-4 md:grid-cols-3">
              <ModuleCard icon={<Building2 className="h-4 w-4" />} name="Dados & Branding" description="Identidade, endereço, comercial" href="/workspace/empresa" />
              <ModuleCard name="Equipe" description="Membros, convites e RBAC" href="/workspace/equipe" />
              <ModuleCard name="Perfil pessoal" description="Sua conta e MFA" href="/workspace/perfil" />
            </div>
          </FormSection>
          <div className="mt-6">
            <BrandingPanel
              data={branding.data ?? undefined}
              onSave={(p) => upsertBranding.mutate(p, { onSuccess: () => toast.success("Branding atualizado"), onError: (e) => toast.error((e as Error).message) })}
              pending={upsertBranding.isPending}
            />
          </div>
        </TabsContent>

        {/* INTERFACE */}
        <TabsContent value="interface" className="mt-6">
          <FormSection title="Interface" description="Tema, cores e densidade do Workspace.">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{THEMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Densidade</Label>
                <Select value={density} onValueChange={setDensity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DENSITIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cor principal</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-16 p-1" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div><Label>Cor secundária</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-10 w-16 p-1" />
                  <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
                <div><Label>Menu recolhido por padrão</Label><p className="text-xs text-muted-foreground">Inicia o sidebar do Workspace colapsado.</p></div>
                <Switch checked={collapsedMenu} onCheckedChange={setCollapsedMenu} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveInterface} disabled={upsertCompany.isPending}>Salvar interface</Button>
            </div>
          </FormSection>
        </TabsContent>

        {/* REGIONALIZAÇÃO */}
        <TabsContent value="regiao" className="mt-6">
          <FormSection title="Regionalização" description="Idioma padrão, fuso e formatos aplicados a toda a empresa.">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Idioma padrão</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOCALES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fuso horário</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Moeda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Formato de data</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DATE_FORMATS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveGeneral} disabled={upsertLoc.isPending || upsertCompany.isPending}>Salvar</Button>
            </div>
          </FormSection>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notif" className="mt-6">
          <NotificationsPanel />
        </TabsContent>

        {/* SEGURANÇA */}
        <TabsContent value="seg" className="mt-6 space-y-6">
          <SecurityPanel
            data={security.data ?? undefined}
            onSave={(p) => upsertSecurity.mutate(p, { onSuccess: () => toast.success("Segurança atualizada"), onError: (e) => toast.error((e as Error).message) })}
            pending={upsertSecurity.isPending}
          />
          <FormSection title="Feature Flags" description="Recursos experimentais para sua empresa.">
            {(flags.data ?? []).length === 0 ? (
              <EmptyState title="Nenhuma flag configurada" />
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {(flags.data ?? []).map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{f.key}</div>
                      <div className="text-xs text-muted-foreground">{f.description ?? f.module ?? f.scope}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={f.enabled} onCheckedChange={(v) => upsertFlag.mutate({ id: f.id, key: f.key, enabled: v, scope: f.scope }, { onError: (e) => toast.error((e as Error).message) })} />
                      <Button size="sm" variant="ghost" onClick={() => deleteFlag.mutate(f.id, { onError: (e) => toast.error((e as Error).message) })}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
          <BackupPanel
            data={backup.data ?? undefined}
            onSave={(p) => upsertBackup.mutate(p, { onSuccess: () => toast.success("Backup atualizado"), onError: (e) => toast.error((e as Error).message) })}
            pending={upsertBackup.isPending}
          />
        </TabsContent>

        {/* IA */}
        <TabsContent value="ia" className="mt-6">
          <AIPanel />
        </TabsContent>

        {/* ASSETS */}
        <TabsContent value="assets" className="mt-6">
          <AssetsPanel />
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="mt-6 space-y-6">
          <FormSection title="API Keys" description={`${activeKeys} chaves ativas`}>
            <div className="flex gap-2">
              <Input placeholder="Nome da chave" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              <Button
                onClick={() => {
                  if (!newKeyName.trim()) return toast.error("Informe um nome");
                  createApiKey.mutate(
                    { name: newKeyName.trim(), scopes: ["read"] },
                    {
                      onSuccess: (r) => {
                        setNewKeyName("");
                        const token = (r as { plainToken?: string } | undefined)?.plainToken;
                        if (token) {
                          navigator.clipboard?.writeText(token).catch(() => {});
                          toast.success("Chave criada e copiada");
                        } else toast.success("Chave criada");
                      },
                      onError: (e) => toast.error((e as Error).message),
                    },
                  );
                }}
                disabled={createApiKey.isPending}
              >Criar</Button>
            </div>
            <div className="mt-4 divide-y divide-border rounded-lg border border-border">
              {(apiKeys.data ?? []).length === 0 ? (
                <div className="p-6"><EmptyState title="Nenhuma chave criada" description="Crie uma API key para integrar sistemas externos." /></div>
              ) : (
                (apiKeys.data ?? []).map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{k.name} <span className="ml-2 font-mono text-xs text-muted-foreground">{k.prefix}…</span></div>
                      <div className="text-xs text-muted-foreground">Criada em {new Date(k.createdAt).toLocaleDateString("pt-BR")} · {k.scopes.join(", ") || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={k.revokedAt ? "danger" : "success"}>{k.revokedAt ? "Revogada" : "Ativa"}</StatusBadge>
                      {!k.revokedAt && (
                        <Button size="sm" variant="outline" onClick={() => revokeApiKey.mutate(k.id, { onSuccess: () => toast.success("Chave revogada"), onError: (e) => toast.error((e as Error).message) })}>Revogar</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </FormSection>

          <FormSection title="Integrações & Webhooks" description={`${activeIntegrations} integrações ativas`}>
            {(integrations.data ?? []).length === 0 ? (
              <EmptyState title="Nenhuma integração conectada" description="Configure provedores de e-mail, pagamento, storage ou webhooks." />
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {(integrations.data ?? []).map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{i.provider}</div>
                      <div className="text-xs text-muted-foreground">{i.category} · {i.status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={i.status === "healthy" ? "success" : i.status === "down" ? "danger" : "warning"}>{i.status}</StatusBadge>
                      <Button size="sm" variant="outline" onClick={() => testIntegration.mutate(i.id, { onSuccess: () => toast.success("Teste enviado"), onError: (e) => toast.error((e as Error).message) })} disabled={testIntegration.isPending}>Testar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <ApiGatewayPanel />
          </Suspense>
        </TabsContent>

        {/* PREFERÊNCIAS */}
        <TabsContent value="pref" className="mt-6">
          <FormSection title="Preferências pessoais" description="Página inicial, módulo favorito e atalhos.">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Página inicial</Label>
                <Select value={defaultHome} onValueChange={setDefaultHome}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HOME_PAGES.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Módulo favorito</Label>
                <Select value={favoriteModule} onValueChange={setFavoriteModule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planner">Planner</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-lg border border-border p-4">
              <div className="text-sm font-medium">Atalhos globais</div>
              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div><kbd className="rounded bg-muted px-1.5 py-0.5">⌘K</kbd> Command Palette</div>
                <div><kbd className="rounded bg-muted px-1.5 py-0.5">G D</kbd> Ir para Dashboard</div>
                <div><kbd className="rounded bg-muted px-1.5 py-0.5">G E</kbd> Ir para Equipe</div>
                <div><kbd className="rounded bg-muted px-1.5 py-0.5">G C</kbd> Ir para Configurações</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={savePreferences} disabled={upsertCompany.isPending}>Salvar preferências</Button>
            </div>
          </FormSection>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-xs text-muted-foreground">
        Configurações administrativas globais seguem no{" "}
        <Link to="/configuracoes" className="text-primary hover:underline">Centro de Configurações</Link>.
        {" "}Acesse também <Link to="/workspace" className="text-primary hover:underline"><LayoutDashboard className="mr-1 inline h-3 w-3" />Dashboard</Link>.
      </p>
    </PageContainer>
  );
}

/* ================= Panels ================= */

function SecurityPanel({ data, onSave, pending }: { data: import("@/core/configuration/types").SecuritySettings | undefined; onSave: (p: Record<string, unknown>) => void; pending: boolean }) {
  const [require2fa, setRequire2fa] = useState(false);
  const [minLen, setMinLen] = useState(8);
  const [requireSymbol, setRequireSymbol] = useState(true);
  const [sessionTtl, setSessionTtl] = useState(3600);
  useEffect(() => {
    if (!data) return;
    setRequire2fa(data.require2fa);
    setMinLen(data.passwordMinLength);
    setRequireSymbol(data.passwordRequireSymbol);
    setSessionTtl(data.sessionTtlSeconds);
  }, [data]);
  return (
    <FormSection title="Segurança" description="Políticas de autenticação, sessão e MFA. Gerencie dispositivos e sessões em Perfil.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div><Label>Exigir 2FA</Label><p className="text-xs text-muted-foreground">Todos os membros precisam ativar MFA.</p></div>
          <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div><Label>Senha exige símbolo</Label></div>
          <Switch checked={requireSymbol} onCheckedChange={setRequireSymbol} />
        </div>
        <div><Label>Tamanho mínimo da senha</Label><Input type="number" min={6} max={64} value={minLen} onChange={(e) => setMinLen(Number(e.target.value))} /></div>
        <div><Label>TTL da sessão (segundos)</Label><Input type="number" min={300} value={sessionTtl} onChange={(e) => setSessionTtl(Number(e.target.value))} /></div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild><Link to="/workspace/perfil">Gerenciar MFA & Sessões</Link></Button>
        <Button onClick={() => onSave({ require2fa, passwordMinLength: minLen, passwordRequireSymbol: requireSymbol, sessionTtlSeconds: sessionTtl })} disabled={pending}>Salvar</Button>
      </div>
    </FormSection>
  );
}

function BrandingPanel({ data, onSave, pending }: { data: import("@/core/configuration/types").Branding | undefined; onSave: (p: Record<string, unknown>) => void; pending: boolean }) {
  const [logoUrl, setLogoUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  useEffect(() => {
    if (!data) return;
    setLogoUrl(data.logoUrl ?? "");
    setIconUrl(data.iconUrl ?? "");
  }, [data]);
  return (
    <FormSection title="Branding" description="Logotipo e ícone da empresa exibidos no Workspace.">
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>URL do logotipo</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" /></div>
        <div><Label>URL do ícone</Label><Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://…" /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onSave({ logoUrl: logoUrl || null, iconUrl: iconUrl || null })} disabled={pending}>Salvar branding</Button>
      </div>
    </FormSection>
  );
}

function BackupPanel({ data, onSave, pending }: { data: import("@/core/configuration/types").BackupSettings | undefined; onSave: (p: Record<string, unknown>) => void; pending: boolean }) {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState<(typeof BACKUP_FREQ)[number]>("daily");
  const [retention, setRetention] = useState(30);
  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setFrequency(data.frequency);
    setRetention(data.retentionDays);
  }, [data]);
  return (
    <FormSection title="Backup" description={data?.lastRunAt ? `Último backup: ${new Date(data.lastRunAt).toLocaleString("pt-BR")} · ${data.lastStatus ?? "—"}` : "Nenhum backup executado ainda."}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-3">
          <div><Label>Backup automático</Label><p className="text-xs text-muted-foreground">Snapshots regulares dos dados da empresa.</p></div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div><Label>Frequência</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as (typeof BACKUP_FREQ)[number])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BACKUP_FREQ.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Retenção (dias)</Label><Input type="number" min={1} value={retention} onChange={(e) => setRetention(Number(e.target.value))} /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onSave({ enabled, frequency, retentionDays: retention })} disabled={pending}>Salvar backup</Button>
      </div>
    </FormSection>
  );
}

function NotificationsPanel() {
  const prefs = useNotificationPreferences();
  const metrics = useNotificationMetrics();
  const list = prefs.data ?? [];
  const grouped = useMemo(() => {
    const byChannel: Record<string, Array<typeof list[number]>> = {};
    for (const p of list) {
      const arr = byChannel[p.channel] ?? [];
      arr.push(p);
      byChannel[p.channel] = arr;
    }
    return byChannel;
  }, [list]);
  return (
    <div className="space-y-6">
      <FormSection title="Notificações — Métricas" description="Volume e canais utilizados nos últimos períodos.">
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Total</div><div className="text-xl font-semibold">{metrics.data?.total ?? 0}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Não lidas</div><div className="text-xl font-semibold">{metrics.data?.unread ?? 0}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Pendentes</div><div className="text-xl font-semibold">{metrics.data?.deliveriesPending ?? 0}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Falhas</div><div className="text-xl font-semibold">{metrics.data?.deliveriesFailed ?? 0}</div></div>
        </div>
      </FormSection>
      <FormSection title="Preferências por canal" description="Email, Push, In-App e Webhook. Gerenciadas pelo NotificationManager.">
        {list.length === 0 ? (
          <EmptyState title="Nenhuma preferência configurada" description="As preferências são criadas automaticamente conforme as categorias de notificação usadas." />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([channel, items]) => (
              <div key={channel} className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm font-medium capitalize">{channel}</div>
                <div className="divide-y divide-border">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="text-sm">{p.category}</div>
                      <StatusBadge tone={p.enabled ? "success" : "neutral"}>{p.enabled ? "Ativo" : "Silenciado"}</StatusBadge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}

function AIPanel() {
  const models = useAIModels();
  const metrics = useAIMetrics();
  return (
    <div className="space-y-6">
      <FormSection title="IA — Consumo" description="Requisições, tokens e custo consumidos pelo AI Gateway.">
        <div className="grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Requisições</div><div className="text-xl font-semibold">{metrics.data?.requests ?? 0}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Latência média</div><div className="text-xl font-semibold">{Math.round(metrics.data?.avgLatencyMs ?? 0)}ms</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Créditos</div><div className="text-xl font-semibold">{(metrics.data?.creditsSpent ?? 0).toFixed(2)}</div></div>
          <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Erros</div><div className="text-xl font-semibold">{metrics.data?.errors ?? 0}</div></div>
        </div>
      </FormSection>
      <FormSection title="Modelos disponíveis" description="Catálogo do Core AI Gateway.">
        {(() => {
          const modelsList = models.data?.models ?? [];
          if (modelsList.length === 0) {
            return <EmptyState title="Nenhum modelo listado" description="Configure provedores em Admin › IA." />;
          }
          return (
            <div className="divide-y divide-border rounded-lg border border-border">
              {modelsList.slice(0, 12).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{m.label ?? m.id}</div>
                    <div className="text-xs text-muted-foreground">{m.provider} · {m.capabilities.join(", ")}</div>
                  </div>
                  <StatusBadge tone={m.enabled ? "success" : "neutral"}>{m.enabled ? "Disponível" : "Desativado"}</StatusBadge>
                </div>
              ))}
            </div>
          );
        })()}
      </FormSection>
    </div>
  );
}

function AssetsPanel() {
  const stats = useAssetsStats();
  const s = stats.data;
  return (
    <FormSection title="Assets" description="Storage, compressão, organização e versionamento do módulo Assets.">
      <div className="grid gap-3 md:grid-cols-3 text-sm">
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Total de assets</div><div className="text-xl font-semibold">{s?.assetCount ?? 0}</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Storage usado</div><div className="text-xl font-semibold">{((s?.usedBytes ?? 0) / 1_048_576).toFixed(1)} MB</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Cota</div><div className="text-xl font-semibold">{s?.quotaBytes ? `${(s.quotaBytes / 1_048_576).toFixed(0)} MB` : "—"}</div></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" asChild><Link to="/admin">Abrir gestor de Assets</Link></Button>
      </div>
    </FormSection>
  );
}

function ApiGatewayPanel() {
  const snap = useApiGatewaySnapshot();
  const s = snap.data;
  return (
    <FormSection title="API Gateway" description="Endpoints registrados, quotas e webhooks.">
      <div className="grid gap-3 md:grid-cols-4 text-sm">
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Endpoints</div><div className="text-xl font-semibold">{s?.endpoints?.length ?? 0}</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Webhooks</div><div className="text-xl font-semibold">{s?.webhooks?.length ?? 0}</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Rate limits</div><div className="text-xl font-semibold">{s?.rateLimits?.length ?? 0}</div></div>
        <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Quotas</div><div className="text-xl font-semibold">{s?.quotas?.length ?? 0}</div></div>
      </div>
    </FormSection>
  );
}
