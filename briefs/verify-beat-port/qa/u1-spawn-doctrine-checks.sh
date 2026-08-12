#!/usr/bin/env bash
# U1 spawn-path doctrine acceptance oracle
# Derived solely from verify-beat-port brief (agnt-u1); does not encode implementation.
# Usage: u1-spawn-doctrine-checks.sh [REPO_ROOT]
# Exits nonzero on any failure.

set -euo pipefail

REPO_ROOT="${1:-${REPO_ROOT:-}}"
if [[ -z "$REPO_ROOT" ]]; then
  if git rev-parse --show-toplevel &>/dev/null 2>&1; then
    REPO_ROOT="$(git rev-parse --show-toplevel)"
  else
    echo "FAIL: pass REPO_ROOT or run inside the herdr-spine checkout" >&2
    exit 1
  fi
fi

SPAWN_MD="$REPO_ROOT/docs/spawn.md"
CTL_FLEET="$REPO_ROOT/docs/ctl-fleet.md"
ctl_exit=1
ctl_output=""

failures=0

fail() {
  echo "FAIL [$1]: $2" >&2
  failures=$((failures + 1))
}

pass() {
  echo "PASS [$1]: $2"
}

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "FAIL: required file missing: $1" >&2
    exit 1
  fi
}

require_file "$SPAWN_MD"

# --- Criterion 1a: harness-homogeneous language + pi/claude/cursor examples ---
if grep -Eqi 'harness[- ]homogeneous|harness homogeneous|homogeneous.*harness|root spawn.*harness|harness defines every' "$SPAWN_MD"; then
  pass "1a" "harness-homogeneous language present"
else
  fail "1a" "missing harness-homogeneous language (root spawn defines downstream harness)"
fi

if grep -qi '\bpi\b' "$SPAWN_MD" && grep -Eqi 'claude(-code)?' "$SPAWN_MD" && grep -qi '\bcursor\b' "$SPAWN_MD"; then
  pass "1a" "pi, claude-code, and cursor examples present"
else
  fail "1a" "missing pi / claude-code / cursor harness examples"
fi

# --- Criterion 1b: both per-harness spawn-path families ---
if grep -qE 'spine-spawn .*--kind (pi\|claude|pi|claude)' "$SPAWN_MD"; then
  pass "1b" "spine-spawn --kind pi|claude family documented"
else
  fail "1b" "missing spine-spawn --kind pi|claude spawn-path family"
fi

if grep -qi 'cursor-fleet' "$SPAWN_MD" && grep -qi 'cursor-spine' "$SPAWN_MD"; then
  pass "1b" "cursor-fleet and cursor-spine paths documented"
else
  fail "1b" "missing cursor-fleet / cursor-spine spawn paths"
fi

# --- Criterion 1c: cost-determined / operator intake harness choice ---
if grep -Eqi 'cost[- ]determined|operator intake|per-mission|per mission|per session|operator.*decision' "$SPAWN_MD"; then
  pass "1c" "cost-determined / operator intake harness-choice language present"
else
  fail "1c" "missing cost-determined or operator intake harness-choice language"
fi

# --- Criterion 1d: pi open-source + inference-gateway distinction ---
if grep -Eqi 'open[- ]source' "$SPAWN_MD" && grep -Eqi 'inference[- ]gateway' "$SPAWN_MD"; then
  pass "1d" "pi open-source + inference-gateway distinction present"
else
  fail "1d" "missing pi open-source and/or inference-gateway distinction"
fi

# --- Criterion 1e: agnostic-by-design + exact operator quote ---
if grep -Eqi 'agnostic.by.design|agnostic by design|no.*harness preference|harness preference' "$SPAWN_MD"; then
  pass "1e" "agnostic-by-design / no harness preference language present"
else
  fail "1e" "missing agnostic-by-design or no-harness-preference language"
fi

if grep -qF 'IM AGNOSTIC BY DESIGN' "$SPAWN_MD"; then
  pass "1e" 'exact operator quote "IM AGNOSTIC BY DESIGN" present'
else
  fail "1e" 'exact operator quote "IM AGNOSTIC BY DESIGN" missing'
fi

# --- Criterion 1f: spine-spawn cursor-refusal as partition boundary ---
if grep -Eqi 'partition boundary|partition-boundary|refus(e|es).*cursor|--kind cursor' "$SPAWN_MD"; then
  pass "1f" "spine-spawn cursor-refusal / partition-boundary language present"
else
  fail "1f" "missing spine-spawn cursor-refusal or partition-boundary documentation"
fi

# --- Criterion 1g: Structural delta / tab2-ORCH / tab3-workers preserved ---
if grep -qi 'structural delta' "$SPAWN_MD"; then
  pass "1g" "Structural delta section heading present"
else
  fail "1g" "missing Structural delta section content"
fi

if grep -Eqi 'tab2.*ORCH|tab 2.*ORCH|ORCH.*tab2' "$SPAWN_MD" && grep -Eqi 'tab3.*worker|tab 3.*worker|worker.*tab3' "$SPAWN_MD"; then
  pass "1g" "tab2=ORCH and tab3=workers topology language present"
else
  fail "1g" "missing tab2=ORCH / tab3=workers topology language in Structural delta"
fi

# --- Spawn-path doctrine section exists (task 1 scope) ---
if grep -q '^## Spawn-path doctrine' "$SPAWN_MD"; then
  pass "task-1" "## Spawn-path doctrine section present"
else
  fail "task-1" "missing ## Spawn-path doctrine section"
fi

# --- Task 2: line ~21 comment must not supersede --kind pi for fleet work ---
line21="$(sed -n '21p' "$SPAWN_MD" 2>/dev/null || true)"
if [[ -n "$line21" ]] && echo "$line21" | grep -Eqi 'superseded.*(--kind pi|pi.*fleet|fleet.*pi)|--kind pi.*superseded'; then
  fail "task-2" "line 21 still frames --kind pi as superseded for fleet work: $line21"
else
  pass "task-2" "line 21 does not supersede --kind pi for fleet work"
fi

# --- Task 3: lines ~207-208 must not frame pi as superseded for fleet work ---
block_207_208="$(sed -n '205,210p' "$SPAWN_MD" 2>/dev/null || true)"
if echo "$block_207_208" | grep -Eqi 'superseded for fleet work'; then
  fail "task-3" "lines ~207-208 still frame pi path as superseded for fleet work"
else
  pass "task-3" "lines ~207-208 do not frame pi as superseded for fleet work"
fi

# --- Task 4: rg self-check — no universal-law harness framing ---
echo "--- task-4 rg: superseded|THE (fleet )?spawn path|cursor-shim is ---"
rg_output="$(rg -n -i 'superseded|THE (fleet )?spawn path|cursor-shim is' "$SPAWN_MD" 2>/dev/null || true)"
if [[ -n "$rg_output" ]]; then
  echo "$rg_output"
  if echo "$rg_output" | grep -Eqi 'superseded for fleet work|THE (fleet )?spawn path|cursor-shim is (the|THE)|all new fleet.*cursor|universal'; then
    fail "task-4" "rg output frames one harness as universal fleet spawn law"
  else
    pass "task-4" "rg hits present but none frame one harness as universal fleet spawn law"
  fi
else
  echo "(no matches)"
  pass "task-4" "rg clean — no superseded/universal-spawn-path/cursor-shim-is hits"
fi

# --- Absence of wrong universal-cursor framing (brief wrong patterns) ---
if grep -Eqi 'all new fleet spawns are kind=cursor|all new fleet.*cursor-shim|superseded for fleet work' "$SPAWN_MD"; then
  fail "universal-law" "document still contains wrong universal-cursor or pi-superseded-for-fleet framing"
else
  pass "universal-law" "no All-NEW-fleet-cursor or pi-superseded-for-fleet-work framing"
fi

# --- Task 5: ctl-fleet.md grep (report only; amend only if harness-preference hit) ---
if [[ -f "$CTL_FLEET" ]]; then
  echo "--- task-5 rg: cursor|spawn-path|superseded in docs/ctl-fleet.md ---"
  set +e
  ctl_output="$(rg -n -i 'cursor|spawn-path|superseded' "$CTL_FLEET" 2>&1)"
  ctl_exit=$?
  set -e
  echo "exit code: $ctl_exit"
  if [[ -n "$ctl_output" ]]; then
    echo "$ctl_output"
    if echo "$ctl_output" | grep -Eqi 'spawn-path|superseded|harness preference|THE (fleet )?spawn'; then
      fail "task-5" "ctl-fleet.md contains spawn-path or harness-preference framing — amend required"
    else
      pass "task-5" "ctl-fleet.md rg hits are not harness-preference spawn-path framing"
    fi
  else
    echo "(no matches)"
    pass "task-5" "ctl-fleet.md rg returned zero matches (expected per ORCH pre-check)"
  fi
else
  pass "task-5" "docs/ctl-fleet.md not present — skip ctl-fleet grep"
fi

# --- Diff partition: only docs/spawn.md (and ctl-fleet.md only if task-5 justified) ---
if git -C "$REPO_ROOT" rev-parse --git-dir &>/dev/null 2>&1; then
  changed_files="$(git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null; git -C "$REPO_ROOT" diff --name-only --cached HEAD 2>/dev/null)"
  changed_files="$(echo "$changed_files" | sort -u | grep -v '^$' || true)"
  if [[ -n "$changed_files" ]]; then
    bad=0
    while IFS= read -r f; do
      [[ -z "$f" ]] && continue
      case "$f" in
        docs/spawn.md) ;;
        docs/ctl-fleet.md)
          if echo "${ctl_output:-}" | grep -Eqi 'spawn-path|superseded|harness preference'; then
            :
          else
            echo "WARN: docs/ctl-fleet.md changed but ctl-fleet grep did not justify amend" >&2
            bad=1
          fi
          ;;
        *)
          fail "partition" "unexpected changed file outside partition: $f"
          bad=1
          ;;
      esac
    done <<< "$changed_files"
    if [[ $bad -eq 0 ]]; then
      pass "partition" "diff touches only docs/spawn.md (and ctl-fleet.md only if justified)"
    fi
  else
    pass "partition" "no uncommitted diff vs HEAD (integrated tree or clean — partition check skipped)"
  fi
else
  pass "partition" "not a git checkout — partition diff check skipped"
fi

echo "---"
if [[ $failures -gt 0 ]]; then
  echo "RESULT: $failures check(s) failed" >&2
  exit 1
fi

echo "RESULT: all acceptance checks passed"
exit 0
