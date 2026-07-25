import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createProjectRow } from "@/lib/planner-projects.functions";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Palette,
  Ruler,
  Sparkles,
  Wand2,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import {
  PageContainer,
  Button,
  StatusBadge,
} from "@/core/components/ui-kit";
import { cn } from "@/lib/utils";
import { useTenant } from "@/core/providers/TenantProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import {
  createProject,
  createEnvironment,
  createRoom,
  upsertProject,
  type PlannerProjectStyle,
  type PlannerRoomType,
} from "@/modules/planner/shared";

export const Route = createFileRoute("/_authenticated/planner/projetos/novo")({
  component: NewProjectWizard,
  head: () => ({
    meta: [
      { title: "Novo projeto — Dioris Planner" },
      {
        name: "description",
        content:
          "Wizard guiado por IA para criar um novo projeto no Dioris Planner em 4 etapas.",
      },
    ],
  }),
});

type StepId = "info" | "ambiente" | "estilo" | "confirmar";

const STEPS: { id: StepId; label: string; icon: typeof Compass }[] = [
  { id: "info", label: "Informações", icon: Sparkles },
  { id: "ambiente", label: "Ambiente", icon: Compass },
  { id: "estilo", label: "Estilo", icon: Palette },
  { id: "confirmar", label: "Confirmar", icon: Check },
];

const ENVIRONMENTS: { id: PlannerRoomType; label: string; hint: string }[] = [
  { id: "cozinha", label: "Cozinha", hint: "Ilha, torre, aéreos" },
  { id: "closet", label: "Closet", hint: "Cabides, gavetas, sapateira" },
  { id: "dormitorio", label: "Dormitório", hint: "Guarda-roupa, cabeceira" },
  { id: "banheiro", label: "Banheiro", hint: "Marcenaria molhada" },
  { id: "escritorio", label: "Home Office", hint: "Bancada, estante" },
  { id: "sala", label: "Sala", hint: "Rack, painel, buffet" },
  { id: "lavanderia", label: "Lavanderia", hint: "Tanque, torre" },
  { id: "comercial", label: "Comercial", hint: "Balcão, expositor" },
];

const STYLES: { id: PlannerProjectStyle; label: string; hint: string }[] = [
  { id: "moderno", label: "Moderno", hint: "Linhas retas, laca fosca" },
  { id: "minimalista", label: "Minimalista", hint: "Menos é mais" },
  { id: "escandinavo", label: "Escandinavo", hint: "Madeira clara, branco" },
  { id: "industrial", label: "Industrial", hint: "Metal, concreto, escuro" },
  { id: "japandi", label: "Japandi", hint: "Japonês + escandinavo" },
  { id: "contemporaneo", label: "Contemporâneo", hint: "Neutro atemporal" },
  { id: "classico", label: "Clássico", hint: "Molduras, madeira nobre" },
  { id: "luxo", label: "Luxo", hint: "Mármore, dourado, laca" },
  { id: "rustico", label: "Rústico", hint: "Madeira bruta, natural" },
  { id: "boho", label: "Boho", hint: "Texturas, cores quentes" },
];

function NewProjectWizard() {
  const { activeCompany } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tenantId = activeCompany?.id ?? "anonymous";

  const [step, setStep] = useState<StepId>("info");
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [envType, setEnvType] = useState<PlannerRoomType | null>(null);
  const [areaM2, setAreaM2] = useState<string>("");
  const [style, setStyle] = useState<PlannerProjectStyle | null>(null);
  const [budget, setBudget] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const canNext = useMemo(() => {
    if (step === "info") return name.trim().length > 0;
    if (step === "ambiente") return envType !== null;
    if (step === "estilo") return style !== null;
    return true;
  }, [step, name, envType, style]);

  const goNext = () => {
    if (!canNext) return;
    const next = STEPS[currentIdx + 1];
    if (next) setStep(next.id);
  };
  const goPrev = () => {
    const prev = STEPS[currentIdx - 1];
    if (prev) setStep(prev.id);
  };

  const createOnServer = useServerFn(createProjectRow);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    if (!name.trim() || !envType || !style || saving) return;
    if (!activeCompany?.id) {
      setError("Selecione uma empresa ativa para criar o projeto.");
      return;
    }
    const project = createProject({
      tenantId,
      ownerId: user?.id ?? "anonymous",
      name: name.trim(),
      client: client.trim() || undefined,
      briefing: {
        environmentType: envType,
        style,
        areaM2: Number(areaM2) || undefined,
        budget: Number(budget) || undefined,
        deadline: deadline || undefined,
        notes: notes.trim() || undefined,
      },
    });
    // Cria ambiente + cômodo iniciais para o projeto já entrar operável.
    const env = createEnvironment({ name: "Ambiente principal" });
    const room = createRoom({
      name: labelForRoomType(envType),
      type: envType,
      width: 3600,
      depth: 3000,
      height: 2700,
    });
    const bootstrapped = {
      ...project,
      environments: [{ ...env, rooms: [room] }],
    };
    setError(null);
    setSaving(true);
    try {
      await createOnServer({
        data: {
          id: project.id,
          name: project.name,
          client: project.client ?? null,
        },
      });
      upsertProject(tenantId, bootstrapped);
      await queryClient.invalidateQueries({ queryKey: ["planner", "projects", tenantId] });
      navigate({ to: "/planner/projetos/$projectId", params: { projectId: project.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar projeto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/planner/projetos" className="hover:text-foreground">
          Projetos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Novo projeto</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Painel principal — wizard */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          {/* Stepper */}
          <ol className="mb-8 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const active = s.id === step;
              const done = i < currentIdx;
              const Icon = s.icon;
              return (
                <li key={s.id} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : done
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                          : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      Etapa {i + 1}
                    </div>
                    <div className="truncate text-sm font-medium">{s.label}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "hidden h-px flex-1 sm:block",
                        done ? "bg-emerald-500/40" : "bg-border/60",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {step === "info" && (
            <section className="space-y-5">
              <header>
                <h1 className="text-xl font-semibold">Informações do projeto</h1>
                <p className="text-sm text-muted-foreground">
                  Como o projeto será identificado internamente e para o cliente.
                </p>
              </header>
              <Field label="Nome do projeto" hint="Ex.: Residência Almeida — Cozinha">
                <input
                  autoFocus
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dê um nome curto e reconhecível"
                />
              </Field>
              <Field label="Cliente (opcional)">
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                />
              </Field>
              <Field label="Prazo estimado" hint="Opcional — usado no PCP/MRP">
                <input
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </Field>
            </section>
          )}

          {step === "ambiente" && (
            <section className="space-y-5">
              <header>
                <h1 className="text-xl font-semibold">Qual ambiente vamos projetar?</h1>
                <p className="text-sm text-muted-foreground">
                  A IA usa esta escolha para popular a biblioteca contextual.
                </p>
              </header>
              <div className="grid gap-2 sm:grid-cols-2">
                {ENVIRONMENTS.map((e) => {
                  const active = envType === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEnvType(e.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-background hover:border-primary/40 hover:bg-accent/30",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                          active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Compass className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{e.label}</div>
                        <div className="text-xs text-muted-foreground">{e.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Field label="Área aproximada (m²)" hint="Opcional — ajuda no orçamento estimado">
                <div className="relative">
                  <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    inputMode="decimal"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm"
                    value={areaM2}
                    onChange={(e) => setAreaM2(e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder="Ex.: 12"
                  />
                </div>
              </Field>
            </section>
          )}

          {step === "estilo" && (
            <section className="space-y-5">
              <header>
                <h1 className="text-xl font-semibold">Qual estilo o cliente espera?</h1>
                <p className="text-sm text-muted-foreground">
                  A IA Decoradora ajustará materiais, cores e iluminação com base no estilo.
                </p>
              </header>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {STYLES.map((s) => {
                  const active = style === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-background hover:border-primary/40 hover:bg-accent/30",
                      )}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>
                    </button>
                  );
                })}
              </div>
              <Field label="Orçamento estimado (R$)" hint="Opcional — referência interna">
                <input
                  inputMode="numeric"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Ex.: 45000"
                />
              </Field>
              <Field label="Briefing / observações" hint="Peculiaridades, restrições, referências">
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Ex.: "cliente adora carvalho, quer ilha central com cooktop"'
                />
              </Field>
            </section>
          )}

          {step === "confirmar" && (
            <section className="space-y-5">
              <header>
                <h1 className="text-xl font-semibold">Tudo pronto para começar?</h1>
                <p className="text-sm text-muted-foreground">
                  A IA vai criar um ambiente inicial e abrir o editor 3D já contextualizado.
                </p>
              </header>
              <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/40">
                <SummaryRow label="Projeto" value={name || "—"} />
                <SummaryRow label="Cliente" value={client || "—"} />
                <SummaryRow
                  label="Ambiente"
                  value={envType ? labelForRoomType(envType) : "—"}
                />
                <SummaryRow
                  label="Estilo"
                  value={style ? STYLES.find((s) => s.id === style)?.label ?? "—" : "—"}
                />
                <SummaryRow label="Área" value={areaM2 ? `${areaM2} m²` : "—"} />
                <SummaryRow label="Orçamento" value={budget ? `R$ ${Number(budget).toLocaleString("pt-BR")}` : "—"} />
                <SummaryRow label="Prazo" value={deadline || "—"} />
              </ul>
              {notes && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Briefing
                  </div>
                  {notes}
                </div>
              )}
            </section>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            {step === "confirmar" ? (
              <Button size="sm" onClick={finish} disabled={!name.trim() || !envType || !style}>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar projeto
              </Button>
            ) : (
              <Button size="sm" onClick={goNext} disabled={!canNext}>
                Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Painel lateral — IA Copiloto contextual */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-border/60 bg-gradient-to-b from-primary/10 via-background to-background p-5">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">IA Copiloto</div>
                <div className="text-[11px] text-muted-foreground">acompanhando o wizard</div>
              </div>
              <StatusBadge tone="info" className="ml-auto">assistindo</StatusBadge>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm leading-relaxed">
              {wizardHint({ step, name, envType, style })}
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Wand2 className="h-3 w-3" /> Sugestões da IA
              </div>
              <ul className="space-y-1.5">
                {suggestionsFor(step).map((tip) => (
                  <li
                    key={tip}
                    className="rounded-lg border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs text-foreground/90"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Ao concluir, o editor 3D abre com um ambiente base pronto para você
              conversar com a IA em linguagem natural.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function labelForRoomType(t: PlannerRoomType): string {
  return ENVIRONMENTS.find((e) => e.id === t)?.label ?? "Ambiente";
}

function wizardHint(ctx: {
  step: StepId;
  name: string;
  envType: PlannerRoomType | null;
  style: PlannerProjectStyle | null;
}): string {
  if (ctx.step === "info") {
    return "Comece pelo nome do projeto — costumo sugerir o padrão “Sobrenome — Ambiente” para localizar rápido no CRM depois.";
  }
  if (ctx.step === "ambiente") {
    return "Escolha o cômodo principal. Depois você poderá adicionar outros ambientes ao mesmo projeto — a biblioteca contextual mudará automaticamente.";
  }
  if (ctx.step === "estilo") {
    const envLabel = ctx.envType ? labelForRoomType(ctx.envType).toLowerCase() : "ambiente";
    return `Para ${envLabel}, os estilos que mais convertem são Moderno, Escandinavo e Japandi — mas vale ouvir o cliente.`;
  }
  const s = ctx.style ? STYLES.find((x) => x.id === ctx.style)?.label ?? "definido" : "definido";
  return `Perfeito. Vou preparar o ambiente com padrões do estilo ${s} e já sugerir peças da biblioteca contextual assim que o editor abrir.`;
}

function suggestionsFor(step: StepId): string[] {
  if (step === "info") {
    return [
      "Use nomes curtos e reconhecíveis",
      "Vincule o cliente para reaproveitar dados no CRM",
      "Prazo alimenta o PCP automaticamente",
    ];
  }
  if (step === "ambiente") {
    return [
      "Você pode adicionar mais ambientes depois",
      "Área aproximada gera orçamento preliminar",
      "A biblioteca contextual filtra por ambiente",
    ];
  }
  if (step === "estilo") {
    return [
      "O estilo define paleta e iluminação padrão",
      "A IA Decoradora refina depois no viewport",
      "Briefing detalhado melhora as sugestões",
    ];
  }
  return [
    "Você pode editar tudo depois no projeto",
    "Undo/Redo funciona em cada passo",
    "A IA cria um ambiente inicial automático",
  ];
}