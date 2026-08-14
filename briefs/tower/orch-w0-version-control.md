# ORCH [W0] — Put Tower under version control

You own ONE unit of work: making the Tower message bus reviewable and revertable,
without breaking a live bus that a paused Arc fleet and three actively-working Arc
panes are sitting on right now.

Your CORD is `CORD [Tower]` (pane `w2W:p1`, registration `cord-tower`). You report to
it. You do not implement — you decompose, dispatch AGNT workers into your own tab,
verify their work against the repo, and report. Workers never commit; you gate.

---

## Pre-Verified Facts

Every fact below was verified by the CORD directly on 2026-08-13 (UTC). Re-verify
anything you act on; report any fact that has drifted rather than working around it.

**The ruling you are executing (CORD, posted to board `tower/fully-operational`):**
Tower's canonical code goes to `~/agent-core/primitives/mcps/tower/` (git-tracked).
`~/.tower/` remains the deployed runtime + state home. This is NOT a new pattern —
it is Tower's own existing, half-finished pattern (see fact 2).

1. `~/.tower/` is not a git repository. `git rev-parse --show-toplevel` from
   `/Users/jrg/.tower` → `fatal: not a git repository`. No parent is a repo.
2. **Tower's storage layer is ALREADY git-tracked in agent-core.**
   `~/agent-core/primitives/hooks/tower-ledger.mjs` is 403 lines / 13,249 bytes and is
   tracked (`git ls-files --error-unmatch` succeeds). `~/.tower/lib.mjs` is only 61
   lines and is a thin shim whose line 6 is
   `export * from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'`.
3. `~/agent-core/primitives/mcps/tower/` already exists and is git-tracked, containing
   only `README.md` (3,378 bytes, dated 2026-06-28). It is the designated, unfilled home.
4. **State paths are anchored to homedir, not to code location.** In
   `tower-ledger.mjs` lines 22-28: `export const TOWER = join(homedir(), '.tower')`
   and LEDGER/BOARD/PHEROMONES/DELIVERABLES/ODOMETER/FLIGHT are all `join(TOWER, …)`.
   `PHEROMONES` additionally honors `process.env.TOWER_PHEROMONES_PATH`.
   **Moving code therefore cannot move state.** This is the property that makes W0 safe.
5. **The untracked code set is exactly:** `cli.mjs` (296 L), `server.mjs` (350 L),
   `lib.mjs` (61 L), `cli.test.mjs`, `server-drift.test.mjs`, `hooks/` (11 live files),
   `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, plus `server-drift.criteria.md` and
   `server-drift.qa.md`.
6. **THE RELATIVE IMPORT GRAPH — this is the crux of your topology decision.**
   Verified imports:
   - `server.mjs:30` → `from './lib.mjs'`
   - `cli.mjs:18` → `from './lib.mjs'`
   - `cli.test.mjs:2,3` → `from './cli.mjs'`, `from './lib.mjs'`
   - `hooks/session-start.mjs:15`, `hooks/odometer-stop.mjs:11`,
     `hooks/prompt-inject.mjs:8`, `hooks/odometer.mjs:15`, `hooks/stop-guard.mjs:13`
     → all `from '../lib.mjs'` (relative PARENT import)
   - `hooks/flight-recorder.mjs:3` → absolute import into agent-core (already fine)
   ESM resolves symlinks to their real path before resolving relative specifiers.
   Consequence: the code set must move **together, preserving the same relative
   layout** (`<root>/lib.mjs`, `<root>/cli.mjs`, `<root>/server.mjs`,
   `<root>/hooks/*.mjs`). Move it together and every relative specifier stays correct
   under symlinks; move it piecemeal and the graph breaks.
7. **Load-bearing deployed paths that MUST keep working byte-for-byte unchanged:**
   - MCP registration: `claude mcp list` → `tower: /Users/jrg/.bun/bin/bun run
     /Users/jrg/.tower/server.mjs - ✔ Connected`. Also in `~/.claude.json` line ~2725.
   - `~/.claude/settings.json` contains **10 hook registrations** pointing at
     `/Users/jrg/.tower/hooks/*.mjs` — `ask-bridge.mjs` (pre/post/clear, 4 sites),
     `odometer.mjs`, `deposit-reminder.mjs`, `flight-recorder.mjs` (2 sites),
     `enforce-brief.mjs`, `session-start.mjs`. Verified lines: 34, 46, 56, 84, 116,
     128, 158, 180, 215, 226.
   - `bun ~/.tower/cli.mjs` is documented machine-wide (global agent context,
     tower-orchestration.md, brief SKILL.md, and ~40 other files).
   - `~/.claude/tower` is a **symlink** → `/Users/jrg/.tower` (so
     `~/.claude/tower/cli.mjs` etc. must also keep resolving).
8. **Machine precedent for preserving deployed paths** (all three patterns exist):
   - symlink: `~/.local/bin/fleet-task` → `~/agent-core/primitives/tools/fleet-task/fleet-task.ts`
   - run-in-place from agent-core: `statem.ts` / `twr.ts` (no deployed copy at all)
   - absolute re-export shim: `~/.tower/lib.mjs` itself (fact 2)
9. `~/agent-core` is a git repo, currently on branch `main`, with 17 untracked
   entries already present (including `briefs/tower-fully-operational.md`). Do not
   `git add -A`; stage explicitly. Recent history: `949238d`, `7a3eec2`, `f7a9901`.
10. **Seven backup files exist in `~/.tower/`** (the brief that started this said four):
    `cli.mjs.bak-20260812T165125Z`, `lib.mjs.bak-20260812T194500Z`,
    `COMMS-ARCH.md.bak-20260810T221108Z`, `COMMS-ARCH.md.bak-20260812T165025Z`,
    `server.mjs.bak-20260810T221108Z`, `server.mjs.bak-20260812`,
    `server.mjs.bak-20260812T165125Z`, `server.mjs.spine-backup-20260730T211657Z`
    (that is 8 lines; `server.mjs.bak-20260812` is byte-identical in size to the live
    `server.mjs` at 16,798 — verify before treating it as redundant).
11. **A CORD backup already exists** at
    `~/.tower-backups/pre-cord-20260813T044255Z` (7.0 M): code, state
    (board/ledger/odometer/pheromones), `hooks/`, a tarball of
    flight+deliverables+cursors+briefs, and `CHECKSUMS.txt` with sha256 of the four
    state files as of 04:42:55Z. You do not need to re-take it; you MAY take your own
    before your own mutations.
12. **THE BUS IS LIVE.** `herdr agent list` at 04:41Z shows workspace `w2V` (arc) with
    20 panes, of which three are `agent_status: working` and posting to this bus:
    `orch-infra-upgrade` (w2V:pQ), `madewell-kernel-upgrade` (w2V:pW),
    `orch-docs-control-flow` (w2V:pX). The concierge is `w2T:p1` (idle). You are in
    workspace `w2W` (tower).

## Your tasks

### T1 — Preserve the backup files into real history FIRST
Before any move, get the `.bak-*` content into git so nothing is lost.
- **done when:** every one of the 8 files in fact 10 has its content committed in
  `~/agent-core` (an `attic/` or equivalent path under the canonical tower dir is
  fine — you choose and state why), AND you have posted a diff summary to the board
  saying what each backup differed from in the live file. Do **not** delete the
  originals from `~/.tower/` in this task — deletion is W5 and is the CORD's call.

### T2 — Move the code set to the canonical home, together
Move the fact-5 code set into `~/agent-core/primitives/mcps/tower/`, preserving the
relative layout required by fact 6.
- **done when:** `~/agent-core/primitives/mcps/tower/` contains `lib.mjs`, `cli.mjs`,
  `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs`, `hooks/` (all 11 live files),
  `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, and the two `server-drift.*.md`
  files, all committed on a branch; and `git log` shows them as real tracked files.

### T3 — Restore every deployed path, and PROVE it live
Re-establish `~/.tower/{lib,cli,server}.mjs`, `~/.tower/hooks/*.mjs`,
`~/.tower/COMMS-ARCH.md`, `~/.tower/RESPONSIBLE-PARTY-AND-NQ.md` so that every path in
fact 7 resolves. Symlinks are the expected mechanism given fact 6 + fact 8; if you find
symlinks break something, say so with the error and use the absolute-shim pattern
instead — state which you chose and why.
- **done when ALL of these are demonstrated with pasted output:**
  1. `bun ~/.tower/cli.mjs status` exits 0 and prints real data.
  2. `bun ~/.tower/cli.mjs board --limit 3` exits 0.
  3. `claude mcp list` still shows `tower: … ✔ Connected`.
  4. A fresh MCP server process starts clean:
     `bun run ~/.tower/server.mjs` accepts an `initialize` request over stdio and
     responds without error (kill it after).
  5. Each of the 6 relative-importing hooks in fact 6 loads without a resolution
     error — e.g. `bun -e "await import('/Users/jrg/.tower/hooks/stop-guard.mjs')"`
     or the hook's real invocation; do this for all 6.
  6. `bun test` for `cli.test.mjs` and `server-drift.test.mjs` runs from the canonical
     location, and you report the **exact pass/fail counts** — a pre-existing failure
     is fine and must be reported honestly, not fixed silently and not hidden.
  7. `ls -l ~/.claude/tower/cli.mjs` resolves (the double-hop through the
     `~/.claude/tower` symlink still works).

### T4 — Verify the LIVE consumers are undamaged
Fact 12's three working panes and the whole fleet must be unaffected.
- **done when:** you have (a) confirmed `board.jsonl` and `ledger.jsonl` sha256 are
  either unchanged from `CHECKSUMS.txt` or have only GROWN (new lines appended, no
  rewrite — check with `wc -l` and by confirming the old checksum still matches the
  corresponding prefix); (b) posted a board line from the CLI path and read it back;
  (c) confirmed via `herdr agent list` that no pane moved to an error state that it
  was not in at 04:41Z. **If any live pane breaks, stop and report immediately —
  do not attempt a repair that widens the blast radius.**

### T5 — Record the pattern
- **done when:** `~/agent-core/primitives/mcps/tower/README.md` states the canonical/
  deployed split, the relative-import constraint from fact 6, and the state-anchor
  property from fact 4, so the next agent does not have to rediscover them.

## Constraints (non-negotiable)

- **Additive and reversible only.** Never delete a `.bak-*` original (that is W5).
  Never touch `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`, `pheromones.jsonl`,
  `flight/`, `deliverables/`, `cursors/` — W0 is a CODE change; state is out of scope.
- **The server must stay up.** Do not restart or kill the running MCP server for other
  sessions. A running process holds its inode, so replacing a path with a symlink to
  identical content is safe — but verify, do not assume.
- Branch first in `~/agent-core`; one coherent unit; stage explicitly, never
  `git add -A` (fact 9 — there are 17 pre-existing untracked entries that are NOT yours).
- Commit format per the machine standard (`<type>(<scope>): <summary>` +
  PHASE/DONE/TODO/BLOCKED + Co-Authored-By).
- Workers never commit. You gate and commit.
- Anything genuinely destructive or irreversible: STOP and route to the CORD as a
  proposal. Do not execute it.
- Spawn workers as visible herdr panes in your own tab
  (`spine-spawn worker … --kind claude --profile coder`), never harness-internal
  background subagents. Reap them when done.

## Tower

- Board topic: **`tower/w0-version-control`**. Post a CLAIM before touching shared
  files, findings as you learn them, and your final report.
- Also post a one-line summary to **`tower/fully-operational`** when your unit closes.
- Your workers post to `tower/w0-version-control` with their own `from` names.
- Send kinds: use `board_post` for fleet mail. Do NOT use `send_to_user` — you are
  fleet, not operator-facing; your CORD reads the board.
- If you hit a decision only the CORD can make, post it to the board as a question
  and continue with everything not blocked by it. Your nq budget is 3.
- Doorbell rule: if you ever do raise something operator-urgent, ring it in the same
  breath — `herdr notification show "<title>" --body "<one line>" --sound request`.

## Report back with

1. Which mechanism you chose for the deployed paths (symlink vs absolute shim) and
   the evidence that decided it.
2. The pasted verification output for all 7 items in T3's done-when.
3. Exact test counts (pass/fail/skip) for both test files, with any pre-existing
   failures named.
4. The T4 liveness evidence — checksum/line-count comparison and pane status.
5. The branch name and commit shas.
6. Anything you could NOT prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.
