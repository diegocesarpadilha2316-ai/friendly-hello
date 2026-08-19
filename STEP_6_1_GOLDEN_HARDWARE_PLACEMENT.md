# Dioris Planner V2 — Etapa 6.1

## Single Source of Truth para posicionamento de ferragens

### Golden Module: Balcão 2 Portas

> **Escopo:** sincronizar Front Layout, Assembly/Application Rule, builder visual, PartDefinitions, Joinery e Machining para que todas as posições de dobradiças e placas sejam derivadas de uma única resolução pura.

## Resultado executivo

A Etapa 6.1 foi concluída sem iniciar a Etapa 7, CAM, CNC, G-code, render ou expansão de famílias. A matemática frontal aprovada na Etapa 6 foi preservada integralmente.

No Golden `kitchen-base-2-doors` de 900 × 870 × 580 mm, a aplicação agora deriva, por uma única cadeia:

```text
FrontLayout + HardwareApplicationRule
        ↓
resolveDoorHardwarePlacement()
        ↓
visual hardware PartDefinitions
        ↓
Joinery
        ↓
Machining local coordinates
```

Os pontos resolvidos são:

| Porta | Hinge side | Hinge X | Hinge Y | Plate X | Plate Y |
|---|---|---:|---|---:|---|
| Door 1 | left | -413 mm | 263 / 757 mm | -413 mm | 263 / 757 mm |
| Door 2 | right | +413 mm | 263 / 757 mm | +413 mm | 263 / 757 mm |

A diferença anterior entre o hardware visual `260 / 754 mm` e o resolver `263 / 757 mm` foi eliminada. O `bottomRevealMm = 3 mm` agora participa corretamente do ponto de referência inferior da porta: `toeKick 150 + bottomReveal 3 = door bottom 153 mm`; com `verticalEdgeOffsetMm = 110`, os pontos são `153 + 110 = 263` e `153 + 714 - 110 = 757`.

## 1. Auditoria de duplicidades

A auditoria formal está registrada em `evidence/etapa6-1-hardware-placement-audit.md`. Os duplicados relevantes foram:

| Duplicidade | Local anterior | Decisão |
|---|---|---|
| `35 mm` para offset horizontal | `buildDoors()` calculava `doorEdge ± 35` | Removido do caminho Golden; agora vem de `hingeEdgeOffsetMm` |
| `110 mm` para offset vertical | `toe + 110` e `toe + doorHeight - 110` | Removido do caminho Golden; agora vem de `verticalEdgeOffsetMm` |
| threshold `900 mm` | `doorHeight >= 900 ? 3 : 2` no builder | Removido do caminho Golden; agora vem de `threeHingeThresholdDoorHeightMm` |
| IDs de Joinery por índice local | `hinge-1` de portas diferentes colidia | Prefixo semântico da porta adicionado ao ID de Joinery |

O valor `35 mm` de Manufacturer Spec, quando usado como diâmetro de copo/furação, não foi removido. Ele é tecnicamente diferente do `hingeEdgeOffsetMm = 35 mm` da regra de aplicação. O threshold de `900 mm` também permanece, pois é uma regra de contagem e não uma largura de gabinete.

## 2. Placement Resolver puro

Foi criado `HardwarePlacement.ts` com os contratos `DoorHardwarePlacementInput`, `ResolvedDoorHardwarePlacement`, `HardwarePlacementConsistency` e `HardwarePlacementConsistencyIssue`.

Foi criado `hardwarePlacementResolver.ts` com duas funções puras:

| Função | Responsabilidade |
|---|---|
| `resolveDoorHardwarePlacement()` | Derivar hinge side, hinge count, offsets verticais, hinge X, pontos de dobradiça, pontos de placas e IDs lógicos a partir de `ResolvedFrontLayout` + `FurnitureAssemblyRule` |
| `validateDoorHardwarePlacementParts()` | Comparar posições esperadas com `PartDefinition.positionMm` em X/Y, usando tolerância explícita de `0,001 mm` |

O resolver não lê `FurnitureInstance`, não chama builder e não depende de estado. Isso evita o ciclo `builder → instance → resolver → builder`. O `resolveGoldenHardwareApplication(instance)` usa o mesmo placement puro para validar as peças já produzidas, mas não é usado pelo builder.

## 3. Fórmulas centralizadas

Para cada porta, o ponto horizontal é derivado da borda frontal resolvida:

```text
hingeX(left)  = doorEdge.left  + hingeEdgeOffsetMm
hingeX(right) = doorEdge.right - hingeEdgeOffsetMm
```

Com a regra atual, `hingeEdgeOffsetMm = 35 mm`. Para a posição vertical:

```text
doorBottom = toeKickMm + bottomRevealMm
hingeY[0]   = doorBottom + verticalEdgeOffsetMm
hingeY[last] = doorBottom + doorHeightMm - verticalEdgeOffsetMm
```

Quando `doorHeightMm >= threeHingeThresholdDoorHeightMm`, a mesma função gera três dobradiças:

```text
[verticalEdgeOffsetMm, doorHeightMm / 2, doorHeightMm - verticalEdgeOffsetMm]
```

Não foi criada uma nova regra industrial para três dobradiças. O threshold existente na `HardwareApplicationRule` é a única fonte.

## 4. Builder visual

`buildDoors()` agora chama `resolveDoorHardwarePlacement()` somente quando está construindo o Golden com o Front Layout resolvido. Ele usa o resultado para criar dobradiças e placas com os mesmos X/Y. Os demais módulos não foram refatorados nesta etapa.

A porta visual, o hardware, o hinge side e o pivot continuam sendo PartDefinitions locais. A correção não altera a matemática aprovada da frente:

| Campo do Golden 900 | Resultado preservado |
|---|---:|
| Porta 1 | 447 mm |
| Porta 2 | 447 mm |
| Reveal esquerdo | 2 mm |
| Gap central | 2 mm |
| Reveal direito | 2 mm |
| Centers | -224,5 / +224,5 mm |
| Altura da frente | 714 mm |

## 5. Joinery e Machining

O Joinery continua herdando a posição da PartDefinition de hardware, mas agora essa PartDefinition nasce do placement puro. A equivalência foi validada explicitamente:

```text
ResolvedHardwarePlacement
  == hardware PartDefinition X/Y
  == Joinery positionMm
  == Machining source positionMm
```

Para Machining, a coordenada é local à peça alvo. Portanto, o teste não compara incorretamente `263 mm` com o eixo local; ele valida:

```text
coordinates.positionMm.x = sourceJoinery.positionMm.x - targetPart.positionMm.x
coordinates.positionMm.y = sourceJoinery.positionMm.y - targetPart.positionMm.y
```

A operação continua marcada como `part-local`, com origem no centro da peça alvo. Isso preserva a cadeia local do Dioris sem inserir um offset adicional.

Durante a validação foi identificado e corrigido um problema real de rastreabilidade: IDs como `hinge-1:cup` colidiam entre a porta 1 e a porta 2. O Joinery passou a gerar IDs incluindo a porta semântica, por exemplo `door-1:hinge-1:cup` e `door-2:hinge-1:cup`. Isso mantém a associação correta entre hardware, Joinery e Machining.

## 6. Mounting plate

As placas de montagem são produzidas pelo mesmo `ResolvedDoorHardwarePlacement` das dobradiças. Elas recebem os mesmos pontos X/Y lógicos da dobradiça correspondente, preservando a seleção industrial:

```text
Blum 71B3550
↔
Blum 173H7100
```

A separação entre `holeSpacingMm = 32 mm` e `plateSystemDistanceMm = 0` permanece intacta. O `selectedBoringDistanceMm` continua `undefined` quando a regra não possui seleção suficiente; esta etapa sincroniza posicionamento e não força `machining READY`.

## 7. Testes executados

Foi criada `goldenHardwarePlacement.test.ts` cobrindo placement puro, validação de divergência, integração com builder/PartDefinitions/Joinery/Machining, threshold de três dobradiças, ciclo de dimensões e estabilidade dos componentes.

| Verificação | Resultado |
|---|---:|
| Golden 900: X/Y de dobradiças | Aprovado: `-413/+413`, `263/757` |
| Golden 900: placas | Aprovado: pontos iguais às dobradiças |
| Validator com tolerância `0,001 mm` | Aprovado |
| Divergência artificial de `0,01 mm` | Detectada |
| Threshold de três dobradiças | Aprovado em porta de 900 mm |
| Contagem 2 → 3 | Aprovado pela regra central |
| Larguras 600/800/900/1000/1200 | Aprovado |
| Cycle 900 → 1000 → 900 | Aprovado para PartDefinitions |
| Joinery: hinge cup + plate placement | Aprovado: 8 operações |
| Machining de hardware | Aprovado: 12 operações com origem Joinery coerente |
| Front Layout da Etapa 6 | Preservado |
| BOM, cut-list e nesting | Regressões aprovadas |

## 8. Validação final do repositório

| Verificação | Resultado |
|---|---:|
| Vitest completo | **46 arquivos, 568 testes aprovados** |
| Build de produção | **Aprovado** |
| `tsc --noEmit` | **6 erros, exatamente o baseline** |
| Erros TypeScript novos da Etapa 6.1 | **0** |
| Etapa 7 iniciada | Não |
| CAM/CNC/G-code iniciado | Não |

Os seis erros TypeScript restantes são os mesmos do baseline: um campo `removable` incompatível em `builders.ts` e cinco atribuições `string | null` em `usePlannerStore.ts`. A Etapa 6.1 não introduziu erros TypeScript novos.

## Entregáveis

- `STEP_6_1_GOLDEN_HARDWARE_PLACEMENT.md`
- `evidence/etapa6-1-hardware-placement-audit.md`
- `src/modules/planner-v2/library/contracts/HardwarePlacement.ts`
- `src/modules/planner-v2/library/services/hardwarePlacementResolver.ts`
- `src/modules/planner-v2/pkg/state/goldenHardwarePlacement.test.ts`
- `STEP_6_1_GOLDEN_HARDWARE_PLACEMENT.zip`

A Etapa 6.1 está concluída e deve parar para revisão. Não avançar para a Etapa 7.
