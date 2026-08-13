# Tower deployment — the ruling

Author: `orch-w0-canonical-source`, 2026-08-13. Status: **ruled**, with two
conditions delivered in this unit and one gap left open and named.

This document answers one question: *how does the canonical repo become the thing
that actually runs?* It records the mechanism, the alternatives rejected, the
evidence for each, and — explicitly — what happens the next time
`~/herdr-spine/install.sh` runs.

---

## The ruling

**Deployed paths in `~/.tower/` are symlinks into
`~/agent-core/primitives/mcps/tower/`. That home is canonical for Tower's code.
`~/.tower/` remains canonical for Tower's STATE.**

I did not choose this mechanism — the sibling lane (`orch-w0-version-control`)
executed the cutover while this lane was ruling on it. My job was to rule on it
with evidence, and my verdict is that **it is the right mechanism, but it was not
safe as executed.** Three conditions have to hold. Two of them this unit
delivered; the third is a live defect that the cutover itself exposed.

### Condition 1 — one deploy mechanism, not two *(delivered: herdr-spine `b42132e`)*

`install_tower_auto()` in `~/herdr-spine/install.sh` was a **second deploy
mechanism** with its own source of truth (`~/herdr-spine/cc-hooks/`) covering 3 of
Tower's 19 files. It is now reconciled: canonical-preferred, cc-hooks demoted to a
fresh-machine bootstrap fallback, and any symlinked deploy target is skipped rather
than written through.

This was not a theoretical hazard. **It had already fired.**
`~/.tower/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` is a 158-byte
canonical-pointer shim that `install_tower_auto()` overwrote on
2026-08-12T22:14:23Z, silently reverting agent-core commit `3deb7e7`'s
consolidation. Nobody noticed for a day. Full proof: `E1-install-sh-clobber-proof.md`.

### Condition 2 — drift has to fail something *(in flight: `agnt-w0-driftcheck`)*

The 2026-08-12 revert was invisible because nothing checked. A drift check wired
into the existing `server-drift.*` assets closes that. See condition 2's status in
`server-drift.criteria.md`.

### Condition 3 — code must not assume it sits next to state *(OPEN — real defect)*

**This is the cost of symlinking, and the cutover found it the hard way.**

`cli.mjs:159` writes the board via
`new URL('./board.jsonl', import.meta.url)` — resolved **relative to the code
file**, unlike every read path, which is homedir-anchored through `lib.mjs`. That
was accidentally correct only while `~/.tower/cli.mjs` sat beside
`~/.tower/board.jsonl`. Symlinking `cli.mjs` made `import.meta.url` resolve to the
realpath **inside the repo**, so `bun ~/.tower/cli.mjs post` silently appended to a
stray `board.jsonl` in the canonical home. No error, no exception.

It cost 7 real coordination rows, including this lane's hold request warning the
sibling about condition 1 — which is why that hold arrived too late to stop the
hook swap. The bug is **pre-existing and latent**; the cutover exposed it, it did
not create it. `cli.mjs` has been rolled back to a real file as containment; the
correct repair is the `BOARD` constant at `tower-ledger.mjs:24`, scoped to W3.

**The general rule this establishes:** under a symlink mechanism, any code-relative
path resolution (`import.meta.url`, `__dirname`, `./relative`) silently retargets
into the repo. Homedir-anchored resolution is the only safe form. Brief fact 13
named two import constraints; this is a **third**, and it was not in the brief.

---

## Alternatives rejected

### A. Status quo — two copies, synced by hand
**Rejected: empirically proven to fail.** This *was* the mechanism, and the
2026-08-12 revert is what it produces — a canonical claim silently undone, noticed
a day later by accident. Every argument for it is an argument that someone will
notice. Nobody did.

### B. Copy-based deploy step (`deploy.sh` from canonical → `~/.tower/`)
**Rejected, but it is the strongest alternative and the call is genuinely close.**

For it: deployed paths stay real files, so condition 3 evaporates entirely — no
code-relative resolution can retarget, and the `cli.mjs:159` class of bug stays
dormant instead of becoming live. It is also immune to `git checkout`.

Against it: it reintroduces exactly the two-copies problem that produced the
2026-08-12 revert, and moves the guarantee from *structural* to *procedural* — the
copies are identical only as long as someone runs the step. A drift check makes
that loud, but loud-after-the-fact is weaker than impossible-by-construction.

The deciding evidence is that the failure this unit exists to fix was a **silent
divergence**, and symlinks make divergence structurally impossible rather than
merely detectable. Condition 3 is a bounded, enumerable class of bug (grep for
code-relative resolution); silent divergence is unbounded.

**If condition 3 turns out to be wider than the single `cli.mjs:159` site, this
ruling should be revisited.** That is the honest trigger for overturning it.

### C. Symlink, but land on `main` first
**Not rejected — satisfied.** When this lane started, the 32 files existed only on
branch `tower/w0-version-control` while `main` had 1, so any `git checkout` in
`~/agent-core` would have killed the live bus machine-wide. The CORD advanced main
to `9ff8778` at 05:07Z (`git branch -f`, deliberately not a checkout, so the
in-flight swap worktree was undisturbed). The hazard is retired.

**Residual:** `origin/main` is still at `27615bb`. **The canonical home is unpushed
— it exists on exactly one disk.** For a mechanism whose whole premise is that the
repo is the source, that is a real gap, and it is not this unit's to close.

---

## What happens the next time `install.sh` runs

Answered concretely, because the brief asked for it explicitly.

**With `b42132e` in effect** (it is — `~/herdr-spine` is checked out on branch
`tower/w0-install-reconcile`), for each of the three contested files:

| Deployed path state | Behaviour |
|---|---|
| symlink | skipped: `… is a symlink (externally managed) — not touching.` |
| regular, identical to canonical | skipped: `… already installed (identical).` |
| regular, differs from canonical | timestamped backup, then `cp` **from canonical** |
| absent | fresh install from canonical, falling back to `cc-hooks/` if no canonical home |

Applied to the actual current state — `server.mjs` symlinked; `stop-verdict.mjs`
and `ask-bridge.mjs` real files held back at this lane's request and byte-identical
to canonical — the answer is: **nothing is written, nothing warns, and the run is a
no-op.**

Verified by extracting the real function from both the pre- and post-change
`install.sh` and running each against a sandboxed `TOWER_AUTO_TOWER_DIR`:

```
################ OLD (pre-fix) ################
Installed CC hook -> …/tower/hooks/stop-verdict.mjs
  deployed path: STILL A SYMLINK
  target content now: #!/usr/bin/env bun / // stop-verdict.mjs — …   <-- TARGET REWRITTEN

################ NEW (fixed) ################
CC hook stop-verdict.mjs is a symlink (externally managed) — not touching.
  deployed path: STILL A SYMLINK
  target content now: TARGET-X-original-canonical-body                <-- UNCHANGED
```

Note what the old branch actually did: the symlink **survived** and its *target* was
replaced. The failure mode was never "the symlink gets clobbered" — it was "a
git-tracked file is silently rewritten in place, and `git status` in an unrelated
repo is where you'd find out."

**One behaviour change, flagged rather than buried:** the hardcoded
`base_sha="63ec724d"` refuse-branch is gone. A drifted **non-symlink** deployed
file is now overwritten from canonical instead of refused. That is correct deploy
semantics once canonical is genuinely the source, but it is a real change and the
CORD may want it restored.

**Unproven:** `b42132e` is on a branch, not merged to herdr-spine `main`. A
consumer that checks out `main` gets the old, clobbering function. Merging is the
CORD's call. And no real `spine-choreo` / `spine-agent` / `dotter install`
invocation was exercised end to end — only the extracted function.

---

## Fresh machine

`~/.tower/` does not exist; nothing is symlinked. `install_tower_auto()` takes the
fresh branch and installs from the canonical home if `~/agent-core` is present,
falling back to `cc-hooks/` if it is not — so a machine with only herdr-spine still
bootstraps. State files are created on first use by the homedir-anchored paths in
`tower-ledger.mjs:22-28`.

The symlinks themselves are **not** yet recreated by any automated step. Today the
cutover was performed once, by hand, by an agent. **There is no `deploy` verb that
would reproduce it on a second machine** — that is the largest remaining gap in this
mechanism and it is named here rather than left implied.
