#!/usr/bin/env bun
// PreToolUse gate on Agent spawns — the mechanical enforcement of the
// delegation protocol. Installed 2026-06-11 after a session where all 13
// hand-written briefs skipped the Tower section the /brief template requires:
// prose rules lose to task pressure; hooks do not.
//
// Blocks (exit 2) any Agent spawn whose prompt lacks the required brief
// sections. Read-only helper agents are exempt. To consciously waive Tower
// wiring for a single-turn report-back agent, the brief must say TOWER-WAIVED
// with a reason — the waiver is the habit-stack: you cannot skip it silently,
// you can only skip it explicitly.

const EXEMPT_TYPES = new Set(['scout', 'Explore', 'Plan', 'claude-code-guide', 'statusline-setup'])

let input = ''
for await (const chunk of process.stdin) input += chunk

let data
try {
  data = JSON.parse(input)
} catch {
  process.exit(0) // malformed payload — never brick the harness
}

const toolInput = data.tool_input ?? {}
const prompt = String(toolInput.prompt ?? '')
const type = String(toolInput.subagent_type ?? '')

if (EXEMPT_TYPES.has(type)) process.exit(0)
if (prompt.length < 400) process.exit(0) // trivial one-liner lookups are not fleet work

const missing = []
if (!/pre-?verified facts/i.test(prompt)) missing.push("## Pre-Verified Facts (lead ran every command/path personally) — phrase it 'Pre-Verified Facts' or 'Preverified facts'")
if (!/tower|TOWER-WAIVED/i.test(prompt)) missing.push("## Tower section (board topic + send kinds) — phrase it 'Tower' or 'TOWER-WAIVED: <reason>'")
if (!/report/i.test(prompt)) missing.push("## Report back with (exact completion contract) — include the word 'report' (e.g. 'Report back with')")
if (!/done[\s-]?when|done[\s-]?condition|exits? 0|must pass|pass criterion/i.test(prompt)) missing.push("explicit done-when conditions per task — add a 'done when'/'done-when'/'done condition' line, or 'exits 0' / 'must pass' / 'pass criterion'")

if (missing.length === 0) process.exit(0)

console.error(
  `Agent spawn blocked — brief is missing required sections:\n` +
    missing.map((m) => `  - ${m}`).join('\n') +
    `\nUse the /brief skill (it includes all of these), or add the sections and respawn. ` +
    `This gate exists because hand-written briefs under load skip protocol; do not work around it.`
)
process.exit(2)
