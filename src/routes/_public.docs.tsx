import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Book, Rocket, KeyRound, Code2, Sparkles } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";

export const Route = createFileRoute("/_public/docs")({
  head: () => ({
    meta: [
      { title: "Documentação — Dioris" },
      { name: "description", content: "Guias, referência de API, SDK e exemplos para desenvolvedores." },
      { property: "og:title", content: "Documentação Dioris" },
      { property: "og:description", content: "Guias, SDK, API e exemplos." },
      { property: "og:url", content: "/docs" },
    ],
    links: [{ rel: "canonical", href: "/docs" }],
  }),
  component: Page,
});

const sections = [
  { icon: Rocket, t: "Começando", d: "Crie sua conta, empresa e primeiro projeto.", tag: "Guia" },
  { icon: Book, t: "Conceitos", d: "Tenants, RBAC, créditos, eventos e observabilidade.", tag: "Guia" },
  { icon: KeyRound, t: "Autenticação", d: "Fluxos, MFA e sessões.", tag: "Guia" },
  { icon: Code2, t: "API Reference", d: "Endpoints REST versionados.", tag: "Ref" },
  { icon: Code2, t: "SDK TypeScript", d: "Cliente oficial da plataforma.", tag: "Ref" },
  { icon: Sparkles, t: "IA Gateway", d: "Chamadas multi-modelo com créditos.", tag: "Guia" },
  { icon: Book, t: "Storage", d: "Upload, versionamento e signed URLs.", tag: "Guia" },
  { icon: Book, t: "Eventos", d: "Barramento e assinaturas.", tag: "Guia" },
];

function Page() {
  const [q, setQ] = useState("");
  const filtered = sections.filter((s) => (s.t + s.d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionEyebrow>Documentação</SectionEyebrow>
        <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
          Docs, <GradientText>SDK e API</GradientText>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-foreground/70">
          Aprenda a construir sobre o Core Dioris.
        </p>
        <div className="mt-8 relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar na documentação..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
        </div>
      </Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link key={s.t} to="/docs" className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-primary/40 hover:bg-white/5">
            <div className="flex items-start justify-between">
              <s.icon className="h-6 w-6 text-primary" />
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{s.tag}</span>
            </div>
            <h3 className="mt-4 font-bold">{s.t}</h3>
            <p className="mt-1.5 text-sm text-foreground/70">{s.d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}