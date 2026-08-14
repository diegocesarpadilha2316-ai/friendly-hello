import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Palette,
  MapPin,
  Briefcase,
  Settings2,
  ShieldCheck,
  HardDrive,
  Save,
  Globe,
  Coins,
  Users,
  FileImage,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageContainer,
  PageHeader,
  EmptyState,
  StatusBadge,
  MetricCard,
  FormSection,
  LoadingOverlay,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/core/hooks";
import { updateActiveCompany } from "@/core/services/tenant.functions";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/core/configuration/use-configuration";
import { useAssetsStats } from "@/core/assets/use-assets";
import { useSecuritySnapshot } from "@/core/security/use-security";
import { useAudit } from "@/core/observability/use-observability";

export const Route = createFileRoute("/_authenticated/workspace/empresa")({
  head: () => ({
    meta: [
      { title: "Minha Empresa — Workspace | Dioris Hub" },
      {
        name: "description",
        content:
          "Central da empresa ativa: dados corporativos, branding, endereço, comercial, segurança e storage.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceEmpresa,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

interface CompanyFormState {
  name: string;
  cnpj: string;
  custom_domain: string;
  logo_url: string;
  settings: {
    razao_social: string;
    nome_fantasia: string;
    ie: string;
    im: string;
    phone: string;
    whatsapp: string;
    email: string;
    site: string;
    branding: {
      icon_url: string;
      banner_url: string;
      primary_color: string;
      secondary_color: string;
      theme: string;
    };
    address: {
      cep: string;
      street: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state: string;
      country: string;
    };
    business: {
      segment: string;
      size: string;
      employees: string;
      hours: string;
      instagram: string;
      linkedin: string;
      facebook: string;
      x: string;
    };
  };
}

function seedForm(company: {
  name: string;
  cnpj: string | null;
  custom_domain: string | null;
  logo_url: string | null;
  settings: unknown;
}): CompanyFormState {
  const s = (company.settings ?? {}) as Json;
  const branding = (s.branding ?? {}) as Json;
  const address = (s.address ?? {}) as Json;
  const business = (s.business ?? {}) as Json;
  return {
    name: company.name ?? "",
    cnpj: company.cnpj ?? "",
    custom_domain: company.custom_domain ?? "",
    logo_url: company.logo_url ?? "",
    settings: {
      razao_social: s.razao_social ?? "",
      nome_fantasia: s.nome_fantasia ?? "",
      ie: s.ie ?? "",
      im: s.im ?? "",
      phone: s.phone ?? "",
      whatsapp: s.whatsapp ?? "",
      email: s.email ?? "",
      site: s.site ?? "",
      branding: {
        icon_url: branding.icon_url ?? "",
        banner_url: branding.banner_url ?? "",
        primary_color: branding.primary_color ?? "#8B5CF6",
        secondary_color: branding.secondary_color ?? "#06B6D4",
        theme: branding.theme ?? "dark",
      },
      address: {
        cep: address.cep ?? "",
        street: address.street ?? "",
        number: address.number ?? "",
        complement: address.complement ?? "",
        district: address.district ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        country: address.country ?? "Brasil",
      },
      business: {
        segment: business.segment ?? "",
        size: business.size ?? "",
        employees: business.employees ?? "",
        hours: business.hours ?? "",
        instagram: business.instagram ?? "",
        linkedin: business.linkedin ?? "",
        facebook: business.facebook ?? "",
        x: business.x ?? "",
      },
    },
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function WorkspaceEmpresa() {
  const { activeCompany, role, refresh } = useTenant();
  const canEdit = role === "owner" || role === "admin";
  const companySettings = useCompanySettings();
  const assets = useAssetsStats();
  const security = useSecuritySnapshot();
  const audit = useAudit({ entity: "company" });
  const updateSettings = useUpdateCompanySettings();
  const qc = useQueryClient();

  const updateCompany = useMutation({
    mutationFn: (input: Json) => updateActiveCompany({ data: input }),
    onSuccess: async () => {
      await refresh();
      qc.invalidateQueries({
        predicate: (q) => String(q.queryKey?.[0] ?? "").startsWith("tenant"),
      });
      toast.success("Empresa atualizada");
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao atualizar"),
  });

  const [form, setForm] = React.useState<CompanyFormState | null>(null);

  React.useEffect(() => {
    if (activeCompany) setForm(seedForm(activeCompany));
  }, [activeCompany?.id, activeCompany?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeCompany) {
    return (
      <PageContainer>
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="Selecione uma empresa" />
      </PageContainer>
    );
  }

  if (!form) {
    return (
      <PageContainer>
        <Skeleton className="h-32 w-full" />
      </PageContainer>
    );
  }

  const patch = (fn: (draft: CompanyFormState) => void) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as CompanyFormState;
      fn(next);
      return next;
    });
  };

  const save = () => {
    if (!canEdit) {
      toast.error("Somente owner/admin podem editar");
      return;
    }
    updateCompany.mutate({
      name: form.name,
      cnpj: form.cnpj || null,
      custom_domain: form.custom_domain || null,
      logo_url: form.logo_url || null,
      settings: form.settings as unknown as Json,
    });
  };

  const cs = companySettings.data;
  const storagePct =
    assets.data && assets.data.quotaBytes
      ? Math.min(100, Math.round((assets.data.usedBytes / assets.data.quotaBytes) * 100))
      : 0;

  const mfaEnabled = (security.data?.mfaFactors ?? []).some((f) => f.enabled);
  const sessionsCount = (security.data?.sessions ?? []).length;
  const devicesCount = (security.data?.devices ?? []).length;

  return (
    <PageContainer>
      <LoadingOverlay visible={updateCompany.isPending || updateSettings.isPending} />
      <PageHeader
        eyebrow="Workspace"
        title={activeCompany.name}
        description={`Empresa ativa · seu papel: ${role ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={activeCompany.status === "active" ? "success" : "warning"}>
              {activeCompany.status}
            </StatusBadge>
            <Button onClick={save} disabled={!canEdit || updateCompany.isPending}>
              <Save className="mr-2 h-4 w-4" /> Salvar alterações
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Plano"
          value={activeCompany.plan ?? "—"}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricCard
          label="Storage"
          value={assets.data ? `${(assets.data.usedBytes / 1024 / 1024).toFixed(1)} MB` : "—"}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricCard
          label="Segurança"
          value={mfaEnabled ? "MFA ativo" : "MFA inativo"}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="Criada em"
          value={new Date(activeCompany.created_at).toLocaleDateString("pt-BR")}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8">
        <Tabs defaultValue="dados">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="dados">
              <Building2 className="mr-2 h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="endereco">
              <MapPin className="mr-2 h-4 w-4" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="comercial">
              <Briefcase className="mr-2 h-4 w-4" />
              Comercial
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings2 className="mr-2 h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="seguranca">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="storage">
              <HardDrive className="mr-2 h-4 w-4" />
              Storage
            </TabsTrigger>
          </TabsList>

          {/* DADOS */}
          <TabsContent value="dados" className="mt-6 space-y-6">
            <FormSection title="Identidade" description="Nome, documentos e canais oficiais.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome"
                  value={form.name}
                  onChange={(v) =>
                    patch((d) => {
                      d.name = v;
                    })
                  }
                />
                <Field
                  label="Razão social"
                  value={form.settings.razao_social}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.razao_social = v;
                    })
                  }
                />
                <Field
                  label="Nome fantasia"
                  value={form.settings.nome_fantasia}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.nome_fantasia = v;
                    })
                  }
                />
                <Field
                  label="CNPJ"
                  value={form.cnpj}
                  onChange={(v) =>
                    patch((d) => {
                      d.cnpj = v;
                    })
                  }
                  placeholder="00.000.000/0000-00"
                />
                <Field
                  label="Inscrição Estadual"
                  value={form.settings.ie}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.ie = v;
                    })
                  }
                />
                <Field
                  label="Inscrição Municipal"
                  value={form.settings.im}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.im = v;
                    })
                  }
                />
              </div>
            </FormSection>
            <FormSection title="Contato" description="Canais de comunicação da empresa.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Telefone"
                  value={form.settings.phone}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.phone = v;
                    })
                  }
                />
                <Field
                  label="WhatsApp"
                  value={form.settings.whatsapp}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.whatsapp = v;
                    })
                  }
                />
                <Field
                  label="E-mail"
                  type="email"
                  value={form.settings.email}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.email = v;
                    })
                  }
                />
                <Field
                  label="Site"
                  value={form.settings.site}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.site = v;
                    })
                  }
                  placeholder="https://"
                />
                <Field
                  label="Domínio personalizado"
                  value={form.custom_domain}
                  onChange={(v) =>
                    patch((d) => {
                      d.custom_domain = v;
                    })
                  }
                  placeholder="app.suaempresa.com"
                />
              </div>
            </FormSection>
          </TabsContent>

          {/* BRANDING */}
          <TabsContent value="branding" className="mt-6 space-y-6">
            <FormSection
              title="Identidade visual"
              description="Logo, ícone, banner e cores da marca."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Logo (URL)"
                  value={form.logo_url}
                  onChange={(v) =>
                    patch((d) => {
                      d.logo_url = v;
                    })
                  }
                />
                <Field
                  label="Ícone (URL)"
                  value={form.settings.branding.icon_url}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.branding.icon_url = v;
                    })
                  }
                />
                <Field
                  label="Banner (URL)"
                  value={form.settings.branding.banner_url}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.branding.banner_url = v;
                    })
                  }
                />
                <Field
                  label="Tema"
                  value={form.settings.branding.theme}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.branding.theme = v;
                    })
                  }
                  placeholder="dark | light | system"
                />
                <Field
                  label="Cor primária"
                  value={form.settings.branding.primary_color}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.branding.primary_color = v;
                    })
                  }
                  placeholder="#8B5CF6"
                />
                <Field
                  label="Cor secundária"
                  value={form.settings.branding.secondary_color}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.branding.secondary_color = v;
                    })
                  }
                  placeholder="#06B6D4"
                />
              </div>
              {(form.logo_url ||
                form.settings.branding.icon_url ||
                form.settings.branding.banner_url) && (
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                  {form.logo_url && (
                    <img src={form.logo_url} alt="Logo" className="h-10 object-contain" />
                  )}
                  {form.settings.branding.icon_url && (
                    <img
                      src={form.settings.branding.icon_url}
                      alt="Ícone"
                      className="h-10 w-10 rounded object-contain"
                    />
                  )}
                  {form.settings.branding.banner_url && (
                    <img
                      src={form.settings.branding.banner_url}
                      alt="Banner"
                      className="h-14 rounded object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-6 w-6 rounded"
                      style={{ background: form.settings.branding.primary_color }}
                    />
                    <span
                      className="inline-block h-6 w-6 rounded"
                      style={{ background: form.settings.branding.secondary_color }}
                    />
                    <span>Prévia das cores</span>
                  </div>
                </div>
              )}
            </FormSection>
          </TabsContent>

          {/* ENDEREÇO */}
          <TabsContent value="endereco" className="mt-6">
            <FormSection title="Endereço" description="Localização principal da empresa.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="CEP"
                  value={form.settings.address.cep}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.cep = v;
                    })
                  }
                />
                <div className="md:col-span-2">
                  <Field
                    label="Rua"
                    value={form.settings.address.street}
                    onChange={(v) =>
                      patch((d) => {
                        d.settings.address.street = v;
                      })
                    }
                  />
                </div>
                <Field
                  label="Número"
                  value={form.settings.address.number}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.number = v;
                    })
                  }
                />
                <Field
                  label="Complemento"
                  value={form.settings.address.complement}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.complement = v;
                    })
                  }
                />
                <Field
                  label="Bairro"
                  value={form.settings.address.district}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.district = v;
                    })
                  }
                />
                <Field
                  label="Cidade"
                  value={form.settings.address.city}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.city = v;
                    })
                  }
                />
                <Field
                  label="Estado"
                  value={form.settings.address.state}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.state = v;
                    })
                  }
                />
                <Field
                  label="País"
                  value={form.settings.address.country}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.address.country = v;
                    })
                  }
                />
              </div>
            </FormSection>
          </TabsContent>

          {/* COMERCIAL */}
          <TabsContent value="comercial" className="mt-6 space-y-6">
            <FormSection
              title="Informações comerciais"
              description="Segmentação e porte da empresa."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Segmento"
                  value={form.settings.business.segment}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.segment = v;
                    })
                  }
                />
                <Field
                  label="Porte"
                  value={form.settings.business.size}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.size = v;
                    })
                  }
                  placeholder="MEI, PP, ME, EPP, Média, Grande"
                />
                <Field
                  label="Nº de funcionários"
                  value={form.settings.business.employees}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.employees = v;
                    })
                  }
                />
                <div className="md:col-span-1">
                  <Label className="text-xs text-muted-foreground">Horário de atendimento</Label>
                  <Textarea
                    className="mt-1.5"
                    value={form.settings.business.hours}
                    onChange={(e) =>
                      patch((d) => {
                        d.settings.business.hours = e.target.value;
                      })
                    }
                    placeholder="Seg–Sex 09h–18h"
                  />
                </div>
              </div>
            </FormSection>
            <FormSection title="Redes sociais" description="Perfis oficiais da empresa.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Instagram"
                  value={form.settings.business.instagram}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.instagram = v;
                    })
                  }
                />
                <Field
                  label="LinkedIn"
                  value={form.settings.business.linkedin}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.linkedin = v;
                    })
                  }
                />
                <Field
                  label="Facebook"
                  value={form.settings.business.facebook}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.facebook = v;
                    })
                  }
                />
                <Field
                  label="X / Twitter"
                  value={form.settings.business.x}
                  onChange={(v) =>
                    patch((d) => {
                      d.settings.business.x = v;
                    })
                  }
                />
              </div>
            </FormSection>
          </TabsContent>

          {/* CONFIG (locale/timezone/currency) — usa Configuration Core */}
          <TabsContent value="config" className="mt-6">
            <FormSection
              title="Preferências regionais"
              description="Idioma, moeda, fuso e formatos padrão da empresa."
            >
              {companySettings.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <CompanyRegionalForm
                  initial={cs ?? undefined}
                  disabled={!canEdit}
                  onSubmit={(payload) =>
                    updateSettings.mutate(payload, {
                      onSuccess: () => toast.success("Preferências salvas"),
                      onError: (e: Error) => toast.error(e.message),
                    })
                  }
                />
              )}
            </FormSection>
          </TabsContent>

          {/* SEGURANÇA */}
          <TabsContent value="seguranca" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="MFA"
                value={mfaEnabled ? "Ativo" : "Inativo"}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <MetricCard
                label="Sessões"
                value={String(sessionsCount)}
                icon={<Users className="h-4 w-4" />}
              />
              <MetricCard
                label="Dispositivos"
                value={String(devicesCount)}
                icon={<Globe className="h-4 w-4" />}
              />
              <MetricCard
                label="Eventos"
                value={String((audit.data ?? []).length)}
                icon={<Sparkles className="h-4 w-4" />}
              />
            </div>
            <FormSection
              title="Auditoria recente"
              description="Últimas alterações da empresa registradas pelo Observability."
            >
              {audit.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (audit.data ?? []).length === 0 ? (
                <EmptyState title="Sem eventos recentes" />
              ) : (
                <ul className="divide-y divide-border/50 rounded-lg border border-border/60">
                  {(audit.data ?? []).slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </FormSection>
            <p className="text-xs text-muted-foreground">
              Sessões e MFA são gerenciados em <strong>Workspace → Perfil</strong>.
            </p>
          </TabsContent>

          {/* STORAGE */}
          <TabsContent value="storage" className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Uploads"
                value={String(assets.data?.assetCount ?? 0)}
                icon={<FileImage className="h-4 w-4" />}
              />
              <MetricCard
                label="Utilizado"
                value={assets.data ? `${(assets.data.usedBytes / 1024 / 1024).toFixed(1)} MB` : "—"}
                icon={<HardDrive className="h-4 w-4" />}
              />
              <MetricCard
                label="Cota"
                value={
                  assets.data?.quotaBytes
                    ? `${(assets.data.quotaBytes / 1024 / 1024).toFixed(0)} MB`
                    : "Ilimitado"
                }
                icon={<Coins className="h-4 w-4" />}
              />
            </div>
            {assets.data?.quotaBytes ? (
              <FormSection title="Ocupação" description={`${storagePct}% da cota consumidos.`}>
                <Progress value={storagePct} />
              </FormSection>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

interface RegionalPayload {
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  units: string;
  theme: string;
  displayName: string | null;
}

function CompanyRegionalForm({
  initial,
  disabled,
  onSubmit,
}: {
  initial?: {
    locale: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
    units: string;
    theme: string;
    displayName: string | null;
  };
  disabled: boolean;
  onSubmit: (payload: RegionalPayload) => void;
}) {
  const [state, setState] = React.useState<RegionalPayload>({
    locale: initial?.locale ?? "pt-BR",
    timezone: initial?.timezone ?? "America/Sao_Paulo",
    currency: initial?.currency ?? "BRL",
    dateFormat: initial?.dateFormat ?? "dd/MM/yyyy",
    numberFormat: initial?.numberFormat ?? "pt-BR",
    units: initial?.units ?? "metric",
    theme: initial?.theme ?? "dark",
    displayName: initial?.displayName ?? null,
  });

  React.useEffect(() => {
    if (initial) {
      setState({
        locale: initial.locale,
        timezone: initial.timezone,
        currency: initial.currency,
        dateFormat: initial.dateFormat,
        numberFormat: initial.numberFormat,
        units: initial.units,
        theme: initial.theme,
        displayName: initial.displayName,
      });
    }
  }, [initial]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Idioma"
          value={state.locale}
          onChange={(v) => setState((s) => ({ ...s, locale: v }))}
        />
        <Field
          label="Fuso horário"
          value={state.timezone}
          onChange={(v) => setState((s) => ({ ...s, timezone: v }))}
        />
        <Field
          label="Moeda"
          value={state.currency}
          onChange={(v) => setState((s) => ({ ...s, currency: v }))}
        />
        <Field
          label="Formato de data"
          value={state.dateFormat}
          onChange={(v) => setState((s) => ({ ...s, dateFormat: v }))}
        />
        <Field
          label="Formato numérico"
          value={state.numberFormat}
          onChange={(v) => setState((s) => ({ ...s, numberFormat: v }))}
        />
        <Field
          label="Unidades"
          value={state.units}
          onChange={(v) => setState((s) => ({ ...s, units: v }))}
        />
        <Field
          label="Tema"
          value={state.theme}
          onChange={(v) => setState((s) => ({ ...s, theme: v }))}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSubmit(state)} disabled={disabled}>
          <Save className="mr-2 h-4 w-4" /> Salvar preferências
        </Button>
      </div>
    </div>
  );
}
