/**
 * Server functions públicas para o Blog.
 * Sem middleware de auth — usa cliente publishable do Supabase externo.
 * Só retorna posts publicados (política RLS `published = true`).
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type PublicBlogPostDTO = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverUrl: string | null;
  readMinutes: number;
  publishedAt: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
};

export type PublicBlogPostFullDTO = PublicBlogPostDTO & {
  content: string;
};

function publicClient() {
  const url = process.env.EXTERNAL_SUPABASE_URL;
  const key = process.env.EXTERNAL_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase externo não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Row = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  cover_url: string | null;
  read_minutes: number;
  published_at: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
};

function toDTO(r: Row): PublicBlogPostDTO {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    category: r.category,
    coverUrl: r.cover_url,
    readMinutes: r.read_minutes,
    publishedAt: r.published_at,
    authorName: r.author_name,
    authorAvatarUrl: r.author_avatar_url,
  };
}

export const listPublicBlogPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicBlogPostDTO[]> => {
    try {
      const sb = publicClient();
      const { data, error } = await sb
        .from("blog_posts")
        .select(
          "slug,title,excerpt,category,cover_url,read_minutes,published_at,author_name,author_avatar_url",
        )
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(60);
      if (error) return [];
      return (data ?? []).map((r) => toDTO(r as Row));
    } catch {
      return [];
    }
  },
);

export const getPublicBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    if (!input || typeof input.slug !== "string" || input.slug.length > 200) {
      throw new Error("invalid_slug");
    }
    return { slug: input.slug };
  })
  .handler(async ({ data }): Promise<PublicBlogPostFullDTO | null> => {
    try {
      const sb = publicClient();
      const { data: row, error } = await sb
        .from("blog_posts")
        .select(
          "slug,title,excerpt,content,category,cover_url,read_minutes,published_at,author_name,author_avatar_url",
        )
        .eq("published", true)
        .eq("slug", data.slug)
        .maybeSingle();
      if (error || !row) return null;
      const r = row as Row & { content: string };
      return { ...toDTO(r), content: r.content };
    } catch {
      return null;
    }
  });