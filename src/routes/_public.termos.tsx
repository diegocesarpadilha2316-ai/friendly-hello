import { createFileRoute } from "@tanstack/react-router";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Dioris" },
      { name: "description", content: "Termos e condições de uso da plataforma Dioris." },
      { property: "og:title", content: "Termos Dioris" },
      { property: "og:description", content: "Termos de uso." },
      { property: "og:url", content: "/termos" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: Page,
});

const items: [string, string][] = [
  [
    "1. Aceitação",
    "Ao acessar ou usar a plataforma Dioris você concorda com estes Termos. Se não concordar, não utilize.",
  ],
  [
    "2. Conta",
    "Você é responsável por manter suas credenciais seguras e por toda atividade em sua conta.",
  ],
  [
    "3. Uso permitido",
    "É proibido usar a plataforma para atividades ilegais, abusivas ou que violem direitos de terceiros.",
  ],
  [
    "4. Créditos e cobrança",
    "Créditos são consumidos conforme uso da plataforma. Assinaturas são renovadas automaticamente até cancelamento.",
  ],
  [
    "5. Propriedade intelectual",
    "A plataforma, marca, código e conteúdos são propriedade da Dioris. Seus dados permanecem seus.",
  ],
  [
    "6. Limitação de responsabilidade",
    "A plataforma é fornecida 'como está'. Trabalhamos para máxima disponibilidade, sem garantia absoluta.",
  ],
  [
    "7. Encerramento",
    "Você pode cancelar a qualquer momento. Podemos suspender contas em violação destes Termos.",
  ],
  ["8. Lei aplicável", "Estes Termos são regidos pelas leis brasileiras."],
];

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Termos de <GradientText>uso</GradientText>.
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
