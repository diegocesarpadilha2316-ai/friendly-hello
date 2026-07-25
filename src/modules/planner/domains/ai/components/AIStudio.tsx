import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { DEFAULT_PROVIDER, listProviders } from "../providers";
import { getLogs } from "../services/logs";
import { toolSchemas } from "../services/tools";
import { VISION_SUPPORTED_KINDS } from "../services/vision";
import { useAi } from "../hooks/use-ai";
import type { AIProviderId } from "../types";

const TABS = [
  "chat",
  "historico",
  "ferramentas",
  "prompts",
  "modelos",
  "memoria",
  "visao",
  "config",
  "logs",
  "provider",
  "tokens",
  "streaming",
] as const;

/**
 * AIStudio — UI dark-first do domínio ai. Não cria estado global:
 * apenas compõe useAi() e consome dados via updateProject().
 */
export function AIStudio() {
  const [providerId, setProviderId] = useState<AIProviderId>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");

  const ai = useAi({
    provider: providerId,
    apiKey: apiKey || undefined,
    baseUrl: baseUrl || undefined,
    model: model || undefined,
  });

  const tools = useMemo(() => toolSchemas(), []);
  const logs = getLogs();

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Dioris AI Studio</span>
          <Badge variant="secondary">{ai.providerId}</Badge>
          {ai.status === "streaming" && <Badge>streaming…</Badge>}
          {ai.status === "error" && <Badge variant="destructive">erro</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={ai.stop} disabled={ai.status !== "streaming"}>
            Parar
          </Button>
          <Button size="sm" variant="outline" onClick={ai.reset}>
            Limpar
          </Button>
        </div>
      </header>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col px-4 pb-4 gap-3">
          <ScrollArea className="flex-1 rounded border border-border bg-card/40 p-3">
            {ai.conversation.messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Comece uma conversa. Ex.: "Crie uma cozinha em L de 3,2 m x 2,4 m".
              </p>
            )}
            {ai.conversation.messages.map((m, i) => (
              <div key={i} className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {m.role}
                </div>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Fale com a IA…"
              className="resize-none"
            />
            <Button
              onClick={() => {
                const v = input;
                setInput("");
                void ai.send(v);
              }}
              disabled={ai.status === "streaming"}
            >
              Enviar
            </Button>
          </div>
          {ai.error && <p className="text-xs text-destructive">{ai.error}</p>}
        </TabsContent>

        <TabsContent value="historico" className="px-4 pb-4">
          <ScrollArea className="h-[60vh] rounded border border-border p-3">
            {ai.conversation.messages.map((m, i) => (
              <div key={i} className="text-xs mb-2">
                <b>{m.role}:</b> {m.content}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ferramentas" className="px-4 pb-4">
          <ScrollArea className="h-[60vh]">
            <ul className="text-sm space-y-1">
              {tools.map((t) => (
                <li key={t.name} className="border-b border-border/50 pb-1">
                  <b>{t.name}</b> — <span className="text-muted-foreground">{t.description}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="prompts" className="px-4 pb-4 text-sm space-y-2">
          <p className="text-muted-foreground">Prompts compõem system + developer + contextos por domínio.</p>
          <ul className="list-disc pl-6 text-xs space-y-1">
            {["system","developer","project","room","selection","library","catalog","budget","production","render","video","engineering","importer","realtime","factory","marketplace","decorator","conversation"].map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="modelos" className="px-4 pb-4 space-y-2 text-sm">
          <label className="block text-xs text-muted-foreground">Provider</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as AIProviderId)}
            className="bg-background border border-border rounded px-2 py-1 text-sm"
          >
            {listProviders().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <Input placeholder="Modelo (opcional)" value={model} onChange={(e) => setModel(e.target.value)} />
        </TabsContent>

        <TabsContent value="memoria" className="px-4 pb-4 text-sm">
          <p className="text-muted-foreground">
            Sessão atual: {ai.conversation.messages.length} mensagem(ns) · max turns {ai.conversation.maxTurns}.
          </p>
          {ai.conversation.summary && (
            <pre className="mt-2 p-2 bg-card/60 rounded text-xs whitespace-pre-wrap">
              {ai.conversation.summary.summary}
            </pre>
          )}
        </TabsContent>

        <TabsContent value="visao" className="px-4 pb-4 text-sm">
          <p className="text-muted-foreground">Formatos preparados (execução via domínio importer / ia visão):</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {VISION_SUPPORTED_KINDS.map((k) => (
              <Badge key={k} variant="outline">{k}</Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="px-4 pb-4 space-y-2 text-sm">
          <Input placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" />
          <Input placeholder="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </TabsContent>

        <TabsContent value="logs" className="px-4 pb-4">
          <ScrollArea className="h-[60vh]">
            <ul className="text-xs space-y-1">
              {logs.map((l) => (
                <li key={l.id} className="border-b border-border/40 pb-1">
                  <span className="text-muted-foreground">{l.at}</span> · <b>{l.provider}</b> · {l.kind} · {l.message}
                  {l.durationMs != null && <> · {l.durationMs}ms</>}
                </li>
              ))}
              {logs.length === 0 && <p className="text-muted-foreground">Sem logs ainda.</p>}
            </ul>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="provider" className="px-4 pb-4 text-sm">
          <p><b>Ativo:</b> {ai.providerId}</p>
          <p className="text-muted-foreground">Padrão: {DEFAULT_PROVIDER} · Compatível com OpenAI/Gemini/Claude/Mistral/OSS.</p>
        </TabsContent>

        <TabsContent value="tokens" className="px-4 pb-4 text-sm">
          <p className="text-muted-foreground">
            Total tool-results neste turno: {ai.toolResults.length}
          </p>
        </TabsContent>

        <TabsContent value="streaming" className="px-4 pb-4 text-sm">
          <p className="text-muted-foreground">
            Status: <b>{ai.status}</b>. DeepSeek suporta streaming SSE nativo.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIStudio;