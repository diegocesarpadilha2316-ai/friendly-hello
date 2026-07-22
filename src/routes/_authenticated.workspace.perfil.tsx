import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Laptop, ShieldCheck, UserCircle } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  FormSection,
  DataTable,
  StatusBadge,
  MetricCard,
} from "@/core/components/ui-kit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOptionalAuth } from "@/core/hooks";
import {
  useSecuritySnapshot,
  useRevokeSession,
  useGlobalLogout,
} from "@/core/security/use-security";

export const Route = createFileRoute("/_authenticated/workspace/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Workspace | Dioris Hub" },
      { name: "description", content: "Dados do usuário autenticado no Workspace Dioris." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePerfil,
});

function WorkspacePerfil() {
  const auth = useOptionalAuth();
  const security = useSecuritySnapshot();
  const revokeSession = useRevokeSession();
  const globalLogout = useGlobalLogout();

  if (!auth?.user) {
    return (
      <PageContainer>
        <EmptyState icon={<UserCircle className="h-6 w-6" />} title="Sessão não encontrada" />
      </PageContainer>
    );
  }

  const snap = security.data;
  const sessions = snap?.sessions ?? [];
  const devices = snap?.devices ?? [];
  const mfa = snap?.mfaFactors ?? [];
  const initials = (auth.user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Perfil"
        description={auth.user.email ?? ""}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              globalLogout.mutate({}, {
                onSuccess: () => toast.success("Sessões encerradas"),
                onError: (e) => toast.error((e as Error).message),
              })
            }
            disabled={globalLogout.isPending}
          >
            Encerrar todas as sessões
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-4 rounded-lg border border-border/60 bg-card/30 p-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{auth.user.email}</p>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{auth.user.id}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
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
        />
        <MetricCard
          icon={<KeyRound className="h-4 w-4" />}
          label="Sessões ativas"
          value={sessions.length.toString()}
        />
      </div>

      <div className="mt-8 space-y-8">
        <FormSection title="Identidade" description="Dados básicos do provedor de autenticação.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">E-mail</dt>
              <dd>{auth.user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">User ID</dt>
              <dd className="font-mono text-xs">{auth.user.id}</dd>
            </div>
          </dl>
        </FormSection>

        <FormSection title="Sessões" description="Encerre sessões suspeitas remotamente.">
          {sessions.length === 0 ? (
            <EmptyState icon={<KeyRound className="h-5 w-5" />} title="Nenhuma sessão ativa" />
          ) : (
            <DataTable
              data={sessions}
              columns={[
                { id: "device", header: "Dispositivo", cell: (r) => r.userAgent ?? "—" },
                { id: "ip", header: "IP", cell: (r) => <span className="font-mono text-xs">{r.ip ?? "—"}</span> },
                {
                  id: "since",
                  header: "Iniciada",
                  cell: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "—"),
                },
                {
                  id: "actions",
                  header: "",
                  align: "right",
                  cell: (r) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        revokeSession.mutate({ sessionId: r.id }, {
                          onSuccess: () => toast.success("Sessão revogada"),
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                      disabled={revokeSession.isPending}
                    >
                      Revogar
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </FormSection>

        <FormSection title="MFA" description="Fatores de autenticação em dois passos.">
          {mfa.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="MFA não configurado" description="Configure MFA no centro de segurança." />
          ) : (
            <ul className="divide-y divide-border/60 rounded-md border border-border/60">
              {mfa.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{f.method}{f.label ? ` · ${f.label}` : ""}</span>
                  <StatusBadge tone={f.enabled ? "success" : "neutral"}>{f.enabled ? "ativo" : "inativo"}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </FormSection>
      </div>
    </PageContainer>
  );
}