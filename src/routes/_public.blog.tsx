import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Dioris" },
      { name: "description", content: "Novidades, guias, casos de uso e bastidores do ecossistema Dioris." },
      { property: "og:title", content: "Blog Dioris" },
      { property: "og:description", content: "Novidades e insights." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Page,
});

const posts = [
  { cat: "Produto", t: "Apresentando o ecossistema Dioris", d: "O que muda quando um único Core alimenta 7 produtos.", date: "2026-07-23", read: "5 min" },
  { cat: "Engenharia", t: "Multi-tenant com RLS por padrão", d: "Como isolamos dados por empresa desde o dia 1.", date: "2026-07-20", read: "8 min" },
  { cat: "IA", t: "Gateway de IA com créditos unificados", d: "Um único ledger para todos os modelos e provedores.", date: "2026-07-15", read: "6 min" },
  { cat: "Produto", t: "Planner: do briefing à fábrica", d: "Como o Planner conecta projeto, orçamento e produção.", date: "2026-07-10", read: "7 min" },
  { cat: "Empresa", t: "Nossos valores enterprise", d: "Excelência técnica, obsessão pelo cliente, velocidade.", date: "2026-07-05", read: "4 min" },
  { cat: "Engenharia", t: "Observabilidade em cada camada", d: "Logs, métricas, health checks e SLOs no Core.", date: "2026-07-01", read: "6 min" },
];

const cats = ["Todos", "Produto", "Engenharia", "IA", "Empresa"];

function Page() {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const filtered = posts.filter((p) => (cat === "Todos" || p.cat === cat) && (p.t + p.d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Blog</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Novidades e <GradientText>insights</GradientText>.
        </h1>
      </Reveal>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artigos..." className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60" />
        </div>
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${cat === c ? "bg-white/15 text-foreground" : "text-foreground/60 hover:bg-white/5"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Reveal key={p.t}>
            <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-primary/40">
              <div className="aspect-video bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30" />
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{p.cat}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                  <span>· {p.read}</span>
                </div>
                <h3 className="mt-3 font-bold">{p.t}</h3>
                <p className="mt-1.5 text-sm text-foreground/70">{p.d}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}