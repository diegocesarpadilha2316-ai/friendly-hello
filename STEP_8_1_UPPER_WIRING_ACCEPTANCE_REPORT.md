# Dioris Planner V2 — Step 8.1
## Golden Upper Wiring + Baseline Parity + Acceptance Lock

**Estado:** corrigido e validado. **Stage 9:** não iniciada.

## 1. Problema encontrado

A Step 8 anterior verificava principalmente a saída geométrica de `buildModule()`. Isso era insuficiente para provar que o fluxo profissional alcançava os resolvers compartilhados, porque a geometria legada podia coincidir com a geometria resolvida mesmo quando a regra nova não era selecionada.

A auditoria do fluxo real confirmou que a factory `upper()` recebia `config.id`, mas não o encaminhava para `buildUpper()`. Assim, `buildUpper()` recebia apenas `instanceId` e os demais parâmetros. Como `buildCarcass()` e `buildDoors()` selecionavam as regras Golden pelo campo opcional `options.moduleDefinitionId`, o Upper podia cair no caminho legado.

Também foi confirmado um segundo problema: `buildDoors()` chamava `resolveFrontLayout()` com `moduleId`, que representa a ocorrência física, em vez da identidade de definição.

## 2. Correções aplicadas

A factory Upper passou a encaminhar `moduleDefinitionId: config.id`. O builder seleciona a regra `GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE` para `kitchen-golden-upper-800` e a regra `GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE` para o mesmo ID. O input do FrontLayout agora usa `options.moduleDefinitionId ?? frontRule.moduleDefinitionId`, nunca o `instanceId`.

A regra frontal Upper foi corrigida para refletir o baseline físico auditado, e não uma simetria presumida:

| Campo | Valor |
|---|---:|
| `symmetric` | `false` |
| `leftRevealMm` | `2` |
| `rightRevealMm` | `4` |
| `interFrontGapMm` | `2` |
| `topRevealMm` | `2` |
| `bottomRevealMm` | `2` |

## 3. Prova por spies no caminho real

O teste `step8UpperWiring.test.ts` cria a ocorrência por `usePlannerStore.getState().addFurnitureInstance()`. Esse caminho usa o `ModuleRegistry`, chama `buildModule()`, recupera a definição e executa `ModuleDefinition.build()`.

Os spies observaram, no Upper, uma chamada de `resolveCarcassConstruction()` com `moduleDefinitionId = kitchen-golden-upper-800` e `rule.id = kitchen-golden-upper-800:carcass-v1`; uma chamada de `resolveFrontLayout()` com a regra `kitchen-golden-upper-800:baseline-front-layout-v2`; e duas chamadas de `resolveDoorHardwarePlacement()`, ambas recebendo um `frontLayout.moduleDefinitionId` igual ao ID de definição Upper.

A instância gerada possui ID próprio, diferente de `kitchen-golden-upper-800`. Todas as PartDefinitions possuem `moduleId` e `parentInstanceId` iguais ao ID da ocorrência, e nenhuma possui o ID da definição como `moduleId`.

## 4. Matemática e paridade

Para 800 mm de largura, o fechamento horizontal é `2 + 396 + 2 + 396 + 4 = 800`. As bordas são `[-398, -2]` e `[0, 396]`, os centros são `[-200, 198]` e os pivôs são `[-398, 396]`. Na vertical, `2 + 696 + 2 = 700`.

O resultado físico permanece: laterais `18 × 700 × 350`, base e topo `764 × 18 × 350`, fundo `764 × 664 × 6`, três prateleiras `762 × 18 × 330`, duas portas `396 × 696 × 18` e nenhum rodapé físico no Upper. O baseline total continua com 32 PartDefinitions: 10 físicas e 22 hardware.

## 5. Base + Upper

O teste de wiring cria também `kitchen-base-2-doors`. O Base continua usando `kitchen-base-2-doors:golden-carcass-between-sides` e `kitchen-base-2-doors:symmetric-front-layout-v1`. O Upper usa exclusivamente suas regras próprias. O Base mantém o rodapé/profile de hardware; o Upper não materializa toe-kick.

## 6. Downstream real

O teste `step8UpperAcceptance.test.ts` executa os serviços reais de Joinery, Machining, BOM, cut-list e nesting. A BOM física do Upper confirma 12 `shelf-support`, quatro `hinge-soft-close`, quatro `mounting-plate-37-32` e dois `handle-cava`. O cut-list inclui somente itens derivados de peças elegíveis e preserva material, espessura e veio. O nesting não inclui hardware e não perde, duplica ou inventa IDs.

As operações de Joinery e Machining apontam para a instância e para PartDefinitions existentes. O Machining preserva o estado `INCOMPLETE` quando dados de fabricante não estão disponíveis; nenhuma informação foi inventada.

## 7. A→B→A, múltiplas instâncias e invariância

O acceptance lock usa o passo dimensional declarado do módulo: o default é 800 mm e o próximo passo válido é 850 mm. Em `800 → 850 → 800`, o ID da instância e os IDs físicos permanecem estáveis; cut-list e nesting recalculam em B e retornam ao snapshot de A.

Duas ocorrências Upper possuem IDs distintos, a mesma definição, conjuntos de PartDefinitions sem interseção e operações de Machining isoladas por instância. Mover e rotacionar a instância altera somente os campos de mundo; o snapshot de operações locais permanece igual.

## 8. Mutation checks de produção

Foram executadas três mutações temporárias, sempre com restauração do arquivo original:

| Mutação | Resultado |
|---|---:|
| Factory Upper troca `moduleDefinitionId: config.id` por `instanceId` | Falhou, exit code 1 |
| FrontLayout troca o ID de definição por `moduleId` | Falhou, exit code 1 |
| Remoção do encaminhamento `moduleDefinitionId: config.id` | Falhou, exit code 1 |

Essas falhas provam que os locks detectam tanto a perda de identidade na factory quanto a identidade incorreta no FrontLayout.

## 9. Validações finais

A suíte completa terminou com **51 arquivos de teste e 585 testes aprovados**. O TypeScript terminou com exatamente **cinco erros preexistentes**, todos em `usePlannerStore.ts`, linhas 1089–1093; os erros novos introduzidos durante a Step 8.1 foram removidos.

O production build real terminou com status **0**, gerando o output Nitro e os arquivos de deployment. Os warnings existentes de depreciação de `createServerFn().inputValidator()` permanecem informativos e não impedem o build.

## 10. Limites

Não foram iniciados CAM, CNC, G-code, nova UI, novo módulo ou Stage 9. As referências open source permanecem apenas conceituais; nenhum código externo foi copiado ou adicionado como dependência.

## Conclusão

A Step 8.1 está aprovada tecnicamente no escopo definido: a definição Upper chega à factory com identidade preservada, os três resolvers compartilhados são efetivamente alcançados, a separação definição/instância é comprovada, o baseline assimétrico `396 × 696` é preservado e os downstreams reais permanecem instance-scoped.
