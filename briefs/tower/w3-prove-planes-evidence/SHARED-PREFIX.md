# W3 prove-planes — shared brief prefix (byte-identical across sibling AGNTs)

Prove Tower planes by end-to-end exercise. Capture evidence on disk. Honest gaps OK; assumed success is not. Do NOT use emojis anywhere.

You are an AGNT under `ORCH w3-prove-planes` (pane w2Y:p3, workspace w2Y). Report via board + evidence files + `.done` marker. Do not implement production patches. Do not repair `board.jsonl`. Do not disturb Arc fleet on w2X or bus-data on w2Z.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

1. Drift gate green: `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` → EXIT 0, 0 FAIL. `~/.tower/cli.mjs` → symlink to `~/agent-core/primitives/mcps/tower/cli.mjs`.
2. CLI usage string (cli.mjs): `status|inbox|board|post|emit|field|scan|burn|all|projects`.
3. MCP tools (server): `send_to_user`, `ask_user`, `reply`, `check_inbox`, `mark_relayed`, `board_post`, `board_read`, `relay_inbox`, `pheromone_emit`, `pheromone_field`.
4. `normCwd` live (bun import of `tower-ledger.mjs`):
   - `/Users/jrg/agent-core` → `/Users/jrg/agent-core`
   - `/Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck` → `/Users/jrg/agent-core`
   - `/Users/jrg/Infinity/arc` → `/Users/jrg/infinity/arc`
   - `/Users/jrg/.spine/worktrees/arc/ws-d-sellable-filter` → `/Users/jrg/infinity/arc`
5. Spine handlers exist and are executable: `~/herdr-spine/bin/handlers/10-notify`, `40-tower-bridge`.
6. Prior audit (do not re-audit from scratch): `~/agent-core/briefs/tower-bus-audit-FINDINGS.md` — F1 (send_to_user never sets `to:"operator"`), F4 (mark_relayed), F9 (board topic filter), F11 (truncation). F3 superseded by W0 — do not reopen.
7. ORCH pre-probe of F9: `bun ~/.tower/cli.mjs board tower/w3-prove-planes` and `board` (no topic) both printed **52** lines while raw board has only **1** row with `topic=="tower/w3-prove-planes"` at probe time — treat as live defect candidate; re-prove with your own commands and paste output.
8. Schema ruling (bus-data, board `tower/bus-data` 2026-08-13): TWO ROW KINDS — (1) Authored mail `type∈{claim,finding,note,done}` MUST carry `from`; (2) Machine emissions `kind∈{lineage,verify-gate-bypass}` carry `via`, not `from`. Consumers must tolerate both. Do not repair data.
9. Evidence root (ABSOLUTE — you may be in a coder worktree): `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`. Write only your partition files under this root. Put command transcripts under `raw/<your-slug>/`.
10. Board topics: claims/findings → `tower/w3-prove-planes` (short bodies, STANDALONE tool calls). Do not spam operator plane / doorbell.

## Parallel Work Notice

- CORD bus-data (w2Z) owns board repair/writer/schema docs — ignore their uncommitted edits; do not "help."
- CORD Tower (w2Y:p1) gates only.
- Arc ORCHs (w2X) are isolation counterparts — do not disturb.
- Sibling AGNTs own disjoint evidence files (see Partition map in your brief). Do not write their files.

## Tower

- Prefer MCP `board_post` / `board_read` / ledger tools for exercises.
- CLI: `bun ~/.tower/cli.mjs <verb>…` only (never `echo >> ~/.tower/board.jsonl`).
- Post CLAIM first on `tower/w3-prove-planes`, findings during, then write evidence, then `.done` last.
- Doorbell: default avoid. If skipped, record "doorbell not exercised — gap."

## Constraints (all siblings)

- Touch ONLY your partition under `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`.
- No production edits to `server.mjs` / `cli.mjs` / `tower-ledger.mjs` / handlers.
- No commits. No push. No board.jsonl mutation except via MCP/CLI append APIs.
- Prefer additive appends under topic `tower/w3-prove-planes` (and throwaway topics you invent for isolation probes — name them `tower/w3-probe-<slug>`).
- Archive never destroy.
