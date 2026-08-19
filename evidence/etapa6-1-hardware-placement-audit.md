# Etapa 6.1 — Auditoria de duplicidades de posicionamento de ferragens

## Escopo

Auditoria restrita ao módulo Golden `kitchen-base-2-doors`. A matemática frontal aprovada da Etapa 6 não será alterada: em 900 mm, as portas continuam `447 / 447`, reveals externos `2 / 2`, gap central `2`, centers `-224,5 / +224,5` e altura de frente `714 mm`.

| Arquivo | Campo/fórmula atual | Significado | Duplicado? | Decisão |
|---|---|---|---|---|
| `src/modules/planner-v2/library/families/kitchen/applicationRules.ts` | `hingeEdgeOffsetMm: 35` | Offset horizontal da borda da porta até o ponto lógico de dobradiça | Não; é a regra central existente | Preservar e fazer o builder consumir por resolver puro |
| `src/modules/planner-v2/library/families/kitchen/applicationRules.ts` | `verticalEdgeOffsetMm: 110` | Offset vertical da borda inferior/superior real da porta até as dobradiças | Não; é a regra central existente | Preservar e fazer o builder consumir por resolver puro |
| `src/modules/planner-v2/library/families/kitchen/applicationRules.ts` | `threeHingeThresholdDoorHeightMm: 900` | Threshold da regra de contagem de dobradiças | Não; é a regra central existente | Preservar e remover threshold independente do builder Golden |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | `doorHeight >= 900 ? 3 : 2` | Regra local de quantidade de dobradiças | Sim | Remover do caminho Golden; usar `threeHingeThresholdDoorHeightMm` |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | `x + (... ± doorWidth / 2 - 35)` | Offset horizontal visual da dobradiça | Sim | Remover o literal 35 do Golden; usar `hingeEdgeOffsetMm` |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | `toe + 110` | Primeira posição vertical visual | Sim | Remover o literal 110 do Golden; usar bottom real + `verticalEdgeOffsetMm` |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | `toe + doorHeight - 110` | Última posição vertical visual | Sim | Remover; usar bottom real + height - offset |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | `toe + doorHeight / 2` | Posição intermediária em 3 dobradiças | Parcial | Manter somente como distribuição geométrica do placement puro; não é novo threshold |
| `src/modules/planner-v2/library/services/hardwareApplicationResolver.ts` | `verticalHingeOffsetsMm` e posições derivadas | Aplicação resolvida observada a partir das peças | Não é a origem da duplicidade; atualmente é segunda derivação | Reutilizar o placement puro e validar PartDefinitions contra ele |
| `src/modules/planner-v2/library/services/joineryReport.ts` | posição da PartDefinition de hardware | Fonte de posição de operação de montagem | Não, desde que a PartDefinition já venha do placement único | Manter e testar igualdade resolved placement = part = joinery |
| `src/modules/planner-v2/library/services/machiningReport.ts` | `makeHingeCupOperation` / `makeMountingPlatePilotOperation` usando source.positionMm | Coordenada local da operação | Não, desde que `source` seja a PartDefinition resolvida | Manter e testar igualdade com o placement lógico |
| `goldenHardwareManufacturingSpec.test.ts` | `diameterMm === 35` | Diâmetro de copo da dobradiça do fabricante | Não é offset horizontal; é Manufacturer Spec | Não remover |
| `HardwareManufacturingSpec` / catálogo Blum | `35 mm` em furação/copo, quando presente | Dimensão técnica do fabricante | Não é a regra de aplicação | Não remover |
| módulos não Golden / `demo/carcass.ts` | constantes `FRONT_GAP_MM`, `1.5`, 110/35 em caminhos genéricos | Fórmulas de outros módulos ou legado | Fora do escopo, salvo impacto direto no Golden | Não refatorar outros módulos nesta etapa |

## Números que não devem ser removidos

O valor `35 mm` do Manufacturer Spec é tecnicamente diferente de `hingeEdgeOffsetMm = 35 mm`: o primeiro pode ser diâmetro de copo/furação; o segundo é decisão de aplicação. Os dois devem permanecer semanticamente separados. O mesmo vale para o `900 mm` usado como threshold de três dobradiças: ele não é largura do Golden, e sim uma regra de contagem por altura da porta.

## Divergência confirmada antes da Etapa 6.1

No Golden corrigido, a porta possui bottom real em `toeKickMm + bottomRevealMm = 150 + 3 = 153 mm` e altura `714 mm`. A regra central informa offset vertical `110 mm`, portanto as posições esperadas são `153 + 110 = 263 mm` e `153 + 714 - 110 = 757 mm`. O builder anterior usava `toe + 110` e `toe + doorHeight - 110`, produzindo `260 / 754 mm`. A diferença era exatamente o bottom reveal de 3 mm.

No eixo X, a regra central informa `hingeEdgeOffsetMm = 35`, mas o builder mantinha `35` literal em uma fórmula independente. No eixo de contagem, a regra central informa threshold `900`, mas o builder mantinha `doorHeight >= 900 ? 3 : 2`. Esses três pontos serão substituídos por um placement resolver puro compartilhado.
