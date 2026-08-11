# Brief: AGNT doc-auditor — verify every claim in the canonical doctrine docs
Spawner: ORCH skill-audit (pane w1A:pZ). Date: 2026-08-10. Status: binding.

## Mission
A COMPLETE, THOROUGH audit of the canonical doctrine/infra docs: every
factual claim checked against disk and the live herdr system. Fix doc-level
errors in place. Report code-level gaps as queued items — code fixes are OUT
OF SCOPE for this session; you do not modify any executable.

Epistemic standard: a claim is "verified" only if you ran the command or read
the file THIS session. No "well-known" exceptions. If you cannot verify a
claim, mark it UNVERIFIABLE and say exactly what would settle it. Never
fabricate a verification.

## Your file partition — HARD
You may edit EXACTLY these five files:
1. `~/agent-core/primitives/rules/control-flow.md`
2. `~/.tower/COMMS-ARCH.md`
3. `~/herdr-spine/docs/spawn.md`
4. `~/herdr-spine/docs/ctl-fleet.md`
5. `~/agent-core/primitives/rules/tower-orchestration.md`

- `~/.claude/skills/herdr/SKILL.md` is OFF LIMITS — a concurrent agent
  (AGNT skill-writer) is rewriting it right now, and a later agent audits it.
  Read it if useful for context; never edit it.
- Never edit any file under `~/herdr-spine/bin/` or
  `~/agent-core/primitives/tools/` — those are code. Report, don't fix.
- Never commit. Never `git add`.

## Pre-Verified Facts (ORCH, verified this session)
- Live binary: `herdr 0.8.0`. `HERDR_ENV=1` is set inside managed panes.
- All five of your files exist at the paths above, as do:
  `~/herdr-spine/bin/ctl-fleet`, `~/herdr-spine/bin/spine-spawn`,
  `~/herdr-spine/bin/handlers/10-notify`, `.../40-tower-bridge`,
  `~/agent-core/primitives/tools/statem/{statem.ts,twr.ts,README.md}`,
  `~/.tower/lib.mjs`, `~/source/herdr-RETROFIT-MAP.md`.
- `herdr agent start <NAME> --kind <KIND> --pane <ID> [-- <AGENT_ARG>...]`
  (from `herdr agent start --help`); NAME rejects spaces/uppercase.

## The audit — what to check, claim by claim
Work doc by doc. For EVERY claim of fact, record: the claim (file:line), the
evidence you gathered, and the verdict — VERIFIED / FIXED / REPORTED /
UNVERIFIABLE.

### 1. control-flow.md
- The hierarchy, prefix table, and lowercase registration forms — check
  against what herdr actually accepts (`invalid_agent_name` behavior) and
  against what spawn.md and ctl-fleet.md say. Any mismatch is a finding.
- §Observability spec: does `~/herdr-spine/bin/ctl-fleet` actually implement
  the CTRL row format described (glyph · role prefix · human work name ·
  activity; second line; no pane/tab ids; live sorts above done)? Does
  `--spawn` really produce a SPLIT of tab 1? Read the code to confirm; do
  not run anything that mutates the operator's live tab-1 layout.
- Does `~/agent-core/primitives/tools/statem/statem.ts` actually rename tab
  titles with GLYPHS ONLY (no phase words, no task text)? Does it read
  `.madewell/cycles/*.json`? Does `twr.ts` do one pane per project and read
  through `boardFor`?
- §Two-plane CTRL: is the WORK section implemented in ctl-fleet, or still
  aspirational? Say which, and mark the doc accordingly if it overstates.
- §Reaping and the CTRL-pane enrichment claims (duration/tokens): the
  coordinator verified herdr exposes NO pane-birth timestamp. Check whether
  the doc still implies one is available, and whether ctl-fleet fabricates a
  duration. Fabricated telemetry is a REPORTED code gap.

### 2. COMMS-ARCH.md
- The migration list items marked DONE (bridge-exempt; fabrication off by
  default; `inboxState` admitting only `to:"operator"` + alerts + open
  questions) — verify each against the actual code:
  `~/herdr-spine/bin/handlers/40-tower-bridge`, `.../10-notify`,
  `~/.tower/lib.mjs`. A DONE line that the code does not support is the most
  important finding you can produce.
- Items 4–6 (ledger writers minting `to`; TOWER-AUTO-CONTRACT amended and
  its §9 fabrication clause deleted; no surviving truncation path): check
  whether they are actually done, and update their status honestly in the
  doc (they are not marked DONE, so confirm they are still open — if one is
  in fact complete, mark it).
- §Notifications rubric vs `10-notify`'s implemented policy (its docstring
  documents T1–T6): does the code implement completion-only, AGNT/SAGT
  suppression, and 60s pacing? Any divergence is a finding — fix the doc if
  the doc is wrong, REPORT if the code is wrong.
- §Project isolation: verify `board_post` really refuses scratch/temp cwds
  (read the guard in the tower MCP server), and that the documented
  raw-append hole is stated accurately.

### 3. spawn.md
- Every spine-spawn mode/flag against `~/herdr-spine/bin/spine-spawn` as it
  exists now: modes, `--session`, `--prompt`, `--cwd`, the 4-brief fanout
  cap, the exact brief-delivery sentence, the result-JSON shape.
- **The stamping mandate vs reality — a named item in this audit.** Does
  spine-spawn stamp a human work name, `--display-agent`, `--token task=`,
  or `--token role=` at birth? The brief's prior read says it does NOT and
  that §The spine-spawn gap is the interim workaround. Confirm from the code,
  then: keep/fix the doc so the gap is stated exactly right, and REPORT the
  code fix as a queued item with the specific functions/lines to change.
- The four name carriers and the token-restart trap: confirm each against
  `herdr pane report-metadata --help` and `herdr agent start --help` at
  0.8.0. Is there anything on disk that re-stamps tokens after a server
  restart (a spine-startup hook, a handler, a launchagent)? Search for it.
  If nothing exists, REPORT the re-stamper gap as an open queued item; if
  something does, name it and correct the doc.
- The `agent.view.set` socket call and the `role=N-PREFIX` sort — verify the
  method name and param shape against the herdr socket API surface you can
  read on disk (`~/source/herdr-RETROFIT-MAP.md` is a cited 0.8.0 map).
- §Fleet-mail topics: verify `project_slug()` is actually defined where the
  doc says ("this file, above") — the doc references a function that may
  live in `~/.tower/lib.mjs`, not in spawn.md. Fix the pointer.

### 4. ctl-fleet.md
- Every documented flag, row format, section, and data source against
  `~/herdr-spine/bin/ctl-fleet`. Anything documented but not implemented, or
  implemented but undocumented, is a finding.

### 5. tower-orchestration.md
- The brief flags this as possibly CONTRADICTING COMMS-ARCH.md. Read it
  fully. Reconcile BY POINTER, not by duplication: where it states comms law
  that COMMS-ARCH now owns, replace the prose with a pointer to
  COMMS-ARCH.md and keep only what is genuinely tower-specific and still
  true. Do not delete operational content that remains correct.

### 6. Cross-references
Every one of the five docs should point to the others where relevant, and no
contradiction may survive between them. Build the cross-reference map and fix
gaps. Where two docs disagree on a fact, the disk/live evidence decides —
not seniority.

## Done when
- [ ] Every factual claim in all five docs has a verdict.
- [ ] Doc-level errors fixed in place, with file:line recorded for each fix.
- [ ] Code gaps reported as queued items (never fixed): each with the file,
      the specific behavior missing, and what a fix would have to do.
- [ ] Cross-references coherent; no surviving contradiction.
- [ ] No file outside your five was modified; nothing committed.

## Comms (binding)
- Your FIRST action: post a CLAIM to the Tower board, topic
  `herdr/skill-audit`, from cwd `/Users/jrg/agent-core`, including your pane
  id. Use the tower MCP `board_post` if available; otherwise append one JSON
  line to `~/.tower/board.jsonl`:
  `{"id":"<uniq>","ts":"<iso>","cwd":"/Users/jrg/agent-core","type":"finding","from":"agnt-doc-auditor","topic":"herdr/skill-audit","body":"CLAIM ..."}`
- Route every question to your spawner (ORCH skill-audit, pane `w1A:pZ`) —
  never to the operator.
- Your LAST actions, in order: (1) write your report to
  `~/agent-core/briefs/reports/agnt-doc-auditor-report.md`; (2) post a DONE
  finding to topic `herdr/skill-audit`; (3) create the marker
  `~/agent-core/briefs/.done-agnt-doc-auditor`.

## Report back with
A markdown AUDIT TABLE — one row per claim: `doc:line | claim | evidence |
VERIFIED/FIXED/REPORTED/UNVERIFIABLE`. Group by doc. Follow it with:
(a) the queued code gaps, each actionable; (b) the cross-reference map;
(c) anything you could not verify and what would settle it. Be exhaustive —
"thorough" is the deliverable, not a summary.
