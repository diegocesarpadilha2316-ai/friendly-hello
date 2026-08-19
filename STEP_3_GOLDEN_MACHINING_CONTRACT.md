# STEP_3_GOLDEN_MACHINING_CONTRACT

## Escopo

A Etapa 3 evolui as operações construtivas rastreáveis da Etapa 2 para um contrato explícito de furação/usinagem local à peça. O escopo termina antes de CAM, G-code, DXF CNC, toolpath, pós-processador, avanço, RPM e CNC.

A cadeia preservada é:

```text
FurnitureInstance
→ ModuleDefinition
→ builder
→ PartDefinition[]
→ Hardware
→ JoineryDefinition
→ MachiningOperation
→ readiness
→ BOM / cut-list / nesting
```

Nenhuma família nova foi criada. Nenhum renderer, UI, Vercel, Cloudflare ou deploy foi alterado.

## 1. Auditoria das operações anteriores

| Operação atual | Origem | Peça | Ferragem | Parâmetros existentes | Classificação | Decisão |
|---|---|---|---|---|---|---|
| `confirmat` | `joineryReport` genérico | peças estruturais | nenhuma | face, posição padrão, diâmetro/profundidade padrão | **GENERIC DEFAULT** | preservada como Joinery/ASSEMBLY; não promovida a usinagem Golden |
| `dowel` | `joineryReport` genérico | peças estruturais | nenhuma | face, posição padrão, diâmetro/profundidade padrão | **GENERIC DEFAULT** | preservada como Joinery/ASSEMBLY; não promovida a usinagem Golden |
| `hinge-cup` | `joineryReport` + dobradiça construída | porta + peça `door:n:hinge:n` | `hinge-soft-close` | face, posição, relação porta/dobradiça | **INCOMPLETE** | convertida em `MachiningOperation` tipo `boring`; sem hardcode industrial |
| `hinge-fixing` | `joineryReport` + dobradiça construída | lateral correspondente + porta | `hinge-soft-close` | face, posição, relação porta/dobradiça | **INCOMPLETE** | convertida em `MachiningOperation` tipo `drilling`; lateral esquerda/direita derivada da porta |
| `shelf-support` | `joineryReport` + builder | lateral + prateleira + suporte | `shelf-support` | posição e relação ao suporte/prateleira | **INCOMPLETE** | convertido em furação local somente com parâmetros faltantes explícitos |
| `gola-profile` | builder + `joineryReport` | porta + perfil | `handle-gola` | dimensões do perfil, lip/recess quando existentes | **VALID ASSEMBLY** | classificada como montagem; não assumida como rasgo/cava |
| `adjustable-foot` | builder + `joineryReport` | pé + rodapé | `leg-adjustable` | posição do pé e relação ao rodapé | **VALID PURCHASED HARDWARE** | montagem/ferragem comprada; sem CNC inventado |
| `toe-kick-clip` | builder + `joineryReport` | clip + pé + rodapé | `toe-kick-clip` | relações dos componentes | **VALID PURCHASED HARDWARE** | montagem de ferragem; sem furação inventada |
| `toe-kick-profile` | builder + `joineryReport` | perfil/rodapé | `toe-kick-profile` | largura e dimensões do perfil | **VALID PROFILE** | componente de perfil; não é usinagem por si só |

A conclusão importante é que o catálogo atual reconhece ferragens e dimensões visuais, mas não possui parâmetros industriais suficientes para declarar uma dobradiça pronta para fabricação: não há diâmetro de copo como regra de usinagem, profundidade de copo, offset da borda, padrão de fixação ou diâmetro de parafuso. Por isso o resultado correto é **`INCOMPLETE`**, não uma operação falsa com valores plausíveis.

O Balcão 2 Portas atual também não possui evidência de carreira paramétrica equivalente ao Sistema 32. Seus quatro suportes de prateleira são posicionados pelo builder em quatro pontos derivados da prateleira, mas não há pitch, origem, edge offset, início/fim ou keep-out parametrizados. O resultado é **`NOT REQUIRED`** nesta etapa, e nenhum Sistema 32 foi implementado.

## 2. Contrato MachiningOperation

Foi criado `library/contracts/MachiningOperation.ts` como o menor contrato independente necessário. Ele reutiliza `JoineryFace` e os IDs da Etapa 2, e representa uma operação sobre uma `PartDefinition` sem representar toolpath.

| Campo | Função |
|---|---|
| `id` | identidade determinística da operação |
| `type` | `drilling`, `boring`, `countersink`, `groove` ou `profile` |
| `instanceId` | FurnitureInstance responsável |
| `partId` | peça-alvo da operação |
| `hardwareId` | ferragem quando aplicável |
| `sourceJoineryId` | origem rastreável em JoineryDefinition |
| `relatedPartIds` | porta, ferragem, lateral, prateleira ou componente relacionado |
| `coordinates` | sistema local da peça, origem, face e posição XYZ |
| dimensões opcionais | diâmetro, profundidade, largura, comprimento e ângulo quando conhecidos |
| `toolHint` | sugestão neutra somente quando segura; não é ferramenta CAM |
| `parameters` | parâmetros estruturados e valores conhecidos/nulos |
| `readiness` | `READY`, `INCOMPLETE` ou `NOT_REQUIRED` |
| `missingParameters` | lista objetiva do que impede declarar fabricação pronta |

A função `evaluateMachiningReadiness` converte a operação em diagnóstico estruturado. Para a dobradiça, por exemplo, o relatório retorna `INCOMPLETE` com `cupDiameterMm`, `cupDepthMm` e `edgeOffsetMm` ausentes no copo, e `fixingPattern`, `screwDiameterMm` e `edgeOffsetMm` ausentes na fixação.

## 3. Coordenadas locais e portabilidade

Cada operação usa:

```text
coordinateSpace = part-local
origin = part-center(partId)
face = JoineryFace existente
positionMm = posição relativa ao centro da peça-alvo
```

O serviço não lê `FurnitureInstance.positionMm` nem `rotationDeg` para calcular a fabricação. Ele usa as posições dos `PartDefinition` dentro do módulo. Assim, mover o móvel na sala ou rotacionar sua instância não altera as coordenadas locais, os IDs ou as relações industriais.

A porta esquerda associa a fixação à lateral `side-left`; a porta direita associa à lateral `side-right`, usando o `interactive.hingeSide` existente no builder. O copo continua pertencendo à porta, enquanto a placa/fixação é ligada à lateral correspondente e mantém a porta e a dobradiça em `relatedPartIds`.

## 4. Gola, pés, clips e rodapé

A Gola é classificada como **`ASSEMBLY`**. O estado atual contém uma ferragem/perfil `handle-gola` e uma geometria `gola`, mas não contém evidência de rasgo ou cava necessária para promover o item a usinagem. A Etapa 3 não inventa essa exigência.

Os pés reguláveis são **`PURCHASED_HARDWARE`**. Os clips de rodapé também são **`PURCHASED_HARDWARE`**. O perfil/rodapé é **`PROFILE`**. Todos permanecem relacionados aos componentes existentes no builder e não geram operações CNC desnecessárias.

Os suportes de prateleira têm operações de furação locais associadas à lateral e à prateleira, mas ficam **`INCOMPLETE`** porque o catálogo não informa diâmetro, profundidade, offset ou pitch de furação. Nenhum Sistema 32 foi inferido.

## 5. Fixture de aceitação

Foi criado `pkg/state/goldenMachiningContract.test.ts` com cinco testes, incluindo:

| Verificação | Resultado |
|---|---|
| Operações genéricas confirmat/dowel não promovidas a usinagem | PASS |
| Quatro copos e quatro fixações para as duas portas | PASS |
| Relação porta → dobradiça → lateral correta | PASS |
| Coordenadas locais e origem na peça-alvo | PASS |
| Shelf-support relacionado a lateral/prateleira | PASS |
| Readiness com parâmetros faltantes explícitos | PASS |
| Gola como assembly | PASS |
| Pés, clips e rodapé classificados sem CNC inventado | PASS |
| Movimento da cena invariável | PASS |
| Rotação da cena invariável | PASS |
| Material body/front sem recriação aleatória | PASS |
| `900 → 1000 → 900` | PASS |
| IDs de usinagem determinísticos | PASS |
| Coordenadas mudam quando a largura muda e retornam ao snapshot original | PASS |
| Sistema 32 | NOT REQUIRED |

## 6. Typecheck baseline

A Etapa 2 registrava oito erros TypeScript no relatório anterior. Antes de editar a Etapa 3 foi executado um novo baseline objetivo no mesmo checkout, e o compilador apresentou **9 diagnósticos**: um em `builders.ts`, três em `HardwareRegistry.ts` e cinco em `usePlannerStore.ts`. A diferença em relação ao número textual do relatório anterior foi documentada, não ocultada.

| Medição | Resultado |
|---|---:|
| Baseline fresh antes da Etapa 3 | 9 erros |
| Depois da Etapa 3 | 9 erros |
| Erros nos arquivos novos/modificados da Etapa 3 | 0 |
| Novos erros introduzidos | 0 |
| Delta | 0 |

Os nove diagnósticos são os mesmos do baseline: propriedades de geometria de perfil não contempladas pelo contrato, categorias/acabamento do catálogo incompatíveis e cinco valores `string | null` no caminho antigo de `usePlannerStore`. Eles não foram refatorados porque estão fora do objetivo único desta etapa.

## 7. Regressão, testes e build

A suíte completa terminou com **42 arquivos e 548 testes aprovados**. O build de produção terminou com **exit 0**; o pipeline encontrou 258 chunks SSR e concluiu o patch Nitro. Nenhum deploy foi executado.

A Etapa 2 continua coberta: a fixture anterior permanece PASS, e os relatórios de BOM, cut-list, nesting, persistência, renderer e caminho de atualização pela IA continuam cobertos pela suíte existente.

## 8. Proveniência open source

A referência conceitual principal foi `dprojects/Woodworking`, usada para orientar a separação entre peça, ferragem, regra de montagem, face local e operação de furação. `WoodworkingShop` foi mantido como referência secundária de separação entre domínio de fabricação e UI.

A implementação é Dioris. Nenhum código, asset, dependência ou workbench do FreeCAD foi incorporado. A ideia adaptada foi a modelagem explícita de operações por peça/face e a distinção entre operação de montagem e usinagem; o contrato, o adapter e os testes são próprios do Dioris.

## 9. Tabela final de aceite

| Item | Resultado | Evidência |
|---|---|---|
| MachiningOperation | **PASS** | `contracts/MachiningOperation.ts` |
| AssemblyRule formal separado | **PARTIAL** | relação está expressa em classification/sourceJoinery; contrato nominal separado não foi necessário |
| Part local coordinates | **PASS** | `coordinates.coordinateSpace = part-local` e testes de movimento/rotação |
| Hinge cup | **PARTIAL** | operação ligada à porta/dobradiça, mas readiness INCOMPLETE por dados de catálogo ausentes |
| Hinge fixing | **PARTIAL** | lateral correta e relação rastreável, mas readiness INCOMPLETE |
| Shelf support | **PARTIAL** | relação e posição local; parâmetros de furação ausentes |
| Gola classification | **PASS** | `ASSEMBLY` |
| Feet classification | **PASS** | `PURCHASED_HARDWARE` |
| Toe-kick classification | **PASS** | clip `PURCHASED_HARDWARE`, perfil `PROFILE` |
| Machining readiness | **PASS** | `READY/INCOMPLETE/NOT_REQUIRED` estruturado; Golden atual explicitamente INCOMPLETE onde falta catálogo |
| System 32 | **NOT REQUIRED** | nenhum padrão paramétrico comprovado no Golden |
| 900 → 1000 | **PASS** | IDs estáveis; coordenadas recalculadas pela regra |
| 1000 → 900 | **PASS** | snapshot retorna ao original |
| Move invariance | **PASS** | posição global não afeta operação local |
| Rotation invariance | **PASS** | rotação global não afeta operação local |
| Stable machining IDs | **PASS** | IDs derivados de JoineryDefinition/instância/peça |
| BOM regression | **PASS** | suíte Etapa 2 e fixture Golden |
| Cut-list regression | **PASS** | suíte Etapa 2 e fixture Golden |
| Nesting regression | **PASS** | suíte Etapa 2 e fixture Golden |
| Persistence regression | **PASS** | suíte existente |
| Golden Etapa 2 regression | **PASS** | 548 testes totais aprovados |
| Typecheck new errors = 0 | **PASS** | baseline 9 → after 9 |
| Tests | **PASS** | 42 arquivos, 548 testes |
| Production build | **PASS** | `pnpm run build` exit 0 |
| Deploy | **NOT TESTED** | fora do escopo |
| CAM/CNC/G-code | **NOT REQUIRED** | explicitamente proibidos nesta etapa |

## Encerramento

A Etapa 3 foi encerrada sem afirmar uma capacidade industrial inexistente. O Dioris agora consegue responder, para cada operação Golden representada: qual instância, qual peça, qual ferragem, qual face, qual posição local, qual tipo de operação e quais parâmetros estão disponíveis. Quando os dados não bastam para fabricar, o resultado é explicitamente `INCOMPLETE`, com os campos faltantes.

Não foram iniciados gaveteiros, torres, aéreos, expansão de família, CNC, G-code, render, UI, Vercel ou deploy. A execução deve parar aqui para revisão externa.
