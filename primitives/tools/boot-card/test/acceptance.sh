#!/usr/bin/env bash
# acceptance.sh — boot-card oracles, one subcommand per VERIFY.toml contract
# line; `all` runs every check (the suite).
#
# Positive AND negative controls where the contract allows: exit-mirror
# verifies consistency on the live machine (whatever its state) AND that a
# bare fake HOME yields ✗ lines with exit 1 — a card that cannot fail proves
# nothing. The stamp oracles run each adapter standalone exactly as the
# brief's done-conditions specify (CC: stdin JSON; pi: fake-ctx handler
# smoke; cursor: echo '{}' | bash). Wake-touching paths run with
# CIRCADIAN_INTERNAL=1 or stdin closed so the suite itself stays
# side-effect-free (no scoreboard rows, no payload).
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
CARD="$DIR/boot-card.mjs"
HOOKS="$(cd "$DIR/../../hooks" && pwd)"
BUN="${BUN_BIN_PATH:-$HOME/.bun/bin/bun}"
CC_ADAPTER="$HOME/.tower/hooks/session-start.mjs"

exit_mirror() { # exit 0 iff every line ✓; any ✗ ⇒ exit 1
  out="$(env -u AGENT_CORE_ROOT "$BUN" "$CARD" --harness claude-code </dev/null)"
  code=$?
  if grep -q '✗' <<<"$out"; then want=1; else want=0; fi
  [[ "$code" -eq "$want" ]] || {
    echo "exit-mirror: FAIL (exit $code but card shows $(grep -c '✗' <<<"$out") ✗ line(s), want exit $want):" >&2
    echo "$out" >&2; return 1; }
  # negative control: a bare HOME must produce ✗ lines and exit 1
  FIX="$(mktemp -d)"
  trap 'rm -rf "$FIX"' RETURN
  out2="$(cd "$FIX" && env -u AGENT_CORE_ROOT HOME="$FIX" "$BUN" "$CARD" --harness claude-code </dev/null)"
  code2=$?
  [[ "$code2" -eq 1 ]] && grep -q '✗' <<<"$out2" || {
    echo "exit-mirror: FAIL (negative control: exit $code2, want 1 with ✗ lines):" >&2
    echo "$out2" >&2; return 1; }
  echo "exit-mirror: PASS"
}

stamp_cc() { # live claude-code adapter emits the [boot] stamp
  [[ -f "$CC_ADAPTER" ]] || { echo "stamp-cc: FAIL ($CC_ADAPTER missing)" >&2; return 1; }
  out="$(echo '{}' | "$BUN" "$CC_ADAPTER")"
  last="$(tail -1 <<<"$out")"
  grep -qE '^\[boot\] tower [✓✗].* · handoff [✓✗].* · flight [✓✗].* · memory: circadian hook$' <<<"$last" || {
    echo "stamp-cc: FAIL (last line is not the stamp):" >&2; echo "$out" >&2; return 1; }
  echo "stamp-cc: PASS"
}

stamp_pi() { # pi adapter handler smoke via fake ctx
  "$BUN" "$DIR/test/pi-smoke.mjs" || { echo "stamp-pi: FAIL" >&2; return 1; }
  echo "stamp-pi: PASS"
}

stamp_cursor() { # cursor adapter emits the stamp inside additional_context
  out="$(echo '{}' | CIRCADIAN_INTERNAL=1 bash "$HOOKS/session-boundary-cursor.sh")"
  ctx="$(jq -r '.additional_context // empty' <<<"$out" 2>/dev/null)"
  [[ -n "$ctx" ]] || { echo "stamp-cursor: FAIL (no additional_context):" >&2; echo "$out" >&2; return 1; }
  last="$(tail -1 <<<"$ctx")"
  grep -qE '^\[boot\] tower [✓✗].* · handoff [✓✗].* · flight [✓✗].* · memory [✓✗]' <<<"$last" || {
    echo "stamp-cursor: FAIL (last context line is not the stamp):" >&2; echo "$ctx" >&2; return 1; }
  echo "stamp-cursor: PASS"
}

probe_clean() { # a full card run leaves the circadian scoreboard untouched
  SB="$HOME/circadian/mind/scoreboard.jsonl"
  [[ -f "$SB" ]] || { echo "probe-clean: FAIL ($SB missing — cannot prove side-effect-freeness)" >&2; return 1; }
  before="$(wc -l < "$SB")"
  env -u AGENT_CORE_ROOT "$BUN" "$CARD" --harness claude-code </dev/null >/dev/null 2>&1
  after="$(wc -l < "$SB")"
  [[ "$before" -eq "$after" ]] || {
    echo "probe-clean: FAIL (scoreboard rows $before -> $after across a card run)" >&2; return 1; }
  echo "probe-clean: PASS"
}

case "${1:-all}" in
  exit-mirror)  exit_mirror ;;
  stamp-cc)     stamp_cc ;;
  stamp-pi)     stamp_pi ;;
  stamp-cursor) stamp_cursor ;;
  probe-clean)  probe_clean ;;
  all)
    rc=0
    for t in exit_mirror stamp_cc stamp_pi stamp_cursor probe_clean; do
      "$t" || rc=1
    done
    exit "$rc"
    ;;
  *)
    echo "usage: acceptance.sh {exit-mirror|stamp-cc|stamp-pi|stamp-cursor|probe-clean|all}" >&2
    exit 2
    ;;
esac
