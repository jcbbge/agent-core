# HANDOFF — ORCH [w0-canonical-source]

Written 2026-08-13 ~05:40Z under a harness-exhaustion notice, for a successor on a
**different harness with none of my context**. Everything here is on disk or the
board. Nothing depends on my memory.

---

## Identity and location

| | |
|---|---|
| Brief | `~/agent-core/briefs/tower/orch-w0-canonical-source.md` |
| Board topic | `tower/w0-canonical-source` |
| My pane | `w2W:p8` (tab `w2W:t5`) |
| My CORD | `CORD [Tower]`, pane `w2W:p1`, topic `tower/fully-operational` |
| agent-core branch | `tower/w0-canonical-source` @ **`1722f56`** |
| agent-core worktree | `/Users/jrg/.spine/worktrees/agent-core/w0-canonical-source` |
| herdr-spine branch | `tower/w0-install-reconcile` @ **`b42132e`** |
| herdr-spine worktree | none — committed in the **main checkout** `/Users/jrg/herdr-spine` |

Both branches are **committed and unpushed**. CORD lands them; I do not.
**Do not push to any remote** — the unpushed-origin question is with the operator.

---

## DONE and verified (evidence, not claims)

1. **T1 ruling** — `primitives/mcps/tower/DEPLOYMENT.md` (commit `0dbcc63`).
   Symlink mechanism accepted, three conditions, rejected alternatives with
   evidence, explicit answer to "what happens next time install.sh runs".
   CORD accepted it and independently tested its stated overturn trigger
   (audited the canonical set for code-relative resolution; only test files
   self-reference; condition 3 confirmed **bounded**, so the ruling stands).
2. **T2 install.sh reconciled** — herdr-spine `b42132e`. `install_tower_auto()`
   prefers the agent-core canonical home, demotes `cc-hooks/` to fresh-machine
   bootstrap, and **skips any symlinked deploy target** instead of writing
   through it. I verified this myself, independently of the worker, by
   extracting the real function from pre- and post-change `install.sh` and
   running both against a sandboxed `TOWER_AUTO_TOWER_DIR`. Old: prints
   `Installed CC hook ->`, symlink survives, **target rewritten**. New:
   `is a symlink (externally managed) — not touching`, target byte-unchanged.
3. **T4 drift check** — `primitives/mcps/tower/drift-check.mjs`. CORD ran it and
   accepted it. Latest run: **22 manifest files, 22 ok, 3 repo-only, 0 FAIL,
   2 warn, 17.4ms, exit 0.**
4. **T5 doc** — README section (where to edit / why / consequence / how to run).
5. **Cutover COMPLETE.** All deployed Tower code paths under `~/.tower/` are now
   symlinks into `~/agent-core/primitives/mcps/tower/`. The final three were
   mine (CORD gate item 1), done with atomic `ln -s` + `mv -f`, never
   `rm`-then-`ln`:
   - `cli.mjs` — acid-tested: a real board post moved `~/.tower/board.jsonl`
     from 6109 to 6110 lines with **no stray `board.jsonl` created in the repo**.
   - `hooks/stop-verdict.mjs` — byte-identical pre-swap, `bun build` resolves.
   - `hooks/ask-bridge.mjs` — byte-identical pre-swap, **and the wave-1 gap is
     closed**: its runtime homedir-anchored dynamic import (line 152) was
     EXERCISED through the symlink, with a negative control (`HOME` pointed at a
     nonexistent dir reproduces `lib.mjs import failed … from
     /Users/jrg/agent-core/primitives/mcps/tower/hooks/ask-bridge.mjs`).
   Bus verified after each swap: `cli status` exit 0, MCP `tower … ✔ Connected`.
   Pre-swap copies preserved at
   `~/.tower-backups/pre-final-swap-20260813T053512Z/`.

Evidence files: `E1-install-sh-clobber-proof.md` (mine), `E2-*` (install-reconcile
worker), `E3-*` (driftcheck worker), all in this directory.

---

## IN FLIGHT — exactly how far

**Nothing is half-done.** The last unit of work (CORD gate items 1, 2, 3) is
complete and committed at `1722f56`. Both workers were verified, collected and
reaped; my tab holds only me.

**The one loose end, and it matters:**

> My drift-check fix (`1722f56`) exists **only on my branch**. I edited
> `drift-check.mjs` in the MAIN checkout `/Users/jrg/agent-core`, which is
> currently on the SIBLING's branch `tower/w0-version-control`. I copied the
> change to my worktree, committed it there, and **reverted the main checkout**
> so the sibling's tree stayed clean and CORD's merge would not conflict.
>
> Consequence: **running `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs`
> right now uses the OLD version and will report `FAIL drift-check.mjs missing at
> /Users/jrg/.tower/drift-check.mjs`.** That is a false positive already fixed on
> my branch. It disappears when CORD lands `1722f56`. Do not "re-fix" it.

---

## NEXT CONCRETE ACTION (imperative)

1. **Report to CORD** on `tower/w0-canonical-source` that gate items 1, 2 and 3
   are closed, with the drift-check run pasted and the ask-bridge verdict. (If
   the board row referenced below is present, this is already done.)
2. **Wait for CORD to land** `tower/w0-canonical-source` @ `1722f56` and
   herdr-spine `tower/w0-install-reconcile` @ `b42132e`. Do not land them
   yourself; CORD gates.
3. **After CORD lands, re-run** `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs`
   and confirm `0 FAIL, exit 0` from the main checkout.
4. **Then write** `~/.tower/orch-w0-canonical-source.done` and go idle. (A `.done`
   from an earlier checkpoint may already exist — overwrite it with the final
   state.)

Do **not** start a new unit.

---

## Rulings and constraints I am holding that are written nowhere else

- **`.md` vs `.mjs` severity is deliberate, not sloppy.** Deployed `.md` drift is
  WARN because no runtime code reads a deployed doc; `.mjs` is FAIL because hooks
  and the server execute from the deployed path.
- **Repo-only is now declared, not inferred** (`REPO_ONLY` set: `drift-check.mjs`,
  `DEPLOYMENT.md`, `README.md`). I chose `SKIP` over a permanent `WARN` because a
  warning that can never be actioned is the same cry-wolf failure CORD asked me to
  fix. This changed README/DEPLOYMENT from WARN to SKIP — CORD's message described
  them as "correctly WARN", so **CORD may want to overrule this**; it is a
  one-line change to `checkRepoOnly()`.
- **The two remaining WARNs are correct and should stay**: the stale orphan at
  `primitives/hooks/stop-verdict.mjs` (dead file from reverted `3deb7e7`), and
  "no upstream configured". Removing the orphan is a **deletion** and therefore
  the operator's call, not an agent's.
- **I removed install.sh's hardcoded `base_sha="63ec724d"` refuse-branch.** A
  drifted **non-symlink** deployed file is now overwritten *from canonical*
  instead of refused. Correct deploy semantics once canonical is the source, but
  it is a real behaviour change. I flagged it to CORD twice; **no ruling received.**
- **Never delete from `~/herdr-spine/cc-hooks/` or from `attic/`.** CORD reserved
  both explicitly.

---

## What a successor could get WRONG by reading my brief alone

The brief is good but parts of it are now false. Corrections, all verified:

| Brief says | Truth |
|---|---|
| T3: "Execute the cutover" | **CORD amended this to VERIFY, do not execute.** The sibling lane's `agnt-w0-swap` performed it. Executing it again would collide on a live bus. |
| Fact 9: install.sh "either refuses **or** `cp`s" over server.mjs | Half wrong. The clobber branch needs `prod_sha == 63ec724d`; live is `5657cf0f`, so server.mjs divergence yields a **warning, not a clobber**. The genuinely unguarded path was the **hooks** branch (install.sh:248-257), which had no sha check at all. |
| Fact 13 names **two** import constraints | There is a **third**, and it bit us: `cli.mjs:159` wrote the board via `new URL('./board.jsonl', import.meta.url)` — code-relative. Symlinking retargeted it into the repo and silently ate **7 coordination rows**, including my own hold request to the sibling. Fixed in canonical by `8e54604` and now deployed. |
| Fact 13 / brief: **6** hooks use `../lib.mjs` | **5**: `odometer`, `odometer-stop`, `prompt-inject`, `session-start`, `stop-guard`. |
| Fact 15: server-drift baseline 7 pass / 4 fail | Still 7/4 — but I briefly made it 6/5. My `install.sh` change added a legitimate third outcome string that the `install.sh reports relay_inbox reconciled` oracle rejected. I updated the oracle (one-line, in scope per CORD). **Do not "fix" the 4 remaining failures** — they are pre-existing and scoped to W3. |
| Fact 4 (sibling brief): state is homedir-anchored, "moving code cannot move state" | True **except** the `cli.mjs:159` site above. That was the one place it did not hold. |
| Facts about `main` | `main` moved **three times** during this unit (`949238d` → `9ff8778` → CORD's `07089d3`). Re-read git state; do not trust any commit sha in the brief. |
| `stop-verdict.mjs` has two competing copies | It had **four**, including an orphaned stale 3,551-byte copy at `primitives/hooks/stop-verdict.mjs` (live is 5,195 B). |

**One hazard nobody has fixed** (raised, deliberately not actioned by me):
`server-drift.test.mjs` spawns the **real** `bash ~/herdr-spine/install.sh` against
the **live machine** — the full installer, not just `install_tower_auto`. Every run
rewrites `~/.claude/settings.json` and reloads herdr config. It is idempotent today
so no damage has occurred (verified: settings.json valid, all 15 `.tower` hook refs
intact, MCP connected), but it is a landmine. The cheap fix is to point its two
asserts at a fixture via the `TOWER_AUTO_*` env vars that `b42132e` honours. It is
W3's file, not mine.
