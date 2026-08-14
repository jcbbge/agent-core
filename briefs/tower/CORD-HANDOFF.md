# CORD [Tower] — HANDOFF for a successor with NO context, possibly a different harness

Written 2026-08-13 ~05:45Z by `cord-tower` (pane `w2W:p1`, workspace `w2W`, cwd `~/.tower`)
under a harness handoff. Assume the author is gone. Everything here is verified against
artifacts unless explicitly marked as unverified.

**Read these three files before acting, in this order:**
1. `~/agent-core/briefs/tower-fully-operational.md` — the original mission (W0–W5). **Its
   W0 section is partly WRONG; see §4 below before trusting it.**
2. `~/agent-core/primitives/mcps/tower/DEPLOYMENT.md` — the deployment ruling now in force.
3. This file.

---

## 1. Mission and where it stands

Make the Tower message bus fully operational — proven by exercise, not by reading code.
Work items W0–W5. **Only W0 has been worked. W1–W5 are untouched.**

- **W0 (version control): substantially COMPLETE, not closed.** See §2, §3.
- **W1 (board corruption): NOT STARTED**, but the root cause is already solved on paper —
  see §5. This changes W1's scope materially; do not brief it from the original.
- **W2 (consumers survive bad rows): NOT STARTED.** Has new evidence — see §5.
- **W3 (prove every plane): NOT STARTED.** Has inherited items — see §6.
- **W4 (retention/rotation): NOT STARTED.**
- **W5 (remodel debris): NOT STARTED.** The 9 backups are preserved in git (`attic/`), so
  the originals in `~/.tower/` are now safe to rule on. Deleting them is an
  OPERATOR decision, not yours.

## 2. Repos, branches, worktrees

- **agent-core**: `~/agent-core`, branch `tower/w0-version-control`, HEAD == `main` == `07089d3`.
  Remote `origin` = `git@github.com:jcbbge/agent-core.git`.
- **herdr-spine**: `~/herdr-spine`, branch `tower/w0-install-reconcile`, HEAD `b42132e`.
  `main` is behind at `1872986` — **the install.sh fix is NOT on spine's main.**
- No git worktrees are in use by this lane. Workers used `~/.spine/worktrees/...` in the
  Arc project only — unrelated.

Commit line on the W0 branch (oldest → newest):
`5e281be` stage code set → `9ff8778` README/.gitignore → `b584ef2` cutover + rollback →
`8e54604` cli.mjs BOARD fix + recover 7 rows → `07089d3` merge canonical-source lane.

## 3. THE ARCHITECTURE NOW IN FORCE (this is the thing to not break)

- **Canonical code home:** `~/agent-core/primitives/mcps/tower/` (git-tracked).
- **State home:** `~/.tower/` — unchanged, and it must stay that way.
- **Deployed paths are SYMLINKS** from `~/.tower/` into the canonical home. **16 of 19 are
  symlinked.** The 3 that are still REAL FILES: `cli.mjs`, `hooks/ask-bridge.mjs`,
  `hooks/stop-verdict.mjs`.
- **Why state survives a code move:** `~/agent-core/primitives/hooks/tower-ledger.mjs:22-28`
  anchors everything to `join(homedir(), '.tower')`. Code location cannot move state.
- **THE SYMLINKS POINT AT THE WORKING TREE.** Therefore **any branch operation in
  `~/agent-core` mutates live bus code.** Before any checkout/merge there, fingerprint
  `~/.tower/server.mjs`, `lib.mjs`, `hooks/*` with sha256 and confirm they are unchanged
  after. I did this for `07089d3` and they were byte-identical.
- `main` is kept at or ahead of the deployed content **specifically** so that a
  `git checkout main` cannot dangle the symlinks and take the bus down fleet-wide.
  **Keep that invariant.** Advance main with `git branch -f main <tip>` (NOT checkout+merge)
  when workers are live in the tree.

**Drift check:** `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` — read-only, ~17ms,
exit 0 = no drift, exit 1 = at least one FAIL. **This is the acceptance instrument for W0.**

## 4. CORRECTIONS TO THE ORIGINAL BRIEF — a successor WILL get these wrong otherwise

The mission brief `tower-fully-operational.md` contains these errors. They were verified
wrong by me or by workers:

1. **"There is no Tower source in agent-core" — FALSE.** `primitives/hooks/tower-ledger.mjs`
   (403 lines) was already git-tracked and IS Tower's real storage layer;
   `~/.tower/lib.mjs` was always a 61-line shim re-exporting it. `primitives/mcps/tower/`
   also already existed with a README. This is why "canonical in agent-core" was chosen —
   it completes Tower's own half-finished pattern, it does not impose a new one.
2. **"four `.bak-*` files" — WRONG, there are NINE** (8 in `~/.tower/`, 1 in `~/.tower/hooks/`).
   All 9 are preserved in git under `primitives/mcps/tower/attic/` with a DIFF-SUMMARY.md.
3. **"10 hook registrations in settings.json" — WRONG, there are 15**: lines 34, 46, 56, 84,
   116, 128, 158, 180, 215, 226, 286, 313, 318, 329, 340.
4. **"all 6 relative-importing hooks" — WRONG, there are 5**: prompt-inject, session-start,
   odometer-stop, odometer, stop-guard. There is no 6th.
5. **Mode 4 of the board corruption is NOT "concurrent writers / missing newline"** — see §5.
6. **A constraint the brief never carried:** `hooks/ask-bridge.mjs:152` resolves lib via a
   RUNTIME homedir-anchored dynamic import. `~/.tower/lib.mjs` must remain a resolvable
   path regardless of the relative import graph.
7. **A third constraint, discovered the hard way:** under a symlink mechanism, ANY
   code-relative resolution (`import.meta.url`, `__dirname`, `./relative`) silently
   retargets into the repo. I audited the whole canonical set: the only remaining hits are
   in TEST files self-referencing the code under test. **No production state path is
   code-relative.** That audit is what keeps DEPLOYMENT.md's ruling valid — it names
   exactly this as its overturn trigger.

## 5. W1/W2 — findings that change their scope (do not brief from the original)

**The 26 malformed rows in `board.jsonl` break down as:**
- L1, L2, L3 — non-JSON debris (tool output redirected into the log).
- L553, L2527 — unescaped content breaking the object mid-`body`.
- L2113 — invalid backslash escape.
- 20 rows (L2502–L2577) — **the record separator was written as the LITERAL CHARACTER `n`
  instead of a newline** (`…}n{"id": "spine-…`). NOT concurrency. Splitting on that
  boundary recovers **41 valid records from those 20 lines** — 21 board records are
  currently INVISIBLE but NOT LOST.

**The leak is ALREADY CLOSED — do not spend an agent re-closing it.** All 26 bad rows fall
inside one window, 2026-08-10T05:18:22Z → 09:04:08Z. The next row (09:08:52.779Z) is clean
and everything since is clean. The timestamp FORMAT changes at that exact boundary
(second-precision → millisecond), i.e. a different writer. The current writer
`~/herdr-spine/bin/handlers/_spine_common.py:board_append()` is correct
(`json.dumps(entry) + "\n"`). The board grew from 5,986 to 6,000+ lines during this session
with zero new corruption.

**What W1 genuinely still needs:** (a) recover the 21 invisible records; (b) quarantine the
6 debris/escape rows; (c) the documented hand-built `echo >> board.jsonl` fallback in the
global agent context and `brief/SKILL.md` is still taught and still has no chokepoint —
that is the open hole; (d) a **body-level sanitizer**, not just JSON escaping — see below.

**A FIFTH corruption mode that JSON-parse checks CANNOT catch.** Board row L6005 is valid
JSON but its `body` contains literal tool-call markup (`</body>`, `<invoke name="Bash">`,
`<parameter …>`) because an agent batched a `board_post` with an adjacent tool call in one
turn and the next call was swallowed into the message body. Two consequences: parse-based
integrity checks pass it; and agents reading the board ingest text shaped like tool-call
markup, which is a prompt-injection surface. **Mitigation in force: post board mail as a
STANDALONE tool call with short bodies; put long evidence in files and reference the path.**

**W2's strongest evidence, and it is not theoretical:** during this session a real board
message was lost **silently** — no error, no exception, no integrity signal anywhere. 7
coordination rows went to the wrong file (§6). W2 must make every reader **COUNT and
SURFACE** bad/missing rows, not merely tolerate them.

## 6. The `cli.mjs post` incident — read this before touching the deploy mechanism

`cli.mjs:159` wrote the board via `new URL('./board.jsonl', import.meta.url)` — resolved
relative to the CODE FILE, unlike every read path which is homedir-anchored. It was only
ever accidentally correct because `~/.tower/cli.mjs` sat beside `board.jsonl`. When it was
symlinked, that resolved into the repo and `bun ~/.tower/cli.mjs post` silently wrote
coordination messages into `~/agent-core/primitives/mcps/tower/board.jsonl`.

- **Cost: 7 real rows**, including one ORCH's entire claim+findings trail and a hold
  request that consequently arrived too late to stop a hook swap.
- **FIXED** at the canonical file in `8e54604`: `appendFileSync(BOARD, ...)`.
- **All 7 rows were recovered** onto the live board, each present exactly once (dedupe-by-id
  held). Strays were **quarantined, not deleted**, at
  `briefs/tower/w0-swap-evidence/quarantine/QUARANTINED-{board,ledger}.jsonl`.
- **STILL TRUE AT HANDOFF: the DEPLOYED `~/.tower/cli.mjs` is the PRE-FIX copy** (a real
  file, so it happens to work). The drift check FAILs on exactly this. See §8 item 1.

## 7. The contested deploy seam — CLOSED, and it had already fired

`~/herdr-spine/install.sh`'s `install_tower_auto()` was a SECOND deploy mechanism with its
own source (`~/herdr-spine/cc-hooks/`, 3 files: server.mjs, ask-bridge.mjs, stop-verdict.mjs).
`cp` follows symlinks, so it would have silently rewritten canonical content while leaving
the symlink intact.

**This was not hypothetical — it had already happened.** On 2026-08-12T22:14:23Z it
overwrote a 158-byte canonical-pointer shim, silently reverting agent-core commit `3deb7e7`.
Nobody noticed for a day. I corroborated both the backup file and the commit.

**Fixed in herdr-spine `b42132e`:** canonical-preferred, `cc-hooks/` demoted to a
fresh-machine bootstrap fallback, and a symlinked deploy target is skipped rather than
written through. Proof: `briefs/tower/w0-canonical-source-evidence/E1-install-sh-clobber-proof.md`.

**⚠ `b42132e` is on branch `tower/w0-install-reconcile`, NOT on spine's `main` (1872986).**
A `git checkout main` in `~/herdr-spine` restores the clobbering version. **Landing it is
an open item.**

## 8. NEXT CONCRETE ACTIONS, in order, imperative

1. **Complete the final 3 deployed paths.** Symlink `~/.tower/cli.mjs`,
   `hooks/ask-bridge.mjs`, `hooks/stop-verdict.mjs` into the canonical home using atomic
   `ln + mv` (**never `rm` then `ln`**). Both hold reasons are retired: the post fix landed
   (`8e54604`) and install.sh is symlink-safe (`b42132e`). **Ordering rule I ruled and that
   still binds: the cli.mjs fix must be in the canonical file BEFORE cli.mjs is symlinked.**
   It is. After each swap verify: `claude mcp list` shows tower Connected, and
   `bun ~/.tower/cli.mjs status` exits 0.
2. **Fix the drift check's own false positive.** It reports
   `FAIL drift-check.mjs: missing at /Users/jrg/.tower/drift-check.mjs`, but that is a
   repo-only tool with no deployed twin — the same category it correctly WARNs on for
   `DEPLOYMENT.md` and `README.md`. Classify repo-only files explicitly. **A check that
   cries wolf gets ignored, which is the exact failure it exists to prevent.**
   ⚠ `primitives/mcps/tower/drift-check.mjs` was UNCOMMITTED and mid-edit by
   `orch-w0-canonical-source` at handoff — inspect it before assuming its state.
3. **Target state / acceptance signal for W0:**
   `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` exits 0 with **ZERO FAIL**.
4. **Exercise `hooks/ask-bridge.mjs`'s runtime homedir-anchored dynamic import LIVE.** This
   gap has been open since wave 1 and has never been closed — every check so far was
   build-time resolution only. If it truly cannot be exercised safely, record it as a named
   gap rather than quietly build-resolving it again.
5. **Land `b42132e` onto herdr-spine `main`** (§7) — otherwise a branch switch reinstates
   the clobber.
6. **Reap the finished panes** in workspace `w2W` and close their tabs.
7. Then, and only then, brief W1 — using §5, not the original brief.

## 9. Rulings I am holding that are written nowhere else

- **agent-core is canonical for Tower's code; `cc-hooks/` is a bootstrap fallback only.**
  Rationale: agent-core holds all 19 files plus attic, tests and docs; cc-hooks held 3 and
  existed incidentally from the 2026-07-28 tower-auto fold.
- **Deleting anything from `~/herdr-spine/cc-hooks/` or from `attic/` is reserved to the
  OPERATOR as a ruled proposal. Do not execute it.**
- **The final-3 swap decision was deliberately withheld from convenience** and made to wait
  on the DEPLOYMENT.md ruling. That ruling has now landed and permits it (§8 item 1).
- **Pre-existing test failures must stay unfixed and NAMED, not hidden:** `cli.test.mjs`
  25 pass / 1 fail (the "backup all times out" hang test — note it references
  `cli.mjs.bak-…` as a sibling, which now lives in `attic/`); `server-drift.test.mjs`
  8 pass/3 fail BEFORE the move vs 7 pass/4 fail AFTER. **Exactly one assert regressed
  BECAUSE of the move:** `server.mjs.bak-20260812 exists`, because
  `server-drift.test.mjs:19` does `join(import.meta.dir, …)` and expects that backup as a
  SIBLING; it now lives in `attic/`. Also reported but unverified by me: `server-drift`'s
  install.sh assertion does not yet accept b42132e's new symlink-skip message.
- **The "worker is done" signal is UNRELIABLE.** An ORCH that goes idle while its workers
  are still running reports `agent_status: done`. This misfired repeatedly this session and
  both ORCHs independently hit it too. **Gate on artifacts — board rows, `.done` markers,
  git objects, the drift check — never on the done flip.** Carried as a W3 item.
- **A ruling can lose a race with a pane going idle.** One ruling landed ~40s after its ORCH
  went idle and was never seen. If a ruling matters, verify the pane consumed it.
- **Delivery law:** a send without observed evidence is a non-send. `spine-spawn prompt`
  verifies by status flip; if the pane is already `working` the flip cannot be observed and
  you must inspect with `herdr pane read <pane>` — a queued message IS delivered.
- **Never batch a `board_post` with another tool call in the same turn** (§5, fifth mode).

## 10. Safety net

- Full pre-work backup: **`~/.tower-backups/pre-cord-20260813T044255Z/`** (7.0 M) — code,
  state, hooks, a tarball of flight/deliverables/cursors/briefs, and `CHECKSUMS.txt`.
- **Integrity invariant maintained all session and worth re-checking after any change:**
  that backup's `board.jsonl` and `ledger.jsonl` are still an EXACT BYTE PREFIX of the live
  files. Verify with:
  `head -c $(wc -c < BACKUP/board.jsonl) ~/.tower/board.jsonl | shasum -a256`
  compared to `shasum -a256 BACKUP/board.jsonl`. It held through every change including a
  recovery that appended. **If it ever fails, history was rewritten — stop and escalate.**
- Revert recipes: agent-core `git branch -f main 949238d`; the pre-W0 tower code is in the
  backup above and in `attic/`.
- **No state file was ever mutated by the CORD.** All state changes were append-only.

---

## 11. STATUS AT FINAL HANDOFF (05:55Z — supersedes §8 items 1–3 above)

Both ORCHs are `done`; only the CORD pane remains. Verified by me at handoff:

- **THE CUTOVER IS COMPLETE — 19 of 19.** `~/.tower/cli.mjs`, `hooks/ask-bridge.mjs` and
  `hooks/stop-verdict.mjs` are now symlinks. §8 item 1 is **DONE**; §3's "16 of 19" is
  superseded.
- **Bus healthy after the full cutover:** MCP `tower … ✔ Connected`;
  `bun ~/.tower/cli.mjs status` exit 0; `board.jsonl` still append-only against the
  04:42:55Z backup prefix.
- **The real drift is GONE.** The `cli.mjs` deployed-vs-canonical FAIL has cleared —
  the check now reports **22 files, 22 ok**.
- **ONE FAIL REMAINS, AND IT IS THE KNOWN FALSE POSITIVE** (§8 item 2, unfixed):
  `FAIL drift-check.mjs: missing at /Users/jrg/.tower/drift-check.mjs (ENOENT)`.
  True exit code is **1**. Beware: `bun drift-check.mjs | tail` reports the exit of `tail`,
  not the check — redirect to a file and read `$?`, or you will misread this as passing.

**Therefore the ONLY thing standing between here and W0's acceptance signal is fixing that
one false positive.** Classify repo-only files (`drift-check.mjs`, `DEPLOYMENT.md`,
`README.md`) explicitly so they can never be a FAIL, then re-run to confirm exit 0.
Everything else in §8 (items 4–7) still stands.

- `orch-w0-canonical-source` independently found and committed the unpushable finding as
  `cf8a887`. Commit line now: … `07aebc0` (this handoff) → `cf8a887`.
- **Still uncommitted at handoff:** `primitives/mcps/tower/drift-check.mjs` may carry
  in-progress edits. Check `git status` before trusting it.
