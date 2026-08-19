# STEP 7 — Golden Carcass Construction

**Projeto:** Dioris Planner V2  
**Golden Module:** `kitchen-base-2-doors` — Balcão 2 Portas  
**Snapshot principal:** 900 × 870 × 580 mm  
**Status:** **CONCLUÍDA — pronta para revisão externa**  
**Autor:** Manus AI

## 1. Objetivo e limite da etapa

A Etapa 7 formaliza a construção da caixa do Golden Module Balcão 2 Portas como uma única regra determinística. O objetivo foi retirar do builder as fórmulas estruturais implícitas e produzir um `ResolvedCarcass` que alimente as `PartDefinitions` consumidas pelo viewport, pela fabricação e pelo nesting.

A etapa **não** promoveu CAM, CNC, G-code, joinery industrial, confirmat, dowel, minifix, rafix, VB, cola ou novas famílias de módulos. Os componentes de apoio da prateleira e o perfil do rodapé continuam representados como elementos do builder existente, mas nenhuma decisão industrial nova foi inventada.

## 2. Arquitetura implementada

A cadeia efetiva do Golden agora é:

> `Dimensions + ThicknessProfile + CarcassConstructionRule → resolveCarcassConstruction() → ResolvedCarcass → buildCarcass() → PartDefinitions → buildModule() → viewport / fabricationReport / nestingPlan`

O contrato `CarcassConstructionRule` contém as relações semânticas da caixa: laterais com altura estrutural acima do rodapé, base entre laterais, topo entre laterais nivelado ao topo, fundo entre laterais no plano traseiro, prateleira entre laterais com suporte e rodapé como perfil separado apoiado pelos pés.

O resolver puro não depende de `FurnitureInstance`, Zustand, React ou viewport. Ele recebe somente dimensões, perfil de espessuras, toe kick, quantidade de prateleiras e regra. O resultado inclui dimensões internas, painéis, posições MODULE-LOCAL, relações construtivas, material slot, grain, edge banding e diagnósticos.

## 3. Fórmulas Golden preservadas e centralizadas

Para o snapshot 900 × 870 × 580 mm, usando painel de 18 mm, fundo de 6 mm e rodapé de 150 mm:

| Grandeza | Fórmula | Resultado |
|---|---|---:|
| Altura estrutural | `H − toeKick` | 720 mm |
| Largura interna | `W − 2 × panel` | 864 mm |
| Altura interna | `H − toeKick − 2 × panel` | 684 mm |
| Profundidade interna declarada | `D − back` | 574 mm |
| Largura da prateleira | `internalWidth − shelfSideClearance` | 862 mm |
| Profundidade da prateleira | `max(shelfThickness, D − shelfDepthInset)` | 560 mm |
| Posição vertical da base | `toeKick + panel / 2` | 159 mm |
| Posição vertical do topo | `H − panel / 2` | 861 mm |
| Posição vertical do fundo | `toeKick + bodyHeight / 2` | 510 mm |
| Posição vertical da prateleira | `toeKick + panel + internalHeight / 2` | 510 mm |
| Posição Z do fundo | `−D / 2 + back / 2` | −287 mm |
| Rodapé | `width=internalWidth`, `height=toeKick`, `depth=toeKickInset` | 864 × 150 × 20 mm |

A prateleira é posicionada em 510 mm no snapshot de uma prateleira. Esse valor resulta de `150 + 18 + 684 / 2`, e não de 528 mm; a auditoria e o teste foram corrigidos para refletir a fórmula efetivamente usada pelo builder original.

## 4. PartDefinitions resultantes

| Part | Dimensões no Golden | Centro MODULE-LOCAL | Relação |
|---|---|---|---|
| `side-left` | 18 × 720 × 580 mm | (−441, 510, 0) | altura total acima do rodapé |
| `side-right` | 18 × 720 × 580 mm | (+441, 510, 0) | espelho da lateral esquerda |
| `base` | 864 × 18 × 580 mm | (0, 159, 0) | entre as laterais |
| `top` | 864 × 18 × 580 mm | (0, 861, 0) | entre as laterais, nivelado ao topo |
| `back` | 864 × 684 × 6 mm | (0, 510, −287) | recuado no plano traseiro |
| `shelf-1` | 862 × 18 × 560 mm | (0, 510, 10) | entre as laterais, suportada |
| `toe-kick` | 864 × 150 × 20 mm | (0, 75, 260) | perfil separado, apoiado pelos pés |

A posição `positionMm` continua representando o centro da peça em coordenadas locais do módulo. O `buildModule.ts` continua responsável somente pela resolução final de material, espessura física por role, volume type, clearance, IDs e groupIds; ele não recalcula largura, altura ou profundidade da carcass.

## 5. Materiais, espessuras e acabamento

A regra recebe o perfil resolvido do material e mantém a independência entre `panelMm`, `shelfMm` e `backMm`. Assim, uma fixture com painel/prateleira de 25 mm e fundo de 9 mm produz dimensões coerentes sem alterar o contrato de porta ou de ferragem.

As partes estruturais usam os slots `body` ou `back`. O grain padrão é vertical para laterais e horizontal para base, topo e prateleira. O edge banding Golden foi declarado como front nas peças visíveis de corpo e prateleira; o fundo não recebe edge banding. O `fabricationReport` e o `nestingPlan` consomem esses dados diretamente das `PartDefinitions`.

## 6. Validação downstream

Foi adicionada uma regressão que constrói o `kitchen-base-2-doors` real pelo store e verifica que:

| Saída | Verificação |
|---|---|
| Cut-list | base 864 × 18 × 580 mm, fundo com profundidade/espessura 6 mm e prateleira 862 × 18 × 560 mm |
| Nesting | sem peças ausentes, duplicadas ou desconhecidas |
| IDs | IDs estruturais estáveis nos ciclos testados |
| Espessuras | perfil alternativo 25/25/9 propaga para PartDefinitions |
| Hardware | regressões anteriores de ferragens, placas, Joinery e Machining continuam aprovadas |

A Etapa 7 não introduziu uma fórmula paralela em `fabricationReport.ts` ou `nestingPlan.ts`. A fonte de dimensões continua sendo a `PartDefinition` produzida pelo builder.

## 7. Invariantes e diagnósticos

O resolver valida dimensões externas positivas, espessuras positivas, largura interna não negativa, altura interna não negativa, simetria das laterais e fechamento da largura da base. Para entradas inviáveis, o resultado é `INVALID` com códigos diagnósticos como `NEGATIVE_INTERNAL_WIDTH`, `NEGATIVE_INTERNAL_HEIGHT`, `INVALID_PANEL_THICKNESS`, `ASYMMETRIC_SIDES` e `STRUCTURAL_GAP`.

Foram cobertos os ciclos de larguras 600/800/900/1000/1200 mm, profundidades 500/550/580/600 mm, alturas 720/870/900 mm, ciclo 900→1000→900, ciclo 580→600→580, espelhamento das laterais, alteração de espessura e paridade entre resolver e builder.

## 8. Referências conceituais, sem cópia de arquitetura

Os benchmarks foram consultados somente como referências de conceitos, conforme solicitado. O [WoodworkingShop/Cabinet Planner][1] separa configurador, store e engine TypeScript puro e deriva partes, ferragens e cut-list a partir de configuração. O [Panelizer][2] trata painéis como entidades manufaturáveis, usa snapping consciente de montagem, detecção de overlaps e lista automática de peças. O [dprojects/Woodworking][3] reúne construção paramétrica, relações de joinery, medição e geração automática de cut-list.

Essas referências não foram copiadas. A implementação permanece específica do Dioris Planner V2, restrita ao Golden `kitchen-base-2-doors`, com seus contratos e seu pipeline próprio.

## 9. Validação final

| Verificação | Resultado |
|---|---|
| Suíte Vitest completa | **47 arquivos aprovados** |
| Testes Vitest | **577 aprovados** |
| Production build | **Aprovado** |
| TypeScript | **5 erros baseline preexistentes** em `usePlannerStore.ts`; **0 erros novos da Etapa 7** |
| Testes direcionados da carcass + Etapas 6/6.1 | **20 aprovados** |
| Evidência visual | PNG técnico determinístico 900 × 870 × 580 mm gerado e revisado |
| CAM/CNC/G-code | Não iniciado |
| Novas famílias | Não adicionadas |

Os cinco erros TypeScript restantes estão fora da camada de carcass, nas linhas 1089–1093 de `usePlannerStore.ts`, relacionados a valores `string | null` atribuídos a campos `string`. A Etapa 7 não adicionou erros novos; inclusive o erro anterior de `HardwareGeometry.profile` foi corrigido localmente removendo propriedades não suportadas pelo contrato canônico.

## 10. Arquivos principais entregues

| Arquivo | Função |
|---|---|
| `src/modules/planner-v2/library/contracts/CarcassConstructionRule.ts` | Contratos de regra, painéis, relações, diagnósticos e `ResolvedCarcass` |
| `src/modules/planner-v2/library/families/kitchen/carcassConstructionRules.ts` | Regra declarativa Golden |
| `src/modules/planner-v2/library/services/carcassConstructionResolver.ts` | Resolver puro e validator |
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | Integração Golden com fallback legado para outros módulos |
| `src/modules/planner-v2/pkg/state/goldenCarcassConstruction.test.ts` | Testes matemáticos e downstream |
| `evidence/etapa7-carcass-builder-audit.md` | Auditoria das fórmulas anteriores |
| `evidence/etapa7-carcass-benchmark-research.md` | Referências conceituais auditadas |
| `STEP_7_GOLDEN_CARCASS_900.png` | Evidência visual técnica |

## Conclusão

A Etapa 7 atingiu o objetivo definido: a construção da caixa do Golden Module deixou de depender de fórmulas estruturais espalhadas e passou a ser derivada por uma regra declarativa e um resolver puro. As mesmas `PartDefinitions` agora abastecem viewport, cut-list e nesting, mantendo espessuras, materiais, grain, edge banding, posições locais, relações construtivas e IDs rastreáveis.

A etapa está pronta para revisão externa. A próxima etapa não deve começar automaticamente.

## Referências

[1]: https://github.com/RajwanYair/WoodworkingShop "RajwanYair/WoodworkingShop — Cabinet Planner and Cut-list Optimizer"
[2]: https://github.com/pelletier197/Panelizer "pelletier197/Panelizer — Browser-based cabinet and plywood designer"
[3]: https://github.com/dprojects/Woodworking "dprojects/Woodworking — FreeCAD woodworking workbench"
