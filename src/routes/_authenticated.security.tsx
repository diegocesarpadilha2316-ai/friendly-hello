import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DataTable,
  EmptyState,
  MetricCard,
  PageContainer,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
  type StatusTone,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  securitySnapshotQuery,
  useCreateIncident,
  useDeleteMfa,
  useEnrollMfa,
  useGlobalLogout,
  useRevokeSession,
  useSecuritySnapshot,
  useSetDeviceTrust,
  useToggleMfa,
  useUpdateIncident,
  useUpdatePolicy,
  type SecurityAuditEntry,
  type SecurityDevice,
  type SecurityIncident,
  type SecurityLoginAttempt,
  type SecurityMfaFactor,
  type SecurityPolicy,
  type SecuritySession,
} from "@/core/security";

type TabKey =
  "dashboard" | "sessions" | "devices" | "login" | "mfa" | "policies" | "incidents" | "audit";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "sessions", label: "Sessões" },
  { key: "devices", label: "Dispositivos" },
  { key: "login", label: "Login" },
  { key: "mfa", label: "MFA" },
  { key: "policies", label: "Políticas" },
  { key: "incidents", label: "Incidentes" },
  { key: "audit", label: "Auditoria" },
];

export const Route = createFileRoute("/_authenticated/security")({
  loader: ({ context }) => context.queryClient.ensureQueryData(securitySnapshotQuery()),
  head: () => ({
    meta: [
      { title: "Segurança Enterprise — Dioris Hub" },
      {
        name: "description",
        content:
          "Camada de segurança unificada da Dioris — sessões, dispositivos, MFA, políticas, incidentes e auditoria.",
      },
      { property: "og:title", content: "Segurança Enterprise — Dioris Hub" },
      {
        property: "og:description",
        content:
          "SecurityManager central: reuse por Auth, API Gateway, Planner, Creator, CRM, Financeiro, Marketplace, Automação e IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityPage,
});

function severityTone(s: SecurityIncident["severity"]): StatusTone {
  switch (s) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
}

function outcomeTone(o: SecurityLoginAttempt["outcome"]): StatusTone {
  if (o === "success") return "success";
  if (o === "mfa_required") return "info";
  if (o === "locked" || o === "suspicious") return "danger";
  return "warning";
}

function SecurityPage() {
  const { data } = useSecuritySnapshot();
  const [tab, setTab] = useState<TabKey>("dashboard");

  return (
    <PageContainer>
      <PageHeader
        title="Segurança Enterprise"
        description="Único ponto central de segurança da plataforma Dioris."
      />
      <nav className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-md px-3 py-1.5 text-sm transition " +
              (tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted")
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && <DashboardTab data={data} />}
      {tab === "sessions" && <SessionsTab sessions={data.sessions} />}
      {tab === "devices" && <DevicesTab devices={data.devices} />}
      {tab === "login" && <LoginTab attempts={data.loginAttempts} />}
      {tab === "mfa" && <MfaTab factors={data.mfaFactors} policy={data.policy} />}
      {tab === "policies" && <PoliciesTab policy={data.policy} />}
      {tab === "incidents" && <IncidentsTab incidents={data.incidents} />}
      {tab === "audit" && <AuditTab audit={data.audit} />}
    </PageContainer>
  );
}

function DashboardTab({ data }: { data: ReturnType<typeof useSecuritySnapshot>["data"] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Sessões ativas" value={data.health.activeSessions} />
      <MetricCard label="Dispositivos confiáveis" value={data.health.trustedDevices} />
      <MetricCard label="Incidentes abertos" value={data.health.openIncidents} />
      <MetricCard label="Falhas de login (24h)" value={data.health.failedLogins24h} />
      <MetricCard label="MFA ativos" value={data.health.mfaEnrollments} />
      <MetricCard
        label="Última auditoria"
        value={data.health.lastAuditAt ? new Date(data.health.lastAuditAt).toLocaleString() : "—"}
      />
      <MetricCard label="CSRF" value={data.policy.csrfEnabled ? "Ativo" : "Inativo"} />
      <MetricCard label="MFA obrigatório" value={data.policy.requireMfa ? "Sim" : "Não"} />
    </section>
  );
}

function SessionsTab({ sessions }: { sessions: SecuritySession[] }) {
  const revoke = useRevokeSession();
  const logout = useGlobalLogout();
  const columns: DataTableColumn<SecuritySession>[] = useMemo(
    () => [
      {
        id: "userId",
        header: "Usuário",
        cell: (r) => <code className="text-xs">{r.userId.slice(0, 8)}</code>,
      },
      { id: "ip", header: "IP", cell: (r) => r.ip ?? "—" },
      { id: "location", header: "Local", cell: (r) => r.location ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <StatusBadge tone={r.active ? "success" : "neutral"}>
            {r.active ? "Ativa" : "Revogada"}
          </StatusBadge>
        ),
      },
      {
        id: "lastSeenAt",
        header: "Última atividade",
        cell: (r) => new Date(r.lastSeenAt).toLocaleString(),
      },
      {
        id: "actions",
        header: "",
        cell: (r) =>
          r.active ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => revoke.mutate({ sessionId: r.id, reason: "admin" })}
            >
              Revogar
            </Button>
          ) : null,
      },
    ],
    [revoke],
  );
  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => logout.mutate({})}>
          Logout global (minhas sessões)
        </Button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState title="Sem sessões" description="Nenhuma sessão registrada ainda." />
      ) : (
        <DataTable data={sessions} columns={columns} />
      )}
    </section>
  );
}

function DevicesTab({ devices }: { devices: SecurityDevice[] }) {
  const trust = useSetDeviceTrust();
  const columns: DataTableColumn<SecurityDevice>[] = [
    { id: "name", header: "Dispositivo", cell: (r) => r.name ?? r.fingerprint.slice(0, 10) },
    { id: "platform", header: "Plataforma", cell: (r) => r.platform ?? "—" },
    { id: "lastIp", header: "Último IP", cell: (r) => r.lastIp ?? "—" },
    {
      id: "trusted",
      header: "Confiança",
      cell: (r) => (
        <StatusBadge tone={r.trusted ? "success" : "neutral"}>
          {r.trusted ? "Confiável" : "Não confiável"}
        </StatusBadge>
      ),
    },
    {
      id: "lastSeenAt",
      header: "Última atividade",
      cell: (r) => new Date(r.lastSeenAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => trust.mutate({ deviceId: r.id, trusted: !r.trusted })}
        >
          {r.trusted ? "Marcar não confiável" : "Confiar"}
        </Button>
      ),
    },
  ];
  return devices.length === 0 ? (
    <EmptyState title="Sem dispositivos" description="Nenhum dispositivo registrado ainda." />
  ) : (
    <DataTable data={devices} columns={columns} />
  );
}

function LoginTab({ attempts }: { attempts: SecurityLoginAttempt[] }) {
  const columns: DataTableColumn<SecurityLoginAttempt>[] = [
    { id: "createdAt", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    { id: "email", header: "Email", cell: (r) => r.email ?? "—" },
    { id: "ip", header: "IP", cell: (r) => r.ip ?? "—" },
    {
      id: "outcome",
      header: "Resultado",
      cell: (r) => <StatusBadge tone={outcomeTone(r.outcome)}>{r.outcome}</StatusBadge>,
    },
    { id: "reason", header: "Motivo", cell: (r) => r.reason ?? "—" },
  ];
  return attempts.length === 0 ? (
    <EmptyState title="Sem tentativas" description="Nenhuma tentativa de login registrada." />
  ) : (
    <DataTable data={attempts} columns={columns} />
  );
}

function MfaTab({ factors, policy }: { factors: SecurityMfaFactor[]; policy: SecurityPolicy }) {
  const enroll = useEnrollMfa();
  const toggle = useToggleMfa();
  const remove = useDeleteMfa();
  const columns: DataTableColumn<SecurityMfaFactor>[] = [
    { id: "method", header: "Método", cell: (r) => r.method },
    { id: "label", header: "Rótulo", cell: (r) => r.label ?? "—" },
    {
      id: "enabled",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.enabled ? "success" : "neutral"}>
          {r.enabled ? "Ativo" : "Inativo"}
        </StatusBadge>
      ),
    },
    { id: "createdAt", header: "Criado", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggle.mutate({ id: r.id, enabled: !r.enabled })}
          >
            {r.enabled ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
            Remover
          </Button>
        </div>
      ),
    },
  ];
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {policy.allowTotp && (
          <Button size="sm" onClick={() => enroll.mutate({ method: "totp", label: "TOTP" })}>
            + TOTP
          </Button>
        )}
        {policy.allowPasskey && (
          <Button size="sm" onClick={() => enroll.mutate({ method: "passkey", label: "Passkey" })}>
            + Passkey
          </Button>
        )}
        {policy.allowBackupCodes && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => enroll.mutate({ method: "backup_codes", label: "Backup Codes" })}
          >
            + Backup Codes
          </Button>
        )}
      </div>
      {factors.length === 0 ? (
        <EmptyState title="Sem MFA" description="Nenhum fator MFA cadastrado." />
      ) : (
        <DataTable data={factors} columns={columns} />
      )}
    </section>
  );
}

function PoliciesTab({ policy }: { policy: SecurityPolicy }) {
  const update = useUpdatePolicy();
  const [form, setForm] = useState({
    csp: policy.csp,
    hstsMaxAge: policy.hstsMaxAge,
    frameOptions: policy.frameOptions,
    referrerPolicy: policy.referrerPolicy,
    permissionsPolicy: policy.permissionsPolicy,
    corsAllowedOrigins: policy.corsAllowedOrigins.join(","),
    csrfEnabled: policy.csrfEnabled,
    replayWindowSeconds: policy.replayWindowSeconds,
    bruteForceMaxAttempts: policy.bruteForceMaxAttempts,
    bruteForceLockoutMinutes: policy.bruteForceLockoutMinutes,
    sessionTtlMinutes: policy.sessionTtlMinutes,
    requireMfa: policy.requireMfa,
    allowTotp: policy.allowTotp,
    allowPasskey: policy.allowPasskey,
    allowBackupCodes: policy.allowBackupCodes,
    contentTypeOptions: policy.contentTypeOptions,
  });
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate({
          csp: form.csp,
          hstsMaxAge: Number(form.hstsMaxAge),
          frameOptions: form.frameOptions,
          contentTypeOptions: form.contentTypeOptions,
          referrerPolicy: form.referrerPolicy,
          permissionsPolicy: form.permissionsPolicy,
          corsAllowedOrigins: form.corsAllowedOrigins
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          csrfEnabled: form.csrfEnabled,
          replayWindowSeconds: Number(form.replayWindowSeconds),
          bruteForceMaxAttempts: Number(form.bruteForceMaxAttempts),
          bruteForceLockoutMinutes: Number(form.bruteForceLockoutMinutes),
          sessionTtlMinutes: Number(form.sessionTtlMinutes),
          requireMfa: form.requireMfa,
          allowTotp: form.allowTotp,
          allowPasskey: form.allowPasskey,
          allowBackupCodes: form.allowBackupCodes,
        });
      }}
    >
      <label className="md:col-span-2 space-y-1 text-sm">
        <span className="text-muted-foreground">Content-Security-Policy</span>
        <textarea
          className="w-full rounded-md border bg-background p-2 font-mono text-xs"
          rows={3}
          value={form.csp}
          onChange={(e) => setForm({ ...form, csp: e.target.value })}
        />
      </label>
      <NumberField
        label="HSTS max-age (s)"
        value={form.hstsMaxAge}
        onChange={(v) => setForm({ ...form, hstsMaxAge: v })}
      />
      <SelectField
        label="X-Frame-Options"
        value={form.frameOptions}
        options={["DENY", "SAMEORIGIN"]}
        onChange={(v) => setForm({ ...form, frameOptions: v as "DENY" | "SAMEORIGIN" })}
      />
      <TextField
        label="Referrer-Policy"
        value={form.referrerPolicy}
        onChange={(v) => setForm({ ...form, referrerPolicy: v })}
      />
      <TextField
        label="Permissions-Policy"
        value={form.permissionsPolicy}
        onChange={(v) => setForm({ ...form, permissionsPolicy: v })}
      />
      <TextField
        label="CORS origens (vírgula)"
        value={form.corsAllowedOrigins}
        onChange={(v) => setForm({ ...form, corsAllowedOrigins: v })}
      />
      <NumberField
        label="Replay window (s)"
        value={form.replayWindowSeconds}
        onChange={(v) => setForm({ ...form, replayWindowSeconds: v })}
      />
      <NumberField
        label="Brute-force max tentativas"
        value={form.bruteForceMaxAttempts}
        onChange={(v) => setForm({ ...form, bruteForceMaxAttempts: v })}
      />
      <NumberField
        label="Lockout (min)"
        value={form.bruteForceLockoutMinutes}
        onChange={(v) => setForm({ ...form, bruteForceLockoutMinutes: v })}
      />
      <NumberField
        label="Sessão TTL (min)"
        value={form.sessionTtlMinutes}
        onChange={(v) => setForm({ ...form, sessionTtlMinutes: v })}
      />
      <BoolField
        label="CSRF"
        value={form.csrfEnabled}
        onChange={(v) => setForm({ ...form, csrfEnabled: v })}
      />
      <BoolField
        label="Exigir MFA"
        value={form.requireMfa}
        onChange={(v) => setForm({ ...form, requireMfa: v })}
      />
      <BoolField
        label="Permitir TOTP"
        value={form.allowTotp}
        onChange={(v) => setForm({ ...form, allowTotp: v })}
      />
      <BoolField
        label="Permitir Passkey/WebAuthn"
        value={form.allowPasskey}
        onChange={(v) => setForm({ ...form, allowPasskey: v })}
      />
      <BoolField
        label="Permitir Backup Codes"
        value={form.allowBackupCodes}
        onChange={(v) => setForm({ ...form, allowBackupCodes: v })}
      />
      <div className="md:col-span-2">
        <Button type="submit" size="sm" disabled={update.isPending}>
          Salvar política
        </Button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="w-full rounded-md border bg-background p-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        className="w-full rounded-md border bg-background p-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="w-full rounded-md border bg-background p-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function BoolField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function IncidentsTab({ incidents }: { incidents: SecurityIncident[] }) {
  const create = useCreateIncident();
  const update = useUpdateIncident();
  const [form, setForm] = useState<{
    title: string;
    category: string;
    severity: SecurityIncident["severity"];
    description: string;
  }>({
    title: "",
    category: "manual",
    severity: "medium",
    description: "",
  });
  const columns: DataTableColumn<SecurityIncident>[] = [
    { id: "createdAt", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    {
      id: "severity",
      header: "Severidade",
      cell: (r) => <StatusBadge tone={severityTone(r.severity)}>{r.severity}</StatusBadge>,
    },
    { id: "category", header: "Categoria", cell: (r) => r.category },
    { id: "title", header: "Título", cell: (r) => r.title },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          tone={r.status === "open" ? "warning" : r.status === "resolved" ? "success" : "neutral"}
        >
          {r.status}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update.mutate({ id: r.id, status: "investigating" })}
          >
            Investigar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => update.mutate({ id: r.id, status: "resolved" })}
          >
            Resolver
          </Button>
        </div>
      ),
    },
  ];
  return (
    <section className="space-y-4">
      <form
        className="grid gap-2 md:grid-cols-4 rounded-md border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title) return;
          create.mutate(form);
          setForm({ ...form, title: "", description: "" });
        }}
      >
        <TextField
          label="Título"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <TextField
          label="Categoria"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <SelectField
          label="Severidade"
          value={form.severity}
          options={["low", "medium", "high", "critical"]}
          onChange={(v) => setForm({ ...form, severity: v as SecurityIncident["severity"] })}
        />
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={create.isPending}>
            Abrir incidente
          </Button>
        </div>
      </form>
      {incidents.length === 0 ? (
        <EmptyState title="Sem incidentes" description="Nenhum incidente registrado." />
      ) : (
        <DataTable data={incidents} columns={columns} />
      )}
    </section>
  );
}

function AuditTab({ audit }: { audit: SecurityAuditEntry[] }) {
  const columns: DataTableColumn<SecurityAuditEntry>[] = [
    { id: "createdAt", header: "Quando", cell: (r) => new Date(r.createdAt).toLocaleString() },
    { id: "action", header: "Ação", cell: (r) => <code className="text-xs">{r.action}</code> },
    {
      id: "actorEmail",
      header: "Ator",
      cell: (r) => r.actorEmail ?? r.actorId?.slice(0, 8) ?? "—",
    },
    {
      id: "targetType",
      header: "Alvo",
      cell: (r) => (r.targetType ? `${r.targetType}:${r.targetId?.slice(0, 8) ?? ""}` : "—"),
    },
    { id: "correlationId", header: "Correlation", cell: (r) => r.correlationId ?? "—" },
  ];
  return audit.length === 0 ? (
    <EmptyState title="Sem eventos" description="Nenhum evento de auditoria registrado." />
  ) : (
    <DataTable data={audit} columns={columns} />
  );
}
