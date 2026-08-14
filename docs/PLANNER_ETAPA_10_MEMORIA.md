# Etapa 10 — Memória Inteligente do Projeto

Nenhuma migration, nenhum SQL, nenhuma tabela. A memória usa runtime +
`localStorage`, no mesmo isolamento por tenant+projeto já usado pela
sessão de chat da Etapa 5 (`dioris.planner.ai.memory.<tenant>.<projeto>`).

## Estrutura

`identity` (nome, tipo de ambiente, estágio), `style`, `materials`,
`preferences`, `constraints`, `decisions`, `pendings`, `executiveSummary`.
Cada fato tem `key` canônica, `value` curto, `origin` (user/tool/engine),
`agent` e `updatedAt`.

## Atualização

Ao final de cada turno **concluído**, `updateMemoryFromTurn()` lê o projeto
resultante e apenas as tool calls com status `ok`. Turnos cancelados, com
erro, tool calls parciais, hipóteses e mensagens de erro nunca entram.
Do texto do usuário só saem preferências/restrições explícitas.

## Conflitos

`upsertFacts` indexa por `key`: `material:corpo = Freijó` é sobrescrito por
`material:corpo = Carvalho`. Nunca duas versões ativas do mesmo fato.
Pendências fecham automaticamente quando a tool correspondente roda
(`estimate_budget` fecha "orçamento", `set_render_preset` fecha "render").

## Uso pelos agentes

`buildMemoryPromptBlock()` gera um bloco compacto (teto de 900 caracteres)
injetado no system prompt do chat e no prompt do planejador de tools —
antes do briefing multiagente, então todos os especialistas o recebem.
O histórico bruto continua não sendo reenviado.

## Interface

`ProjectMemoryPanel` (colapsado por padrão, no topo do painel de IA):
resumo executivo na linha fechada; aberto mostra estilo, materiais,
preferências, restrições, decisões e pendências, com **Atualizar**
(recalcula o resumo) e **Limpar memória** (com confirmação em dois passos).

## Segurança

`sanitizeValue` bloqueia chaves, tokens, JWT, `dio_`, `sk-`, senhas e
segredos, e limita cada valor a 160 caracteres. Nada de prompt interno ou
raciocínio é armazenado. Telemetria (motivo, timestamp, agente, chaves
alteradas) existe apenas em runtime, limitada a 50 entradas.

## Limitações

- A memória vive no navegador: outro dispositivo começa vazia (persistir no
  banco exigiria migration, proibida nesta etapa).
- A extração é determinística/heurística, sem chamada extra ao LLM, para não
  aumentar custo nem latência do streaming.
