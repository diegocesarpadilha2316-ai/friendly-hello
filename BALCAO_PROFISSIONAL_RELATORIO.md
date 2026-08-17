# Balcão 2 Portas — entrega profissional de engenharia

## Escopo

Foi priorizado um único módulo para elevar a qualidade de forma verificável: o **Balcão 2 Portas**, com largura nominal de 800 mm, altura de 870 mm e profundidade de 580 mm. A implementação aproveita a biblioteca paramétrica já existente do Dioris Planner V2 e transforma o módulo em uma unidade auditável de fabricação, em vez de tentar mascarar problemas de uma composição inteira com renderização.

## Resultado técnico validado

| Indicador | 800 mm | 900 mm |
|---|---:|---:|
| Peças totais no módulo | 25 | 25 |
| Peças cortáveis no nesting | 8 | 8 |
| Componentes de hardware | 17 | 17 |
| Largura de cada porta | 396 mm | 446 mm |
| Altura de cada porta | 716 mm | 716 mm |
| Largura da prateleira | 762 mm | 862 mm |
| Profundidade da prateleira | 560 mm | 560 mm |
| Chapas no nesting | 2 | 2 |
| Peças não posicionadas | 0 | 0 |
| Peças faltantes, duplicadas ou desconhecidas | 0 | 0 |

A alteração de 800 mm para 900 mm é uma reconstrução paramétrica real. A largura das portas aumenta de 396 mm para 446 mm e a prateleira aumenta de 762 mm para 862 mm; não se trata de uma simples escala do mesh.

## Construção implementada

O corpo usa laterais, base, topo e fundo independentes. A prateleira interna possui quatro suportes físicos, dois por lateral, com posições frontais e traseiras. Cada porta possui duas dobradiças soft-close no tamanho validado; o builder está preparado para adicionar uma terceira dobradiça em portas mais altas. O módulo possui quatro pés reguláveis e um rodapé frontal contínuo, recuado 20 mm, classificado como perfil técnico e fixado aos dois pés frontais por clips removíveis. O perfil não entra no MDF cortável e não deve ser representado como uma caixa estrutural.

A lista de ferragens deixou de declarar corrediças quando o módulo não tem gavetas. Suportes de prateleira passaram a ser peças técnicas explícitas. Os IDs de ferragem permanecem ligados ao catálogo oficial, incluindo `hinge-soft-close`, `shelf-support`, `leg-adjustable` e `handle-gola`.

A demonstração visual isolada usa MDF Cinza Sagrado, puxador gola e bancada parametrizada separada. O modo de apresentação oculta arquitetura, decoração e eletrodomésticos externos para que o módulo auditado não fique escondido por elementos de cena que não fazem parte dele. A interface agora possui o comando Vista superior, que enquadra o balcão selecionado diretamente pelo bounding box da instância.

## Testes executados

A suíte específica do módulo profissional passou com **53 testes**, incluindo construção dos 38 módulos da família, portas e pivôs, gavetas, pés, ferragens gola/cava, validação do Balcão 2 Portas, reconstrução 800→900 mm e nesting. O build de produção também foi concluído sem erro.

O teste de nesting confirmou, nas duas larguras, que todas as 8 peças cortáveis aparecem no plano, nenhuma peça fica sem posicionamento e não existem IDs faltantes, duplicados ou desconhecidos. A inclusão dos dois clips de rodapé aumentou a lista técnica para 25 peças totais e 17 componentes de hardware, sem alterar as 8 peças cortáveis.

## Evidências visuais

A imagem de 800 mm mostra o balcão isolado com duas portas, puxador gola, bancada, rodapé e pés. A imagem de 900 mm mostra a mesma unidade após a reconstrução paramétrica, com frentes e corpo mais largos. As imagens são capturas WebGL/SwiftShader do Planner V2, não imagens geradas por IA.

## Estado da publicação

O código foi compilado e validado localmente. A publicação modular completa no Worker Cloudflare ainda não deve ser declarada como concluída: a tentativa anterior de upload do pacote completo excedeu o tempo limite da API e a verificação posterior retornou a versão anterior. Portanto, esta entrega comprova o módulo profissional no código e na execução local, mas não afirma falsamente que a nova versão já está ativa no live.

## Arquivos principais alterados

| Arquivo | Finalidade |
|---|---|
| `src/modules/planner-v2/library/families/kitchen/builders.ts` | Geometria, dobradiças, suportes, pés, rodapé e lista condicional de hardware. |
| `src/modules/planner-v2/library/families/kitchen/professionalModules.ts` | Prateleira padrão no Balcão 2 Portas. |
| `src/modules/planner-v2/library/families/kitchen/professionalModules.test.ts` | Testes de aceite do balcão e da reconstrução 800→900 mm. |
| `src/modules/planner-v2/pkg/state/usePlannerStore.ts` | Demonstração isolada `?balcao=1` com acabamento e bancada. |
| `src/modules/planner-v2/pkg/scene/RoomScene.tsx` | Isolamento visual no modo de apresentação. |
| `BALCAO_PROFISSIONAL_SPEC.md` | Especificação construtiva e critérios de aceite. |
