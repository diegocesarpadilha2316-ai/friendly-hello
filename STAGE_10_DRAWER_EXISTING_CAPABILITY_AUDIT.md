# Stage 10 — Drawer Existing Capability Audit

## Escopo

A auditoria foi feita antes de criar uma nova ModuleDefinition. O objetivo foi localizar drawer parts, caixas, frentes, corrediças, hardware, motion, validação, joinery, machining, BOM, cut-list, nesting e profiles existentes.

| CAPABILITY | ARQUIVO | ESTADO | REUTILIZÁVEL? | DECISÃO |
|---|---|---|---|---|
| ModuleDefinition de gaveteiro | `library/families/kitchen/professionalModules.ts` | Já existem `kitchen-drawer-1`, `kitchen-drawer-2`, `kitchen-drawer-3` e `kitchen-drawer-4` | Sim | Reutilizar `kitchen-drawer-3`; não criar ID duplicado |
| Builder de gavetas | `library/families/kitchen/builders.ts` (`buildDrawers`) | Gera fronts, sides, back, bottom e slides, porém usa fórmulas inline e não deriva de opening/rules declarativas | Parcial | Refatorar para resolvers puros e profile, sem criar engine paralelo |
| Drawer front | `PartDefinition.ts`, `buildDrawers` | Role `drawer-front` já existe e possui material, grain/edge metadata via normalização | Sim | Separar semanticamente de `drawer box front` |
| Drawer box | `buildDrawers` | Sides, back e bottom já são materializados; a nomenclatura atual não explicita um contrato DrawerBox | Parcial | Criar `DrawerBoxRule`/resolver mínimo, preservando PartDefinitions |
| Identidade de gaveta | `buildDrawers` | IDs determinísticos `drawer-N:*` e `groupId` por gaveta | Sim | Manter IDs e proteger multi-instance |
| Corrediças | `HardwareRegistry.ts` | Existem `slide-telescopic`, `slide-hidden` e `slide-hidden-soft-close` como hardware sem manufacturingVariants | Parcial | Usar slide genérica semanticamente; industrial application/machining = INCOMPLETE |
| Slide application | Não existe contrato dedicado | A largura atual usa constante inline `26`; não há clearance esquerda/direita declarada | Não | Criar `DrawerSlideApplicationRule` com clearance explícita e readiness honesta |
| Manufacturer data | `HardwareRegistry.ts` | As slides existentes não possuem manufacturer/model/code/technical data verificável | Não | Não inventar especificação; não declarar READY industrial |
| Carcass | `carcassConstructionResolver.ts`, `ConstructionProfileRegistry` | Engine compartilhado já resolve carcass | Sim | Reutilizar regra/engine somente após validar semântica do gaveteiro |
| ConstructionProfile | `contracts/ConstructionProfile.ts` | Possui carcass, front e hardware application; não possui drawer slot | Parcial | Extender minimamente com `drawerStackRule?` e regras derivadas, sem guardar resolved output |
| Drawer stack | Não localizado como contrato/resolver dedicado | `buildDrawers` calcula quantidade, altura e gap inline | Não | Criar `DrawerStackRule` e `resolveDrawerStack` |
| Motion | `FurnitureInstance`, `validateOpeningClearance`, store `toggleInstanceAnimation` | Suporta `interactive.type: drawer`, `maxTravelMm`, `openStates` e envelope de abertura | Sim | Reutilizar; não criar animation engine novo |
| Collision/interlock | `validateOpeningClearance.ts`, `validateModule.ts` | Valida envelopes de abertura e colisões coarse; exige `maxTravelMm` | Parcial | Reutilizar e adicionar locks de stack/carcass sem duplicar engine |
| Joinery | `joineryReport.ts` | Reconhece drawer-front, drawer-side, drawer-bottom e slide-fixing | Sim | Reutilizar; sem inventar joinery nova |
| Machining | `machiningReport.ts` e contratos | Não há dados industriais de slide para gerar furação definitiva | Parcial | Retornar INCOMPLETE/UNVERIFIED para slide machining |
| BOM | `fabricationReport.ts`/serviços de fabricação | Já contabiliza drawer fronts e slide hardware | Sim | Validar sem duplicar hardware em rebuild |
| Cut-list | `fabricationReport.ts`/cut-list | Já exporta dimensões, material, grain e edge banding | Sim | Validar todas as peças do drawer box |
| Nesting | `nestingPlan.ts`/serviços downstream | Pipeline de nesting já recebe physical parts e exclui hardware | Sim | Validar missing/duplicate/unknown IDs |
| Persistência | `projectPersistence.ts`, store | Persiste instância e reconstrói por Definition ID; config específica de drawer ainda não foi isolada | Parcial | Persistir apenas count/config/material/hardware necessários |
| IA | `updateFurnitureInstance` e pipeline existente | Rebuild genérico já existe | Sim | Apenas regressão; não adicionar linguagem natural nesta Stage |

## Conclusão da auditoria

Existe uma base funcional significativa, mas o drawer atual é um builder legado com fórmulas inline. A Stage 10 deve **reutilizar ModuleDefinition `kitchen-drawer-3`, PartDefinition, motion, joinery, BOM, cut-list e nesting**, substituindo apenas a fonte de verdade geométrica por regras e resolvers declarativos.

Não existe corrediça com manufacturer/model/code/technical data validada no `HardwareRegistry`. Portanto, a Stage 10 poderá entregar geometry, stack, fronts, boxes e visual motion como READY, mas deve classificar slide manufacturing e slide machining como INCOMPLETE.

A missão não deve criar outra ModuleDefinition, outro engine de motion, outra caixa ou uma seleção industrial inventada. O único novo domínio necessário é a fundação declarativa de DrawerStack, DrawerBox e SlideApplication conectada ao ConstructionProfile existente.
