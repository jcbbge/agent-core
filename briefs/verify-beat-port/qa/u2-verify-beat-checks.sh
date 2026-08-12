#!/usr/bin/env bash
# U2 verify-beat acceptance oracle
# Derived solely from verify-beat-port brief (agnt-u2) and locked design [U2];
# does NOT read or scrape bin/spine-spawn implementation source.
#
# Usage (from any cwd):
#   bash ~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh
#   bash ~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh [REPO_ROOT]
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed
#
# Environment (optional):
#   SKIP_MAKE=1     — skip make bifurcation checks (heavy / no herdr)
#   SKIP_PANE=1     — skip pane-count fail-before-topology check

set -euo pipefail

REPO_ROOT="${1:-/Users/jrg/herdr-spine}"
SPINE="python3 ${REPO_ROOT}/bin/spine-spawn"
# Marker store anchors to git common-dir parent (locked design), not the caller cwd.
_git_common="$(git -C "$REPO_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [[ -n "$_git_common" ]]; then
  VERIFY_DIR="$(dirname "$(realpath "$_git_common")")/.verify"
else
  VERIFY_DIR="${HOME}/herdr-spine/.verify"
fi
LEDGER="${HOME}/.tower/ledger.jsonl"
WORKTREE_ROOT="${HOME}/.spine/worktrees"
VERIFY_BEAT_DOC="${REPO_ROOT}/docs/verify-beat.md"

failures=0
tmpdir=""
test_brief=""
test_key=""

fail() {
  echo "FAIL [$1]: $2" >&2
  failures=$((failures + 1))
}

pass() {
  echo "PASS [$1]: $2"
}

skip() {
  echo "SKIP [$1]: $2"
}

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "FAIL: required command missing: $1" >&2
    exit 1
  fi
}

unit_key() {
  python3 -c '
import hashlib, os, sys
print(hashlib.sha1(os.path.realpath(sys.argv[1]).encode()).hexdigest()[:16])
' "$1"
}

# Capture helpers write into named vars (avoid subshell exit-code loss from $(...)).
capture_stderr() {
  local __out_var="$1" __rc_var="$2"
  shift 2
  local errf rc
  errf="$(mktemp)"
  set +e
  # shellcheck disable=SC2068
  "$@" 2>"$errf" >/dev/null
  rc=$?
  set -e
  printf -v "$__out_var" '%s' "$(<"$errf")"
  printf -v "$__rc_var" '%s' "$rc"
  rm -f "$errf"
}

capture_combined() {
  local __out_var="$1" __rc_var="$2"
  shift 2
  local outf rc
  outf="$(mktemp)"
  set +e
  # shellcheck disable=SC2068
  "$@" >"$outf" 2>&1
  rc=$?
  set -e
  printf -v "$__out_var" '%s' "$(<"$outf")"
  printf -v "$__rc_var" '%s' "$rc"
  rm -f "$outf"
}

capture_stdout_stderr() {
  local __stdout_var="$1" __stderr_var="$2" __rc_var="$3"
  shift 3
  local outf errf rc
  outf="$(mktemp)"
  errf="$(mktemp)"
  set +e
  # shellcheck disable=SC2068
  "$@" >"$outf" 2>"$errf"
  rc=$?
  set -e
  printf -v "$__stdout_var" '%s' "$(<"$outf")"
  printf -v "$__stderr_var" '%s' "$(<"$errf")"
  printf -v "$__rc_var" '%s' "$rc"
  rm -f "$outf" "$errf"
}

ledger_bypass_row() {
  python3 -c '
import json, sys
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        row = json.loads(line)
    except json.JSONDecodeError:
        continue
    if row.get("kind") == "verify-gate-bypass":
        print(line)
'
}

refusal_names_fix_and_law() {
  local text="$1"
  local has_fix=0
  local has_law=0
  if echo "$text" | grep -Eqi 'verify-mark|spine-spawn make'; then
    has_fix=1
  fi
  if echo "$text" | grep -Eqi 'test agent is NOT the implementation agent|criteria.*BEFORE code|criteria come BEFORE code'; then
    has_law=1
  fi
  [[ $has_fix -eq 1 && $has_law -eq 1 ]]
}

pane_ids() {
  if command -v herdr &>/dev/null; then
    herdr pane list -q 2>/dev/null | sort -u || true
  else
    echo ""
  fi
}

cleanup() {
  if [[ -n "$test_key" && -d "${VERIFY_DIR}/${test_key}" ]]; then
    rm -rf "${VERIFY_DIR}/${test_key}"
  fi
  if [[ -n "$tmpdir" && -d "$tmpdir" ]]; then
    rm -rf "$tmpdir"
  fi
}
trap cleanup EXIT

require_cmd python3

if [[ ! -x "${REPO_ROOT}/bin/spine-spawn" && ! -f "${REPO_ROOT}/bin/spine-spawn" ]]; then
  echo "FAIL: spine-spawn not found at ${REPO_ROOT}/bin/spine-spawn" >&2
  exit 1
fi

tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/u2-verify-beat.XXXXXX")"
test_brief="${tmpdir}/u2-unmarked-brief.md"
cat >"$test_brief" <<'EOF'
# U2 verify-beat smoke brief (test oracle only)

Acceptance criteria for the verify-beat port. This brief is intentionally
unmarked at test start; the gate must refuse coder spawns until verify-mark.
EOF
test_key="$(unit_key "$test_brief")"

# Ensure the unit starts unmarked for gate-refuse checks.
rm -rf "${VERIFY_DIR}/${test_key}"

echo "=== U2 verify-beat checks (repo=${REPO_ROOT}, unit=${test_key}) ==="

# --- (a) Unmarked coder refuse: --kind pi ---
capture_stderr pi_stderr pi_rc $SPINE worker --kind pi --profile coder --brief "$test_brief" --label u2-refuse-pi
if [[ $pi_rc -eq 0 ]]; then
  fail "a-pi-refuse" "unmarked coder --kind pi exited 0 (expected nonzero refuse)"
else
  pass "a-pi-refuse" "unmarked coder --kind pi exited $pi_rc (refused)"
fi
if refusal_names_fix_and_law "$pi_stderr"; then
  pass "a-pi-refuse-msg" "refusal stderr names fix (verify-mark or make) and isolation law"
else
  fail "a-pi-refuse-msg" "refusal stderr missing fix+law contract"
  echo "$pi_stderr" | head -20 >&2
fi
if echo "$pi_stderr" | grep -Eqi 'VERIFY GATE|verify gate|implementation REFUSED'; then
  pass "a-pi-refuse-gate" "refusal stderr identifies verify gate"
else
  fail "a-pi-refuse-gate" "refusal stderr does not identify verify gate"
fi

# --- (a) Unmarked coder refuse: --kind claude ---
capture_stderr claude_stderr claude_rc $SPINE worker --kind claude --profile coder --brief "$test_brief" --label u2-refuse-claude
if [[ $claude_rc -eq 0 ]]; then
  fail "a-claude-refuse" "unmarked coder --kind claude exited 0 (expected nonzero refuse)"
else
  pass "a-claude-refuse" "unmarked coder --kind claude exited $claude_rc (refused)"
fi
if refusal_names_fix_and_law "$claude_stderr"; then
  pass "a-claude-refuse-msg" "claude refusal stderr names fix and isolation law"
else
  fail "a-claude-refuse-msg" "claude refusal stderr missing fix+law contract"
fi

# --- (8) Coder without --brief REFUSED (no unit to gate) ---
capture_stderr nobrief_stderr nobrief_rc $SPINE worker --kind pi --profile coder --label u2-no-brief --prompt 'coder without brief'
if [[ $nobrief_rc -eq 0 ]]; then
  fail "a-no-brief" "coder without --brief exited 0 (expected refuse)"
else
  pass "a-no-brief" "coder without --brief exited $nobrief_rc (refused)"
fi
if echo "$nobrief_stderr" | grep -Eqi 'brief|unit|VERIFY GATE|verify gate'; then
  pass "a-no-brief-msg" "no-brief refusal mentions brief/unit/gate"
else
  fail "a-no-brief-msg" "no-brief refusal does not explain missing unit"
fi

# --- Gate fails before topology mutation (pane count unchanged) ---
if [[ "${SKIP_PANE:-0}" == "1" ]]; then
  skip "a-fail-before-topology" "SKIP_PANE=1"
elif command -v herdr &>/dev/null; then
  before_panes="$(pane_ids)"
  set +e
  $SPINE worker --kind pi --profile coder --brief "$test_brief" --label u2-topology-guard >/dev/null 2>&1
  set -e
  after_panes="$(pane_ids)"
  if [[ "$before_panes" == "$after_panes" ]]; then
    pass "a-fail-before-topology" "refused coder spawn did not change herdr pane set"
  else
    fail "a-fail-before-topology" "pane set changed after refused coder spawn (gate may run too late)"
    echo "before:${before_panes}" >&2
    echo "after:${after_panes}" >&2
  fi
else
  skip "a-fail-before-topology" "herdr CLI not available for pane snapshot"
fi

# --- (b) verify-mark then verify-status exit 0 ---
capture_combined mark_out mark_rc $SPINE verify-mark "$test_brief"
if [[ $mark_rc -eq 0 ]]; then
  pass "b-verify-mark" "verify-mark exited 0"
else
  fail "b-verify-mark" "verify-mark exited $mark_rc"
  echo "$mark_out" | head -10 >&2
fi

marker_path="${VERIFY_DIR}/${test_key}/.authored"
if [[ -f "$marker_path" ]]; then
  pass "b-marker-file" "marker exists at .verify/<key>/.authored"
else
  fail "b-marker-file" "missing marker at ${marker_path}"
fi

set +e
status_out="$($SPINE verify-status "$test_brief" 2>&1)"
status_rc=$?
set -e
if [[ $status_rc -eq 0 ]]; then
  pass "b-verify-status" "verify-status exited 0 after verify-mark"
else
  fail "b-verify-status" "verify-status exited $status_rc (expected 0 after mark)"
  echo "$status_out" >&2
fi
if echo "$status_out" | grep -Eqi "authored|$test_key"; then
  pass "b-verify-status-out" "verify-status output reports authored unit"
else
  fail "b-verify-status-out" "verify-status output missing authored/key signal"
fi

# verify-status on a fresh unmarked brief must exit 1
fresh_brief="${tmpdir}/u2-still-unmarked.md"
echo "# still unmarked" >"$fresh_brief"
set +e
missing_out="$($SPINE verify-status "$fresh_brief" 2>&1)"
missing_rc=$?
set -e
if [[ $missing_rc -eq 1 ]]; then
  pass "b-verify-status-missing" "verify-status exits 1 when marker missing"
else
  fail "b-verify-status-missing" "verify-status exited $missing_rc (expected 1 when missing)"
fi
if echo "$missing_out" | grep -Eqi 'MISSING|missing'; then
  pass "b-verify-status-missing-out" "verify-status reports MISSING for unmarked unit"
else
  fail "b-verify-status-missing-out" "verify-status missing output does not say MISSING"
fi

# --- (c) make bifurcates into two distinct cwd checkouts (pi + claude) ---
make_check_kind() {
  local kind="$1"
  local slug="u2-smoke-${kind}-$$"
  local brief="${tmpdir}/u2-make-${kind}-$$.md"
  local key
  key="$(unit_key "$brief")"

  cat >"$brief" <<EOF
# U2 make smoke (${kind})

Brief for make bifurcation acceptance. Each make run must fork implementer and
test-maker into separate git worktrees under ~/.spine/worktrees/.
EOF

  rm -rf "${VERIFY_DIR}/${key}"

  local make_stdout make_stderr make_rc
  capture_stdout_stderr make_stdout make_stderr make_rc $SPINE make "$slug" --kind "$kind" --brief "$brief"

  if [[ $make_rc -ne 0 ]]; then
    fail "c-make-${kind}" "make --kind ${kind} exited $make_rc"
    echo "$make_stderr" | head -30 >&2
    echo "$make_stdout" | head -10 >&2
    return
  fi
  pass "c-make-${kind}" "make --kind ${kind} exited 0"

  if echo "$make_stdout" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    pass "c-make-${kind}-json" "make stdout is valid JSON"
  else
    fail "c-make-${kind}-json" "make stdout is not valid JSON"
    echo "$make_stdout" | head -10 >&2
    echo "$make_stderr" | head -10 >&2
    return
  fi

  local paths
  paths="$(echo "$make_stdout" | python3 -c '
import json, sys
d = json.load(sys.stdin)
paths = []

def harvest(obj):
    if isinstance(obj, dict):
        for k in ("impl_cwd", "test_cwd", "impl_dir", "test_dir", "coder_cwd", "test_maker_cwd", "cwd", "path"):
            v = obj.get(k)
            if isinstance(v, str) and v:
                paths.append(v)
        for k in ("impl", "test", "coder", "test_maker"):
            v = obj.get(k)
            if isinstance(v, dict):
                harvest(v)
        for v in obj.values():
            if isinstance(v, str) and "/.spine/worktrees/" in v:
                paths.append(v)
            elif isinstance(v, dict):
                harvest(v)
    elif isinstance(obj, list):
        for item in obj:
            harvest(item)

harvest(d)
print("\n".join(dict.fromkeys(paths)))
' 2>/dev/null || true)"

  if [[ -z "$paths" ]]; then
    # Fall back: discover impl + test worktrees by slug under WORKTREE_ROOT
    local impl_wt test_wt
    impl_wt="$(find "$WORKTREE_ROOT" -mindepth 1 -maxdepth 6 -type d -name "$slug" 2>/dev/null | head -1 || true)"
    test_wt="$(find "$WORKTREE_ROOT" -mindepth 1 -maxdepth 6 -type d -name "${slug}-test" 2>/dev/null | head -1 || true)"
    paths=""
    [[ -n "$impl_wt" ]] && paths="${impl_wt}"
    [[ -n "$test_wt" ]] && paths="${paths}"$'\n'"${test_wt}"
  fi

  local path_count
  path_count="$(echo "$paths" | grep -c . || true)"
  if [[ "$path_count" -lt 2 ]]; then
    fail "c-make-${kind}-two-cwd" "expected two distinct cwd/worktree paths; got ${path_count}"
    echo "$make_stdout" >&2
    return
  fi

  local unique
  unique="$(echo "$paths" | sort -u | grep -c . || true)"
  if [[ "$unique" -ge 2 ]]; then
    pass "c-make-${kind}-two-cwd" "make produced ${unique} distinct checkout path(s)"
  else
    fail "c-make-${kind}-two-cwd" "make paths are not distinct (${unique} unique)"
  fi

  if echo "$make_stdout" | grep -Eqi 'agnt-'"${slug}"'|agnt-'"${slug}"'-test'; then
    pass "c-make-${kind}-labels" "make output references agnt-<slug> / agnt-<slug>-test labels"
  else
    # Labels may only appear in spawn metadata; worktree distinctness is the hard requirement.
    skip "c-make-${kind}-labels" "label strings not found in JSON (worktree check is authoritative)"
  fi
}

if [[ "${SKIP_MAKE:-0}" == "1" ]]; then
  skip "c-make-pi" "SKIP_MAKE=1"
  skip "c-make-claude" "SKIP_MAKE=1"
else
  make_check_kind pi
  make_check_kind claude
fi

# --- (9) Non-coder profile must not trip verify gate (behavior unchanged at gate) ---
noncoder_brief="${tmpdir}/u2-noncoder.md"
echo "# non-coder gate control" >"$noncoder_brief"
capture_stderr noncoder_stderr noncoder_rc $SPINE worker --kind pi --profile orchestrator --brief "$noncoder_brief" --label u2-noncoder
if echo "$noncoder_stderr" | grep -Eqi 'VERIFY GATE|verify gate.*REFUSED|no test criteria authored'; then
  fail "noncoder-unchanged" "orchestrator profile hit verify gate (should only gate coder)"
else
  pass "noncoder-unchanged" "orchestrator profile did not hit verify gate (rc=$noncoder_rc)"
fi

# --- (d) Break-glass: SPINE_VERIFY_GATE=off warns + ledger audit row ---
break_brief="${tmpdir}/u2-breakglass.md"
echo "# break-glass brief" >"$break_brief"
rm -rf "${VERIFY_DIR}/$(unit_key "$break_brief")"

ledger_before=0
if [[ -f "$LEDGER" ]]; then
  ledger_before="$(wc -l <"$LEDGER" | tr -d ' ')"
fi

capture_stderr bg_stderr bg_rc env SPINE_VERIFY_GATE=off $SPINE worker --kind pi --profile coder --brief "$break_brief" --label u2-breakglass

if echo "$bg_stderr" | grep -Eqi 'WARN|BYPASS|break-glass|SPINE_VERIFY_GATE'; then
  pass "d-breakglass-warn" "SPINE_VERIFY_GATE=off emits loud stderr warning"
else
  fail "d-breakglass-warn" "break-glass stderr missing WARN/BYPASS signal"
  echo "$bg_stderr" | head -20 >&2
fi

if [[ -f "$LEDGER" ]]; then
  if tail -n 20 "$LEDGER" | ledger_bypass_row | grep -E '"via"[[:space:]]*:[[:space:]]*"spine-spawn"' >/dev/null; then
    pass "d-breakglass-ledger" "ledger contains verify-gate-bypass row via spine-spawn"
  else
    fail "d-breakglass-ledger" "ledger missing recent verify-gate-bypass via spine-spawn row"
  fi
  if tail -n 20 "$LEDGER" | ledger_bypass_row | grep -F "$break_brief" >/dev/null; then
    pass "d-breakglass-ledger-brief" "ledger bypass row references break-glass brief"
  else
    # Brief may be realpath-normalized in ledger; accept any new bypass row after our call.
    ledger_after="$(wc -l <"$LEDGER" | tr -d ' ')"
    if [[ "$ledger_after" -gt "$ledger_before" ]] && tail -n 5 "$LEDGER" | ledger_bypass_row >/dev/null; then
      pass "d-breakglass-ledger-brief" "ledger appended verify-gate-bypass row (brief path may be normalized)"
    else
      fail "d-breakglass-ledger-brief" "no new verify-gate-bypass ledger row detected"
    fi
  fi
else
  fail "d-breakglass-ledger" "ledger file missing at ${LEDGER}"
fi

# --- Implementer done-when: docs/verify-beat.md exists ---
if [[ -f "$VERIFY_BEAT_DOC" ]]; then
  pass "doc-verify-beat" "docs/verify-beat.md exists"
  if grep -Eqi 'verify.?gate|verify-mark|test.agent|criteria.*before|Plan.*Implementation|bifurcat' "$VERIFY_BEAT_DOC"; then
    pass "doc-verify-beat-content" "docs/verify-beat.md summarizes the spine verify wall"
  else
    fail "doc-verify-beat-content" "docs/verify-beat.md missing verify-wall summary language"
  fi
else
  fail "doc-verify-beat" "docs/verify-beat.md missing (implementer deliverable)"
fi

echo "---"
if [[ $failures -gt 0 ]]; then
  echo "RESULT: $failures check(s) failed" >&2
  exit 1
fi

echo "RESULT: all acceptance checks passed"
exit 0
