# STEP 8 — Golden Upper 2 Doors Pilot

## Relatório de bloqueio do baseline

**Status:** **BLOCKED — não concluída**  
**Definição canônica autorizada:** `kitchen-golden-upper-800`  
**Definição concorrente preservada:** `kitchen-upper-2-doors` — technical debt / canonicalization pending

## 1. Motivo da parada

A decisão externa autorizou `kitchen-golden-upper-800` como o ID canônico do piloto e determinou que o baseline físico real fosse executado antes de qualquer alteração. A execução real pelo caminho de build produziu uma discrepância em relação ao checkpoint histórico fornecido.

A missão determina explicitamente que, se a saída atual for diferente do checkpoint esperado, o trabalho deve parar e registrar `EXPECTED HISTORICAL` versus `CURRENT REAL OUTPUT`, sem atualizar silenciosamente os valores.

## 2. Execução realizada

O baseline foi executado por:

> `buildModule({ moduleId: "kitchen-golden-upper-800", instanceId: "step8-upper-baseline-instance-001", dimensionsMm: { width: 800, height: 700, depth: 350 } })`

O teste utilizou o builder profissional real, o `ModuleRegistry`, o `MaterialRegistry`, as regras de material/espessura existentes e capturou todas as `PartDefinitions` em `evidence/step8-validation/01-baseline.json`.

Resultado estrutural: `ok = true`, dimensões externas 800 × 700 × 350 mm, `warningCount = 0`, `physicalPartCount = 10` e `hardwarePartCount = 22`.

## 3. Comparação histórica versus saída atual

| Campo | Expected historical | Current real output | Resultado |
|---|---:|---:|---|
| Dimensões externas | 800 × 700 × 350 mm | 800 × 700 × 350 mm | PASS |
| `partCount` total | 14 | 32 | **MISMATCH** |
| `physicalPartCount` | 10 | 10 | PASS |
| `hardwarePartCount` | 4 | 22 | **MISMATCH** |
| warnings | 0 | 0 | PASS |
| laterais | 2 | 2 | PASS |
| base/topo/fundo | 1 / 1 / 1 | 1 / 1 / 1 | PASS |
| prateleiras | 3 | 3 | PASS |
| portas | 2 | 2 | PASS |
| shelf dimensions | aproximadamente 762 × 18 × 330 mm | 762 × 18 × 330 mm | PASS |
| porta dimensions | aproximadamente 396 × 696 × 18 mm | 396 × 696 × 18 mm | PASS |

A discrepância está concentrada na contagem de hardware. A saída atual inclui os 12 suportes físicos das três prateleiras, além de quatro componentes de ferragem por porta: duas dobradiças, duas placas de montagem e um puxador, totalizando 22 peças de hardware. O checkpoint histórico informa apenas 4 peças de hardware, portanto os dois estados não podem ser tratados como equivalentes sem uma decisão sobre a semântica de contagem.

## 4. Fórmulas reais observadas

A factory `upper()` atual fornece `toeKickMm = 0` e define `shelves` a partir da configuração. O `buildCarcass()` legado usa painel de 18 mm, fundo de 6 mm, largura interna `W − 2 × panel`, altura interna `H − 2 × panel` quando o toe kick é zero, e distribui prateleiras por:

```text
ratio = (index + 1) / (shelves + 1)
shelfY = toeKick + panel + innerHeight × ratio
```

Para 800 × 700 × 350 mm, isso produz:

```text
innerWidth = 800 − 2 × 18 = 764 mm
innerHeight = 700 − 2 × 18 = 664 mm
shelfWidth = 764 − 2 = 762 mm
shelfDepth = max(18, 350 − 20) = 330 mm
```

As duas portas atuais usam `doorGapMm = 2`, altura `700 − 2 × 2 = 696 mm`, largura `396 mm`, centros X `−200` e `198`, e pivôs X `−398` e `396`. Esses valores coincidem com o checkpoint histórico.

## 5. Arquivos de evidência

| Arquivo | Conteúdo |
|---|---|
| `evidence/step8-canonical-decision.md` | Decisão externa do ID canônico e preservação do concorrente |
| `evidence/step8-upper-baseline-audit.md` | Auditoria inicial da definição e classificação da ambiguidade resolvida |
| `evidence/step8-validation/01-baseline.json` | Saída completa real com todas as PartDefinitions |
| `src/modules/planner-v2/pkg/state/step8UpperPilot.test.ts` | Teste executável que captura o baseline pelo build real |

## 6. O que não foi alterado

Nenhum arquivo de produção foi alterado durante esta auditoria. Não foram extraídas regras, não foram alterados carcass, Front Layout, hardware, Coordinate Semantics, Joinery, Machining, BOM, cut-list, fabricação ou nesting. O módulo Golden base `kitchen-base-2-doors` permaneceu intacto. A definição concorrente `kitchen-upper-2-doors` também permaneceu intacta.

## 7. Decisão necessária antes de continuar

A Step 8 deve permanecer parada até que a auditoria externa esclareça o significado do checkpoint histórico de `hardwarePartCount = 4` frente às 22 `PartDefinitions` de hardware produzidas pelo estado atual. As alternativas precisam ser explicitamente decididas:

1. confirmar que o checkpoint histórico contava somente um subconjunto de ferragens e autorizar a continuidade com a contagem física atual; ou
2. indicar que a saída atual contém hardware indevido e fornecer a regra correta de contagem/escopo.

Não é permitido remover os 18 componentes excedentes, atualizar o checkpoint ou alterar o builder silenciosamente para fazer a suíte passar.

## Conclusão

A Step 8 está **BLOCKED**, não concluída. A auditoria encontrou uma divergência real e documentada antes de qualquer alteração de produção. O trabalho deve parar neste ponto, conforme a regra da missão, até a decisão externa sobre a contagem semântica de hardware.
