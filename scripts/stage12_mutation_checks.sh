#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE="$ROOT/evidence/stage12-closure"
mkdir -p "$EVIDENCE"
TEST="src/modules/planner-v2/pkg/state/stage12ClosureAcceptance.test.ts"
PASS=0
FAIL=0
run_mutation() {
  local name="$1"
  local file="$2"
  local pattern="$3"
  local replacement="$4"
  local backup="${file}.stage12-mutation-backup"
  local log="$EVIDENCE/${name}.log"
  cp "$ROOT/$file" "$ROOT/$backup"
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
}
: > "$EVIDENCE/summary.txt"
run_mutation "01-remove-material-fallback" "src/modules/planner-v2/pkg/state/usePlannerStore.ts" 'materialOverrides: {},' 'materialOverrides: { body: "" },'
run_mutation "02-break-a-to-b-to-a-restore" "$TEST" 'dimensionsMm: dimensions' 'dimensionsMm: { width: 810, height: 870, depth: 580 }'
run_mutation "03-collapse-rotation-update" "$TEST" 'rotationDeg: { x: 0, y: 90, z: 0 }' 'rotationDeg: { x: 0, y: 0, z: 0 }'
run_mutation "04-collapse-instance-isolation" "src/modules/planner-v2/pkg/state/usePlannerStore.ts" 'instanceId: id,' 'instanceId: "shared",'
printf 'EXPECTED_FAILURES=%s\nUNEXPECTED_PASSES=%s\n' "$PASS" "$FAIL" | tee -a "$EVIDENCE/summary.txt"
[ "$PASS" -eq 4 ] && [ "$FAIL" -eq 0 ]
