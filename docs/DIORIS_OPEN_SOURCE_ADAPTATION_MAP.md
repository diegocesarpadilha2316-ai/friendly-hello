# Mapa de adaptação open source do Dioris Planner V2

**Autor:** Manus AI  
**Projeto:** Dioris Planner V2  
**Objetivo:** transformar o Planner em uma ferramenta de marcenaria fabricável sem colar aplicações incompatíveis.

## Decisão arquitetural

O Dioris permanece como **orquestrador único**. Nenhum dos projetos auditados será montado como uma segunda aplicação dentro do Planner. A integração ocorrerá por contratos próprios, testes de equivalência e reimplementação independente dos algoritmos cuja licença ou linguagem não sejam compatíveis.

> User Prompt → Dioris AI Interpreter → DesignIntent → RoomSpec/KitchenCompositionSpec → LayoutEngine → ModuleSpec[] → Parametric Cabinet Engine → PartDefinition[] → HardwareDefinition[] → 3D Geometry → Collision Validation → Scene → BOM/CutList/Budget.

## Comparação de contratos

| Capacidade | WoodworkingShop | Dioris atual | Decisão |
|---|---|---|---|
| Parâmetros de módulo | `ParametricTemplate` com parâmetros tipados, limites, regras condicionais e campos computados | `ModuleDefinition`, `LayoutModuleSpec`, dimensões e espessura | Reimplementar os conceitos dentro de `ModuleDefinition`, adicionando parâmetros declarativos e regras testáveis. |
| Peças físicas | `generateParts(CabinetConfig)` gera laterais, topo, base, prateleiras, portas e caixas de gaveta | `PartDefinition` já possui papel, dimensão, posição, material, veio, fita, ferragem e volume | Manter `PartDefinition` do Dioris e enriquecer o builder com regras de fabricação equivalentes. |
| Montagem | `AssemblyStep`, DAG e dependências | Existem grupos, animações e peças interativas, mas a montagem ainda não é um DAG explícito | Criar `AssemblyStep`/`JoineryDefinition` próprios, ligados à instância e às peças. |
| Otimização de chapa | MaxRects, grain constraints, co-nesting e analytics | `fabricationReport` já agrupa peças e exporta CSV, mas ainda não faz nesting | Portar apenas o algoritmo puro de nesting após auditoria de tipos; preservar atribuição de veio e bordas no modelo Dioris. |
| Ferragens | Catálogo, filtros, custo e atribuições | `HardwareRegistry`, overrides e geometrias de gola/cava/perfil | Manter registro Dioris e acrescentar fabricante, compatibilidade, quantidade, custo e instrução de instalação. |
| BOM/custo | BOM, custos, peso, resíduos e exportação | Relatório de fabricação inicial e CSV | Evoluir `fabricationReport` para `BOM`, peso, custo, resíduos, etiquetas e plano de corte. |
| IA | Brief, restrições, sugestões e ranking | Parser natural → `KitchenCompositionSpec` → Layout Engine | Adicionar `DesignIntent` intermediário e validar toda saída antes de materializar a cena. |
| Ambiente | Não é foco principal do WoodworkingShop | Room/Wall/Layout próprios | Comparar Blueprint3D/Aedifex conceitualmente, sem substituir o Dioris automaticamente. |
| Exportações | PDF, DXF, G-code, BOM e JSON | PNG/WebM e CSV iniciais | Priorizar JSON de projeto, CSV de corte, PDF técnico e DXF; G-code somente após regras de usinagem auditadas. |

## O que será adaptado primeiro

A prioridade é o núcleo de marcenaria, porque é o ponto que diferencia o Dioris de um visualizador 3D genérico. O primeiro bloco deve conter templates declarativos para balcão, gaveteiro, pia, aéreo e torre; regras de espessura e recuos; peças físicas; ferragens; bordas; veio; zonas técnicas; assembly DAG; BOM e lista de corte.

O segundo bloco é a camada de fabricação. O `fabricationReport` atual já comprova que o Dioris consegue separar peças físicas de volumes técnicos, registrar MDF, espessura, quantidade, bordas, veio, ferragens e CSV. A evolução deve adicionar nesting MaxRects, chapas de estoque, kerf, etiquetas e plano de corte, mas sempre com testes matemáticos por módulo.

O terceiro bloco é a IA. O parser atual funciona, mas deve deixar de retornar somente uma composição implícita. A nova forma deve ser `DesignIntent`, contendo ambiente, parede/âncora, módulos, materiais, ferragens, estilo de abertura, restrições e saídas solicitadas. Somente depois da validação o Layout Engine poderá resolver posições.

## Limites de reutilização

O WoodworkingShop tem licença MIT e pode ser estudado e, quando conveniente, ter pequenos trechos portados com atribuição. Mesmo assim, o Dioris não deve importar sua árvore de componentes nem seu estado inteiro. OpenCutList, Sweet Home 3D, FreeCAD Woodworking e Wood-Frame têm GPL ou dependências GPL: seus fluxos serão referências funcionais, não código incorporado. FreeCAD e Aedifex exigem auditoria adicional de licença para qualquer uso além de referência arquitetural.

## Critério de sucesso

O Dioris só será considerado pronto para marcenaria quando um pedido natural gerar, de forma determinística, um projeto visualmente coerente e uma documentação fabricável consistente: módulos posicionados por âncoras, peças com dimensões reais, ferragens identificadas, bordas e veio, lista de corte, BOM, custos, montagem e validações sem warnings ocultos.
