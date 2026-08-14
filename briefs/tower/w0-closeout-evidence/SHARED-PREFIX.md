# W0 closeout worker — shared prefix (byte-identical across sibling briefs)

Do NOT use emojis anywhere. You are an AGNT under `ORCH [w0-closeout]`
(pane `w2Y:p2`, registration `orch-orchestrator-w2y-p2`). Report to the
Tower board; do not address the operator. Workers never commit — leave
git staging/commits to ORCH.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

1. Architecture: canonical `~/agent-core/primitives/mcps/tower/`; state
   `~/.tower/`; deployed paths are symlinks. Do NOT re-symlink.
2. Cutover 19/19 complete. Live: `~/.tower/cli.mjs`, `lib.mjs`,
   `hooks/ask-bridge.mjs` are symlinks into canonical. Bus up:
   `bun ~/.tower/cli.mjs status` exit 0.
3. Board integrity: backup
   `~/.tower-backups/pre-cord-20260813T044255Z/board.jsonl` (3817580 bytes,
   sha prefix `3efb61db723d1e3c`) is still an exact byte prefix of live
   `~/.tower/board.jsonl`. If this breaks after any mutation: STOP, escalate.
4. Live drift-check (pre-fix): `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs`
   EXIT 1 — sole FAIL:
   `FAIL drift-check.mjs: missing at /Users/jrg/.tower/drift-check.mjs (ENOENT)`.
   WARNs for missing DEPLOYMENT.md / README.md are correct (repo-only).
5. Root cause (read, do not re-derive):
   `drift-check.mjs:93-95` — `severityFor` returns FAIL for every `.mjs`.
   `drift-check.mjs` is a repo-only tool with no deployed twin — same
   category as DEPLOYMENT.md / README.md — missing twin must be WARN/excluded,
   never FAIL.
6. agent-core main checkout: branch `tower/w0-version-control` @ `34011ee`.
   NEVER `git checkout` another branch in `~/agent-core` (symlinks point at
   the working tree). Fresh worktree for code edits:
   `/Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck`
   on branch `orch/w0-driftcheck-fix` @ `34011ee`.
7. herdr-spine: branch `tower/w0-install-reconcile` @ `b42132e`;
   `main` tip `1872986`; `git merge-base --is-ancestor b42132e main` exits 1
   (not landed). Do NOT push. Do NOT delete `cc-hooks/`.
8. Pre-existing test fails stay NAMED, not "fixed": `cli.test.mjs` 25p/1f hang;
   `server-drift.test.mjs` known fails.

## Parallel Work Notice

- CORD [Tower] on w2Y:p1 — gates only; no production edits.
- Sibling AGNTs (disjoint partitions — do not touch their files):
  - AGNT [drift-check-fix]: only
    `primitives/mcps/tower/drift-check.mjs` in the worktree above, plus
    evidence files `drift-check-*.txt` / `tooth-proof*.txt` under
    `briefs/tower/w0-closeout-evidence/`.
  - AGNT [ask-bridge-live]: only evidence under
    `briefs/tower/w0-closeout-evidence/` named `ask-bridge-*` or
    `ASK-BRIDGE-GAP.md`. No production edits.
  - AGNT [spine-land]: only `~/herdr-spine` merge of `b42132e` onto `main`.
- Ignore uncommitted noise elsewhere in agent-core. Do not investigate.

## Tower (mid-run communication)

- Board topic: `tower/w0-closeout` via MCP `board_post` / `board_read`
  (STANDALONE posts — never batch board_post with another tool call).
- CLI fallback: `bun ~/.tower/cli.mjs post …` (BOARD-anchored).
- Sidebar: `/Users/jrg/herdr-spine/bin/spine-report task|verdict`.
- Claim: `/Users/jrg/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`
  then heartbeat/release. Advisory only.
- Long evidence in files under `briefs/tower/w0-closeout-evidence/`; board
  bodies stay short and reference paths.
- Do NOT `echo >> ~/.tower/board.jsonl`.
- CLAIM first, findings during, `.done` last for your task marker.
