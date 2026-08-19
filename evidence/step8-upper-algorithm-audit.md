# Step 8 — Auditoria matemática real da factory `upper()`

## Decisão e baseline aceito

O módulo canônico do piloto é `kitchen-golden-upper-800`. O baseline executável atual é 800 × 700 × 350 mm, com 10 PartDefinitions físicas, 22 PartDefinitions de hardware, 32 PartDefinitions no total e zero warnings. A contagem histórica de 4 é preservada apenas como checkpoint de granularidade não diretamente comparável.

## Factory e fluxo real

A factory `upper(config)` em `professionalModules.ts` cria uma `ModuleDefinition` com `familyId = kitchen`, `category = Aéreos`, `kind = upper`, dimensões default `{ width: config.defaultWidth, height: 700, depth: 350 }`, limites `{ width: 300..1200, height: 300..1200, depth: 250..450 }` e steps `{ width: 50, height: 10, depth: 10 }`. A definição canônica informa `defaultWidth = 800`, `doorLeaves = 2`, `shelves = 3` e `handle = handle-cava`.

A função de build encaminha `instanceId`, dimensões, material, overrides e espessuras para `buildUpper()`. `buildUpper()` força `toeKickMm = 0`, usa `shelves = options.shelves ?? (options.niche ? 2 : 1)` e constrói `buildCarcass()`, `buildDoors()` e eventuais extensões de vidro/basculante. Para o módulo canônico, a definição fornece três prateleiras e não ativa niche, glass ou flap.

## Mapa de fórmulas observadas

| Resultado | Source variables | Formula real | Valor 800×700×350 | Espaço | Consumidores |
|---|---|---|---:|---|---|
| painel | `options.thicknessMm.panelMm` ou `c.panelMm` | perfil de espessura | 18 mm | parâmetro | laterais, base, topo |
| fundo | `options.thicknessMm.backMm` ou `c.backMm` | perfil de espessura | 6 mm | parâmetro | fundo, materialização |
| toe kick | `buildUpper` | `toeKickMm = 0` | 0 mm | MODULE-LOCAL | carcass, portas |
| body height | `dims.height`, `toe` | `dims.height − toe` | 700 mm | MODULE-LOCAL | laterais |
| inner width | `dims.width`, `panel` | `dims.width − 2 × panel` | 764 mm | dimensão | base, topo, fundo |
| inner height | `bodyHeight`, `panel` | `bodyHeight − 2 × panel` | 664 mm | dimensão | fundo, prateleiras |
| laterais | `dims`, `panel`, `toe` | width=`panel`; height=`bodyHeight`; depth=`dims.depth` | 18×700×350 | MODULE-LOCAL | PartDefinitions |
| base/topo | `innerWidth`, `panel`, `dims.depth` | width=`innerWidth`; height=`panel`; depth=`dims.depth` | 764×18×350 | MODULE-LOCAL | PartDefinitions, cut-list |
| fundo | `innerWidth`, `innerHeight`, `back` | width=`innerWidth`; height=`innerHeight`; depth=`back` | 764×664×6 | MODULE-LOCAL | PartDefinitions, cut-list |
| shelf ratio | index, count | `(index+1)/(count+1)` | 1/4, 1/2, 3/4 | regra | prateleiras |
| shelf Y | `toe`, `panel`, `innerHeight`, ratio | `toe + panel + innerHeight × ratio` | 184, 350, 516 | MODULE-LOCAL | PartDefinitions, suportes |
| shelf width | `innerWidth` | `innerWidth − 2` | 762 mm | dimensão | PartDefinitions, cut-list |
| shelf depth | `dims.depth`, `panel` | `max(panel, dims.depth − 20)` | 330 mm | dimensão | PartDefinitions, cut-list |
| door gap | `c.doorGapMm` | configuração canônica | 2 mm | regra | Front Layout/doors |
| door height | `dims.height`, `toe`, gap | `dims.height − toe − 2 × doorGap` | 696 mm | MODULE-LOCAL | portas |
| door width | `dims.width`, gap, leaves | `(dims.width − 2×gap)/2 − gap` | 396 mm | dimensão | portas |
| door centers | `totalWidth`, door width, gap | `−totalWidth/2 + doorWidth/2 + index×(doorWidth+gap)` | −200, 198 | MODULE-LOCAL | portas/pivôs |
| door pivot | center, hinge side | `x ± doorWidth/2` | −398, 396 | MODULE-LOCAL | interação |
| hinge X | door center, edge offset | left: `x−width/2+35`; right: `x+width/2−35` | −363, 361 | MODULE-LOCAL | hardware |
| hinge Y | door geometry | `[toe+110, toe+doorHeight−110]` when 2 hinges | 110, 586 | DOOR/MODULE installation path | hardware/Joinery |
| shelf supports | resolved shelf Y, inner width, depth | ±`max(20, innerWidth/2−24)`, ±`max(24, depth/2−34)` | ±358, ±141 | MODULE-LOCAL | hardware PartDefinitions |

## Hardware semantics

O baseline materializa 12 `shelf-support`, 4 `hinge-soft-close`, 4 `mounting-plate-37-32` e 2 `handle-cava`. A soma estruturada é 22 PartDefinitions de hardware. Os suportes pertencem ao `groupId` da respectiva prateleira; hardware de porta pertence ao groupId da porta.

## Identidade

No baseline controlado, os 32 IDs físicos são prefixados por `step8-upper-baseline-instance-001`, enquanto a definição permanece `kitchen-golden-upper-800`. O builder atual recebe a definição por `options.moduleDefinitionId` para regras específicas e usa o primeiro argumento `moduleId` para IDs de instância.

## Classificação de hardcodes

Os valores 800, 700 e 350 são inputs canônicos da definição; 18 e 6 vêm do perfil/constantes de espessura; 764, 664, 762, 330, 396 e 696 são valores derivados; `doorGapMm = 2`, shelf inset 2, shelf depth inset 20 e offsets de suporte são constantes legítimas da configuração/builder atual. Nenhum valor foi extraído ou duplicado nesta auditoria.
