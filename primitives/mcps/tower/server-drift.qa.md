# Human QA — tower-server-drift

## report-back drift narrative

- **what changed:** `~/.tower/server.mjs` reconciled against canonical `~/agent-core/primitives/mcps/tower/server.mjs`; backup at `server.mjs.bak-20260812` (historical: pre-cutover compared against herdr-spine/cc-hooks — retired, do not call)
- **how to verify:** Read the implementer's report-back (Tower board topic `tower/server-drift` and/or session handoff). Confirm it names: (a) what the live sha carried beyond pre-fold base `63ec724d`, (b) when those edits landed, (c) how canonical was updated without losing live behavioral fixes.
- **what to expect:** A factual attribution — not "merged successfully" without specifics. Drift cause and merge strategy are explicit.
- **class:** human
- **[ ] pass / [ ] fail**
