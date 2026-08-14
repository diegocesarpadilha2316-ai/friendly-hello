import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  MessageSquare,
  History,
  Cpu,
  Settings2,
  BarChart3,
  Activity,
  Zap,
  Clock,
  DollarSign,
  Boxes,
  Server,
  CircleDot,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  EmptyState,
  StatusBadge,
  FormSection,
} from "@/core/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAIHealth, useAIMetrics, useAIModels } from "@/core/ai/use-ai";
import { aiGenerateText } from "@/core/ai/ai.functions";
import { useBillingSummary, useCreditLedger } from "@/core/billing/use-billing";
import {
  useCompanySettings,
  useUpdateCompanySettings,
} from "@/core/configuration/use-configuration";
import type { AIProviderId } from "@/core/ai/types";

export const Route = createFileRoute("/_authenticated/workspace/ia")({
  head: () => ({
    meta: [
      { title: "IA — Workspace | Dioris Hub" },
      {
        name: "description",
        content:
          "Central de IA do workspace: chat, modelos, estatísticas e configurações via Gateway Central.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspaceIA,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  model?: string;
  latencyMs?: number;
  credits?: number;
  cached?: boolean;
};

const PROVIDER_LABELS: Record<AIProviderId, string> = {
  lovable: "Lovable AI",
  openai: "OpenAI (GPT)",
  google: "Google (Gemini)",
  anthropic: "Anthropic (Claude)",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  mistral: "Mistral",
  grok: "Grok",
  ollama: "Ollama",
};

function WorkspaceIA() {
  const metrics = useAIMetrics();
  const modelsQ = useAIModels();
  const health = useAIHealth();
  const billing = useBillingSummary();
  const ledger = useCreditLedger();
  const billingSummary = billing.summary;
  const ledgerEntries = ledger.entries;
  const settings = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const models = modelsQ.data?.models ?? [];
  const defaultProvider = modelsQ.data?.defaultProvider ?? "lovable";
  const textModels = useMemo(
    () => models.filter((m) => m.enabled && m.capabilities.includes("text")),
    [models],
  );

  const aiSettings = (
    settings.data as
      | {
          ai?: {
            defaultModel?: string;
            temperature?: number;
            maxTokens?: number;
            streaming?: boolean;
            language?: string;
          };
        }
      | undefined
  )?.ai;
  const [defaultModel, setDefaultModel] = useState(
    aiSettings?.defaultModel ?? "google/gemini-3.6-flash",
  );
  const [temperature, setTemperature] = useState<number>(aiSettings?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState<number>(aiSettings?.maxTokens ?? 2048);
  const [streaming, setStreaming] = useState<boolean>(aiSettings?.streaming ?? true);
  const [language, setLanguage] = useState<string>(aiSettings?.language ?? "pt-BR");

  const aiLedger = useMemo(
    () => (ledgerEntries ?? []).filter((e) => (e.reason ?? "").startsWith("ai:")).slice(0, 100),
    [ledgerEntries],
  );
  const spentToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return aiLedger
      .filter((e) => e.createdAt.slice(0, 10) === today)
      .reduce((s: number, e) => s + Math.abs(e.amount), 0);
  }, [aiLedger]);
  const requestsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return aiLedger.filter((e) => e.createdAt.slice(0, 10) === today).length;
  }, [aiLedger]);

  const gatewayStatus = useMemo(() => {
    const list = health.data ?? [];
    if (list.length === 0) return { tone: "neutral" as const, label: "desconhecido" };
    if (list.every((h) => h.status === "healthy"))
      return { tone: "success" as const, label: "operacional" };
    if (list.some((h) => h.status === "down"))
      return { tone: "danger" as const, label: "degradado" };
    return { tone: "warning" as const, label: "instável" };
  }, [health.data]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="IA"
        description="Porta de entrada única para todos os recursos de IA — 100% via Gateway Central."
        actions={
          <StatusBadge tone={gatewayStatus.tone}>
            <CircleDot className="mr-1 h-3 w-3" />
            Gateway {gatewayStatus.label}
          </StatusBadge>
        }
      />

      <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Créditos restantes"
          value={billingSummary?.balance ?? "—"}
          hint={billingSummary?.plan?.label ?? undefined}
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="Consumo hoje"
          value={spentToday}
          hint={`${requestsToday} requests`}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="Requests (total)"
          value={metrics.data?.requests ?? 0}
          hint={`${metrics.data?.errors ?? 0} erros`}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Latência média"
          value={`${metrics.data?.avgLatencyMs ?? 0} ms`}
        />
        <MetricCard
          icon={<Boxes className="h-4 w-4" />}
          label="Modelos ativos"
          value={textModels.length}
          hint={`Provider padrão: ${PROVIDER_LABELS[defaultProvider as AIProviderId] ?? defaultProvider}`}
        />
      </div>

      <Tabs defaultValue="chat" className="mt-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="chat">
            <MessageSquare className="mr-1 h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-3.5 w-3.5" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="models">
            <Cpu className="mr-1 h-3.5 w-3.5" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-1 h-3.5 w-3.5" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <ChatPanel
            defaultModel={defaultModel}
            temperature={temperature}
            maxTokens={maxTokens}
            models={textModels.map((m) => ({ id: m.id, label: m.label }))}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {ledger.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : aiLedger.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="Sem histórico de IA"
              description="As chamadas IA aparecerão aqui à medida que forem consumidas."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Quando</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                    <th className="px-3 py-2 text-left">Referência</th>
                    <th className="px-3 py-2 text-right">Créditos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aiLedger.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2">
                        <code className="font-mono text-xs">{e.reason}</code>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {e.reference ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{e.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          {modelsQ.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {models.map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {PROVIDER_LABELS[m.provider]}
                      </div>
                    </div>
                    <StatusBadge tone={m.enabled ? "success" : "neutral"}>
                      {m.enabled ? "ativo" : "inativo"}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.capabilities.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Qualidade</div>
                      <div className="font-medium capitalize">{m.quality}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Velocidade</div>
                      <div className="font-medium capitalize">{m.speed}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Custo</div>
                      <div className="font-medium capitalize">{m.cost}</div>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    Contexto: {m.contextTokens.toLocaleString("pt-BR")} tok · In/Out:{" "}
                    {m.creditsPer1kInput}/{m.creditsPer1kOutput} cr/1k
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <FormSection
            title="Preferências de IA"
            description="Padrões aplicados aos módulos que consomem o Gateway. Persistidos em company.settings.ai."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Modelo padrão</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {textModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Idioma preferencial</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura ({temperature.toFixed(2)})</Label>
                <Slider
                  className="mt-3"
                  value={[temperature]}
                  min={0}
                  max={2}
                  step={0.05}
                  onValueChange={([v]) => setTemperature(v)}
                />
              </div>
              <div>
                <Label>Max tokens</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={128}
                  max={32000}
                  step={128}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value) || 2048)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 md:col-span-2">
                <div>
                  <Label>Streaming</Label>
                  <p className="text-xs text-muted-foreground">
                    Recebe tokens em tempo real quando o modelo suportar.
                  </p>
                </div>
                <Switch checked={streaming} onCheckedChange={setStreaming} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  updateSettings.mutate(
                    {
                      patch: { ai: { defaultModel, temperature, maxTokens, streaming, language } },
                    },
                    {
                      onSuccess: () => toast.success("Preferências de IA salvas"),
                      onError: (e) => toast.error((e as Error).message),
                    },
                  )
                }
                disabled={updateSettings.isPending}
              >
                Salvar preferências
              </Button>
            </div>
          </FormSection>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsPanel ledger={aiLedger} metrics={metrics.data} health={health.data ?? []} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function ChatPanel({
  defaultModel,
  temperature,
  maxTokens,
  models,
}: {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  models: { id: string; label: string }[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(defaultModel);
  const listRef = useRef<HTMLDivElement>(null);
  const generate = useServerFn(aiGenerateText);

  const mutation = useMutation({
    mutationFn: async (prompt: string) =>
      generate({
        data: {
          task: { type: "text" as const, preferModel: model },
          prompt,
          temperature,
          maxTokens,
          reason: "ai:workspace-chat",
          reference: model,
        },
      }),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.output,
          ts: Date.now(),
          model: res.model,
          latencyMs: res.latencyMs,
          credits: res.usage.credits,
          cached: res.cached,
        },
      ]);
      requestAnimationFrame(() =>
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }),
      );
    },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Falha na chamada ao Gateway"),
  });

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed, ts: Date.now() }]);
    setInput("");
    mutation.mutate(trimmed);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Modelo:</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="h-8 w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mutation.isPending && (
          <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            gerando…
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className="min-h-[360px] max-h-[520px] overflow-y-auto rounded-lg border border-border bg-card/30 p-4"
      >
        {messages.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="Comece uma conversa"
            description="Envie uma mensagem para o Gateway Central. Suporta texto, markdown, código e tabelas na resposta."
          />
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}
                >
                  <pre className="whitespace-pre-wrap break-words font-sans">{m.content}</pre>
                  {m.role === "assistant" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
                      <span>{m.model}</span>
                      <span>·</span>
                      <span>{m.latencyMs} ms</span>
                      <span>·</span>
                      <span>{m.credits} cr</span>
                      {m.cached && <StatusBadge tone="info">cache hit</StatusBadge>}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva uma mensagem… (Ctrl+Enter para enviar)"
          className="min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button onClick={submit} disabled={mutation.isPending || !input.trim()}>
          <Send className="mr-1 h-4 w-4" />
          Enviar
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        <Server className="mr-1 inline h-3 w-3" />
        Todas as chamadas passam pelo AIManager (Gateway Central) e são debitadas via credit_ledger.
      </p>
    </div>
  );
}

function StatsPanel({
  ledger,
  metrics,
  health,
}: {
  ledger: { amount: number; createdAt: string }[];
  metrics:
    | { requests?: number; errors?: number; creditsSpent?: number; avgLatencyMs?: number }
    | undefined;
  health: readonly { provider: string; status: string; latencyMs: number | null }[];
}) {
  const now = new Date();
  const buckets = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = ledger
        .filter((e) => e.createdAt.slice(0, 10) === key)
        .reduce((s, e) => s + Math.abs(e.amount), 0);
      days.push({ label: d.toLocaleDateString("pt-BR", { weekday: "short" }), total });
    }
    return days;
  }, [ledger, now]);
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const weekly = buckets.reduce((s, b) => s + b.total, 0);
  const monthly = ledger
    .filter((e) => new Date(e.createdAt).getMonth() === now.getMonth())
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Hoje"
          value={buckets[buckets.length - 1]?.total ?? 0}
          hint="créditos IA"
        />
        <MetricCard label="7 dias" value={weekly} hint="créditos IA" />
        <MetricCard label="Este mês" value={monthly} hint="créditos IA" />
        <MetricCard
          label="Créditos totais gastos"
          value={metrics?.creditsSpent ?? 0}
          hint={`${metrics?.requests ?? 0} requests`}
        />
      </div>

      <FormSection
        title="Consumo diário (últimos 7 dias)"
        description="Baseado no credit_ledger — apenas entradas ai:*"
      >
        <div className="grid grid-cols-7 items-end gap-2 h-40">
          {buckets.map((b) => (
            <div key={b.label} className="flex h-full flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-accent/80 transition-all"
                style={{
                  height: `${(b.total / max) * 100}%`,
                  minHeight: b.total > 0 ? "6px" : "2px",
                }}
                title={`${b.total} cr`}
              />
              <div className="text-[10px] uppercase text-muted-foreground">{b.label}</div>
              <div className="text-[10px] font-medium tabular-nums">{b.total}</div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Saúde por provider">
        <div className="grid gap-2 md:grid-cols-2">
          {health.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados de saúde.</p>
          ) : (
            health.map((h) => (
              <div
                key={h.provider}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div>
                  <div className="font-medium capitalize">{h.provider}</div>
                  <div className="text-xs text-muted-foreground">
                    Latência: {h.latencyMs ?? "—"} ms
                  </div>
                </div>
                <StatusBadge
                  tone={
                    h.status === "healthy"
                      ? "success"
                      : h.status === "down"
                        ? "danger"
                        : h.status === "degraded"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {h.status}
                </StatusBadge>
              </div>
            ))
          )}
        </div>
      </FormSection>
    </div>
  );
}
