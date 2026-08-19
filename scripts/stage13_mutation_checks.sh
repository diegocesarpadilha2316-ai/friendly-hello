#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="$ROOT/src/modules/planner-v2/library/families/kitchen/constructionProfiles.ts"
RULES="$ROOT/src/modules/planner-v2/library/families/kitchen/structuralJoineryRules.ts"
RESOLVER="$ROOT/src/modules/planner-v2/library/services/structuralJoineryResolver.ts"
HARDWARE="$ROOT/src/modules/planner-v2/library/registry/HardwareRegistry.ts"
JOINERY="$ROOT/src/modules/planner-v2/library/services/joineryReport.ts"
OUT="$ROOT/evidence/stage13-structural-joinery/mutations"
TEST="src/modules/planner-v2/pkg/state/stage13StructuralJoineryAcceptance.test.ts"
mkdir -p "$OUT"
run_mutation() {
  local name="$1" file="$2" replacement="$3"
  local backup="/tmp/stage13-${name}.bak"
  cp "$file" "$backup"
  perl -0pi -e "$replacement" "$file"
  set +e
  (cd "$ROOT" && pnpm exec vitest run "$TEST") > "$OUT/${name}.log" 2>&1
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
run_mutation "stage13-mutation-A-remove-base-rule" "$PROFILE" 's/    structuralJoineryRule: GOLDEN_BASE_STRUCTURAL_JOINERY_RULE,\n//' 
run_mutation "stage13-mutation-B-wrong-connector" "$RULES" 's/connectorHardwareId: "structural-minifix-15"/connectorHardwareId: "missing-connector"/'
run_mutation "stage13-mutation-C-drop-relation" "$RULES" 's/      "side-right-to-base",\n//' 
run_mutation "stage13-mutation-D-change-housing-diameter" "$HARDWARE" 's/          kind: "structural-connector",\n          family: "MINIFIX",\n          housingDiameterMm: 15,/          kind: "structural-connector",\n          family: "MINIFIX",\n          housingDiameterMm: 14,/'
run_mutation "stage13-mutation-E-ready-incomplete-machining" "$RESOLVER" 's/machiningStatus: "INCOMPLETE"/machiningStatus: "READY"/'
run_mutation "stage13-mutation-F-remove-unknowns" "$JOINERY" 's/unknownParameters: \["targetBoltHoleDiameterMm", "targetBoltHoleDepthMm", "targetTool"\]/unknownParameters: []/'
run_mutation "stage13-mutation-G-wrong-source" "$JOINERY" 's/unknownParameters: \["targetBoltHoleDiameterMm", "targetBoltHoleDepthMm", "targetTool"\],\n        source: "MANUFACTURER_SPEC"/unknownParameters: ["targetBoltHoleDiameterMm", "targetBoltHoleDepthMm", "targetTool"],\n        source: "PROFILE_RULE"/'
run_mutation "stage13-mutation-H-legacy-leak" "$JOINERY" 's/  operations\.push\(\.\.\.structuralJoineryOperations\(instance, application\)\);/  operations.push(...legacyBuildJoineryOperations(instance));\n  operations.push(...structuralJoineryOperations(instance, application));/'
