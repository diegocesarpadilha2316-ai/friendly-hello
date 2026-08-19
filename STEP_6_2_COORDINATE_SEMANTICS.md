# Dioris Planner V2 — Etapa 6.2

## Semântica de coordenadas e offsets

### Golden Module: Balcão 2 Portas

> **Objetivo:** impedir que um offset relativo à porta seja interpretado como posição absoluta no módulo ou como coordenada local da peça de usinagem.

## Resultado executivo

A Etapa 6.2 foi implementada como uma correção pequena de contrato. Não houve alteração de geometria, Front Layout, ferragens, posições, fabricação, Joinery ou Machining. A Etapa 6.1 permanece preservada.

A correção separa explicitamente:

```text
DOOR-LOCAL offset
        ≠
MODULE-LOCAL position
        ≠
PART-LOCAL machining coordinate
```

No Golden 900 × 870 × 580 mm, os valores agora possuem semântica não ambígua:

| VALUE | COORDINATE SPACE | MEANING |
|---:|---|---|
| 110 mm | DOOR-LOCAL | hinge edge offset vertical da regra |
| 604 mm | DOOR-LOCAL | offset da dobradiça superior desde a base da porta |
| 153 mm | MODULE-LOCAL | base inferior da porta no módulo |
| 263 mm | MODULE-LOCAL | posição Y da dobradiça inferior no módulo |
| 757 mm | MODULE-LOCAL | posição Y da dobradiça superior no módulo |
| -247 mm | PART-LOCAL | resultado local de `263 - targetPart.positionY` no exemplo validado |

## 1. Problema corrigido

Antes da correção, `ResolvedHardwareApplication.derivedValues.verticalHingeOffsetsMm` recebia `[263, 757]`. Esses valores eram posições Y absolutas no sistema local do módulo, não offsets relativos à porta.

A regra correta é:

```text
doorBottomY = 153 mm

bottom hinge:
offset DOOR-LOCAL = 110 mm
position MODULE-LOCAL = 153 + 110 = 263 mm

upper hinge:
offset DOOR-LOCAL = 714 - 110 = 604 mm
position MODULE-LOCAL = 153 + 604 = 757 mm
```

A geometria não mudou. Somente o contrato passou a expressar corretamente o significado dos dados.

## 2. Contratos corrigidos

### `ResolvedDoorHardwarePlacement`

O placement puro continua contendo:

| Campo | Espaço | Significado |
|---|---|---|
| `verticalOffsetsMm` | DOOR-LOCAL | offsets relativos desde a base da porta |
| `hingePositionsMm` | MODULE-LOCAL | pontos X/Y das dobradiças no módulo |
| `mountingPlatePositionsMm` | MODULE-LOCAL | pontos X/Y das placas no módulo |
| `doorBottomMm` | MODULE-LOCAL | base da porta no módulo |
| `doorHeightMm` | DOOR-LOCAL | altura da porta usada para calcular offsets |

O campo `verticalOffsetsMm` permanece com o mesmo nome porque já era o contrato semântico pretendido. O campo `hingePositionsMm` continua representando pontos MODULE-LOCAL no placement puro.

### `ResolvedDoorInstallation`

A instalação agora expõe:

| Campo | Espaço | Resultado Golden |
|---|---|---:|
| `verticalOffsetsMm` | DOOR-LOCAL | `[110, 604]` |
| `hingePositionsMm` | MODULE-LOCAL, eixo Y | `[263, 757]` |

### `ResolvedHardwareApplication`

`derivedValues` agora contém ambos os conceitos explicitamente:

```ts
verticalHingeOffsetsMm: [[110, 604], [110, 604]]
verticalHingePositionsMm: [[263, 757], [263, 757]]
```

O nome `verticalHingeOffsetsMm` não foi renomeado para evitar uma alteração ampla e desnecessária do contrato; seu comentário e seus testes agora tornam a semântica obrigatória. O novo `verticalHingePositionsMm` representa as posições Y MODULE-LOCAL correspondentes.

## 3. Espaços de coordenadas

### DOOR-LOCAL

É o sistema relativo à própria porta. O zero vertical está na base da porta. O offset de 110 mm não depende da posição global do módulo.

### MODULE-LOCAL

É o sistema local do móvel. O zero vertical está no piso/origem do módulo. A posição da ferragem é obtida por:

```text
moduleY = doorBottomY + doorOffsetY
```

No Golden:

```text
153 + 110 = 263
153 + 604 = 757
```

### PART-LOCAL

É o sistema local da peça que será usinada. A transformação oficial existente foi preservada:

```text
partLocalY = moduleY - targetPart.positionY
```

Para o exemplo validado com `targetPart.positionY = 510 mm`:

```text
263 - 510 = -247 mm
```

Nenhum sistema paralelo de coordenadas foi criado.

## 4. Joinery e Machining

Joinery continua consumindo posições MODULE-LOCAL das PartDefinitions. Nenhuma alteração geométrica foi feita.

Machining continua convertendo a posição da operação para PART-LOCAL por meio da função existente `localCoordinates()`. O teste da Etapa 6.1 foi mantido e agora documenta a distinção:

```text
Joinery positionMm — targetPart.positionMm
        =
Machining coordinates.positionMm
```

Assim, `263 mm` não é comparado diretamente com `-247 mm`; eles estão em espaços diferentes e a conversão entre eles é determinística.

## 5. Três dobradiças

A separação também foi validada quando a altura da porta atinge o threshold atual de 900 mm:

| Hinge | Offset DOOR-LOCAL | Position MODULE-LOCAL |
|---|---:|---:|
| Inferior | 110 mm | 263 mm |
| Central | 450 mm | 603 mm |
| Superior | 790 mm | 943 mm |

A porta tem bottom `153 mm` e height `900 mm`. Os offsets e posições são mantidos em arrays distintos. Não foi criada nova regra industrial.

## 6. Serialização e invariância

Nenhum campo derivado novo foi persistido em `FurnitureInstance`. Os valores continuam sendo resolvidos em runtime.

Os testes de movimento e rotação permanecem aprovados. Como a resolução usa coordenadas locais do módulo, mover ou rotacionar a instância não altera offsets DOOR-LOCAL, posições MODULE-LOCAL ou IDs. A conversão PART-LOCAL continua dependente somente da peça alvo correta.

O ciclo 900 → 1000 → 900 continua retornando os mesmos offsets, posições, hardware PartDefinitions, Joinery e Machining do checkpoint inicial.

## 7. Testes executados

A fixture `goldenHardwarePlacement.test.ts` foi ampliada para falhar caso posições sejam novamente atribuídas ao campo de offsets. Ela valida:

| Verificação | Resultado |
|---|---:|
| Offset DOOR-LOCAL Golden | `[110, 604]` |
| Position MODULE-LOCAL Golden | `[263, 757]` |
| Conversão `153 + 110 = 263` | Aprovada |
| Conversão `153 + 604 = 757` | Aprovada |
| Conversão PART-LOCAL do exemplo | `-247 mm`, aprovada |
| Distinção offset ≠ position | Aprovada |
| Três dobradiças: offsets | `[110, 450, 790]` |
| Três dobradiças: posições | `[263, 603, 943]` |
| Joinery | Posições MODULE-LOCAL preservadas |
| Machining | Coordenadas PART-LOCAL preservadas |
| Movimento e rotação | Aprovados |
| Regressão Etapa 6 | Aprovada |
| Regressão Etapa 6.1 | Aprovada |

## 8. Validação final

| Verificação | Resultado |
|---|---:|
| Vitest completo | **46 arquivos, 569 testes aprovados** |
| Production build | **Aprovado** |
| `tsc --noEmit` | **6 erros, exatamente o baseline** |
| Novos erros TypeScript | **0** |
| Geometria alterada | Não |
| Posições alteradas | Não |
| Ferragens alteradas | Não |
| Fabricação alterada | Não |
| Etapa 7 iniciada | Não |

Os seis erros TypeScript restantes são os mesmos do baseline: um campo `removable` incompatível em `builders.ts` e cinco atribuições `string | null` em `usePlannerStore.ts`.

## Entregáveis

- `STEP_6_2_COORDINATE_SEMANTICS.md`
- `STEP_6_2_COORDINATE_SEMANTICS.zip`

A Etapa 6.2 está concluída e deve parar para revisão. Não iniciar a Etapa 7.
