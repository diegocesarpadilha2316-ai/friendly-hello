# STEP_4_GOLDEN_HARDWARE_MANUFACTURING_SPEC

## Escopo e decisão industrial

A Etapa 4 adiciona uma camada verificável de especificação industrial ao Golden Module `kitchen-base-2-doors`, sem refazer as Etapas 2 e 3. A implementação diferencia explicitamente:

> **Existe uma dobradiça** não é o mesmo que **esta variante específica possui documentação suficiente para gerar operações fabricáveis**.

O hardware legado `hinge-soft-close` permanece genérico e **INCOMPLETE** quando não há variante selecionada. A única variante adicionada nesta etapa é a `Blum CLIP top BLUMOTION 110° straight-arm screw-on`, código `71B3550`, vinculada a documentação oficial do fabricante. Nenhum catálogo amplo foi criado.

## Fontes oficiais utilizadas

| Fonte | Uso | Fatos utilizados |
|---|---|---|
| [1] Blum, *CLIP top BLUMOTION 110° hinges*, ficha técnica oficial | copo e regra de furação da porta | 71B3550 é straight-arm, screw-on, self-close; copo de 35 mm; furos de 35 mm e 8 mm com profundidade mínima de 13 mm; boring distance range 3–7 mm |
| [2] Blum, *Catalogue and technical manual 2022/2023*, p. 74 | identidade oficial do produto | lista `71B3550` como CLIP top BLUMOTION standard 110° screw-on |
| [3] Blum, *Catalogue and technical manual 2022/2023*, p. 144 | família da placa de montagem | placas cruciformes 37/32 e fixação com parafusos para aglomerado Ø3,5 mm; recomendação de 17 mm |
| [4] Blum, *Catalogue and technical manual 2022/2023*, p. 146 | variante da placa | `173H7100`, cruciform cam mounting plate 37/32, spacing 0, height 8,5 mm; fixação Ø3,5 ou Ø4 mm |

A página 132 foi consultada como controle de escopo e não foi usada como fonte primária da variante standard, pois descreve aplicação angular de 95° e códigos 71B9550/9650/9750. Valores dimensionais não foram obtidos de marketplace, blog, Pinterest, fórum ou memória.

## 1. Hardware genérico auditado

A entrada original `hinge-soft-close` continha apenas nome genérico, categoria, dimensões de representação, instalação, roles compatíveis, mesh e custo. Não continha fabricante, modelo, código de fabricante, revisão, fonte, diâmetro de copo, profundidade, boring distance ou padrão de placa. Portanto, a entrada sem `hardwareVariantIds.hinge` continua **INCOMPLETE**.

O hardware `shelf-support` continua sem fabricante/modelo e sem documentação de diâmetro, profundidade, offset ou pitch. Continua **INCOMPLETE**. Gola, pés, clips e rodapé não foram convertidos em usinagem.

## 2. Variante industrial selecionada

| Campo | Valor |
|---|---|
| Hardware genérico | `hinge-soft-close` |
| Variante | `blum-71b3550-standard-110` |
| Fabricante | Blum |
| Modelo | CLIP top BLUMOTION 110° straight-arm screw-on |
| Código | 71B3550 |
| Aplicação documentada | standard, 110°, screw-on, self-close |
| Documento técnico | CLIP top BLUMOTION 110° hinges |
| Revisão registrada | ficha técnica 2010; catálogo 2022/2023 para placa |
| Fonte | URLs oficiais [1]–[4] |
| Unidade | milímetros |
| Data de verificação | 2026-08-18 |

A variante vive no `HardwareRegistry` como `manufacturingVariants[]`. A instância armazena apenas `hardwareVariantIds: { hinge: "blum-71b3550-standard-110" }`; a documentação não é duplicada em cada `FurnitureInstance`.

## 3. ManufacturingSpec adotado

Foi criado `HardwareManufacturingSpec.ts` com `ManufacturingProvenance`, `HingeManufacturingSpec`, `HingeCupSpec`, `HingeFixingPattern` e `HardwareManufacturingVariant`.

### Hinge cup

| Campo | Valor | Referência |
|---|---:|---|
| `cupDiameterMm` | 35 | ficha oficial Blum [1] |
| `cupDepthMm` | 13 | profundidade mínima oficial para furos de 35 mm [1] |
| `boringDistanceMm` | 4,5 | valor da tabela/aplicação oficial para a configuração adotada [1] |
| `boringDistanceRangeMm` | 3–7 | faixa oficial [1] |
| `edgeReference` | `HINGE_EDGE` | referencial semântico da regra |
| `verticalPlacementRule` | `existing-door-rule` | regra do móvel, separada da especificação da ferragem |

### Hinge fixing

| Campo | Valor | Referência |
|---|---:|---|
| `kind` | `cruciform-37-32` | catálogo oficial Blum [3] [4] |
| `mountingPlateSpacingMm` | 32 | identificação 37/32 da placa [3] [4] |
| `referenceFromFrontEdgeMm` | 37 | identificação/referência 37/32 da placa [3] [4] |
| quantidade de furos | 2 | padrão da placa representado como dois furos |
| diâmetro do parafuso | 3,5 mm | fixação por chipboard screw [3] [4] |
| comprimento recomendado | 17 mm | catálogo oficial [3] |
| referência geométrica | `CABINET_FRONT_EDGE` | origem semântica da medida |

O padrão não é armazenado como uma string solta: possui tipo, espaçamento, referência e dois elementos de furo. A posição vertical das dobradiças permanece uma regra do móvel; não foi misturada com o diâmetro do copo ou com o padrão do fabricante.

## 4. Readiness

A função existente `evaluateMachiningReadiness` passou a considerar a variante e sua proveniência. O relatório de usinagem só retorna `READY` quando encontra uma variante registrada, fonte do tipo `manufacturer-documentation`, especificação de copo/fixação completa e campos numéricos necessários.

| Configuração | Hinge cup | Hinge fixing | Motivo |
|---|---|---|---|
| genérica `hinge-soft-close` | **INCOMPLETE** | **INCOMPLETE** | não há fabricante/modelo/variante nem parâmetros industriais |
| variante inválida | **INCOMPLETE** | **INCOMPLETE** | referência não resolve no registry |
| Blum `71B3550` verificada | **READY** | **READY** | copo, profundidade, boring distance, padrão 37/32, furos, diâmetro, parafuso e proveniência presentes |
| `shelf-support` atual | **INCOMPLETE** | **NOT APPLICABLE** | sem fabricante/modelo e sem dados de furação verificáveis |

As operações READY carregam `hardwareVariantId`, `provenance`, `diameterMm`, `depthMm` quando aplicável, `parameters` estruturados, face, coordenadas part-local, partId e relações existentes.

## 5. Relações esquerda/direita e operações

A Etapa 3 foi preservada. A porta esquerda continua ligada à lateral `side-left`; a porta direita continua ligada à lateral `side-right`. Para cada porta, as operações de copo pertencem à própria porta e as operações de fixação pertencem à lateral correspondente, mantendo porta e peça de dobradiça em `relatedPartIds`.

A mudança de variante não altera a quantidade de dobradiças. No Golden, a fixture verifica quatro operações de copo e quatro de fixação, todas com IDs determinísticos e prontidão READY na variante Blum.

## 6. Gola, pés, clips, rodapé e Sistema 32

Gola continua **ASSEMBLY**, pois a configuração atual não possui documentação oficial selecionada que exija rasgo/cava. Pés reguláveis continuam **PURCHASED_HARDWARE**. Clips continuam **PURCHASED_HARDWARE**. O perfil de rodapé continua **PROFILE**. Nenhum CNC foi gerado para itens apenas comprados/montados.

O Sistema 32 continua **NOT REQUIRED**. Uma furação pontual de suporte de prateleira não foi promovida a carreira Sistema 32.

## 7. BOM, cut-list, nesting e persistência

A BOM agora diferencia a ferragem genérica da variante verificada por `hardwareVariantId`, fabricante, modelo e `manufacturerCode`. Para a variante, a entrada de BOM contém `hinge-soft-close`, `blum-71b3550-standard-110`, `Blum`, `71B3550` e quantidade 4. A quantidade não mudou.

A cut-list permanece composta por peças físicas; ferragens não são painéis. O nesting não usa a variante industrial para alterar placas ou placements. A instância salva apenas `hardwareVariantIds`; `serializeModule` confirma que a documentação, cupDiameter e demais dados não são serializados dentro da instância. O reload V4 restaura a referência e o registry resolve a documentação novamente.

## 8. Fixture obrigatória

`goldenHardwareManufacturingSpec.test.ts` cobre:

| Cenário | Resultado |
|---|---|
| genérico permanece INCOMPLETE | PASS |
| variante inexistente é rejeitada sem READY | PASS |
| variante Blum cup/fixing READY | PASS |
| cup possui 35 mm, 13 mm, 4,5 mm e provenance | PASS |
| fixing possui 37/32, 32 mm, 37 mm, Ø3,5 mm e 17 mm | PASS |
| relações esquerda/direita | PASS |
| BOM diferencia fabricante/modelo/código | PASS |
| ferragem não entra na cut-list | PASS |
| referência de variante persiste | PASS |
| documentação não é duplicada na instância | PASS |
| `900 → 1000 → 900` | PASS |
| IDs e readiness permanecem estáveis | PASS |
| movimento e rotação invariantes | PASS |
| Sistema 32 não inventado | PASS |

## 9. Typecheck, testes e build

O baseline fresco da Etapa 3 tinha 9 diagnósticos TypeScript. Nesta etapa foram corrigidos de maneira localizada os três diagnósticos de `HardwareRegistry` relativos a categorias `profile`/`connector` e acabamento `aluminio-anodizado-preto`, diretamente relacionados ao catálogo industrial.

| Medição | Resultado |
|---|---:|
| TypeScript antes da Etapa 4 | 9 erros |
| TypeScript depois da Etapa 4 | 6 erros |
| Erros corrigidos | 3 |
| Novos erros em arquivos da Etapa 4 | 0 |
| Erros restantes | 1 em `builders.ts` e 5 em `usePlannerStore.ts` |
| Delta | -3 |
| Suíte completa | 43 arquivos, 552 testes PASS |
| Build de produção | PASS, exit 0 |
| Chunks SSR | 258 |
| Deploy | NOT TESTED |

Os seis erros restantes não foram ampliados para uma refatoração geral: um envolve propriedades extras de geometria de perfil em `builders.ts` e cinco envolvem `string | null` no caminho antigo de `usePlannerStore`.

## 10. Tabela final de aceite

| Item | Resultado | Evidência |
|---|---|---|
| HardwareManufacturingSpec | **PASS** | `HardwareManufacturingSpec.ts` |
| Manufacturer provenance | **PASS** | fontes oficiais Blum [1]–[4] e objeto `source` |
| Generic hinge remains INCOMPLETE | **PASS** | fixture genérica sem variantId |
| Verified hinge variant | **PASS** | `blum-71b3550-standard-110` |
| Hinge cup READY | **PASS** | 35 mm, 13 mm, boring distance e provenance |
| Hinge fixing READY | **PASS** | padrão 37/32, 2 furos, Ø3,5 mm, 17 mm |
| Part-local coordinates | **PASS** | contrato e fixture da Etapa 3/4 |
| Left/right side association | **PASS** | `side-left`/`side-right` por porta |
| Shelf support | **PARTIAL** | permanece INCOMPLETE sem catálogo oficial |
| System 32 | **NOT REQUIRED** | não usado pelo Golden atual |
| Gola classification | **PASS** | `ASSEMBLY` |
| Feet classification | **PASS** | `PURCHASED_HARDWARE` |
| Toe-kick classification | **PASS** | clip hardware, perfil profile |
| BOM identity | **PASS** | variante separada com fabricante/modelo/código |
| Persistence | **PASS** | apenas `hardwareVariantIds` na instância |
| 900 → 1000 | **PASS** | variante, spec, IDs e READY preservados |
| 1000 → 900 | **PASS** | snapshot retorna ao original |
| Move invariance | **PASS** | coordenadas locais não mudam |
| Rotation invariance | **PASS** | coordenadas locais não mudam |
| Step 2 regression | **PASS** | suíte completa |
| Step 3 regression | **PASS** | fixture de usinagem continua PASS |
| Typecheck new errors = 0 | **PASS** | 9 → 6; delta de novos erros = 0 |
| Tests | **PASS** | 43 arquivos, 552 testes |
| Production build | **PASS** | exit 0 |
| CAM/CNC/G-code | **NOT REQUIRED** | fora do escopo |

## Proveniência open source

`dprojects/Woodworking` e `WoodworkingShop` foram usados somente como referência conceitual de separação entre ferragem, peça, regra e operação. Os valores industriais desta etapa vêm exclusivamente da documentação oficial Blum. Nenhum código, asset, workbench ou dependência open source foi incorporado.

## Encerramento

A Etapa 4 termina com uma distinção verificável: o hardware genérico continua INCOMPLETE, enquanto a variante Blum 71B3550, com proveniência oficial registrada e especificação suficiente, gera cup e fixing READY. Shelf-support permanece incompleto por honestidade técnica. Não foram criados CAM, CNC, G-code, DXF, toolpath, Sistema 32, novas famílias ou UI.

A execução deve parar aqui e aguardar revisão externa.

## References

[1]: https://d2.blum.com/services/BEC003/cliptopbmn_fl_dok_bus_$sen-us_$aof_$v1.pdf "Blum — CLIP top BLUMOTION 110° hinges, technical PDF"
[2]: https://publications.blum.com/2022/catalogue/en/74/ "Blum Catalogue 2022/2023 — CLIP top BLUMOTION standard application"
[3]: https://publications.blum.com/2022/catalogue/en/144/ "Blum Catalogue 2022/2023 — Mounting plates"
[4]: https://publications.blum.com/2022/catalogue/en/146/ "Blum Catalogue 2022/2023 — Cruciform mounting plates 37/32"
