# E1 — install.sh has ALREADY clobbered the canonical-pointer mechanism

Author: `orch-w0-canonical-source` · verified 2026-08-13 UTC, live system.
Status: **evidence, not theory.** Every line below is a command run this session.

## The finding in one line

The exact mechanism W0 is about to install — a deployed path in `~/.tower/hooks/`
pointing at agent-core — **already existed, and `install.sh` overwrote it on
2026-08-12T22:14:23Z.** The proof is the backup install.sh left behind.

## The artifact

```
$ ls -la /Users/jrg/.tower/hooks/*.spine-backup-*
-rw-r--r--@ 1 jrg staff 158 Aug 12 17:14 stop-verdict.mjs.spine-backup-20260812T221423Z

$ cat /Users/jrg/.tower/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z
#!/usr/bin/env bun
// Shim: canonical body at ~/agent-core/primitives/hooks/stop-verdict.mjs
import '/Users/jrg/agent-core/primitives/hooks/stop-verdict.mjs'
```

That 158-byte file is a **canonical-pointer shim**. install.sh backed it up and
replaced it with `cc-hooks/stop-verdict.mjs` (5,195 B):

```
$ shasum -a 256 stop-verdict.mjs.spine-backup-20260812T221423Z stop-verdict.mjs
7f1e8d20…  stop-verdict.mjs.spine-backup-20260812T221423Z   (the shim, 158 B)
68dfa062…  stop-verdict.mjs                                 (cc-hooks copy, 5195 B)
```

The shim's target is real and git-tracked:

```
$ ls -la /Users/jrg/agent-core/primitives/hooks/stop-verdict.mjs
-rw-r--r--@ 1 jrg staff 3551 Aug 11 14:35 …/primitives/hooks/stop-verdict.mjs
$ git log --oneline -2 -- primitives/hooks/stop-verdict.mjs
3deb7e7 chore(agent-core): wave2 ORCH-A one-source consolidation
```

So a prior wave ("ORCH-A one-source consolidation") already made this file
canonical in agent-core. install.sh silently reverted it ~1 day later. Nobody
noticed until now.

## Why this generalises to the W0 swap

`install_tower_auto()` step 3 (install.sh:248-257) deploys the hooks with
**no sha drift guard at all** — unlike step 2 (server.mjs), which has one:

```bash
if [[ -f "$hooks_dir/$h" ]] && cmp -s "$SCRIPT_DIR/cc-hooks/$h" "$hooks_dir/$h"; then
  echo "CC hook $h already installed (identical)."
else
  [[ -f "$hooks_dir/$h" ]] && cp "$hooks_dir/$h" "$hooks_dir/$h.spine-backup-$ts"
  cp "$SCRIPT_DIR/cc-hooks/$h" "$hooks_dir/$h"      # <-- unconditional
fi
```

Content-identical → skip. Anything else → **unconditional overwrite.** There is
no sha comparison, no refuse branch, no operator prompt.

### The part that is worse than losing a symlink

`cp src dst` where `dst` is a **symlink follows it and writes through to the
target.** After the W0 swap, `~/.tower/hooks/stop-verdict.mjs` is a symlink into
the git-tracked canonical home. The next divergent `install.sh` run therefore does
not merely replace the symlink — it **silently rewrites
`~/agent-core/primitives/mcps/tower/hooks/stop-verdict.mjs` inside the git
working tree**, presenting as an unexplained dirty file in agent-core.

Same for `ask-bridge.mjs`. Both are in the W0 swap's 19-path partition.

## Correction to the CORD's fact 9 (server.mjs specifically)

Fact 9 says the guard "either refuses with a drift warning **or** `cp`s
herdr-spine's copy over the deployed path". For `server.mjs` the **refuse branch
is the live one**, and the clobber branch is currently unreachable:

```bash
local prod="$tower_dir/server.mjs" base_sha="63ec724d"
if cmp -s cc-hooks/server.mjs "$prod"; then  … identical, do nothing …
else
  prod_sha="$(shasum -a 256 "$prod" | cut -c1-8)"
  if [[ "$prod_sha" != "$base_sha" ]]; then  … WARNING; NOT overwriting …
  else  … backup + cp …
  fi
fi
```

The clobber requires `prod_sha == 63ec724d`. Live is `5657cf0f`, so on divergence
server.mjs gets a **warning, not a clobber**. That is the good news.

The bad news is that this guard protects **only `server.mjs`**. The two hooks —
`stop-verdict.mjs`, `ask-bridge.mjs` — have no guard, and the 2026-08-12 artifact
above proves their clobber path is live and has already fired once.

## Four competing sources for `stop-verdict.mjs`, not two

| # | Path | Size | Status |
|---|---|---|---|
| 1 | `~/.tower/hooks/stop-verdict.mjs` | 5195 | deployed, live |
| 2 | `~/herdr-spine/cc-hooks/stop-verdict.mjs` | 5195 | install.sh source |
| 3 | `~/agent-core/primitives/mcps/tower/hooks/stop-verdict.mjs` | 5195 | W0 wave-1 copy |
| 4 | `~/agent-core/primitives/hooks/stop-verdict.mjs` | 3551 | **orphaned** prior canonical (`3deb7e7`), different content, still tracked |

Source 4 is stale and still in the repo. Any future agent following commit
`3deb7e7`'s convention will edit a file that has been dead since 2026-08-12.
`ask-bridge.mjs` has no counterpart at `primitives/hooks/` — so the prior
consolidation was partial as well as reverted.

## Bearing on T2

Reconciliation cannot be "agent-core wins" by assertion. install.sh must stop
competing — the deploy step for these three files has to either be removed from
`install_tower_auto()` or be made to read from the canonical home. Until then any
symlink W0 installs is live only until the next `spine-choreo` / `spine-agent` /
`dotter install` run.
