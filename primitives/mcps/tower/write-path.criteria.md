# Test criteria — tower write-path hardening (T5+T6)

Authored by test-maker from plan/brief only (`agnt-t5-write-path.md` TASK +
Pre-Verified Facts). Each assert maps to an acceptance criterion. Tests live in
`write-path.test.mjs`; the tester runs them — test-maker does not.

## From-required rejection (patch gap a / test-maker AC)

| Assert name | Criterion |
|-------------|-----------|
| `board_post rejects note without from` | MCP `board_post` with `type=note`, real repo cwd, body+topic set, **`from` omitted** → call fails with clear error mentioning `from`; `~/.tower/board.jsonl` line count unchanged |
| `board_post rejects claim without from` | Same for `type=claim` |
| `board_post rejects finding without from` | Same for `type=finding` |
| `board_post rejects empty from string` | `from: ''` or whitespace-only → reject; no append |

## CLI default-from (test-maker AC)

| Assert name | Criterion |
|-------------|-----------|
| `cli post without --from defaults from to cli:$USER` | `bun <canonical>/cli.mjs post note <topic> "<body>"` (no `--from`) → appended row parses; `from === cli:$USER` |

## Brief skill — no hand-append (patch gap b / test-maker AC)

| Assert name | Criterion |
|-------------|-----------|
| `brief SKILL.md does not teach hand-append to board.jsonl` | `primitives/skills/brief/SKILL.md` must NOT instruct appending a JSON line directly to `board.jsonl` |
| `brief SKILL.md teaches cli.mjs post` | Same file MUST instruct `bun ~/.tower/cli.mjs post ...` (or equivalent canonical CLI path) for harnesses without Tower MCP |

## Reader tolerance — machine rows without from (T6 / test-maker AC)

| Assert name | Criterion |
|-------------|-----------|
| `renderMessage tolerates kind=lineage row without from (lib)` | Fixture `{ kind: 'lineage', via: '...', topic, body, ts, cwd, id }` with no `from` → `renderMessage` (lib.mjs) does not throw; output has no literal `undefined` |
| `renderMessage tolerates kind=lineage row without from (tower-ledger)` | Same fixture → tower-ledger `renderMessage` does not throw |
| `boardFor live rows missing from do not break renderMessage` | Every row returned by `boardFor(agent-core cwd)` → `renderMessage` does not throw |
| `twr renders fixture board with lineage row lacking from` | `bun twr.ts <root> --board <fixture>` on fixture containing lineage row without `from` → no `TypeError` on first tick |

## Append serializer — newline-terminated JSON (test-maker AC)

| Assert name | Criterion |
|-------------|-----------|
| `append writes newline-terminated parseable JSON` | Exported `append(file, obj)` (tower-ledger) → file ends with `\n`; each line is valid `JSON.parse` |
| `cli post appends newline-terminated JSON line` | CLI `post` round-trip → tail byte before final `\n` closes a JSON object; line is parseable |

## Residual risks (document-only — not blocking asserts)

| Item | Criterion |
|------|-----------|
| `no file lock on append` | Brief Pre-Verified Facts: append has serializer + newline but **no lock** — note in proof; no assert until implementer proves lock |
| `machine vs authored schema doc` | Patch gap (c): COMMS-ARCH or tower README documents authored (`type`+`from`) vs machine (`kind`+`via`) — human checklist in proof if not automatable |

## Run command (tester, not test-maker)

```bash
bun test /Users/jrg/agent-core/primitives/mcps/tower/write-path.test.mjs
```

Or from the canonical tower directory:

```bash
cd ~/agent-core/primitives/mcps/tower && bun test write-path.test.mjs
```
