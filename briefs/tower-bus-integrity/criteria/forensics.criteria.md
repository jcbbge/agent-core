# Criteria — AGNT board-forensics (authored by ORCH board-repair, before implementation)

Authored by the verifier, not the implementer. The implementing agent has not
seen these until its work is checked against them.

## C1 — every candidate carries an explicit verdict
`WRITER-FORENSICS.md` contains exactly five VERDICT lines, one per candidate
(missing-newline, non-atomic interleave, crashed partial write, direct `>>`
bypass, different user/group). Each is `RULED OUT — <evidence>`,
`CONFIRMED — <evidence>`, or `UNKNOWN — <what would settle it>`.
Check: `rg -c '^VERDICT' WRITER-FORENSICS.md` returns 5.

## C2 — evidence is acquired, not asserted
Every `RULED OUT` and `CONFIRMED` cites a file:line, a command with its observed
output, or a named corpus hit. A verdict whose evidence is reasoning alone fails.

## C3 — the mechanism is named or honestly unknown
Either a mechanism with file and line, or a runnable reproduction, or an overall
`UNKNOWN` that is only legal when all five of C1 carry elimination evidence.

## C4 — the reproduction never touches the live board
If a repro exists it operates on a copy in a scratch directory.
Check: the repro command contains no unredirected write to `~/.tower/board.jsonl`;
`~/.tower/board.jsonl` mtime and sha256 are unchanged across the worker's run.

## C5 — the two ORCH leads are addressed
The document says what the literal `n` separator on line 2502 is, and what
serializer emits the spaced-JSON second halves. Either answered with evidence or
explicitly marked UNKNOWN with what would settle it.

## C6 — no credential leak
`rg -c 'srt:[0-9a-f]{32}' WRITER-FORENSICS.md` returns no match.

## C7 — the finding reached the bus
Board topic `agent-core/tower-bus-integrity` carries a `finding` row from this
worker. Check with `bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity`.

## C8 — read-only contract held
The worker created or modified nothing outside
`briefs/tower-bus-integrity/WRITER-FORENSICS.md` and
`briefs/tower-bus-integrity/forensics/`.
