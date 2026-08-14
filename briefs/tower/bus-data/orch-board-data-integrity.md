# ORCH [board-data-integrity] — repair board data, prove/fix the write path

You are the **Orchestrator** for one unit of work on the live Tower board. Run one
Made Well inner cycle: Imagine → Plan → Make → Verify. Decompose into AGNT/SAGT
workers via `cursor-fleet` only. You never skip the CORD; escalate questions to
`CORD bus-data` on board topic `tower/bus-data` (nQ≤3). Do NOT use emojis anywhere.

Fence: workspace `w2Z` (bus-data). Sibling fleets (Arc `w2X`, Tower `w2Y`) are
posting to `~/.tower/board.jsonl` right now. Treat every write like repairing a
car while driving.

## Pre-Verified Facts (CORD verified 2026-08-13 this session)

- Seat: `CORD bus-data` on pane `w2Z:p1`, cwd `/Users/jrg/agent-core`. Board topic: `tower/bus-data`.
- Live board: `~/.tower/board.jsonl` — **6441** lines at re-verify; **26** fail `JSON.parse`; **6415** parse OK.
- Unparseable line numbers (exact, unchanged from concierge brief): **1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577.** Last bad = 2577; **zero** bad lines after that.
- Failure-mode samples: L1/L2 non-JSON tool text; L3 truncated mid-object; L553 unescaped body (id=`t-find-1785206344-w1`, from=`worker-1`, topic=`tower-auto`); L2113 invalid escape (id=`ws1-done-1786216197`, from=`ws1`); L2502 concatenated objects (id=`c003-test-runner-claim`, from=`c003-test-runner`).
- No-`from` rows: **501** total — `kind=lineage`×364, `kind=verify-gate-bypass`×91, authored defects `note`×34 / `finding`×7 / `claim`×3 / `done`×2. Earliest authorless authored row `2026-08-10T23:31:51.611Z`; latest still today.
- Canonical Tower code: `/Users/jrg/agent-core/primitives/mcps/tower/` (also hooks ledger at `/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs`).
- Deployed executables are **symlinks** into that canonical home:
  - `~/.tower/server.mjs` → `.../primitives/mcps/tower/server.mjs`
  - `~/.tower/cli.mjs` → `.../primitives/mcps/tower/cli.mjs`
  - `~/.tower/lib.mjs` → `.../primitives/mcps/tower/lib.mjs`
  - `~/.tower/COMMS-ARCH.md` → `.../primitives/mcps/tower/COMMS-ARCH.md`
  Divergence repo-vs-deploy for those paths is currently **none** (symlink identity).
- Write primitives measured:
  - `append` at `tower-ledger.mjs:76` = `appendFileSync(file, JSON.stringify(obj) + '\n')` — serializer yes, newline yes, **no lock**, **no schema rejection**.
  - `server.mjs` `board_post` (≈L245): `from: args.from` is optional — authorless claim/finding/note still writable via MCP.
  - `cli.mjs` post (≈L150-163): `JSON.stringify` + defaults `from` to `cli:$USER`.
  - `cursor-shim/cursor-spine` appends `kind=lineage` and `kind=verify-gate-bypass` via shell `printf` into `~/.tower/board.jsonl` (L177 lineage; ≈L403 bypass).
- Doc hole still shipped: `~/agent-core/primitives/skills/brief/SKILL.md` lines 54–58 instruct harnesses without MCP to **hand-append a JSON line** to `~/.tower/board.jsonl`. `COMMS-ARCH.md` L177–182 calls this a known hole "written down, not closed".
- Prior recovery precedent (append-only, not rewrite): commit `8e54604` recovered 7 orphaned rows by append after backup; left the 26 unparseable rows untouched on purpose.
- Agent-core git branch at CORD wake: `tower/w0-version-control`. Dirty tree has many unrelated untracked briefs — **ignore** them; do not investigate, revert, or fix. Touch only your partition.
- Spawn path: `cursor-fleet orch|make|worker` only. Relabel every pane after spawn (`herdr pane rename` + `report-metadata --display-agent --token name=`). Defaults: grok ORCH, composer workers.

## Parallel Work Notice

- `CORD tower` on `w2Y` owns Tower plane-by-plane functional proof, retention/rotation, remodel debris — **stay off** that lane. If you find something in their scope, post to `tower/bus-data` and move on.
- Arc fleet on `w2X` and other agents append to the same `board.jsonl` continuously.
- Ignore uncommitted changes to `primitives/profiles/models.json` and unrelated briefs under `briefs/` except your own `briefs/tower/bus-data/**`.

## Tower

- Post claims/findings/notes to topic **`tower/bus-data`**, `from` = your role name (e.g. `ORCH board-data-integrity`).
- Cursor MCP: `board_post` / `board_read` / `send_to_user` as appropriate. Shell fallback: `bun ~/.tower/cli.mjs post <type> tower/bus-data "..." --from <name>` from a real repo cwd.
- Status is not mail. Idle after DONE is correct.
- Do **not** `echo` hand-built JSON into `board.jsonl`.

## CORD rulings (binding — do not re-decide)

1. **Live-board rewrite is gated.** You may (and must) **backup**, **quarantine raw bytes**, and **append** well-formed recovery/attribution rows. You must **not** compact, truncate, delete, or in-place rewrite `~/.tower/board.jsonl` until CORD routes a ruled proposal to the concierge and you receive an explicit yes on the board. Prefer interruption-safe: every step leaves the board appendable by concurrent writers; prove that property before any mutating step beyond append.
2. **Schema (Obj4):** two row kinds. Authored mail (`type` + required `from`) vs machine emissions (`kind` + `via`). Document it. Fix readers that assume `from` always exists. Do not invent authors for lineage/bypass.
3. **Absence of recent corruption is not proof of a fixed writer.** Prove code+docs, then exercise the unsafe path if it still exists.
4. Branch first; small PRs; explicit staging; workers never commit — you integrate only after Verify, and CORD gates Land. Prefer `cursor-fleet make` for any code change unit so the Verify beat bifurcation is enforced.

## Tasks

### T1 — Backup + inventory (before any mutation)
- done when: byte-identical backup of `~/.tower/board.jsonl` exists under `briefs/tower/bus-data/backups/` (or `/var`-safe path if credential-guard blocks commit of the backup — then keep backup on disk, do not git-add it); sha256 of source and backup match; inventory JSON lists the 26 bad lines with extracted recoverable fields and the 46 authorless authored rows with attribution candidates.

### T2 — Recover the 26 (append-only)
- done when: for each recoverable bad line, a new well-formed board row (or rows, if concatenated) has been **appended** carrying: reconstructed payload, `from`/`topic`/`id` when read (not guessed), and provenance fields stating original line number, damage class, inferred-vs-read. Genuinely unrecoverable raw bytes live in a quarantine file under `briefs/tower/bus-data/quarantine/` (nothing deleted from the live board). Parse check: bad-line count on the live file may still be 26 (you did not rewrite); new rows all parse.

### T3 — Attribute the 46 authorless authored rows (append-only)
- done when: each of the 46 has either (a) an appended attribution note linking row id → recovered author with evidence (body/cwd/adjacent same-topic), or (b) an explicit `unattributed` marker with why. No fabricated authors. Do not rewrite the original rows in place under this task.

### T4 — Compaction proposal (artifact only)
- done when: a written proposal at `briefs/tower/bus-data/COMPACTION-PROPOSAL.md` specifies either lock+rewrite or new-file+atomic-swap, proves interrupt-safety, lists exact commands, and states rollback. Posted as a finding on `tower/bus-data` addressed to CORD. **Do not execute.**

### T5 — Prove or patch the write path
- done when: written proof at `briefs/tower/bus-data/WRITE-PATH-PROOF.md` covering: serializer, newline-terminated append, locking (or explicit residual risk), rejection of malformed records, repo↔deploy identity, and whether `brief/SKILL.md` still teaches hand-append.
- If any required guarantee is missing, patch it (branch + `cursor-fleet make`): at minimum (a) `board_post` requires non-empty `from` for authored types; (b) replace brief/SKILL.md hand-append instruction with `bun ~/.tower/cli.mjs post ...`; (c) document machine vs authored row kinds per CORD ruling; (d) any additional hardening you prove necessary (lock / validate) without taking the server down without a stated window. Deploy path is already symlink — landing in canonical home deploys.
- Prove after: round-trip post lands on `~/.tower/board.jsonl`; omitting `from` via MCP is rejected; hand-append instruction gone from brief skill (and any other live doc you find teaching it).

### T6 — Reader tolerance
- done when: sanctioned readers (`boardFor` / `board_read` / `twr` as used) do not throw on machine rows lacking `from`; regression test or explicit checklist evidence recorded in WRITE-PATH-PROOF.md.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/**`, `primitives/mcps/tower/**` (docs+server/cli as needed), `primitives/hooks/tower-ledger.mjs` (if append hardening), `primitives/skills/brief/SKILL.md` (kill hand-append), and optionally `cursor-shim/cursor-spine` **only** if you must harden the printf JSON writers for lineage/bypass (coordinate — that repo is outside agent-core; prefer minimal / propose if risky).
- Do not commit board backups that may contain credentials (see `8e54604` security note).
- No mocks. Do not take locks you do not release. Do not leave `board.jsonl` half-rewritten.
- Testing: exercise real append paths; prefer existing tower tests under `primitives/mcps/tower/*.test.mjs` where applicable.

## Report back with

Per objective (1 data / 2 verify patch / 3 patch if needed / 4 schema doc):
- what changed (paths + commits/PRs)
- what you **proved and how** (commands + outputs)
- what could not be recovered and why
- path to COMPACTION-PROPOSAL.md and whether you are blocked waiting on concierge yes
- `.done` marker at `briefs/tower/bus-data/orch-board-data-integrity.done`

SOURCES: live parse of board.jsonl (6441 lines); tower-ledger.mjs:76; server.mjs board_post; cli.mjs post; brief/SKILL.md:54-58; COMMS-ARCH.md:177-182; cursor-spine lineage/bypass printf; symlink ls of ~/.tower; CORD board posts on tower/bus-data this session.
