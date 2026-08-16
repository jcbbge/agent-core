# AGNT [ledger-verbatim] — Prove ledger/Q&A + verbatim guarantee

Read `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/SHARED-PREFIX.md` first — it is the shared prefix. Everything below is your partition.

## Pre-Verified Facts (lead verified all of these personally)

See SHARED-PREFIX.md. Audit anchors:
- F1: `send_to_user` does not set `to:"operator"`; deliverables require `to==='operator'` to enter unrelayed (audit FINDINGS.md §1).
- F4: `mark_relayed` clears guard on caller-supplied ids without proof of display.
- COMMS-ARCH: only alerts, deliverables with `to:"operator"`, and open questions block turn-end. Status/progress and fleet board findings must not become operator mail.
- Do NOT spam the human. Prefer synthetic rows + `check_inbox` / `relay_inbox` / ledger tail inspection. Default: no doorbell.

Live paths: `~/.tower/ledger.jsonl`, MCP tools listed in SHARED fact 3.

## Parallel Work Notice

See SHARED-PREFIX. Partition map:
- YOU write: `LEDGER.md`, `VERBATIM.md`, `raw/ledger/**`, `workers/ledger.done`
- Do not write BOARD/SURFACE/AUX/SPINE.

## Tower

- CLAIM on `tower/w3-prove-planes` from=`AGNT w3-ledger`.
- Prefer MCP for ask/reply/inbox/mark_relayed/send_to_user exercises.
- Never ring doorbell unless a proof step is impossible otherwise; record gap if skipped.

## Tasks

1. Q&A closed loop without human — done when: `LEDGER.md` shows `ask_user` → ledger question row id → answer via `reply` and/or `relay_inbox` answers param → `check_inbox` shows answer / openQ clears for that id. Paste tool returns + ledger line excerpts (ids only + kind + to/from fields). Use a throwaway from= like `AGNT w3-ledger-probe`.
2. Exercise `mark_relayed` — done when: document whether it clears unrelayed state for supplied ids; prove or refute F4 with live behavior (do not "fix").
3. Verbatim matrix in `VERBATIM.md` with ledger evidence for each case:
   - (a) `send_to_user` deliverable **without** `to` (current API) — does it enter unrelayed? (audit says no — re-prove with inboxState / check_inbox / relay_inbox before/after)
   - (b) alert behavior (if exercising alert, keep message clearly marked W3-PROBE and prefer not to doorbell)
   - (c) progress/status does **not** become operator mail
   - (d) fleet board finding does **not** appear as operator deliverable
   Honest GAP OK.
4. Live counts — done when: LEDGER or VERBATIM includes counts of deliverables with/without `to:"operator"` sampled from ledger tail or full scan (method + numbers). If F1 still false → named GAP.

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/LEDGER.md`, `VERBATIM.md`, `raw/ledger/**`, `workers/ledger.done`.
- Absolute evidence paths. No production code edits. No commits.
- Do not answer or clear unrelated open questions belonging to other fleets — scope probes to your from=/ids.

## Report back with

- Per plane (ledger, verbatim): PROVEN / UNBROKEN / GAP.
- Exact commands/tool calls.
- Evidence paths.
- F1/F4 proven or refuted with numbers.
- `workers/ledger.done` only after LEDGER.md + VERBATIM.md satisfy tasks.
