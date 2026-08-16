# Branch triage — the preserved fleet branches

Unit 4 of the worktree-lifecycle work. 2026-08-16.

The 2026-08-16 worktree sweep reclaimed 85 orphaned worktrees and deliberately
preserved every branch rather than adjudicating it. This document is the
adjudication: a verdict per branch, the test that produced it, and the evidence
behind both. Scope was frozen at dispatch to the three snapshot files under
`briefs/worktree-lifecycle/evidence/`; nothing outside them was touched.

**Outcome:** 158 refs in scope, 3 of them integration refs. Of the 155 judged,
**114 were superseded and deleted**, **41 hold unique content and were kept**.
Every kept branch is named below with the specific files that kept it alive.

---

## 1. The content-supersession test

Ancestry is disqualified as a test. The fleet squash-merges, so a branch whose
artifacts have fully landed still reports as unmerged. In agent-core this is
total: **zero** of the 78 non-integration branches were ancestors of `main`,
yet 59 of them held nothing `main` does not already have.

So the test compares content. For each branch `B` against its repo's
integration tip `I`, with `M = merge-base(I, B)`:

1. `B` is an ancestor of `I` — superseded, nothing more to check.
2. `tree(B) == tree(I)` — superseded.
3. Otherwise, take every path `B` changed relative to `M`
   (`git diff --name-status -M -z M B`) and require **each one** to clear a
   rung. A branch is superseded only if every changed path clears one:

| rung | condition | what it means |
|---|---|---|
| `exact` | `blob(B:F) == blob(I:F)` | the branch's version is live in integration |
| `historical` | `blob(B:F)` is a blob `I`'s history ever held, at any path | it landed, and integration evolved past it |
| `removed-path` | `F` is not in `I`'s tree, but `I`'s history held that path | integration removed it on purpose |
| `redacted` | `(path, blob)` is on the pinned redaction list in section 5 | integration scrubbed it on purpose |
| `absorbed` | every non-blank line `B` added to `F` also appears in `I:F` | it landed under a later rewrite |

Submodule gitlinks (mode `160000`) are excluded from the content test. A
gitlink is a pointer into a different repository; the pointed-at commit lives
there and survives any ref deletion here. Differing pins are recorded, not
counted as unique content.

A path clearing no rung makes the branch **UNIQUE**, and the report names the
path and how it failed (`[+NL]` = N added lines found nowhere in integration's
copy; `[new-file-never-in-integration-history]`; `[deletion-not-landed]`).

Every branch was judged; the tool emitted exactly one record per snapshot line
(79 / 49 / 30 in, 79 / 49 / 30 out).

### Why the `historical` rung exists — and why the first two versions of this test were wrong

The first version compared only `blob(B:F)` against `blob(I:F)` and fell back to
an added-lines check. It returned **78 of 78 agent-core branches as unique**,
which is not credible. Reading the smallest case
(`wt-verify-assay-recall`, three files) showed why: the branch's
`primitives/hooks/tower-ledger.mjs` is blob
`b44843b91de9742b20532b71dfc45abac89d880e`, which is **exactly** the version
`main` carried at commit `d6811083` (2026-08-11). The work had landed; `main`
then refactored the file, so the branch's lines no longer appear in `main`'s
current copy and the naive test scored them as lost. Indexing every blob in the
integration branch's history (`git rev-list --objects`) and admitting a match as
supersession cut agent-core's false-unique findings from 1812 to 186.

The second correction was submodules. `cli` is a submodule
(`160000 commit`, `.gitmodules` -> `agent-core-cli.git`), and 58 branches pinned
a different commit than `main`. `git show main:cli` fails because the foreign
commit is not in this repo, which the naive test read as orphaned content.

## 2. Validation cases

The test was validated on seven branches whose answers were confirmed by
reading the files before trusting the tool.

| # | repo | branch | tool verdict | independent confirmation |
|---|---|---|---|---|
| V1 | herdr-spine | `feat/parity-make-test-maker` | UNIQUE, `bin/spine-spawn` +3L | `main:bin/spine-spawn` line 1036 reads `test_args.profile = None` and line 1080 reads `"(concierge\|coordinator\|orchestrator\|coder\|researcher); "`. The branch sets `"test-maker"` and adds `test-maker\|tester\|arbiter`. Genuinely unlanded. |
| V2 | herdr-spine | `wt-agnt-test-maker-w2y-p1r` | SUPERSEDED | Its only change is a new 230-line `bin/handlers/tests/test_board_append_flock.py`; `git rev-parse` gives blob `ac2c0db58c0f7f57cb58af3b8407c38611b21b7b` on both the branch and `main`. Byte-identical. |
| V3 | cursor-shim | `wt-agnt-coder-w31-p4j` | UNIQUE, `cursor-spine` +149L | `git grep freshness_gate_eval feat/a5-batch-record -- cursor-spine` finds nothing; the branch has two hits. The freshness gate never landed. |
| V4 | cursor-shim | `lever-1-herdr-kind` | SUPERSEDED (ANCESTOR) | Tip `7f874d9` appears in `git log feat/a5-batch-record`; `git diff feat/a5-batch-record...lever-1-herdr-kind --stat` is empty — the branch introduces nothing integration lacks. |
| V5 | agent-core | `wt-verify-assay-recall` | SUPERSEDED (via `historical` + `redacted`) | See section 1. `tower-ledger.mjs` blob `b44843b9` is `main`'s own version at `d6811083`; the vein corpus difference is the redaction in section 5. |
| V6 | agent-core | the 37 branches blocked only by `credential-guard.sh` | SUPERSEDED (`redacted`) | All 37 carry the identical blob `c2ae595383b228b86d6d4c34e59b2026c85ba70d`. The complete diff against `main` is two lines, both placeholder strings inside a test fixture: an `AVNS_`-prefixed operator-redaction marker shortened, and an `AVNS_`-prefixed example token shortened. (The literal strings are omitted here: they are placeholders, not live credentials, but GitHub push protection matches the prefix pattern and refused this file when they were quoted verbatim. Read them from the fixture blob if needed.) The credential-guard feature itself landed whole in `6d03f9f`. |
| V7 | agent-core | the 22 branches blocked only by the vein corpus | SUPERSEDED (`redacted`) | See section 5. |

## 3. Reconciliation of the parent brief's "117"

The parent brief states 117 branches were preserved, "79 in agent-core, 34 in
cursor-shim, 4 in herdr-spine". Measured at dispatch and again now:

| repo | total local branches | fleet-named (`wt-*`/`spine/*`) | tip subject contains `wip(` | parent brief's figure |
|---|---|---|---|---|
| agent-core | 79 | 64 | 29 | 79 |
| cursor-shim | 49 | 38 | 18 | 34 |
| herdr-spine | 30 | 23 | 1 | 4 |
| **total** | **158** | **125** | **48** | **117** |

The dispatch-time Pre-Verified Facts table reproduced exactly. The parent
brief's 117 does not. Only its first figure is recoverable: agent-core's 79 is
that repo's total local branch count. Its 34 and 4 match no column I can
measure — not totals, not fleet-named, not `wip(`-tipped. Nor does 117 match
any whole-fleet aggregate: the near misses are 111 (`wt-` prefixed only) and
125 (all fleet-named). **117 is not reconstructible from the repositories and
should not be relied on.** No branch was deleted on the strength of a count.

## 4. Verdict counts

| repo | in scope | integration ref | superseded, deleted | kept, unique | undecided |
|---|---|---|---|---|---|
| agent-core | 79 | `main` | 59 | 19 | 0 |
| cursor-shim | 49 | `feat/a5-batch-record` | 28 | 20 | 3 (kept, see section 7) |
| herdr-spine | 30 | `main` | 27 | 2 | 0 |
| **total** | **158** | **3** | **114** | **41** | **3 of the 41** |

Integration branches, determined rather than assumed:

- `agent-core` -> `main` (`60181fe`), the only checked-out branch.
- `herdr-spine` -> `main` (`f7a90f5`), the only checked-out branch.
- `cursor-shim` -> **`feat/a5-batch-record`** (`6c5c998`), not `main`. It is the
  checked-out branch, `main` is a strict ancestor of it (`main..feat/a5-batch-record`
  = 1 commit, the reverse = 0), so it is a superset of `main` and is the correct
  and safer comparison target.

Every superseded branch was re-verified immediately before deletion: still at
its snapshot SHA (no sibling orchestrator had moved it), and checked out in no
worktree. All 114 passed; 0 were held back.

## 5. The redaction rung, and the finding behind it

Two file classes blocked 59 agent-core branches, and both turned out to be one
event: an operator credential-redaction pass that landed on `main` and never
reached the worktree branches.

**`primitives/tools/vein/test/acceptance/pass12-commands.csv`** (blob
`67e7d24f7448424eeabfe7d8519588e06b407c7e`) and
**`pass12/retries.md`** (blob `f839fc9d6ecff2189bb1d447e8362a6bb94ceb71`),
identical across all 22 affected branches. They differ from `main` in 8 rows.
The difference is that `main` replaced a live-looking DigitalOcean managed
Postgres URI — user `doadmin`, an `AVNS_`-prefixed password, host
`db-bento-prod-postgresql-nyc1-40467-do-user-4130303-0...:25060/bento` — with
`AVNS_<REDACTED>`. The corpus is mined session-transcript data, so the row is a
command a real session ran.

**Finding for the coordinator, and the reason this rung is not just bookkeeping:**
`main`'s only commit touching that path (`130ffc1`) already carries the redacted
version, and the unredacted blob is **not** reachable from `main`'s history
(`git rev-list --objects main | grep <blob>` -> 0 hits). Those 22 branch refs
were the *only* thing keeping the unredacted credential reachable. Deleting them
removes the last reachable copy from the ref graph. Two things still follow, and
neither is mine to do:

- The blobs survive as unreachable objects until `git gc` prunes them (default
  two weeks). `git reflog expire --expire-unreachable=now --all && git gc --prune=now`
  in `~/agent-core` would clear them immediately.
- Reachability is not the same as secrecy. If that credential is or ever was
  live, deleting refs does not rotate it.

`primitives/hooks/test/credential-guard.sh` (blob
`c2ae595383b228b86d6d4c34e59b2026c85ba70d`, identical across 37 branches) is the
same pass, benign: `main` shortened two placeholder strings in a test fixture.
Also not in `main`'s history, for the same reason.

The rung is pinned by exact `(path, blob)` pairs, so it cannot silently widen —
any other blob at those paths still reports as UNIQUE.

## 6. Verdicts

### agent-core — kept, holds unique content (19)

| branch | tip | date | unique content |
|---|---|---|---|
| `feat/parity-verify-beat-roles` | `af2c415` | 2026-08-13 | `primitives/profiles/PROFILES.md` (+4L); `primitives/profiles/arbiter.md` (new-file-never-in-integration-history); `primitives/profiles/models.json` (+22L); `primitives/profiles/test-maker.md` (new-file-never-in-integration-history); `primitives/profiles/tester.md` (new-file-never-in-integration-history) |
| `rescue/parity-verify-beat-roles` | `af2c415` | 2026-08-13 | `primitives/profiles/PROFILES.md` (+4L); `primitives/profiles/arbiter.md` (new-file-never-in-integration-history); `primitives/profiles/models.json` (+22L); `primitives/profiles/test-maker.md` (new-file-never-in-integration-history); `primitives/profiles/tester.md` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w2y-p14` | `5b41841` | 2026-08-16 | `primitives/hooks/tower-ledger.mjs` (+131L); `primitives/mcps/tower/COMMS-ARCH.md` (+18L); `primitives/mcps/tower/cli.mjs` (+12L) |
| `wt-agnt-coder-w2y-p18` | `9d5a70f` | 2026-08-16 | `primitives/mcps/tower/cli.mjs` (+1L) |
| `wt-agnt-coder-w2y-p1x` | `ad4b0ab` | 2026-08-16 | `primitives/hooks/tower-ledger.mjs` (+39L); `primitives/mcps/tower/lib.mjs` (+2L); `primitives/mcps/tower/server.mjs` (+8L); `briefs/a8-coder.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w2y-p21` | `9f5e88e` | 2026-08-16 | `briefs/manifest-and-alarms/fixtures/emit-demo.mjs` (new-file-never-in-integration-history); `briefs/manifest-and-alarms/fixtures/post-tooluse-fixture.jsonl` (new-file-never-in-integration-history); `primitives/hooks/grounding-exhaust.mjs` (new-file-never-in-integration-history); `primitives/hooks/grounding-exhaust.test.mjs` (new-file-never-in-integration-history); `primitives/hooks/grounding-hook.mjs` (new-file-never-in-integration-history); `primitives/mcps/tower/GROUND-MANIFEST.md` (new-file-never-in-integration-history); `.madewell/ground/*/deps.json` x2 (new-file-never-in-integration-history); `briefs/a2-coder.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w2y-pb` | `387440b` | 2026-08-16 | `primitives/mcps/tower/plane-fixes.test.mjs` (+53L) |
| `wt-agnt-coder-w2y-pf` | `2d9e316` | 2026-08-16 | `primitives/mcps/tower/cli.test.mjs` (+24L) |
| `wt-agnt-coder-w2y-pn` | `404d7b1` | 2026-08-16 | `primitives/mcps/tower/rotate.mjs` (+14L) |
| `wt-agnt-coder-w2z-pt` | `35fdcdb` | 2026-08-16 | `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md` (+11L); `primitives/mcps/tower/COMMS-ARCH.md` (+4L); `briefs/agnt-comms-arch-factual.done` (+2L) |
| `wt-agnt-test-maker-w2y-p15` | `1a1c026` | 2026-08-16 | `primitives/mcps/tower/jsonl-integrity.test.mjs` (+78L) |
| `wt-agnt-test-maker-w2y-p1y` | `f4161f2` | 2026-08-16 | `primitives/mcps/tower/a8-alarm.test.mjs` (new-file-never-in-integration-history); `briefs/a8-test-maker.done` (new-file-never-in-integration-history) |
| `wt-agnt-test-maker-w2y-p22` | `8c152d9` | 2026-08-16 | `primitives/hooks/grounding-exhaust.test.mjs` (new-file-never-in-integration-history); `primitives/hooks/test/fixtures/post-tooluse-mixed.json` (new-file-never-in-integration-history); `briefs/a2-test-maker.done` (new-file-never-in-integration-history) |
| `wt-agnt-test-maker-w2y-pg` | `2c385e6` | 2026-08-16 | `primitives/mcps/tower/cli.test.mjs` (+15L) |
| `wt-agnt-test-maker-w2y-pp` | `c68c71f` | 2026-08-16 | `primitives/mcps/tower/rotate.test.mjs` (+12L) |
| `wt-agnt-test-maker-w2z-p9` | `b602926` | 2026-08-16 | `primitives/mcps/tower/write-path.test.mjs` (+2L) |
| `wt-agnt-test-maker-w2z-pg` | `7cf3342` | 2026-08-16 | `primitives/mcps/tower/flock-integrity.criteria.md` (+8L); `primitives/mcps/tower/flock-integrity.test.mjs` (+21L) |
| `wt-agnt-test-maker-w2z-pr` | `a1f689b` | 2026-08-16 | `primitives/tools/statem/statem-twr-residuals.criteria.md` (+2L); `primitives/tools/statem/statem-twr-residuals.test.mjs` (+4L) |
| `wt-agnt-test-maker-w2z-pv` | `840e9b2` | 2026-08-16 | `briefs/tower/bus-data/COMMS-ARCH-FACTUAL-PROOF.md` (+29L); `primitives/mcps/tower/COMMS-ARCH.md` (+14L); `briefs/agnt-comms-arch-factual.done` (+4L) |

### agent-core — superseded and deleted (59)

**REDACTED** (59): `docs/codify-stigmergy-nq`, `feat/a2-ground-manifest-exhaust`, `feat/wave-rollup-skill`, `fix/a8-alarm-rationalization`, `orch/w0-driftcheck-fix`, `orch/w3-plane-fixes`, `orch/w4-retention`, `spine/u2-smoke-claude`, `spine/u2-smoke-claude-test`, `spine/u2-smoke-pi`, `spine/u2-smoke-pi-test`, `spine/w0-driftcheck`, `spine/w0-preserve-and-stage-w1`, `spine/w0-preserve-and-stage-w2`, `spine/w0-readme`, `spine/w0-swap`, `tower/board-write-path-hardening`, `tower/bus-data-residuals`, `tower/flock-integrity`, `tower/w0-canonical-source`, `tower/w0-version-control`, `wt-agnt-coder-w2b-p4`, `wt-agnt-coder-w2b-p9`, `wt-agnt-coder-w2b-pc`, `wt-agnt-coder-w2b-pj`, `wt-agnt-coder-w2b-pq`, `wt-agnt-coder-w2b-ps`, `wt-agnt-coder-w2b-pw`, `wt-agnt-coder-w2h-p6`, `wt-agnt-coder-w2h-pq`, `wt-agnt-coder-w2y-p4`, `wt-agnt-coder-w2y-p5`, `wt-agnt-coder-w2y-p6`, `wt-agnt-coder-w2y-p7`, `wt-agnt-coder-w2y-px`, `wt-agnt-coder-w2z-p4`, `wt-agnt-coder-w2z-p5`, `wt-agnt-coder-w2z-p6`, `wt-agnt-coder-w2z-p8`, `wt-agnt-coder-w2z-pa`, `wt-agnt-coder-w2z-pb`, `wt-agnt-coder-w2z-pc`, `wt-agnt-coder-w2z-pf`, `wt-agnt-coder-w2z-pp`, `wt-agnt-coder-w3a-p6`, `wt-agnt-coder-w3a-p7`, `wt-agnt-coder-w3a-p8`, `wt-agnt-test-maker-w2b-p5`, `wt-agnt-test-maker-w2b-pa`, `wt-agnt-test-maker-w2b-pd`, `wt-agnt-test-maker-w2b-pk`, `wt-agnt-test-maker-w2b-pt`, `wt-agnt-test-maker-w2b-px`, `wt-agnt-test-maker-w2h-p7`, `wt-agnt-test-maker-w2h-pr`, `wt-agnt-test-maker-w2y-p19`, `wt-agnt-test-maker-w2y-pc`, `wt-finish-a2-exhaust`, `wt-verify-assay-recall`


### cursor-shim — kept, holds unique content (20)

| branch | tip | date | unique content |
|---|---|---|---|
| `feat/a3-freshness-gate` | `d71a24e` | 2026-08-13 | `briefs/emitters/ORCH-shim-emitters.md` (new-file-never-in-integration-history); `briefs/emitters/SMOKE-BOARD.jsonl` (new-file-never-in-integration-history); `cursor-spine` (+34L); `docs/qa-verify.sh` (+9L); `briefs/orch-shim-emitters.done` (new-file-never-in-integration-history) |
| `fix/shim-emitter-author` | `d71a24e` | 2026-08-13 | `briefs/emitters/ORCH-shim-emitters.md` (new-file-never-in-integration-history); `briefs/emitters/SMOKE-BOARD.jsonl` (new-file-never-in-integration-history); `cursor-spine` (+34L); `docs/qa-verify.sh` (+9L); `briefs/orch-shim-emitters.done` (new-file-never-in-integration-history) |
| `lever-2-mcp-tools` | `4e32b47` | 2026-08-16 | `.orch/ORCH-REPORT.md` (new-file-never-in-integration-history); `.orch/briefs/agnt-fleet-note.md` (new-file-never-in-integration-history); `.orch/briefs/agnt-write-mcp-json.md` (new-file-never-in-integration-history); `.orch/*.done` x3 (new-file-never-in-integration-history) |
| `lever-4-sessions` | `c7568a2` | 2026-08-16 | `briefs/agnt-sessions-warm-ctx.md` (new-file-never-in-integration-history); `briefs/agnt-sessions-warm-ctx.report.md` (new-file-never-in-integration-history); `briefs/helios-proof.txt` (new-file-never-in-integration-history); `briefs/*.done` x2 (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p47` | `57cae06` | 2026-08-16 | `./.done` (+22L) |
| `wt-agnt-coder-w31-p4e` | `d136efd` | 2026-08-16 | `./.done` (+26L) |
| `wt-agnt-coder-w31-p4j` | `6bb9740` | 2026-08-16 | `cursor-spine` (+149L); `briefs/agnt-coder-a3.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p4p` | `fdb16d0` | 2026-08-16 | `cursor-spine` (+135L); `.madewell/ground/*/deps.json` x2 (new-file-never-in-integration-history); `briefs/*.done` x3 (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p4q` | `3dbefe3` | 2026-08-16 | `cursor-spine` (+135L); `./.done` (+13L); `.madewell/ground/*/deps.json` x6 (new-file-never-in-integration-history); `briefs/agnt-coder-a3.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p4r` | `b6270a7` | 2026-08-16 | `cursor-spine` (+135L); `briefs/agnt-coder-w31-p4r.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p5b` | `de0d6f4` | 2026-08-16 | `cursor-spine` (+135L); `workers/agnt-coder-w31-p5b.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-p8` | `1fdcc11` | 2026-08-16 | `cursor-spine` (+135L); `.madewell/ground/*/deps.json` x6 (new-file-never-in-integration-history); `briefs/agnt-coder-a3.done` (new-file-never-in-integration-history); `workers/*.done` x14 (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-pb` | `afcaf7a` | 2026-08-16 | `cursor-finish` (+136L); `rules/cursor-fleet.md` (+5L) |
| `wt-agnt-coder-w31-pe` | `3c70dbd` | 2026-08-16 | `cursor-spine` (+135L); `briefs/agnt-coder-a3.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-pf` | `f7bd7d7` | 2026-08-16 | `cursor-spine` (+159L); `briefs/agnt-coder-a3.done` (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-pj` | `247eaf5` | 2026-08-16 | `briefs/test-unit/unit.txt` (new-file-never-in-integration-history); `cursor-spine` (+135L); `.madewell/ground/deps/deps.json` (new-file-never-in-integration-history); `briefs/*.done` x2 (new-file-never-in-integration-history) |
| `wt-agnt-coder-w31-pm` | `78af57f` | 2026-08-16 | `./.done` (+18L) |
| `wt-agnt-coder-w31-pp` | `e41c26b` | 2026-08-16 | `cursor-spine` (+137L); `.madewell/ground/*/deps.json` x13 (new-file-never-in-integration-history); `briefs/*.done` x254 (new-file-never-in-integration-history) |
| `wt-agnt-test-maker-w31-p9` | `50bfbbf` | 2026-08-16 | `briefs/the-door/a3-fixtures.sh` (new-file-never-in-integration-history); `briefs/the-door/fixtures/deps-bad-schema.json` (new-file-never-in-integration-history); `briefs/the-door/fixtures/deps-coverage-partial.json` (new-file-never-in-integration-history); `briefs/the-door/fixtures/deps-empty.json` (new-file-never-in-integration-history); `docs/qa-verify.sh` (+48L); `briefs/agnt-test-maker-a3.done` (new-file-never-in-integration-history) |
| `wt-agnt-test-maker-w31-pc` | `8a7774e` | 2026-08-16 | `docs/qa-verify.sh` (+27L); `./.done` (+10L) |

### cursor-shim — superseded and deleted (28)

**ANCESTOR** (28): `lever-1-herdr-kind`, `lever-3-proem-cache`, `lever-5-mode-json`, `lever-6-statem-reap`, `lever-7-fanout`, `main`, `wt-agnt-coder-w29-p19`, `wt-agnt-coder-w29-p1b`, `wt-agnt-coder-w29-p1d`, `wt-agnt-coder-w29-p1n`, `wt-agnt-coder-w29-p1t`, `wt-agnt-coder-w29-p1x`, `wt-agnt-coder-w29-p2e`, `wt-agnt-coder-w29-p2p`, `wt-agnt-coder-w2m-pa`, `wt-agnt-coder-w31-p12`, `wt-agnt-coder-w31-p19`, `wt-agnt-coder-w31-p1a`, `wt-agnt-coder-w31-p62`, `wt-agnt-coder-w31-pg`, `wt-agnt-coder-w31-ph`, `wt-agnt-coder-w31-pk`, `wt-agnt-coder-w31-pn`, `wt-agnt-coder-w31-pr`, `wt-agnt-coder-w31-pv`, `wt-agnt-coder-w31-py`, `wt-agnt-test-maker-w29-p1a`, `wt-agnt-test-maker-w2m-pb`


### herdr-spine — kept, holds unique content (2)

| branch | tip | date | unique content |
|---|---|---|---|
| `feat/parity-make-test-maker` | `5ff9109` | 2026-08-13 | `bin/spine-spawn` (+3L) |
| `pr-1-verify-beat` | `5ff9109` | 2026-08-13 | `bin/spine-spawn` (+3L) |

### herdr-spine — superseded and deleted (27)

**ANCESTOR** (26): `chore/spine-twin-server-sync`, `feat/parity-verify-gate-unify`, `fix/spine-board-flock`, `spine/u2ev-9964-pi`, `spine/u2ev-9964-pi-test`, `spine/u2ev-9985-claude`, `spine/u2ev-9985-claude-test`, `spine/w0-install-reconcile`, `tower/w0-install-reconcile`, `wt-agnt-coder-w2c-p6`, `wt-agnt-coder-w2g-p5`, `wt-agnt-coder-w2g-p6`, `wt-agnt-coder-w2g-pe`, `wt-agnt-coder-w2h-p4`, `wt-agnt-coder-w2h-pg`, `wt-agnt-coder-w2k-p4`, `wt-agnt-coder-w2k-p6`, `wt-agnt-coder-w2y-p11`, `wt-agnt-coder-w2y-p1q`, `wt-agnt-test-maker-w2c-p7`, `wt-agnt-test-maker-w2g-p7`, `wt-agnt-test-maker-w2g-pf`, `wt-agnt-test-maker-w2h-p5`, `wt-agnt-test-maker-w2k-p5`, `wt-agnt-test-maker-w2k-p7`, `wt-agnt-test-maker-w2y-p12`

**EXACT** (1): `wt-agnt-test-maker-w2y-p1r`


---

## 7. Undecided — kept, with what would settle them

Nothing blocked a verdict outright. Three keeps are low-confidence and are
recorded here rather than buried in the tables above, because a successor should
not have to re-derive why they are still on disk.

| branch | repo | why it was kept | what would settle it |
|---|---|---|---|
| `wt-agnt-coder-w31-p47` | cursor-shim | its only unique content is the repo-root `.done`, +22 lines | an operator ruling on whether root `.done` is a durable record or a transient stamp |
| `wt-agnt-coder-w31-p4e` | cursor-shim | same, +26 lines | same |
| `wt-agnt-coder-w31-pm` | cursor-shim | same, +18 lines | same |

All three `.done` files are smoke-run reports. `wt-agnt-coder-w31-p47`'s says
verbatim `files touched: (none — no partition in brief; smoke-only)`. The root
`.done` is a single-slot file each agent overwrites, and integration's copy is a
different, older report, so these are not merge conflicts — they are three
reports that never landed. They were kept because the brief's rule is that an
extra ref is free and the work is not, and because "is an agent's own run report
worth a ref" is a convention question, not a content question. If the answer is
no, all three delete cleanly.

Note that the same reasoning does **not** cover the other `.done`-bearing keeps:
those branches also carry substantive source changes (`cursor-spine`,
`cursor-finish`, `docs/qa-verify.sh`) and would be keeps regardless.

## 8. Findings posted, not fixed

Both are outside this unit's partition (`~/cursor-shim/**` belongs to the
unit 2+3 orchestrator). They are recorded here and on the Tower board.

**A spawner interpolates a log line into a path.** `wt-agnt-coder-w31-p4q` has a
committed tree entry whose path contains a newline and a status message:

```
.madewell/ground/verify-mark: criteria gate AUTHORED for unit ea0bf5ed5c8599dd (/tmp/bypass-brief.XXXXXX.md)
ea0bf5ed5c8599dd/deps.json
```

That is one path, not two. The ground-manifest path is being built from a
command substitution that captured the tool's stdout along with the unit key —
`$(... verify-mark ...)` where only the key was wanted. `wt-agnt-coder-w31-p8`
carries the same defect with a different unit key, so it is reproducible rather
than a one-off. The affected branches are keeps, so the evidence is still on
disk. Not fixed here.

**Submodule pin drift.** 58 agent-core branches pinned a `cli` submodule commit
different from `main`'s (`2b0b97a1`). No action needed — the commits live in
`agent-core-cli.git` — but it is worth knowing that worktree branches routinely
carry stale submodule pins, since a naive content check reads them as orphaned
work.

## 9. Post-deletion state

`git for-each-ref refs/heads`, per repo, after the deletions. 48 refs remain:
41 kept-unique + 3 integration + 4 created by the sibling orchestrator after the
snapshot was frozen (`spine/wt-cursor`, `spine/wt-cursor-test`, `spine/wt-spine`,
`spine/wt-spine-test`), which were correctly left alone.

```
=== agent-core (20 refs) ===
feat/parity-verify-beat-roles af2c415
main 60181fe
rescue/parity-verify-beat-roles af2c415
wt-agnt-coder-w2y-p14 5b41841
wt-agnt-coder-w2y-p18 9d5a70f
wt-agnt-coder-w2y-p1x ad4b0ab
wt-agnt-coder-w2y-p21 9f5e88e
wt-agnt-coder-w2y-pb 387440b
wt-agnt-coder-w2y-pf 2d9e316
wt-agnt-coder-w2y-pn 404d7b1
wt-agnt-coder-w2z-pt 35fdcdb
wt-agnt-test-maker-w2y-p15 1a1c026
wt-agnt-test-maker-w2y-p1y f4161f2
wt-agnt-test-maker-w2y-p22 8c152d9
wt-agnt-test-maker-w2y-pg 2c385e6
wt-agnt-test-maker-w2y-pp c68c71f
wt-agnt-test-maker-w2z-p9 b602926
wt-agnt-test-maker-w2z-pg 7cf3342
wt-agnt-test-maker-w2z-pr a1f689b
wt-agnt-test-maker-w2z-pv 840e9b2
=== cursor-shim (23 refs) ===
feat/a3-freshness-gate d71a24e
feat/a5-batch-record 6c5c998
fix/shim-emitter-author d71a24e
lever-2-mcp-tools 4e32b47
lever-4-sessions c7568a2
spine/wt-cursor 6c5c998
spine/wt-cursor-test 6c5c998
wt-agnt-coder-w31-p47 57cae06
wt-agnt-coder-w31-p4e d136efd
wt-agnt-coder-w31-p4j 6bb9740
wt-agnt-coder-w31-p4p fdb16d0
wt-agnt-coder-w31-p4q 3dbefe3
wt-agnt-coder-w31-p4r b6270a7
wt-agnt-coder-w31-p5b de0d6f4
wt-agnt-coder-w31-p8 1fdcc11
wt-agnt-coder-w31-pb afcaf7a
wt-agnt-coder-w31-pe 3c70dbd
wt-agnt-coder-w31-pf f7bd7d7
wt-agnt-coder-w31-pj 247eaf5
wt-agnt-coder-w31-pm 78af57f
wt-agnt-coder-w31-pp e41c26b
wt-agnt-test-maker-w31-p9 50bfbbf
wt-agnt-test-maker-w31-pc 8a7774e
=== herdr-spine (5 refs) ===
feat/parity-make-test-maker 5ff9109
main f7a90f5
pr-1-verify-beat 5ff9109
spine/wt-spine f7a90f5
spine/wt-spine-test f7a90f5
```

Cross-check against the verdicts: 0 deleted branches still present, 0 kept
branches missing, 0 unexplained refs.

## 10. Recovery

Deletion used `git branch -D` because squash merges make `-d` refuse. The
snapshot files remain the record of scope; the full SHAs below are the record of
what was removed. Any branch restores with:

```
git -C ~/<repo> branch <name> <sha>
```

This works while the objects survive — unreachable objects are pruned by `git gc`
on its own schedule (default two weeks), so recovery is not indefinite. Note the
interaction with section 5: for the 22 vein-corpus branches, prompt pruning is
the desired outcome, not a loss.

### agent-core (59)

```
94c2d0d6d0974b35de79babca12de57376358f96 docs/codify-stigmergy-nq
31f913e0679fc5fbea04790a351dc8cf8ab40376 feat/a2-ground-manifest-exhaust
11396479cd67610857b990e4938017048b760837 feat/wave-rollup-skill
73fd284ca5a640b9d77ae5cfc55c8fd4c6931e64 fix/a8-alarm-rationalization
34011eefbfbb0b1d455b14324fa204e8b434c1f2 orch/w0-driftcheck-fix
6ac4bb19a98d57dd6e767b4d6b9228a95542b85c orch/w3-plane-fixes
1bf3a74dbdd4dfa4d7b7badf8102422c4ce48c4c orch/w4-retention
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec spine/u2-smoke-claude
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec spine/u2-smoke-claude-test
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec spine/u2-smoke-pi
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec spine/u2-smoke-pi-test
dbabe4f3e98f3854d2da1a4955782aa4af834421 spine/w0-driftcheck
949238de14594c1ef56eedcfc02973c5184ec561 spine/w0-preserve-and-stage-w1
949238de14594c1ef56eedcfc02973c5184ec561 spine/w0-preserve-and-stage-w2
5e281beda5ead48be163f69ecd756275f4b80073 spine/w0-readme
9ff877860ef6880396d3edc1d5e2826f0b7a01e9 spine/w0-swap
6d076b2548f626ac22f484d5bef22e38dbb93b3e tower/board-write-path-hardening
1a8b0a8324bc448d4b97e2389804d60720bdd94b tower/bus-data-residuals
8986eabb724ec9f38ff6fcaf739f89b16ac30b59 tower/flock-integrity
1722f56525075fd40ada8a5912b17ee65235b467 tower/w0-canonical-source
cab69eb4fcb3d837da9e03cce5161a593e6503f4 tower/w0-version-control
560bf07c327b6a5350162b586cc23927c9fabd12 wt-agnt-coder-w2b-p4
be8c04f44d3454089c4b0e7826c43761c6b075f6 wt-agnt-coder-w2b-p9
7fe23dda19bb60238b478c334c2b891729d212f4 wt-agnt-coder-w2b-pc
7fe23dda19bb60238b478c334c2b891729d212f4 wt-agnt-coder-w2b-pj
7fe23dda19bb60238b478c334c2b891729d212f4 wt-agnt-coder-w2b-pq
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec wt-agnt-coder-w2b-ps
2efbe0827226f73099c76cd89ff1257e82b4f434 wt-agnt-coder-w2b-pw
be8c04f44d3454089c4b0e7826c43761c6b075f6 wt-agnt-coder-w2h-p6
3c91cfd958b6789be49a579c44eedf852b65bd8b wt-agnt-coder-w2h-pq
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2y-p4
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2y-p5
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2y-p6
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2y-p7
a62e7469d8437f181bf9093e162f5a788c2e90a3 wt-agnt-coder-w2y-px
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2z-p4
cab69eb4fcb3d837da9e03cce5161a593e6503f4 wt-agnt-coder-w2z-p5
8d31bf3bfdd9a546836ca5aa596bfe913198bcd0 wt-agnt-coder-w2z-p6
074b4427941a66d95f0496e5e224e921a8be9728 wt-agnt-coder-w2z-p8
8cdf2c58a1dfa135a974acd5a09dd01528565f43 wt-agnt-coder-w2z-pa
4c83a6d6b8358f10ebc19ce7b7daee2a99b309dd wt-agnt-coder-w2z-pb
aa6675d57ecade5e4b090f6f91324c918051d5a8 wt-agnt-coder-w2z-pc
8c35583491e1e798c56d2f72f0922bcbbe4a9adc wt-agnt-coder-w2z-pf
dbaced9514752e86cb04280f01db20c900a156b7 wt-agnt-coder-w2z-pp
73fd284ca5a640b9d77ae5cfc55c8fd4c6931e64 wt-agnt-coder-w3a-p6
73fd284ca5a640b9d77ae5cfc55c8fd4c6931e64 wt-agnt-coder-w3a-p7
73fd284ca5a640b9d77ae5cfc55c8fd4c6931e64 wt-agnt-coder-w3a-p8
560bf07c327b6a5350162b586cc23927c9fabd12 wt-agnt-test-maker-w2b-p5
be8c04f44d3454089c4b0e7826c43761c6b075f6 wt-agnt-test-maker-w2b-pa
7fe23dda19bb60238b478c334c2b891729d212f4 wt-agnt-test-maker-w2b-pd
7fe23dda19bb60238b478c334c2b891729d212f4 wt-agnt-test-maker-w2b-pk
5f1b9e4718c56fb62c1d0dbca6d95aa85c0936ec wt-agnt-test-maker-w2b-pt
2efbe0827226f73099c76cd89ff1257e82b4f434 wt-agnt-test-maker-w2b-px
be8c04f44d3454089c4b0e7826c43761c6b075f6 wt-agnt-test-maker-w2h-p7
3c91cfd958b6789be49a579c44eedf852b65bd8b wt-agnt-test-maker-w2h-pr
e48505138e0800726d8343b3a4b00def956cbcb9 wt-agnt-test-maker-w2y-p19
cbeafa4956168236bc928b950ddd429771d5c52a wt-agnt-test-maker-w2y-pc
1565b9e3b06d9730ff40a7950ff3eda2caaf8d7a wt-finish-a2-exhaust
e16e2fc460e6c19fe85af62cdc0d98fc1ba4fa5c wt-verify-assay-recall
```

### cursor-shim (28)

```
7f874d9f693e23ebaebf4d522460c3e8bb0982ec lever-1-herdr-kind
f4a90688d66b9c4b85f9682b5e61af5b1acf5e56 lever-3-proem-cache
33ebaa926a86d308e84313ec5aed8cee6eca409e lever-5-mode-json
cd9ad2fecac2af92c623098d3355409ed268bb5b lever-6-statem-reap
482dfa12c8cd3af683ee2923874e7e0e298f1194 lever-7-fanout
6e41889f1724e1f252761bfb2bc5af284ff4d075 main
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p19
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p1b
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p1d
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p1n
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p1t
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p1x
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p2e
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-coder-w29-p2p
6c85350f0bd9acf185192c5555378b48603baead wt-agnt-coder-w2m-pa
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-p12
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-p19
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-p1a
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-p62
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-pg
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-ph
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-pk
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-pn
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-pr
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-pv
6e41889f1724e1f252761bfb2bc5af284ff4d075 wt-agnt-coder-w31-py
d988eff97ee2419a1d14877b5d4fdf8fc8ff4425 wt-agnt-test-maker-w29-p1a
6c85350f0bd9acf185192c5555378b48603baead wt-agnt-test-maker-w2m-pb
```

### herdr-spine (27)

```
077044b6f770289b5e50f5d020ed2bc738492e32 chore/spine-twin-server-sync
e5db9210e04c76c0696a5f6bfb5ebd2d4582fb95 feat/parity-verify-gate-unify
25c1ef0fe1a1783cfed2bdb35fbaac209baa4053 fix/spine-board-flock
e2a1222af5f346114361713636548035b47db940 spine/u2ev-9964-pi
e2a1222af5f346114361713636548035b47db940 spine/u2ev-9964-pi-test
e2a1222af5f346114361713636548035b47db940 spine/u2ev-9985-claude
e2a1222af5f346114361713636548035b47db940 spine/u2ev-9985-claude-test
1872986a610a653c479f4869079f3c11eb69b442 spine/w0-install-reconcile
b42132e463e17a62942625fda0835ab5c11e9ad1 tower/w0-install-reconcile
777857555c51f76536dedd9fb9986d24282c617d wt-agnt-coder-w2c-p6
63e1010098fc157d8752e7a85dcdc4daffd52a1e wt-agnt-coder-w2g-p5
63e1010098fc157d8752e7a85dcdc4daffd52a1e wt-agnt-coder-w2g-p6
872cf68a8d274405974c0d777acdf504d36b038b wt-agnt-coder-w2g-pe
63e1010098fc157d8752e7a85dcdc4daffd52a1e wt-agnt-coder-w2h-p4
248a35ecd80db83fe26ac2f6b2f9c1c0884628be wt-agnt-coder-w2h-pg
4838882f7ff8881fd8476e5af39e2ec7302e46c3 wt-agnt-coder-w2k-p4
4838882f7ff8881fd8476e5af39e2ec7302e46c3 wt-agnt-coder-w2k-p6
b42132e463e17a62942625fda0835ab5c11e9ad1 wt-agnt-coder-w2y-p11
077044b6f770289b5e50f5d020ed2bc738492e32 wt-agnt-coder-w2y-p1q
777857555c51f76536dedd9fb9986d24282c617d wt-agnt-test-maker-w2c-p7
63e1010098fc157d8752e7a85dcdc4daffd52a1e wt-agnt-test-maker-w2g-p7
872cf68a8d274405974c0d777acdf504d36b038b wt-agnt-test-maker-w2g-pf
63e1010098fc157d8752e7a85dcdc4daffd52a1e wt-agnt-test-maker-w2h-p5
4838882f7ff8881fd8476e5af39e2ec7302e46c3 wt-agnt-test-maker-w2k-p5
4838882f7ff8881fd8476e5af39e2ec7302e46c3 wt-agnt-test-maker-w2k-p7
b42132e463e17a62942625fda0835ab5c11e9ad1 wt-agnt-test-maker-w2y-p12
02fcc9f1fee96f5136a0290b94b0f2dc167c9bf0 wt-agnt-test-maker-w2y-p1r
```
