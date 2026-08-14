# ORCH [session-loop] — Encode the session loop at every striation

Encode the already-ruled 2026-08-14 session loop into house law (profiles,
rules, skills, cursor directive, AGENTS.md). Repo: `~/agent-core`. You never
implement yourself — decompose to AGNT/SAGT workers with disjoint file
partitions. Do NOT use emojis. Briefs and spawns name **profiles/roles only**
(never provider, model, or `--kind`). Spawn via this fleet's root harness path:
`cursor-fleet` / `cursor-spine` + `profile-model` (see
`primitives/directives/cursor.md`).

## Pre-Verified Facts (CORD verified 2026-08-14T18:20Z)

- Mission workspace: herdr `w3A` (label `house`); CORD pane `w3A:p1`
  (`cord-coordinator-w3a-p1`).
- Binding CORD brief (operator-ruled failures + session loop filter):
  `/Users/jrg/agent-core/briefs/house/CORD-session-loop-2026-08-14.md`
- Guest book already written: `~/circadian/mind/USER.md` §2026-08-14 — do not
  re-open that debate; encode the rulings.
- Target files exist (absolute):
  - `/Users/jrg/agent-core/primitives/profiles/concierge.md`
  - `/Users/jrg/agent-core/primitives/profiles/coordinator.md`
  - `/Users/jrg/agent-core/primitives/profiles/orchestrator.md`
  - `/Users/jrg/agent-core/primitives/rules/control-flow.md` (§Reaping starts ~L103)
  - `/Users/jrg/agent-core/primitives/skills/starting-session/SKILL.md`
    (still ends orientation with `What are we expanding into?` at L104 and L130)
  - `/Users/jrg/agent-core/primitives/skills/ending-session/SKILL.md` (Step 1
    Strike the fleet ~L30 — no Diagnosis≠Land / Park exception yet)
  - `/Users/jrg/agent-core/primitives/skills/concierge/SKILL.md`
  - `/Users/jrg/agent-core/primitives/skills/brief/SKILL.md`
  - `/Users/jrg/agent-core/primitives/directives/cursor.md`
  - `/Users/jrg/agent-core/primitives/AGENTS.md`
  - `/Users/jrg/agent-core/primitives/mcps/tower/COMMS-ARCH.md`
    (`~/.tower/COMMS-ARCH.md` is a symlink to this file)
- Gap scan (encode these; do not rediscover):
  - `concierge.md`: no ban on "say the word"/"which first"; no load-bearing-thread
    doctrine; no `mailbox ≠ substrate` desk-card fact; desk-card spawn line still
    shows `spine-spawn … --kind claude` as an example.
  - `control-flow.md` §Reaping: no "Diagnosis ≠ Land"; no rule that mission
    workspace close requires Landed/Parked pickup on disk.
  - `PHASE2-WRITE-GATE-PROOF.md` is **absent** under `~/.tower/` (verified
    `test -f` exit 1) — until it exists and the probe was run, language is
    **mailbox only**; never "assume operational."
- Prefer extending `control-flow.md` over adding `session-loop.md`. Add
  `primitives/rules/session-loop.md` only if control-flow would bloat; if
  added, link from control-flow and concierge house-law table.
- Compose/sync: CORD clears `agent-core sync` for this unit. After edits,
  run compose so deployed entrypoints match. Verified this session:
  `agent-core status --harness cursor` works; `directive/core` already ✓ to
  `/Users/jrg/AGENTS.md`. Sync the primitives you touched (skills +
  directive/core as needed). Cite exact command(s) in the report.
- `.done` path (create when CORD gates green): 
  `/Users/jrg/agent-core/briefs/house/session-loop-2026-08-14.done`
  — ORCH posts findings and a report; CORD writes `.done` after verification.
  (If your done-when requires the marker, write it only after all encodings
  are on disk and sync cited — CORD will re-check.)

## Parallel Work Notice

- **CORD [Tower]** + **ORCH write-gate** + workers own Tower write-gate in
  workspace `w38` / agent-core. Do NOT implement write-gate. Do NOT edit
  Tower server code, write-gate briefs, or `primitives/profiles/models.json`
  (uncommitted elsewhere). Ignore uncommitted churn outside your partition.
- Do not touch Arc product or Arc invariant 8 (cite only).
- Do not `git add -A`. Do not push. Do not commit (CORD lands).
- Board topic: `house/session-loop`. Read before claiming files.

## Tower

- Fleet findings/claims: `house/session-loop` via board_post / CLI.
- Stigmergic pull loop (mandatory ranks 1–4): emit `work-available` with
  evidence; read field before idle; claim with `work-claimed` ref; `work-done`
  ref; `need-help` instead of silence. Never "post and wait."
- Operator mail: only if a hard stop (destructive / credentials / genuine
  scope change). nQ budget 3 to CORD first.
- Banner when reporting up: `===== CORD HOUSE =====` is for CORD; your
  ORCH report is structured for CORD collection.

## File partition (suggested; enforce disjoint ownership)

| Worker | Owns (exclusive) | Failures closed |
|---|---|---|
| AGNT A | `profiles/concierge.md`, `skills/concierge/SKILL.md` | 1,3,4,6 (+ desk-card spawn line for 7) |
| AGNT B | `rules/control-flow.md`, `skills/ending-session/SKILL.md` | 2,5 |
| AGNT C | `skills/starting-session/SKILL.md`, `skills/brief/SKILL.md`, `AGENTS.md`, `directives/cursor.md`, `profiles/coordinator.md`, `profiles/orchestrator.md`, `mcps/tower/COMMS-ARCH.md` (one sentence if mailbox≠substrate missing) | 1 (starting-session), 6 (skip-ritual), 7 |
| ORCH | sync + board findings + integration verify; no overlapping file edits | compose |

Same law at every layer: session loop (a)–(e). Tighten so the 2026-08-14
failure cannot recur. No sermons.

## Encodings (already ruled — write into law)

1. Session start / first operator message **is** authorization. Ban "say the
   word", "which first". Ruled proposal or act. Open questions only on hard
   stops. Kill "What are we expanding into?" when threads are already named
   or NOW/flight already names them.
2. **Diagnosis ≠ Land.** Reap a mission workspace only when the outer item is
   Landed or Parked on disk with a pickup brief. Sub-phase `.done` does not
   authorize `workspace close`.
3. Concierge holds **one load-bearing** CORD until Land or Park. Other threads
   spawn async and must not starve it. Operator "top priority" = load-bearing.
4. **mailbox ≠ substrate.** Tower operational iff `PHASE2-WRITE-GATE-PROOF.md`
   (or successor) exists and probe was run; else "mailbox only." Never
   "assume operational."
5. Reap-as-law: take a resource, return it at Done/Park (panes, worktrees,
   Arc Docker allowlist, Neon numeric allowlist). `docker system prune -a`
   stays banned. Cite Arc invariant 8; do not edit it.
6. Collect = named artifact exists. Status is pull. No "I'll collect later"
   without latch/path. starting-session breathe-mode stop-and-wait only when
   the pool is empty.
7. Briefs name profiles/roles only. Spawn verbs in
   `primitives/directives/<harness>.md`. Models via `profile-model`. Sweep
   **today's** briefs under `briefs/` that still instruct opus/fable/sonnet/
   claude-as-kind for spawns (fix forward; do not rewrite history sermons).
   Desk-card examples that hardcode `--kind` in concierge/coordinator/
   orchestrator: rewrite to "see directives/<harness>.md" form.

## Report back with

- Per-file diff summary + which failure # each edit closes.
- Quote (or "already forbids" finding with quote) for each of 1–7.
- Exact `agent-core sync` / compose command(s) run and exit status.
- Board finding on `house/session-loop` when encodings are on disk.
- List of panes/workers reaped.

## done-when

- All seven encodings present in canonical files (or ORCH finding that a
  specific file already forbids the failure, with a quote).
- No unconditional "What are we expanding into?" when threads/NOW/flight
  already name work (starting-session tightened).
- Sync/compose run; deployed entrypoints match for touched skills +
  directive/core.
- Board `house/session-loop` has ORCH finding with per-file map.
- Workers reaped; ORCH idle awaiting CORD gate (CORD writes
  `briefs/house/session-loop-2026-08-14.done` after verify).
