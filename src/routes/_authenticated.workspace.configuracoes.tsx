import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  ModuleCard,
  FormSection,
} from "@/core/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useLocalization,
  useUpsertLocalization,
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/core/configuration/use-configuration";

export const Route = createFileRoute("/_authenticated/workspace/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Workspace | Dioris Hub" },
      { name: "description", content: "Preferências, tema, idioma e região da empresa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceConfig,
});

const THEMES = ["system", "dark", "light"] as const;
const LOCALES = ["pt-BR", "en-US", "es-ES"] as const;
const TIMEZONES = ["America/Sao_Paulo", "America/New_York", "Europe/Lisbon", "UTC"] as const;
const CURRENCIES = ["BRL", "USD", "EUR"] as const;

function WorkspaceConfig() {
  const localization = useLocalization();
  const upsertLoc = useUpsertLocalization();
  const company = useCompanySettings();
  const upsertCompany = useUpdateCompanySettings();

  const [locale, setLocale] = useState("pt-BR");
  const [theme, setTheme] = useState<string>("dark");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (localization.data) setLocale(localization.data.defaultLocale);
  }, [localization.data]);
  useEffect(() => {
    if (company.data) {
      setTheme(company.data.theme ?? "dark");
      setTimezone(company.data.timezone ?? "America/Sao_Paulo");
      setCurrency(company.data.currency ?? "BRL");
      setDisplayName(company.data.displayName ?? "");
    }
  }, [company.data]);

  const savePreferences = () => {
    upsertCompany.mutate(
      { theme, timezone, currency, displayName },
      {
        onSuccess: () => toast.success("Preferências salvas"),
        onError: (e) => toast.error((e as Error).message),
      },
    );
    upsertLoc.mutate(
      { defaultLocale: locale },
      { onError: (e) => toast.error((e as Error).message) },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Configurações"
        description="Preferências do usuário e da empresa"
      />

      <div className="mt-6">
        <FormSection
          title="Preferências"
          description="Tema, idioma, região e moeda aplicados a toda a empresa."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome de exibição</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Dioris Móveis Planejados"
              />
            </div>
            <div>
              <Label>Tema</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuso horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={upsertCompany.isPending || upsertLoc.isPending}
            >
              Salvar preferências
            </Button>
          </div>
        </FormSection>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard
          icon={<Settings className="h-4 w-4" />}
          name="Empresa"
          description="Identidade, plano e domínio"
          href="/workspace/empresa"
        />
        <ModuleCard
          name="Segurança"
          description="MFA, sessões e políticas"
          href="/workspace/perfil"
        />
        <ModuleCard
          name="Perfil"
          description="Sua conta pessoal"
          href="/workspace/perfil"
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Configurações avançadas seguem no{" "}
        <Link to="/configuracoes" className="text-primary hover:underline">
          Centro de Configurações
        </Link>
        .
      </p>
    </PageContainer>
  );
}
