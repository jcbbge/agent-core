# E2 — install.sh reconciled: cc-hooks/ demoted to fresh-machine bootstrap

Author: `agnt-w0-install-reconcile` · 2026-08-13 UTC, sandboxed work only.
Partition touched: `install.sh` (`install_tower_auto()` only), new
`cc-hooks/README.md`. Nothing under `~/.tower/` was written by this agent.

## T2a — cp-through-symlink verdict: the SERIOUS failure mode is real

```
$ ln -s target/file.txt link.txt   # link.txt -> target/file.txt, both hold "ORIGINAL TARGET CONTENT"
$ cp src.txt link.txt              # src.txt holds "NEW SOURCE CONTENT"
$ ls -la link.txt                  # still a symlink afterward
lrwxr-xr-x  link.txt -> target/file.txt
$ cat link.txt                     # NEW SOURCE CONTENT
$ cat target/file.txt              # NEW SOURCE CONTENT  <-- the actual file was rewritten
```

Confirmed: BSD `cp` (macOS) follows the symlink and writes through to its
target; the symlink itself is left in place, unchanged, still pointing at
the (now-modified) target. This is the ORCH's asserted failure mode, and it
is the worse of the two: post-W0-swap, `cp`-ing over `~/.tower/hooks/*.mjs`
does not replace a symlink — it rewrites the file inside the git-tracked
`~/agent-core` working tree.

## T2b — reproduction against a symlinked hook, unmodified install_tower_auto()

Method: extracted `install_tower_auto()` verbatim (`sed -n '196,297p'
install.sh` — the ORIGINAL line range, before any edit) into its own file
and `source`d that in a fresh `bash -euo pipefail` subshell, then called the
function with `TOWER_AUTO_TOWER_DIR` / `TOWER_AUTO_PI_EXT_DIR` /
`TOWER_AUTO_CLAUDE_SETTINGS` pointed at throwaway sandbox paths. Chosen over
`source install.sh` directly because the real script is NOT written to be
sourced safely — it runs unconditionally to `exit 0` at the bottom
(`link_plugin; install_choreo_config; install_synthetic_agents;
install_tower_auto; exit 0`), so sourcing the whole file would execute the
entire installer against the real system. Extracting only the function body
is faithful: it is the exact bytes of the real function, just isolated from
the unconditional tail calls, with `SCRIPT_DIR` set to the real
`~/herdr-spine` so `cc-hooks/` is read (never written) from the genuine
source.

Setup: `sandbox/tower/hooks/stop-verdict.mjs` is a symlink into
`sandbox/scratch-canonical/hooks/stop-verdict.mjs`, whose content
deliberately differs from `cc-hooks/stop-verdict.mjs`.

```
=== BEFORE ===
lrwxr-xr-x stop-verdict.mjs -> .../scratch-canonical/hooks/stop-verdict.mjs
$ cat stop-verdict.mjs
#!/usr/bin/env bun
// CANONICAL scratch copy — deliberately different from cc-hooks/stop-verdict.mjs
console.log("canonical scratch stop-verdict marker");

$ install_tower_auto
Installed CC hook -> .../tower/hooks/stop-verdict.mjs

=== AFTER ===
lrwxr-xr-x stop-verdict.mjs -> .../scratch-canonical/hooks/stop-verdict.mjs   # symlink SURVIVED
-rw-r--r-- stop-verdict.mjs.spine-backup-20260813T051458Z   (157 B — the OLD scratch-canonical content, backed up from the DEPLOY side)

$ cat stop-verdict.mjs                              # now the real cc-hooks content (5195B worth), via the link
$ cat scratch-canonical/hooks/stop-verdict.mjs      # SAME — the canonical file itself was overwritten in place
```

**What was destroyed: the TARGET, not the link.** The symlink is intact and
still points at the canonical path; the canonical file's *content* was
silently replaced with `cc-hooks/stop-verdict.mjs`. The only backup that was
written landed in the deploy directory (`~/.tower/hooks/` in the real
topology), not next to the canonical file — so in the real system, the
canonical git working tree would show an unexplained dirty file with no
trace of a backup at its own location.

## T2c — the fix

Changed `install_tower_auto()` steps 2 (`server.mjs`) and 3 (the two hooks)
only. Steps 1 (pi extension) and 4 (settings.json registration) are
untouched — full diff in the report to ORCH. Shape chosen:

1. **New source-of-truth preference, per file:** the agent-core canonical
   home (`$HOME/agent-core/primitives/mcps/tower[/hooks]`, overridable via a
   new `TOWER_AUTO_CANONICAL_DIR` — same override convention as the other
   three path vars) is preferred when present; `cc-hooks/` is used ONLY as a
   fresh-machine bootstrap fallback when the canonical home does not exist.
2. **Symlink-safe write:** before any `cmp`/backup/`cp`, the deploy target is
   checked with `[[ -L "$dest" ]]`. If it is a symlink, install.sh prints a
   message and does not touch it at all — no `cmp`, no backup, no `cp`. This
   is the actual fix for the T2a/T2b failure mode: it holds regardless of
   content drift, forever, not just for one hardcoded sha.
3. Removed the old `base_sha="63ec724d"`-guard on `server.mjs`. That guard
   only ever protected `server.mjs` (never the hooks — see E1), and it is
   now permanently unreachable anyway: live sha is `5657cf0f`, guard expects
   `63ec724d`. Symlink-detection + canonical-preference supersede its intent
   more generally and cover all three files uniformly.
4. Did not delete anything from `cc-hooks/` (prohibited). Added
   `cc-hooks/README.md` documenting the demotion and pointing at the
   canonical home.

Rejected: removing steps 2-3 outright. A machine with no `~/agent-core`
checkout at all must still get a working `~/.tower/` (T2d requirement) —
`cc-hooks/` is the only source that can guarantee that, so it has to stay as
a fallback, just no longer the default.

### Re-run of T2b against the MODIFIED function — same sandbox shape

```
=== BEFORE ===
lrwxr-xr-x stop-verdict.mjs -> .../scratch-canonical/hooks/stop-verdict.mjs

$ install_tower_auto   (TOWER_AUTO_CANONICAL_DIR pointed at a nonexistent dir,
                         forcing the cc-hooks bootstrap path to even be considered)
CC hook stop-verdict.mjs is a symlink (externally managed) — not touching.

=== AFTER ===
lrwxr-xr-x stop-verdict.mjs -> .../scratch-canonical/hooks/stop-verdict.mjs   # unchanged
$ cat scratch-canonical/hooks/stop-verdict.mjs
#!/usr/bin/env bun
// CANONICAL scratch copy — deliberately different from cc-hooks/stop-verdict.mjs
console.log("canonical scratch stop-verdict marker");            # UNCHANGED
$ ls tower/hooks/ | grep backup
(none — nothing was written, so no backup was needed)
```

Clobber no longer occurs. Confirmed separately (not required by T2b but
worth recording): when the canonical home IS present and the deploy target
is a plain (non-symlink) drifted file, the fix correctly prefers canonical
content over `cc-hooks/`, and still backs up the old file before writing —
existing backup-before-write behaviour preserved.

## T2d — fresh-machine path, both sub-cases

**Case 1 — `$tower_dir` absent AND no canonical home** (true fresh machine,
nothing from agent-core): bootstrap from `cc-hooks/` succeeds, sha-verified
identical to `cc-hooks/{server.mjs,stop-verdict.mjs,ask-bridge.mjs}`. Result:
a correct, working fresh `~/.tower/` — not a failure path, by design, since
`cc-hooks/` ships inside `herdr-spine` itself and is always present.

**Case 2 — `$tower_dir` absent, canonical home present** (the realistic
post-W0 fresh-install case): all three files installed from the canonical
paths, verified by content (`CANONICAL server content` /
`CANONICAL stop-verdict content` / `CANONICAL ask-bridge content` markers),
not from `cc-hooks/`.

No loud-failure path was needed or exercised: `cc-hooks/` guarantees a
source exists in every case this repo can present, so the "fail loudly"
branch of T2d's either/or is moot for this seam. Stated as a gap below.

## T2e — cleanliness

```
$ git -C ~/herdr-spine status --porcelain
 M install.sh
?? cc-hooks/README.md
?? .future/                          (pre-existing untracked, not mine)
?? bin/spine-wave                    (pre-existing untracked, not mine)
?? briefs/cabinet/                   (pre-existing untracked, not mine)
?? research/*                        (pre-existing untracked, not mine)
```

Only `install.sh` (modified) and `cc-hooks/README.md` (created) are mine;
everything else untracked was already there before this session touched
anything (visible in the shell's initial `git status` at session start).

Live `~/.tower/` files — sha unchanged from session-start values in all
three cases:

| file | sha256 (8) | type at session start (00:06Z) | type at T2e check (05:16Z) |
|---|---|---|---|
| `server.mjs` | `5657cf0f` (unchanged) | symlink -> agent-core canonical | symlink -> agent-core canonical (unchanged) |
| `hooks/stop-verdict.mjs` | `68dfa062` (unchanged) | symlink -> agent-core canonical | **regular file** (Aug 12 17:14 mtime) |
| `hooks/ask-bridge.mjs` | `bcbd83d0` (unchanged) | symlink -> agent-core canonical | **regular file** (Jul 30 16:16 mtime) |

**Observation, not a bug of mine:** the two hooks flipped from symlink back
to regular file sometime between my session-start read and my T2e check,
with content unchanged (sha identical throughout). This is `AGNT w0-swap`
mutating `~/.tower/*` live, exactly as the shared-lane brief warned it
might. Per the brief's prohibitions this is not mine to repair or revert —
recorded here only as evidence that the type-under-you churn is real and
was observed, not assumed.

## Gaps — stated plainly

- **Did not exercise a real `spine-choreo` / `spine-agent` / `dotter
  install` invocation path.** All verification ran the extracted function
  body directly, per the brief's own suggested method. I did not drive
  `install_tower_auto()` through the actual `bin/spine-choreo` /
  `bin/spine-agent` / `~/dotfiles/dotter/install` call sites named in fact 9
  — doing so would require running those entrypoints against a real or
  simulated environment, which risks the live-system prohibition. The
  extracted-function method is faithful to the function's own logic but
  does not prove those call sites invoke it with the arguments/environment
  I assumed.
- T2d's "or must fail loudly" branch was never exercised because no
  input combination in this repo can make `server_src`/`hook_src` end up
  empty — `cc-hooks/` always ships with `herdr-spine`. Recorded as a
  design consequence, not verified as a failure path.
