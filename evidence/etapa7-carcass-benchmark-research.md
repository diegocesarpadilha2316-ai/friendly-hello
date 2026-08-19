# Etapa 7 — Referências conceituais auditadas

## WoodworkingShop / Cabinet Planner

Fonte: https://github.com/RajwanYair/WoodworkingShop

O repositório apresenta uma separação explícita entre configurador/UI, store e engine TypeScript puro. O engine deriva partes, ferragens, dimensões, cut optimizer e exportações; a UI consome os resultados. A referência é útil para a regra Dioris porque reforça o fluxo `configuração → engine → parts → cut-list`, sem misturar cálculo geométrico com renderização.

O benchmark também declara parâmetros de cabinet como largura, altura, profundidade, toe kick, prateleiras, portas, materiais, grain direction e edge banding. Para a Etapa 7, serão usados apenas como critérios conceituais de rastreabilidade: dimensões derivadas, partes estruturais, material, veio e fita devem chegar ao cut-list sem uma segunda fórmula.

## Panelizer

Fonte: https://github.com/pelletier197/Panelizer

O projeto trata cada painel como uma entidade manufaturável, gera automaticamente uma lista de peças e usa snapping consciente de montagem e detecção visual de overlaps. A referência é relevante para o validator do Dioris: uma interseção não deve ser automaticamente inválida; a decisão depende da relação construtiva esperada entre os painéis.

O benchmark também enfatiza material, espessura, grain direction, kerf, margem e disponibilidade de estoque como dados distintos da geometria. A Etapa 7 usará apenas o princípio de que `ResolvedCarcass → PartDefinitions → cut-list/nesting` deve preservar essas propriedades.

## dprojects/Woodworking

Fonte: https://github.com/dprojects/Woodworking

O workbench descreve construção paramétrica de cabinets, redesign por parâmetros, geração automática de cut-list, referências de dimensões, operações de joinery e ferramentas de medição. Também distingue recursos de parâmetro, geração de peças, cut-list e operações de montagem.

A referência será usada apenas conceitualmente. Não haverá cópia de código, arquitetura ou sistema de união. Em especial, confirmat, dowel, minifix e demais joinery continuam sem promoção industrial na Etapa 7 enquanto não houver regra Golden comprovada.

## Decisão de benchmark

Os três benchmarks convergem em quatro princípios úteis para o Dioris: engine geométrico puro, painéis como entidades manufaturáveis, validação de relações/overlaps e downstream único para cut-list/nesting. Nenhum benchmark será portado. A implementação continuará específica do Dioris Planner V2 e restrita ao `kitchen-base-2-doors`.
