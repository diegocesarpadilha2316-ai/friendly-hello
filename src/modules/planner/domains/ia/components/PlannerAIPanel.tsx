/**
 * Painel de chat da IA do Planner — visual estilo ChatGPT/Claude.
 *
 * Consome exclusivamente `usePlannerChat`. Não abre APIs de IA nem
 * detém estado de projeto — apenas apresenta a conversa.
 */
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Square,
  Trash2,
  Wand2,
  User as UserIcon,
  Wrench,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import { usePlannerChat } from "../hooks/use-planner-chat";
import type { PlannerAIMessage } from "../types";

export interface PlannerAIPanelProps {
  variant?: "docked" | "fullscreen";
  className?: string;
  onClose?: () => void;
}

export function PlannerAIPanel({ variant = "docked", className, onClose }: PlannerAIPanelProps) {
  const chat = usePlannerChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  function submit() {
    if (!input.trim() || chat.isBusy) return;
    void chat.send(input);
    setInput("");
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur",
        variant === "docked" && "w-[380px]",
        className,
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Dioris IA</div>
            <div className="text-[11px] text-muted-foreground">
              {chat.isBusy ? "processando…" : "pronta para conversar"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={chat.clear} title="Nova conversa">
            <Trash2 className="h-4 w-4" />
          </Button>
          {onClose ? (
            <Button size="sm" variant="ghost" onClick={onClose} title="Fechar">
              ✕
            </Button>
          ) : null}
        </div>
      </header>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {chat.messages.map((m) => (
          <MessageRow key={m.id} message={m} onEdit={chat.editMessage} />
        ))}
        {chat.status === "thinking" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/70" />
              <span className="relative rounded-full bg-primary h-2 w-2" />
            </span>
            pensando…
          </div>
        )}
      </div>

      {/* Sugestões rápidas */}
      {chat.messages.length <= 2 && (
        <div className="border-t border-border/60 bg-muted/30 px-3 py-2">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Wand2 className="h-3 w-3" /> Sugestões
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chat.quickActions.map((qa) => (
              <button
                key={qa.id}
                type="button"
                onClick={() => chat.send(qa.prompt)}
                className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-foreground/90 transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <footer className="border-t border-border/60 bg-background/80 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder='Ex.: "crie uma cozinha moderna com ilha"'
            className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={chat.status === "error"}
          />
          {chat.isBusy ? (
            <Button size="sm" variant="destructive" onClick={chat.cancel} title="Cancelar">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={!input.trim()} title="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          A IA modifica o mesmo projeto — todas as ações passam por Undo/Redo e Autosave.
        </p>
      </footer>
    </div>
  );
}

function MessageRow({
  message,
  onEdit,
}: {
  message: PlannerAIMessage;
  onEdit: (id: string, text: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  useEffect(() => setDraft(message.content), [message.content]);

  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={cn("group max-w-[85%] space-y-1")}>
        {editing ? (
          <div className="rounded-2xl border border-primary/50 bg-primary/5 p-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
            <div className="mt-1 flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setEditing(false);
                  await onEdit(message.id, draft);
                }}
              >
                Reenviar
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-foreground",
            )}
          >
            <MarkdownLite text={message.content} />
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <ul className="space-y-1 pl-1">
            {message.toolCalls.map((tc) => (
              <li
                key={tc.id}
                className={cn(
                  "flex items-start gap-1.5 rounded-md border px-2 py-1 text-[11px]",
                  tc.status === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : tc.status === "error"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border/50 bg-muted/40 text-muted-foreground",
                )}
              >
                <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  {tc.agent ? (
                    <span className="mr-1 rounded bg-primary/20 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {tc.agent}
                    </span>
                  ) : null}
                  <span className="font-medium">{tc.name}</span>
                  {tc.message ? ` — ${tc.message}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {isUser && !editing && (
          <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" /> editar
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

/**
 * Renderização leve de **negrito** + linhas quebradas — evita adicionar
 * dependência de react-markdown apenas para essa fase.
 */
function MarkdownLite({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}