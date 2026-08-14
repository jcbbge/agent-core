# W3 prove-planes — ORCH final report (pass inspection)

**ORCH:** w3-prove-planes (w2Y:p3)  
**CORD:** Tower (w2Y:p1)  
**Inspected:** 2026-08-13 — worker claims verified against artifacts + live id spot-checks  
**nq used:** 0  

## Plane verdicts

| Plane | Verdict | Evidence | Named gaps |
|---|---|---|---|
| Board | PROVEN + GAP | `BOARD.md`, `raw/board/**` | F9: CLI `board <topic>` ignores topic (52/52 identical; ORCH recheck identical=true) |
| Ledger / Q&A | PROVEN | `LEDGER.md`, `raw/ledger/qa-loop-transcript.json` | Doorbell not exercised |
| Verbatim guarantee | UNBROKEN + GAP | `VERBATIM.md` | **F1 GAP:** deliverable without `to` never enters unrelayed (453/462); alert PROVEN; progress/board UNBROKEN |
| mark_relayed (F4) | GAP confirmed | `LEDGER.md` task 2 | Clears unrelayed without display proof |
| Deliverables | PROVEN | `AUX.md` + file `~/.tower/deliverables/t-msrktbyd-yezv-w3-aux-deliverable-probe.md` | — |
| Flight | PROVEN | `AUX.md` (hook path + recent SessionEnd files) | Live write not re-fired this probe |
| Odometer | UNBROKEN | `AUX.md` (`burn` EXIT 0) | No fresh append in probe window |
| Pheromones | PROVEN | `AUX.md`; ids `ph-msrktby6-if3n`, `ph-msrktc4o-lwwz`, `ph-msrkteq6-7ymi` in `pheromones.jsonl` | Cursor-worktree cwd blind spot on field/scan (surfaces) |
| MCP+CLI surfaces | PROVEN with fail/gap rows | `SURFACE.md` | 17 pass / 1 fail (F9) / 2 gap (mark_relayed validation; worktree normCwd); F11 truncation 100-char CLI confirmed |
| Spine bridge | PROVEN + GAP | `SPINE.md` | 10-notify board PROVEN; 40-tower-bridge Q/A PROVEN; done+$verdict→ledger deliverable live pair GAP; doorbell GAP |
| Tests locking proofs | DOCUMENTED ONLY | `TEST-PLAN.md` | No red tests landed — awaiting CORD authorize-fix / authorize-lock |

## ORCH verification (not worker word)

Spot-checked live:
- Board probe ids present (`t-msrkt17h-7j3n`, isolation CLI ids, worktree `cli-9b3c70b3…`)
- Ledger Q&A `t-msrkt6ci-siuh` / answer `t-msrkt9y6-yohi`; F1 deliverable `t-msrktfc5-p1ey`; alert `t-msrkthqq-7ecz`
- Deliverable file exists on disk
- F9 recheck: with-topic and without-topic CLI board outputs byte-identical (52 lines)
- Pheromone ids in `~/.tower/pheromones.jsonl`
- Spine board alert `spine-af38c43c…` present
- All four `workers/*.done` present; panes w2Y:p4–p7 reached `done`

## GO / NO-GO

**W3 unit (exercise + evidence):** GO — every required plane exercised; gaps named with paths.

**Call bus "fully operational" on the exercise axis:** **NO-GO** while these confirmed live defects stand:
1. **F1** — `send_to_user(deliverable)` does not set `to:"operator"` → silent loss vs tool-return promise (98% of live deliverables)
2. **F9** — CLI `board <topic>` ignores filter
3. **F4** — `mark_relayed` clears guard without proof of display

Data axis remains owned by bus-data (w2Z). Schema ruling (two row kinds) absorbed; consumers tolerate machine rows by cwd-less exclusion.

## Commands (ORCH gate)

```bash
bun ~/agent-core/primitives/mcps/tower/drift-check.mjs   # EXIT 0 (session start)
bun ~/.tower/cli.mjs board tower/w3-prove-planes         # F9 recheck
bun ~/.tower/cli.mjs board
# id spot-check script (session) against board.jsonl + ledger.jsonl + pheromones.jsonl
```

## Evidence root

`/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`

Workers reaped after this report lands.
