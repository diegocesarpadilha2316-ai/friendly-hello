#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE="$ROOT/evidence/stage11-movento-760h"
mkdir -p "$EVIDENCE"
TESTS=(
  "src/modules/planner-v2/pkg/state/stage11Movento760HFoundation.test.ts"
  "src/modules/planner-v2/pkg/state/stage11Movento760HAcceptance.test.ts"
)
PASS=0
FAIL=0
run_mutation() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  local replacement="$4"
  local backup="${file}.stage11-mutation-backup"
  local log="$EVIDENCE/${name}.log"
  cp "$ROOT/$file" "$ROOT/$backup"
  sed -i "s/${pattern}/${replacement}/" "$ROOT/$file"
  set +e
  (cd "$ROOT" && pnpm exec vitest run "${TESTS[@]}") >"$log" 2>&1
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
}
: > "$EVIDENCE/summary.txt"
run_mutation "01-change-nominal-length" "src/modules/planner-v2/library/families/kitchen/drawerRules.ts" 'nominalLengthMm: 500,' 'nominalLengthMm: 515,'
run_mutation "02-change-skw-equation" "src/modules/planner-v2/library/services/drawerStackResolver.ts" 'opening.internalWidthMm - 42' 'opening.internalWidthMm - 41'
run_mutation "03-break-variant-identity" "src/modules/planner-v2/library/families/kitchen/drawerRules.ts" 'manufacturingVariantId: "blum-movento-760h-nl500"' 'manufacturingVariantId: "missing-movento-variant"'
run_mutation "04-exceed-side-thickness" "src/modules/planner-v2/library/families/kitchen/drawerRules.ts" 'sideThicknessMm: 15,' 'sideThicknessMm: 17,'
printf 'EXPECTED_FAILURES=%s\nUNEXPECTED_PASSES=%s\n' "$PASS" "$FAIL" | tee -a "$EVIDENCE/summary.txt"
[ "$PASS" -eq 4 ] && [ "$FAIL" -eq 0 ]
