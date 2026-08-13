#!/usr/bin/env bash
# credential-guard.sh — oracles for the pre-commit secret gate
# (../credential-guard.sh). One subcommand per VERIFY contract line.
#
# Hermetic: every subcommand builds a throwaway repo under mktemp -d and
# runs the hook directly. Fake secrets are assembled at runtime (command
# substitution / split literals) so this test file's own source never
# contains a contiguous trigger string — the guard must be able to commit
# its own tests.
# component-verify manifest: ../VERIFY-credential-guard.toml
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$DIR/credential-guard.sh"
unset CREDENTIAL_GUARD

rand() { head -c 400 /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c "$1"; }

make_repo() {
  local d
  d="$(mktemp -d)" || exit 2
  git init -q "$d" && git -C "$d" config user.email t@t && \
    git -C "$d" config user.name t && git -C "$d" config commit.gpgsign false
  echo "$d"
}

case "${1:-}" in
  blocks-live)
    # Staged additions carrying a live credential refuse the commit,
    # naming the file.
    repo="$(make_repo)"
    printf 'a %s\nb %s\n' "AVNS_$(rand 14)" "ghp_$(head -c 400 /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 32)" > "$repo/leak.txt"
    git -C "$repo" add leak.txt
    out="$(cd "$repo" && bash "$HOOK" 2>&1)"
    code=$?
    rm -rf "$repo"
    if [[ "$code" -eq 1 && "$out" == *"leak.txt"* ]]; then
      echo "blocks-live: PASS (exit 1, file named)"
      exit 0
    fi
    echo "blocks-live: FAIL (exit $code) — output:" >&2
    printf '%s\n' "$out" >&2
    exit 1
    ;;

  passes-placeholders)
    # Placeholder values never trigger: exit 0 and silent.
    repo="$(make_repo)"
    {
      echo 'pw1: AVNS_<REDACTED>'
      echo 'pw2: AVNS_REDACTED_OP'
      echo 'pw3: AVNS_EXAMPLEex0'
      echo "uri: postgres://svc:\${DB_PASS}@db.internal:5432/app"
      echo 'tok: sk-XXXXXXXXXXXXXXXXXXXXXXXX'
    } > "$repo/fixtures.txt"
    git -C "$repo" add fixtures.txt
    out="$(cd "$repo" && bash "$HOOK" 2>&1)"
    code=$?
    rm -rf "$repo"
    if [[ "$code" -eq 0 && -z "$out" ]]; then
      echo "passes-placeholders: PASS (exit 0, silent)"
      exit 0
    fi
    echo "passes-placeholders: FAIL (exit $code) — output:" >&2
    printf '%s\n' "$out" >&2
    exit 1
    ;;

  removal-only)
    # A diff that only removes a secret passes.
    repo="$(make_repo)"
    echo "key = AKIA$(head -c 400 /dev/urandom | LC_ALL=C tr -dc '0-9A-Z' | head -c 16)" > "$repo/old.txt"
    git -C "$repo" add old.txt
    CREDENTIAL_GUARD=off git -C "$repo" commit -q -m seed 2>/dev/null
    git -C "$repo" rm -q old.txt
    out="$(cd "$repo" && bash "$HOOK" 2>&1)"
    code=$?
    rm -rf "$repo"
    if [[ "$code" -eq 0 ]]; then
      echo "removal-only: PASS (secret removal commits clean)"
      exit 0
    fi
    echo "removal-only: FAIL (exit $code) — output:" >&2
    printf '%s\n' "$out" >&2
    exit 1
    ;;

  override-warns)
    # CREDENTIAL_GUARD=off passes but prints a loud OVERRIDE warning.
    repo="$(make_repo)"
    echo "a AVNS_$(rand 14)" > "$repo/leak.txt"
    git -C "$repo" add leak.txt
    err="$(cd "$repo" && CREDENTIAL_GUARD=off bash "$HOOK" 2>&1 1>/dev/null)"
    code=$?
    rm -rf "$repo"
    if [[ "$code" -eq 0 && "$err" == *OVERRIDE* ]]; then
      echo "override-warns: PASS (exit 0, OVERRIDE on stderr)"
      exit 0
    fi
    echo "override-warns: FAIL (exit $code) — stderr:" >&2
    printf '%s\n' "$err" >&2
    exit 1
    ;;

  fail-open)
    # Internal errors fail open with a warning, never block: outside any
    # repo, git diff --cached fails — the guard must warn and exit 0.
    d="$(mktemp -d)"
    err="$(cd "$d" && GIT_CEILING_DIRECTORIES="$d" bash "$HOOK" 2>&1 1>/dev/null)"
    code=$?
    rmdir "$d"
    if [[ "$code" -eq 0 && "$err" == *WARNING* ]]; then
      echo "fail-open: PASS (exit 0, warning on stderr)"
      exit 0
    fi
    echo "fail-open: FAIL (exit $code) — stderr:" >&2
    printf '%s\n' "$err" >&2
    exit 1
    ;;

  *)
    echo "usage: credential-guard.sh {blocks-live|passes-placeholders|removal-only|override-warns|fail-open}" >&2
    exit 2
    ;;
esac
