import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  DataTable,
  EmptyState,
} from "@/core/components/ui-kit";
import { useAIMetrics, useAIModels } from "@/core/ai/use-ai";

export const Route = createFileRoute("/_authenticated/workspace/ia")({
  head: () => ({
    meta: [
      { title: "IA — Workspace | Dioris Hub" },
      { name: "description", content: "Consumo de IA e modelos disponíveis para a empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceIA,
});

function WorkspaceIA() {
  const metrics = useAIMetrics();
  const models = useAIModels();
  const m = metrics.data as { requests?: number; creditsSpent?: number } | undefined;
  const list = (models.data ?? []) as Array<{ id: string; label?: string; provider?: string }>;
  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace" title="IA" description="Consumo e modelos disponíveis" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="Requisições" value={String(m?.requests ?? 0)} />
        <MetricCard label="Créditos" value={String(m?.creditsSpent ?? 0)} />
        <MetricCard label="Modelos" value={String(list.length)} />
      </div>
      <div className="mt-6">
        {list.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Nenhum modelo configurado" />
        ) : (
          <DataTable
            data={list}
            columns={[
              { id: "id", header: "Modelo", cell: (r) => r.label ?? r.id },
              { id: "provider", header: "Provider", cell: (r) => r.provider ?? "—" },
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
}