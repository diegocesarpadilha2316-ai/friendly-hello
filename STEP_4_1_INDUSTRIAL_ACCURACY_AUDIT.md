# STEP_4_1_INDUSTRIAL_ACCURACY_AUDIT

## Escopo

Esta correção trata exclusivamente do rigor industrial do Golden Module `kitchen-base-2-doors`. Não foi iniciada a Etapa 5. Não foram criadas novas famílias, catálogo amplo, CNC, G-code, DXF, toolpath ou Sistema 32.

A revisão corrigiu três confusões que eram tecnicamente perigosas: **diâmetro de parafuso não é automaticamente diâmetro de pré-furo**; **dobradiça e placa de montagem são componentes distintos**; e **faixa permitida pelo fabricante não é o mesmo que valor escolhido pela regra de aplicação do móvel**.

## Antes e depois

| Área | Antes | Depois |
|---|---|---|
| Variante industrial | A variante Blum da dobradiça carregava também dados da placa. | `71B3550` e `173H7100` são variantes distintas, com relação de compatibilidade bidirecional. |
| Parafuso da placa | `screwDiameterMm = 3.5` era promovido a `MachiningOperation.diameterMm = 3.5`. | `screwDiameterMm` e `screwLengthMm` vivem em `FastenerSpec`; `pilotHoleDiameterMm`/`pilotHoleDepthMm` ficam ausentes e o machining permanece **INCOMPLETE**. |
| Placa | Não existia como peça própria do Golden. | Cada dobradiça gera uma peça separada `mounting-plate-N`, quatro no módulo de 900 mm. |
| BOM | A placa não era um item industrial rastreável separado. | BOM contém 4 dobradiças Blum 71B3550 e 4 placas Blum 173H7100, com `hardwareId`, `variantId`, fabricante, código, quantidade e `partIds`. |
| Boring distance | `4.5 mm` era tratado como propriedade fixa da dobradiça. | A especificação registra somente a faixa oficial `3–7 mm`; a regra Golden registra a seleção e está **INCOMPLETE** porque faltam overlay/reveal/espessura suficientes. |
| Readiness | Um único READY podia esconder níveis diferentes. | `assemblyReadiness` separa placement/fastener assembly de `MachiningReadiness` para cup e pilot drilling. |
| Proveniência | Fonte concentrada na variante genérica. | Há IDs de fonte para hinge, cup, plate, fastener e application rule, sem duplicar URLs na instância. |

## Fontes oficiais

A ficha técnica oficial Blum confirma que a família CLIP top BLUMOTION utiliza copo de 35 mm e que furos de 35 mm e 8 mm devem ter profundidade mínima de 13 mm. Ela também apresenta faixa de boring distance de 3–7 mm e lista o código `71B3550` como straight-arm, screw-on, self-close [1]. O catálogo Blum lista as placas 37/32 e a fixação com parafusos para aglomerado; a página de placas cruciformes identifica `173H7100` como variante 37/32 com spacing 0 e altura 8,5 mm [2] [3].

> A documentação confirma a especificação do fastener e da família de placa. Ela não foi usada para inventar um diâmetro de pré-furo da chapa. Por isso a operação de pilot drilling continua INCOMPLETE.

## Modelo industrial separado

### Hinge variant

A variante `blum-71b3550-standard-110` permanece em `hinge-soft-close` com fabricante Blum, modelo CLIP top BLUMOTION 110° straight-arm screw-on e código `71B3550`. Seu `HingeManufacturingSpec` contém apenas fatos da dobradiça: copo de 35 mm, profundidade mínima de 13 mm, faixa de boring distance de 3–7 mm e referência de borda `HINGE_EDGE`.

O valor `4.5` foi removido da especificação do fabricante. Não há `selectedBoringDistanceMm` automático. A `GoldenHingeApplicationRule` registra que a seleção depende de `doorThicknessMm`, `overlayMm`, `revealMm`, espaçamento e altura da placa; como o modelo atual não fornece dados suficientes para justificar uma fórmula, o status da regra é **INCOMPLETE**.

### Mounting plate variant

A variante `blum-173h7100-37-32` pertence ao hardware separado `mounting-plate-37-32`, com fabricante Blum, modelo Cruciform cam mounting plate 37/32, spacing 0, código `173H7100` e altura de 8,5 mm. A especificação registra o padrão 37/32 e `referenceFromFrontEdgeMm = 37` como geometria de instalação documentada.

A relação é explícita:

| Relação | Valor |
|---|---|
| `71B3550.compatibleMountingPlateVariantIds` | `blum-173h7100-37-32` |
| `173H7100.compatibleHardwareVariantIds` | `blum-71b3550-standard-110` |

### Fastener versus machining

O fastener da placa registra `screwDiameterMm = 3.5` e `screwLengthMm = 17`, com proveniência da documentação Blum. Esses valores aparecem nos parâmetros da operação de montagem, mas **não** em `MachiningOperation.diameterMm`.

A especificação da placa não contém `pilotHole`. Consequentemente, a operação `mounting-plate-...:pilot-drilling` possui `diameterMm = undefined`, `pilotHoleDiameterMm = null`, `pilotHoleDepthMm = null`, `missingParameters = ["pilotHoleDiameterMm", "pilotHoleDepthMm"]` e status **INCOMPLETE**.

## Readiness final

A tabela abaixo separa assembly, machining e proveniência como solicitado.

| Item | ASSEMBLY | MACHINING | PROVENANCE |
|---|---|---|---|
| 71B3550 hinge | Variante verificada; compatível com 173H7100 | Não é operação de usinagem por si só | Blum ficha CLIP top BLUMOTION 110° [1] |
| 173H7100 plate | **READY** quando a variante compatível está selecionada | Não implica pré-furo | Blum catálogo 2022/2023, placa 37/32 [3] |
| Hinge cup | Posição vertical segue regra existente da porta | **INCOMPLETE** nesta etapa, pois a seleção 3–7 ainda não foi resolvida para 4,5 | Blum ficha; 35 mm e mínimo 13 mm [1] |
| Hinge cup fixing | Relação porta–dobradiça preservada | **INCOMPLETE**; nenhum pré-furo foi inventado | Dados da dobradiça e regra industrial ainda insuficiente |
| Mounting plate | Placement **READY** com variante e compatibilidade | Não se cria pilot drilling sem dados | Blum `173H7100`, 37/32 [3] |
| Mounting plate screw | **READY** como fastener de montagem: Ø3,5 mm × 17 mm | Não convertido em furo Ø3,5 mm | Blum catálogo de fixação [2] [3] |
| Mounting plate pilot drilling | Assembly da placa pode estar READY | **INCOMPLETE**: `pilotHoleDiameterMm` e `pilotHoleDepthMm` ausentes | Não documentado; deliberadamente não inferido |
| Boring distance selection | Regra Golden registrada | **INCOMPLETE** até existir justificativa suficiente | Faixa Blum 3–7; seleção pertence à regra do móvel [1] |

## BOM e rastreabilidade

No Golden verificado, a BOM apresenta os componentes separadamente:

| Hardware ID | Variant ID | Fabricante | Código | Quantidade | Rastreabilidade |
|---|---|---|---|---:|---|
| `hinge-soft-close` | `blum-71b3550-standard-110` | Blum | `71B3550` | 4 | `partIds` `door-N:hinge-M`, grupo da porta e joinery IDs |
| `mounting-plate-37-32` | `blum-173h7100-37-32` | Blum | `173H7100` | 4 | `partIds` `door-N:mounting-plate-M`, grupo da porta e joinery IDs |

A placa não entra na cut-list como painel. Ela é uma ferragem hardware separada, com seu próprio item de BOM e vínculo com a dobradiça e a porta. A instância persiste somente `hardwareVariantIds`; as especificações e URLs permanecem no registry.

## Operações e relações

Para cada dobradiça existente, o grafo Joinery mantém `hinge-cup` e `hinge-fixing` e acrescenta `mounting-plate-placement` e `mounting-plate-fixing` quando a placa está presente. Os IDs permanecem determinísticos. A operação de pilot drilling referencia porta, dobradiça, placa e lateral correspondente, usando coordenadas locais à peça.

A montagem da placa e a especificação do parafuso são reportadas em `assemblyReadiness`. A tentativa de furação é reportada separadamente em `MachiningReadiness`, sem promover o diâmetro do parafuso a diâmetro de broca.

## Testes obrigatórios

A fixture `goldenHardwareManufacturingSpec.test.ts` cobre a variante 71B3550, a placa 173H7100, compatibilidade, BOM 4+4, IDs distintos, relação hinge↔plate, ausência de promoção `screwDiameterMm → drilling diameter`, pilot-hole ausente, assembly READY, faixa 3–7, ausência de seleção automática 4,5, persistência, movimento, rotação, `900 → 1000 → 900`, além das regressões das Etapas 2 e 3.

| Verificação | Resultado |
|---|---|
| 71B3550 continua verificada | PASS |
| 173H7100 existe separadamente | PASS |
| BOM hinge quantity = 4 | PASS |
| BOM plate quantity = 4 | PASS |
| IDs de hinge e plate distintos | PASS |
| Relação hinge ↔ plate rastreável | PASS |
| Parafuso não vira diâmetro de furo | PASS |
| Pilot hole ausente mantém machining INCOMPLETE | PASS |
| Plate assembly READY | PASS |
| Manufacturer boring range = 3–7 | PASS |
| 4,5 pertence à application rule, não ao fabricante | PASS |
| 900 → 1000 → 900 | PASS |
| Movimento e rotação invariáveis | PASS |
| Etapa 2 | PASS |
| Etapa 3 | PASS |

## Typecheck, testes e build

O baseline informado para a Etapa 4.1 era de 6 diagnósticos TypeScript. O resultado posterior também possui 6 diagnósticos, todos nos mesmos pontos fora do escopo: uma propriedade `removable` em `builders.ts` e cinco atribuições `string | null` em `usePlannerStore.ts`. Portanto, o delta de erros novos introduzidos pela Etapa 4.1 é **zero**.

| Validação | Resultado |
|---|---:|
| TypeScript antes | 6 erros |
| TypeScript depois | 6 erros |
| Novos erros | 0 |
| Suíte completa | 43 arquivos, 552 testes PASS |
| Build de produção | PASS, exit 0 |
| Deploy | NÃO EXECUTADO |
| Etapa 5 | NÃO INICIADA |

## Critério final

A correção atende ao critério central: o Dioris não confunde mais diâmetro do parafuso com diâmetro de pré-furo, não confunde faixa de fabricante com valor escolhido pela regra do móvel e trata dobradiça e placa como componentes industriais rastreáveis separadamente.

O resultado correto permanece parcial onde a evidência é insuficiente: cup e pilot drilling não são promovidos artificialmente a READY enquanto a seleção de boring distance e o pré-furo não possuírem regras/documentação suficientes.

## References

[1]: https://d2.blum.com/services/BEC003/cliptopbmn_fl_dok_bus_$sen-us_$aof_$v1.pdf "Blum — CLIP top BLUMOTION 110° hinges, technical PDF"
[2]: https://publications.blum.com/2022/catalogue/en/144/ "Blum Catalogue 2022/2023 — Mounting plates"
[3]: https://publications.blum.com/2022/catalogue/en/146/ "Blum Catalogue 2022/2023 — Cruciform cam mounting plate 37/32"
