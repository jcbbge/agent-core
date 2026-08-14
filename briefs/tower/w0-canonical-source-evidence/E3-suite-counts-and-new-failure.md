# E3 — exact suite counts vs. fact 3, and a NEW failure (stop-and-report)

Author: `agnt-w0-driftcheck` · 2026-08-13 UTC. Both suites run from a fresh
`mktemp -d` scratch cwd, never from `~/.tower` or this worktree's
`primitives/mcps/tower/` (per fact 4), stray `ledger.jsonl`/`board.jsonl`
removed after each run.

## cli.test.mjs — UNCHANGED from fact 3

**25 pass / 1 fail / 26 total.** Same named failure: `all/projects
red-on-old (backup cli) > backup all times out — reproduces pre-fix hang`
(expected kind `timeout`, got `exit`). No action taken — pre-existing,
outside this lane, confirmed identical to fact 3 and to `agnt-w0-swap`'s
independent measurement.

## server-drift.test.mjs — 6 pass / 5 fail / 11 total — ONE NEW FAILURE

Fact 3 baseline: 7 pass / 4 fail. Measured now: **6 pass / 5 fail.** The 4
fact-3 failures are all still present, unchanged:

- (a) `cli regression … cli.test.mjs all green` — still fails (the same
  cli.test.mjs 1-fail propagates through this wrapper assertion).
- (b) `relay_inbox render+ack in one call` — still fails, same message
  (`"Tower inbox is clear…"` instead of the seeded id) — carried by CORD,
  scoped to W3, not this lane's to fix.
- (c) `tower/server-drift topic has finding` — still fails, same message
  (0 rows) — carried by CORD, scoped to W3, not this lane's to fix.
- (d) `server.mjs.bak-20260812 exists` — still fails, same cause (the
  wave-1 move: the backup now lives in `attic/`, not adjacent to the test
  file). See "Partition conflict" below — this one has a documented owner
  dispute.

**The 5th, NEW failure: `install.sh reports relay_inbox reconciled`.**

```
(fail) install.sh drift guard (AC: drift resolved) > install.sh reports relay_inbox reconciled
```

Root cause, verified by reading (not guessing): this test spawns the REAL
`bash ~/herdr-spine/install.sh` against the REAL live system (that's the
test's own pre-existing design — `Bun.spawn(['bash', INSTALL_SH], …)` with
no sandboxing, present in the file before this session touched anything)
and asserts stdout/stderr contains one of two strings:

```js
combined.includes('tower server.mjs already carries relay_inbox (identical).') ||
combined.includes('Installed tower server.mjs with relay_inbox')
```

`~/.tower/server.mjs` is currently a symlink into the agent-core canonical
home. `agnt-w0-install-reconcile`'s fix (E2, landed same session, same
date) added a symlink-safety branch to `install_tower_auto()` that prints a
**third** message for exactly this case:

```
tower server.mjs is a symlink (externally managed, e.g. the agent-core canonical-source swap) — not touching.
```

That string matches neither of the two the oracle test accepts, so the
assertion fails. This is not a bug in E2's fix — the fix is *correct*
(refusing to `cp` through a symlink is the whole point, see E1) — it's a
test written before that fix existed, encoding a two-way outcome
(identical / freshly-installed) that a third, now-live outcome
(symlink-skip) doesn't fit. **This is a genuinely new failure, introduced
between fact 3's measurement and now, by a concurrent sibling's landed
change — reported per the brief's "A NEW failure is a stop-and-report
event," not fixed.** `server-drift.test.mjs` is outside this lane's file
partition regardless.

Advisory only, not applied: the two-string accept-list in that assertion
would need a third branch,
e.g. `|| combined.includes('is a symlink (externally managed')`, to reflect
the new correct behavior. Whoever owns `server-drift.test.mjs` next should
decide whether the symlink-skip case counts as "reconciled" (arguably yes —
nothing needs reconciling once it's a symlink into canonical) before
changing that assertion.

## Partition conflict, stated plainly

A CORD board message (`tower/w0-canonical-source`, 2026-08-13T05:07:56Z)
assigned failure (d)'s repair ("since your lane owns server-drift.*, this
repair belongs to you as part of T4") to whoever holds T4. This AGNT's
brief, however, lists exactly three editable files —
`drift-check.mjs`, `server-drift.criteria.md`, `README.md`'s T5 section —
and does not include `server-drift.test.mjs`. Rather than exceed the
stated file partition unilaterally, this lane left (d) unfixed and is
flagging the conflict for `orch-w0-canonical-source` to resolve: either
amend this AGNT's partition to include the one-line fix
(`BACKUP_PATH = join(import.meta.dir, '..', 'attic', 'server.mjs.bak-20260812')`
in `server-drift.test.mjs`), or route it elsewhere. Not applied without
that call.
