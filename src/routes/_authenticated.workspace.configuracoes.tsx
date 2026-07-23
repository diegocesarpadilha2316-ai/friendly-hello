import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Settings, Shield, Plug, KeyRound, Flag, Palette, HardDriveDownload, Globe2 } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
  FormSection,
  StatusBadge,
  EmptyState,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useLocalization,
  useUpsertLocalization,
  useCompanySettings,
  useUpdateCompanySettings,
  useSecuritySettings,
  useUpsertSecurity,
  useIntegrations,
  useTestIntegration,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useFeatureFlags,
  useUpsertFlag,
  useDeleteFlag,
  useBackupSettings,
  useUpsertBackup,
  useBranding,
  useUpsertBranding,
  useConfigurationExport,
} from "@/core/configuration/use-configuration";

export const Route = createFileRoute("/_authenticated/workspace/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Workspace | Dioris Hub" },
      { name: "description", content: "Preferências, tema, idioma e região da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceConfig,
});

const THEMES = ["system", "dark", "light"] as const;
const LOCALES = ["pt-BR", "en-US", "es-ES"] as const;
const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/Lisbon", "UTC"] as const;
const CURRENCIES = ["BRL", "USD", "EUR"] as const;
const BACKUP_FREQ = ["hourly", "daily", "weekly", "monthly"] as const;

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

  const [locale, setLocale] = useState("pt-BR");
  const [theme, setTheme] = useState<string>("dark");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");
  const [displayName, setDisplayName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    if (localization.data) setLocale(localization.data.defaultLocale);
  }, [localization.data]);
  useEffect(() => {
    if (company.data) {
      setTheme(company.data.theme ?? "dark");
      setTimezone(company.data.timezone ?? "America/Sao_Paulo");
      setCurrency(company.data.currency ?? "BRL");
      setDisplayName(company.data.displayName ?? "");
    }
  }, [company.data]);

  const savePreferences = () => {
    upsertCompany.mutate(
      { theme, timezone, currency, displayName },
      {
        onSuccess: () => toast.success("Preferências salvas"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
    upsertLoc.mutate(
      { defaultLocale: locale },
      { onError: (e) => toast.error((e as Error).message) },
    );
  };

  const activeIntegrations = useMemo(
    () => (integrations.data ?? []).filter((i) => i.enabled).length,
    [integrations.data],
  );
  const activeKeys = useMemo(
    () => (apiKeys.data ?? []).filter((k) => !k.revokedAt).length,
    [apiKeys.data],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Configurações"
        description="Preferências do usuário e da empresa"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportCfg.mutate(
                { format: "json" },
                {
                  onSuccess: (payload) => {
                    const blob = new Blob([JSON.stringify(payload, null, 2)], {
                      type: "application/json",
                    });
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

      <Tabs defaultValue="preferences" className="mt-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="preferences"><Globe2 className="mr-1 h-3.5 w-3.5" />Preferências</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-1 h-3.5 w-3.5" />Segurança</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="mr-1 h-3.5 w-3.5" />Integrações</TabsTrigger>
          <TabsTrigger value="api-keys"><KeyRound className="mr-1 h-3.5 w-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="flags"><Flag className="mr-1 h-3.5 w-3.5" />Feature Flags</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="mr-1 h-3.5 w-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="backup"><HardDriveDownload className="mr-1 h-3.5 w-3.5" />Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="mt-6">
        <FormSection
          title="Preferências"
          description="Tema, idioma, região e moeda aplicados a toda a empresa."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome de exibição</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Dioris Móveis Planejados"
              />
            </div>
            <div>
              <Label>Tema</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={upsertCompany.isPending || upsertLoc.isPending}
            >
              Salvar preferências
            </Button>
          </div>
        </FormSection>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityPanel data={security.data ?? undefined} onSave={(p) => upsertSecurity.mutate(p, { onSuccess: () => toast.success("Segurança atualizada"), onError: (e) => toast.error((e as Error).message) })} pending={upsertSecurity.isPending} />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <FormSection title="Integrações" description={`${activeIntegrations} integrações ativas`}>
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
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
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
        </TabsContent>

        <TabsContent value="flags" className="mt-6">
          <FormSection title="Feature Flags" description="Ative recursos experimentais para sua empresa.">
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
                      <Switch
                        checked={f.enabled}
                        onCheckedChange={(v) =>
                          upsertFlag.mutate({ id: f.id, key: f.key, enabled: v, scope: f.scope }, { onError: (e) => toast.error((e as Error).message) })
                        }
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteFlag.mutate(f.id, { onError: (e) => toast.error((e as Error).message) })}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingPanel
            data={branding.data ?? undefined}
            onSave={(p) => upsertBranding.mutate(p, { onSuccess: () => toast.success("Branding atualizado"), onError: (e) => toast.error((e as Error).message) })}
            pending={upsertBranding.isPending}
          />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupPanel
            data={backup.data ?? undefined}
            onSave={(p) => upsertBackup.mutate(p, { onSuccess: () => toast.success("Backup atualizado"), onError: (e) => toast.error((e as Error).message) })}
            pending={upsertBackup.isPending}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard
          icon={<Settings className="h-4 w-4" />}
          name="Empresa"
          description="Identidade, plano e domínio"
          href="/workspace/empresa"
        />
        <ModuleCard
          name="Segurança"
          description="MFA, sessões e políticas"
          href="/workspace/perfil"
        />
        <ModuleCard
          name="Perfil"
          description="Sua conta pessoal"
          href="/workspace/perfil"
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Configurações avançadas seguem no{" "}
        <Link to="/configuracoes" className="text-primary hover:underline">
          Centro de Configurações
        </Link>
        .
      </p>
    </PageContainer>
  );
}

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
    <FormSection title="Segurança" description="Políticas de autenticação e sessão.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div><Label>Exigir 2FA</Label><p className="text-xs text-muted-foreground">Todos os membros precisam ativar MFA.</p></div>
          <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div><Label>Senha exige símbolo</Label></div>
          <Switch checked={requireSymbol} onCheckedChange={setRequireSymbol} />
        </div>
        <div>
          <Label>Tamanho mínimo da senha</Label>
          <Input type="number" min={6} max={64} value={minLen} onChange={(e) => setMinLen(Number(e.target.value))} />
        </div>
        <div>
          <Label>TTL da sessão (segundos)</Label>
          <Input type="number" min={300} value={sessionTtl} onChange={(e) => setSessionTtl(Number(e.target.value))} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onSave({ require2fa, passwordMinLength: minLen, passwordRequireSymbol: requireSymbol, sessionTtlSeconds: sessionTtl })} disabled={pending}>Salvar segurança</Button>
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
    <FormSection title="Branding" description="Personalize logotipo e identidade visual da empresa.">
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
        <div>
          <Label>Frequência</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as (typeof BACKUP_FREQ)[number])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BACKUP_FREQ.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Retenção (dias)</Label>
          <Input type="number" min={1} value={retention} onChange={(e) => setRetention(Number(e.target.value))} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onSave({ enabled, frequency, retentionDays: retention })} disabled={pending}>Salvar backup</Button>
      </div>
    </FormSection>
  );
}
