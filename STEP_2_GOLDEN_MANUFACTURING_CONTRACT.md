# STEP_2_GOLDEN_MANUFACTURING_CONTRACT

## Escopo executado

Foi implementada somente a Etapa 2 do contrato de fabricação do Golden Module `kitchen-base-2-doors` — Balcão 2 Portas. A arquitetura existente foi preservada:

```text
FurnitureInstance
→ ModuleDefinition
→ builder
→ PartDefinition[]
→ renderer
→ fabricationReport
→ joineryReport
→ nestingPlan
→ persistência
```

Não houve troca de renderer, nesting, IA, persistência, Cloudflare, Vercel, CAM, CNC, catálogo completo, nova família ou alteração de render/realismo.

## ANTES

Os overrides de material e ferragem já funcionavam por meio de `Record<string, string>`, porém os nomes de slots não tinham um contrato central. O builder do Golden já criava portas, dobradiças, Gola, pés reguláveis, perfil de rodapé, clips e suportes de prateleira como `PartDefinition`, mas o `JoineryDefinition` representava principalmente operações genéricas e não carregava parâmetros estruturados nem relações explícitas entre peça, ferragem e operação.

O ciclo dimensional já reconstruía as peças e os relatórios, mas não existia uma fixture única que verificasse na mesma instância a cadeia completa `900 → 1000 → 900`, incluindo slots semânticos, operações, BOM, cut-list, nesting, IDs estáveis e round-trip de persistência.

## DEPOIS

### 1. Slots semânticos

Foi criado `library/contracts/FurnitureSlot.ts` com o vocabulário central:

| Grupo | Slots |
|---|---|
| Materiais do Golden | `body`, `front`, `door`, `back`, `shelf`, `edge`, `countertop` |
| Ferragens do Golden | `handle`, `hinge`, `toe-kick` |
| Slots compatíveis já existentes | `drawer`, `drawer-front`, `slide` |

`validateFurnitureSlotMap` valida slots conhecidos, registra valores vazios como inválidos e preserva chaves desconhecidas como legado com diagnóstico. `Record<string,string>` não foi removido, portanto projetos salvos e famílias existentes continuam compatíveis.

A construção do módulo chama essa validação por meio de `buildModule`, sem rejeitar slots legados seguros. O Balcão foi testado com `body = mdf-white`, `front = mdf-freijo`, `door = mdf-freijo`, `handle = handle-gola` e `hinge = hinge-soft-close`.

### 2. Operações construtivas rastreáveis

O contrato existente `JoineryDefinition` foi estendido, sem criar uma arquitetura paralela, com tipos do Golden:

| Tipo | Origem real no builder | Resultado |
|---|---|---|
| `hinge-cup` | peças de dobradiça existentes em cada porta | operação por dobradiça/porta |
| `hinge-fixing` | mesmas peças de dobradiça | operação por dobradiça/porta |
| `gola-profile` | peça de hardware `handle-gola` | operação por porta e perfil |
| `adjustable-foot` | peças `leg-adjustable` | operação por pé, relacionada ao rodapé |
| `toe-kick-profile` | peça `toe-kick-profile` | operação do perfil/rodapé |
| `toe-kick-clip` | peças `toe-kick-clip` | operação relacionada ao clip, pé e rodapé |
| `shelf-support` | peças `shelf-support` ligadas à prateleira | operação por suporte/prateleira |

Cada operação nova possui `moduleInstanceId`, `partId`, `hardwareId` quando aplicável, `relatedPartIds`, parâmetros estruturados e ID determinístico derivado da mesma instância/peça/ferragem. Não foram inventados minifix ou cavilhas novas: as operações genéricas já existentes no `joineryReport` foram preservadas; as operações adicionais são somente as derivadas de peças reais do Golden.

O perfil Gola é agora semântico no contrato e não apenas uma geometria visual. As operações de dobradiça usam as peças de dobradiça que o builder já cria, respeitando o lado da porta, posição e clearance disponível. Especificações industriais ausentes não foram inventadas.

### 3. Golden Acceptance Fixture

Foi criado `pkg/state/goldenManufacturingContract.test.ts`. A fixture executa a mesma instância lógica em:

```text
900 × 870 × 580
        ↓
1000 × 870 × 580
        ↓
900 × 870 × 580
```

Ela verifica slots, separação body/front, reconstrução de peças, IDs de peças, IDs de ferragens, IDs de operações, parâmetros, BOM, cut-list, grain, edge banding, `validateNestingIntegrity`, persistência V4 e estado final determinístico.

A fixture também confirma que o renderer continua sendo uma projeção dos `parts` da mesma `FurnitureInstance` usada pela fabricação; nenhum modelo visual independente foi criado.

## Arquivos alterados nesta Etapa 2

| Arquivo | Alteração |
|---|---|
| `src/modules/planner-v2/library/contracts/FurnitureSlot.ts` | novo contrato central e validators compatíveis |
| `src/modules/planner-v2/library/index.ts` | export do contrato de slots |
| `src/modules/planner-v2/library/services/buildModule.ts` | validação/adaptação de slots com preservação de legado |
| `src/modules/planner-v2/library/contracts/JoineryDefinition.ts` | tipos Golden, relações e parâmetros estruturados |
| `src/modules/planner-v2/library/services/joineryReport.ts` | operações Golden derivadas das peças/hardware existentes |
| `src/modules/planner-v2/pkg/state/goldenManufacturingContract.test.ts` | fixture determinística e asserts de aceitação |
| `STEP_2_GOLDEN_MANUFACTURING_CONTRACT.md` | este relatório |

Nenhuma dependência dos três benchmarks open source foi adicionada. Nenhum asset, textura, screenshot ou código externo foi copiado.

## Compatibilidade preservada

`FurnitureInstance`, `ModuleDefinition` e `PartDefinition` não foram substituídos. O formato de persistência V4 não foi alterado. `Record<string,string>` continua sendo aceito. Famílias que não são `kitchen-base-2-doors` continuam usando o comportamento existente do `joineryReport`; as operações adicionais ficam limitadas ao Golden Module.

## Validação

| Item | Resultado | Evidência |
|---|---|---|
| `FurnitureInstance` preservado | **PASS** | `goldenManufacturingContract.test.ts`; mesma instância em todo o ciclo |
| `ModuleDefinition` preservado | **PASS** | `buildModule` continua resolvendo `kitchen-base-2-doors` pelo registry |
| `PartDefinition` preservado | **PASS** | peças existentes são a origem das operações |
| Renderer preservado | **PASS** | nenhum arquivo de renderer alterado; teste confirma identidade de `parts` |
| Persistência preservada | **PASS** | serialize → parse V4 no novo teste; nenhum schema alterado |
| Slots semânticos | **PASS** | contrato `FurnitureSlot.ts` e validator |
| body/front distintos | **PASS** | body branco e portas/front Freijó verificados |
| Operações rastreáveis | **PASS** | IDs, `moduleInstanceId`, `partId`, `hardwareId`, relações e parâmetros |
| Dobradiças | **PASS** | cup/fixing por peça de dobradiça real |
| Gola | **PASS** | `gola-profile` semântico e associado ao handle/porta |
| Pés | **PASS** | `adjustable-foot` por peça `leg-adjustable` |
| Clips | **PASS** | `toe-kick-clip` ligado ao clip, pé e rodapé |
| Rodapé | **PASS** | `toe-kick-profile` derivado da peça existente |
| Prateleira/suportes | **PASS** | `shelf-support` associado à prateleira e hardware |
| 900 → 1000 | **PASS** | mesma instância, rebuild, materiais e IDs lógicos preservados |
| 1000 → 900 | **PASS** | snapshot final igual ao checkpoint inicial |
| IDs de peças estáveis | **PASS** | `partIds` do Golden permanecem iguais |
| IDs de ferragens estáveis | **PASS** | hardware IDs e BOM lógico permanecem iguais |
| IDs de operações estáveis | **PASS** | operation IDs do Golden permanecem iguais |
| BOM | **PASS** | dobradiças, Gola, pés, perfil, clips e suportes sem duplicação após rebuild |
| Cut-list | **PASS** | part IDs, material, espessura, dimensões, grain e edge banding |
| Nesting | **PASS** | plano recalcula em 1000; volta ao estado inicial em 900 |
| Nesting integrity | **PASS** | missing, duplicates e unknown vazios |
| Determinismo | **PASS** | checkpoint C igual ao checkpoint A |
| Testes completos | **PASS** | 41 arquivos, 543 testes aprovados |
| Build de produção | **PASS** | `pnpm run build` concluído; 258 chunks SSR descobertos e patch Nitro concluído |
| Typecheck isolado | **PARTIAL** | a nova fixture não adiciona erros; permanecem 8 erros preexistentes em `builders.ts`, `HardwareRegistry.ts` e `usePlannerStore.ts`, fora do escopo desta Etapa 2 |
| Deploy | **NOT TESTED** | a missão explicitamente não exige deploy nesta etapa |
| CAM/CNC | **NOT TESTED** | fora do escopo explícito |

## Erros preexistentes de typecheck

O `tsc --noEmit` ainda reporta erros anteriores à Etapa 2: propriedades extras no `hardwareGeometry` do rodapé, categorias/acabamento incompatíveis em `HardwareRegistry.ts` e valores `string | null` em um preset de `usePlannerStore.ts`. Esses pontos não foram alterados porque a missão determina parar se o trabalho sair do contrato Golden; corrigir esses arquivos seria uma expansão não necessária para provar a cadeia solicitada. A suíte Vitest e o build de produção passam.

## Proveniência dos benchmarks

WoodworkingShop foi usado como referência conceitual para engine/domínio e fabricação; Panelizer para painel, relações geométricas e nesting; dprojects/Woodworking para operações de marcenaria. Nenhum repositório foi adicionado como dependência e nenhuma implementação externa foi copiada.

## Encerramento

A Etapa 2 está concluída dentro do escopo: `PARAMETERS → RULES → PARTS → HARDWARE → OPERATIONS → BOM → CUT-LIST → NESTING` foi verificada na mesma instância lógica em `900 → 1000 → 900`, sem criar uma segunda fonte de verdade. A execução deve parar aqui para revisão externa. Não foram iniciados gaveteiros, torres, aéreos, outra família, render, CNC ou CAM.
