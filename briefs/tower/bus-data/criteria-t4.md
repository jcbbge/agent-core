# Test criteria — T4 compaction proposal (from plan only)

| Assert | Criterion |
|--------|-----------|
| proposal exists | briefs/tower/bus-data/COMPACTION-PROPOSAL.md present |
| strategy named | Primary is lock+rewrite OR new-file+atomic-swap |
| interrupt-safety | Section proves concurrent-writer safety |
| commands + rollback | Exact commands and rollback from backup |
| not executed | Proposal says DO NOT EXECUTE; board.jsonl line count not reduced by this unit |
| finding to CORD | Board finding on tower/bus-data mentions to: CORD bus-data |
| done marker | agnt-t4-compaction-proposal.done exists |
