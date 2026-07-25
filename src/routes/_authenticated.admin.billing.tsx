import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { app } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/core/components/ui-kit";
import { useIsPlatformAdmin } from "@/core/hooks";
import {
  listPaymentProviders,
  updatePaymentProvider,
  type PaymentProviderDTO,
} from "@/lib/admin-billing.functions";

export const Route = createFileRoute("/_authenticated/admin/billing")({
  head: () => ({
    meta: [
      { title: `${app.name} — Cobrança & Provedores (Admin)` },
      {
        name: "description",
        content:
          "Gestão dos provedores de pagamento da plataforma Dioris: Mercado Pago, Stripe, Paddle, Asaas, Efí, Pagar.me e outros. Acesso restrito ao administrador da plataforma.",
      },
      { property: "og:title", content: `${app.name} — Cobrança & Provedores` },
      {
        property: "og:description",
        content: "Configuração de provedores de pagamento (Pix, boleto, cartão, assinatura).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBillingPage,
});

function AdminBillingPage() {
  const { isAdmin, loading } = useIsPlatformAdmin();
  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando permissões…
        </div>
      </PageContainer>
    );
  }
  if (!isAdmin) return <AccessDenied />;
  return <AdminBillingContent />;
}

function AccessDenied() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8 text-destructive" />}
          title="Acesso restrito"
          description="A configuração de provedores de pagamento é gerenciada apenas pelo administrador da plataforma."
          action={
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Admin Center
            </Link>
          }
        />
      </div>
    </PageContainer>
  );
}

function AdminBillingContent() {
  const list = useServerFn(listPaymentProviders);
  const query = useQuery({ queryKey: ["admin", "payment-providers"], queryFn: () => list() });

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link to="/admin" className="inline-flex items-center gap-1 hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Admin Center
          </Link>
        }
        title="Cobrança & Provedores de Pagamento"
        description="Configure os provedores que a plataforma vai oferecer aos clientes. Pix, boleto, cartão e assinatura recorrente."
      />

      <div className="mt-6 rounded-2xl border border-border/50 bg-card/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p className="text-foreground">
              Cada provedor é um adaptador plugável. Chaves secretas (Access Token, Secret Key, etc.)
              ficam armazenadas com segurança no cofre da plataforma —{" "}
              <strong className="text-foreground">nunca no banco</strong>.
            </p>
            <p className="mt-1">
              Preencha aqui o modo (sandbox/live), a chave pública e ative quando estiver pronto.
              A URL do webhook é gerada automaticamente e você cola no painel do provedor.
            </p>
            <p className="mt-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px] text-primary">
              <strong>Modo padrão: Checkout Transparente.</strong> Todo pagamento (Pix, cartão, boleto,
              assinatura) roda inline dentro da Dioris via SDK do provedor — nunca redireciona para
              Checkout Pro / hosted checkout. Isso preserva marca, UX e conversão.
            </p>
          </div>
        </div>
      </div>

      {query.isLoading && (
        <div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando provedores…
        </div>
      )}

      {query.error && (
        <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> Erro ao carregar provedores
          </div>
          <p className="mt-2 text-destructive/80">
            {(query.error as Error).message}
          </p>
          <p className="mt-2 text-xs text-destructive/70">
            Se a mensagem citar a tabela <code>payment_providers</code>, rode a migration
            <code className="mx-1 rounded bg-destructive/10 px-1">db/migrations/042_payment_providers.sql</code>
            no Supabase.
          </p>
        </div>
      )}

      {query.data && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.providers.map((p) => (
            <ProviderCard key={p.code} provider={p} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function ProviderCard({ provider }: { provider: PaymentProviderDTO }) {
  const qc = useQueryClient();
  const update = useServerFn(updatePaymentProvider);
  const [open, setOpen] = useState(false);
  const [publicKey, setPublicKey] = useState(provider.publicKey ?? "");
  const [notes, setNotes] = useState(provider.notes ?? "");
  const [mode, setMode] = useState<"sandbox" | "live">(provider.mode);

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof update>[0] extends undefined ? never : any) =>
      update({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment-providers"] }),
  });

  const webhookUrl = provider.webhookUrl ??
    `${typeof window !== "undefined" ? window.location.origin : ""}/api/public/webhooks/${provider.code}`;

  const statusTone: "success" | "warning" | "danger" | "neutral" =
    provider.status === "live"
      ? "success"
      : provider.status === "test"
        ? "warning"
        : provider.status === "error"
          ? "danger"
          : "neutral";

  const statusLabel =
    provider.status === "not_configured"
      ? "Não configurado"
      : provider.status === "test"
        ? "Modo teste"
        : provider.status === "live"
          ? "Ao vivo"
          : provider.status === "error"
            ? "Erro"
            : "Desativado";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">{provider.name}</h3>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {provider.region} · {provider.methods.join(" · ")}
          </p>
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </header>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ativo</span>
        <button
          onClick={() =>
            mutation.mutate({
              code: provider.code,
              enabled: !provider.enabled,
              status: !provider.enabled ? (provider.publicKey ? "test" : "not_configured") : "disabled",
            })
          }
          className={`relative h-6 w-11 rounded-full transition ${
            provider.enabled ? "bg-primary" : "bg-muted"
          }`}
          disabled={mutation.isPending}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${
              provider.enabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm hover:border-primary/50"
      >
        <span>{open ? "Ocultar configuração" : "Configurar"}</span>
        <Settings2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Modo</label>
            <div className="flex gap-2">
              {(["sandbox", "live"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    mode === m
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border/60 bg-background/40 text-muted-foreground"
                  }`}
                >
                  {m === "sandbox" ? "Sandbox / Teste" : "Live / Produção"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Public Key
            </label>
            <input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="APP_USR-... (visível no front)"
              className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs font-mono outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Chaves secretas necessárias
            </label>
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-3">
              <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                {provider.secretEnvNames.map((name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Adicione essas chaves no cofre de secrets da plataforma quando quiser ativar.
                Depois volte aqui e ligue o toggle.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              URL do Webhook (cole no painel do provedor)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-border/60 bg-background/40 px-2 py-1.5 text-[11px]">
                {webhookUrl}
              </code>
              <button
                onClick={() => navigator.clipboard?.writeText(webhookUrl)}
                className="rounded-lg border border-border/60 bg-background/40 p-1.5 hover:border-primary/50"
                title="Copiar"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Anotações internas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: taxas negociadas, contato comercial, MID, etc."
              className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs outline-none focus:border-primary/60"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() =>
                mutation.mutate({
                  code: provider.code,
                  mode,
                  publicKey: publicKey.trim() || null,
                  notes: notes.trim() || null,
                })
              }
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? "Salvando…" : "Salvar configuração"}
            </button>
          </div>

          {mutation.isSuccess && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <CheckCircle2 className="h-3 w-3" /> Salvo
            </div>
          )}
          {mutation.isError && (
            <div className="flex items-center gap-1.5 text-[11px] text-destructive">
              <XCircle className="h-3 w-3" /> {(mutation.error as Error).message}
            </div>
          )}

          <a
            href={providerDocsUrl(provider.code)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
          >
            Documentação do provedor <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function providerDocsUrl(code: string): string {
  switch (code) {
    case "mercadopago":
      return "https://www.mercadopago.com.br/developers/pt/docs";
    case "asaas":
      return "https://docs.asaas.com/";
    case "efi":
      return "https://dev.efipay.com.br/";
    case "pagarme":
      return "https://docs.pagar.me/";
    case "pagseguro":
      return "https://dev.pagbank.uol.com.br/";
    case "cielo":
      return "https://developercielo.github.io/";
    case "stripe":
      return "https://stripe.com/docs";
    case "paddle":
      return "https://developer.paddle.com/";
    default:
      return "#";
  }
}