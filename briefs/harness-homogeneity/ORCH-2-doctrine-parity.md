# ORCH-2 — the law reaches every harness

You are the **orchestrator (ORCH)** for one committed unit: close the doctrine
gap that lets one harness receive a different body of law than the others. You
decompose, dispatch, verify, and reap. You do not implement.

Your CORD is `CORD [harness-homogeneity]`. Board topic:
`agent-core/harness-homogeneity`. Do NOT use emojis anywhere.

**`ORCH-1 spine-routes-cursor` is running in parallel.** Its partition and
yours are disjoint. Do not touch its files; it will not touch yours.

## Read first

1. `~/agent-core/briefs/harness-homogeneity/PLAN.md` — §2, §3 Phase 3, §5.
2. `~/agent-core/briefs/harness-homogeneity/COUPLING-MAP.md` §7 — the corrected
   Pre-Verified Facts. **The brief that opened this project got Unit 4's
   premise wrong; the corrected premise is below and is what binds you.**

## The premise, corrected — read this before anything else

The originating brief said briefs instruct workers to use `spine-claim` and
that "on cursor that instruction is dead on arrival", so the fix was to correct
or annotate every brief naming it.

**That is wrong, and acting on it would waste the unit.** Verified by your
CORD:

- `spine-claim` is engine-blind. `:157` reads `$HERDR_PANE_ID`; `:213` calls
  `herdr pane report-metadata`. herdr injects that variable into every pane it
  owns, whatever engine is seated. **The instruction is true on every harness
  and works on a cursor pane today, unmodified.**
- `~/agent-core/primitives/skills/brief/SKILL.md` was inspected and is
  **already correct**: `:149-163` forbids provider/model/`--kind` in briefs and
  defers spawn verbs to `primitives/directives/<harness>.md`. Its `spine-claim`
  guidance at `:64-81` is true everywhere. **It emits nothing false.**
- The ~35 historical briefs naming `spine-claim` are therefore **not wrong**,
  and they are the project record. **Do not rewrite them.** `shape.md:49-50` —
  a correction stands beside what it corrected; retired vocabulary stays
  labelled, not deleted.

**The real defect is a shadowing profile, and it is worse than the one the
brief described.**

## Pre-Verified Facts (your CORD verified every one personally, 2026-08-16)

**The shadowing mechanism:**

- `~/cursor-shim/cursor-spine:503-505`:
  ```
  PROMPT_PATH="$SHIM_DIR/profiles/$BASE.md"
  [[ -f "$PROMPT_PATH" ]] || PROMPT_PATH="$PROFILES_DIR/$BASE.md"
  ```
  Shim-local profiles take **whole-file precedence**; agent-core is the
  fallback only when the shim file is absent. The comment at `:500-502` states
  the intent: *"so agent-core is never touched and the shim stays rippable."*
- `~/cursor-shim/profiles/` contains `arbiter.md`, `coder.md`, `test-maker.md`,
  `tester.md`. Three of those are shim-only Verify-beat roles with no
  agent-core equivalent — **legitimate, leave them alone.**
- **`coder.md` is the problem.** Both files are 39 lines.
  `~/agent-core/primitives/profiles/coder.md` and
  `~/cursor-shim/profiles/coder.md` are different documents, and the shim one
  wins for every cursor coder.

**What the shim's `coder.md` silently drops:**

1. `agent-core/primitives/profiles/coder.md:9-10` — *"Claim owned resources on
   herdr (`spine-claim`) when contention matters; report task/verdict via
   `spine-report` so the sidebar stays honest."* **Absent from the shim file.**
   Verified: `grep -n 'spine-claim\|spine-report\|spine-spawn' ~/cursor-shim/profiles/coder.md`
   returns **nothing**.
2. **The entire `## Stigmergic coordination (COMMS-ARCH plane 5 — ranks 1-4)`
   section — 20 lines** covering deposit-never-deliver, the pull loop,
   heartbeat claims and decay, and the two legal stopping states. The section
   labels itself MANDATORY for ranks 1-4. **Absent from the shim file.**

**What the shim's `coder.md` adds and which MUST be preserved:** the
Plan→Implementation isolation wall (the implementer does not write, run, or
judge its own tests; builds from the plan, not the suite; tests physically
absent from its checkout). This is good law and the reason the override exists.
**Do not delete it. Do not weaken it.**

**The directive that goes false when `ORCH-1` lands:**

- `~/agent-core/primitives/directives/cursor.md:10-11` currently reads:
  *"fleet spawn = `~/cursor-shim/cursor-fleet` / `~/cursor-shim/cursor-spine`
  (not `spine-spawn --kind cursor`)"*.
- That parenthetical becomes **false** the moment `ORCH-1` T1 lands. This file
  is canonical: it is composed into the deployed cursor entrypoint
  (`~/AGENTS.md`), so a stale line here misinforms every cursor session.

**Repo states:** `~/agent-core` main @ `8e470a7` with unrelated uncommitted
work from other agents. `~/cursor-shim` on branch `feat/a5-batch-record` @
`d9c3590`, working tree **clean** — **not `main`**; see Constraints.

**Live peer units — do not edit their briefs:** `agent-core/credential-scrub`
and `agent-core/tower-bus-integrity` each have a live CORD and briefs under
`~/agent-core/briefs/credential-scrub/` and `briefs/tower-bus-integrity/`.
Several name `spine-claim`. They are correct, they are someone else's, and they
are in flight.

## Your file partition — binding

**You own, exclusively:**

- `~/cursor-shim/profiles/coder.md`
- `~/agent-core/primitives/directives/cursor.md`
- `~/agent-core/briefs/harness-homogeneity/DOCTRINE-SWEEP.md` (you create it)

**You must NOT touch:**

- `~/herdr-spine/bin/spine-spawn`, `~/herdr-spine/bin/ctl-fleet`,
  `~/agent-core/primitives/HARNESS-PARITY.md`,
  `~/agent-core/primitives/rules/worktree-lifecycle.md` — **`ORCH-1` owns
  these and is running now.**
- `~/cursor-shim/cursor-spine`, `cursor-fleet`, `cursor-finish` — PLAN Phases
  4-5, a later unit. The composition fix at `cursor-spine:503` is **explicitly
  out of scope**; you fix the file's content, not the resolution mechanism.
- Any brief under `briefs/credential-scrub/` or `briefs/tower-bus-integrity/`.
- The ~18 uncommitted changes already in `~/agent-core` from another agent.
- The ~35 historical briefs naming `spine-claim`.

## Tasks

### T1 — Restore the dropped law to the cursor coder profile

Rewrite `~/cursor-shim/profiles/coder.md` so a cursor coder receives **both**
bodies of law: everything the shim override adds, plus everything it currently
drops.

- The isolation wall stays, in full, unweakened.
- The `spine-claim` / `spine-report` rule returns.
- The full `## Stigmergic coordination (COMMS-ARCH plane 5 — ranks 1-4)`
  section returns, **byte-identical to
  `~/agent-core/primitives/profiles/coder.md`** so the two cannot drift on
  wording. Copy it; do not paraphrase it.
- Keep the header note explaining why a shim override exists, and **add** a
  line naming what it inherits verbatim from agent-core and warning that the
  stigmergy section is a copy that must be kept in sync until PLAN Phase 5
  replaces file-precedence with composition.

- **Done when:**
  1. `diff <(sed -n '/## Stigmergic coordination/,/^and \`… field\`\.$/p' ~/agent-core/primitives/profiles/coder.md) <(sed -n '/## Stigmergic coordination/,/^and \`… field\`\.$/p' ~/cursor-shim/profiles/coder.md)`
     produces **no output** (adjust the end-anchor to the real last line of the
     section; verify the section you extracted is complete before trusting the
     diff).
  2. `grep -c 'spine-claim' ~/cursor-shim/profiles/coder.md` is ≥ 1 and
     `grep -c 'spine-report'` is ≥ 1.
  3. The isolation-wall section is still present in full — verified by
     confirming every one of its bullets survives, listed in your report.

### T2 — Audit every other shim profile for the same defect

`arbiter.md`, `test-maker.md`, `tester.md` have no agent-core counterpart, so
they cannot shadow. But they are rank-3/4 profiles and the stigmergy law binds
ranks 1-4.

- **Done when:** `DOCTRINE-SWEEP.md` states, per file, whether it carries the
  stigmergic-field law and the two-legal-stopping-states rule, and — if not —
  whether that is a gap you closed or a deliberate exemption you are naming for
  the operator. Cite line numbers. Do not silently add law to a file whose role
  does not take it; say what you decided and why.

### T3 — Sweep for other shadowed or harness-divergent doctrine

The `coder.md` shadow was found by comparing two files that happened to share a
name. Find out whether it is the only one.

- Compare every file in `~/cursor-shim/profiles/` against
  `~/agent-core/primitives/profiles/`.
- Search `~/cursor-shim/` for any other file that overrides, shadows, or
  restates agent-core law (`rules/`, `agents/`, `docs/`, `bolt-on`,
  `.cursor/rules/`).
- **Done when:** `DOCTRINE-SWEEP.md` has a table — shim file · agent-core
  counterpart (or none) · what diverges · verdict (shadowing defect / legitimate
  addition / harmless). Every row cites a file and line. An entry may not read
  "unknown" without the evidence that made it unknowable.

### T4 — The cursor directive tells the truth

`~/agent-core/primitives/directives/cursor.md:10-11` must stop asserting that
`spine-spawn --kind cursor` is not the spawn path — **but only once that is
actually true.**

- **Gate:** do not edit this line until
  `~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md` exists and
  contains an observed `agent_status` flip to `working`. Block on it with:
  `latch wait --file ~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md --timeout 2h`
  (exit 0 = matched, 3 = timeout, 4 = vanished). **Do not poll in a loop; do
  not `sleep`.** If it times out, do everything else, then post `need-help`.
- Then rewrite `:10-11` to name the real spawn path, and check the whole file
  for any other line the change falsifies.
- **Done when:** the file names the true spawn path, you have read
  `PROOF-cursor-spawn.md` and quoted the status flip you relied on, and no
  remaining line in the file contradicts it. If the composed entrypoint needs a
  re-sync to deploy, say so in your report and name the command — do not run a
  machine-wide sync without saying you are about to.

### T5 — Record what you did NOT change, and why

The originating brief asked for a sweep of every brief naming `spine-claim`.
Your CORD ruled that sweep out on the evidence above. That ruling must be
visible to whoever reads this project next.

- **Done when:** `DOCTRINE-SWEEP.md` closes with a section stating: the
  original instruction, why it was not carried out, the evidence
  (`spine-claim:157,213`; `brief/SKILL.md:64-81,149-163`), and the ~35
  historical briefs left deliberately untouched as the project record.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information.
- **`~/cursor-shim` is on `feat/a5-batch-record`, not `main`.** An operator
  question about where this unit lands is open (PLAN §7). **Commit your
  cursor-shim change on a new branch off `feat/a5-batch-record`. Do NOT merge
  it, do NOT push it to `main`, and do NOT resolve that branch.** If the
  operator answers on the board, follow the answer.
- **Do NOT commit `~/agent-core` until you have read board topic
  `agent-core/credential-scrub` and confirmed no history rewrite is in
  flight.** If one is, leave the files written but uncommitted, say so in your
  report, and post a finding.
- Commits use the house format (`~/.claude/CLAUDE.md` §Work tracking), staged
  explicitly — never `git add -A`.
- **Do not break cursor spawning at any point.** You are editing a profile
  markdown file and a directive; neither changes spawn behaviour. If you find
  yourself about to change how a profile is *resolved*, stop — that is Phase 5.
- No provider, model, or harness names in briefs. `primitives/directives/cursor.md`
  is the one file where naming the harness is correct — that is its purpose.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Compose edits into
  a single call; if you need a second write, Read the file first, by contract.
- Reap every pane and worktree you create. Done = gone.

## Tower (mid-run communication)

Tower is **MAILBOX ONLY**. The write gate is unproven and a peer CORD is
probing it. Do not describe Tower as operational.

- Board: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "ORCH-2 doctrine-parity"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`
- Claim: `~/herdr-spine/bin/spine-claim claim "cursor-shim-profiles" --ttl 30`,
  heartbeat every 10-20s, `release` when done.

**MANDATORY — the stigmergic field. You are rank 2.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **mandatory evidence** — an emit without evidence is not an emit. Read the
field before ever going idle. Claim with `work-claimed` `ref`-ing the exact
pheromone id; `work-done` `ref`-ing what you claimed; `need-help` rather than
going quiet. TTL is 30s and an unheartbeated claim evaporates by design.

`bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` · `... field`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, **after** doing everything
that does not depend on it. "Reported and awaited instruction" is not a
stopping state. Do not re-prompt an idle pane for status — collect via the
board, `.done` markers, and `herdr agent list`.

You are the profile unit's own best test case: **do not deliver instructions to
`ORCH-1` directly.** If you need something from it, deposit a trace.

## Report back with

- The restored `coder.md`: proof the stigmergy section is byte-identical to
  agent-core's, and the list of isolation-wall bullets that survived intact.
- The T3 table's headline: how many shim files shadow an agent-core
  counterpart, and how many diverge in law rather than in role.
- Whether T4's gate opened, what you quoted from `PROOF-cursor-spawn.md`, and
  the directive's new text.
- Any other harness-divergent doctrine you found that this unit did not fix,
  named explicitly for a later unit.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact above that turned out wrong, and what you found
  instead.
- Whether agent-core and cursor-shim were committed, or left uncommitted and
  why, and on which branch.
