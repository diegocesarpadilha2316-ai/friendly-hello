#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."

run_mutation() {
  local name="$1"
  local file="$2"
  local needle="$3"
  local replacement="$4"
  local test_cmd="$5"
  local log="evidence/stage9-profile-registry/09-mutation-${name}.log"
  cp "$file" "/tmp/stage9-2-${name}.bak"
  python3 - "$file" "$needle" "$replacement" <<'PY'
import pathlib
import sys
path = pathlib.Path(sys.argv[1])
needle = sys.argv[2].encode().decode("unicode_escape")
replacement = sys.argv[3].encode().decode("unicode_escape")
text = path.read_text()
if needle not in text:
    raise SystemExit(f"mutation needle not found: {needle}")
path.write_text(text.replace(needle, replacement, 1))
PY
  set +e
  bash -lc "$test_cmd" > "$log" 2>&1
  status=$?
  set -e
  cp "/tmp/stage9-2-${name}.bak" "$file"
  rm -f "/tmp/stage9-2-${name}.bak"
  printf 'MUTATION=%s\nEXIT_CODE=%s\n' "$name" "$status" | tee -a "$log"
  if [ "$status" -eq 0 ]; then
    echo "EXPECTED_FAILURE_NOT_OBSERVED for $name" | tee -a "$log"
    return 1
  fi
  echo "EXPECTED_FAILURE_OBSERVED for $name" | tee -a "$log"
}

run_mutation "upper-uses-base-rule" \
  "src/modules/planner-v2/library/families/kitchen/constructionProfiles.ts" \
  '    frontLayoutRule: GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE,' \
  '    frontLayoutRule: GOLDEN_UPPER_2_DOOR_FRONT_LAYOUT_RULE,\n    hardwareApplicationRule: GOLDEN_71B3550_173H7100_RULE,' \
  "pnpm exec vitest run src/modules/planner-v2/pkg/state/stage9_2HardwareProfileBoundary.test.ts"

run_mutation "base-loses-explicit-rule" \
  "src/modules/planner-v2/library/families/kitchen/constructionProfiles.ts" \
  '    hardwareApplicationRule: GOLDEN_71B3550_173H7100_RULE,' \
  '' \
  "pnpm exec vitest run src/modules/planner-v2/pkg/state/stage9_2HardwareProfileBoundary.test.ts"

run_mutation "legacy-fallback-removed" \
  "src/modules/planner-v2/library/families/kitchen/legacyKitchenDispatch.ts" \
  '  if (leaves !== 2 || moduleId !== "kitchen-base-2-doors") return {};' \
  '  return {};\n' \
  "pnpm exec vitest run src/modules/planner-v2/pkg/state/stage9_2HardwareProfileBoundary.test.ts"

run_mutation "instance-id-used-for-rule-selection" \
  "src/modules/planner-v2/library/families/kitchen/builders.ts" \
  'ConstructionProfileRegistry.getHardwareApplicationRule(options.moduleDefinitionId)' \
  'ConstructionProfileRegistry.getHardwareApplicationRule(moduleId)' \
  "pnpm exec vitest run src/modules/planner-v2/pkg/state/stage9ConstructionProfileRegistry.test.ts src/modules/planner-v2/pkg/state/stage9_2HardwareProfileBoundary.test.ts"

echo 'ALL_MUTATIONS_EXPECTED_FAILURE_OBSERVED'
