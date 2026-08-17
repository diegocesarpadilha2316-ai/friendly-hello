# Especificação profissional — Balcão 2 Portas

## Objetivo

O primeiro módulo de referência do Dioris Planner V2 será um balcão inferior de duas portas, com largura nominal de 800 mm, altura total de 870 mm e profundidade nominal de 580 mm. O módulo deve ser visualmente convincente, paramétrico e fabricável: cada peça estrutural deve possuir dimensões próprias, material, espessura, veio, fita de borda e identificação única para o plano de corte.

## Padrão construtivo de validação

| Elemento | Critério de validação |
|---|---|
| Laterais | Duas peças estruturais de 18 mm, altura útil descontando o rodapé e profundidade do corpo. |
| Base e topo | Peças horizontais de 18 mm, com largura interna coerente com as laterais e sem ultrapassar o corpo. |
| Fundo | Fundo técnico de 6 mm, recuado e identificado separadamente do MDF estrutural. |
| Prateleira | Uma prateleira interna regulável, com folga lateral e profundidade compatíveis com o fundo. |
| Portas | Duas frentes independentes, espessura de 18 mm, folga perimetral nominal de 2 mm e veio vertical. |
| Dobradiças | Duas dobradiças soft-close por porta no mínimo; o relatório deve listar a quantidade por porta. |
| Puxador | Puxador gola ou cava parametrizado, com geometria própria e material de hardware. |
| Rodapé | Perfil técnico separado da lista de MDF e acompanhado de pés reguláveis. |
| Bancada | Peça superior separada, com material de bancada e espessura definida; nunca deve ser confundida com o topo do corpo. |
| Montagem | Relatório deve distinguir peças de corte, ferragens, furações e observações de montagem. |

## Bugs e riscos identificados na linha de base

A implementação atual possui uma boa base de contratos e os testes profissionais existentes passam, mas ainda há riscos que impedem chamar o módulo de pronto para marcenaria sem uma validação adicional. O catálogo do balcão usa uma fábrica genérica para vários tipos de módulo; por isso, o mesmo builder precisa tratar corretamente porta, gaveta, pia, cooktop e corpo comum sem misturar regras técnicas. A lista de hardware do corpo comum também inclui corrediça mesmo quando o módulo não possui gavetas, o que pode gerar uma lista de ferragens superdimensionada.

A geometria do balcão deve ser validada além do número de peças. É necessário confirmar se a folga das portas é realmente perimetral, se a quantidade de dobradiças é adequada à altura da porta, se o fundo não contamina o nesting de MDF de 18 mm, se o rodapé não entra como chapa cortável e se a bancada permanece como peça independente. Também será necessário testar uma transição de largura, por exemplo 800 mm para 900 mm, verificando mudança de largura das portas, posição da prateleira, fita de borda, ferragens e nesting.

## Critérios de aceite

O módulo somente será considerado profissional quando os testes confirmarem simultaneamente: geometria sem interseções indevidas; dimensões e espessuras coerentes; portas e ferragens selecionáveis e abríveis; lista de fabricação completa; ferragens sem duplicação artificial; plano de corte sem peças faltantes ou desconhecidas; e reconstrução paramétrica real quando a largura for alterada.
