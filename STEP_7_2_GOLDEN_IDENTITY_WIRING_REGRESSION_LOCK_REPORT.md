# STEP 7.2 — Golden Identity Wiring Regression Lock

**Projeto:** Dioris Planner V2  
**Golden Module:** `kitchen-base-2-doors` — Balcão 2 Portas  
**Tipo:** Regression Lock de identidade do wiring  
**Status:** **CONCLUÍDA — parada para auditoria externa**

## 1. Objetivo

A Step 7.2 não altera a implementação funcional da Step 7.1. Ela adiciona uma proteção de regressão que observa diretamente a chamada real originada pelo caminho:

> `store → buildModule() → buildBase() → buildCarcass() → resolveCarcassConstruction()`

O objetivo é garantir que o resolver receba a identidade da definição (`kitchen-base-2-doors`) e nunca o ID da instância.

## 2. Auditoria do wiring

No caminho real, o store cria um ID próprio para a ocorrência. `buildModule()` recebe `moduleId` como a definição e `instanceId` como a ocorrência. A fábrica profissional chama `buildBase(instanceId, ..., { moduleDefinitionId: config.id })`. Consequentemente, `buildCarcass()` recebe `moduleId` como prefixo instance-scoped para peças e recebe `options.moduleDefinitionId` como definição.

O código de produção correto permanece:

```ts
resolveCarcassConstruction({
  moduleDefinitionId:
    options.moduleDefinitionId ?? GOLDEN_CARCASS_CONSTRUCTION_RULE.moduleDefinitionId,
  ...
})
```

O teste não altera a produção para capturar o valor. Ele usa `vi.spyOn(carcassResolver, "resolveCarcassConstruction")` e cria o módulo através do store, permitindo observar os argumentos reais usados pelo builder.

## 3. Assertions do Regression Lock

A regressão confirma diretamente:

| Assertion | Resultado |
|---|---|
| Instância é criada por caminho real do store | **PASS** |
| `instanceId !== "kitchen-base-2-doors"` | **PASS** |
| O spy observa uma chamada real do resolver | **PASS** |
| `receivedInput.moduleDefinitionId === "kitchen-base-2-doors"` | **PASS** |
| `receivedInput.moduleDefinitionId !== instanceId` | **PASS** |
| `PartDefinition.moduleId === instanceId` | **PASS** |
| ID de `side-left` usa o prefixo da instância | **PASS** |
| ID de `base` mantém dimensões 864 × 18 × 580 | **PASS** |

A prova não chama manualmente o resolver para validar a identidade capturada. A chamada observada é a que ocorre durante a construção real da instância Golden.

## 4. Mutation check

Para comprovar que o teste captura especificamente o bug, a produção foi temporariamente simulada com o wiring antigo:

```ts
moduleDefinitionId: moduleId
```

Nesse cenário, o Regression Lock falhou com `exit=1`, `1 failed` e `AssertionError: expected undefined to be defined`, porque nenhuma chamada capturada possuía `moduleDefinitionId === "kitchen-base-2-doors"`.

O código correto foi restaurado imediatamente. A execução posterior do mesmo teste resultou em `1 passed`, `1 test` e `exit=0`. A mutation proposital não está presente na entrega final.

## 5. Geometria e identidade física preservadas

A Step 7.2 não altera nenhuma fórmula Golden. O snapshot permanece:

| Parte | Dimensões | Centro MODULE-LOCAL |
|---|---:|---:|
| `side-left` | 18 × 720 × 580 mm | −441, 510, 0 |
| `side-right` | 18 × 720 × 580 mm | +441, 510, 0 |
| `base` | 864 × 18 × 580 mm | 0, 159, 0 |
| `top` | 864 × 18 × 580 mm | 0, 861, 0 |
| `back` | 864 × 684 × 6 mm | 0, 510, −287 |
| `shelf-1` | 862 × 18 × 560 mm | 0, 510, 10 |
| `toe-kick` | 864 × 150 × 20 mm | 0, 75, 260 |

Os IDs das peças e `groupIds` continuam instance-scoped. A definição não foi usada como prefixo físico das PartDefinitions.

## 6. Regressão downstream

A Step 7.2 não alterou carcass, viewport, Front Layout, Hardware Placement, Coordinate Semantics, Joinery, Machining, materiais, espessuras, grain, edge banding, cut-list, fabricationReport ou nesting. As suítes anteriores continuam aprovadas.

| Camada | Resultado |
|---|---|
| Carcass / PartDefinitions | **PASS** |
| Viewport / coordenadas locais | **PASS** |
| Front Layout | **PASS** |
| Hardware Placement | **PASS** |
| Coordinate Semantics | **PASS** |
| Joinery / Machining | **PASS** |
| Materiais / espessuras / grain / edge banding | **PASS** |
| Cut-list / fabricationReport | **PASS** |
| Nesting / IDs / groupIds | **PASS** |

## 7. Validação final

| Verificação | Resultado |
|---|---|
| Vitest completo | **48 arquivos aprovados** |
| Testes completos | **579 aprovados** |
| Regression Lock isolado | **1 arquivo, 1 teste aprovado** |
| Testes direcionados Golden + etapas anteriores | **27 aprovados** |
| Production build | **Aprovado** |
| TypeScript | **5 erros baseline preexistentes** |
| Novos erros TypeScript da Step 7.2 | **0** |

Os cinco erros TypeScript permanecem em `usePlannerStore.ts`, linhas 1089–1093, relacionados a `string | null` atribuído a `string`. Eles são baseline e não foram ocultados, corrigidos indiscriminadamente ou atribuídos à Step 7.2.

## 8. Escopo não iniciado

Não foram alterados UI, carcass, portas, hardware, machining, joinery, nesting ou fabricação. Não foram adicionadas famílias, CAM, CNC ou G-code. A Etapa 8 não foi iniciada.

## 9. Arquivos da entrega

| Arquivo | Finalidade |
|---|---|
| `src/modules/planner-v2/pkg/state/goldenCarcassIdentityWiring.test.ts` | Regression Lock com spy no wiring real |
| `evidence/step7-2-wiring-mutation-check.md` | Evidência FAIL antigo / PASS correto |
| `STEP_7_2_GOLDEN_IDENTITY_WIRING_REGRESSION_LOCK_REPORT.md` | Fonte do relatório técnico |
| `STEP_7_2_GOLDEN_IDENTITY_WIRING_REGRESSION_LOCK_REPORT.pdf` | Relatório PDF solicitado |
| `evidence/step7-2-validation/` | Logs completos e direcionados |

## Conclusão

A Step 7.2 adiciona a proteção de regressão solicitada sem redesenhar a produção. O teste observa a chamada real do resolver pelo builder Golden, prova que a definição recebida é `kitchen-base-2-doors`, prova que ela não é o `instanceId`, preserva as identidades das PartDefinitions e falha quando o wiring antigo é simulado.

A Step 7.2 está concluída. O trabalho deve parar para auditoria externa antes de qualquer avanço.
