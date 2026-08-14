# ORCH [w0-canonical-source] — Make the repo the real SOURCE, not a snapshot

You own ONE unit of work: closing the seam between Tower's new git-tracked home and the
live runtime that actually executes, so that "edit canonical sources, never deployed
entrypoints" becomes ENFORCED for Tower instead of aspirational.

Your CORD is `CORD [Tower]` (pane `w2W:p1`, registration `cord-tower`). You do not
implement — you decompose, dispatch AGNT workers into your own tab, verify against the
repo, and report.

**A sibling ORCH is live: `orch-w0-version-control` (pane `w2W:p4`, branch
`tower/w0-version-control`).** It owns the staging lane and the 19 copied files. DO NOT
edit its files on its branch or re-do its work. Your lane is the DEPLOY/SOURCE seam.
Coordinate through the board; if you need a change inside its partition, ask via the
board rather than reaching in.

---

## Pre-Verified Facts

Verified by the CORD directly on 2026-08-13 UTC. Re-verify anything you act on; report
drift rather than working around it.

### The problem in one line
The repo now EXISTS but it is not the SOURCE. There is **no deploy or sync mechanism in
`primitives/mcps/tower/`** — `find` for `*deploy*`, `*sync*`, `*install*` returns
nothing. Meanwhile `~/.tower/` is what actually runs.

1. **Wave 1 landed.** `~/agent-core` is on branch `tower/w0-version-control`, commit
   `5e281be` "feat(tower): put Tower's code set under version control at its canonical
   home" — 30 files, 4,151 insertions: 5 code files, 4 docs, 10 `hooks/*.mjs`, and
   `attic/` (9 preserved backups + DIFF-SUMMARY.md + README.md).
2. **The cutover has NOT happened.** `~/.tower/cli.mjs`, `server.mjs`, `lib.mjs`,
   `COMMS-ARCH.md`, `hooks/stop-guard.mjs`, `hooks/ask-bridge.mjs` are all still
   **regular files**, not symlinks. So there are currently TWO full copies.
3. **They have not yet diverged.** All 19 files are byte-identical (`cmp`) between
   `~/.tower/` and `~/agent-core/primitives/mcps/tower/` as of 00:05Z. You are working
   at the safe moment — this is a design decision, not a merge.
4. **A `.gitignore` exists** at `primitives/mcps/tower/.gitignore` covering
   `ledger.jsonl`, `board.jsonl`, `odometer.jsonl`, `pheromones.jsonl` — because running
   the tests from that directory writes state relative to cwd. It does NOT yet cover
   `flight/`, `deliverables/`, `cursors/`. Worth completing; not your main mission.

### THE CENTRAL FACT — there is already a COMPETING canonical source and deploy step
5. `~/herdr-spine/install.sh`, function `install_tower_auto()` (from line ~184), already
   deploys into `~/.tower/`:
   - `cc-hooks/server.mjs` → `~/.tower/server.mjs` (line 218-238), **sha-drift-guarded**
   - `cc-hooks/stop-verdict.mjs` + `cc-hooks/ask-bridge.mjs` → `~/.tower/hooks/`
6. `~/herdr-spine/cc-hooks/` exists and contains exactly three files: `server.mjs`
   (16,798 B), `ask-bridge.mjs` (10,844 B), `stop-verdict.mjs` (5,195 B).
7. **All three are currently byte-identical across ALL THREE locations** (`~/.tower/`,
   `~/agent-core/primitives/mcps/tower/`, `~/herdr-spine/cc-hooks/`) — verified by `cmp`.
   Nothing is broken right now.
8. **The guard's exact behavior** (install.sh:220-238): if `cc-hooks/server.mjs` and
   `~/.tower/server.mjs` are identical → prints `tower server.mjs already carries
   relay_inbox (identical).` and does nothing. Else if the live sha matches neither
   canonical nor the hardcoded pre-fold base `base_sha="63ec724d"` → prints
   `WARNING: … drift; NOT overwriting.` Else → **`cp` over the live file** (with a
   `.spine-backup-$ts`).
   The live `~/.tower/server.mjs` sha256 begins `5657cf0f`, which does NOT match the
   hardcoded `63ec724d`. Today the identical-branch short-circuits, so nothing clobbers.
9. **THE RISK, stated precisely:** the moment agent-core's `server.mjs` diverges from
   `cc-hooks/server.mjs`, the next `install.sh` run either refuses with a drift warning
   or `cp`s herdr-spine's copy over the deployed path — silently reverting agent-core's
   change. If you symlink `~/.tower/server.mjs` → agent-core without reconciling this,
   that `cp` overwrites the symlink and the canonical claim breaks quietly.
10. `install.sh` is referenced by `~/herdr-spine/bin/spine-choreo`, `bin/spine-agent`,
    `bin/handlers/30-choreo`, and `~/dotfiles/dotter/install` — so it CAN be invoked
    without a human deciding to run it. Treat the clobber path as live, not theoretical.

### Constraints that must survive whatever you build
11. **Load-bearing paths that must keep working UNCHANGED for every harness:**
    - MCP registration: `bun run /Users/jrg/.tower/server.mjs` (`claude mcp list` shows
      `tower: … ✔ Connected`)
    - **15** hook registration sites in `~/.claude/settings.json` pointing at
      `/Users/jrg/.tower/hooks/*.mjs` (lines 34, 46, 56, 84, 116, 128, 158, 180, 215,
      226, 286, 313, 318, 329, 340)
    - `bun ~/.tower/cli.mjs` — documented machine-wide
    - `~/.claude/tower` is a symlink → `/Users/jrg/.tower` (double-hop must still resolve)
12. **State must not move.** `tower-ledger.mjs:22-28` anchors all state to
    `join(homedir(), '.tower')`. Code location is irrelevant to state location — this is
    what makes the split safe. Do not touch `board.jsonl`, `ledger.jsonl`,
    `odometer.jsonl`, `pheromones.jsonl`, `flight/`, `deliverables/`, `cursors/`.
13. **Import-graph constraint:** `hooks/*.mjs` (prompt-inject, session-start,
    odometer-stop, odometer, stop-guard — 5 of them) import `'../lib.mjs'`, a relative
    PARENT import, and ESM resolves symlinks to their real path before resolving
    relative specifiers. Additionally `hooks/ask-bridge.mjs:152` resolves lib via a
    RUNTIME homedir-anchored dynamic import —
    `import(pathToFileURL(join(homedir(),'.tower','lib.mjs')))` — so `~/.tower/lib.mjs`
    must remain a resolvable path no matter what mechanism you choose.

### The drift assets that already exist — EXTEND, DO NOT DUPLICATE
14. `primitives/mcps/tower/server-drift.criteria.md` (62 lines) is a criteria table
    covering: install.sh drift warnings, SHA reconciliation between `~/.tower/server.mjs`
    and `~/herdr-spine/cc-hooks/server.mjs`, backup existence, `cli.test.mjs` green, MCP
    stdio `initialize` + `tools/list` registering `relay_inbox`, `relay_inbox` behavior,
    and a `tower/server-drift` board-finding assert.
15. `server-drift.test.mjs` (257 lines) implements them; `server-drift.qa.md` (9 lines)
    is the human narrative. **Current state, measured by a worker on 2026-08-13:
    7 pass / 4 fail / 11 total.** Named failures, all PRE-EXISTING:
    (a) `cli regression … cli.test.mjs all green` — expected 0 fails, got 1
    (b) `relay_inbox render+ack in one call` — expected the seeded id, got
        "Tower inbox is clear…"
    (c) `tower/server-drift topic has finding` — expected >0 rows, got 0
    And `cli.test.mjs` itself is 25 pass / 1 fail / 26 (named: "backup all times out —
    reproduces pre-fix hang", expected kind "timeout", got "exit").
    **These are pre-existing. Do NOT fix them inside this unit and do NOT hide them.**
    Note (b) and (c) are being carried by the CORD as possible REAL defects in the ledger
    relay and board-finding planes; report anything you learn, but repairing them is W3.
16. Critically: `server-drift.criteria.md` treats `~/herdr-spine/cc-hooks/server.mjs` as
    "install.sh canonical source" (line 18). That assumption is exactly what your ruling
    may overturn — if it does, the criteria file must be updated as part of your unit.

## The CORD's standing ruling (your starting position, overturnable with evidence)

`~/agent-core/primitives/mcps/tower/` is canonical for Tower's code. Rationale:
agent-core is the machine's declared canonical store and holds all 19 files plus attic,
tests and docs; `cc-hooks/` holds only 3 files and exists incidentally from the
2026-07-28 "tower-auto fold", not as a designed home. **One source must win — three
copies of `server.mjs` with two deploy opinions is the actual defect.**

If your evidence overturns this, say so plainly and argue it; I would rather be corrected
than obeyed.

## Your tasks

### T1 — Rule the deployment mechanism, with evidence
Decide how the canonical repo becomes the thing that actually runs. Options include
symlinking deployed paths, an explicit `deploy`/`install` step with verification, or
something better. Weigh at minimum: fact 13's dual import constraints, fact 9's clobber
path, atomicity while the bus is live, and what happens on a fresh machine.
- **done when:** a written ruling exists in the canonical home naming the mechanism, the
  rejected alternatives, and the evidence for each — including an explicit answer to
  "what happens the next time `install.sh` runs".

### T2 — Reconcile the competing source
Make exactly one location canonical for `server.mjs`, `ask-bridge.mjs`,
`stop-verdict.mjs`. Editing `~/herdr-spine/install.sh` is permitted and reversible, but
it is ANOTHER PROJECT'S repo: keep the change minimal, do not break herdr-spine's own
install flow, and commit it separately from agent-core work.
- **done when:** running `bash ~/herdr-spine/install.sh` (or the narrowest safe
  invocation of `install_tower_auto`) produces output you have PASTED, showing it no
  longer competes for ownership — no drift warning and no clobber of the deployed path;
  and all three files still resolve to one source. If you cannot run install.sh safely
  against the live system, say so and prove it another way (e.g. a copy in a scratch
  `TOWER_AUTO_TOWER_DIR` — fact 5 shows that variable is honored).

### T3 — Execute the cutover, live, and PROVE it
Apply your T1 mechanism so the deployed paths serve canonical content.
- **done when ALL of these are demonstrated with PASTED output:**
  1. `bun ~/.tower/cli.mjs status` exits 0 with real data
  2. `claude mcp list` still shows `tower: … ✔ Connected`
  3. A fresh `bun run ~/.tower/server.mjs` answers an `initialize` request over stdio
  4. All 5 relative-importing hooks AND `ask-bridge.mjs`'s runtime dynamic import
     resolve — ask-bridge's homedir-anchored import must be exercised, not just
     build-resolved; that gap was explicitly left open in wave 1
  5. `ls -l ~/.claude/tower/cli.mjs` resolves through the double-hop symlink
  6. Test counts re-reported exactly, with the fact-15 pre-existing failures unchanged
     and named — a NEW failure is a stop-and-report event
  7. An edit made in the canonical home is observably live at the deployed path without
     a copy step, OR the deploy step is run and shown to propagate it. **Use a
     harmless, reverted-after edit — e.g. a comment line — never a behavioral change.**

### T4 — Make drift mechanically detectable
Extend the fact-14/15 assets so a future divergence FAILS something rather than being
noticed by a human.
- **done when:** a drift check exists that a future agent or hook can run, it detects a
  deliberately introduced divergence (demonstrate this, then revert it), it is wired to
  the existing `server-drift` assets rather than duplicating them, and
  `server-drift.criteria.md` is updated wherever fact 16's assumption no longer holds.

### T5 — The one short doc
- **done when:** a future agent reading `primitives/mcps/tower/README.md` (or a doc it
  points to) learns in under a minute: where to edit Tower, why, what happens if they
  edit the deployed path instead, and how to run the drift check. Short and blunt beats
  thorough.

## Constraints (non-negotiable)

- **The bus stays up.** A paused Arc fleet and live Arc panes are on it throughout. Do
  not stop the MCP server for other sessions. Verify live consumers after every change.
- **Additive and reversible.** Back up before mutating anything. Quarantine over delete.
  Never delete an `attic/` file. Do not rewrite state.
- **Anything genuinely destructive or irreversible → STOP and bring it to the CORD as a
  ruled proposal.** The operator has reserved those decisions. This explicitly includes
  removing files from `~/herdr-spine/cc-hooks/`.
- Branch first; your own branch, NOT `tower/w0-version-control`. Stage explicitly, never
  `git add -A` (agent-core has ~17 unrelated untracked entries). Commit format:
  `<type>(<scope>): <summary>` + PHASE/DONE/TODO/BLOCKED + Co-Authored-By.
- Workers never commit; you gate and commit.
- Workers are VISIBLE herdr panes in your own tab via
  `spine-spawn worker … --kind claude --profile coder` (resolves to sonnet). No
  harness-internal background subagents. Reap panes when their work is verified.
- Do not re-prompt an idle pane for status; collect via board findings and `.done`.

## Tower

- Board topic: **`tower/w0-canonical-source`**. Post a CLAIM before touching shared
  files, findings as you learn them, and your final report.
- Post a one-line summary to **`tower/fully-operational`** when your unit closes.
- Coordinate with `orch-w0-version-control` via the board — it owns
  `tower/w0-version-control`.
- **Keep board bodies SHORT.** A malformed long post on 2026-08-13 swallowed the
  author's next tool call into the message body (board.jsonl L6005): it was valid JSON
  but corrupt. Post long evidence as files and reference the path.
- Fleet mail only — do NOT use `send_to_user`; your CORD reads the board. nq budget 3.
- If you ever raise something operator-urgent, ring the doorbell in the same breath:
  `herdr notification show "<title>" --body "<one line>" --sound request`

## Report back with

1. Your T1 ruling: the mechanism, the rejected alternatives, and the evidence — plus the
   explicit answer to "what happens the next time `install.sh` runs".
2. Pasted output for all 7 items in T3.
3. The T4 demonstration: a deliberate divergence detected, then reverted.
4. Exact test counts, with the fact-15 pre-existing failures named and unchanged.
5. Branch name(s) and commit shas, agent-core and herdr-spine separately.
6. Anything you could NOT prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.
