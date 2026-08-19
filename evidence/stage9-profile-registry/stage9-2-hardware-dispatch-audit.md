# Stage 9.2 — Hardware Application Profile Boundary Audit

## Decisão

A auditoria escolhe a **Opção B** para `kitchen-golden-upper-800`: o Upper não possui uma `HardwareApplicationRule` industrial explicitamente aprovada nesta Stage. Portanto, seu `ConstructionProfile.hardwareApplicationRule` permanece `undefined`, o lookup profissional retorna `undefined` e o Upper não herda a regra específica do Base.

A regra `kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100` permanece explícita no profile `kitchen-base-2-doors`. O fallback de compatibilidade fica limitado ao adaptador `legacyKitchenDispatch`, utilizado somente quando a chamada antiga não fornece `moduleDefinitionId`.

## Matriz de dispatch

| Module Definition | Construction Profile | Explicit Hardware Rule | Fallback Hardware Rule | Rule Actually Used | Decision |
|---|---|---|---|---|---|
| `kitchen-base-2-doors` | `kitchen-base-2-doors:construction-profile-v1` | `kitchen-base-2-doors:paired-full-overlay:blum-71b3550-173h7100` | Nenhuma no Registry profissional | Regra explícita do Base | Preservar sem alteração |
| `kitchen-golden-upper-800` | `kitchen-golden-upper-800:construction-profile-v1` | Nenhuma | Nenhuma no Registry profissional | `NO_PROFILE_HARDWARE_RULE` | Não herdar Base; manter baseline físico |
| `kitchen-base-1-door` | Nenhum profile profissional | Nenhuma | Somente adaptador legacy quando aplicável; para 1 porta, nenhuma rule Golden | Nenhuma regra Golden | Permanecer compatível sem transformar em profissional |

## Origem dos 22 hardwares Upper

Os 22 componentes observados no baseline são gerados pelo builder e não dependem da aplicação específica do Base para existir:

| Grupo | Quantidade | Origem |
|---|---:|---|
| Dobradiças `hinge-soft-close` | 4 | `buildDoors`, duas por porta por altura de 700 mm |
| Placas `mounting-plate-37-32` | 4 | `buildDoors`, uma por dobradiça |
| Puxadores `handle-cava` | 2 | `buildDoors`, um por porta |
| Suportes de prateleira | 12 | `buildCarcass`, quatro por cada uma das três prateleiras |
| **Total** | **22** | Baseline preservado |

A antiga default global somente fazia a seleção da regra para o cálculo de placement quando o profile não possuía rule. Ela não era necessária para materializar os 22 componentes do Upper; sem rule explícita, o builder continua usando o caminho geométrico padrão de placement e mantém os mesmos componentes e dimensões auditados.

## Regra de fronteira

O `ConstructionProfileRegistry` não possui mais `defaultHardwareApplicationRule` nem `registerDefaultHardwareApplicationRule`. O método profissional `getHardwareApplicationRule(moduleDefinitionId)` retorna exclusivamente `profile?.hardwareApplicationRule`. Assim, uma regra específica de `kitchen-base-2-doors` não pode contaminar Upper, Torre, Gaveteiro ou futuras definições profissionais.

A compatibilidade antiga foi preservada em `legacyKitchenDispatch.ts`; não existe alteração de banco, render, CAM/CNC, geometria aprovada ou valores Blum nesta Stage.
