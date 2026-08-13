# AGNT [attribute-46] — append-only attribution for authorless authored rows

Repo `/Users/jrg/agent-core`. For each of 46 authorless authored board rows (type claim|finding|note|done, missing/empty `from`), append an attribution note OR an explicit `unattributed` marker with evidence. Do NOT rewrite original rows. Do NOT invent authors. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Inventory input: `/Users/jrg/agent-core/briefs/tower/bus-data/INVENTORY.json` field `authorless_authored` — length must be 46. Each entry has line, id, type, topic, ts, cwd, body_preview, attribution_candidates.
- Machine rows (kind=lineage / kind=verify-gate-bypass) are OUT OF SCOPE — do not invent authors for them (CORD Obj4).
- CORD ruling: append-only; no fabricated authors; evidence from body/cwd/adjacent same-topic only.
- Post via `bun ~/.tower/cli.mjs post note|finding tower/bus-data "..." --from "AGNT attribute-46"` from `/Users/jrg/agent-core`.
- Attribution note body must include: `attr_of_id=<id>`, `attr_of_line=<n>`, either `recovered_author=<name> evidence=<...>` OR `unattributed reason=<...>`.

## Parallel Work Notice

- Sibling AGNT recover-26 owns quarantine/ and RECOVERY-REPORT.md — do not touch.
- Sibling AGNT compaction-proposal owns COMPACTION-PROPOSAL.md — do not touch.
- You own `briefs/tower/bus-data/ATTRIBUTION-REPORT.md` and appends of attribution notes only.
- Concurrent board writers live; append only.

## Tower

- CLAIM first from=`AGNT attribute-46` topic=`tower/bus-data`.
- Finding with counts: attributed / unattributed / skipped.
- No hand-append JSON. spine-report task/verdict.

## Tasks

1. Load INVENTORY.json authorless_authored (46). Abort to board if count≠46. — done when: loaded.
2. For each of 46: gather evidence (body self-identification, cwd, ±5 parseable neighbors same topic). If one author is evidenced (not guessed), append attribution note. Else append unattributed note with why. — done when: 46/46 notes appended; each parseable; none invent authors.
3. Write ATTRIBUTION-REPORT.md listing id → decision + evidence one-liner. Write `briefs/tower/bus-data/agnt-t3-attribute-46.done`.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/ATTRIBUTION-REPORT.md`, `briefs/tower/bus-data/agnt-t3-attribute-46.done`, append-only board via cli.mjs. Do not commit. Do not edit INVENTORY.json, quarantine, RECOVERY-REPORT, COMPACTION-PROPOSAL, WRITE-PATH-PROOF.
- No mocks. No in-place board edits.

## Report back with

- attributed count / unattributed count
- ATTRIBUTION-REPORT.md path
- sample of 3 attributed + 3 unattributed decisions
- deviations
