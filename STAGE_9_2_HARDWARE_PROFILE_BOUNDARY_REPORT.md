# Stage 9.2 — Hardware Application Profile Boundary

## Resultado executivo

A Stage 9.2 eliminou o último fallback profissional ambíguo de `HardwareApplicationRule` sem alterar a geometria aprovada, os valores Blum, render, CAM/CNC ou criar novos módulos.

A decisão foi a **Opção B**: o Golden Upper ainda não possui uma regra industrial de aplicação explicitamente aprovada. Seu `ConstructionProfile` permanece sem `hardwareApplicationRule`; o lookup profissional retorna `undefined`, representando `NO_PROFILE_HARDWARE_RULE`. A regra específica do Base não é mais registrada como default global.

## Respostas obrigatórias

| Pergunta | Resposta |
|---|---|
| O Upper estava usando a rule do Base? | Sim, antes da correção, por causa do default global do Registry. |
| Por quê? | `getHardwareApplicationRule()` retornava `profile?.hardwareApplicationRule ?? defaultHardwareApplicationRule`. |
| Era necessário para os 22 hardwares? | Não. Os componentes são materializados pelo builder; a rule afetava somente o caminho de placement/aplicação. |
| Decisão final | Opção B: Upper sem rule industrial aprovada, sem herdar Base. |
| Onde ficou o fallback legacy? | Em `legacyKitchenDispatch.ts`, somente para chamadas antigas sem `moduleDefinitionId`. |
| Base mudou? | Não em geometria, hardware, BOM, Joinery, Machining, cut-list ou nesting. Mantém sua rule explícita. |
| Upper mudou? | Não em PartDefinitions ou baseline físico; mudou apenas a seleção declarativa para não reportar uma rule inexistente. |
| BOM mudou? | Não. |
| Joinery/Machining mudou? | Não. |
| Testes | 55 arquivos e 606 testes aprovados. |

## Auditoria de dispatch

| Module Definition | Construction Profile | Explicit Hardware Rule | Fallback Hardware Rule | Rule Actually Used | Decision |
|---|---|---|---|---|---|
| `kitchen-base-2-doors` | `kitchen-base-2-doors:construction-profile-v1` | `kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100` | Nenhuma no Registry profissional | Rule explícita do Base | Preservar |
| `kitchen-golden-upper-800` | `kitchen-golden-upper-800:construction-profile-v1` | Nenhuma | Nenhuma no Registry profissional | `NO_PROFILE_HARDWARE_RULE` | Não herdar Base |
| `kitchen-base-1-door` | Nenhum profile profissional | Nenhuma | Adaptador legacy somente quando aplicável | Nenhuma rule Golden | Permanecer compatível |

## Origem dos 22 hardwares Upper

O baseline de `800 × 700 × 350 mm` permanece com 32 PartDefinitions, sendo 10 físicas e 22 componentes de hardware.

| Grupo | Quantidade | Origem |
|---|---:|---|
| `hinge-soft-close` | 4 | `buildDoors`, duas dobradiças por porta para altura de 700 mm |
| `mounting-plate-37-32` | 4 | `buildDoors`, uma placa por dobradiça |
| `handle-cava` | 2 | `buildDoors`, um puxador por porta |
| `shelf-support` | 12 | `buildCarcass`, quatro suportes para cada uma das três prateleiras |
| **Total** | **22** | Baseline preservado |

A regra Blum do Base não é necessária para gerar esses componentes. Depois da remoção do default global, o Upper continuou produzindo exatamente os mesmos 32 PartDefinitions e os mesmos 22 hardwares.

## Alterações arquiteturais

O `ConstructionProfileRegistry` deixou de possuir `defaultHardwareApplicationRule` e `registerDefaultHardwareApplicationRule`. O método profissional agora retorna exclusivamente `this.profiles.get(moduleDefinitionId)?.hardwareApplicationRule`.

O Base continua declarando explicitamente `GOLDEN_71B3550_173H7100_RULE`. O Upper continua sem regra de aplicação. O adaptador `legacyKitchenDispatch` mantém a compatibilidade histórica para chamadas que não carregam `moduleDefinitionId`, sem permitir que a regra atravesse a fronteira profissional.

Foram adicionados acceptance locks para contaminação, mismatch Base→Upper, multi-instance, seleção por Definition ID, source lock do Registry e baseline de 22 hardwares.

## Mutation checks

| Mutation | Resultado |
|---|---|
| Upper recebe a rule do Base | Falha esperada observada |
| Base perde sua rule explícita | Falha esperada observada |
| Fallback legacy é removido | Falha esperada observada |
| `instanceId` é usado para selecionar rule | Falha esperada observada |

Todas as mutations foram restauradas automaticamente e não permaneceram no código de produção.

## Validação

| Verificação | Resultado | Evidência |
|---|---|---|
| Vitest direcionado | PASS — 20 testes nos locks de boundary/wiring/registry | `stage9-2-wiring-after-option-b.txt` |
| Vitest completo | PASS — 55 arquivos, 606 testes | `stage9-2-full-vitest.txt` |
| TypeScript | 5 erros preexistentes, zero erros novos | `stage9-2-typescript.txt` |
| Production build | PASS — exit code 0 | `stage9-2-production-build.txt` |
| `git diff --check` | PASS | evidência final |

Os cinco erros TypeScript continuam restritos a `usePlannerStore.ts`, linhas 1089–1093, e são os mesmos erros conhecidos anteriores à Stage 9.2.

## Supabase

**SUPABASE = NOT APPLICABLE.** Esta Stage não alterou migrations, functions, RLS, policies, storage, schema, seed ou configuração Supabase. Nenhuma migration vazia foi criada e nenhum banco foi alterado para satisfazer checklist.

## Limites respeitados

A Stage 10 não foi iniciada. Não foram criados gaveteiro, torre ou nova família; não houve alteração de geometria aprovada, valores Blum, render, CAM/CNC, G-code ou UI.

## Referências de evidência

A auditoria detalhada está em `evidence/stage9-profile-registry/stage9-2-hardware-dispatch-audit.md`. A reprodução pré-fix está em `stage9-2-prefix-audit.txt`; os locks finais estão em `stage9-2-boundary-locks.txt` e `stage9-2-wiring-after-option-b.txt`. As quatro mutations estão nos logs `09-mutation-*.log` e no resumo `stage9-2-mutation-summary.txt`.
