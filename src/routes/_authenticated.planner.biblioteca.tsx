import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, StatusBadge } from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  CATALOG_ITEMS,
  CatalogRealPanel,
  LibraryPanel,
  PlannerEditorProvider,
} from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca Inteligente — Dioris Planner" },
      {
        name: "description",
        content:
          "Catálogo paramétrico de módulos, tampos, portas, ferragens, acabamentos e iluminação da Dioris.",
      },
      { property: "og:title", content: "Biblioteca Inteligente — Dioris Planner" },
      {
        property: "og:description",
        content: "Peças paramétricas prontas para 2D, 3D, IA e Produção.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BibliotecaPage,
});

function BibliotecaPage() {
  const [tab, setTab] = useState<"parametric" | "catalog">("parametric");
  const tabs = [
    { id: "parametric" as const, label: "Peças paramétricas" },
    { id: "catalog" as const, label: "Materiais & Ferragens" },
  ];
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Planner"
        title="Biblioteca Inteligente"
        description="Catálogo paramétrico compartilhado por 2D, 3D, IA, Produção, Render e Lista de Corte."
        actions={
          <StatusBadge tone="success">{CATALOG_ITEMS.length} peças ativas</StatusBadge>
        }
      />
      <div className="mt-4 inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 h-[calc(100vh-300px)] min-h-[560px]">
        {tab === "parametric" ? (
          <PlannerEditorProvider>
            <LibraryPanel variant="full" />
          </PlannerEditorProvider>
        ) : (
          <CatalogRealPanel />
        )}
      </div>
    </PageContainer>
  );
}
