#!/usr/bin/env bash
# Full check: build, syntax check, 2D smoke (3 factions x 150 turns + mobile), UI click-through, short 3D smoke.
# Usage: tests/run-all.sh            (KE_TURNS=40 tests/run-all.sh for a quicker pass)
set -u
cd "$(dirname "$0")/.."
TURNS="${KE_TURNS:-150}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fail=0
declare -a results

run() { # name, command...
  local name="$1"; shift
  local t0=$SECONDS
  echo "=== $name"
  if "$@" >"$TMP/log" 2>&1; then
    results+=("PASS  $name ($((SECONDS - t0))s)")
    tail -n 2 "$TMP/log"
  else
    results+=("FAIL  $name ($((SECONDS - t0))s)")
    fail=1
    tail -n 40 "$TMP/log"
  fi
}

# unset KE_* overrides that would leak into every run except TURNS handled above
unset KE_FACTION KE_MODE KE_VIEWPORT KE_TURNS

run "build (node build.js)" node build.js --js "$TMP/game.js"
run "syntax (node --check)" bash -c "cp '$TMP/game.js' '$TMP/game.cjs' && node --check '$TMP/game.cjs'"
run "build is reproducible (--check)" node build.js --check
run "smoke 2D OSM x$TURNS" node tests/smoke.js --faction=OSM --turns="$TURNS" --mode=2d
run "smoke 2D HUN x$TURNS" node tests/smoke.js --faction=HUN --turns="$TURNS" --mode=2d
run "smoke 2D VEN x$TURNS" node tests/smoke.js --faction=VEN --turns="$TURNS" --mode=2d
run "smoke 2D mobile POL x40" node tests/smoke.js --faction=POL --turns=40 --mode=2d --viewport=mobile
run "ui 2D" node tests/ui.js --mode=2d
run "smoke 3D OSM x20" node tests/smoke.js --faction=OSM --turns=20 --mode=3d

echo
echo "=== summary"
printf '%s\n' "${results[@]}"
[ "$fail" = 0 ] && echo "ALL PASSED" || echo "SOME CHECKS FAILED"
exit "$fail"
