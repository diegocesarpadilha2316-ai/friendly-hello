import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import { Shield, Lock, KeyRound, Database, ServerCog, Eye, FileCheck2, AlertTriangle, Users2, Cloud, RefreshCw, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_public/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança e conformidade — Dioris" },
      { name: "description", content: "Como a Dioris protege seus dados: criptografia, RLS multi-tenant, LGPD, MFA, auditoria contínua e observabilidade 24/7." },
      { property: "og:title", content: "Trust Center Dioris" },
      { property: "og:description", content: "Postura de segurança da plataforma Dioris." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/seguranca" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/seguranca" }],
  }),
  component: Page,
});

const pillars = [
  { icon: Lock, title: "Criptografia forte", desc: "TLS 1.3 em trânsito e AES-256 em repouso para todos os dados sensíveis." },
  { icon: Database, title: "Isolamento multi-tenant", desc: "Row-Level Security em cada tabela — nenhum tenant vê dados de outro." },
  { icon: KeyRound, title: "Autenticação robusta", desc: "MFA opcional, sessões rotativas, revogação instantânea e login social auditado." },
  { icon: Users2, title: "RBAC granular", desc: "Papéis Owner, Admin, Editor e Viewer com permissões finas por módulo." },
  { icon: Eye, title: "Auditoria contínua", desc: "Todos os eventos críticos registrados em audit log imutável com retenção de 12 meses." },
  { icon: ServerCog, title: "Infra gerenciada", desc: "Runtime edge em Cloudflare Workers, banco Postgres gerenciado, backups automáticos." },
  { icon: Cloud, title: "Backups & DR", desc: "PITR (point-in-time recovery) e snapshots diários com replicação geográfica." },
  { icon: AlertTriangle, title: "Monitoramento 24/7", desc: "Alertas em tempo real de erros, latência anômala e picos de consumo." },
  { icon: FileCheck2, title: "LGPD-first", desc: "Direitos do titular (acesso, portabilidade, exclusão) atendidos em até 15 dias." },
  { icon: ScrollText, title: "Políticas transparentes", desc: "Termos, Privacidade, Cookies e Reembolso publicados e versionados." },
  { icon: RefreshCw, title: "Patch discipline", desc: "Dependências monitoradas continuamente; correções críticas em janelas curtas." },
  { icon: Shield, title: "IA responsável", desc: "Prompts e outputs não usados para treinar modelos de terceiros por padrão." },
];

const commitments: [string, string][] = [
  ["Dados do cliente", "Seus projetos, arquivos e conteúdos são exclusivamente seus. Você exporta ou exclui quando quiser."],
  ["Sub-processadores", "Trabalhamos apenas com provedores auditados (infra, e-mail, pagamentos). Lista disponível sob solicitação."],
  ["Retenção", "Dados são mantidos enquanto sua conta existir. Após exclusão, remoção definitiva em até 30 dias."],
  ["Divulgação responsável", "Vulnerabilidades podem ser reportadas em segurança@dioris.com — resposta em até 48h úteis."],
];

function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Trust Center</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Segurança de <GradientText>nível enterprise</GradientText>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          A Dioris foi desenhada desde o primeiro dia para operar dados críticos de empresas — com criptografia,
          isolamento por tenant, auditoria contínua e conformidade LGPD.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map(({ icon: Icon, title, desc }) => (
          <Reveal key={title}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-primary/40 hover:bg-white/[0.04]">
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl sm:p-12">
          <SectionEyebrow>Compromissos</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            O que garantimos, <GradientText>por escrito</GradientText>.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {commitments.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-background/40 p-5">
                <h3 className="text-sm font-semibold text-foreground">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-primary/30 bg-primary/[0.06] p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Precisa de um DPA ou questionário de segurança?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Empresas em planos Business e Enterprise recebem DPA assinado e resposta a questionários de compliance.
            </p>
          </div>
          <a
            href="mailto:seguranca@dioris.com"
            className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
          >
            Falar com segurança
          </a>
        </div>
      </Reveal>
    </div>
  );
}