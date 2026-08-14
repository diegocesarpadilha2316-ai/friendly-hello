import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Calendar } from "lucide-react";
import { Reveal, GradientText, SectionEyebrow } from "@/core/components/public/PublicLayout";
import { listPublicBlogPosts, type PublicBlogPostDTO } from "@/lib/public-blog.functions";

export const Route = createFileRoute("/_public/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Dioris" },
      {
        name: "description",
        content: "Novidades, guias, casos de uso e bastidores do ecossistema Dioris.",
      },
      { property: "og:title", content: "Blog Dioris" },
      { property: "og:description", content: "Novidades e insights." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Page,
});

function Page() {
  const fetchPosts = useServerFn(listPublicBlogPosts);
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 5 * 60_000,
  });
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const cats = useMemo(() => {
    const set = new Set<string>(["Todos"]);
    posts.forEach((p) => set.add(p.category));
    return [...set];
  }, [posts]);
  const filtered = posts.filter(
    (p: PublicBlogPostDTO) =>
      (cat === "Todos" || p.category === cat) &&
      (p.title + p.excerpt).toLowerCase().includes(q.toLowerCase()),
  );
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar artigos..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${cat === c ? "bg-white/15 text-foreground" : "text-foreground/60 hover:bg-white/5"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
          Nenhum artigo encontrado.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const date = p.publishedAt ? p.publishedAt.slice(0, 10) : "";
            return (
              <Reveal key={p.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-primary/40"
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30">
                    {p.coverUrl ? (
                      <img
                        src={p.coverUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        {p.category}
                      </span>
                      {date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {date}
                        </span>
                      )}
                      <span>· {p.readMinutes} min</span>
                    </div>
                    <h3 className="mt-3 font-bold">{p.title}</h3>
                    <p className="mt-1.5 text-sm text-foreground/70">{p.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
