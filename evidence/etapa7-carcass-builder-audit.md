# Etapa 7 — Auditoria do builder do Golden

## Módulo auditado

`kitchen-base-2-doors`, construído por `professionalModules.ts → buildBase() → buildCarcass()`.

Para o snapshot Golden 900 × 870 × 580 mm, o caminho profissional usa `panelMm = 18`, `backMm = 6`, `toeKickMm = 150`, `toeKickInsetMm = 20`, `shelves = 1`, corpo `mdf-white` e portas/frentes substituíveis por overrides, sem alterar a regra da caixa.

## Tabela de partes estruturais

| PART | FÓRMULA ATUAL | DIMENSÕES Golden | POSIÇÃO Golden | MATERIAL | ESPESSURA final | REGRA IMPLÍCITA / PROBLEMA |
|---|---|---|---|---|---:|---|
| `side-left` | `width=panel`, `height=max(3×panel, H−toe)`, `depth=D` | 18 × 720 × 580 | `x=−(W−panel)/2=−441`, `y=toe+bodyHeight/2=510`, `z=0` | corpo | 18 | Painel estrutural inteiro, simétrico ao direito; fórmula está implícita em `buildCarcass`. |
| `side-right` | Igual à lateral esquerda | 18 × 720 × 580 | `x=+441`, `y=510`, `z=0` | corpo | 18 | Espelhamento existente, mas não havia contrato declarativo. |
| `base` | `width=max(panel,W−2×panel)`, `height=panel`, `depth=D` | 864 × 18 × 580 | `x=0`, `y=toe+panel/2=159`, `z=0` | corpo | 18 | Base fica **entre** as laterais; largura é o vão interno. |
| `top` | Igual à base em largura/profundidade | 864 × 18 × 580 | `x=0`, `y=H−panel/2=861`, `z=0` | corpo | 18 | Topo é um **painel inteiro**, entre as laterais e nivelado ao topo do corpo. |
| `back` | `width=innerWidth`, `height=innerHeight`, `depth=backMm` | 864 × 720 × 6 | `x=0`, `y=510`, `z=−D/2+backMm/2=−287` | back/body override | 6 | Fundo recuado no plano traseiro; espessura 6 independente do painel 18. |
| `shelf-1` | `width=innerWidth−2`, `height=shelf`, `depth=max(shelf,D−20)` | 862 × 18 × 560 | `x=0`, `y=510`, `z=10` | corpo | 18 | `y = toe + panel + innerHeight/2 = 150 + 18 + 342`; prateleira removível/apoio visual derivada do número de shelves; não há regra industrial de furação promovida. |
| `toe-kick` | `width=innerWidth`, `height=toe`, `depth=toeKickInset` | 864 × 150 × 20 | `x=0`, `y=75`, `z=260` | perfil/hardware | não aplicável como painel | Rodapé é perfil/hardware separado, associado aos pés reguláveis; não pertence ao painel base. |

## Construção encontrada

A base e o topo ficam entre as laterais. As laterais ocupam a altura do corpo acima do rodapé. O topo é um painel inteiro, não duas travessas. O fundo é um painel de segurança de 6 mm, recuado na face traseira, com largura e altura internas. A prateleira é um painel de 18 mm apoiado por quatro componentes `shelf-support`; a regra de joinery desses suportes continua genérica/unverified e não será promovida a machining READY. O rodapé é um perfil separado relacionado ao sistema de pés reguláveis.

## Duplicidades e decisões

| VALOR / FÓRMULA | ONDE APARECE | SIGNIFICADO | DUPLICADO? | DECISÃO |
|---|---|---|---|---|
| `panelMm = 18` | `KITCHEN_CONFIG`, `buildCarcass`, `buildModule` | espessura corpo | Sim, como default/consumo | Mover a decisão Golden para `CarcassConstructionRule`; `buildModule` continua resolvendo o perfil físico final. |
| `backMm = 6` | `KITCHEN_CONFIG`, `buildCarcass`, `buildModule` | espessura fundo | Sim, como default/consumo | Preservar independência do fundo e fazer o resolver receber o perfil. |
| `innerWidth = W−2×panel` | `buildCarcass` | vão entre laterais | Sim, fórmula escondida no builder | Centralizar no `resolveCarcassConstruction`. |
| `bodyHeight = H−toe` | `buildCarcass` | altura estrutural acima do rodapé | Sim, implícita | Centralizar no resolver. |
| `innerHeight = bodyHeight−2×panel` | `buildCarcass` | altura interna do fundo | Sim, implícita | Centralizar no resolver. |
| `D−20` | shelf depth | recuo de prateleira | Não encontrado em outro downstream | Tornar regra explícita, sem alterar default. |
| `innerWidth−2` | shelf width | margem lateral da prateleira | Não encontrado em outro downstream | Tornar regra explícita e validável. |
| `toeKickInsetMm = 20` | rodapé e snap kitchen | recuo frontal do perfil | Uso em mais de uma função | Preservar como parâmetro da regra Golden, sem misturar com profundidade estrutural. |

## Observação sobre downstream

`buildModule.ts` não recalcula largura, altura ou profundidade das peças. Ele remapeia material, espessura final por role, volume type, clearance, IDs e groupIds. `fabricationReport.ts` agrega diretamente as PartDefinitions e `nestingPlan.ts` adapta as mesmas peças para nesting. Portanto, a futura fonte única deve ser o resolver que alimenta `buildCarcass()`; não é necessário alterar cut-list ou nesting para criar uma segunda fórmula.

## Joinery

`confirmat` e `dowel` aparecem como operações construtivas genéricas/legadas em caminhos do relatório. A auditoria da Etapa 7 não encontrou evidência de que sejam o sistema industrial comprovado do Golden. Eles permanecerão classificados como `GENERIC/UNVERIFIED` ou equivalentes e fora de `Machining READY`. A Etapa 7 formalizará geometria e relações, não escolherá minifix, cavilha, confirmat, rafix, VB, cola ou outro sistema definitivo.
