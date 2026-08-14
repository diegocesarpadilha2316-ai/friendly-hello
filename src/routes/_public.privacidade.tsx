import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e LGPD — Dioris" },
      { name: "description", content: "Política de Privacidade e conformidade com a LGPD." },
      { property: "og:title", content: "Privacidade Dioris" },
      { property: "og:description", content: "Política de Privacidade e LGPD." },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: Page,
});

const items: [string, string][] = [
  [
    "1. Dados coletados",
    "Coletamos dados de conta, uso da plataforma, faturamento e conteúdos que você cria.",
  ],
  [
    "2. Uso dos dados",
    "Utilizamos seus dados para operar a plataforma, faturar, oferecer suporte e melhorar produtos.",
  ],
  [
    "3. Compartilhamento",
    "Não vendemos seus dados. Compartilhamos com processadores estritamente necessários (infra, pagamento).",
  ],
  [
    "4. Direitos LGPD",
    "Você tem direito de acessar, corrigir, portar, anonimizar e excluir seus dados a qualquer momento.",
  ],
  [
    "5. Segurança",
    "Aplicamos criptografia em trânsito e repouso, RLS por tenant, MFA, auditoria e monitoramento contínuo.",
  ],
  [
    "6. Retenção",
    "Mantemos seus dados enquanto sua conta existir. Você pode solicitar exclusão a qualquer momento.",
  ],
  ["7. Encarregado (DPO)", "Contato: privacidade@dioris.com"],
];

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Política de <GradientText>privacidade</GradientText>.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Última atualização: 23 de julho de 2026
        </p>
      </Reveal>
      <div className="mt-12 space-y-6 text-foreground/80">
        {items.map(([t, d]) => (
          <section key={t}>
            <h2 className="text-xl font-bold text-foreground">{t}</h2>
            <p className="mt-2">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
