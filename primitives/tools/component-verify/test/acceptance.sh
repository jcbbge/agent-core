#!/usr/bin/env bash
# acceptance.sh — component-verify eating its own food.
#
# Builds a fixture root (manifests + fake registry) in a temp dir and runs
# the real runner against it. One subcommand per VERIFY.toml contract line;
# `all` runs every check (the suite). Positive AND negative controls: the
# runner must pass what holds and fail what is broken — a verifier that
# cannot fail proves nothing.
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERIFY="$DIR/verify.ts"

setup() {
  FIX="$(mktemp -d)"
  trap 'rm -rf "$FIX"' EXIT
  mkdir -p "$FIX/good" "$FIX/bad" "$FIX/registry-home"

  cat > "$FIX/good/VERIFY.toml" <<'EOF'
[component]
id = "fixture/good"
kind = "binary"
what = "always holds"
contract = ["true is true", "echo emits"]
[[oracle]]
run = "true"
[[oracle]]
run = "echo emitted | grep -q emitted"
[suite]
run = "true"
EOF

  cat > "$FIX/bad/VERIFY.toml" <<'EOF'
[component]
id = "fixture/bad"
kind = "binary"
what = "one guarantee is a lie"
contract = ["this one holds", "this one is violated"]
[[oracle]]
run = "true"
[[oracle]]
run = "echo 'the oracle saw something wrong'; exit 3"
EOF

  cat > "$FIX/registry-home/registry" <<'EOF'
# fixture registry
primitive fixture/good
  source /dev/null
end
primitive fixture/unmanifested
  source /dev/null
end
EOF

  export AGENT_CORE_ROOT="$FIX"
  export AGENT_CORE_REGISTRY="$FIX/registry-home/registry"
}

pass_line() { # a holding contract → one PASS line per sentence, exit 0
  setup
  out="$(bun "$VERIFY" fixture/good)"
  code=$?
  [[ "$code" -eq 0 ]] || { echo "pass-line: FAIL (exit $code, want 0)" >&2; return 1; }
  [[ "$(grep -c '^PASS fixture/good :: ' <<<"$out")" -eq 2 ]] || {
    echo "pass-line: FAIL (want 2 PASS lines):" >&2; echo "$out" >&2; return 1; }
  echo "pass-line: PASS"
}

fail_tail() { # a violated contract → FAIL line + oracle tail, exit non-zero
  setup
  out="$(bun "$VERIFY" fixture/bad)"
  code=$?
  [[ "$code" -ne 0 ]] || { echo "fail-tail: FAIL (exit 0 on a violated contract)" >&2; return 1; }
  grep -q '^FAIL fixture/bad :: this one is violated' <<<"$out" || {
    echo "fail-tail: FAIL (no FAIL line):" >&2; echo "$out" >&2; return 1; }
  grep -q 'the oracle saw something wrong' <<<"$out" || {
    echo "fail-tail: FAIL (oracle tail not shown):" >&2; echo "$out" >&2; return 1; }
  grep -q '^PASS fixture/bad :: this one holds' <<<"$out" || {
    echo "fail-tail: FAIL (holding line not reported PASS):" >&2; echo "$out" >&2; return 1; }
  echo "fail-tail: PASS"
}

mismatch_refused() { # contract/oracle count mismatch → hard error exit 2
  setup
  mkdir -p "$FIX/mismatch"
  cat > "$FIX/mismatch/VERIFY.toml" <<'EOF'
[component]
id = "fixture/mismatch"
kind = "binary"
what = "two guarantees, one oracle"
contract = ["a", "b"]
[[oracle]]
run = "true"
EOF
  out="$(bun "$VERIFY" fixture/good 2>&1)"
  code=$?
  [[ "$code" -eq 2 ]] || { echo "mismatch-refused: FAIL (exit $code, want 2)" >&2; echo "$out" >&2; return 1; }
  grep -q 'one oracle per contract line' <<<"$out" || {
    echo "mismatch-refused: FAIL (no manifest error message):" >&2; echo "$out" >&2; return 1; }
  echo "mismatch-refused: PASS"
}

coverage_exact() { # --coverage lists exactly the registry ids lacking manifests
  setup
  out="$(bun "$VERIFY" --coverage)"
  code=$?
  [[ "$code" -eq 0 ]] || { echo "coverage-exact: FAIL (exit $code)" >&2; return 1; }
  missing="$(grep -v '^coverage:' <<<"$out")"
  [[ "$missing" == "fixture/unmanifested" ]] || {
    echo "coverage-exact: FAIL (want exactly fixture/unmanifested):" >&2; echo "$out" >&2; return 1; }
  grep -q '^coverage: 1/2 registry ids carry a manifest; 1 without' <<<"$out" || {
    echo "coverage-exact: FAIL (summary line wrong):" >&2; echo "$out" >&2; return 1; }
  echo "coverage-exact: PASS"
}

all_semantics() { # --all: per-component rows, exit reflects any failure
  setup
  out="$(bun "$VERIFY" --all)"
  code=$?
  [[ "$code" -ne 0 ]] || { echo "all-semantics: FAIL (--all exit 0 with fixture/bad present)" >&2; return 1; }
  grep -q 'PASS  fixture/good' <<<"$out" && grep -q 'FAIL  fixture/bad' <<<"$out" || {
    echo "all-semantics: FAIL (summary rows wrong):" >&2; echo "$out" >&2; return 1; }
  echo "all-semantics: PASS"
}

case "${1:-all}" in
  pass-line)        pass_line ;;
  fail-tail)        fail_tail ;;
  mismatch-refused) mismatch_refused ;;
  coverage-exact)   coverage_exact ;;
  all-semantics)    all_semantics ;;
  all)
    rc=0
    for t in pass_line fail_tail mismatch_refused coverage_exact all_semantics; do
      "$t" || rc=1
    done
    exit "$rc"
    ;;
  *)
    echo "usage: acceptance.sh {pass-line|fail-tail|mismatch-refused|coverage-exact|all-semantics|all}" >&2
    exit 2
    ;;
esac
