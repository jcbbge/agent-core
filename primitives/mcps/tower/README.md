# Tower MCP Server

Fleet orchestration message bus for multi-agent coordination.

## Canonical vs. deployed — read this before touching anything

Code and the deployed runtime live in two different places on purpose:

- **Canonical, git-tracked code:** `~/agent-core/primitives/mcps/tower/` (this
  directory) — `lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`,
  `server-drift.test.mjs`, docs, `hooks/*.mjs`, `attic/`.
- **Deployed runtime + ALL state:** `~/.tower/` — same file layout, plus the
  live JSONL stores (`ledger.jsonl`, `board.jsonl`, `odometer.jsonl`,
  `pheromones.jsonl`), `deliverables/`, `flight/`, `cursors/`, `briefs/`.

Load-bearing paths that must never stop resolving:

- The Claude Code MCP registration (server started via stdio).
- 15 hook registration sites in `~/.claude/settings.json`, all pointing at
  `/Users/jrg/.tower/hooks/*.mjs` (lines 34, 46, 56, 84, 116, 128, 158, 180,
  215, 226, 286, 313, 318, 329, 340).
- `bun ~/.tower/cli.mjs` — documented and invoked machine-wide.
- The double hop `~/.claude/tower` → `~/.tower` (a real symlink, confirmed:
  `lrwxr-xr-x … /Users/jrg/.claude/tower -> /Users/jrg/.tower`) — kept for
  backward compatibility with anything still addressing the old path.

A later step (not yet done) replaces the deployed code paths under
`~/.tower/` with symlinks into this canonical directory. Until that happens,
this directory and `~/.tower/` hold independent copies of the code — do not
assume editing one edits the other.

## The state-anchor property — why this split is safe

State is anchored to `homedir()`, never to wherever the code happens to run
from. `~/agent-core/primitives/hooks/tower-ledger.mjs` lines 22-28:

```js
export const TOWER = join(homedir(), '.tower')
export const LEDGER = join(TOWER, 'ledger.jsonl')
export const BOARD = join(TOWER, 'board.jsonl')
export const PHEROMONES = process.env.TOWER_PHEROMONES_PATH || join(TOWER, 'pheromones.jsonl')
export const DELIVERABLES = join(TOWER, 'deliverables')
export const ODOMETER = join(TOWER, 'odometer.jsonl')
export const FLIGHT = join(TOWER, 'flight')
```

`PHEROMONES` additionally honors `TOWER_PHEROMONES_PATH` as an override.
Every other path is derived from `homedir()` unconditionally. Consequence:
**moving or copying the code cannot move the state.** Running the code from
this canonical directory, from `~/.tower/`, or from a symlink all read and
write the same `~/.tower/*.jsonl` files. This is the property that makes
having two code locations survivable at all.

## The relative-import constraint — this set moves together, or not at all

`server.mjs:30` and `cli.mjs:18` import `./lib.mjs`. `cli.test.mjs:2,3`
import `./cli.mjs` and `./lib.mjs` (it also imports the older
`/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs` directly at line 4,
for an old-vs-new `renderMessage` comparison — that one is an intentional
cross-repo reference, not part of the graph below).

Exactly 5 hooks import the **parent** directory's `lib.mjs` via `../lib.mjs`:

- `hooks/odometer.mjs:15`
- `hooks/odometer-stop.mjs:11`
- `hooks/prompt-inject.mjs:8`
- `hooks/stop-guard.mjs:13`
- `hooks/session-start.mjs:15`

This fixes the layout: `<root>/lib.mjs` plus `<root>/hooks/*.mjs`, sibling
directories with a fixed relative offset. **The set must move together.**
Relocating `hooks/` without `lib.mjs`, or vice versa, breaks every relative
import in the set that moved.

## Symlink resolution — and the one exception

Bun resolves symlinks to their real path *before* resolving relative
specifiers. Proven experimentally: a hook reached through a symlink reports
`import.meta.url` at the canonical path, and still resolves `../lib.mjs`
correctly — even with the deployed-side `lib.mjs` symlink deleted. So once
`~/.tower/` is symlinked to this canonical directory, the relative-import
graph above resolves from the canonical root regardless of which path was
used to reach it.

**Exception:** `~/.tower/lib.mjs` must still exist as a real, resolvable
path independent of the relative-import graph. `hooks/ask-bridge.mjs:152`
resolves it at runtime through a homedir-anchored dynamic import instead of a
static relative specifier:

```js
lib = await import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')).href)
```

That line does not go through Bun's symlink-then-relative resolution at all
— it constructs an absolute path from `homedir()` directly. If `~/.tower/`
were ever left without a `lib.mjs` (real file or symlink) at that exact
path, `ask-bridge.mjs` breaks even though every other hook still resolves
fine.

## Verifying a change safely

Check import resolution without executing anything:

```bash
bun build --target=bun <file> --outfile=/dev/null
```

**Do not `import()` a hook to test it.** Several of these hooks read stdin
(Claude Code hook protocol) and will either block waiting for input or fire
real actions (posting to the board, writing state). `bun build` only
resolves the module graph — it never runs the code.

## Test side effect — the stray `ledger.jsonl`

Running the test suite (`bun test`) from this canonical directory writes a
stray `ledger.jsonl` into the current working directory, because some test
paths construct a ledger path relative to `cwd` rather than through the
homedir-anchored constants above. It does **not** reach the real
`~/.tower/ledger.jsonl`. This directory's `.gitignore` excludes it so it can
never be accidentally committed as if it were tracked code or real state.

## `attic/`

`attic/` holds preserved backup files (`.bak-*`, `.spine-backup-*`) copied
alongside the live code during the initial canonicalization, plus a
`README.md` and `DIFF-SUMMARY.md` describing what each backup is and how it
differs from the live file it shadows. Deleting the original `~/.tower/`
backup files is a separate, still-open decision — not something to tidy up
as part of an unrelated change.

## Project Namespacing

All data stored centrally but namespaced by `cwd`. Each project sees only its own messages.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `send_to_user` | Surface message (deliverable/alert/progress) |
| `ask_user` | Ask question mid-run |
| `reply` | Record user's answer |
| `check_inbox` | Poll for answers |
| `mark_relayed` | Acknowledge messages |
| `board_post` | Claim files, share findings |
| `board_read` | Check peer claims |

## Harness Integration

### Claude Code

Tower integrates via hooks in `~/.claude/settings.json` (15 registration
sites, all at `~/.tower/hooks/*.mjs` — see "Canonical vs. deployed" above for
exact line numbers). Representative subset:

```json
{
  "hooks": {
    "Stop": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/stop-guard.mjs"
    }],
    "UserPromptSubmit": [{
      "type": "command", 
      "command": "bun ~/.tower/hooks/prompt-inject.mjs"
    }],
    "PreToolUse(Agent)": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/enforce-brief.mjs"
    }],
    "PostToolUse(Agent)": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/odometer.mjs"
    }],
    "SessionStart": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/session-start.mjs"
    }],
    "PreCompact": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/flight-recorder.mjs"
    }]
  }
}
```

A symlink exists at `~/.claude/tower` → `~/.tower` for backward compatibility.

### Pi

Create an extension at `~/.pi/agent/extensions/tower.ts` that wraps the CLI:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "tower",
    description: "Fleet orchestration - status, inbox, board, burn",
    parameters: {
      type: "object",
      properties: {
        command: { 
          type: "string", 
          enum: ["status", "inbox", "board", "burn"],
          description: "Tower command to run"
        }
      }
    },
    execute: async ({ command = "status" }) => {
      const result = execSync(`bun ~/.tower/cli.mjs ${command}`, {
        encoding: "utf-8",
        cwd: process.cwd()
      });
      return { content: result };
    }
  });
}
```

### Other Harnesses

Run the MCP server via stdio:

```bash
bun ~/.tower/server.mjs
```

Register the tools per your harness's MCP integration.

## CLI Usage

```bash
bun ~/.tower/cli.mjs status   # Counts + pending for current project
bun ~/.tower/cli.mjs inbox    # Full pending messages
bun ~/.tower/cli.mjs board    # Blackboard entries
bun ~/.tower/cli.mjs burn     # Token burn by day/spawn
bun ~/.tower/cli.mjs all      # Status across all projects
```

## Related Primitives

- **Command:** `tower` — `/tower` invokes CLI and acts on results
- **Rule:** `tower-orchestration` — Protocol for orchestrators and subagents
