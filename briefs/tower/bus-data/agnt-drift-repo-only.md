# AGNT [drift-repo-only] — classify write-path tests as REPO_ONLY

Repo `/Users/jrg/agent-core` branch `tower/board-write-path-hardening`. Do NOT use emojis.

## Pre-Verified Facts (ORCH verified 2026-08-13T15:18Z)

- Live `bun primitives/mcps/tower/drift-check.mjs` exits 1 with:
  - `FAIL write-path.test.mjs: missing at ~/.tower/write-path.test.mjs`
  - `WARN write-path.criteria.md: missing at ~/.tower/...`
  - `FAIL server.mjs vs spine` (separate — NOT this brief)
- `REPO_ONLY` set is at `primitives/mcps/tower/drift-check.mjs:104`:
  `new Set(['drift-check.mjs', 'DEPLOYMENT.md', 'README.md'])`
- Tests/criteria are repo-only by design (no symlink twin under `~/.tower/`), same class as `cli.test.mjs`... wait: cli.test.mjs currently compares and OK because a copy may exist? Live output showed `OK cli.test.mjs` — meaning a deployed twin exists OR compare passed. write-path.test.mjs is NEW and has no twin → FAIL.
- Fix: add `write-path.test.mjs` and `write-path.criteria.md` to `REPO_ONLY` (and any other new `*.criteria.md` / test-only files you prove have no deploy twin — minimum those two).
- After patch: `bun primitives/mcps/tower/drift-check.mjs` must show those two as SKIP repo-only, not FAIL/WARN-missing. Spine FAIL may remain — out of scope here.
- Edit MAIN tree absolute paths under `/Users/jrg/agent-core/` (worktree isolation may apply — prefer absolute paths for writes).

## Parallel Work Notice

- CORD bus-data landing the write-path branch; do not rewrite board. Ignore unrelated dirty files.

## Tower

- CLAIM then DONE finding on `tower/bus-data` from=`AGNT drift-repo-only`.
- Do not hand-append board JSON.

## Tasks

1. Patch REPO_ONLY in drift-check.mjs. — done when: set includes both write-path files; comment still accurate.
2. Run drift-check; record exit code + the two lines for write-path* in report. — done when: neither is FAIL; both SKIP or OK-as-repo-only.
3. Write `briefs/tower/bus-data/agnt-drift-repo-only.done` with command tails. Do not commit.

## Constraints

- Touch ONLY: `primitives/mcps/tower/drift-check.mjs`, `briefs/tower/bus-data/agnt-drift-repo-only.done`. Do not touch server.mjs or herdr-spine.

## Report back with

- diff summary, drift-check exit code, write-path* status lines
