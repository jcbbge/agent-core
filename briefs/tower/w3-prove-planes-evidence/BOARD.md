# Board plane proof — AGNT w3-board

**Verdict:** PROVEN with one GAP (F9 CLI topic filter ignored). Project isolation, worktree collapse, MCP round-trip, and dual-row-kind tolerance all exercised live 2026-08-13T13:50–13:52Z.

**Doorbell:** not exercised — gap (fleet proof only; TOWER-WAIVED).

---

## A. Round-trip claim / finding / note (MCP + CLI)

### MCP path

**Post commands (MCP `board_post`):**

```
board_post type=claim  topic=tower/w3-prove-planes from="AGNT w3-board"
  body="CLAIM: board plane proof — BOARD.md sections A–E + raw/board transcripts..."
→ id t-msrkssh9-foiu

board_post type=finding topic=tower/w3-prove-planes from="AGNT w3-board"
  body="MCP round-trip probe: finding from AGNT w3-board task-1"
→ id t-msrkt17h-7j3n  ts=2026-08-13T13:50:49.181Z

board_post type=note   topic=tower/w3-prove-planes from="AGNT w3-board"
  body="MCP round-trip probe: note from AGNT w3-board task-1"
→ id t-msrkt17g-nvnr  ts=2026-08-13T13:50:49.180Z
```

**Read-back (MCP `board_read`, topic=`tower/w3-prove-planes`, limit=20):**

```
[2026-08-13T13:50:37.869Z] (claim) AGNT w3-board @ tower/w3-prove-planes: CLAIM: board plane proof — BOARD.md sections A–E + raw/board transcripts. Partition: BOARD.md, raw/board/**, workers/board.done only.
[2026-08-13T13:50:49.180Z] (note) AGNT w3-board @ tower/w3-prove-planes: MCP round-trip probe: note from AGNT w3-board task-1
[2026-08-13T13:50:49.181Z] (finding) AGNT w3-board @ tower/w3-prove-planes: MCP round-trip probe: finding from AGNT w3-board task-1
```

MCP topic filter works: only rows matching `tower/w3-prove-planes` returned.

Transcript: `raw/board/` (MCP responses captured in session; no separate file — ids/timestamps above are live read-back).

### CLI path

**Post commands:**

```bash
cd /Users/jrg/agent-core
bun ~/.tower/cli.mjs post claim   tower/w3-prove-planes "CLI round-trip probe: claim from AGNT w3-board task-1"   --from "AGNT w3-board"
# → posted cli-0eaff9a8-b9d4-4a4b-900b-8c40522d7e0e (claim) @ tower/w3-prove-planes

bun ~/.tower/cli.mjs post finding tower/w3-prove-planes "CLI round-trip probe: finding from AGNT w3-board task-1" --from "AGNT w3-board"
# → posted cli-0c2a2e82-0a59-4d5d-964c-1c2466b64c36 (finding) @ tower/w3-prove-planes

bun ~/.tower/cli.mjs post note    tower/w3-prove-planes "CLI round-trip probe: note from AGNT w3-board task-1"    --from "AGNT w3-board"
# → posted cli-1d1199a9-453d-4096-b8ba-4e27bb3d1adb (note) @ tower/w3-prove-planes
```

**Read-back:**

```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs board
```

Filtered read-back (grep `AGNT w3-board.*round-trip`):

```
[2026-08-13T13:50:51.243Z] (claim)   AGNT w3-board @ tower/w3-prove-planes: CLI round-trip probe: claim from AGNT w3-board task-1
[2026-08-13T13:50:53.194Z] (finding) AGNT w3-board @ tower/w3-prove-planes: CLI round-trip probe: finding from AGNT w3-board task-1
[2026-08-13T13:50:53.211Z] (note)    AGNT w3-board @ tower/w3-prove-planes: CLI round-trip probe: note from AGNT w3-board task-1
```

Transcripts: `raw/board/cli-post-claim.txt`, `cli-post-finding.txt`, `cli-post-note.txt`, `cli-board-agent-core.txt`.

**Section A verdict:** PROVEN — both MCP and CLI append authored rows and read them back with matching ids, timestamps, and bodies.

---

## B. Project isolation (cwd A vs cwd B)

**Post probes:**

```bash
cd /Users/jrg/agent-core
bun ~/.tower/cli.mjs post note tower/w3-probe-board-a "isolation probe A from agent-core cwd" --from "AGNT w3-board"
# → cli-15e6e776-c191-4a9b-bd66-33b3f2a97d92 @ tower/w3-probe-board-a

cd /Users/jrg/Infinity/arc
bun ~/.tower/cli.mjs post note tower/w3-probe-board-b "isolation probe B from arc cwd" --from "AGNT w3-board"
# → cli-775c77d8-9e65-45c3-948d-20f96ffd59d0 @ tower/w3-probe-board-b
```

**Read from cwd A (`/Users/jrg/agent-core`):**

```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs board | rg -i probe-board
```

```
[2026-08-13T13:50:55.648Z] (note) AGNT w3-board @ tower/w3-probe-board-a: isolation probe A from agent-core cwd
```

Sees probe A only. Probe B (`cli-775c77d8…`) absent.

**Read from cwd B (`/Users/jrg/Infinity/arc` → normCwd `/Users/jrg/infinity/arc`):**

```bash
cd /Users/jrg/Infinity/arc && bun ~/.tower/cli.mjs board | rg -i probe-board
```

```
[2026-08-13T13:50:55.645Z] (note) AGNT w3-board @ tower/w3-probe-board-b: isolation probe B from arc cwd
```

Sees probe B only. Probe A (`cli-15e6e776…`) absent.

**MCP note:** `board_read` is bound to the MCP server's session cwd (not caller-selectable). Isolation proof here uses CLI `board`, which honors `process.cwd()` via `boardFor(cwd)`. MCP topic filter still works within the server's project scope.

Transcripts: `raw/board/probe-a-post.txt`, `probe-b-post.txt`, `probe-a-visible.txt`, `probe-b-visible.txt`.

**Section B verdict:** PROVEN — fleet rows scoped by `normCwd(cwd)`; agent-core and arc do not cross-read.

---

## C. Worktree collapse (`normCwd` + board scoping)

**Before/after `normCwd` (live import, 2026-08-13T13:51Z):**

```bash
bun -e "import { normCwd } from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs';
  for (const p of [
    '/Users/jrg/agent-core',
    '/Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck',
    '/Users/jrg/Infinity/arc',
  ]) console.log(p + ' -> ' + normCwd(p));"
```

```
/Users/jrg/agent-core                                              -> /Users/jrg/agent-core
/Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck    -> /Users/jrg/agent-core
/Users/jrg/Infinity/arc                                            -> /Users/jrg/infinity/arc
```

Worktree path collapses to main checkout root (matches SHARED fact 4).

**Post-from-worktree, read-from-main:**

```bash
cd /Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck
bun ~/.tower/cli.mjs post note tower/w3-probe-worktree "worktree collapse probe from w0-closeout-driftcheck" --from "AGNT w3-board"
# → cli-9b3c70b3-7ed7-4b1e-b19e-81e519bc9291

cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs board | rg w3-probe-worktree
cd /Users/jrg/.spine/worktrees/agent-core/w0-closeout-driftcheck && bun ~/.tower/cli.mjs board | rg w3-probe-worktree
```

Both cwds return the same row:

```
[2026-08-13T13:51:01.131Z] (note) AGNT w3-board @ tower/w3-probe-worktree: worktree collapse probe from w0-closeout-driftcheck
```

Transcripts: `raw/board/normCwd-live.txt`, `worktree-post.txt`, `worktree-visible-from-main.txt`, `worktree-visible-from-worktree.txt`.

**Section C verdict:** PROVEN — worktree and main checkout share one board scope.

---

## D. Multi-shape consumer behavior (authored vs machine rows)

**Schema ruling (SHARED fact 8 / bus-data):** TWO ROW KINDS — (1) Authored mail `type∈{claim,finding,note,done}` MUST carry `from`; (2) Machine emissions `kind∈{lineage,verify-gate-bypass}` carry `via`, not `from`. Count/tolerate; do not repair.

**Live counts (agent-core scope, 2026-08-13T13:51Z):**

```bash
bun -e "import { boardFor, readAllFull, BOARD, normCwd } from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs';
  const scope = normCwd('/Users/jrg/agent-core');
  const all = readAllFull(BOARD).filter(r => normCwd(r.cwd ?? '') === scope);
  const authored = all.filter(r => r.type && ['claim','finding','note','done'].includes(r.type));
  const machine = all.filter(r => r.kind && ['lineage','verify-gate-bypass'].includes(r.kind));
  console.log('scope rows:', all.length, 'authored:', authored.length, 'machine in scope:', machine.length);
  console.log('boardFor default limit:', boardFor('/Users/jrg/agent-core').length);
  console.log('boardFor topic filter:', boardFor('/Users/jrg/agent-core', {topic:'tower/w3-prove-planes'}).length);"
```

```
scope rows: 633  authored: 628  machine in scope: 0
boardFor default limit: 50
boardFor topic filter: 10
```

Machine rows (465 total in raw `board.jsonl`) carry **no `cwd`** → `normCwd('') === ''` → excluded from project-scoped reads. Global samples:

```
{"kind":"lineage","via":"cursor-shim",...}           # no cwd, no type/from
{"kind":"verify-gate-bypass","via":"cursor-shim",...} # no cwd, no type/from
```

**Consumer render templates (no repair applied):**

| Consumer | Scope filter | Topic filter | Authored render | Machine rows in scope |
|---|---|---|---|---|
| MCP `board_read` (`server.mjs:250`) | `boardFor(CWD, {topic, limit})` | yes | `` `[${ts}] (${type}) ${from} @ ${topic}: ${body}` `` | 0 (cwd-less rows dropped) |
| CLI `board` (`cli.mjs:127-130`) | `boardFor(cwd)` | **no** (F9 gap) | same template via `rowPreview` | 0 |

Authored rows without `from` still render (`from ?? '?'`) — e.g. historical `(note) ? @ agent-core/credential-guard: …` visible in CLI output; not repaired per brief.

**Section D verdict:** UNBROKEN — consumers scope authored rows correctly; machine rows tolerated by exclusion (empty cwd), not conflated with authored mail. No data mutation performed.

Transcripts: `raw/board/multi-shape-counts.txt`, `machine-scope-analysis.txt`, `authored-rows-sample.txt`, `machine-rows-sample.txt`.

---

## E. F9 topic filter (CLI `board <topic>`)

**Hypothesis:** CLI ignores positional topic argument; prints full project scope regardless.

**Commands:**

```bash
cd /Users/jrg/agent-core
bun ~/.tower/cli.mjs board tower/w3-prove-planes | wc -l   # → 52
bun ~/.tower/cli.mjs board | wc -l                         # → 52
diff f9-with-topic-full.txt f9-no-topic-full.txt             # → identical (exit 0)
bun ~/.tower/cli.mjs board tower/w3-prove-planes | rg "tower/w3-prove-planes" | wc -l  # → 10
```

Only **10** of 52 printed lines actually mention topic `tower/w3-prove-planes`; the other 42 are unrelated project-scoped rows. Root cause: `cli.mjs:127-130` calls `boardFor(cwd)` with no argv topic parsing (contrast MCP `server.mjs:250` which passes `args.topic`).

**Contrast — MCP topic filter works:**

```
board_read topic=tower/w3-prove-planes limit=20  → 6 rows (all matching topic)
board_read limit=50 (no topic)                   → 50 rows (project scope, mixed topics)
```

**Section E verdict:** GAP confirmed — CLI `board <topic>` is a no-op filter; re-proves SHARED fact 7 / prior audit F9. Not fixed (out of partition).

Transcripts: `raw/board/f9-with-topic-wc.txt`, `f9-no-topic-wc.txt`, `f9-with-topic-full.txt`, `f9-no-topic-full.txt`, `f9-diff-head.txt`, `f9-topic-matching-lines.txt`.

---

## Evidence paths

| Path | Contents |
|---|---|
| `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/BOARD.md` | this file |
| `raw/board/cli-post-*.txt` | CLI post transcripts |
| `raw/board/cli-board-agent-core.txt` | CLI board full output |
| `raw/board/probe-*` | isolation probe posts + filtered reads |
| `raw/board/normCwd-live.txt` | live normCwd table |
| `raw/board/worktree-*` | worktree collapse proof |
| `raw/board/multi-shape-*` | authored vs machine analysis |
| `raw/board/machine-*` | machine row samples |
| `raw/board/f9-*` | F9 topic filter proof |
| `workers/board.done` | completion marker |

## Deviations

- **Doorbell not exercised** — fleet proof; TOWER-WAIVED per brief.
- **MCP cwd isolation not independently re-proven** — MCP server cwd is fixed per session; CLI used for cwd-varying isolation (standard per COMMS-ARCH scoping model).
- **F9 GAP documented, not patched** — production code edit forbidden by brief.

## Report-back summary

| Task | Result |
|---|---|
| 1 Round-trip MCP+CLI | PROVEN |
| 2 Project isolation | PROVEN |
| 3 Worktree collapse | PROVEN |
| 4 Multi-shape consumers | UNBROKEN |
| 5 F9 topic filter | GAP (CLI ignores topic) |

**Overall:** PROVEN with GAP on CLI topic filtering.
