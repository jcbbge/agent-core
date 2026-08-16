#!/usr/bin/env bash
# Acceptance criteria for AGNT-5b-ledger-refresh.
# Authored by ORCH close-residuals BEFORE implementation, per the spine verify
# gate (criteria come first; the author is not the implementer).
#
# NO MOCKS: asserts against the real files in ~/agent-core/primitives/rules/.
# Read-only — this script writes nothing.
#
# Exit 0 = all criteria met. Exit 1 = at least one red.

set -uo pipefail

ENF="$HOME/agent-core/primitives/rules/ENFORCEMENT.md"
WL="$HOME/agent-core/primitives/rules/worktree-lifecycle.md"

pass=0; fail=0
ok()   { printf 'PASS  %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf 'FAIL  %s\n' "$1"; fail=$((fail+1)); }
check(){ if [ "$1" = 0 ]; then ok "$2"; else bad "$2"; fi; }

# ── 1. The stale compilation note is gone ────────────────────────────────────
! grep -qE 'in flight|unwired at time of writing' "$WL"
check $? "1a worktree-lifecycle.md no longer says 'in flight' / 'unwired at time of writing'"
! grep -q 'update this row to HOOK' "$WL"
check $? "1b the stale 'update this row to HOOK' instruction is gone"

# ── 2. The ledger row tells the mixed truth, with evidence ───────────────────
ROW="$(grep -n '^| Worktree lifecycle' "$ENF" | head -1)"
[ -n "$ROW" ]
check $? "2a the ledger row still exists (${ROW%%:*:*})"

row_body="${ROW#*:}"
case "$row_body" in *DOOR*) ok "2b the row records DOOR" ;; *) bad "2b the row records DOOR" ;; esac
case "$row_body" in *DOCTRINE*) ok "2c the row still records the DOCTRINE gap" ;; *) bad "2c the row still records the DOCTRINE gap" ;; esac
case "$row_body" in *'cursor-finish:460'*) ok "2d the row cites cursor-finish:460" ;; *) bad "2d the row cites cursor-finish:460" ;; esac
case "$row_body" in *'spine-spawn --help'*) ok "2e the row cites spine-spawn --help" ;; *) bad "2e the row cites spine-spawn --help" ;; esac
case "$row_body" in *'none mechanical'*) bad "2f the stale 'none mechanical' enforcer cell is replaced" ;; *) ok "2f the stale 'none mechanical' enforcer cell is replaced" ;; esac

# A 5-column markdown row has exactly 6 pipes.
pipes="$(printf '%s' "$row_body" | tr -cd '|' | wc -c | tr -d ' ')"
[ "$pipes" = 6 ]
check $? "2g the row is still a 5-column table row (pipe count = $pipes, want 6)"

# Every other row in the table must still be 5-column too — a broken table is
# a silent regression. Baseline offender, measured 2026-08-16 before any edit:
# line 41 (`Brief validation on agent spawns`) carries 7 pipes because it quotes
# the regex `Agent\|Task` inside a cell. That is pre-existing and out of this
# unit's partition; the assertion is "no NEW offenders", not "zero offenders".
broken="$(awk '/^\| Law \| Source \| Enforcer \| Status \| Coverage \|/{t=1} t && /^\|/ && !/^\|---/ {n=gsub(/\|/,"|"); if (n!=6 && $0 !~ /Brief validation on agent spawns/) print NR": "n}' "$ENF")"
[ -z "$broken" ]
check $? "2h no new malformed rows in the ledger table (offenders beyond the known baseline: ${broken:-none})"

# ── 3. Section 7 names the split and the structural reason ──────────────────
SEC="$(awk '/^## 7\./{t=1} t{print} t && /^---$/{exit}' "$WL")"
[ -n "$SEC" ]
check $? "3a section 7 exists"
case "$SEC" in *DOOR*) ok "3b section 7 records DOOR" ;; *) bad "3b section 7 records DOOR" ;; esac
case "$SEC" in *DOCTRINE*) ok "3c section 7 keeps the DOCTRINE label for the gap" ;; *) bad "3c section 7 keeps the DOCTRINE label for the gap" ;; esac
case "$SEC" in *'cursor-finish'*) ok "3d section 7 cites the cursor-path door" ;; *) bad "3d section 7 cites the cursor-path door" ;; esac
case "$SEC" in *reap*) ok "3e section 7 names the reap verb" ;; *) bad "3e section 7 names the reap verb" ;; esac
# The structural reason: spine-spawn exits while the pane it spawned lives on.
if printf '%s' "$SEC" | grep -qiE 'exits (immediately|first)|while the pane|pane it spawned|out from under'; then
  ok "3f section 7 gives the structural reason for the spine-side gap"
else
  bad "3f section 7 gives the structural reason for the spine-side gap"
fi

# ── 4. Sparse-at-spawn is recorded as landed, not as a candidate ────────────
! grep -q 'candidate: sparse-at-spawn, teardown-door' "$ENF"
check $? "4a the 'candidate: sparse-at-spawn, teardown-door' placeholder is gone"

# ── 5. Partition respected ──────────────────────────────────────────────────
dirty="$(git -C "$HOME/agent-core" status --porcelain primitives/rules/ | awk '{print $2}' | sort)"
expected="$(printf 'primitives/rules/ENFORCEMENT.md\nprimitives/rules/worktree-lifecycle.md\n')"
[ "$dirty" = "$(printf '%s' "$expected")" ] || \
  [ "$(printf '%s\n' "$dirty" | grep -cvE 'ENFORCEMENT.md|worktree-lifecycle.md|control-flow.md')" = 0 ]
check $? "5a only the two partitioned rule files are modified (saw: $(printf '%s' "$dirty" | tr '\n' ' '))"

printf '\nTOTAL %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
