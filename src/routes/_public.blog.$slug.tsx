import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, ArrowLeft } from "lucide-react";
import {
  Reveal,
  GradientText,
  SectionEyebrow,
} from "@/core/components/public/PublicLayout";
import { getPublicBlogPost } from "@/lib/public-blog.functions";

export const Route = createFileRoute("/_public/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublicBlogPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Artigo não encontrado — Dioris" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post } = loaderData;
    const title = `${post.title} — Dioris`;
    const desc = post.excerpt || "Novidades e insights do ecossistema Dioris.";
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: post.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (post.coverUrl) {
      meta.push({ property: "og:image", content: post.coverUrl });
      meta.push({ name: "twitter:image", content: post.coverUrl });
    }
    return { meta };
  },
  component: Page,
  notFoundComponent: NotFoundPage,
});

function Page() {
  const { post } = Route.useLoaderData();
  const date = post.publishedAt ? post.publishedAt.slice(0, 10) : "";
  const paragraphs = post.content.split(/\n{2,}/g).filter(Boolean);
  return (
    <article className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o blog
      </Link>
      <Reveal>
        <SectionEyebrow>{post.category}</SectionEyebrow>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          <GradientText>{post.title}</GradientText>
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {date}
            </span>
          )}
          <span>· {post.readMinutes} min de leitura</span>
          {post.authorName && <span>· por {post.authorName}</span>}
        </div>
      </Reveal>
      {post.coverUrl && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          <img src={post.coverUrl} alt="" className="w-full" />
        </div>
      )}
      <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-foreground/85">
        {post.excerpt && (
          <p className="text-lg text-foreground/90">{post.excerpt}</p>
        )}
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <SectionEyebrow>404</SectionEyebrow>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
        Artigo <GradientText>não encontrado</GradientText>
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Este artigo não existe ou foi despublicado.
      </p>
      <Link
        to="/blog"
        className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium hover:bg-white/10"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o blog
      </Link>
    </div>
  );
}