# Dioris Planner V2 — Etapa 5

## Golden Module: Balcão 2 Portas

> **Objetivo:** formalizar a camada de `Assembly/Application Rule`, mantendo a especificação do fabricante separada das decisões de aplicação do gabinete e produzindo um `ResolvedHardwareApplication` determinístico para Joinery, Machining e BOM.

## Resultado executivo

A Etapa 5 foi implementada e validada sobre o módulo `kitchen-base-2-doors`. O pipeline agora distingue explicitamente três camadas:

| Camada | Responsabilidade | Fonte de verdade |
|---|---|---|
| `HardwareManufacturingSpec` | Dados técnicos documentados do fabricante: diâmetro do copo, profundidade, faixas de boring, sistema de placa e furação | `HardwareRegistry` |
| `HardwareApplicationRule` | Decisões da família de cozinha: overlay/reveal, contagem de dobradiças, offsets verticais, compatibilidade e parâmetros obrigatórios | `families/kitchen/applicationRules.ts` |
| `ResolvedHardwareApplication` | Estado calculado para uma instância concreta: peças, lados, gaps, overlay/reveal, status, diagnósticos e IDs | `hardwareApplicationResolver.ts` |

A regra não inventa dados industriais ausentes. Quando o conjunto selecionado não possui variante verificável, quando a combinação é incompatível ou quando a geometria não permite derivar um reveal simétrico, o resultado permanece `INCOMPLETE` ou `INVALID`, conforme o caso.

## Implementação realizada

A especificação `HardwareManufacturingSpec.ts` foi reduzida à camada de fabricante. A terminologia da placa foi desambiguada: `holeSpacingMm: 32` representa a distância entre furos do sistema 32 mm, enquanto `plateSystemDistanceMm: 0` representa o valor do sistema/terminologia de placa; esses conceitos não são mais expostos como um único `mountingPlateSpacingMm`.

A nova regra `GOLDEN_71B3550_173H7100_RULE` contém somente decisões de aplicação da família. Ela define a aplicação `paired-full-overlay`, exige espessura da porta e geometria de overlay/reveal, estabelece faixa permitida de boring distance de 3–7 mm, usa edge offset de 37 mm, considera três dobradiças somente a partir do limiar de altura configurado e mantém proveniência própria com `sourceType: family-rule`.

O resolver calcula a aplicação a partir das peças reais da instância. Em particular, calcula a largura das portas, gap central, gaps externos, reveal, overlay, contagem de dobradiças, offsets verticais e o lado da dobradiça. A transformação do móvel no espaço — posição e rotação — não entra no cálculo, que permanece em coordenadas locais e, portanto, é invariável para fabricação.

Joinery e Machining passaram a consumir o estado resolvido. Cada operação de dobradiça carrega `resolvedApplicationId`, `applicationRuleId` e `applicationType` quando disponíveis. A ausência de boring distance selecionado mantém o status de aplicação e usinagem como `INCOMPLETE`; não há geração de CNC, G-code ou pré-furo inferido nesta etapa.

## Invariantes validados

| Invariante | Resultado |
|---|---|
| Fabricante e regra de aplicação são contratos distintos | Passou |
| Variante Blum 71B3550 + placa Blum 173H7100 é reconhecida como compatível | Passou |
| `32 mm` não é confundido com `plateSystemDistanceMm: 0` | Passou |
| IDs das portas e da regra permanecem estáveis em 900 → 1000 → 900 mm | Passou |
| Contagem de dobradiças permanece 2 por porta para o Golden de 870 mm | Passou |
| Offsets verticais derivados para o Golden atual: 262/758 mm | Passou |
| Movimento e rotação não alteram aplicação nem IDs locais | Passou |
| Combinação de variantes ausente/incompatível não é promovida a pronta | Passou |
| BOM, cut-list e nesting continuam produzidos sem ferragem entrar no cut-list | Passou |

## Observação geométrica honesta

A geometria atual do builder, observada pelo resolver, produz em 900 mm portas de 446 mm, gap central de 2 mm e gaps externos de 2 mm à esquerda e 4 mm à direita. Como o reveal externo não é simétrico, `revealMm` e `overlayMm` permanecem indefinidos e o estado de aplicação permanece `INCOMPLETE`. Isso é comportamento deliberado de segurança industrial: a camada de aplicação não mascara uma inconsistência geométrica com um valor presumido.

Em 1000 mm, o resolver continua calculando a partir das peças reais, preserva os IDs e demonstra a alteração geométrica sem tratar a largura do gabinete como uma constante escondida. A correção da assimetria do builder, caso desejada, deve ser uma decisão posterior de geometria/aplicação; não foi introduzida como escopo oculto da Etapa 5.

## Validação executada

| Verificação | Resultado |
|---|---:|
| TypeScript `tsc --noEmit` | 6 erros, iguais ao baseline pré-existente |
| Vitest direcionado | 4 arquivos, 17 testes, 17 passaram |
| Vitest completo | 44 arquivos, 557 testes, 557 passaram |
| Build de produção | Passou (`vite build` + patch Nitro) |
| Novos erros TypeScript introduzidos pela Etapa 5 | 0 |

Os seis erros de TypeScript restantes são o baseline já conhecido: um campo `removable` no builder e cinco atribuições `string | null` no `usePlannerStore.ts`. Nenhum deles pertence aos contratos, resolver, reports ou fixture da Etapa 5.

## Arquivos centrais

- `src/modules/planner-v2/library/contracts/HardwareApplicationRule.ts`
- `src/modules/planner-v2/library/contracts/HardwareManufacturingSpec.ts`
- `src/modules/planner-v2/library/families/kitchen/applicationRules.ts`
- `src/modules/planner-v2/library/services/hardwareApplicationResolver.ts`
- `src/modules/planner-v2/library/services/joineryReport.ts`
- `src/modules/planner-v2/library/services/machiningReport.ts`
- `src/modules/planner-v2/library/registry/HardwareRegistry.ts`
- `src/modules/planner-v2/pkg/state/goldenAssemblyApplicationRule.test.ts`

## Limites respeitados

Esta etapa não adiciona CNC, G-code, nova família de módulos, nova biblioteca open source ou promoção artificial de estado incompleto para pronto. O foco permanece no `Balcão 2 Portas` como Golden Module e na rastreabilidade da aplicação de ferragens.

## Decisão de encerramento

A Etapa 5 está pronta para revisão. O trabalho deve parar aqui até aprovação explícita. A Etapa 6 e qualquer implementação de CNC/G-code não fazem parte deste pacote.

**Data da validação:** 18 de agosto de 2026.
