# WRITE-PATH-PROOF — Tower board write path (T5+T6)

Agent: AGNT write-path (coder)  
Worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-p8`  
Branch target: `tower/board-write-path-hardening`  
Date: 2026-08-13

Canonical schema doc: [`primitives/mcps/tower/COMMS-ARCH.md`](../../primitives/mcps/tower/COMMS-ARCH.md) — **Board row schema (2026-08-13)**.

---

## 1. Audit (pre-patch baseline)

| Guarantee | Finding | Evidence |
|---|---|---|
| Serializer | PASS | `tower-ledger.mjs:76` — `JSON.stringify(obj) + '\n'` |
| Newline termination | PASS | Live probe: last board line parseable, file ends with `\n` |
| File lock on append | FAIL (accepted residual) | `append()` uses bare `appendFileSync`; cursor locks only on read paths |
| Malformed / authorless rejection | GAP (patched) | Pre-patch `board_post` accepted optional `from`; hand-append in brief SKILL |
| Repo ↔ deploy identity | PASS (pre-integration) | `~/.tower/{server,cli,lib}.mjs` → `/Users/jrg/agent-core/primitives/mcps/tower/*`; worktree patches land on merge |
| Brief hand-append instruction | GAP (patched) | Was `SKILL.md:54-58`; now CLI-only |

---

## 2. Patches applied

| Patch | File(s) | Change |
|---|---|---|
| (a) Require `from` for authored types | `tower-ledger.mjs`, `server.mjs`, `cli.mjs` | `assertAuthoredBoardFrom()`; `board_post` throws before append; CLI validates after default-from |
| (b) Brief skill | `primitives/skills/brief/SKILL.md` | Hand-append removed; documents `bun ~/.tower/cli.mjs post ...` |
| (c) Schema documentation | `COMMS-ARCH.md` | Board row schema table (authored `type` vs machine `kind`+`via`) |
| (d) lib.mjs import | `lib.mjs` | Relative re-export of `tower-ledger.mjs` (worktree + symlink-safe) |
| MCP schema | `server.mjs` | `board_post` lists `from` in `required` |

No file lock added (would need stated downtime window; not justified this unit).

---

## 3. Reader tolerance (T6)

Checklist — machine row without `from` must not throw readers:

```bash
cd /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-p8
bun -e "
import { renderMessage, normCwd, _test } from './primitives/mcps/tower/lib.mjs'
const machineRow = { ts: '2026-08-13T00:00:00.000Z', kind: 'lineage', via: 'cursor-shim' }
const rows = [..._test.boardForFromFull(normCwd(process.cwd()), {}).slice(-3), machineRow]
const line = rows.map(r => \`[\${r.ts}] (\${r.type ?? r.kind}) \${r.from ?? '?'} @ \${r.topic ?? '-'}: \${r.body ?? '-'}\`).join('\\n')
console.log(line.split('\\n').slice(-1)[0])
console.log(renderMessage({ id: 'x', kind: 'lineage', ts: machineRow.ts }).split('\\n')[0])
"
```

Output (2026-08-13 session):

```
[2026-08-13T00:00:00.000Z] (lineage) ? @ -: -
Tower x · lineage · from unknown · 2026-08-13T00:00:00.000Z
```

Peers confirmed in code review: `boardFor` ingests any parseable row; `board_read` uses `r.from ?? '?'`; `twr.ts` uses `r.from ?? '?'`.

---

## 4. Live proof (post-patch)

### (i) CLI round-trip

```bash
cd /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-p8
bun primitives/mcps/tower/cli.mjs post note tower/bus-data \
  "write-path round-trip w2z-p8-1786629322" --from "AGNT write-path"
bun primitives/mcps/tower/cli.mjs board | tail -1
```

Output:

```
posted cli-a9b85445-9e1f-41c0-9858-89584ffed4a5 (note) @ tower/bus-data
[2026-08-13T13:55:22.193Z] (note) AGNT write-path @ tower/bus-data: write-path round-trip w2z-p8-1786629322
```

### (ii) MCP / server rejects authored post without `from`

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"board_post","arguments":{"topic":"tower/bus-data","body":"should-not-land","type":"note"}}}' \
  | bun primitives/mcps/tower/server.mjs
```

Output:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"board post refused: authored type \"note\" requires non-empty from"}}
```

Row did not land on board (error returned, no append in handler).

Direct validator (same guard `board_post` calls):

```bash
bun -e "import { assertAuthoredBoardFrom } from './primitives/hooks/tower-ledger.mjs'; assertAuthoredBoardFrom('note', undefined)"
# reject-ok: board post refused: authored type "note" requires non-empty from
```

### (iii) Brief skill — no hand-append teaching

```bash
rg -n "board\.jsonl" primitives/skills/brief/SKILL.md
```

Output:

```
58:  omitted. Do not hand-append JSON to `board.jsonl`.
```

Only a prohibition remains; no append recipe.

---

## 5. Residual risks

1. **No append lock** — concurrent writers may interleave JSONL lines; mitigated by append-only discipline, not kernel serialization.
2. **Raw `append()` bypass** — any code calling `append(BOARD, …)` directly skips `assertAuthoredBoardFrom` (e.g. historical cursor-shim `printf >> board.jsonl`). Chokepoints are MCP `board_post` and `cli.mjs post` only.
3. **Deploy lag** — `~/.tower/*.mjs` symlinks still point at `/Users/jrg/agent-core/…` (main checkout); worktree patches activate after ORCH merge to that branch.
4. **cursor-shim lineage printf** — not patched (proposal only; see §6).

---

## 6. cursor-shim printf path (proposal only)

`~/cursor-shim/cursor-spine:177` appends machine rows via shell `printf`:

```bash
printf '{"ts":"%s","kind":"lineage","via":"cursor-shim",...}\n' ... >> "$TOWER_LEDGER"
```

(`TOWER_LEDGER` defaults to `~/.tower/board.jsonl`.)

These are machine emissions (`kind`+`via`, no `from`) — valid per schema. Risk: bypasses cwd scratch guard and any future append validation. **Proposal:** route through `bun ~/.tower/cli.mjs emit` or a dedicated `cli.mjs lineage` subcommand; not changed in this unit (out of partition, operator window for shim deploy).

---

## 7. Paths changed

- `primitives/hooks/tower-ledger.mjs`
- `primitives/mcps/tower/lib.mjs`
- `primitives/mcps/tower/server.mjs`
- `primitives/mcps/tower/cli.mjs`
- `primitives/mcps/tower/COMMS-ARCH.md`
- `primitives/skills/brief/SKILL.md`
- `briefs/tower/bus-data/WRITE-PATH-PROOF.md` (this file)
- `briefs/tower/bus-data/agnt-t5-write-path.done`
