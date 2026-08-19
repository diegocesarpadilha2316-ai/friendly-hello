# Step 8 — Shared Architecture Decision

## Classificação do estado atual

| Camada | Estado atual do Aéreo | Decisão |
|---|---|---|
| ModuleDefinition | `upper(config)` declarativa, ID canônico e limites reais | preservar |
| Carcass | `buildCarcass()` legado com fórmulas inline; Golden base já usa `resolveCarcassConstruction()` | migrar Upper para o resolver compartilhado |
| Front Layout | Golden base usa `resolveFrontLayout()`; Upper usa fórmula equivalente inline para portas | avaliar regra Upper declarativa mantendo baseline |
| Hardware Placement | Golden base usa `resolveDoorHardwarePlacement()`; Upper usa fallback inline de offsets | migrar somente se a regra compartilhada preservar o baseline |
| Joinery/Machining | downstream consome PartDefinitions existentes | não criar engine paralelo |
| Cut-list/Nesting | adapters existentes filtram hardware por role | preservar e testar |

## Leaks classificados

O teste do builder mostra que a condição `options.moduleDefinitionId === "kitchen-base-2-doors"` é legítima para ativar a regra específica do Golden base, mas impede que o segundo módulo use o resolver compartilhado. O leak é a seleção exclusiva do Golden no ponto de integração, não os valores 800/700/350 da definição Upper.

A fórmula inline de carcass no caminho não-Golden é duplicação estrutural: ela calcula largura interna, altura interna, fundo e prateleiras, informação que já existe no `CarcassConstructionRule`/`resolveCarcassConstruction()`.

## Extração mínima aprovada

A próxima alteração deve:

1. adicionar uma `CarcassConstructionRule` declarativa para `kitchen-golden-upper-800`, com `toeKickMm = 0` vindo do builder Upper;
2. fazer `buildCarcass()` ativar o resolver compartilhado para o ID Upper e para o Golden base;
3. manter o fallback legado para os demais módulos;
4. não alterar as dimensões do Golden base;
5. não criar `UpperEngine`, `GoldenUpperEngine`, novo nesting ou nova UI.

O resolver mantém o objeto `toeKick` estrutural, mas o builder já só materializa rodapé quando `toe > 0`; portanto o Upper não receberá peça toe-kick. Os 10 painéis físicos e 12 shelf-supports continuam sendo derivados da mesma cadeia.

A frente e o hardware devem ser migrados somente após a regra Upper confirmar matematicamente o baseline atual: 396 × 696 × 18, centros −200/+198, pivôs −398/+396 e hardware 22.
