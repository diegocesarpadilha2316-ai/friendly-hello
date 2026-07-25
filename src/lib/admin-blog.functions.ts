/**
 * Admin-only server functions para gestão do Blog público.
 * Requer platform_admin (RPC is_platform_admin).
 * Tabela `blog_posts` — migration 045.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type AdminBlogPostDTO = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverUrl: string | null;
  readMinutes: number;
  authorName: string | null;
  authorAvatarUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_url: string | null;
  read_minutes: number;
  author_name: string | null;
  author_avatar_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(r: Row): AdminBlogPostDTO {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    content: r.content ?? "",
    category: r.category,
    coverUrl: r.cover_url,
    readMinutes: r.read_minutes,
    authorName: r.author_name,
    authorAvatarUrl: r.author_avatar_url,
    published: r.published,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function assertAdmin(ctx: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("is_platform_admin", { _user: ctx.userId });
  if (error) throw new Response(`Admin check failed: ${error.message}`, { status: 500 });
  if (!data) throw new Response("Forbidden: platform admin required", { status: 403 });
}

export const listAdminBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Response(error.message, { status: 500 });
    return { posts: (data ?? []).map((r: Row) => mapRow(r)) };
  });

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/i, "Slug deve conter apenas letras, números e hífens"),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().default(""),
  category: z.string().min(1).max(80),
  coverUrl: z.string().url().max(500).nullable().optional(),
  readMinutes: z.number().int().min(1).max(120).default(5),
  authorName: z.string().max(120).nullable().optional(),
  authorAvatarUrl: z.string().url().max(500).nullable().optional(),
  published: z.boolean().default(false),
});

export const upsertAdminBlogPost = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw) => upsertInput.parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      content: data.content ?? "",
      category: data.category,
      cover_url: data.coverUrl ?? null,
      read_minutes: data.readMinutes,
      author_name: data.authorName ?? null,
      author_avatar_url: data.authorAvatarUrl ?? null,
      published: data.published,
      updated_at: now,
    };
    // published_at: define ao publicar pela primeira vez; limpa se despublicar.
    if (data.published) {
      patch.published_at = now;
    } else {
      patch.published_at = null;
    }

    let row: Row | null = null;
    if (data.id) {
      // Preserva published_at existente quando permanece publicado
      const { data: existing } = await context.supabase
        .from("blog_posts")
        .select("published, published_at")
        .eq("id", data.id)
        .maybeSingle();
      if (existing?.published && data.published && existing.published_at) {
        patch.published_at = existing.published_at;
      }
      const { data: updated, error } = await context.supabase
        .from("blog_posts")
        .update(patch)
        .eq("id", data.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Response(error.message, { status: 500 });
      row = updated as Row;
    } else {
      const { data: inserted, error } = await context.supabase
        .from("blog_posts")
        .insert(patch)
        .select("*")
        .maybeSingle();
      if (error) throw new Response(error.message, { status: 500 });
      row = inserted as Row;
    }
    if (!row) throw new Response("Post não encontrado após operação", { status: 500 });
    return { post: mapRow(row) };
  });

export const deleteAdminBlogPost = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: { id: string }) => {
    if (!raw?.id || typeof raw.id !== "string") throw new Error("invalid_id");
    return { id: raw.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });