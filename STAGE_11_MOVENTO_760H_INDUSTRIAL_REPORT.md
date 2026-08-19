# Stage 11 — Blum MOVENTO 760H Industrial Pilot

**Status:** IMPLEMENTED / READY FOR EXTERNAL REVIEW

**Boundary:** Stage 9 and Stage 10 preserved. Stage 12 not started. No second runner brand added.

## 1. Executive summary

Stage 11 promotes the existing `kitchen-drawer-3` Golden Drawer pilot to a single verified industrial runner application: **Blum MOVENTO 760H, nominal length NL 500 mm**. The implementation reuses the Stage 10 Registry, carcass resolver, drawer stack resolver, builder, `PartDefinition`, instance identity, BOM, cut-list, nesting and persistence paths. It does not create a second drawer engine.

The industrial path is explicit:

> **Resolved Carcass Opening → Blum MOVENTO rule → SKW/SKL resolver → real drawer box dimensions → verified hardware reference → READY/INCOMPLETE downstream operations**

The implementation deliberately separates four categories of information. Manufacturer facts come only from official Blum sources. Furniture rules remain Dioris profile rules. Calculated dimensions are derived from the actual carcass opening and selected NL. Unknown values remain marked unknown or incomplete and are not promoted to manufacturing-ready values.

## 2. Official source policy

Only official Blum pages were used. No reseller, forum, third-party CAD library, or second runner brand was used. The source ledger and locally archived HTML/text snapshots are stored under `evidence/stage11-movento-760h/sources/` and `evidence/stage11-movento-760h/official-source-ledger.md`.

The official Blum drawer-building guidance states that `SKW = LW − 42 mm`, `SKL = NL − 10 mm`, drawer sides must not be wider than 16 mm, and the recess must be at least 12 mm high and maximum 15 mm deep.[1] The official 2024/2025 catalogue identifies MOVENTO 760H as a 40 kg runner family and provides the planning notation, drilling template reference and optional side-stabilisation/depth-adjustment notes.[2] [3] The official attachment page provides the screw references and nominal-length-dependent runner positions.[4]

> “SKW (internal drawer width) = LW (internal cabinet width) – 42 mm.” — Blum official drawer-building guidance.[1]

> “Drawer length (= drawer side length): NL – 10 mm.” — Blum official drawer-building guidance.[1]

## 3. Pilot selection

The pilot remains the pre-existing `kitchen-drawer-3` definition. No new ModuleDefinition was created. The profile now contains one additional optional slot, `drawerIndustrialSlideRule`, alongside the generic Stage 10 slide rule. The generic visual ID remains `slide-hidden-soft-close`; the industrial selection is a persisted variant reference `blum-movento-760h-nl500`.

| Selection field | Pilot value | Provenance/status |
|---|---:|---|
| Manufacturer | Blum | Official manufacturer documentation |
| Family | MOVENTO | Official Blum catalogue |
| Variant | 760H | Official Blum catalogue |
| Nominal length | 500 mm | Official 760H nominal-length example/list |
| Dynamic carrying capacity | 40 kg | Official Blum overview/catalogue |
| Generic Dioris hardware ID | `slide-hidden-soft-close` | Existing Stage 10 visual hardware ID |
| Industrial variant ID | `blum-movento-760h-nl500` | Dioris Registry reference to Blum data |
| Manufacturer part number | UNKNOWN | Not invented; the selected official pages do not establish one single code for all configuration choices |

NL 500 was selected because it is an official 760H nominal length and is the explicit nominal-length example in the official planning material.[3] The pilot does not claim that NL 500 is universally correct for every cabinet depth; the resolver validates each actual opening.

## 4. Manufacturer data

The manufacturer-backed data is stored in `RunnerManufacturingSpec` and attached to a `RunnerManufacturingVariant`. It is not stored as a furniture dimension on the generic hardware definition.

| Manufacturer datum | Value | Status |
|---|---:|---|
| Family | MOVENTO | READY |
| Variant | 760H | READY |
| Dynamic capacity | 40 kg | READY |
| Supported nominal lengths | 270, 300, 320, 350, 380, 400, 420, 450, 480, 500, 520, 550, 600 mm | READY from official 760H catalogue table |
| Drawer width rule | `SKW = LW − 42 mm`, tolerance `+0.0 / −1.5 mm` in catalogue notation | READY |
| Drawer side length rule | `SKL = NL − 10 mm` | READY |
| Maximum drawer-side thickness | 16 mm | READY |
| Recess height | 12–15 mm | READY |
| Recess depth | maximum 15 mm | READY |
| Drawer preparation template | `T65.1000.02` | READY |
| Chipboard screw | Ø3.5 × 15 mm, code `609.1500` | READY |
| System screw | Ø6 × 14.5 mm, code `661.1450.HG` | READY |
| Exact CNC drilling coordinates for this Dioris operation | Not archived as a complete applicable coordinate set | INCOMPLETE |
| Single product code for the complete selected configuration | Not established by the sources used | UNKNOWN |

The official assembly page also states that MOVENTO drilling patterns and mounting positions remain the same across the MOVENTO motion options, while the page offers assembly devices and a four-dimensional front-adjustment workflow.[5] This is documented as assembly context, not as an invented CNC coordinate set.

## 5. Furniture rules

Furniture rules remain separate from manufacturer data. The existing Stage 10 rules continue to control the stack and box height:

| Dioris rule | Pilot value | Role |
|---|---:|---|
| Drawer count | 3 | Existing Golden Drawer stack |
| Distribution | Equal | Existing Stage 10 front equation |
| Top/bottom reveal | 2 / 2 mm | Existing Stage 10 furniture rule |
| Inter-front gap | 2 mm | Existing Stage 10 furniture rule |
| Box side/back/bottom thickness | 15 / 15 / 15 mm | Existing Stage 10 furniture rule |
| Box side height reduction | 40 mm | Existing Stage 10 furniture rule |
| Industrial drawer-side thickness | 15 mm | Dioris furniture choice, validated against Blum maximum 16 mm |
| Selected runner NL | 500 mm | Industrial rule selecting an official Blum nominal length |
| Box depth policy | Manufacturer drawer length | `SKL = NL − 10` |

The Stage 10 front equation is unchanged:

```text
frontHeight =
  (internalHeight - topReveal - bottomReveal - (drawerCount - 1) × interDrawerGap) / drawerCount
```

## 6. Canonical calculated geometry

The canonical acceptance case is an external module of **800 × 870 × 580 mm**, with 18 mm panel and back rules from the existing carcass profile. The carcass resolver produces the following opening:

```text
LW = internalWidth = 800 - 2 × 18 = 764 mm
internalHeight = 684 mm
internalDepth = 580 - 18 = 562 mm
```

The industrial resolver then applies only the official Blum equations:

```text
SKW = LW - 42 = 764 - 42 = 722 mm
SKL = NL - 10 = 500 - 10 = 490 mm
```

The resulting physical box width is **722 mm** and its side length/depth is **490 mm**. The 15 mm drawer side is within the official 16 mm maximum. The 490 mm drawer length fits inside the 562 mm resolved internal depth. The front width remains the resolved opening width, 764 mm, because the industrial slide changes the drawer box application, not the existing front equation.

| Calculated item | Value | Source of calculation |
|---|---:|---|
| External width | 800 mm | Acceptance input |
| Internal cabinet width `LW` | 764 mm | Existing Dioris carcass resolver |
| Internal height | 684 mm | Existing Dioris carcass resolver |
| Internal depth | 562 mm | Existing Dioris carcass resolver |
| Front width | 764 mm | Existing Stage 10 drawer resolver |
| Front height | 225.3 mm | Existing Stage 10 equal-stack equation |
| Nominal length `NL` | 500 mm | Official Blum-selected variant |
| Real drawer length `SKL` | 490 mm | Blum equation |
| Real drawer width `SKW` | 722 mm | Blum equation |
| Drawer-side thickness | 15 mm | Dioris rule, checked against Blum max 16 mm |
| Drawer box quantity | 3 | Existing Golden Drawer rule |
| Physical side quantity | 6 | Two sides per drawer |

Changing the module width to 1000 mm changes `SKW` to 922 mm while preserving the selected `SKL` at 490 mm. A 500 mm external-depth case resolves to 482 mm internal depth and is explicitly rejected because it cannot contain `SKL 490 mm`; it does not fall back to Stage 10 visual-safe geometry.

## 7. Hardware and identity

The hardware variant is attached to the instance as `hardwareVariantIds.slide`, not as a resolved object. The serializer therefore persists only the selected variant reference. A second `kitchen-drawer-3` instance receives its own instance-scoped part and operation IDs while referring to the same Registry variant.

The BOM resolves the materialized side hardware through the Registry and reports six units of `slide-hidden-soft-close` with `hardwareVariantId = blum-movento-760h-nl500`, manufacturer `Blum`, and model `MOVENTO 760H`. The cut-list and nesting continue to consume the same physical `PartDefinition` objects and preserve `drawer-box-front`, drawer sides, backs and bottoms.

## 8. Mounting, machining and readiness

The selected runner family, variant, NL, template, and screw references are verified against official Blum documentation. Therefore the assembly-level operation is **READY**. The CNC operation is deliberately **INCOMPLETE** because the current official evidence ledger does not contain a complete Dioris-applicable coordinate selection for the runner mounting positions, drawer hook positions and pilot-hole decisions.

| Operation/data | Status | Reason |
|---|---|---|
| Family/variant identity | READY | Registry variant matches rule and official source |
| NL 500 support | READY | NL 500 is in official 760H nominal lengths |
| SKW/SKL calculation | READY | Pure resolver uses official equations |
| Drawer-side thickness compatibility | READY | 15 mm ≤ official max 16 mm |
| Recess rule validation | READY as a documented constraint | 12–15 mm height and max 15 mm depth are represented; no false machining is emitted |
| Mounting hardware references | READY | Template and screw references are documented |
| Assembly readiness | READY | Six side-mount applications carry Blum provenance |
| CNC mounting operation | INCOMPLETE | Exact applicable coordinates are not promoted without a complete verified drawing/configurator result |
| Pilot-hole decision | INCOMPLETE | Not invented |
| Manufacturer part number | UNKNOWN | Not present as one verified code in the selected source set |

The machining report emits six traceable MOVENTO operations with `readiness = INCOMPLETE` and explicit `missingParameters`: `runnerMountingCoordinates`, `drawerHookCoordinates`, and `pilotHoleDecision`. It also emits six assembly-readiness records marked READY with the official provenance. This separation prevents a verified purchase/mounting reference from being misrepresented as a complete CNC program.

## 9. Regression and mutation evidence

The final full Vitest run passed **59 test files and 629 tests**. This includes Stage 9 and Stage 10 regression coverage plus 10 new Stage 11 unit/acceptance tests. The Stage 10 multi-instance acceptance lock passed after stabilizing the industrial slide operation IDs.

Four Stage 11 mutations all failed as expected and were restored:

| Mutation | Expected result |
|---|---|
| Change NL 500 to unsupported 515 | EXPECTED_FAIL |
| Change `LW − 42` to `LW − 41` | EXPECTED_FAIL |
| Break `blum-movento-760h-nl500` identity | EXPECTED_FAIL |
| Increase drawer side thickness from 15 to 17 mm | EXPECTED_FAIL |

The mutation summary is stored at `evidence/stage11-movento-760h/summary.txt`. The technical evidence image is deterministic and explicitly labelled as not being a Planner screenshot or a manufacturer drawing.

## 10. TypeScript and build status

The final TypeScript check reports exactly the five known baseline `TS2322` errors in `usePlannerStore.ts` lines 1089–1093. No new TypeScript error is attributable to Stage 11. The production build and `git diff --check` are recorded in the final evidence directory.

## 11. Stage boundaries and Supabase

Stage 9 and Stage 10 were preserved. No Stage 10 implementation was re-run or replaced; only the existing contracts and resolver path were extended with the industrial rule and verified variant. No second runner brand was added. No Stage 12 work was initiated.

**SUPABASE = NOT APPLICABLE.** Stage 11 changes TypeScript contracts, Registry data, rules, resolvers, downstream reports, tests, evidence and documentation only. No migration, schema, seed, RLS policy, storage rule, Edge Function or Supabase data operation is required or was executed.

## 12. Files delivered

| File | Purpose |
|---|---|
| `contracts/HardwareManufacturingSpec.ts` | Runner manufacturing facts and provenance |
| `contracts/DrawerRules.ts` | Industrial slide rule and resolved industrial result |
| `families/kitchen/drawerRules.ts` | MOVENTO 760H NL 500 pilot rule |
| `families/kitchen/constructionProfiles.ts` | Declarative profile integration |
| `registry/HardwareRegistry.ts` | Blum variant data |
| `services/drawerStackResolver.ts` | Pure SKW/SKL resolver and hard stops |
| `services/fabricationReport.ts` | BOM variant propagation |
| `services/joineryReport.ts` | Stable drawer slide-fixing identity |
| `services/machiningReport.ts` | READY assembly / INCOMPLETE CNC split |
| `pkg/state/stage11Movento760HFoundation.test.ts` | Pure resolver locks |
| `pkg/state/stage11Movento760HAcceptance.test.ts` | Full pilot acceptance |
| `scripts/stage11_mutation_checks.sh` | Four controlled mutations |
| `evidence/stage11-movento-760h/` | Sources, logs, summary and deterministic diagram |

## References

[1]: https://ea.blum.com/en/building-a-movento-drawer/ "Blum — Building a MOVENTO drawer"
[2]: https://publications.blum.com/2024/catalogue/en/411/ "Blum Catalogue 2024/2025 — MOVENTO overview"
[3]: https://publications.blum.com/2024/catalogue/en/413/ "Blum Catalogue 2024/2025 — MOVENTO locking device feature and drawer planning"
[4]: https://publications.blum.com/2024/catalogue/en/428/ "Blum Catalogue 2024/2025 — Attachment of runners"
[5]: https://www.blum.com/us/en/products/runnersystems/movento/assembly/ "Blum — MOVENTO assembly and installation"
[6]: https://publications.blum.com/2022/catalogue/en/437/ "Blum Catalogue 2022/2023 — MOVENTO 760H nominal lengths and drawer planning cross-check"
[7]: https://publications.blum.com/2022/catalogue/en/438/ "Blum Catalogue 2022/2023 — MOVENTO runner attachment cross-check"
