#!/usr/bin/env bash
# Deterministic throwaway git repo for slim frozen-fixture tests.
# Criterion: fixture builds identically on every invocation (pinned dates/authors).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="${1:-$ROOT/git-repo}"

rm -rf "$REPO"
mkdir -p "$REPO"
cd "$REPO"

export GIT_AUTHOR_NAME="Fixture Author"
export GIT_AUTHOR_EMAIL="fixture@test.local"
export GIT_COMMITTER_NAME="Fixture Author"
export GIT_COMMITTER_EMAIL="fixture@test.local"

git init -b main

# Commit 1 — initial
export GIT_AUTHOR_DATE="2024-01-01T12:00:00"
export GIT_COMMITTER_DATE="2024-01-01T12:00:00"
printf 'initial\n' >README.md
git add README.md
git commit -m "initial commit"

# Commit 2 — tracked file
export GIT_AUTHOR_DATE="2024-01-02T12:00:00"
export GIT_COMMITTER_DATE="2024-01-02T12:00:00"
printf 'tracked v1\n' >tracked.txt
git add tracked.txt
git commit -m "add tracked file"

# Commit 3 — long body for log truncation marker
export GIT_AUTHOR_DATE="2024-01-03T12:00:00"
export GIT_COMMITTER_DATE="2024-01-03T12:00:00"
git commit --allow-empty -m "long body commit" -m "$(printf 'body line %s\n' {1..8})"

# Commit 4
export GIT_AUTHOR_DATE="2024-01-04T12:00:00"
export GIT_COMMITTER_DATE="2024-01-04T12:00:00"
printf 'notes\n' >notes.txt
git add notes.txt
git commit -m "add notes"

# Commit 5 — most recent
export GIT_AUTHOR_DATE="2024-01-05T12:00:00"
export GIT_COMMITTER_DATE="2024-01-05T12:00:00"
git commit --allow-empty -m "tip commit"

# Working tree: staged + modified + untracked (known counts for golden review)
printf 'staged content\n' >staged.txt
git add staged.txt
printf 'tracked v2\n' >tracked.txt
printf 'alpha\n' >untracked-a.txt
printf 'beta\n' >untracked-b.txt
