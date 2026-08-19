#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JOINERY="$ROOT/src/modules/planner-v2/library/services/joineryReport.ts"
MACHINING="$ROOT/src/modules/planner-v2/library/services/machiningReport.ts"
TEST_DISPATCH="src/modules/planner-v2/pkg/state/stage121ProfessionalDispatch.test.ts"
TEST_TRUTH="src/modules/planner-v2/pkg/state/stage121ProfessionalTruthAcceptance.test.ts"
OUT="$ROOT/evidence/stage12-1-manufacturing-truth"
mkdir -p "$OUT"
run_mutation() {
  local name="$1" file="$2" replacement="$3" test="$4"
  local backup="/tmp/stage121-${name}.bak"
  cp "$file" "$backup"
  perl -0pi -e "$replacement" "$file"
  set +e
  (cd "$ROOT" && pnpm exec vitest run "$test") > "$OUT/${name}.log" 2>&1
  local rc=$?
  set -e
  cp "$backup" "$file"
  rm -f "$backup"
  if [ "$rc" -eq 0 ]; then
    echo "$name=FAIL_MUTATION_PASSED" | tee -a "$OUT/20-mutation-summary.md"
  else
    echo "$name=PASS_EXPECTED_FAILURE" | tee -a "$OUT/20-mutation-summary.md"
  fi
}
: > "$OUT/20-mutation-summary.md"
run_mutation "12-mutation-A" "$JOINERY" 's/if \(profile\.hardwareApplicationRule\) \{\n    operations\.push/if (profile.hardwareApplicationRule) {\n    operations.push(...legacyBuildJoineryOperations(instance).filter((operation) => operation.kind === "confirmat" || operation.kind === "dowel"));\n    operations.push/' "$TEST_DISPATCH"
run_mutation "13-mutation-B" "$JOINERY" 's/if \(profile\.hardwareApplicationRule\) \{\n    operations\.push\(\.\.\.goldenConstructionOperations\(instance\)\);/if (profile.hardwareApplicationRule || instance.moduleDefinitionId === "kitchen-golden-upper-800") {\n    operations.push(...goldenConstructionOperations(instance));/' "$TEST_DISPATCH"
run_mutation "14-mutation-C" "$JOINERY" 's/const sides = instance\.parts\.filter\(\(part\) => part\.role === "drawer-side"\);/const sides = instance.parts.filter((part) => part.role === "drawer-side" || part.role === "drawer-bottom");/' "$TEST_DISPATCH"
run_mutation "15-mutation-D" "$JOINERY" 's/if \(profile\.drawerIndustrialSlideRule\) \{/if (profile.drawerIndustrialSlideRule) { operations.push(op(instance, instance.parts.find((part) => part.role === "drawer-front")?.id ?? instance.id, "handle-through", 999, { source: "PROFILE_RULE", truthStatus: "INCOMPLETE", unknownParameters: ["mutation"] }));/' "$TEST_DISPATCH"
run_mutation "16-mutation-E" "$MACHINING" 's/const profile = ConstructionProfileRegistry\.getByModuleDefinitionId\(instance\.moduleDefinitionId\);/const profile = instance.moduleDefinitionId === "kitchen-base-2-doors" ? ConstructionProfileRegistry.getByModuleDefinitionId(instance.moduleDefinitionId) : undefined;/' "src/modules/planner-v2/pkg/state/stage11Movento760HAcceptance.test.ts"
run_mutation "17-mutation-F" "$JOINERY" 's/unknownParameters: truth\.unknownParameters,/unknownParameters: ["mutation"],/' "$TEST_DISPATCH"
run_mutation "18-mutation-G" "$JOINERY" 's/unknownParameters: truth\.unknownParameters,/unknownParameters: [],/' "$TEST_DISPATCH"
run_mutation "19-mutation-H" "$JOINERY" 's/if \(profile\) \{\n      operations\.push\(\.\.\.professionalBuildJoineryOperations\(instance\)\);/if (profile) {\n      operations.push(...legacyBuildJoineryOperations(instance));\n      operations.push(...professionalBuildJoineryOperations(instance));/' "$TEST_DISPATCH"
