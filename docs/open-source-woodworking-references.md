# Referências open source para o Dioris Planner V2

## OpenCutList

Fonte: https://docs.opencutlist.org/ e https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension

O OpenCutList é uma extensão de SketchUp voltada a listas de peças, diagramas de corte, etiquetas, estimativas de custo/peso e vistas explodidas. A documentação destaca que a orientação das peças depende de comprimento, largura, espessura, eixos locais, face frontal/traseira e classificação do material. O repositório informa licença GPLv3. Portanto, deve ser usado como referência funcional e de domínio do problema; não deve ser incorporado diretamente ao bundle proprietário do Dioris sem respeitar as obrigações da GPL.

## FreeCAD Woodworking Workbench

Fonte: https://github.com/dprojects/Woodworking

O workbench apresenta referências para móveis paramétricos, redimensionamento, cavilhas, parafusos, minifix, furação, escareamento, lista de corte, exportação CSV/JSON/HTML/Markdown, unidades, peso, custo e abertura/fechamento de frentes. O repositório declara o workbench sob licença MIT, preservando copyright, e usa FreeCAD sob LGPL. Pode orientar contratos e fluxos do Dioris; qualquer código reutilizado deve manter os avisos de licença.

## SVGnest

Fonte: https://github.com/Jack000/SVGnest

Ferramenta open source de nesting vetorial para contornos arbitrários. É uma referência para evoluir o nesting retangular do Dioris para geometrias não retangulares, mantendo separação entre peças, rotação permitida, contorno da chapa e exportação SVG.

## libnest2d

Fonte: https://github.com/tamasmeszaros/libnest2d

Biblioteca C++ para bin packing 2D irregular, inspirada no SVGnest. É uma referência algorítmica para uma futura camada de nesting de formas verdadeiras, mas não deve ser adicionada diretamente ao bundle web sem uma estratégia de compilação WASM e revisão de licença/dependências.

## FreeCAD CAM

Fonte: https://github.com/FreeCAD/FreeCAD-documentation/blob/main/wiki/CAM_Workbench.md

A documentação do FreeCAD descreve o workbench CAM como gerador de instruções de máquina CNC a partir de modelos 3D. Serve como referência para o contrato de operações de usinagem, ferramentas, profundidade, avanço e pós-processador; não significa que o Dioris já possa prometer G-code universal sem configurar máquina e pós-processador.

## WoodworkingShop

Fonte: https://github.com/RajwanYair/WoodworkingShop

Projeto browser-based citado como planejador de gabinetes e otimizador de lista de corte. Deve ser auditado no repositório antes de qualquer integração, verificando licença, modelo de dados e compatibilidade técnica com React/Three.js.

## Diretriz de integração

O Dioris deve absorver conceitos, contratos e algoritmos compatíveis, não copiar indiscriminadamente todos os projetos. A ordem segura é: preservar o motor paramétrico próprio; ampliar o contrato de peças com orientação, face, veio, fita de borda e operações; evoluir nesting retangular para contornos; adicionar exportação CNC dependente de máquina; e registrar créditos/licenças quando código MIT/LGPL/GPL for efetivamente reutilizado.
