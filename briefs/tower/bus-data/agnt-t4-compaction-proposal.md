# AGNT [compaction-proposal] — artifact only, do not execute

Repo `/Users/jrg/agent-core`. Write a compaction proposal for removing/quarantining the 26 unparseable lines from `~/.tower/board.jsonl` AFTER concierge yes. Do NOT execute compaction. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Live board is append-only JSONL under concurrent write (Arc w2X, Tower w2Y, bus-data w2Z).
- 26 bad lines at stable numbers (see INVENTORY.json); last bad=2577; zero bad after.
- CORD ruling: live-board rewrite is GATED — backup + quarantine + append OK; compact/truncate/delete/in-place rewrite forbidden until concierge yes on board.
- Prior recovery left bad lines in place on purpose (commit `8e54604`).
- Proposal path (exact): `/Users/jrg/agent-core/briefs/tower/bus-data/COMPACTION-PROPOSAL.md`
- Must specify either lock+rewrite OR new-file+atomic-swap; prove interrupt-safety; list exact commands; state rollback.
- Post finding to `tower/bus-data` addressed to CORD (body must say `to: CORD bus-data` and that execution is blocked pending concierge yes).

## Parallel Work Notice

- Do not touch quarantine, INVENTORY (read OK), RECOVERY-REPORT, ATTRIBUTION-REPORT, WRITE-PATH-PROOF, or live board except your one finding post via cli.mjs.
- Ignore unrelated dirty tree.

## Tower

- CLAIM optional; required FINDING when proposal lands, from=`AGNT compaction-proposal`, topic=`tower/bus-data`, body starts with `to: CORD bus-data`.
- No hand-append. spine-report task/verdict.

## Tasks

1. Read INVENTORY.json backup path + bad line list. — done when: cited in proposal.
2. Write COMPACTION-PROPOSAL.md covering:
   - recommended strategy (pick one primary; mention the alternative)
   - interrupt-safety proof (concurrent appenders mid-swap/rewrite — what happens; why board stays appendable or how writers pause)
   - exact command sequence (copy-pasteable)
   - verification after (parse counts, sha256)
   - rollback (how to restore from backup)
   - explicit **DO NOT EXECUTE** until concierge yes on `tower/bus-data`
   — done when: file exists with all sections.
3. Post finding to CORD. Write `briefs/tower/bus-data/agnt-t4-compaction-proposal.done`.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/COMPACTION-PROPOSAL.md`, `briefs/tower/bus-data/agnt-t4-compaction-proposal.done`, one cli.mjs board finding. Do not commit. Do not mutate board.jsonl structure.
- No mocks.

## Report back with

- COMPACTION-PROPOSAL.md path
- chosen strategy name
- board finding id
- confirmation you did not execute
