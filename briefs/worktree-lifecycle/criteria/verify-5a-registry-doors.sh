#!/usr/bin/env bash
# Acceptance criteria for AGNT-5a-registry-doors.
# Authored by ORCH close-residuals BEFORE implementation, per the spine verify
# gate (criteria come first; the author is not the implementer).
#
# NO MOCKS: runs the real `agent-core` binary against the real
# ~/.agent-core/registry, and proves absence-detection against real copies of
# the real door files. It never writes to ~/cursor-shim or ~/herdr-spine.
#
# Exit 0 = all criteria met. Exit 1 = at least one red.

set -uo pipefail

REG="$HOME/.agent-core/registry"
CURSOR_DOOR="$HOME/cursor-shim/cursor-finish"
SPINE_DOOR="$HOME/herdr-spine/bin/spine-spawn"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/verify5a-XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

pass=0; fail=0
ok()   { printf 'PASS  %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf 'FAIL  %s\n' "$1"; fail=$((fail+1)); }
check(){ if [ "$1" = 0 ]; then ok "$2"; else bad "$2"; fi; }

# ── 1. Both doors registered as check-only machine entries ───────────────────
grep -qE '^[[:space:]]*check[[:space:]]+machine[[:space:]]+.*cursor-shim/cursor-finish#.+' "$REG"
check $? "1a registry has a 'check machine' entry with a needle for cursor-finish"

grep -qE '^[[:space:]]*check[[:space:]]+machine[[:space:]]+.*herdr-spine/bin/spine-spawn#.+' "$REG"
check $? "1b registry has a 'check machine' entry with a needle for spine-spawn"

# ── 2. The needles are actually present in the real doors today ──────────────
needle_for() { # $1 = path fragment
  grep -E "^[[:space:]]*check[[:space:]]+machine[[:space:]]+.*$1#" "$REG" \
    | head -1 | sed 's/^[^#]*#//'
}
CN="$(needle_for 'cursor-shim/cursor-finish')"
SN="$(needle_for 'herdr-spine/bin/spine-spawn')"

if [ -n "$CN" ] && grep -qF -- "$CN" "$CURSOR_DOOR"; then ok "2a cursor needle present in the real cursor-finish: $CN"
else bad "2a cursor needle absent or empty (needle='$CN')"; fi
if [ -n "$SN" ] && grep -qF -- "$SN" "$SPINE_DOOR"; then ok "2b spine needle present in the real spine-spawn: $SN"
else bad "2b spine needle absent or empty (needle='$SN')"; fi

# The needle must be specific to the door, not incidental boilerplate.
case "$CN" in *trap*|*cleanup*) ok "2c cursor needle names the teardown door itself" ;;
  *) bad "2c cursor needle does not name the teardown door (got '$CN')" ;; esac
case "$SN" in *reap*) ok "2d spine needle names the reap door itself" ;;
  *) bad "2d spine needle does not name the reap door (got '$SN')" ;; esac

# ── 3. Real `agent-core status` reports both rows, and reports them ok ───────
# `agent-core status` emits ANSI colour even when stdout is not a TTY, so every
# capture below is stripped before matching.
strip_ansi() { sed -E 's/'$'\033''\[[0-9;]*m//g'; }
STATUS="$TMP/status.txt"
( cd "$HOME/agent-core" && agent-core status ) 2>&1 | strip_ansi >"$STATUS"
grep -q 'cursor-shim/cursor-finish' "$STATUS"
check $? "3a agent-core status has a row for cursor-finish"
grep -q 'herdr-spine/bin/spine-spawn' "$STATUS"
check $? "3b agent-core status has a row for spine-spawn"
grep -E 'cursor-shim/cursor-finish|herdr-spine/bin/spine-spawn' "$STATUS" | grep -qv '✓' && \
  bad "3c both door rows are ok (found a non-ok row)" || ok "3c both door rows are ok"
grep -qE '^summary: [0-9]+ ok +0 stale +0 missing' "$STATUS"
check $? "3d summary line reports 0 stale and 0 missing ($(grep -E '^summary:' "$STATUS" | tail -1))"

# ── 4. Absence detection, proven — the whole point of the entry ──────────────
# Copy both doors and the registry into a fixture, repoint the two check lines
# at the copies, confirm ok, then delete the needle from each copy and confirm
# the row flips away from ok. Nothing outside $TMP is written.
mkdir -p "$TMP/doors"
cp "$CURSOR_DOOR" "$TMP/doors/cursor-finish"
cp "$SPINE_DOOR"  "$TMP/doors/spine-spawn"
python3 - "$REG" "$TMP/registry" "$TMP/doors" <<'PY'
import sys, re
src, dst, doors = sys.argv[1], sys.argv[2], sys.argv[3]
out = []
for line in open(src):
    m = re.match(r'^(\s*check\s+machine\s+)(\S*?(cursor-finish|spine-spawn))(#.*)$', line.rstrip('\n'))
    if m:
        name = 'cursor-finish' if 'cursor-finish' in m.group(2) else 'spine-spawn'
        line = f"{m.group(1)}{doors}/{name}{m.group(4)}\n"
    out.append(line)
open(dst, 'w').writelines(out)
PY
( cd "$HOME/agent-core" && agent-core --registry "$TMP/registry" status ) 2>&1 | strip_ansi >"$TMP/fixture-ok.txt" 2>&1
grep -q "$TMP/doors/cursor-finish" "$TMP/fixture-ok.txt" && grep -q "$TMP/doors/spine-spawn" "$TMP/fixture-ok.txt"
check $? "4a fixture registry points both check rows at the door copies"

perturb() { # $1 = file, $2 = needle
  python3 - "$1" "$2" <<'PY'
import sys
path, needle = sys.argv[1], sys.argv[2]
body = open(path, encoding='utf-8', errors='surrogateescape').read()
open(path, 'w', encoding='utf-8', errors='surrogateescape').write(body.replace(needle, '# DOOR REMOVED BY ACCEPTANCE TEST'))
PY
}
perturb "$TMP/doors/cursor-finish" "$CN"
perturb "$TMP/doors/spine-spawn"  "$SN"
( cd "$HOME/agent-core" && agent-core --registry "$TMP/registry" status ) 2>&1 | strip_ansi >"$TMP/fixture-broken.txt" 2>&1
c_line="$(grep "$TMP/doors/cursor-finish" "$TMP/fixture-broken.txt" | tail -1)"
s_line="$(grep "$TMP/doors/spine-spawn"  "$TMP/fixture-broken.txt" | tail -1)"
case "$c_line" in *'✓'*|'') bad "4b removing the cursor door flips its row off ok (got: ${c_line:-<no row>})" ;;
  *) ok "4b removing the cursor door flips its row off ok (got: $c_line)" ;; esac
case "$s_line" in *'✓'*|'') bad "4c removing the spine door flips its row off ok (got: ${s_line:-<no row>})" ;;
  *) ok "4c removing the spine door flips its row off ok (got: $s_line)" ;; esac

# ── 5. The real doors and the real registry are untouched by this run ────────
grep -qF -- "$CN" "$CURSOR_DOOR" && grep -qF -- "$SN" "$SPINE_DOOR"
check $? "5a the real door files still carry their needles after the run"

# ── 6. The standing exclusion note is amended, not deleted ──────────────────
grep -q 'Enforcement estate deliberately NOT registered this pass' "$REG"
check $? "6a the original exclusion note survives"
awk '/Enforcement estate deliberately NOT registered this pass/,0' "$REG" \
  | grep -qiE 'worktree|exception|door'
check $? "6b the exclusion note records the worktree-door exception and its reason"

printf '\nTOTAL %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
