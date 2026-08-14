#!/usr/bin/env bun
// PreToolUse gate on agent spawns — the mechanical enforcement of the
// delegation protocol. Installed 2026-06-11 after a session where all 13
// hand-written briefs skipped the Tower section the /brief template requires:
// prose rules lose to task pressure; hooks do not.
//
// Blocks (exit 2) any spawn whose prompt lacks the required brief sections.
// Read-only helper agents are exempt. To consciously waive Tower wiring for a
// single-turn report-back agent, the brief must say TOWER-WAIVED with a reason
// — the waiver is the habit-stack: you cannot skip it silently, you can only
// skip it explicitly.
//
// COVERAGE (matcher in ~/.claude/settings.json: "Agent|Task")
//   Agent, Task — same tool_input shape ({ prompt, subagent_type }); both gated.
//                 Task was uncovered until 2026-08-14: the matcher said "Agent"
//                 only, so every Task spawn bypassed brief validation.
//   Workflow    — KNOWN GAP, deliberately not gated (2026-08-14). Its tool_input
//                 carries { script | scriptPath | name }, never a prompt. Gating
//                 it would mean pattern-matching brief sections against SCRIPT
//                 SOURCE, and a legitimate workflow builds its prompts at
//                 runtime (read from briefs/*.md, string-composed, passed
//                 through variables) — the required phrases need never appear
//                 as literals in the script. That is a false-block generator,
//                 and this gate's first law is: never brick the harness. If
//                 Workflow spawns need enforcement, the honest place is inside
//                 the spawn call the workflow makes (runtime prompt in hand),
//                 not a source-text scan here. Until then the gap is real and
//                 documented rather than papered over with a no-op matcher.

const EXEMPT_TYPES = new Set(['scout', 'Explore', 'Plan', 'claude-code-guide', 'statusline-setup'])
const GATED_TOOLS = new Set(['Agent', 'Task'])

let input = ''
for await (const chunk of process.stdin) input += chunk

let data
try {
  data = JSON.parse(input)
} catch {
  process.exit(0) // malformed payload — never brick the harness
}

const tool = String(data.tool_name ?? '')
// Defensive: if the matcher is ever widened to a tool with a different
// tool_input shape (Workflow), this hook must stay silent rather than guess.
if (tool && !GATED_TOOLS.has(tool)) process.exit(0)

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
  `${tool || 'Agent'} spawn blocked — brief is missing required sections:\n` +
    missing.map((m) => `  - ${m}`).join('\n') +
    `\nUse the /brief skill (it includes all of these), or add the sections and respawn. ` +
    `This gate exists because hand-written briefs under load skip protocol; do not work around it.`
)
process.exit(2)
