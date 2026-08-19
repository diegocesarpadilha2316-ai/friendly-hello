# Stage 9 — Profile Resolution Matrix

| MODULE DEFINITION | PROFILE | CARCASS RULE | FRONT RULE | HARDWARE APPLICATION RULE | LEGACY FALLBACK? | STATUS |
|---|---|---|---|---|---|---|
| `kitchen-base-2-doors` | `kitchen-base-2-doors:construction-profile-v1` | `GOLDEN_CARCASS_CONSTRUCTION_RULE` | `GOLDEN_2_DOOR_FRONT_LAYOUT_RULE` | `GOLDEN_71B3550_173H7100_RULE` | Não no caminho profissional | PASS — registry lookup e build real aprovados. |
| `kitchen-golden-upper-800` | `kitchen-golden-upper-800:construction-profile-v1` | `GOLDEN_UPPER_CARCASS_CONSTRUCTION_RULE` | `GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE` | Fallback declarativo `LEGACY_DEFAULT`, sem duplicação de rule object | Não no caminho profissional | PASS — `full-height`, `toeKickRelation: none`, front assimétrico e 32 parts preservados. |
| `kitchen-base-1-door` | ausente | não aplicável | não aplicável | não aplicável | Sim | PASS — módulo não migrado permanece no caminho legado. |

O Registry é indexado exclusivamente por `moduleDefinitionId`. Um `instanceId`, como `furniture-123456`, não encontra profile. Profiles são declarativos e compartilham referências de rules; resultados resolvidos e PartDefinitions continuam occurrence-scoped.
