import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Clock,
  MoreHorizontal,
  Copy,
  RefreshCw,
  X,
  Monitor,
  History,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  DataTable,
  EmptyState,
  StatusBadge,
  MetricCard,
  SearchInput,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTenant } from "@/core/hooks";
import {
  listCompanyMembers,
  listCompanyInvitations,
  inviteMember,
  cancelInvitation,
  resendInvitation,
  updateMemberRole,
  setMemberActive,
} from "@/core/services/tenant.functions";
import { useSecuritySnapshot, useRevokeSession } from "@/core/security/use-security";
import { useAudit } from "@/core/observability/use-observability";
import type { CompanyMember, CompanyInvitation, TenantRole } from "@/core/types/tenant";

export const Route = createFileRoute("/_authenticated/workspace/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Workspace | Dioris Hub" },
      { name: "description", content: "Membros, papéis, convites e sessões da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceEquipe,
});

const ROLE_LABEL: Record<TenantRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Membro",
};

const ROLE_TONE: Record<TenantRole, "success" | "info" | "neutral" | "warning"> = {
  owner: "warning",
  admin: "info",
  manager: "success",
  member: "neutral",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function WorkspaceEquipe() {
  const { activeCompany, role: myRole } = useTenant();
  const canManage = myRole === "owner" || myRole === "admin";

  if (!activeCompany) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Selecione uma empresa"
          description="Escolha uma empresa ativa para gerenciar a equipe."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Equipe"
        description={`Membros, convites, papéis e segurança de ${activeCompany.name}.`}
        actions={canManage ? <InviteMemberButton /> : null}
      />
      <TeamContent canManage={canManage} />
    </PageContainer>
  );
}

function TeamContent({ canManage }: { canManage: boolean }) {
  const { activeCompany } = useTenant();
  const companyId = activeCompany?.id;

  const membersQ = useQuery({
    queryKey: ["tenant:members", companyId],
    queryFn: () => listCompanyMembers(),
    enabled: !!companyId,
  });
  const invitesQ = useQuery({
    queryKey: ["tenant:invitations", companyId],
    queryFn: () => listCompanyInvitations(),
    enabled: !!companyId,
  });

  const members = (membersQ.data ?? []) as CompanyMember[];
  const invites = (invitesQ.data ?? []) as CompanyInvitation[];
  const pendingInvites = invites.filter((i) => !i.accepted_at);

  const stats = React.useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.active).length;
    const admins = members.filter((m) => m.role === "owner" || m.role === "admin").length;
    const lastJoin = members
      .map((m) => m.joined_at)
      .filter(Boolean)
      .sort()
      .reverse()[0];
    return { total, active, admins, pending: pendingInvites.length, lastJoin };
  }, [members, pendingInvites]);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total de membros"
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Ativos"
          value={stats.active}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="Administradores"
          value={stats.admins}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="Convites pendentes"
          value={stats.pending}
          icon={<Mail className="h-4 w-4" />}
        />
        <MetricCard
          label="Último ingresso"
          value={formatDate(stats.lastJoin ?? null)}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="invites">
            Convites {pendingInvites.length > 0 && `(${pendingInvites.length})`}
          </TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersTab members={members} loading={membersQ.isLoading} canManage={canManage} />
        </TabsContent>
        <TabsContent value="invites" className="mt-4">
          <InvitesTab invites={invites} loading={invitesQ.isLoading} canManage={canManage} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <SessionsTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================== MEMBERS ============================== */

function MembersTab({
  members,
  loading,
  canManage,
}: {
  members: CompanyMember[];
  loading: boolean;
  canManage: boolean;
}) {
  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.user_id.toLowerCase().includes(q) || m.role.toLowerCase().includes(q),
    );
  }, [members, search]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />;
  }

  return (
    <div className="space-y-3">
      <SearchInput
        placeholder="Buscar membro por ID ou papel…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <DataTable
        data={filtered}
        getRowKey={(r) => r.id}
        empty={<EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum membro" />}
        columns={[
          {
            id: "user",
            header: "Usuário",
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
                  {r.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs text-foreground">{r.user_id}</div>
                  <div className="text-xs text-muted-foreground">
                    Ingresso: {formatDate(r.joined_at)}
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: "role",
            header: "Papel",
            cell: (r) => <StatusBadge tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role]}</StatusBadge>,
          },
          {
            id: "status",
            header: "Status",
            cell: (r) => (
              <StatusBadge tone={r.active ? "success" : "neutral"}>
                {r.active ? "ativo" : "inativo"}
              </StatusBadge>
            ),
          },
          {
            id: "actions",
            header: "",
            align: "right",
            cell: (r) => (canManage ? <MemberActions member={r} /> : null),
          },
        ]}
      />
    </div>
  );
}

function MemberActions({ member }: { member: CompanyMember }) {
  const qc = useQueryClient();
  const updateRoleFn = useServerFn(updateMemberRole);
  const setActiveFn = useServerFn(setMemberActive);
  const { activeCompany } = useTenant();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["tenant:members", activeCompany?.id] });

  const roleMut = useMutation({
    mutationFn: (role: TenantRole) =>
      updateRoleFn({ data: { memberId: member.id, role } } as never),
    onSuccess: () => {
      toast.success("Papel atualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const activeMut = useMutation({
    mutationFn: (active: boolean) =>
      setActiveFn({ data: { memberId: member.id, active } } as never),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["admin", "manager", "member"] as TenantRole[]).map((r) => (
          <DropdownMenuItem
            key={r}
            disabled={member.role === r || roleMut.isPending}
            onClick={() => roleMut.mutate(r)}
          >
            Definir como {ROLE_LABEL[r]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => activeMut.mutate(!member.active)}
          disabled={activeMut.isPending}
        >
          {member.active ? "Desativar" : "Reativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================== INVITE DIALOG ============================== */

function InviteMemberButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Convidar membro
      </Button>
      <InviteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const { activeCompany } = useTenant();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "manager" | "member">("member");
  const fn = useServerFn(inviteMember);
  const mut = useMutation({
    mutationFn: () => fn({ data: { email, role } } as never),
    onSuccess: () => {
      toast.success("Convite enviado");
      qc.invalidateQueries({ queryKey: ["tenant:invitations", activeCompany?.id] });
      setEmail("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Envie um convite para juntar-se a {activeCompany?.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="pessoa@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — acesso total exceto owner</SelectItem>
                <SelectItem value="manager">Manager — gestão operacional</SelectItem>
                <SelectItem value="member">Membro — acesso padrão</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={!email || mut.isPending}>
            {mut.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== INVITES TAB ============================== */

function InvitesTab({
  invites,
  loading,
  canManage,
}: {
  invites: CompanyInvitation[];
  loading: boolean;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const { activeCompany } = useTenant();
  const cancelFn = useServerFn(cancelInvitation);
  const resendFn = useServerFn(resendInvitation);
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["tenant:invitations", activeCompany?.id] });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { invitationId: id } } as never),
    onSuccess: () => {
      toast.success("Convite cancelado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const resendMut = useMutation({
    mutationFn: (id: string) => resendFn({ data: { invitationId: id } } as never),
    onSuccess: () => {
      toast.success("Convite reenviado — novo link gerado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />;
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copiado"),
      () => toast.error("Falha ao copiar"),
    );
  };

  return (
    <DataTable
      data={invites}
      getRowKey={(r) => r.id}
      empty={
        <EmptyState
          icon={<Mail className="h-6 w-6" />}
          title="Nenhum convite"
          description="Convide sua equipe para começar a colaborar."
        />
      }
      columns={[
        {
          id: "email",
          header: "E-mail",
          cell: (r) => <span className="text-foreground">{r.email}</span>,
        },
        {
          id: "role",
          header: "Papel",
          cell: (r) => <StatusBadge tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role]}</StatusBadge>,
        },
        {
          id: "status",
          header: "Status",
          cell: (r) =>
            r.accepted_at ? (
              <StatusBadge tone="success">aceito</StatusBadge>
            ) : new Date(r.expires_at) < new Date() ? (
              <StatusBadge tone="danger">expirado</StatusBadge>
            ) : (
              <StatusBadge tone="warning">pendente</StatusBadge>
            ),
        },
        { id: "expires", header: "Expira em", cell: (r) => formatDate(r.expires_at) },
        { id: "created", header: "Enviado", cell: (r) => formatDate(r.created_at) },
        {
          id: "actions",
          header: "",
          align: "right",
          cell: (r) =>
            r.accepted_at || !canManage ? null : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copyLink(r.token)}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => resendMut.mutate(r.id)}
                    disabled={resendMut.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Reenviar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => cancelMut.mutate(r.id)}
                    disabled={cancelMut.isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
        },
      ]}
    />
  );
}

/* ============================== SESSIONS ============================== */

function SessionsTab({ canManage }: { canManage: boolean }) {
  return (
    <React.Suspense
      fallback={<div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />}
    >
      <SessionsList canManage={canManage} />
    </React.Suspense>
  );
}

function SessionsList({ canManage }: { canManage: boolean }) {
  const { data } = useSecuritySnapshot();
  const revoke = useRevokeSession();
  const sessions = data.sessions.filter((s) => s.active);

  return (
    <DataTable
      data={sessions}
      getRowKey={(r) => r.id}
      empty={
        <EmptyState
          icon={<Monitor className="h-6 w-6" />}
          title="Nenhuma sessão ativa"
          description="Sessões aparecerão aqui quando membros acessarem a plataforma."
        />
      }
      columns={[
        {
          id: "user",
          header: "Usuário",
          cell: (r) => <span className="font-mono text-xs">{r.userId}</span>,
        },
        { id: "device", header: "Dispositivo", cell: (r) => r.userAgent ?? "—" },
        { id: "ip", header: "IP", cell: (r) => r.ip ?? "—" },
        { id: "location", header: "Localização", cell: (r) => r.location ?? "—" },
        { id: "last", header: "Última atividade", cell: (r) => formatDate(r.lastSeenAt) },
        {
          id: "actions",
          header: "",
          align: "right",
          cell: (r) =>
            canManage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revoke.mutate({ sessionId: r.id, reason: "admin_revoked" })}
                disabled={revoke.isPending}
              >
                Revogar
              </Button>
            ) : null,
        },
      ]}
    />
  );
}

/* ============================== AUDIT ============================== */

function AuditTab() {
  const { data, isLoading } = useAudit();
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />;
  }
  const entries = [...(data ?? [])];
  return (
    <DataTable
      data={entries}
      getRowKey={(r, i) => (r as { id?: string }).id ?? i}
      empty={
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Sem eventos de auditoria"
          description="Ações da equipe aparecerão aqui em tempo real."
        />
      }
      columns={[
        {
          id: "when",
          header: "Quando",
          cell: (r) => formatDate((r as { createdAt?: string }).createdAt ?? null),
        },
        {
          id: "actor",
          header: "Ator",
          cell: (r) =>
            (r as { actorEmail?: string | null; actorId?: string | null }).actorEmail ??
            (r as { actorId?: string | null }).actorId ??
            "sistema",
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
      ]}
    />
  );
}
