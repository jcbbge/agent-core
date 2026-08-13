#!/usr/bin/env bash
# credential-guard — local pre-commit gate refusing staged secrets into
# history, independent of any remote's push protection (incident 2026-08-12:
# a DigitalOcean/Aiven password reached HEAD locally before a remote ever
# saw it). Scans `git diff --cached --unified=0` ADDED lines only — a commit
# that only removes a secret must pass.
#
# Install: 2-line exec shim in <repo>'s (common) .git/hooks/pre-commit,
# pointing at this canonical script. Use `credential-guard.sh --install
# <repo>` to generate the shim for any repo, including worktrees.
#
# Override: CREDENTIAL_GUARD=off skips the scan (loud warning, still exits 0).
#
# Fail-open contract: this guard must never turn its own bug into a blocked
# commit. The scan runs inside a command-substitution subshell so a crash,
# missing command, or unexpected exit status stays contained; the parent
# only ever exits 1 when the scan explicitly signals a hit, and treats any
# other outcome (0 = clean, anything else = internal error) as a warned
# pass-through.

canonical_path() {
  printf '%s/%s' "$(cd "$(dirname "$0")" && pwd)" "$(basename "$0")"
}

install_shim() {
  local target="$1"
  if [ -z "$target" ] || [ ! -d "$target" ]; then
    echo "credential-guard: --install requires an existing repo path" >&2
    exit 2
  fi
  local common_dir
  common_dir="$(cd "$target" 2>/dev/null && git rev-parse --git-common-dir 2>/dev/null)"
  if [ -z "$common_dir" ]; then
    echo "credential-guard: $target is not a git repository" >&2
    exit 2
  fi
  case "$common_dir" in
    /*) : ;;
    *) common_dir="$(cd "$target" && cd "$common_dir" && pwd)" ;;
  esac
  local hooks_dir="$common_dir/hooks"
  mkdir -p "$hooks_dir"
  local hook_path="$hooks_dir/pre-commit"
  local canonical
  canonical="$(canonical_path)"
  if [ -e "$hook_path" ] && ! grep -q "credential-guard.sh" "$hook_path" 2>/dev/null; then
    mv "$hook_path" "$hook_path.pre-credential-guard.bak"
    echo "credential-guard: existing pre-commit backed up to $hook_path.pre-credential-guard.bak" >&2
  fi
  {
    printf '#!/usr/bin/env bash\n'
    printf 'exec "%s"\n' "$canonical"
  } > "$hook_path"
  chmod +x "$hook_path"
  echo "credential-guard: installed at $hook_path -> $canonical"
  exit 0
}

if [ "${1:-}" = "--install" ]; then
  install_shim "${2:-}"
fi

if [ "${CREDENTIAL_GUARD:-}" = "off" ]; then
  echo "credential-guard: OVERRIDE ACTIVE — CREDENTIAL_GUARD=off, secret scan SKIPPED for this commit" >&2
  exit 0
fi

run_scan() {
  local diff status
  diff="$(git diff --cached --unified=0 -- . 2>&1)"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "credential-guard: WARNING — cannot scan (git diff --cached exit $status), fail-open, commit allowed: $diff"
    exit 0
  fi
  if [ -z "$diff" ]; then
    exit 0
  fi

  local names=(
    do-aiven-password
    github-oauth-token
    github-pat
    sk-api-key
    aws-akia-key
    slack-token
    google-api-key
    private-key-block
    uri-basic-auth
  )
  local patterns=(
    'AVNS_[A-Za-z0-9_-]{10,}'
    'gh[pousr]_[A-Za-z0-9]{30,}'
    'github_pat_[A-Za-z0-9_]{20,}'
    'sk-[A-Za-z0-9_-]{20,}'
    'AKIA[0-9A-Z]{16}'
    'xox[abprs]-[A-Za-z0-9-]+'
    'AIza[0-9A-Za-z_-]{30,}'
    '\-\-\-\-\-BEGIN[A-Za-z0-9 ]*PRIVATE KEY'
    '://[^/:@]+:[^/@]{8,}@'
  )

  local file="" new_line=0 found=0 content match short i pattern

  while IFS= read -r line; do
    case "$line" in
      "diff --git a/"*)
        file="${line#diff --git a/}"
        file="${file%% b/*}"
        ;;
      "@@ "*)
        if [[ "$line" =~ ^@@\ -[0-9]+(,[0-9]+)?\ \+([0-9]+) ]]; then
          new_line="${BASH_REMATCH[2]}"
        fi
        ;;
      "+++ "*) : ;;
      "+"*)
        content="${line#+}"
        for i in "${!names[@]}"; do
          pattern="${patterns[$i]}"
          if [[ "$content" =~ $pattern ]]; then
            match="${BASH_REMATCH[0]}"
            case "$match" in
              *REDACTED*|*EXAMPLE*|*XXXX*|*'<'*|*'${'*) continue ;;
            esac
            short="${match:0:6}"
            echo "credential-guard: BLOCKED ${file:-<unknown file>}:${new_line} :: ${names[$i]} :: ${short}...(redacted)"
            found=1
          fi
        done
        new_line=$((new_line + 1))
        ;;
    esac
  done <<< "$diff"

  if [ "$found" -eq 1 ]; then
    exit 1
  fi
  exit 0
}

OUT="$(run_scan 2>&1)"
STATUS=$?
if [ -n "$OUT" ]; then
  echo "$OUT" >&2
fi
case "$STATUS" in
  0) exit 0 ;;
  1) exit 1 ;;
  *)
    echo "credential-guard: WARNING — internal error (unexpected exit $STATUS), fail-open, commit allowed" >&2
    exit 0
    ;;
esac
