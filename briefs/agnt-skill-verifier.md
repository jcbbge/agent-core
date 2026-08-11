# Brief: AGNT skill-verifier — adversarially audit the rewritten herdr SKILL.md
Spawner: ORCH skill-audit (pane w1A:pZ). Date: 2026-08-10. Status: binding.

## Mission
A different agent (AGNT skill-writer) has just rewritten
`~/.claude/skills/herdr/SKILL.md`. You did not write it and you owe it no
loyalty. Audit EVERY factual claim in it against disk and the live herdr
system, fix what is wrong in place, and report what you cannot fix.

Epistemic standard: a claim is "verified" only if you ran the command or read
the file THIS session. No "well-known" exceptions, no trusting the writer's
report, no trusting this brief's own summaries without checking. If you
cannot verify a claim, mark it UNVERIFIABLE and state exactly what would
settle it. Never fabricate a verification.

## Your file partition — HARD
- You may edit EXACTLY ONE file: `~/.claude/skills/herdr/SKILL.md`.
- The five doctrine docs (`~/agent-core/primitives/rules/control-flow.md`,
  `~/.tower/COMMS-ARCH.md`, `~/herdr-spine/docs/spawn.md`,
  `~/herdr-spine/docs/ctl-fleet.md`,
  `~/agent-core/primitives/rules/tower-orchestration.md`) are being audited
  and corrected RIGHT NOW, in parallel, by AGNT doc-auditor (pane `w1A:p11`).
  READ them as the corrected source of truth — do NOT edit them. If you find
  a surviving error in one, REPORT it; do not fix it.
- **ORDERING — the doc audit is still in flight.** Do the work that does not
  depend on it FIRST: live CLI/flag/error-code verification, path checks,
  code reads (spine-spawn, ctl-fleet, statem, twr, the handlers, lib.mjs),
  and SKILL.md's internal consistency. Do the doctrine-ATTRIBUTION checks
  ("SKILL.md says control-flow.md says X") LAST, and immediately before you
  do them, confirm the auditor has finished — the marker
  `~/agent-core/briefs/.done-agnt-doc-auditor` exists, or `herdr pane get
  w1A:p11` no longer reads `working`. If it is still running when you are
  otherwise finished, say so in your report and mark those specific rows
  PENDING-DOC-AUDIT rather than reading a half-corrected doc and filing a
  false contradiction.
- Never edit code (`~/herdr-spine/bin/**`, `~/agent-core/primitives/tools/**`).
- Never commit. Never `git add`.

## Pre-Verified Facts (ORCH, verified this session)
- Live binary: `herdr 0.8.0`. `HERDR_ENV=1` inside managed panes.
- `herdr agent start <NAME> --kind <KIND> --pane <ID> [-- <AGENT_ARG>...]`;
  NAME rejects spaces/uppercase (`invalid_agent_name`) — lowercase-kebab.
- `herdr pane report-metadata <PANE_ID> --source <ID> [--display-agent <TEXT>]
  [--token k=v ...]` succeeds SILENTLY (exit 0, no stdout) — verify a stamp
  landed with `herdr pane get <id>` and read `label`, `display_agent`,
  `tokens`. Live-verified this session: label, display_agent, and the
  `name`/`role`/`task` tokens all landed on panes `w1A:p0` / `w1A:p11`.
- Live-verified this session: a freshly split pane can report
  `command not found: <agent>` if `agent start` fires before its shell has
  finished sourcing the profile — the failure surfaces as a `timeout` error
  from `agent start`, NOT as `agent_pane_busy`. Retrying after a beat
  succeeded. If SKILL.md documents only the `agent_pane_busy` retry case, it
  is incomplete — add this.
- The writer's own report is at
  `~/agent-core/briefs/reports/agnt-skill-writer-report.md`, and the doc
  auditor's at `~/agent-core/briefs/reports/agnt-doc-auditor-report.md`.
  Read both AFTER you have formed your own findings — as cross-checks, never
  as evidence.

## The audit — how to run it
1. Read `~/.claude/skills/herdr/SKILL.md` in full. Extract EVERY factual
   claim: CLI syntax, flag names, error codes, version-gated behavior, file
   paths, doc pointers, socket methods, environment-variable semantics,
   doctrine statements attributed to another doc.
2. For each claim, gather evidence THIS session:
   - CLI/flags/error codes → `herdr <group> --help`, and where safe, a live
     non-mutating call. Do NOT mutate the operator's tab-1 layout, do NOT
     stop the server, do NOT close panes you did not create, do NOT run
     `herdr server stop`. If verifying a claim would require a destructive or
     operator-visible mutation, mark it UNVERIFIABLE-BY-DESIGN and say so.
   - File paths → `ls` / `Read` them.
   - Doctrine attributions ("control-flow.md says X") → open that doc and
     confirm it actually says X, post-audit.
   - Code behavior claims (spine-spawn, ctl-fleet, statem, twr, 10-notify,
     40-tower-bridge, lib.mjs) → read the code.
3. Fix errors in place in SKILL.md. Delete unverifiable claims or mark them
   UNKNOWN — do not leave a confident sentence standing on no evidence.
4. Then run the **cold-reader test** explicitly, and report the result:
   reading ONLY the final SKILL.md, could a fresh session (a) name and stamp
   a pane correctly (prefix, lowercase-kebab registration, human work name,
   `$task`/`$role` tokens), (b) spawn an agent and know that delivery is not
   delivery until the status flip is observed, (c) find CTRL / TOWR / statem
   and know what each shows and how it is launched, (d) post to the board
   with the correct `<project-slug>/<topic>` form from a real repo cwd,
   (e) know when to reap and what reaping means? Any "no" is a defect you fix
   before you finish.
5. Check the skill's INTERNAL consistency: no section may contradict
   another; the frontmatter description must match the body; pointers must
   resolve; the version stamp must match what you verified live.

## Done when
- [ ] Every factual claim in SKILL.md has a verdict
      (VERIFIED / FIXED / REPORTED / UNVERIFIABLE).
- [ ] All fixable errors fixed in place, each with a file:line record.
- [ ] The cold-reader test passes on all five points, with the evidence.
- [ ] No file outside SKILL.md modified; nothing committed.

## Comms (binding)
- Your FIRST action: post a CLAIM to the Tower board, topic
  `herdr/skill-audit`, from cwd `/Users/jrg/agent-core`, including your pane
  id. Use the tower MCP `board_post` if available; otherwise append one JSON
  line to `~/.tower/board.jsonl`:
  `{"id":"<uniq>","ts":"<iso>","cwd":"/Users/jrg/agent-core","type":"finding","from":"agnt-skill-verifier","topic":"herdr/skill-audit","body":"CLAIM ..."}`
- Route every question to your spawner (ORCH skill-audit, pane `w1A:pZ`) —
  never to the operator.
- Your LAST actions, in order: (1) write your report to
  `~/agent-core/briefs/reports/agnt-skill-verifier-report.md`; (2) post a
  DONE finding to topic `herdr/skill-audit`; (3) create the marker
  `~/agent-core/briefs/.done-agnt-skill-verifier`.

## Report back with
A markdown AUDIT TABLE — one row per claim: `SKILL.md:line | claim |
evidence gathered | VERIFIED/FIXED/UNVERIFIABLE`. Then: the cold-reader test
result point by point with evidence; any error you found in a doctrine doc
(reported, not fixed); any code gap you noticed; and the final line count.
Be exhaustive — "thorough" is the deliverable, not a summary.
