# Auditoria e plano de evolução do Dioris Planner V2

**Autor:** Manus AI  
**Data:** 14 de agosto de 2026  
**Referência principal:** `AnaSilvia-CozinhaLuciane.promob` e `pasted_content.txt`

## Conclusão executiva

A estratégia correta não é copiar oito projetos para dentro do Dioris. O Dioris deve permanecer como **orquestrador único**, absorvendo conceitos maduros de cada referência por meio de contratos próprios e algoritmos reimplementados com testes. O projeto com maior potencial de reutilização seletiva é o **WoodworkingShop**, porque combina licença MIT, React/TypeScript, gabinete paramétrico, peças, otimização de chapas, preview, BOM, PDF, DXF e G-code [1]. Mesmo assim, ele foi clonado em ambiente separado e não foi misturado ao código do Dioris.

A camada open source já produziu uma primeira entrega concreta. O Dioris agora possui `DesignIntent`, interpreta materiais e ferragens, usa o Layout Engine sem coordenadas manuais, gera peças físicas, separa zonas técnicas, registra ferragens, produz lista de corte CSV, mostra a aba Fabricação e gera sequência de montagem por módulo. A suíte completa terminou com **33 arquivos e 526 testes aprovados**; a verificação TypeScript também terminou sem erros.

Isso ainda não deve ser chamado de “Promob completo” ou de “CAM/CNC pronto”. O próximo bloco necessário é nesting de chapas, furação/joinery, DXF/G-code real, etiquetas, custos, PDF técnico e validação visual contra o projeto Promob. A diferença é que agora existe uma fundação correta para implementar essas etapas sem continuar construindo uma caixa branca genérica.

## Auditoria das referências

| Referência | Licença/risco | Contribuição técnica | Decisão |
|---|---|---|---|
| WoodworkingShop | MIT [1] | Cabinet planner React/TypeScript, templates paramétricos, peças, MaxRects, veio, BOM, PDF, DXF, G-code | Clonado isoladamente; portar seletivamente contratos e algoritmos puros com atribuição. |
| FreeCAD Woodworking | GPL-3.0 [2] | Armários, painéis, atributos, listas de produção e exportação DXF | Reimplementar conceitos; não copiar código GPL. |
| FreeCAD | LGPLv2.1 observada no repositório [3] | Precisão CAD, constraints, coordenadas e transformações | Usar como referência de engenharia; não portar o kernel. |
| Blueprint3D Modern | MIT [4] | Paredes, snapping, planta, coordenadas 2D/3D e ambiente Three.js | Comparar motores; não colar uma segunda aplicação Next.js. |
| Aedifex | Licença deve ser confirmada no arquivo LICENSE [5] | IA natural-language, ferramentas estruturadas, ghost preview, zonas e editor arquitetônico WebGPU/Three.js | Referência principal para Dioris AI; auditar licença antes de código. |
| OpenCutList | GPLv3 [6] | Cut-list, diagramas, etiquetas, custo, peso e vistas explodidas | Reimplementar fluxos de produção, sem copiar código. |
| Sweet Home 3D | GPL e terceiros [7] | Catálogo, cômodos, planta, câmera e iluminação | Referência conceitual histórica; sem integração direta. |
| Wood-Frame | GPL-3.0 [8] | Metadados de produção, painéis, atributos e DXF | Usar a ideia de metadados; não integrar código. |

## O que foi implementado no Dioris

### Contrato de intenção

Foi criado `DesignIntent` como camada formal entre o pedido humano e a cena. A estrutura carrega domínio, parede, espessuras, materiais, ferragens, módulos, sequência, âncoras, restrição contra posicionamento manual, exigência de Layout Engine, exigência de fabricação e saídas solicitadas.

Pedidos com expressões como “MDF Freijó 18 mm”, “puxador gola”, “bancada de granito”, “lista de corte”, “BOM” e “render” são convertidos em parâmetros estruturados. O sistema não gera coordenadas aleatórias: os módulos continuam sendo posicionados pelo Layout Engine.

### Fabricação

O `fabricationReport` gera uma lista agrupada de peças físicas, removendo volumes decorativos, aberturas e zonas técnicas da lista de MDF. Cada item conserva quantidade, dimensões, função, material, veio, fita de borda e nomes de origem. A lista de ferragens identifica corrediças, dobradiças, puxadores, pés e a nova cuba técnica `sink-bowl`.

A interface agora possui a aba **Fabricação**, acessível pelo botão **Lista de Corte** do topo. Ela exibe peças, ferragens e instruções de montagem e oferece download de `dioris-lista-de-corte.csv`.

### Montagem

O `assemblyReport` cria etapas determinísticas por módulo: montagem do carcass, instalação de caixas e corrediças, regulagem de portas/frentes e inspeção final. Cada etapa lista peças, ferragens e instrução de execução. Isso é uma base de manual de montagem, não ainda uma sequência CNC de furação.

### Materiais e ferragens

A integração passou a aplicar os overrides reconhecidos pela IA aos módulos criados. O catálogo possui MDF, pedras, puxadores gola/cava/perfil, dobradiças, corrediças, pés reguláveis e cuba técnica. A regra de espessura mantém MDF 18 mm como padrão quando o pedido não especifica outra espessura.

## Validação executada

| Verificação | Resultado |
|---|---:|
| Testes focados de DesignIntent, fabricação, montagem e ETAPA 1 | 11/11 aprovados |
| Suíte completa do projeto | 33 arquivos, 526 testes aprovados |
| TypeScript `tsc --noEmit` | Aprovado |
| Layout Engine sem posicionamento manual | Implementado e coberto por testes |
| Lista de corte CSV | Implementada |
| Relatório de montagem | Implementado |
| Nesting MaxRects | Ainda pendente no Dioris |
| DXF/G-code de produção | Ainda pendente no Dioris |
| Furação, cavilha, minifix e joinery detalhada | Ainda pendente |
| Equivalência visual 100% com o Promob anexado | Ainda pendente de nova rodada de render/ajuste |

## Próxima implementação correta

A próxima etapa deve portar para TypeScript, com contratos do Dioris, o núcleo puro de parametrização e nesting estudado no WoodworkingShop. O fluxo deve ser: `DesignIntent` validado → `ModuleSpec[]` → `PartDefinition[]` → `JoineryDefinition[]` → otimização de chapas → etiquetas/BOM/custos → DXF/G-code quando os parâmetros de máquina forem explícitos.

Em paralelo, a referência Promob deve ser usada para calibrar famílias reais: módulos de canto, torre, aéreos, profundidades especiais, recuos, acabamentos, ferragens visíveis, puxadores e enquadramento. Nenhuma imagem genérica deve ser apresentada como equivalente ao Promob antes dessa comparação.

## Referências

[1]: https://github.com/RajwanYair/WoodworkingShop "RajwanYair/WoodworkingShop — Cabinet Planner & Cut-List Optimizer"

[2]: https://github.com/dprojects/Woodworking "dprojects/Woodworking — FreeCAD woodworking workbench"

[3]: https://github.com/FreeCAD/FreeCAD "FreeCAD — Official source code"

[4]: https://github.com/charmlinn/blueprint3d-modern "Blueprint3D Modern — TypeScript 3D floor planner"

[5]: https://github.com/TangSY/aedifex "Aedifex — Open-source 3D architectural editor with AI design assistant"

[6]: https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension "OpenCutList — SketchUp woodworking cut-list extension"

[7]: https://github.com/Vanuan/sweethome3d "Sweet Home 3D source archive"

[8]: https://github.com/JeromeL63/Wood-Frame "Wood-Frame — FreeCAD workbench for wood frame"
