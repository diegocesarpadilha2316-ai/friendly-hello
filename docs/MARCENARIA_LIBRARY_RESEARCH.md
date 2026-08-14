# Pesquisa de bibliotecas para transformar o Dioris Planner V2 em ferramenta de marcenaria

## Home Builder para Blender

O repositório [CreativeDesigner3D/home_builder](https://github.com/CreativeDesigner3D/home_builder) é um add-on GPL-3.0 para Blender voltado a ambientes residenciais. A página do projeto descreve foco em interiores e aponta uma biblioteca de assets separada. O README e a estrutura do repositório indicam operações de paredes, ambientes e bibliotecas de objetos, mas a base é Python/Blender, não React/Three.js. Conclusão: usar como referência de modelagem paramétrica, organização de assets e conceitos de cozinha; não copiar código GPL para o Planner V2 sem uma decisão de licenciamento compatível.

## FreeCAD Woodworking

O repositório [dprojects/Woodworking](https://github.com/dprojects/Woodworking) é apresentado como uma bancada de trabalho para FreeCAD com licença MIT. Os recursos descritos incluem criação rápida de estruturas de móveis, redimensionamento paramétrico, ferragens de montagem, furação, medição, lista automática de corte, exportação CSV/JSON/HTML/Markdown, abertura de frentes, materiais, fita de borda, peso e custo. Conclusão: é a melhor referência técnica para o núcleo de fabricação. A adaptação deve reproduzir conceitos e contratos de dados em TypeScript — painel, borda, veio, furação, ferragem, lista de corte e exportação — sem depender do kernel FreeCAD no navegador.

## CuttingOptimizer

O repositório [gcalero/CuttingOptimizer](https://github.com/gcalero/CuttingOptimizer) descreve um otimizador 2D para distribuir peças retangulares em chapas, recebendo dimensões da chapa e lista de peças e retornando chapas usadas, áreas livres e peças não acomodadas. O projeto é antigo, principalmente Java, e não publica uma licença clara na página consultada. Conclusão: usar apenas como referência algorítmica até a licença ser confirmada; para produção do Dioris, implementar um nesting próprio e testado em TypeScript, com espessura de corte, sentido de veio, fita de borda, margem e rotação controladas.

## Decisão de arquitetura

Não há uma biblioteca pronta que possa ser simplesmente instalada e transforme o atual Planner V2 em Promob. A estratégia segura é adaptar o Dioris existente e incorporar os melhores contratos: catálogo paramétrico no estilo Home Builder, regras de fabricação e lista de corte inspiradas no Woodworking, e um nesting 2D próprio inspirado no CuttingOptimizer. O resultado esperado é um produto web nativo, com dados de marcenaria explícitos, e não um render genérico com caixas.

## Escopo de implementação prioritário

| Camada     | Entrega necessária                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo   | Módulos inferiores, aéreos, torres, cantos, gaveteiros, pias, cooktop, painéis e acabamentos com dimensões mínimas/máximas e passos.         |
| Engenharia | MDF, espessuras, folgas, rodapé, pés, fundo, bordas, prateleiras, caixas de gaveta, dobradiças, corrediças, furações e zonas técnicas.       |
| Fabricação | Lista de peças por módulo, orientação de veio, fita de borda por lado, ferragens, cortes, furos e exportação.                                |
| Layout     | Âncoras de parede/piso, encontros em L, cantos, colisões, portas/janelas e tolerâncias de montagem.                                          |
| IA         | Parser de intenção que entende ambiente, medidas, sequência, materiais, ferragens e restrições; saída deve ser um CompositionSpec validável. |
| Visual     | Frentes, puxadores cava/gola/perfil, materiais com textura e iluminação, portas/gavetas abertas e vistas comparáveis ao Promob.              |

## Auditoria dos projetos indicados pelo usuário

### WoodworkingShop

O repositório [RajwanYair/WoodworkingShop](https://github.com/RajwanYair/WoodworkingShop) declara licença MIT e é descrito como um Cabinet Planner web open source, browser-based, sem backend, com React 19 e TypeScript. O README informa preview 3D em seis vistas, otimização MaxRects em chapas padrão 2440×1220 mm, restrições de veio e exportações para PDF, DXF, G-code, BOM e JSON. O repositório apresenta atividade elevada, centenas de commits e suíte extensa de testes. Conclusão provisória: é o candidato prioritário para estudo isolado e possível portabilidade de contratos/algoritmos de gabinete, nesting, BOM e exportação. A licença MIT é favorável, mas qualquer código incorporado deve manter o aviso de copyright e ser isolado em uma camada identificável.

### Blueprint3D Modern

O repositório [charmlinn/blueprint3d-modern](https://github.com/charmlinn/blueprint3d-modern) declara licença MIT e é uma reescrita moderna em TypeScript do Blueprint3D, com Three.js, React, Zustand, Next.js, Tailwind, Radix UI, Framer Motion e suporte a planta/ambiente. A página consultada mostra escopo de floor planner e uma base pequena, com 10 commits visíveis. Conclusão provisória: é uma boa referência de ambiente, paredes, coordenadas, planta e interação, mas não deve substituir o RoomEngine atual sem comparação de testes e sem trazer seu framework Next.js para dentro do Dioris.

### Diretriz inicial de integração

WoodworkingShop deve ser clonado em ambiente separado antes de qualquer adaptação. Blueprint3D Modern deve ser comparado por contratos e algoritmos de ambiente, não colado como segunda aplicação. O Dioris continua como orquestrador único: DesignIntent → RoomSpec/KitchenCompositionSpec → LayoutEngine → ModuleSpec → Cabinet/Part/Hardware → Scene → BOM/CutList.

### Aedifex

O repositório [TangSY/aedifex](https://github.com/TangSY/aedifex) descreve um editor arquitetônico 3D open source com assistente de IA, paredes, portas, janelas, zonas, múltiplos níveis, móveis, materiais, walkthrough e exportações GLB/STL/OBJ. A página consultada mostra Three.js, React e WebGPU, além de uma camada de linguagem natural com 16 ferramentas, preview fantasma, loop agentivo, detecção de colisão, limites de zona e matching de catálogo. O repositório é muito ativo, com mais de mil commits e estrutura monorepo. A licença precisa ser confirmada no arquivo LICENSE antes de qualquer reutilização. Conclusão: é a principal referência arquitetural para Dioris AI Interpreter → operações estruturadas → preview/commit, mas o código não deve ser incorporado sem auditoria de licença, dependências WebGPU e compatibilidade com o atual React Three Fiber.

### OpenCutList

O repositório [lairdubois/lairdubois-opencutlist-sketchup-extension](https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension) declara GPLv3 e possui atividade e histórico muito maduros. O README descreve geração de lista de peças, diagramas de corte, etiquetas, custo e peso para marcenaria. Conclusão: é uma referência forte para o modelo de produção, mas GPLv3 impede copiar código para o Dioris sem uma estratégia jurídica/licenciamento compatível. A decisão é reimplementar os contratos e fluxos de produção — peças, chapas, etiquetas, custos, peso e diagramas — de forma independente, preservando a ideia e não o código.

### FreeCAD oficial

O repositório [FreeCAD/FreeCAD](https://github.com/FreeCAD/FreeCAD) é um modelador paramétrico multiplataforma de grande maturidade, com dezenas de milhares de estrelas e dezenas de milhares de commits. A página consultada aponta atualização de licença para LGPLv2.1. A arquitetura é C++/Python, com kernel CAD, bindings, módulos e dependências nativas. Conclusão: não portar o FreeCAD para o Dioris. Usar como referência de precisão, sistemas de coordenadas, transformações, constraints e objetos paramétricos, mantendo o motor web em TypeScript/Three.js.

### Sweet Home 3D

A referência [Vanuan/sweethome3d](https://github.com/Vanuan/sweethome3d) é um arquivo histórico de código Java/SWT do Sweet Home 3D, com GPL e diversos avisos de terceiros. O repositório consultado é antigo, com instruções para Java 5/6 e versão 4.1 do código. Conclusão: a maturidade conceitual de cômodos, catálogo, planta, câmera e iluminação é útil, mas a implementação não é um candidato de integração direta no React/Three.js atual. Não copiar código ou assets GPL; extrair apenas conceitos de UX e persistência de ambiente.

### Wood-Frame

O repositório [JeromeL63/Wood-Frame](https://github.com/JeromeL63/Wood-Frame) é um workbench Python para FreeCAD, declara GPL-3.0 e tem atividade histórica menor, com 128 commits e última atualização visível em 2021. O README descreve vigas e painéis com posicionamento avançado, atributos para filtrar objetos e listas de invoice/produção, além de exportação DXF. Conclusão: não integrar código GPL. O benefício concreto para o Dioris é a ideia de metadados de fabricação por objeto — grupo, subgrupo, material e tipo — e a separação entre geometria e informação de produção.

## Matriz preliminar de decisão

| Projeto             | Licença observada                               | Stack/escopo                                                         | Decisão para o Dioris                                                                                              |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| WoodworkingShop     | MIT                                             | React/TypeScript, cabinet planner, 3D, MaxRects, BOM, PDF/DXF/G-code | Clonar isolado e estudar profundamente; candidato a portabilidade seletiva de algoritmos/contratos.                |
| FreeCAD Woodworking | MIT                                             | Python/FreeCAD, engenharia de móveis, furação, cut-list, custos      | Reimplementar conceitos de fabricação em TypeScript; não portar FreeCAD.                                           |
| FreeCAD             | LGPLv2.1 observada no repositório               | Kernel CAD paramétrico C++/Python                                    | Referência de precisão, constraints e coordenadas; sem integração direta.                                          |
| Blueprint3D Modern  | MIT                                             | TypeScript/Three.js/React, planta e ambiente                         | Comparar Room/Wall/Snap/Measurement; não colar a aplicação.                                                        |
| Aedifex             | Licença ainda precisa ser confirmada no LICENSE | React/Three.js/WebGPU, editor arquitetônico e IA natural-language    | Principal referência para DesignIntent, ferramentas estruturadas e ghost preview; auditar licença antes de código. |
| OpenCutList         | GPLv3                                           | SketchUp extension, cut-list, diagramas, etiquetas, custo/peso       | Reimplementar conceitos; não copiar código GPL sem estratégia de licenciamento.                                    |
| Sweet Home 3D       | GPL e licenças de terceiros                     | Java/SWT, ambiente/interiores/catalogo                               | Referência conceitual histórica; não integrar código/ativos.                                                       |
| Wood-Frame          | GPLv3                                           | Python/FreeCAD, painéis/vigas, atributos, produção/DXF               | Usar ideia de metadados de produção; não integrar código.                                                          |

## Conclusão da auditoria

A única base com alto potencial de reutilização direta é WoodworkingShop, por combinar MIT, React/TypeScript, cabinet planner, preview 3D, cut-list, nesting e exportações. Mesmo nesse caso, o plano correto é clonar em ambiente separado, comparar contratos e portar somente partes compatíveis com o Dioris Core. Os demais projetos devem contribuir com referências arquiteturais e algoritmos reimplementados de forma independente. O Dioris não deve virar uma colagem de oito aplicações.

## Clone isolado do WoodworkingShop

O projeto foi clonado sem modificar o Dioris em `/home/ubuntu/reference-audit/WoodworkingShop`. O clone contém uma base React/Vite/TypeScript com organização extensa de componentes de configurador, layout, otimizador, exportação e testes. O `package.json` expõe scripts de `build`, `typecheck`, `test`, `lint`, `quality`, `ci`, exportações golden, PDF, DXF/G-code e verificações de bundle. A estrutura observada inclui, entre outros, `src/components/configurator`, `src/components/layout`, `src/components/optimizer`, `src/engine`, `src/state` e `src/utils`. O README do repositório declara MIT; esta licença deve ser preservada se qualquer código for portado. A próxima comparação deve focar nos arquivos de engine/modelos paramétricos, estado de gabinete, assembly, cut-plan, BOM e exportadores, não na camada visual inteira.
