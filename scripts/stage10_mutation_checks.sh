#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE="$ROOT/evidence/stage10-golden-drawer"
mkdir -p "$EVIDENCE"
TEST="src/modules/planner-v2/pkg/state/stage10GoldenDrawerFoundation.test.ts"
PASS=0
FAIL=0
run_mutation() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  local replacement="$4"
  local backup="${file}.stage10-mutation-backup"
  local log="$EVIDENCE/${name}.log"
  cp "$ROOT/$file" "$ROOT/$backup"
  trap 'cp "$ROOT/$backup" "$ROOT/$file"; rm -f "$ROOT/$backup"' RETURN
  sed -i "s/${pattern}/${replacement}/" "$ROOT/$file"
  set +e
  (cd "$ROOT" && pnpm exec vitest run "$TEST") >"$log" 2>&1
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    echo "$name=UNEXPECTED_PASS" | tee -a "$EVIDENCE/summary.txt"
    FAIL=$((FAIL + 1))
  else
    echo "$name=EXPECTED_FAIL" | tee -a "$EVIDENCE/summary.txt"
    PASS=$((PASS + 1))
  fi
  cp "$ROOT/$backup" "$ROOT/$file"
  rm -f "$ROOT/$backup"
  trap - RETURN
}
: > "$EVIDENCE/summary.txt"
run_mutation "01-remove-drawer-stack-rule" "src/modules/planner-v2/library/families/kitchen/constructionProfiles.ts" 'drawerStackRule: GOLDEN_DRAWER_3_STACK_RULE,' ''
run_mutation "02-use-instance-id-for-stack" "src/modules/planner-v2/library/families/kitchen/builders.ts" 'moduleDefinitionId: options.moduleDefinitionId ?? profile.moduleDefinitionId,' 'moduleDefinitionId: moduleId,'
run_mutation "03-collapse-box-front-role" "src/modules/planner-v2/library/families/kitchen/builders.ts" '"drawer-box-front"' '"drawer-front"'
run_mutation "04-change-drawer-count" "src/modules/planner-v2/library/families/kitchen/drawerRules.ts" 'drawerCount: 3,' 'drawerCount: 2,'
printf 'EXPECTED_FAILURES=%s\nUNEXPECTED_PASSES=%s\n' "$PASS" "$FAIL" | tee -a "$EVIDENCE/summary.txt"
[ "$PASS" -eq 4 ] && [ "$FAIL" -eq 0 ]
