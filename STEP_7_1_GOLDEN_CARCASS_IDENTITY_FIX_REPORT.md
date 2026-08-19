# STEP 7.1 — Golden Carcass Identity Fix

**Projeto:** Dioris Planner V2  
**Golden Module:** `kitchen-base-2-doors` — Balcão 2 Portas  
**Tipo:** correção cirúrgica de identidade e rastreabilidade  
**Status:** **CONCLUÍDA — parada para auditoria externa**

## 1. Escopo

Esta correção não redesenha a arquitetura da Etapa 7 e não inicia a Etapa 8. O fluxo permanece:

> `CarcassConstructionRule → resolveCarcassConstruction() → ResolvedCarcass → buildCarcass() → PartDefinitions → buildModule() → viewport / fabricationReport / nestingPlan`

A única alteração de produção é a correção do identificador enviado ao `resolveCarcassConstruction()` no caminho Golden de `buildCarcass()`.

## 2. Auditoria antes da alteração

O caminho real do Dioris separa as duas identidades. `usePlannerStore.addFurnitureInstance()` cria um ID próprio para a ocorrência e chama `buildModule()` com `instanceId: id` e `moduleId: moduleDefinitionId`. O `buildModule()` encontra a definição no `ModuleRegistry` e a fábrica profissional encaminha:

```ts
buildBase(instanceId, dimensionsMm, {
  moduleDefinitionId: config.id,
  ...
})
```

No Golden, `config.id` é `kitchen-base-2-doors`. O primeiro argumento de `buildBase()` e de `buildCarcass()` é o ID da instância.

Antes da correção, o resolver recebia:

```ts
resolveCarcassConstruction({
  moduleDefinitionId: moduleId,
  ...
})
```

Esse valor era semanticamente incorreto no caminho real, porque `moduleId` é usado pelos helpers `part()` e `hardware()` para prefixar IDs de peças e groupIds. Em uma instância concreta, ele representa a ocorrência, não a definição.

## 3. Correção aplicada

A chamada foi alterada somente para:

```ts
resolveCarcassConstruction({
  moduleDefinitionId: options.moduleDefinitionId ?? GOLDEN_CARCASS_CONSTRUCTION_RULE.moduleDefinitionId,
  ...
})
```

`options.moduleDefinitionId` já é fornecido pela fábrica profissional como `config.id`. O fallback apenas mantém o contrato seguro para chamadas diretas do builder; no caminho Golden profissional o valor recebido é explicitamente `kitchen-base-2-doors`.

O `moduleId` continua sendo usado nos helpers de criação das peças. Portanto, não houve alteração de IDs de PartDefinitions, groupIds, materiais, dimensões ou posições.

## 4. Prova de identidade

A regressão percorre o caminho real `store → buildModule() → builder → PartDefinitions` e demonstra:

| Invariante | Resultado |
|---|---|
| `instanceId !== moduleDefinitionId` | **PASS** |
| `instance.moduleDefinitionId === "kitchen-base-2-doors"` | **PASS** |
| `ResolvedCarcass.moduleDefinitionId === "kitchen-base-2-doors"` | **PASS** |
| `PartDefinition.moduleId === instanceId` | **PASS** |
| ID de `side-left` usa o prefixo da instância | **PASS** |
| ID de `base` preserva dimensão Golden | **PASS** |
| `moduleId` não foi substituído por definição nos IDs | **PASS** |

A identidade da definição e a identidade da ocorrência agora são simultaneamente preservadas.

## 5. Geometria Golden preservada

Nenhuma fórmula foi alterada. O snapshot continua:

| Parte | Dimensões | Centro MODULE-LOCAL |
|---|---:|---:|
| `side-left` | 18 × 720 × 580 mm | −441, 510, 0 |
| `side-right` | 18 × 720 × 580 mm | +441, 510, 0 |
| `base` | 864 × 18 × 580 mm | 0, 159, 0 |
| `top` | 864 × 18 × 580 mm | 0, 861, 0 |
| `back` | 864 × 684 × 6 mm | 0, 510, −287 |
| `shelf-1` | 862 × 18 × 560 mm | 0, 510, 10 |
| `toe-kick` | 864 × 150 × 20 mm | 0, 75, 260 |

A prateleira permanece em **Y = 510 mm**. Painel, fundo, rodapé, materiais, grain, edge banding, Front Layout, Hardware Placement e Coordinate Semantics não foram alterados.

## 6. Regressão downstream

As regressões anteriores continuam aprovadas. A validação confirma que nenhuma peça desapareceu, duplicou, mudou de dimensão ou recebeu identidade instável. Cut-list e nesting continuam consumindo as mesmas PartDefinitions. Hardware, Joinery e Machining das Etapas 5, 6, 6.1 e 6.2 continuam aprovados.

| Camada | Resultado |
|---|---|
| Carcass / PartDefinitions | **PASS** |
| Viewport / posições locais | **PASS** |
| Front Layout | **PASS** |
| Hardware Placement | **PASS** |
| Coordinate Semantics | **PASS** |
| Joinery | **PASS** |
| Machining | **PASS** |
| Materiais / espessuras | **PASS** |
| Grain / edge banding | **PASS** |
| Cut-list / fabricationReport | **PASS** |
| Nesting / integridade | **PASS** |
| IDs estruturais / groupIds | **PASS** |

## 7. Validação final

| Verificação | Resultado |
|---|---|
| Vitest completo | **47 arquivos aprovados** |
| Testes completos | **578 aprovados** |
| Testes direcionados Golden e etapas anteriores | **26 aprovados** |
| Production build | **Aprovado** |
| TypeScript | **5 erros baseline preexistentes** |
| Novos erros TypeScript da Step 7.1 | **0** |

Os cinco erros TypeScript restantes estão em `usePlannerStore.ts`, linhas 1089–1093, e são os mesmos erros baseline de `string | null` atribuído a `string`. Eles não foram ocultados nem atribuídos à correção atual.

## 8. Escopo não iniciado

A Step 7.1 não alterou UI, nesting, fabricação, regras de porta, ferragens, carcass, fórmulas Golden ou arquitetura. Não foram adicionadas famílias, CAM, CNC ou G-code. A Etapa 8 não foi iniciada.

## 9. Arquivos alterados e evidências

| Arquivo | Finalidade |
|---|---|
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | Correção mínima do campo `moduleDefinitionId` no resolver |
| `src/modules/planner-v2/pkg/state/goldenCarcassConstruction.test.ts` | Regressão real store → buildModule → PartDefinitions |
| `evidence/etapa7-1-identity-audit.md` | Auditoria antes/depois e origem das identidades |
| `STEP_7_1_GOLDEN_CARCASS_IDENTITY_FIX_REPORT.md` | Relatório técnico fonte |
| `STEP_7_1_GOLDEN_CARCASS_IDENTITY_FIX_REPORT.pdf` | Relatório PDF solicitado |
| `evidence/step7-1-validation/` | Logs de Vitest, build e TypeScript |

## Conclusão

A correção atende ao critério de identidade da Step 7.1: `moduleDefinitionId` agora representa a definição real (`kitchen-base-2-doors`), `instanceId` permanece independente, e os IDs de peças/groupIds continuam rastreáveis por instância. A geometria Golden e toda a cadeia downstream permanecem matematicamente idênticas.

A Step 7.1 está concluída e deve parar para auditoria externa antes de qualquer avanço.
