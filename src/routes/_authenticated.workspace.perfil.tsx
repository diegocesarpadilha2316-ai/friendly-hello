import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  KeyRound,
  Laptop,
  ShieldCheck,
  UserCircle,
  History,
  Bell,
  Settings2,
  Monitor,
  Fingerprint,
  Save,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  FormSection,
  DataTable,
  StatusBadge,
  MetricCard,
} from "@/core/components/ui-kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useAuth, useOptionalAuth } from "@/core/hooks";
import {
  useSecuritySnapshot,
  useRevokeSession,
  useGlobalLogout,
  useEnrollMfa,
  useToggleMfa,
  useDeleteMfa,
  useSetDeviceTrust,
} from "@/core/security/use-security";
import { useAudit } from "@/core/observability/use-observability";
import type { MfaMethod } from "@/core/security/types";

export const Route = createFileRoute("/_authenticated/workspace/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Workspace | Dioris Hub" },
      {
        name: "description",
        content: "Identidade, segurança, sessões, dispositivos e preferências.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePerfil,
});

function WorkspacePerfil() {
  const auth = useOptionalAuth();

  if (!auth?.user) {
    return (
      <PageContainer>
        <EmptyState icon={<UserCircle className="h-6 w-6" />} title="Sessão não encontrada" />
      </PageContainer>
    );
  }

  return <PerfilContent />;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function PerfilContent() {
  const { user, supabase } = useAuth();
  const security = useSecuritySnapshot();
  const globalLogout = useGlobalLogout();

  if (!user) return null;

  const snap = security.data;
  const sessions = snap.sessions.filter((s) => s.active);
  const devices = snap.devices;
  const mfa = snap.mfaFactors;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = (meta.full_name as string) ?? (meta.name as string) ?? user.email ?? "";
  const avatarUrl = (meta.avatar_url as string) ?? undefined;
  const initials = (displayName || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Perfil"
        description={user.email ?? ""}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              globalLogout.mutate(
                {},
                {
                  onSuccess: () => toast.success("Sessões encerradas"),
                  onError: (e) => toast.error((e as Error).message),
                },
              )
            }
            disabled={globalLogout.isPending}
          >
            Encerrar todas as sessões
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-4 rounded-lg border border-border/60 bg-card/30 p-4">
        <Avatar className="h-14 w-14">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{user.id}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="MFA ativo"
          value={mfa.filter((f) => f.enabled).length.toString()}
          hint={`${mfa.length} fator(es) registrados`}
        />
        <MetricCard
          icon={<Laptop className="h-4 w-4" />}
          label="Dispositivos"
          value={devices.length.toString()}
          hint={`${devices.filter((d) => d.trusted).length} confiáveis`}
        />
        <MetricCard
          icon={<KeyRound className="h-4 w-4" />}
          label="Sessões ativas"
          value={sessions.length.toString()}
        />
        <MetricCard
          icon={<History className="h-4 w-4" />}
          label="Último acesso"
          value={formatDate(user.last_sign_in_at)}
        />
      </div>

      <Tabs defaultValue="identity" className="mt-8">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="identity">Identidade</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-6">
          <IdentityTab supabase={supabase} initialMeta={meta} email={user.email ?? ""} />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityTab supabase={supabase} mfa={mfa} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-6">
          <SessionsPanel sessions={sessions} />
        </TabsContent>
        <TabsContent value="devices" className="mt-6">
          <DevicesPanel devices={devices} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab supabase={supabase} initialMeta={meta} />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/* ============================== IDENTITY ============================== */

type SupabaseC = ReturnType<typeof useAuth>["supabase"];

function IdentityTab({
  supabase,
  initialMeta,
  email,
}: {
  supabase: SupabaseC;
  initialMeta: Record<string, unknown>;
  email: string;
}) {
  const [fullName, setFullName] = React.useState((initialMeta.full_name as string) ?? "");
  const [phone, setPhone] = React.useState((initialMeta.phone as string) ?? "");
  const [jobTitle, setJobTitle] = React.useState((initialMeta.job_title as string) ?? "");
  const [department, setDepartment] = React.useState((initialMeta.department as string) ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState((initialMeta.avatar_url as string) ?? "");
  const [bio, setBio] = React.useState((initialMeta.bio as string) ?? "");

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...initialMeta,
          full_name: fullName,
          phone,
          job_title: jobTitle,
          department,
          avatar_url: avatarUrl,
          bio,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Perfil atualizado"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormSection title="Dados pessoais" description="Informações visíveis para a equipe.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Nome completo</Label>
          <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-email">E-mail</Label>
          <Input id="p-email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-phone">Telefone</Label>
          <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-job">Cargo</Label>
          <Input id="p-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-dep">Departamento</Label>
          <Input id="p-dep" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-avatar">URL do avatar</Label>
          <Input id="p-avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-bio">Bio</Label>
          <Input id="p-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {mut.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </FormSection>
  );
}

/* ============================== SECURITY ============================== */

function SecurityTab({
  supabase,
  mfa,
}: {
  supabase: SupabaseC;
  mfa: ReturnType<typeof useSecuritySnapshot>["data"]["mfaFactors"];
}) {
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [mfaMethod, setMfaMethod] = React.useState<MfaMethod>("totp");
  const [mfaLabel, setMfaLabel] = React.useState("");
  const enroll = useEnrollMfa();
  const toggle = useToggleMfa();
  const del = useDeleteMfa();

  const pwdMut = useMutation({
    mutationFn: async () => {
      if (pwd.length < 8) throw new Error("Mínimo 8 caracteres");
      if (pwd !== pwd2) throw new Error("As senhas não conferem");
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha atualizada");
      setPwd("");
      setPwd2("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <FormSection title="Alterar senha" description="Requer sessão ativa recente.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pwd">Nova senha</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd2">Confirmar</Label>
            <Input
              id="pwd2"
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => pwdMut.mutate()} disabled={pwdMut.isPending || !pwd}>
            {pwdMut.isPending ? "Atualizando…" : "Atualizar senha"}
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="MFA — Autenticação em dois fatores"
        description="Fatores registrados para esta conta."
      >
        <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={mfaMethod} onValueChange={(v) => setMfaMethod(v as MfaMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totp">TOTP (App autenticador)</SelectItem>
                <SelectItem value="passkey">Passkey</SelectItem>
                <SelectItem value="webauthn">WebAuthn</SelectItem>
                <SelectItem value="backup_codes">Códigos de backup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mfa-label">Rótulo</Label>
            <Input
              id="mfa-label"
              placeholder="Ex.: Meu iPhone"
              value={mfaLabel}
              onChange={(e) => setMfaLabel(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="gap-2"
              disabled={enroll.isPending}
              onClick={() =>
                enroll.mutate(
                  { method: mfaMethod, label: mfaLabel || undefined },
                  {
                    onSuccess: () => {
                      toast.success("Fator MFA registrado");
                      setMfaLabel("");
                    },
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
            >
              <Fingerprint className="h-4 w-4" /> Registrar
            </Button>
          </div>
        </div>

        {mfa.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="Nenhum fator MFA" />
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border/60">
            {mfa.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">
                    {f.method}
                    {f.label ? ` · ${f.label}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado {formatDate(f.createdAt)} · Verificado {formatDate(f.verifiedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={f.enabled ? "success" : "neutral"}>
                    {f.enabled ? "ativo" : "inativo"}
                  </StatusBadge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toggle.mutate(
                        { id: f.id, enabled: !f.enabled },
                        {
                          onSuccess: () => toast.success("Fator atualizado"),
                          onError: (e) => toast.error((e as Error).message),
                        },
                      )
                    }
                  >
                    {f.enabled ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() =>
                      del.mutate(f.id, {
                        onSuccess: () => toast.success("Fator removido"),
                        onError: (e) => toast.error((e as Error).message),
                      })
                    }
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

/* ============================== SESSIONS ============================== */

function SessionsPanel({
  sessions,
}: {
  sessions: ReturnType<typeof useSecuritySnapshot>["data"]["sessions"];
}) {
  const revoke = useRevokeSession();
  return (
    <DataTable
      data={sessions}
      getRowKey={(r) => r.id}
      empty={<EmptyState icon={<Monitor className="h-6 w-6" />} title="Nenhuma sessão ativa" />}
      columns={[
        { id: "device", header: "Dispositivo", cell: (r) => r.userAgent ?? "—" },
        {
          id: "ip",
          header: "IP",
          cell: (r) => <span className="font-mono text-xs">{r.ip ?? "—"}</span>,
        },
        { id: "location", header: "Localização", cell: (r) => r.location ?? "—" },
        { id: "since", header: "Iniciada", cell: (r) => formatDate(r.createdAt) },
        { id: "last", header: "Último acesso", cell: (r) => formatDate(r.lastSeenAt) },
        {
          id: "actions",
          header: "",
          align: "right",
          cell: (r) => (
            <Button
              size="sm"
              variant="ghost"
              disabled={revoke.isPending}
              onClick={() =>
                revoke.mutate(
                  { sessionId: r.id },
                  {
                    onSuccess: () => toast.success("Sessão revogada"),
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
            >
              Revogar
            </Button>
          ),
        },
      ]}
    />
  );
}

/* ============================== DEVICES ============================== */

function DevicesPanel({
  devices,
}: {
  devices: ReturnType<typeof useSecuritySnapshot>["data"]["devices"];
}) {
  const setTrust = useSetDeviceTrust();
  return (
    <DataTable
      data={devices}
      getRowKey={(r) => r.id}
      empty={<EmptyState icon={<Laptop className="h-6 w-6" />} title="Nenhum dispositivo" />}
      columns={[
        { id: "name", header: "Dispositivo", cell: (r) => r.name ?? r.fingerprint.slice(0, 8) },
        { id: "platform", header: "Plataforma", cell: (r) => r.platform ?? "—" },
        {
          id: "ip",
          header: "Último IP",
          cell: (r) => <span className="font-mono text-xs">{r.lastIp ?? "—"}</span>,
        },
        { id: "last", header: "Último acesso", cell: (r) => formatDate(r.lastSeenAt) },
        {
          id: "trust",
          header: "Confiável",
          cell: (r) => (
            <StatusBadge tone={r.trusted ? "success" : "neutral"}>
              {r.trusted ? "sim" : "não"}
            </StatusBadge>
          ),
        },
        {
          id: "actions",
          header: "",
          align: "right",
          cell: (r) => (
            <Button
              size="sm"
              variant="ghost"
              disabled={setTrust.isPending}
              onClick={() =>
                setTrust.mutate(
                  { deviceId: r.id, trusted: !r.trusted },
                  {
                    onSuccess: () => toast.success("Dispositivo atualizado"),
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
            >
              {r.trusted ? "Remover confiança" : "Marcar confiável"}
            </Button>
          ),
        },
      ]}
    />
  );
}

/* ============================== PREFERENCES ============================== */

function PreferencesTab({
  supabase,
  initialMeta,
}: {
  supabase: SupabaseC;
  initialMeta: Record<string, unknown>;
}) {
  const prefs = (initialMeta.preferences as Record<string, string> | undefined) ?? {};
  const [locale, setLocale] = React.useState(prefs.locale ?? "pt-BR");
  const [timezone, setTimezone] = React.useState(prefs.timezone ?? "America/Sao_Paulo");
  const [theme, setTheme] = React.useState(prefs.theme ?? "dark");
  const [emailNotif, setEmailNotif] = React.useState((prefs.notify_email ?? "true") === "true");
  const [pushNotif, setPushNotif] = React.useState((prefs.notify_push ?? "true") === "true");

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...initialMeta,
          preferences: {
            locale,
            timezone,
            theme,
            notify_email: String(emailNotif),
            notify_push: String(pushNotif),
          },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Preferências salvas"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <FormSection
        title="Regionalização"
        description="Idioma, fuso e tema aplicados ao seu perfil."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuso horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notificações" description="Como você prefere ser avisado.">
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" /> E-mail
            </span>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" /> Push in-app
            </span>
            <input
              type="checkbox"
              checked={pushNotif}
              onChange={(e) => setPushNotif(e.target.checked)}
            />
          </label>
        </div>
      </FormSection>

      <div className="flex justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {mut.isPending ? "Salvando…" : "Salvar preferências"}
        </Button>
      </div>
    </div>
  );
}

/* ============================== ACTIVITY ============================== */

function ActivityTab({ userId }: { userId: string }) {
  const { data, isLoading } = useAudit();
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />;
  }
  const rows = [...(data ?? [])].filter(
    (e) => (e as { actorId?: string | null }).actorId === userId,
  );
  return (
    <DataTable
      data={rows}
      getRowKey={(r, i) => (r as { id?: string }).id ?? i}
      empty={<EmptyState icon={<History className="h-6 w-6" />} title="Sem atividades recentes" />}
      columns={[
        {
          id: "when",
          header: "Quando",
          cell: (r) => formatDate((r as { createdAt?: string }).createdAt ?? null),
        },
        {
          id: "action",
          header: "Ação",
          cell: (r) => (
            <StatusBadge tone="info">{(r as { action?: string }).action ?? "—"}</StatusBadge>
          ),
        },
        {
          id: "target",
          header: "Alvo",
          cell: (r) => {
            const t = r as { targetType?: string | null; targetId?: string | null };
            return t.targetType
              ? `${t.targetType}${t.targetId ? `:${t.targetId.slice(0, 8)}` : ""}`
              : "—";
          },
        },
        {
          id: "ip",
          header: "IP",
          cell: (r) => (
            <span className="font-mono text-xs">{(r as { ip?: string | null }).ip ?? "—"}</span>
          ),
        },
      ]}
    />
  );
}
