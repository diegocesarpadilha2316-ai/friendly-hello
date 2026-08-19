# Etapa 6 — Notas de auditoria e benchmark conceitual

## Auditoria local

O Golden `kitchen-base-2-doors` usa `buildDoors` em `src/modules/planner-v2/library/modules/demo/carcass.ts`. As constantes observadas são `PANEL_MM = 18` e `FRONT_GAP_MM = 3`. A função calcula `doorHeight = dims.height - toe - FRONT_GAP_MM * 2`, `totalWidth = dims.width - FRONT_GAP_MM * 2`, `doorWidth = totalWidth / 2 - 1.5` para duas folhas e posições `x = -(doorWidth / 2 + 1.5)` e `x = doorWidth / 2 + 1.5`. O módulo Golden usa `toeKickMm = 150` e `leaves = 2`.

A configuração de família em `src/modules/planner-v2/library/families/kitchen/config.ts` declara `doorGapMm: 2`, enquanto o builder usa `FRONT_GAP_MM = 3` e uma constante independente de 1,5 mm para a separação entre folhas. Portanto, o nome `doorGapMm` não é atualmente a única fonte da geometria frontal; há pelo menos três conceitos misturados: gap externo implícito, gap entre frentes implícito e `doorGapMm` de configuração.

Para 900 mm, a resolução observada pelo Stage 5 é: portas 446/446, gap central 2, gap externo esquerdo 2 e direito 4. O resolver corretamente mantém `revealMm` e `overlayMm` indefinidos porque os reveals externos são assimétricos. A causa está no layout gerado pelo builder, não no resolver.

## Benchmarks conceituais consultados

[1] [WoodworkingShop](https://github.com/RajwanYair/WoodworkingShop) apresenta um configurador com dimensões, toe kick, 1/2 portas, reveal configurável e geração de peças derivadas por um engine TypeScript puro separado da UI. A lição aplicável ao Dioris é manter a regra geométrica em uma camada pura e testável, sem portar a arquitetura ou funcionalidades do projeto.

[2] [Panelizer](https://github.com/pelletier197/Panelizer) enfatiza snapping assembly-aware, detecção visual de overlaps e geração automática de parts list a partir dos painéis. A lição aplicável é validar relações geométricas e overlaps como invariantes antes de gerar peças, sem copiar seu editor ou engine.

[3] [DProjects/Woodworking](https://github.com/dprojects/Woodworking) documenta relações paramétricas, ferramentas de mover/redimensionar, frentes abertas/fechadas, medição e cut-list derivado. A lição aplicável é fazer as relações paramétricas governarem a geometria e manter a posição de ferragens dependente das frentes, sem importar FreeCAD ou o workbench.

## Decisão preliminar

A Etapa 6 deve introduzir o menor contrato puro possível para separar reveals externos, gap entre frentes, larguras, edges, centers, pivôs e status. O builder deve consumir esse resultado em vez de reconstruir posições por uma fórmula incremental. A regra escolhida precisa declarar explicitamente o default simétrico do Golden e manter `selectedBoringDistanceMm = undefined`.
