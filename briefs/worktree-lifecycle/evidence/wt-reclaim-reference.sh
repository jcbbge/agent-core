#!/usr/bin/env bash
# Reclaim leaked worktrees without losing work.
#
# For each linked worktree of $REPO:
#   1. if detached HEAD, park it on a rescue branch (else removal loses commits)
#   2. if dirty, commit everything to a WIP commit on its own branch
#   3. remove the worktree directory (deepest path first — a nested worktree is
#      destroyed when its "parent" directory is removed, so children go first)
# Branches are always kept. Recover any of them with:
#   git worktree add <path> <branch>
#
# Usage: wt-reclaim.sh <repo> [--apply]     (default is dry-run)

set -uo pipefail

REPO="${1:?usage: wt-reclaim.sh <repo> [--apply]}"
APPLY=0
[[ "${2:-}" == "--apply" ]] && APPLY=1

cd "$REPO" || exit 1
say() { printf '%s\n' "$*"; }
run() { if [[ $APPLY -eq 1 ]]; then "$@"; else say "      DRY: $*"; fi; }

# Deepest-first so nested worktrees are removed before the dir containing them.
# (bash 3.2 on macOS has no mapfile.)
WTS=()
while IFS= read -r line; do
  [ -n "$line" ] && WTS+=("$line")
done < <(
  git worktree list --porcelain | grep '^worktree ' | cut -d' ' -f2- | tail -n +2 |
    awk '{print gsub(/\//,"/"), $0}' | sort -rn | cut -d' ' -f2-
)

freed=0
kept_branches=()
skipped=()
for w in "${WTS[@]}"; do
  [[ -d "$w" ]] || { say "GONE   $w (registry only)"; continue; }

  branch="$(git -C "$w" branch --show-current 2>/dev/null)"
  size="$(du -sk "$w" 2>/dev/null | cut -f1)"
  dirty="$(git -C "$w" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

  # Detached HEAD: park the commits on a branch or removal loses them.
  if [[ -z "$branch" ]]; then
    branch="rescue/$(basename "$w")"
    say "DETACH $(basename "$w") -> $branch"
    run git -C "$w" checkout -q -b "$branch"
  fi

  if [[ "$dirty" != "0" ]]; then
    say "WIP    $branch  ($dirty changes, ${size}K)"
    run git -C "$w" add -A
    run git -C "$w" commit -q -m "wip($branch): uncommitted worktree state preserved before reclaim

PHASE: Implement
DONE: Snapshot of this worktree's working state, committed so the directory
could be reclaimed without losing work. Recover with:
  git worktree add <path> $branch
TODO: review whether this content is already represented in main; drop the
branch if it is."

    # SAFETY: a pre-commit hook (credential-guard) can legitimately refuse this
    # commit. These worktrees predate the .gitignore that excludes the
    # credential-bearing board dumps, so that WILL happen for some of them.
    # If the work is not safely on the branch, the directory does not get
    # removed — a blocked commit must never become data loss.
    if [[ $APPLY -eq 1 ]]; then
      still="$(git -C "$w" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
      if [[ "$still" != "0" ]]; then
        say "  SKIP  $branch — commit refused, $still changes still uncommitted; worktree KEPT"
        skipped+=("$branch")
        continue
      fi
    fi
  else
    say "CLEAN  $branch  (${size}K)"
  fi

  kept_branches+=("$branch")
  run git worktree remove --force "$w"
  freed=$((freed + size))
done

run git worktree prune

say ""
say "=== ${#WTS[@]} worktrees seen, $((freed / 1024))M reclaimed ==="
say "=== ${#kept_branches[@]} branches kept (recover: git worktree add <path> <branch>) ==="
if [[ ${#skipped[@]} -gt 0 ]]; then
  say "=== ${#skipped[@]} KEPT ON DISK — commit refused, work not preserved yet: ==="
  for s in "${skipped[@]}"; do say "      $s"; done
fi
[[ $APPLY -eq 0 ]] && say "(DRY RUN — re-run with --apply)"
exit 0
