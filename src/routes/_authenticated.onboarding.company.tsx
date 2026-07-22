import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader, FormSection } from "@/core/components/ui-kit";
import { createCompany } from "@/core/services/tenant.functions";
import { useTenant } from "@/core/hooks";
import type { CompanyId } from "@/core/types/tenant";

export const Route = createFileRoute("/_authenticated/onboarding/company")({
  head: () => ({
    meta: [{ title: "Nova empresa — Dioris Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: OnboardingCompany,
});

function OnboardingCompany() {
  const { setActive, refresh, companies } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");

  const mutation = useMutation({
    mutationFn: () => createCompany({ data: { name, cnpj: cnpj || null } }),
    onSuccess: async (company) => {
      toast.success(`Empresa "${company.name}" criada.`);
      await refresh();
      setActive(company.id as CompanyId);
      queryClient.invalidateQueries();
      navigate({ to: "/", replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha ao criar empresa");
    },
  });

  return (
    <PageContainer size="md">
      <PageHeader
        eyebrow="Onboarding"
        title="Criar nova empresa"
        description={
          companies.length === 0
            ? "Para usar a plataforma, cadastre a empresa que vai operar aqui."
            : "Cadastre uma nova empresa para operar em paralelo."
        }
      />
      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <FormSection
          title="Identificação"
          description="Você poderá refinar logo, plano e domínio depois."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome da empresa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
          </div>
        </FormSection>
        <div className="flex justify-end gap-2">
          {companies.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: "/" })}
            >
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando…" : "Criar empresa"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}