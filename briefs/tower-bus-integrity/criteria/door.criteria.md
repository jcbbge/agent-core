# Criteria — AGNT door (authored by ORCH board-repair, before implementation)

Authored by the verifier, not the implementer.

## D1 — the enforcer is mechanical, or honestly labelled
The installed artifact either refuses a bad write at runtime (DOOR/HOOK) or the
ENFORCEMENT.md row says DOCTRINE in plain words. A row claiming DOOR or HOOK
whose code cannot refuse anything is a FAIL, not a near-miss.

## D2 — the refusal is proven against the real write path
A test under `briefs/tower-bus-integrity/door/` calls the actual production
function (not a reimplementation) against a scratch JSONL file, and shows:
a row without a terminating newline is refused; a row that is not exactly one
parseable JSON object is refused; a well-formed row is accepted.
Check: `briefs/tower-bus-integrity/door/refusal-test-output.txt` exists and its
content is the captured run, not a transcription.

## D3 — exactly one ledger row, in the existing table
`git diff primitives/rules/ENFORCEMENT.md` shows one added row in the table that
begins at line 30, five columns, no restructuring, no other row altered.

## D4 — the claim in the row is true of the code
Read the row, then read the code it names. The Coverage column must not claim a
harness the code does not reach.

## D5 — no regression
`bun test primitives/mcps/tower/write-path.test.mjs primitives/mcps/tower/jsonl-integrity.test.mjs`
passes, or its pre-existing failures are shown to predate the change.

## D6 — the live board was not touched
`~/.tower/board.jsonl` sha256 identical before and after the worker's run.

## D7 — symlinks respected
No edits to `~/.tower/cli.mjs`, `~/.tower/server.mjs`, `~/.tower/lib.mjs`
(they are symlinks); canonical files under `primitives/mcps/tower/` only.
