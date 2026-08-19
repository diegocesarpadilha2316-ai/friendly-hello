# Dioris Planner V2 — Stage 12.1
## Professional Joinery / Machining Truth — Closure Report

**Status final: PASS**  
**Escopo encerrado:** somente Stage 12.1. Nenhuma Stage 13, nova família industrial ou CAM/CNC foi iniciada.

## 1. Objetivo e boundary profissional

A Stage 12.1 corrige a fronteira entre dados profissionais de fabricação e o caminho legado. Operações profissionais agora são despachadas declarativamente pelo `ConstructionProfileRegistry`; o caminho LEGACY permanece disponível somente por meio do adaptador `legacyBuildJoineryOperations`, sem injetar defaults de confirmat, dowel ou geometria genérica em módulos profissionais.

> Dados industriais desconhecidos são representados como `INCOMPLETE` com `unknownParameters` explícitos. O valor zero não é usado como substituto de UNKNOWN.

A separação final é: `ASSEMBLY` descreve montagem e fixação sem promover automaticamente pré-furos; `MACHINING` descreve somente usinagem com regra e parâmetros declarados; `PURCHASED_HARDWARE` e `PROFILE` permanecem classificações downstream, não operações CNC; e `INCOMPLETE` é preservado quando fabricante, variante, regra ou dimensão industrial não foi documentado.

| Boundary | Resultado | Evidência principal |
|---|---|---|
| Professional dispatch | PASS | `ConstructionProfileRegistry.getByModuleDefinitionId` em `joineryReport.ts` e `machiningReport.ts` |
| LEGACY isolation | PASS | `legacyBuildJoineryOperations` separado do `professionalBuildJoineryOperations` |
| Confirmat/dowel defaults em Professional | PASS | Acceptance e mutation A/B |
| Upper cabinet generic hinge geometry | PASS | Acceptance e mutation B |
| Zero-as-unknown | PASS | Acceptance `never represents unknown joinery dimensions with zero` |
| Assembly ≠ drilling | PASS | Acceptance e mutation D |
| Visual hardware ≠ machining | PASS | Acceptance e mutation D |
| Unknown industrial data | PASS | `INCOMPLETE` + `unknownParameters` |
| Hardcoded machining module IDs | PASS | Dispatch acceptance e mutation E |

## 2. Alterações implementadas

Os contratos `JoineryDefinition` e `MachiningOperation` carregam `manufacturingRole`, `truthStatus`, `source` e `unknownParameters`. O resolver de aplicação de hardware continua separado das regras de construção, permitindo que uma variante selecionada sem regra dimensional permaneça `INCOMPLETE`.

O relatório de joinery usa um dispatch profissional baseado em profile e uma rota legada explicitamente isolada. O relatório de machining consome operações profissionais por classificação sem converter assembly, ferragem visual ou perfil em drilling. A família Blum MOVENTO 760H da Stage 11 foi preservada como piloto industrial já verificado; não foram adicionadas novas famílias.

Os testes Golden foram ajustados para verificar o contrato correto: `hinge-fixing` e `mounting-plate-fixing` aparecem em `assemblyReadiness`, enquanto apenas operações com verdade de usinagem aparecem em `machining.operations`. Invariância de coordenadas foi mantida para movimento, rotação e material; mudanças dimensionais preservam IDs e readiness, mas não são tratadas como uma promessa indevida de coordenadas geométricas invariantes.

## 3. Evidence pre-fix e post-fix

O baseline pre-fix está preservado em [`evidence/stage121-prefix-failures.log`](evidence/stage121-prefix-failures.log). Ele registrava o estado anterior à correção profissional. Os logs pós-fix estão em [`evidence/stage12-1-manufacturing-truth/`](evidence/stage12-1-manufacturing-truth/).

| Verificação | Pre-fix | Post-fix | Arquivo |
|---|---:|---:|---|
| Vitest integral | 60/62 arquivos, 641/644 testes | **62/62 arquivos, 644/644 testes** | `30-vitest-post-fix.log` |
| TypeScript | — | **0 diagnósticos** | `31-tsc-post-fix.log` |
| Production build | — | **PASS** | `32-build-post-fix.log` |
| `git diff --check` | — | **PASS / 0 bytes** | `33-diff-check-post-fix.log` |
| Mutation checks | 5/8 locks efetivos | **8/8 PASS_EXPECTED_FAILURE** | `34-mutation-post-fix.log` |
| Supabase | sem alteração de schema/dados | **NOT APPLICABLE** | `40-supabase-config-audit.log` |

## 4. Mutation proof

O script [`scripts/stage121_mutation_checks.sh`](scripts/stage121_mutation_checks.sh) executa oito mutações semânticas. O resultado final foi:

```text
12-mutation-A=PASS_EXPECTED_FAILURE
13-mutation-B=PASS_EXPECTED_FAILURE
14-mutation-C=PASS_EXPECTED_FAILURE
15-mutation-D=PASS_EXPECTED_FAILURE
16-mutation-E=PASS_EXPECTED_FAILURE
17-mutation-F=PASS_EXPECTED_FAILURE
18-mutation-G=PASS_EXPECTED_FAILURE
19-mutation-H=PASS_EXPECTED_FAILURE
```

As mutations A/B/H tentam reabrir defaults ou misturar LEGACY com Professional; C/D tentam promover peças, assembly ou hardware visual a machining; E reintroduz dispatch por módulo hardcoded; F/G quebram a propagação de `unknownParameters`. Todas são rejeitadas pelos acceptance locks.

## 5. Git e Supabase

A Stage 11 permanece representada pelo commit `93757d1` (`feat(planner-v2): verify Blum MOVENTO 760H pilot`). O fechamento anterior da Stage 12 permanece nos commits `bc08732` e `bf3d20f`. Esta entrega adiciona o commit específico da Stage 12.1 após o fechamento deste relatório.

O audit Supabase é **NOT APPLICABLE** para esta Stage: a implementação é local no planner, não cria migrações, não altera tabelas, não escreve registros e não depende de leitura de dados Supabase para validar a verdade de fabricação. A configuração disponível foi somente inspecionada e preservada em [`40-supabase-config-audit.log`](evidence/stage12-1-manufacturing-truth/40-supabase-config-audit.log).

## 6. Encerramento

A Stage 12.1 está pronta para revisão externa com **PASS**. O pacote contém código, contratos, testes, script de mutation, logs pre-fix/post-fix, evidências existentes das Stages 9–11, imagens e o relatório PDF correspondente. O trabalho está deliberadamente parado aqui: **não iniciar Stage 13, não expandir famílias e não iniciar CAM/CNC**.

## Referências internas

[1]: src/modules/planner-v2/library/services/joineryReport.ts "Professional e LEGACY joinery dispatch"
[2]: src/modules/planner-v2/library/services/machiningReport.ts "Machining/assembly dispatch e classificação"
[3]: src/modules/planner-v2/pkg/state/stage121ProfessionalTruthAcceptance.test.ts "Acceptance locks de truth"
[4]: src/modules/planner-v2/pkg/state/stage121ProfessionalDispatch.test.ts "Acceptance locks de dispatch"
[5]: scripts/stage121_mutation_checks.sh "Mutation checks Stage 12.1"
[6]: evidence/stage12-1-manufacturing-truth/30-vitest-post-fix.log "Vitest post-fix"
