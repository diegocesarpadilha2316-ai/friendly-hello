# Dioris Planner V2 — Etapa 6

## Golden Module: Balcão 2 Portas

> **Objetivo:** formalizar uma única regra de `Front Layout` para gerar a geometria frontal do Golden Module e fazer builder, hardware, Joinery, Machining, cut-list e nesting derivarem da mesma resolução.

## Resultado executivo

A Etapa 6 foi concluída sem avançar para a Etapa 7, CAM, CNC, G-code, render, nova UI, nova família ou catálogo amplo. O módulo `kitchen-base-2-doors` agora usa o contrato puro `FrontLayoutRule`, o resolver `resolveFrontLayout()` e o resultado `ResolvedFrontLayout` para produzir as portas reais.

A correção eliminou a assimetria observada no Golden 900 mm. O resultado corrigido é:

> **2 + 447 + 2 + 447 + 2 = 900 mm**

Consequentemente, `leftRevealMm = 2`, `rightRevealMm = 2`, `interFrontGapMm = 2`, `doorWidthsMm = [447, 447]`, centros `[-224,5, +224,5]` e pivôs `[-448, +448]` mm. O resolver de hardware volta a conseguir derivar `revealMm = 2` e `overlayMm = 16`, sem selecionar `selectedBoringDistanceMm`.

## 1. Auditoria da fórmula anterior

A configuração da família declarava `KITCHEN_CONFIG.doorGapMm = 2`, enquanto havia constantes e fórmulas adicionais em builders distintos. O caminho profissional usava uma expressão equivalente a:

```text
bodyWidth = cabinetWidth - 2 × doorGapMm
doorWidth = bodyWidth / frontCount - doorGapMm
centerX(i) = -bodyWidth / 2 + doorWidth / 2 + i × (doorWidth + doorGapMm)
```

Além disso, o caminho demo mantinha `FRONT_GAP_MM = 3` e uma constante ad hoc de `1,5 mm` entre folhas. Portanto, `doorGapMm` não representava um conceito único: o mesmo nome participava de folgas verticais, largura útil e separação horizontal, enquanto outra constante definia parte da geometria frontal. O módulo profissional e o módulo demo também tinham caminhos de geração diferentes.

Para a altura, a fórmula anterior do caminho profissional era `doorHeight = cabinetHeight - toeKick - 2 × doorGapMm`, isto é, `870 - 150 - 2 × 2 = 716 mm`. Essa fórmula misturava o rodapé com a folga inferior da frente e não nomeava separadamente reveal inferior e superior.

## 2. Causa raiz da assimetria

A causa não estava no `hardwareApplicationResolver`. Ela estava antes dele, na geração da geometria: havia mais de uma fonte de verdade para gap frontal, existia diferença entre o caminho profissional e o caminho demo e o cálculo construía a largura e os centros sem um objeto intermediário que comprovasse as bordas esquerda e direita.

O Stage 5 observou no Golden antigo a composição `2 + 446 + 2 + 446 + 4`. Essa composição fecha numericamente, mas não representa uma frente simétrica declarada. O resolver corretamente recusou-se a mascará-la: como os reveals externos eram diferentes, `revealMm` e `overlayMm` permaneciam indefinidos. A Etapa 6 corrigiu o ponto anterior ao resolver, isto é, `FrontLayoutRule → builder`, e não criou um “conserto” posterior no hardware.

## 3. Significado auditado de doorGapMm

A auditoria mostrou que `doorGapMm` era uma constante genérica reutilizada, não uma especificação semântica suficiente. Na Etapa 6, o conceito foi separado em:

| Conceito | Campo da regra | Default do Golden |
|---|---|---:|
| Reveal externo esquerdo | `leftRevealMm` | 2 mm |
| Reveal externo direito | `rightRevealMm` | 2 mm |
| Gap entre portas | `interFrontGapMm` | 2 mm |
| Reveal superior | `topRevealMm` | 3 mm |
| Reveal inferior | `bottomRevealMm` | 3 mm |
| Espessura da frente | `frontThicknessMm` | 18 mm |

O rodapé permanece uma dimensão estrutural do gabinete (`toeKickMm = 150`) e não é usado como substituto conceitual de reveal de porta. Para o Golden, a altura frontal corrigida é `870 - 150 - 3 - 3 = 714 mm`.

## 4. Regra escolhida e justificativa

Foi criado `GOLDEN_2_DOOR_FRONT_LAYOUT_RULE`, uma regra da família/módulo, não do renderer. O default simétrico foi escolhido porque o próprio Golden é declarado como balcão de duas portas simétricas e porque a regra precisa ser fabricável, explicável e invariável. O valor de 2 mm para reveals laterais e gap entre frentes é agora explícito e não deduzido de uma constante ambígua. O valor de 3 mm para os reveals verticales preserva o padrão vertical observado no caminho de construção e separa-o semanticamente do rodapé.

O contrato menor necessário é `FrontLayoutRule` mais `ResolvedFrontLayout`. O resolver calcula primeiro edges e larguras; somente depois calcula centers e pivôs. Isso evita acúmulo de erro incremental e permite validar a equação completa.

## 5. ResolvedFrontLayout do Golden 900 mm

| Campo | Resultado |
|---|---:|
| `cabinetWidthMm` | 900 mm |
| `frontCount` | 2 |
| `leftRevealMm` | 2 mm |
| `rightRevealMm` | 2 mm |
| `interFrontGapsMm` | `[2]` mm |
| `doorWidthsMm` | `[447, 447]` mm |
| `doorCentersMm` | `[-224,5, +224,5]` mm |
| `doorEdgesMm` | `[-448,-1]` e `[1,448]` mm |
| `topRevealMm` | 3 mm |
| `bottomRevealMm` | 3 mm |
| `doorHeightMm` | 714 mm |
| `hingeSides` | `left`, `right` |
| `pivotXByFrontMm` | `-448`, `+448` mm |
| `validationStatus` | `READY` |

A equação de fechamento horizontal é validada diretamente: `2 + 447 + 2 + 447 + 2 = 900`. A simetria também é validada: larguras iguais, reveals iguais e `centerLeft = -centerRight`.

## 6. Tabela obrigatória de larguras

Como o Golden continua sendo o mesmo módulo de duas portas, a regra foi testada em todas as larguras solicitadas.

| Width | Door 1 | Door 2 | Left reveal | Center gap | Right reveal | Center L | Center R | Validation |
|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 600 | 297 | 297 | 2 | 2 | 2 | -149,5 | 149,5 | READY |
| 800 | 397 | 397 | 2 | 2 | 2 | -199,5 | 199,5 | READY |
| 900 | 447 | 447 | 2 | 2 | 2 | -224,5 | 224,5 | READY |
| 1000 | 497 | 497 | 2 | 2 | 2 | -249,5 | 249,5 | READY |
| 1200 | 597 | 597 | 2 | 2 | 2 | -299,5 | 299,5 | READY |

A expressão geral para duas frentes simétricas é `doorWidth = (cabinetWidth - leftReveal - rightReveal - interFrontGap) / 2`. Com os defaults escolhidos, isso se reduz a `(cabinetWidth - 6) / 2`.

## 7. Builder, pivô e hardware

O builder profissional passa `moduleDefinitionId` explicitamente para a família. Somente o Golden ativa a regra específica; outros módulos continuam usando seus caminhos genéricos. O builder consome `ResolvedFrontLayout` para gerar largura, centro, altura e `pivotMm` da porta. A porta esquerda recebe hinge side esquerdo e pivô na borda `-448 mm`; a direita recebe hinge side direito e pivô na borda `+448 mm`.

As dobradiças seguem o lado e a posição das portas. No Golden de 900 mm, o edge offset industrial da aplicação permanece 35 mm no builder visual e os offsets verticais derivados pelo resolver são `263 mm` e `757 mm`. A contagem continua em duas dobradiças por porta, totalizando quatro dobradiças e quatro placas. A correção frontal não altera pés, clips ou perfis Gola.

A cadeia efetiva é:

```text
FrontLayoutRule
  ↓
resolveFrontLayout()
  ↓
buildDoors()
  ↓
Door PartDefinition + pivotMm + hingeSide
  ↓
ResolvedHardwareApplication
  ↓
Joinery
  ↓
Machining / BOM / cut-list / nesting
```

O `hardwareApplicationResolver` continua observando a geometria efetivamente produzida pelas peças. Ele não corrige assimetria e não mantém uma segunda fórmula frontal. Com o layout corrigido, ele deriva `revealMm = 2` e `overlayMm = 18 - 2 = 16`, mas `selectedBoringDistanceMm` permanece `undefined` por insuficiência de regra industrial.

## 8. Cut-list, nesting e BOM

A largura anterior de 446 mm não foi preservada artificialmente. A lista de corte agora contém as duas portas de 447 mm. O teste de nesting valida que as novas dimensões chegam às peças de chapa e que `missingInNesting`, `duplicateInNesting` e `unknownInNesting` são todos vazios.

A regressão de BOM permanece estável: quatro dobradiças, quatro placas, pés e clips preservados. Ferragens continuam fora do cut-list físico. O perfil Gola, quando selecionado, continua acompanhando a frente por `groupId` e posição derivada; não houve redesenho visual nesta etapa.

## 9. IDs e invariância

Os IDs semânticos `door-1`, `door-2`, dobradiças, placas, operações e regra de assembly permanecem estáveis. A largura e o centro mudam quando a dimensão do gabinete muda, mas a identidade lógica não é recriada.

O ciclo `900 → 1000 → 900` foi validado. O checkpoint C possui os mesmos parâmetros, larguras, edges, centers, pivôs e instalações do checkpoint A. Movimento e rotação da instância também não alteram o layout, pois toda a resolução é local ao módulo.

## 10. Validador

O resolver fornece códigos explícitos para cenários inválidos ou incompletos:

| Código | Situação |
|---|---|
| `NEGATIVE_GAP` | reveal ou gap negativo |
| `FRONTS_OVERFLOW` | soma horizontal não fecha com a largura do gabinete |
| `ASYMMETRIC_LAYOUT` | regra simétrica com reveals, larguras ou centers não espelhados |
| `INVALID_FRONT_COUNT` | quantidade de frentes diferente de 1 ou 2 |
| `ZERO_OR_NEGATIVE_FRONT_SIZE` | largura ou altura derivada não positiva |

Uma regra simétrica assimétrica permanece `INCOMPLETE`; uma condição geometricamente inválida permanece `INVALID`. O sistema não promove esses estados para produção.

## 11. Referências conceituais

A análise usou os projetos indicados somente como benchmark conceitual. [1] O WoodworkingShop separa um engine TypeScript puro da UI e trata dimensões, toe kick, 1/2 portas e reveal como entradas do configurador. [2] O Panelizer evidencia snapping consciente da montagem, detecção de overlap e geração automática da lista de peças. [3] O DProjects/Woodworking documenta relações paramétricas, movimentação/redimensionamento, frentes abertas/fechadas e cut-list derivado. Nenhuma arquitetura inteira, FreeCAD, CAM, CNC ou código desses projetos foi portado para o Dioris.

## 12. Validação final

| Verificação | Resultado |
|---|---:|
| Vitest completo | 45 arquivos, 562 testes aprovados |
| Production build | Aprovado |
| TypeScript `tsc --noEmit` | 6 erros, exatamente o baseline |
| Novos erros TypeScript da Etapa 6 | 0 |
| Testes específicos Front Layout | 5 testes aprovados |
| Regressões Golden Etapas 4.1/5 | Aprovadas |
| Cut-list 447 mm | Aprovado |
| Nesting missing/duplicates/unknown | `[] / [] / []` |
| BOM de ferragens | Aprovado |
| Evidência visual técnica 900 mm | Entregue em PNG |

Os seis erros restantes são os mesmos do baseline: um campo `removable` incompatível em `builders.ts` e cinco atribuições `string | null` em `usePlannerStore.ts`. Não foram refatorados nesta etapa porque não são necessários para o Front Layout e a instrução determinava não refatorar o store inteiro.

O navegador local não pôde ser usado para uma captura literal da viewport porque o subsistema de browser entrou em estado de crash loop. Por transparência, a imagem entregue é uma evidência técnica determinística renderizada a partir dos valores do `ResolvedFrontLayout`, não uma alegação de screenshot capturado do navegador.

## Entregáveis

- `STEP_6_GOLDEN_FRONT_LAYOUT.md`
- `STEP_6_GOLDEN_FRONT_LAYOUT_900.png`
- `STEP_6_GOLDEN_FRONT_LAYOUT.zip`

A Etapa 6 está encerrada para revisão externa. Não avançar para a Etapa 7, CAM, CNC, G-code, render ou expansão de biblioteca.

## Referências

[1]: https://github.com/RajwanYair/WoodworkingShop "RajwanYair/WoodworkingShop — Cabinet Planner"

[2]: https://github.com/pelletier197/Panelizer "pelletier197/Panelizer — Cabinet and plywood designer"

[3]: https://github.com/dprojects/Woodworking "dprojects/Woodworking — FreeCAD Woodworking workbench"
