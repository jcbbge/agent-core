# Test criteria — tower-server-drift / reconcile ~/.tower/server.mjs

Authored by test-maker from plan only (brief TASK section + install.sh contract +
TOWER-AUTO-CC CC4). Each assert maps to an acceptance criterion.

## Drift resolution (done-when #1)

| Assert name | Criterion |
|-------------|-----------|
| `install.sh emits no drift warning` | **RETIRED** — do not run `~/herdr-spine/install.sh`; use `bun primitives/mcps/tower/drift-check.mjs` instead |
| `install.sh reports relay_inbox reconciled` | Output contains `tower server.mjs already carries relay_inbox (identical).` OR a fresh install success line |

## SHA reconciliation (mission #3)

**Superseded 2026-08-13 (T4c, agnt-w0-driftcheck):** the two rows below
originally treated `~/herdr-spine/cc-hooks/server.mjs` as *the* canonical
source for `~/.tower/server.mjs`. That is no longer true. Tower's code now
lives git-tracked at `~/agent-core/primitives/mcps/tower/` (canonical),
`~/.tower/` mirrors it (deployed — real files or symlinks), and
`install_tower_auto()` in `~/herdr-spine/install.sh` was rewritten
(agnt-w0-install-reconcile, same date) to prefer the agent-core canonical
dir and treat `cc-hooks/` as a fresh-machine bootstrap fallback only —
install.sh now also refuses to write through a symlinked deployed path
("externally managed — not touching") instead of `cp`-clobbering it, which
is the exact failure E1 proved had already happened once. Rows kept for
history; do not re-enable them as written.

| Assert name | Criterion | Status |
|-------------|-----------|--------|
| ~~`live server.mjs byte-identical to canonical`~~ | ~~`cmp -s` between `~/.tower/server.mjs` and `~/herdr-spine/cc-hooks/server.mjs`~~ | **WRONG canonical.** Replaced by drift-check.mjs, which compares `~/.tower/server.mjs` against `~/agent-core/primitives/mcps/tower/server.mjs` (canonical) and *separately* against `~/herdr-spine/cc-hooks/server.mjs` (fallback only) — see below. |
| ~~`canonical server.mjs present for install.sh parity`~~ | ~~`~/herdr-spine/cc-hooks/server.mjs` exists (install.sh canonical source)~~ | **WRONG label.** `cc-hooks/server.mjs` is install.sh's fresh-machine bootstrap fallback, not the canonical source. The canonical source is `~/agent-core/primitives/mcps/tower/server.mjs`. |

## Drift check (T4 — agnt-w0-driftcheck, 2026-08-13)

`drift-check.mjs`, wired into this same directory alongside
`server-drift.test.mjs` (invoked standalone; see its header for why it
isn't folded into the `bun:test` file). No args, no network, no writes.

| Assert name | Criterion |
|-------------|-----------|
| `manifest discovery` | Every non-excluded file under the canonical dir (i.e. all of it except `attic/`, `.gitignore`, `board.jsonl`, `ledger.jsonl`) is checked — the manifest is discovered by walking canonical, not hand-maintained, so a new file added to the canonical set is covered automatically |
| `deployed mirrors canonical (.mjs)` | Every `.mjs` file's deployed bytes (symlink-resolved) equal canonical bytes — **FAIL** on divergence or either side missing, since these are load-bearing at runtime |
| `deployed mirrors canonical (.md)` | Same comparison for docs — **WARN** only, since nothing at runtime reads a deployed `.md` file (this is how the check found `README.md` never got deployed at all — a real gap, reported, not fixed here) |
| `contested files vs spine fallback` | `server.mjs`, `hooks/stop-verdict.mjs`, `hooks/ask-bridge.mjs` are optionally compared against `TOWER_DRIFT_SPINE_DIR` (sandbox fixture only; herdr-spine retired) — **SKIP** when fixture absent, **FAIL** on divergence when present |
| `orphan detection` | `~/agent-core/primitives/hooks/stop-verdict.mjs` (dead file from the reverted `3deb7e7` consolidation) is compared to canonical `hooks/stop-verdict.mjs` — **WARN** only, informational; nothing imports it |
| `canonical push state` | Local `HEAD` vs `@{u}` in the canonical dir, read-only, no fetch — **WARN** if ahead, since an unpushed canonical home is a hazard if the working tree ever moves (see `E1-install-sh-clobber-proof.md`) |

Run: `bun primitives/mcps/tower/drift-check.mjs` (env vars
`TOWER_DRIFT_CANONICAL_DIR` / `TOWER_DRIFT_DEPLOYED_DIR` /
`TOWER_DRIFT_SPINE_DIR` / `TOWER_DRIFT_ORPHAN_FILE` override the roots, for
pointing it at a sandbox fixture instead of the real machine).

## Backup (mission #4)

| Assert name | Criterion |
|-------------|-----------|
| `pre-edit backup exists on disk` | `~/.tower/server.mjs.bak-20260812` is a regular file |

## Regression suite (mission verify + done-when #2)

| Assert name | Criterion |
|-------------|-----------|
| `cli.test.mjs all green` | `bun ~/.tower/cli.test.mjs` exits 0 (26 tests per brief) |

## MCP stdio smoke (mission verify)

| Assert name | Criterion |
|-------------|-----------|
| `MCP initialize succeeds` | Spawn `bun ~/.tower/server.mjs` stdio; `initialize` returns JSON-RPC result |
| `tools/list registers relay_inbox` | `tools/list` tool names include `relay_inbox` |

## relay_inbox behavior (TOWER-AUTO-CC CC4 — behavioral fixes preserved)

| Assert name | Criterion |
|-------------|-----------|
| `relay_inbox empty inbox message` | `tools/call relay_inbox` on scratch cwd with no traffic returns the clear-inbox string from spec |
| `relay_inbox render+ack in one call` | Seed one operator deliverable in scratch scope; single `relay_inbox` call renders it verbatim and appends exactly one ack row for that id |

## Board findings (done-when #2)

| Assert name | Criterion |
|-------------|-----------|
| `tower/server-drift board topic has finding` | `board.jsonl` contains at least one row with `topic: tower/server-drift` and non-empty body |

## Human-only (done-when #3)

| Item | Criterion |
|------|-----------|
| `report-back drift narrative` | Implementer documents what drift was, who added what, when — see `server-drift.qa.md` |

## Run command (tester, not test-maker)

```bash
bun ~/.tower/server-drift.test.mjs
```
