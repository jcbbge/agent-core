# ORCH-1 — `spine-spawn` routes cursor, proven live

You are the **orchestrator (ORCH)** for one committed unit: make the machine's
spawn door serve every harness, and record the parity honestly. You decompose,
dispatch, verify, and reap. You do not implement.

Your CORD is `CORD [harness-homogeneity]`. Board topic:
`agent-core/harness-homogeneity`. Do NOT use emojis anywhere.

## Read first (in this order, all three, before planning)

1. `~/agent-core/briefs/harness-homogeneity/PLAN.md` — the ruled design. **You
   implement §1.2, §1.3, §2, §3 Phases 1-3, and §2.1.** Phases 4-6 are NOT
   yours.
2. `~/agent-core/briefs/harness-homogeneity/COUPLING-MAP.md` — the verified
   coupling evidence.
3. `~/agent-core/briefs/harness-homogeneity/TUP-GROUNDING.md` — why, against
   `~/tup/contracts/`.

## Pre-Verified Facts (your CORD verified every one personally, 2026-08-16)

Cite these; do not re-derive them. If one turns out wrong, that is a finding to
post, not a reason to stop.

**The barrier:**

- `~/herdr-spine/bin/spine-spawn` is 1484 lines of Python, repo `~/herdr-spine`
  on branch `main` @ `fbb76b9`, working tree **clean**.
- `spine-spawn:1470-1475` refuses `kind == "cursor"` with a message citing
  ruling 2026-08-11. This is the entire barrier.
- `spine-spawn:628` seats every other kind with:
  `run_json("agent", "start", name, "--kind", kind, "--pane", pane_id, "--timeout", timeout_ms, *passthrough, ...)`
- **herdr seats cursor natively.** `~/bin/herdr:78` runs
  `"$REAL" agent start "$name" --kind "$kind" --pane "$pane"` and
  `~/bin/herdr:33` normalizes `cursor|cursor-agent` to `cursor` as a legal desk
  harness. `~/cursor-shim/cursor-spine:741` makes the identical call today.
- `herdr api schema --json` shows `AgentStartParams.kind` is an unconstrained
  `string` — herdr does not gate kinds in its schema. `IntegrationTarget`'s
  enum includes `cursor`.
- `herdr agent list` right now shows two live panes with `"agent":"cursor"` and
  `agent_session.source == "herdr:cursor"` (`w3S:p1`, `w3V:p1`). **Do not touch
  those panes — they are not yours.**

**Model resolution (edit B is required, not optional):**

- `spine-spawn:554-572` `kind_model()`: for a non-pi kind whose profile model
  starts with `cursor/`, it reads
  `~/agent-core/primitives/profiles/models.json` and returns
  `table[profile]["kind_models"][kind]`.
- **Every profile's `kind_models` map in that file contains only a `claude`
  key** (verified by reading the file in full). So `kind_models["cursor"]` is
  absent, `kind_model` returns `None`, and a cursor agent silently inherits
  cursor-agent's default model — discarding the operator's profile choice.
- The translation table you need already exists: `cursor-spine:522-543`
  `map_model()` maps gateway slugs to cursor-agent model ids (e.g.
  `cursor/claude-opus-5@300k:high` → `claude-opus-5-thinking-high`), with a
  de-slugging `*)` fallback at `:539` and a default of `auto` with a WARN at
  `:543`. **Read it; do not invent a second table.**
- `cursor-spine:590` proves herdr forwards `--force --trust --model <id>` to
  cursor-agent correctly when passed after `--`.
- `spine-spawn:620-623` is the existing `--` passthrough mechanism.

**Why the worktree work evaporates (PLAN §1.3) — verified:**

- `spine-spawn:514` (`apply_coder_isolation`) sets
  `args.cwd = ensure_git_worktree(base_cwd, wt_slug, paths=paths)`.
- `create_tab:922-931` and `split_pane:934-943` both pass
  `--cwd os.path.abspath(cwd)` to herdr.
- So the pane is created **inside** the worktree and the agent is seated there.
  `cursor-agent --worktree` is never passed. **Do not port
  `worktree_name_for`, `precreate_sparse_worktree`, or `sparse-apply`.**

**The verbs that already work on cursor (PLAN §2) — verified by mechanism:**

- `spine-claim:157` uses `$HERDR_PANE_ID`; `:213` calls
  `herdr pane report-metadata "$pane_id" --source spine:claim`.
- `spine-report:20,64` uses `$HERDR_PANE_ID`; `:84-101` `exec herdr pane report-metadata`.
- `spine-workspace:40,60` are pure `herdr workspace` calls.
- `spine-ruling` is a pure board append with no pane concept; **it refuses a
  ruling with no `--scope`** (verified by reading the file).
- `spine-watch` has **no source filter of any kind**.
- herdr injects `$HERDR_PANE_ID` into every pane it owns, whatever is seated.

**The misdirection you are also fixing:**

- `~/agent-core/primitives/hooks/spawn-door.sh:37-39` denies any command
  matching `herdr agent start` **unconditionally** — no harness branch — and
  the deny text points only at `~/bin/spine-spawn`.
- `~/agent-core/primitives/HARNESS-PARITY.md:70` records that hook as FULL on
  cursor. `~/bin/herdr:83` writes `cursor` into
  `~/.config/herdr/desk-harness`, which `spine-spawn:1459-1468` reads as the
  default kind. `spine-spawn:1470` then refuses it.

**`ctl-fleet` (PLAN §2.1):**

- `ctl-fleet:12` `CLAUDE_PROJECTS`; `:228` `claudeUuid` gated on
  `agent_session.source === "herdr:claude"`; `:229-237` globs the transcript;
  `:240` `durationOf` returns `""` for any other engine.
- CORD ruled: render `—`, do **not** add a `~/.cursor/` transcript reader.

**Repo states:** `~/herdr-spine` main @ `fbb76b9` clean. `~/agent-core` main @
`8e470a7`, with unrelated uncommitted work from other agents.
`~/cursor-shim` `feat/a5-batch-record` @ `d9c3590` clean — **out of scope for
you; do not modify it.**

## Your file partition — binding

**You own, exclusively:**

- `~/herdr-spine/bin/spine-spawn`
- `~/herdr-spine/bin/ctl-fleet`
- `~/agent-core/primitives/HARNESS-PARITY.md`
- `~/agent-core/primitives/rules/worktree-lifecycle.md`

**You must NOT touch:**

- Anything under `~/cursor-shim/` (Phases 4-6, a later unit).
- `~/agent-core/primitives/skills/brief/SKILL.md`,
  `~/agent-core/primitives/profiles/coder.md`, or anything under
  `~/agent-core/briefs/` other than files you create under
  `briefs/harness-homogeneity/`. **`ORCH-2` owns those and is running in
  parallel.**
- The ~18 uncommitted changes already in `~/agent-core` from another agent
  (skills/, hooks/). Do not investigate, revert, commit, or fix them.
- Panes `w3S:p1` and `w3V:p1`, and any pane not spawned by you.

No two of your workers may hold `spine-spawn` at the same time. It is the
contended file of this whole project.

## Tasks

### T1 — Teach `spine-spawn` to route cursor (PLAN §1.2, edits A-D)

A. Delete the refusal at `:1470-1475`.
B. `kind_model()` `:554-572` — resolve a cursor model. Port the mapping
   semantics of `cursor-spine:522-543`, including the `*)` de-slugging fallback
   and the `auto` + WARN default. Keep `profile-model` the single writer of
   model choice; do not add cursor rows to `models.json` if the slug map makes
   them unnecessary, and say in the commit which you chose and why.
C. `start_agent()` `:613-624` — extend the `--` passthrough so a cursor spawn
   carries `--force --trust --model <id>`, and `--mode <plan|ask>` when given.
D. `add_common()` `:1354+` — add `--mode {plan,ask}`, validated.

- **Done when:** `python3 -c "import ast,sys; ast.parse(open('/Users/jrg/herdr-spine/bin/spine-spawn').read())"` exits 0; `spine-spawn --help` and
  `spine-spawn orch --help` both run and show `--mode`; and
  `grep -n 'cursor spawns do not go through' ~/herdr-spine/bin/spine-spawn`
  returns **nothing**.

### T2 — Prove a cursor agent spawns through the door (Unit 3 task 1)

Spawn a **real** cursor agent through `spine-spawn` with an explicit
`--kind cursor` and a profile, into a workspace you created for this test.

- **Done when:** you have captured, in
  `briefs/harness-homogeneity/PROOF-cursor-spawn.md`: the exact command run,
  its full output, and the `herdr agent list` record for the new pane showing
  `"agent":"cursor"` and `agent_status` **`working`**. NO MOCKS. Reading the
  code is not proof. Reap the pane and close the workspace when done, via
  `spine-workspace close <id> --why "<reason>"`.
- **Also prove the model landed:** the spawn log line
  `"<pane>: cursor started and ready as <name> model=<id>"` must name the id the
  profile resolves to, not `auto`. If it says `auto`, edit B is not finished.

### T3 — Prove the spine verbs reach a live cursor agent (Unit 3 task 2)

The cursor agent must run these **itself** — you invoking them on its behalf is
not proof.

1. `spine-claim claim "<resource>" --ttl 30`, then `release`.
2. Visible to `spine-watch`.
3. Passes the workspace door (`spine-workspace`).

- **Done when:** `briefs/harness-homogeneity/PROOF-cursor-verbs.md` contains,
  for each of the three, the command the cursor agent ran, its output, and the
  independent observation confirming it (the claim token visible via
  `herdr pane list`, the `spine-watch` line, the `spine-workspace` board
  trace). Each proven by a real run.
- If any of the three fails, **that is the deliverable** — post it as a finding
  with the failure output and say precisely what broke. A corrected
  Pre-Verified Fact is a valuable result, not a failure.

### T4 — `ctl-fleet` reports honestly (PLAN §2.1)

Render `—` for any pane whose session source has no duration reader. Do not add
a second transcript reader.

- **Done when:** `ctl-fleet` renders a dash rather than a blank for a
  non-claude pane, demonstrated against a live cursor pane, and the reason is a
  comment in the file.

### T5 — Parity recorded honestly (Unit 3 task 3)

In `HARNESS-PARITY.md`:

- Row `:84` (`herdr-spine (fleet spawn)`) — rewrite the cursor cell to the
  truth after T2.
- Add rows for the capabilities this unit proves or disproves: fleet spawn,
  resource claim, workspace door, ruling deposit, fleet observation, session
  duration. **Each cell carries its true state and a command that proves it.**
  A blank cell is a NO (`HARNESS-PARITY.md:9-11`). An unwired gate reports
  unwired (`:56`).
- Record the spawn-door misdirection and whether it is now resolved.

In `worktree-lifecycle.md`, §7 `:86-94`: the DOOR+DOCTRINE residual must be
either resolved to DOOR or re-stated with its reason. **PLAN §3 says it does
not resolve until Phase 5, which is not yours** — so the honest action here is
to re-state it per-path and name Phase 5 as where it resolves. Do not upgrade
it to DOOR on the strength of work that has not happened.

- **Done when:** every row you touch names a verify command, and you have **run
  each one** and recorded its output. Do not copy a claim forward unverified.

### T6 — Deposit the supersession (Unit 3 task 4)

Record that the operator's homogeneity ruling supersedes the 2026-08-11 ruling
cited in the deleted error string. Use
`~/herdr-spine/bin/spine-ruling` — **it refuses an unscoped ruling.** The scope
must name what it does AND does not apply to.

- **Done when:** the ruling is deposited, its scope names both sides, and you
  paste the tool's confirmation line into your report.

### T7 — Land herdr-spine

- **Done when:** `~/herdr-spine` is committed on `main` in the house format
  (`~/.claude/CLAUDE.md` §Work tracking: `<type>(<scope>): <summary>` +
  `PHASE:`/`DONE:`/`TODO:`/`BLOCKED:` + `Co-Authored-By:`), staged explicitly
  (never `git add -A`), and pushed to the operator's own remote on green.
- **agent-core is DIFFERENT: write its files, but do NOT commit agent-core
  until you have read board topic `agent-core/credential-scrub` and confirmed
  no history rewrite is in flight.** If one is, leave the files uncommitted,
  say so in your report, and post a finding. Do not force the issue.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information. `SPAWN_DOOR=off` is audited — if
  you genuinely need it, post a finding saying why before using it.
- **Do not break cursor spawning at any point.** `cursor-fleet` and
  `cursor-spine` must keep working throughout; you are not touching them, so
  the only way to break them is by breaking herdr or the board.
- Match surrounding style. `spine-spawn` is Python 3 (`#!/usr/bin/env python3`,
  stdlib only, no third-party imports). `ctl-fleet` is TypeScript run by bun.
- **NO MOCKS.** Every parity claim proven by a real spawn of a real agent.
- No provider, model, or harness names in briefs you write or in canonical core
  files — those belong only in `primitives/directives/<harness>.md`. Naming
  `--kind cursor` inside `spine-spawn`'s own code is fine; that is the adapter
  boundary, not a brief.
- Reap every pane and worktree you create. Done = gone.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Compose edits into
  a single call; if you need a second write, Read the file first, by contract.

## Tower (mid-run communication)

Tower is **MAILBOX ONLY**. The write gate is unproven and a peer CORD is
probing it. Do not describe Tower as operational.

- Board: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "ORCH-1 spine-routes-cursor"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`
- Claim: `~/herdr-spine/bin/spine-claim claim "spine-spawn" --ttl 30`,
  heartbeat every 10-20s, `release` when done. **Claim `spine-spawn` before any
  worker touches it** — it is contended across this whole project.

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

## Report back with

- The exact `spine-spawn` command that spawned a cursor agent, and the observed
  `agent_status` flip. Quote the output.
- For each of the three verbs in T3: the command the cursor agent ran and the
  independent confirmation.
- The model id the cursor agent actually received, and whether it matched the
  profile.
- The parity table's honest state, including anything still DOCTRINE and why.
- The `spine-ruling` confirmation line with its scope.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact above that turned out wrong, and what you found
  instead.
- Whether agent-core was committed, or left uncommitted and why.
