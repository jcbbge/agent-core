#!/usr/bin/env bun
// PostToolUse on Bash — habit-stack Tower deposits onto the commit ritual.
// A commit is the moment work crystallizes; if a decision/insight/verified
// fact in it isn't on the bus yet, this is the cheapest moment to post it.
// One line, non-blocking, fires only on `git commit`.
// (Repointed 2026-08-02: was mcp__alembic__* — substrate retired.)

let input = ''
for await (const chunk of process.stdin) input += chunk

try {
  const data = JSON.parse(input)
  const cmd = String(data.tool_input?.command ?? '')
  if (/git commit/.test(cmd) && !/--amend/.test(cmd)) {
    console.log(
      '[Tower] Commit detected — if this commit carries a decision, a verified fact, or a hard-won lesson the fleet needs, post it to the Tower board NOW (~/.tower/board.jsonl). Deposit-at-the-moment, not at session end.'
    )
  }
} catch {
  // never brick the harness
}
process.exit(0)
