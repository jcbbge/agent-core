#!/usr/bin/env bash
# learning-opportunity-hook.sh — PostGitCommit hook
# Fires after git commit, offers learning exercise if work was significant

RECENT_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null)
[[ -z "$RECENT_FILES" ]] && exit 0

SIGNAL=0
for f in $RECENT_FILES; do
  [[ "$f" == *.md ]] && SIGNAL=1
  [[ "$f" == *.sql ]] && SIGNAL=1
  [[ "$f" == schema* ]] && SIGNAL=1
  [[ "$f" == *.tsx ]] && SIGNAL=1
  [[ "$f" == *.ts ]] && SIGNAL=1
done

[[ $SIGNAL -eq 1 ]] && echo "LEARNING_OPPORTUNITY: Significant architectural work detected. Consider /learning-opportunities"
