# DIAGNÓSTICO DO BLOQUEIO VISUAL — PLANNER V2

**Ambiente:** Cloudflare Workers  
**Rota:** `/planner-v2`  
**Commit da correção:** [`ba9127b`](https://github.com/diegocesarpadilha2316-ai/friendly-hello/commit/ba9127b)  
**Data:** 16 de agosto de 2026

## Causa raiz encontrada

A reprodução no navegador automatizado original termina com a aba em `about:blank`, mas não há evidência de que o aplicativo faça esse redirect. Na captura imediatamente antes da queda, a URL ainda é `https://dioris-planner-v2.dioris-planner.workers.dev/planner-v2`; o console não registra `console.error`, exception não tratada, `unhandledrejection`, erro React, erro de import dinâmico ou erro de autenticação. A captura seguinte já está em `about:blank`, sem DOM e sem requests do Planner disponíveis para inspeção.

A reprodução independente com Chromium headless, usando a mesma URL pública, elimina a hipótese de rota, SSR, autenticação ou bundle quebrado: após 30 segundos, o DOM permanece com aproximadamente 68 KB, contém o shell `DIORIS PLANNER V2`, contém um `<canvas>` e a Biblioteca. O mesmo Chromium gerou screenshot real do Planner no Cloudflare. Portanto, o `about:blank` é produzido pela sessão/captura automatizada original, não por uma navegação do Dioris.

A investigação também encontrou uma condição de robustez real no código: o `RoomScene` ocupava o Canvas 3D sem um limite visual envolvendo-o. Em ambientes onde a inicialização do WebGL/Three falhar, uma exceção de renderização poderia desmontar a área principal sem preservar o shell de Biblioteca e fabricação. O Chromium headless registrou apenas stalls de `ReadPixels` do driver/software WebGL; não registrou crash do Planner. Essa condição foi corrigida preventivamente com contenção explícita, sem alterar a fabricação.

## Hipóteses isoladas

| Hipótese | Resultado | Evidência |
|---|---|---|
| Navegação/roteamento | **Eliminada como causa do app** | Rota SSR responde HTTP 200; Chromium navega e permanece no Planner. |
| SSR/hidratação | **Eliminada** | DOM pós-hidratação contém shell, Biblioteca e canvas no Chromium independente. |
| Assets/chunks | **Eliminada** | HTML referencia scripts; o asset Planner responde HTTP 200. |
| Autenticação | **Eliminada** | Home → Entrar → Workspace abre com `admin@dioris.local`; Chromium direto renderiza Planner. |
| WebGL/Three | **Risco de robustez, não crash comprovado** | Há stalls `GPU ... ReadPixels`; fallback foi adicionado. |
| Canvas/R3F | **Contido** | Error Boundary envolve `RoomScene`; Canvas possui fallback de compatibilidade. |
| React/import dinâmico | **Sem evidência de erro** | Console da sessão automatizada não mostra exception; Chromium monta a interface. |
| Memória | **Sem evidência de OOM** | Não há mensagem de OOM/crash; Chromium permanece aberto por 30 s. |
| Service worker/cache | **Sem evidência** | Bundle final é servido e renderizado no Chromium. |
| Navegador automatizado/captura | **Causa do bloqueio observado** | A mesma URL funciona em Chromium headless e a sessão original termina em `about:blank` sem erro do app. |

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/modules/planner-v2/ui/PlannerV2Layout.tsx` | Envolvimento do `RoomScene` com `AppErrorBoundary`, preservando shell, Biblioteca e Plano de Corte em falha do viewport. |
| `src/modules/planner-v2/pkg/scene/RoomScene.tsx` | Fallback visual `Modo de compatibilidade 3D` no Canvas quando WebGL não inicializar. |

Não foram alterados módulos, famílias, fabricação, Plano de Corte, nesting, Render V10 ou Vercel.

## Correção

O Planner agora mantém a aplicação principal disponível quando o renderer 3D falhar. Em WebGL disponível, o comportamento permanece o Canvas 3D normal. Em WebGL indisponível ou com erro renderizado pelo componente, o usuário recebe um fallback de compatibilidade no viewport, enquanto a Biblioteca, o estado do projeto e as ferramentas de fabricação continuam no shell.

## Teste local

**PASS.** O build de produção foi concluído e a suíte relevante terminou com **5 arquivos e 13 testes aprovados**. A fabricação Golden não foi modificada.

## Teste Cloudflare

**PASS para a aplicação pública em Chromium independente.** A rota pública responde HTTP 200, o Chromium headless permanece com DOM montado por 30 segundos e gera screenshot real do Planner mostrando estrutura, canvas, móveis e painel de IA/Inspector.

**FAIL para a sessão automatizada original.** Essa sessão ainda perde a aba e apresenta `about:blank` após abrir `/planner-v2`, mesmo depois da contenção. Como não há erro do aplicativo no console nem redirect emitido pelo site, essa falha não foi atribuída falsamente ao Dioris.

## Planner aberto por 30 segundos

**PASS em Chromium independente.** O processo permaneceu aberto por 30 segundos e produziu screenshot.  
**FAIL na captura automatizada original.** A aba dessa ferramenta não permaneceu disponível.

## Screenshot real

**PASS em Chromium independente.** Arquivo: `dioris-final-visual.png`. A imagem mostra a rota pública do Cloudflare com o título `DIORIS PLANNER V2`, árvore de estrutura, canvas 3D, móveis, barra de ferramentas e painel de IA/Inspector.

## Plano de Corte visual

**FAIL nesta etapa.** A missão de diagnóstico deveria testar apenas a permanência visual do Planner, e não criar a cozinha. Como a sessão automatizada original não permaneceu aberta, não foi possível interagir visualmente com Biblioteca, Novo ou Plano de Corte nesta execução. Não declarar PASS por HTTP, SSR ou testes unitários.

## Conclusão

A causa raiz do `about:blank` observado foi isolada como comportamento da sessão/captura automatizada original, pois a mesma versão pública permanece funcional em Chromium independente. A correção de robustez do aplicativo foi publicada no commit `ba9127b`, com Error Boundary e fallback de WebGL. A prova online do Planner aberto por 30 segundos existe no Chromium independente; a prova equivalente na sessão automatizada original permanece **FAIL**. A missão deve parar aqui, sem avançar para cozinha, Render V10 ou novas famílias.
