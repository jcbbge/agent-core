# E3 — T4b: proof the check catches drift

Author: `agnt-w0-driftcheck` · 2026-08-13 UTC. Entirely sandboxed under this
session's scratchpad dir — zero writes to `~/.tower/`, zero writes to
`~/agent-core` (main checkout) or this worktree's tracked files. Chosen over
mutating a real location because every real location this check reads from
is either absolutely forbidden to write (`~/.tower/`) or owned by a sibling
lane mid-edit (`~/agent-core` main checkout).

## Fixture

```
drift-fixture/
  canonical/lib.mjs, server.mjs, README.md, hooks/{stop-verdict,ask-bridge}.mjs
  deployed/  — mirrors canonical: lib.mjs and hooks/*.mjs and README.md as
               REAL FILE copies, server.mjs as a SYMLINK into canonical
               (proves both mechanisms are read identically)
  spine/     — server.mjs, stop-verdict.mjs, ask-bridge.mjs, initially
               identical to canonical (mirrors herdr-spine/cc-hooks/)
```

Pointed at via env overrides: `TOWER_DRIFT_CANONICAL_DIR`,
`TOWER_DRIFT_DEPLOYED_DIR`, `TOWER_DRIFT_SPINE_DIR`,
`TOWER_DRIFT_ORPHAN_FILE` (set to a nonexistent path to isolate this run to
the mirror/fallback checks being demonstrated).

## Step 1 — PASS, before divergence

```
5 manifest file(s), 8 ok, 0 FAIL, 1 warn
runtime: 10.1ms
EXIT=0
```

(The one WARN is "could not read canonical git state" — the fixture dir
isn't a git repo, expected and harmless.)

## Step 2 — deliberate divergence, harmless comment, sandbox-only

```
$ printf '// drift-test-marker\n' >> drift-fixture/deployed/hooks/stop-verdict.mjs
$ diff deployed/hooks/stop-verdict.mjs.orig deployed/hooks/stop-verdict.mjs
1a2
> // drift-test-marker
```

No behavioral change (an appended comment line), and the file touched is a
throwaway copy inside the sandbox fixture — not `~/.tower/`, not
`~/agent-core`.

## Step 3 — FAIL, with a useful message

```
FAIL hooks/stop-verdict.mjs: .../drift-fixture/deployed/hooks/stop-verdict.mjs (65c62be9) != .../drift-fixture/canonical/hooks/stop-verdict.mjs (0b27b26f)
...
5 manifest file(s), 7 ok, 1 FAIL, 1 warn
runtime: 8.9ms
EXIT=1
```

Names the file (`hooks/stop-verdict.mjs`) and both disagreeing locations
with their full paths and short shas — exactly the done-when requirement
("exits non-zero on divergence with a message naming the file and the
locations that disagree").

## Step 4 — revert, and proof nothing was left behind

```
$ mv deployed/hooks/stop-verdict.mjs.orig deployed/hooks/stop-verdict.mjs
$ cmp deployed/hooks/stop-verdict.mjs canonical/hooks/stop-verdict.mjs && echo identical
identical
```

Re-run:

```
5 manifest file(s), 8 ok, 0 FAIL, 1 warn
runtime: 8.5ms
EXIT=0
```

PASS again. Revert proof for the real repo (the fixture was never part of
it, so this is the strongest possible proof — nothing to revert):

```
$ git status --porcelain
?? primitives/mcps/tower/drift-check.mjs
```

Only the new file this lane is authorized to create. No other path
touched. Fixture directory removed afterward
(`rm -rf drift-fixture` — confirmed gone).
