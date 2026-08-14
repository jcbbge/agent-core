#!/usr/bin/env bash
# truth-law.sh — binary-level oracles for slim's truth-law contract lines.
# Each subcommand is one cheap, deterministic check against the built
# binary (zig-out/bin/slim), invoked as component-verify's oracle for the
# matching VERIFY.toml contract line. Exit 0 = holds, non-zero = violated.
#
# component-verify manifest: ../VERIFY.toml
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$DIR/zig-out/bin/slim"

if [[ ! -x "$BIN" ]]; then
  (cd "$DIR" && zig build >/dev/null 2>&1)
fi
if [[ ! -x "$BIN" ]]; then
  echo "slim binary not found and could not be built at $BIN" >&2
  exit 1
fi

case "${1:-}" in
  exit-codes)
    # A failing child's exit code propagates through slim unchanged.
    /bin/ps --this-flag-does-not-exist >/dev/null 2>&1
    want=$?
    "$BIN" ps --this-flag-does-not-exist >/dev/null 2>&1
    got=$?
    if [[ "$got" -eq "$want" && "$want" -ne 0 ]]; then
      echo "exit-codes: PASS (child=$want, slim=$got)"
      exit 0
    fi
    echo "exit-codes: FAIL (child exit=$want, slim exit=$got)" >&2
    exit 1
    ;;

  raw-passthrough)
    # ls.filter only transforms `-l`-style listings; a plain listing is
    # unparseable-as-long-format and must pass through byte-identical.
    FIX="$DIR/test/fixtures/ls-dir"
    want="$(/bin/ls "$FIX" 2>&1)"
    got="$("$BIN" ls "$FIX" 2>&1)"
    if [[ "$want" == "$got" ]]; then
      echo "raw-passthrough: PASS"
      exit 0
    fi
    echo "raw-passthrough: FAIL — plain ls listing was not passed through raw" >&2
    diff <(echo "$want") <(echo "$got") >&2 || true
    exit 1
    ;;

  truncation-marked)
    # df's header + device rows on this filesystem exceed df_width (80
    # cols); truncated fields must always carry the "..." marker rather
    # than a silent cut.
    got="$("$BIN" df 2>/dev/null)"
    if printf '%s' "$got" | grep -q '\.\.\.'; then
      echo "truncation-marked: PASS"
      exit 0
    fi
    echo "truncation-marked: FAIL — no ... marker found in df output" >&2
    printf '%s\n' "$got" >&2
    exit 1
    ;;

  *)
    echo "usage: truth-law.sh {exit-codes|raw-passthrough|truncation-marked}" >&2
    exit 2
    ;;
esac
