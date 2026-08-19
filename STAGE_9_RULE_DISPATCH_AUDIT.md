# Stage 9 — Dispatch Audit

A auditoria foi executada sobre o estado anterior à migração do Registry e confirmou as decisões abaixo.

| ARQUIVO | FUNÇÃO | CONDIÇÃO | ID TESTADO | REGRA SELECIONADA | CAMADA CORRETA? | DECISÃO |
|---|---|---|---|---|---|---|
| `library/families/kitchen/builders.ts` | `buildCarcass` | ternário por `options.moduleDefinitionId` | `kitchen-base-2-doors` / `kitchen-golden-upper-800` | `GOLDEN_CARCASS_CONSTRUCTION_RULE` / `GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE` | Não | Migrado para `ConstructionProfileRegistry.getByModuleDefinitionId(...).carcassRule`. |
| `library/families/kitchen/builders.ts` | `buildDoors` | ternário por `options.moduleDefinitionId` e fallback por `moduleId` | `kitchen-base-2-doors` / `kitchen-golden-upper-800` | `GOLDEN_2_DOOR_FRONT_LAYOUT_RULE` / `GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE` | Não no caminho profissional | Migrado para `profile.frontLayoutRule`; a compatibilidade sem Definition ID foi isolada em `legacyKitchenDispatch.ts`. |
| `library/families/kitchen/builders.ts` | `buildDoors` | regra fixa em cada placement | todos os módulos com Front Layout | `GOLDEN_71B3550_173H7100_RULE` | Não como seleção no builder | O caminho profissional consulta o Registry; o fallback é explicitamente classificado como `LEGACY_DEFAULT`. |
| `library/families/kitchen/professionalModules.ts` | factories `base` / `upper` | encaminhamento de definição | `config.id` | `moduleDefinitionId` | Sim | Preservado; não é seleção de regra. |
| `library/services/hardwareApplicationResolver.ts` | `resolveGoldenHardwareApplication` | gate por módulo | `kitchen-base-2-doors` | Golden Base application/front rules | Parcial | Mantido como API legada para consumidores existentes. O resolver continua puro e não recebe Registry internamente; a migração downstream é limite documentado. |
| `library/registry/ConstructionProfileRegistry.ts` | bootstrap | inicialização de profiles Golden | Base / Upper | referências declarativas existentes | Sim | Único bootstrap determinístico e idempotente do Registry. |

## Identidade

A seleção profissional usa `moduleDefinitionId`. `instanceId` e `moduleId` físico não são chaves de Construction Profile. O uso de `moduleId` permanece apenas no adaptador de compatibilidade de chamadas antigas que não carregam `moduleDefinitionId`.

## Classificação do hardware

`GOLDEN_71B3550_173H7100_RULE` declara `moduleDefinitionId: kitchen-base-2-doors`; portanto não é uma regra universal de todas as portas Kitchen. Nesta Stage ela é referenciada pelo profile Base e disponibilizada no Registry como fallback declarativo legado para preservar consumidores existentes, sem alteração de valores industriais.
