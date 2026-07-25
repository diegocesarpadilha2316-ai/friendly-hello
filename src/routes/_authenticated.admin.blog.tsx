import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ExternalLink,
  X,
} from "lucide-react";
import { app } from "@/core/config";
import {
  PageContainer,
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/core/components/ui-kit";
import { useIsPlatformAdmin } from "@/core/hooks";
import {
  listAdminBlogPosts,
  upsertAdminBlogPost,
  deleteAdminBlogPost,
  type AdminBlogPostDTO,
} from "@/lib/admin-blog.functions";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({
    meta: [
      { title: `${app.name} — Editor do Blog (Admin)` },
      {
        name: "description",
        content:
          "Gestão de artigos do blog público da Dioris: criação, edição, publicação e categorização. Acesso restrito ao administrador da plataforma.",
      },
      { property: "og:title", content: `${app.name} — Editor do Blog` },
      {
        property: "og:description",
        content: "Painel administrativo do blog público da Dioris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBlogPage,
});

function AdminBlogPage() {
  const { isAdmin, loading } = useIsPlatformAdmin();
  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando permissões…
        </div>
      </PageContainer>
    );
  }
  if (!isAdmin) return <AccessDenied />;
  return <AdminBlogContent />;
}

function AccessDenied() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8 text-destructive" />}
          title="Acesso restrito"
          description="A gestão do blog público é reservada ao administrador da plataforma."
          action={
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Admin Center
            </Link>
          }
        />
      </div>
    </PageContainer>
  );
}

type EditorState = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverUrl: string;
  readMinutes: number;
  authorName: string;
  authorAvatarUrl: string;
  published: boolean;
};

const EMPTY_EDITOR: EditorState = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Produto",
  coverUrl: "",
  readMinutes: 5,
  authorName: "",
  authorAvatarUrl: "",
  published: false,
};

function toEditor(p: AdminBlogPostDTO): EditorState {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    coverUrl: p.coverUrl ?? "",
    readMinutes: p.readMinutes,
    authorName: p.authorName ?? "",
    authorAvatarUrl: p.authorAvatarUrl ?? "",
    published: p.published,
  };
}

function AdminBlogContent() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAdminBlogPosts);
  const upsertFn = useServerFn(upsertAdminBlogPost);
  const deleteFn = useServerFn(deleteAdminBlogPost);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blog", "list"],
    queryFn: () => listFn(),
  });

  const upsertMut = useMutation({
    mutationFn: (input: EditorState) =>
      upsertFn({
        data: {
          id: input.id,
          slug: input.slug.trim().toLowerCase(),
          title: input.title.trim(),
          excerpt: input.excerpt.trim() || null,
          content: input.content,
          category: input.category.trim() || "Produto",
          coverUrl: input.coverUrl.trim() || null,
          readMinutes: Number(input.readMinutes) || 5,
          authorName: input.authorName.trim() || null,
          authorAvatarUrl: input.authorAvatarUrl.trim() || null,
          published: input.published,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "blog", "list"] });
      setEditor(null);
      setError(null);
    },
    onError: (e: unknown) => setError((e as Error)?.message ?? "Falha ao salvar."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "blog", "list"] }),
  });

  const posts = data?.posts ?? [];

  return (
    <PageContainer>
      <div className="mb-4">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Center
        </Link>
      </div>
      <PageHeader
        title="Editor do Blog"
        description="Crie, edite e publique artigos do blog público da Dioris."
        icon={<BookOpen className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => setEditor({ ...EMPTY_EDITOR })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo artigo
          </button>
        }
      />

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando artigos…
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum artigo ainda"
            description="Crie o primeiro artigo do blog público."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Título</th>
                <th className="px-4 py-3 text-left font-medium">Categoria</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Atualizado</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <StatusBadge status="success" label="Publicado" />
                    ) : (
                      <StatusBadge status="warning" label="Rascunho" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {p.published && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs hover:border-primary/50 hover:text-primary"
                          title="Ver artigo publicado"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditor(toEditor(p))}
                        className="rounded-md border border-border/60 px-3 py-1 text-xs hover:border-primary/50 hover:text-primary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir "${p.title}"?`)) deleteMut.mutate(p.id);
                        }}
                        className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <EditorDrawer
          state={editor}
          onChange={setEditor}
          onClose={() => {
            setEditor(null);
            setError(null);
          }}
          onSave={() => editor && upsertMut.mutate(editor)}
          saving={upsertMut.isPending}
          error={error}
        />
      )}
    </PageContainer>
  );
}

function EditorDrawer({
  state,
  onChange,
  onClose,
  onSave,
  saving,
  error,
}: {
  state: EditorState;
  onChange: (s: EditorState) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    onChange({ ...state, [k]: v });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <div className="text-xs text-muted-foreground">
              {state.id ? "Editar artigo" : "Novo artigo"}
            </div>
            <div className="text-base font-semibold">
              {state.title || "Sem título"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border/60 p-1.5 hover:border-primary/50 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Título">
            <input
              value={state.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              placeholder="Título do artigo"
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={state.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-sm"
              placeholder="ex.: apresentando-dioris"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <input
                value={state.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Tempo de leitura (min)">
              <input
                type="number"
                min={1}
                max={120}
                value={state.readMinutes}
                onChange={(e) => set("readMinutes", Number(e.target.value) || 5)}
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Resumo (excerpt)">
            <textarea
              value={state.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              placeholder="Chamada exibida na listagem"
            />
          </Field>
          <Field label="Conteúdo (Markdown/parágrafos)">
            <textarea
              value={state.content}
              onChange={(e) => set("content", e.target.value)}
              rows={12}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-sm"
              placeholder="Escreva o corpo do artigo. Parágrafos separados por linha em branco."
            />
          </Field>
          <Field label="Capa (URL da imagem)">
            <input
              value={state.coverUrl}
              onChange={(e) => set("coverUrl", e.target.value)}
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Autor">
              <input
                value={state.authorName}
                onChange={(e) => set("authorName", e.target.value)}
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Avatar do autor (URL)">
              <input
                value={state.authorAvatarUrl}
                onChange={(e) => set("authorAvatarUrl", e.target.value)}
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                placeholder="https://…"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={state.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4 w-4"
            />
            <span className="inline-flex items-center gap-2">
              {state.published ? (
                <Eye className="h-4 w-4 text-emerald-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              Publicado (visível em /blog)
            </span>
          </label>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border/60 px-4 py-2 text-sm hover:border-primary/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !state.title || !state.slug}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}