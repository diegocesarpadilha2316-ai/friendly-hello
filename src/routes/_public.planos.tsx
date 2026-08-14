import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Sparkles, Coins, Loader2 } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import {
  listPublicPlans,
  listPublicCreditPacks,
  type PublicPlanDTO,
  type PublicCreditPackDTO,
} from "@/lib/public-catalog.functions";

export const Route = createFileRoute("/_public/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Preços — Dioris" },
      {
        name: "description",
        content:
          "Free, Starter, Professional, Business e Enterprise. Créditos, IA, storage e usuários inclusos.",
      },
      { property: "og:title", content: "Planos e Preços Dioris" },
      { property: "og:description", content: "Escolha o plano ideal para sua empresa." },
      { property: "og:url", content: "/planos" },
    ],
    links: [{ rel: "canonical", href: "/planos" }],
  }),
  component: Page,
});

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "Para explorar a plataforma",
  starter: "Para times pequenos",
  professional: "Para negócios em crescimento",
  business: "Para equipes escalando",
  enterprise: "Para operações críticas",
  custom: "Solução dedicada sob contrato",
};
const PLAN_FEATURED = "professional";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
function formatCredits(n: number) {
  return n.toLocaleString("pt-BR");
}

function Page() {
  const [yearly, setYearly] = useState(false);
  const [plans, setPlans] = useState<PublicPlanDTO[]>([]);
  const [packs, setPacks] = useState<PublicCreditPackDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listPublicPlans(), listPublicCreditPacks()])
      .then(([pl, pk]) => {
        if (!alive) return;
        setPlans(pl);
        setPacks(pk);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const visiblePlans = useMemo(() => plans.filter((p) => p.key !== "custom"), [plans]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="text-center">
          <SectionEyebrow>Planos</SectionEyebrow>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Preços <GradientText>transparentes</GradientText>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
            Comece grátis. Escale quando precisar. Sem surpresas na fatura.
          </p>
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!yearly ? "bg-white/10 text-foreground" : "text-foreground/60"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${yearly ? "bg-white/10 text-foreground" : "text-foreground/60"}`}
            >
              Anual <span className="ml-1 text-xs text-accent">−17%</span>
            </button>
          </div>
        </div>
      </Reveal>

      {loading ? (
        <div className="mt-24 flex items-center justify-center gap-3 text-foreground/60">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando catálogo...
        </div>
      ) : (
        <>
          <div
            className={`mt-16 grid gap-6 ${visiblePlans.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
          >
            {visiblePlans.map((p, i) => {
              const featured = p.key === PLAN_FEATURED;
              const priceMonthly = Math.round(p.priceCents / 100);
              const priceYearly = Math.round((p.priceCents * 12 * 0.83) / 100);
              const isFree = p.priceCents === 0;
              return (
                <Reveal key={p.key} delay={i * 0.03}>
                  <div
                    className={`relative flex h-full flex-col rounded-2xl border p-6 ${featured ? "border-primary/60 bg-gradient-to-b from-primary/10 to-transparent" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                        <Sparkles className="mr-1 inline h-3 w-3" /> Popular
                      </div>
                    )}
                    <div className="text-lg font-bold">{p.label}</div>
                    <div className="mt-1 text-xs text-foreground/60">
                      {PLAN_DESCRIPTIONS[p.key] ?? ""}
                    </div>
                    <div className="mt-6">
                      {isFree ? (
                        <span className="text-4xl font-black">R$ 0</span>
                      ) : (
                        <>
                          <span className="text-4xl font-black">
                            R$ {yearly ? Math.round((priceMonthly * 12 * 0.83) / 12) : priceMonthly}
                          </span>
                          <span className="text-sm text-foreground/60">/mês</span>
                          {yearly && (
                            <div className="text-xs text-foreground/60">
                              Faturado R$ {priceYearly}/ano
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <Link
                      to="/auth"
                      search={{ redirect: "/workspace" }}
                      className={`mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${featured ? "bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground shadow-lg shadow-primary/30" : "border border-white/15 bg-white/5 hover:bg-white/10"}`}
                    >
                      {isFree ? "Começar grátis" : "Assinar"}
                    </Link>
                    <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6 text-sm">
                      <li className="flex gap-2">
                        <Check className="h-4 w-4 shrink-0 text-accent" />{" "}
                        {formatCredits(p.monthlyCredits)} créditos/mês
                      </li>
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="h-4 w-4 shrink-0 text-accent" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {packs.length > 0 && (
            <Reveal>
              <div className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-accent" />
                  <h2 className="text-2xl font-black">Pacotes de créditos avulsos</h2>
                </div>
                <p className="mt-2 text-sm text-foreground/60">
                  Compre créditos on-demand via Pix. Sem assinatura, sem vencimento.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {packs.map((pk) => (
                    <div
                      key={pk.key}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="text-sm text-foreground/60">{pk.label}</div>
                      <div className="mt-2 text-3xl font-black">{formatCredits(pk.credits)}</div>
                      <div className="text-xs text-foreground/60">
                        créditos
                        {pk.bonusPct > 0 && (
                          <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                            +{pk.bonusPct}%
                          </span>
                        )}
                      </div>
                      <div className="mt-4 text-xl font-bold">{formatBRL(pk.priceCents)}</div>
                      <Link
                        to="/auth"
                        search={{ redirect: "/workspace/creditos" }}
                        className="mt-4 block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-xs font-semibold hover:bg-white/10"
                      >
                        Comprar via Pix
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}
