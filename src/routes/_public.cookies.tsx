import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/cookies")({
  head: () => ({
    meta: [
      { title: "Política de cookies — Dioris" },
      {
        name: "description",
        content:
          "Como a Dioris usa cookies e tecnologias similares para operar a plataforma, medir uso e melhorar a experiência.",
      },
      { property: "og:title", content: "Política de cookies Dioris" },
      {
        property: "og:description",
        content: "Cookies essenciais e opcionais, e como gerenciar suas preferências.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/cookies" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Page,
});

const sections: { t: string; d: string }[] = [
  {
    t: "1. O que são cookies",
    d: "Cookies são pequenos arquivos gravados no seu dispositivo pelo navegador quando você visita um site. Também usamos tecnologias equivalentes (localStorage, sessionStorage e IndexedDB) para armazenar preferências e sessões.",
  },
  {
    t: "2. Cookies essenciais (sempre ativos)",
    d: "Necessários para autenticação, segurança da sessão, roteamento e persistência do editor Planner. Sem eles a plataforma não funciona. Base legal: execução de contrato e legítimo interesse (LGPD art. 7º, V e IX).",
  },
  {
    t: "3. Cookies de preferência",
    d: "Guardam configurações como tema, idioma, layout do editor CAD, favoritos da biblioteca e projetos abertos recentemente. Base legal: legítimo interesse — melhoram a experiência sem coletar dados sensíveis.",
  },
  {
    t: "4. Cookies analíticos (opcionais)",
    d: "Ajudam a entender uso agregado da plataforma (páginas visitadas, funcionalidades acessadas, erros). Só são ativados após seu consentimento explícito via banner de cookies. Base legal: consentimento (LGPD art. 7º, I).",
  },
  {
    t: "5. Cookies de terceiros",
    d: "Podemos carregar recursos de parceiros de pagamento (Mercado Pago, Stripe) durante o checkout transparente. Esses provedores usam cookies próprios apenas para prevenção de fraude na transação em curso — nunca para publicidade.",
  },
  {
    t: "6. Como gerenciar",
    d: "Você pode aceitar ou recusar cookies opcionais pelo banner exibido no primeiro acesso, revisar a decisão limpando o armazenamento do site pelo seu navegador, ou bloquear cookies globalmente nas configurações do navegador (isso pode desabilitar funcionalidades essenciais).",
  },
  {
    t: "7. Retenção",
    d: "Cookies de sessão expiram ao fechar o navegador. Cookies persistentes duram entre 30 dias e 12 meses, conforme a finalidade. Preferências ficam até serem alteradas por você.",
  },
  {
    t: "8. Seus direitos LGPD",
    d: "Você tem direito a confirmar existência de tratamento, acessar, corrigir, anonimizar, portar e eliminar dados, bem como revogar o consentimento a qualquer momento — sem prejuízo dos cookies essenciais. Contato do encarregado (DPO): privacidade@dioris.com.",
  },
  {
    t: "9. Atualizações desta política",
    d: "Podemos atualizar esta política para refletir mudanças legais ou técnicas. A data da última revisão aparece no topo desta página. Alterações relevantes serão comunicadas por e-mail ou notificação in-app.",
  },
];

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Política de <GradientText>cookies</GradientText>.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Última atualização: 25 de julho de 2026
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
          A Dioris usa cookies e tecnologias similares para operar a plataforma com segurança,
          lembrar suas preferências e — apenas com o seu consentimento — entender o uso agregado
          para melhorar a experiência.
        </p>
      </Reveal>
      <div className="mt-12 space-y-6 text-foreground/80">
        {sections.map(({ t, d }) => (
          <section key={t}>
            <h2 className="text-lg font-bold text-foreground">{t}</h2>
            <p className="mt-2 text-sm leading-relaxed">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
