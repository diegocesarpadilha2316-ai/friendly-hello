import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de reembolso — Dioris" },
      {
        name: "description",
        content:
          "Regras de reembolso e cancelamento de planos e créditos na plataforma Dioris.",
      },
      { property: "og:title", content: "Política de reembolso Dioris" },
      {
        property: "og:description",
        content: "Regras claras de reembolso e cancelamento na Dioris.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/reembolso" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/reembolso" }],
  }),
  component: Page,
});

const items: [string, string][] = [
  [
    "1. Direito de arrependimento (7 dias)",
    "Nos primeiros 7 dias corridos após a contratação de qualquer plano pago, você pode solicitar reembolso integral, conforme o Código de Defesa do Consumidor. Basta escrever para financeiro@dioris.com com o CNPJ/CPF do titular.",
  ],
  [
    "2. Assinaturas mensais",
    "O cancelamento pode ser feito a qualquer momento no painel em Workspace → Assinatura. O acesso permanece ativo até o fim do ciclo já pago — sem cobranças futuras.",
  ],
  [
    "3. Assinaturas anuais",
    "Além do direito de arrependimento de 7 dias, oferecemos reembolso proporcional dos meses não usufruídos, mediante solicitação. Descontos promocionais concedidos no anual são estornados do cálculo.",
  ],
  [
    "4. Pacotes de créditos",
    "Créditos comprados avulsos são reembolsáveis apenas se nenhum crédito do pacote tiver sido consumido, respeitando o prazo de 7 dias. Créditos parcialmente usados não são estornáveis, mas nunca expiram.",
  ],
  [
    "5. Estornos via Pix / boleto / cartão",
    "Reembolsos são processados pelo mesmo meio da compra. Pix e boleto: até 5 dias úteis. Cartão de crédito: até 2 faturas, conforme prazo da operadora.",
  ],
  [
    "6. Casos não elegíveis",
    "Não são reembolsáveis: (a) créditos já consumidos por chamadas de IA ou renderização, (b) tarifas de conveniência de meios de pagamento, (c) planos personalizados Enterprise fora do prazo contratual acordado.",
  ],
  [
    "7. Suspensão por uso indevido",
    "Contas suspensas por violação dos Termos de Uso, fraude ou chargeback abusivo não têm direito a reembolso proporcional.",
  ],
  [
    "8. Contato",
    "Todas as solicitações passam por financeiro@dioris.com. Responderemos em até 2 dias úteis com o status e o prazo de estorno.",
  ],
];

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Política de <GradientText>reembolso</GradientText>.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Última atualização: 25 de julho de 2026
        </p>
      </Reveal>
      <div className="mt-12 space-y-6 text-foreground/80">
        {items.map(([t, d]) => (
          <section key={t}>
            <h2 className="text-lg font-bold text-foreground">{t}</h2>
            <p className="mt-2 text-sm leading-relaxed">{d}</p>
          </section>
        ))}
      </div>
    </div>
  );
}