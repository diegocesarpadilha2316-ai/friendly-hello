# Validação real no viewport + relatório de estabilização

Você pediu um relatório objetivo, não apenas "os testes passaram". Para isso ser honesto, primeiro é preciso medir o sistema rodando — os quatro comandos ainda não foram confirmados visualmente no viewport real. Portanto esta etapa **não está concluída** até a validação abaixo ser executada.

## O que será feito

### 1. Execução real dos quatro comandos

Automação de navegador contra o app rodando, autenticada, entrando em `/planner/ia` e enviando um comando por sessão:

- Crie um closet de casal
- Crie uma cozinha em L
- Crie um banheiro com gabinete suspenso
- Crie uma lavanderia com máquina e tanque

Para cada comando: screenshot do viewport, leitura dos diagnósticos de runtime (`__DIORIS_ROOM__`, evidência de cena, contagem de meshes) e registro de erros de console. Resultado por comando: apareceu / não apareceu / apareceu incompleto.

### 2. Medições antes/depois

Coleta instrumentada, com valores reais e método declarado para cada um:

- FPS médio e mínimo em 10s de órbita
- quantidade de meshes e draw calls
- número de renders React dos componentes do viewport
- número de reconstruções do Assembly por interação
- tempo do autosave (debounce + duração)
- memória do renderer Three.js quando exposta

Onde um número "antes" não puder ser reconstruído com confiança, o relatório dirá explicitamente "não medido" em vez de estimar.

### 3. Causas raiz documentadas com evidência

- Invisibilidade: apontar o ponto exato do fluxo (interpretação da IA, blueprint, decomposer, montagem, publicação de evidência de cena ou câmera) com o arquivo e a linha que provam a causa.
- Lentidão: apontar o cálculo por frame ou re-render responsável, com a medição que o sustenta.

### 4. Correções somente do que a validação reprovar

Nenhuma funcionalidade nova. Se um dos quatro comandos falhar, o defeito é corrigido no ponto identificado e o comando é reexecutado até passar visualmente.

### 5. Relatório final

Documento com: causas raiz, lista de arquivos alterados, resultado prático dos quatro comandos, tabela antes/depois, cálculos contínuos removidos, como ficou a validação de sucesso da IA, contagem final de testes e saída do typecheck.

## Detalhes técnicos

- Automação via Playwright headless contra `http://localhost:8080`, viewport 1280x1800, sessão Supabase restaurada antes de navegar para rota autenticada.
- Diagnósticos já existentes reaproveitados: `src/modules/planner/shared/editor-3d/runtime-diagnostics.ts`, `scene-runtime.ts`, `Scene3D.tsx`.
- Pontos de inspeção do fluxo da IA: `src/modules/planner/domains/ia/services/{interpreter,blueprint,decomposer,post-execution}.ts` e o hook de chat/execução de plano.
- Testes e typecheck rodados ao final; nenhum número do relatório vem de suposição.

## Critério de aprovação

A etapa só é declarada concluída quando os quatro comandos produzirem móvel visível em screenshot, sem erro de console, e as medições depois estiverem registradas.
