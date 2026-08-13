# E3 — drift-check.mjs design (T4a)

Author: `agnt-w0-driftcheck` · 2026-08-13 UTC. File:
`primitives/mcps/tower/drift-check.mjs` (worktree `w0-driftcheck`, branch
`spine/w0-driftcheck`).

## Shape chosen, and why

**Standalone script, not folded into `server-drift.test.mjs`.** The brief
left this open ("whether that means the check is a module … or a
standalone script … is your call"). Standalone won because:

- `server-drift.test.mjs` is an *oracle* test file — authored from
  plan/brief only, explicitly never touched by implementation knowledge
  (its own header says so). Wiring a new implementation-side check into it
  would blur that boundary for future test-makers reading the file.
- The check needs to run outside `bun:test` (as a hook, per the brief's
  "fast enough to be a hook" requirement) with zero test-framework
  overhead. `bun run drift-check.mjs` starts and exits in ~10-25ms; adding
  `bun:test`'s harness would multiply that for no benefit.
- Wiring happens at the doc/criteria layer instead: `server-drift.criteria.md`
  now has a "Drift check (T4)" section listing its assertions side-by-side
  with the oracle test's, and `README.md`'s new T5 section points at it.
  That satisfies "wire into the existing assets" without merging two files
  that serve different audiences (oracle-test-writer vs. anyone running a
  pre-commit/session-start hook).

## Manifest: discovered, not hand-maintained

The check does not hardcode "19 files" or "16 others" — it walks
`~/agent-core/primitives/mcps/tower/` at runtime, excluding only `attic/`
(backup storage, never deployed), `board.jsonl`/`ledger.jsonl` (live state
that happens to sit in the canonical dir from the initial copy), and
dotfiles. Whatever canonical contains on the day this runs is exactly what
gets checked — a new hook added to the canonical set is covered
automatically, with no second place to remember to update.

Live run against the real system found **20 files** in the current
manifest (confirmed by both direct execution and cross-checked against
`agnt-w0-swap`'s board report of "lib.mjs/cli.mjs/server.mjs/4 docs/10
hooks" + `cli.test.mjs` + `server-drift.test.mjs` = 20, matching exactly).

## The three contested files, and the other 16 (now: 17)

`server.mjs`, `hooks/stop-verdict.mjs`, `hooks/ask-bridge.mjs` are the only
files a *second* deploy mechanism (`install.sh`'s `cc-hooks/` fallback)
still competes over — see E1. These three are checked THREE ways:
deployed vs. canonical, AND deployed vs. canonical vs.
`~/herdr-spine/cc-hooks/<basename>`. Every other canonical file (17 of the
20, after README.md's gap below) is checked two ways only: deployed vs.
canonical. There is no third source claiming ownership of those, so a
third check would be noise.

## FAIL vs. WARN — a deliberate severity split, not an oversight

`.mjs` files: **FAIL** on divergence or either side missing. These are
load-bearing — a hook or the server is actually executed from the deployed
path, so silent drift there is exactly the E1 failure mode.

`.md` files: **WARN** only. Nothing at runtime opens a deployed `.md`
file — a stale or missing deployed doc can't break anything. This
classification is what let the check find a **real, previously unknown
gap**: `README.md` is fully absent from `~/.tower/` (`ENOENT`, not just
stale) — the wave-1 swap moved "4 docs" (confirmed: COMMS-ARCH.md,
RESPONSIBLE-PARTY-AND-NQ.md, server-drift.criteria.md, server-drift.qa.md
are all present at `~/.tower/`) but README.md, a 5th doc authored
separately by `agnt-w0-readme` shortly before the swap, was never
included. Reported as a WARN, not fixed — fixing it means writing into
`~/.tower/`, forbidden to this lane; it's the sibling `orch-w0-version-control`
lane's file to symlink if it decides README.md should deploy at all (see
open question in the final report).

## The orphan (fact 5)

`~/agent-core/primitives/hooks/stop-verdict.mjs` — the pre-existing,
3,551-byte, `3deb7e7`-tracked file from a reverted consolidation — is
checked against canonical `hooks/stop-verdict.mjs` and reported as a WARN
regardless of outcome (informational either way: "byte-identical, still
dead weight" or "diverges, still dead weight"). Nothing imports it, so it
can never be live drift; it can only be a maintenance trap for a future
agent who follows `3deb7e7`'s convention and edits a corpse. Deleting it is
explicitly not this lane's call (git-tracked file deletion is reserved).

## Bonus check: canonical push state (fact 8)

Free to add, in scope by extension of "why is this a drift risk": reads
`git rev-parse HEAD` and `git rev-parse @{u}` in the canonical dir — both
local-ref-only, no network round-trip — and WARNs if HEAD is ahead of its
upstream. On the real system right now this prints "no upstream
configured" (main has no tracking branch set in this environment), so it's
inert but present.

## Explicitly out of scope

- **Does not attempt to fix `server-drift.test.mjs`'s known regressions**
  (facts 3b/3c/3d). That file is outside this lane's file partition
  (`README.md`, `server-drift.criteria.md`, `drift-check.mjs` only, per
  brief). See the final report for the resulting conflict with an earlier
  CORD board note that assigned fact-3d's repair to "whoever owns T4".
- **Does not modify `install.sh`** — that's `agnt-w0-install-reconcile`'s
  partition (see E2), even though this check's design assumes and
  documents the post-E2 install.sh behavior.
- **Does not touch `~/.tower/` in any way**, per the absolute prohibition —
  confirmed by code review of `drift-check.mjs`: every path read is via
  `readFileSync`/`existsSync`/`readdirSync`, no `write*` call anywhere in
  the file, and the T4b proof exercises this against a sandbox fixture
  specifically so nothing in the real deployed tree is ever touched.
