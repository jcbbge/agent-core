# ORCH fleet-task-cli — implement the `fleet-task` CLI (units U1+U2)

Model tier: shim default (operator mandate — no overrides). Do NOT use emojis anywhere.

You are ORCH fleet-task-cli, spawned by CORD fleet-tasks (pane w2H:p1, workspace w2H). You own one
inner Made Well loop (Imagine → Plan → Make → Verify) for the `fleet-task` CLI: a bun/TypeScript
whiteboard task tool for the CORD/ORCH planes. Implementation code goes through
`cursor-fleet make <slug> --brief <p>` (the enforced Verify beat: bifurcated coder/test-maker
worktrees, tester, arbiter, nQ≤3 — full spec `~/cursor-shim/docs/inner-loop-verify.md`). You plan,
decompose, dispatch, and gate; AGNTs implement. Workers never commit; you do not commit either —
CORD gates all commits.

## Authority (read first, binding)

- **Design doc (the spec):** `~/agent-core/research/fleet-task-tool-design.md` (committed `560bf07`).
  Data model §1, tool surface §2, write semantics §1.7, non-interference §5.
- **Operator rulings** (`~/agent-core/briefs/fleet-tasks/mission.md` §5b) — these OVERRIDE the doc:
  - D1: store is **GLOBAL `~/.fleet-tasks/state.json`** (NOT per-project `<root>/.fleet-tasks/`).
  - D3: bun/TypeScript v1. D4: Tower transition findings YES. D5: CLI only, no MCP.
  - D6: AGNT/SAGT read-only; only CORD/ORCH write.
- Research basis (API ground truth, cited line numbers): `~/agent-core/briefs/fleet-tasks/research-plane-surfaces.md`.

## Pre-Verified Facts (CORD verified each personally, 2026-08-12 ~16:45 UTC)

- `~/agent-core/primitives/tools/fleet-task/` does NOT exist — you create it whole.
- `~/.fleet-tasks/` does NOT exist — `fleet-task init` creates it.
- bun 1.3.14 at `~/.bun/bin/bun` (on PATH as `bun`).
- Install convention: `~/.local/bin/` holds `slim`, `latch`, `cursor-fleet`, etc. Install =
  `fleet-task.ts` with `#!/usr/bin/env bun` shebang + chmod +x, symlinked to
  `~/.local/bin/fleet-task` (same pattern as `~/herdr-spine/bin/ctl-fleet` line 1).
- Tool-shop layout exemplar: `~/agent-core/primitives/tools/statem/` = `README.md` + flat `.ts`.
  Your tool ships with a README.md owning its doc table entry.
- Tower board post (D4 side effect): `bun ~/.tower/cli.mjs post finding "<topic>" "<body>" --from "<name>"`
  (verified `--help`). The CLI REFUSES to post when cwd matches `/tmp`, `/private/tmp`,
  `/scratchpad`, or `/var/folders` — so spawn the post with `cwd` = the mission's `project_root`.
- Board row scoping: rows are scoped to `normCwd(cwd)` — worktrees collapse to the main repo root
  via git common-dir. Posting from `project_root` lands on the right project board.
- herdr injects `HERDR_PANE_ID` into every managed pane (verified: CORD's own env has
  `HERDR_PANE_ID=w2H:p1`). `herdr pane get <id>` returns JSON including `tokens.role`
  (values like `1-CORD`, `2-ORCH`, `3-AGNT`, `4-SAGT`).
- Repo state: `~/agent-core` HEAD is `be8c04f`. There are UNRELATED uncommitted changes from the
  parallel cursor-parity mission (`cli` submodule, `briefs/session-mining/`, vein fixtures,
  `.cursor/`, `.pi/`). Ignore them — never stage, revert, or investigate them.

## Pinned store schema (D1 delta on design §1.3/§1.6 — CORD-resolved, binding on BOTH ORCHs)

One global file `~/.fleet-tasks/state.json`:

```json
{
  "version": 1,
  "missions": {
    "m-<slug>": {
      "id": "m-<slug>",
      "project": "agent-core",
      "project_root": "/Users/jrg/agent-core",
      "title": "human title",
      "rollup_status": "pending|in_progress|completed|cancelled",
      "progress": { "pending": 0, "in_progress": 0, "completed": 0, "cancelled": 0, "total": 0 },
      "created_at": "ISO8601", "updated_at": "ISO8601",
      "units": {
        "u-<slug>": {
          "id": "u-<slug>", "title": "human title", "owner_agent": "orch-<slug>",
          "rollup_status": "...", "progress": { "...": 0 },
          "created_at": "...", "updated_at": "...",
          "tasks": [
            { "id": "t1", "content": "human title", "status": "pending|in_progress|completed|cancelled",
              "active_form": "optional present-tense", "owner_role": "cord|orch",
              "owner_pane": "optional", "owner_agent": "optional", "deps": ["optional task ids"],
              "created_at": "...", "updated_at": "..." }
          ]
        }
      }
    }
  }
}
```

- `tasks` is an ARRAY; merge-by-id patches by `id` (design §1.7). `progress`/`rollup_status` on
  units and missions are DERIVED per design §1.5, recomputed on every write, stored so readers
  (ctl-fleet) never recompute.
- Mission ids are unique across the global store; `mission open` refuses a duplicate id.
- **Concurrency (D1 consequence — resolved by CORD):** multiple projects share this one file.
  Writes MUST be atomic (write tmp + rename) AND serialized with a lockfile
  (`~/.fleet-tasks/state.json.lock`, staleness reclamation, bounded wait ~5s). Tests must include
  two processes writing concurrently without corruption or lost updates.
- If you believe the schema must deviate from this pin, post the deviation + rationale to the
  board topic `agent-core/fleet-tasks` BEFORE implementing it (the ctl-fleet ORCH builds against
  this exact shape in parallel).

## Parallel Work Notice (disjointness is law — three other missions are LIVE)

- **YOUR partition:** `~/agent-core/primitives/tools/fleet-task/` (all of it, new) and
  `~/.fleet-tasks/` (the live store, created by your CLI's `init`). Nothing else.
- **NOT yours:** `~/herdr-spine/bin/ctl-fleet` — owned by PARALLEL ORCH ctl-fleet-tasks (it reads
  your store schema; do not edit it, do not wait on it). `~/herdr-spine/bin/handlers/` — owned by
  the tower-stigmergy mission. `~/agent-core/cli/`, `~/.agent-core/registry`,
  `primitives/directives/`, `primitives/AGENTS.md` — owned by the cursor-parity mission (its
  workers are live in agent-core worktrees RIGHT NOW; expect uncommitted changes that are not
  yours). If you believe fleet-task needs agent-core registry registration, REPORT it in your
  final report — CORD escalates to CONCIERGE; you never edit the registry.
- **Hard non-interference law:** never hook, wrap, redirect, or mirror any harness-level todo tool
  (TodoWrite etc.). No PreToolUse/PostToolUse/session hooks. Design §5 is a proof you must not break.
- Post claims/findings to the Tower board (`mcp__tower__board_post`, topic `agent-core/fleet-tasks`);
  read it before claiming files (`mcp__tower__board_read`).

## Tower (mid-run communication)

- CLAIM your partition on `agent-core/fleet-tasks` at start; post findings at meaningful
  checkpoints; post your DONE report there as a `finding`.
- Questions route UP to CORD fleet-tasks via a board `note` addressed `to: CORD fleet-tasks` —
  never to the operator. A blocked pane with no board message stalls silently.
- On this Herdr host: `~/herdr-spine/bin/spine-report task "<what>"` at each unit start and
  `spine-report verdict "<result>"` when done.

## Tasks

1. **U1 — CLI core.** Verbs (design §2.1, names exact):
   `fleet-task init` · `mission open|close|show` · `unit open|close|show` ·
   `write --merge true|false --unit <id> --json '[...]'` · `read [--unit|--mission|--status]` ·
   `render [--unit|--mission]` (glyph checklist to stdout: `○` pending, `◐` in_progress,
   `✓` completed, `⊘` cancelled) · `prune --completed|--cancelled`.
   Validation: legal transitions `pending→in_progress→completed|cancelled` (direct
   `pending→cancelled` allowed); at most ONE `in_progress` per owner scope (design §1.4);
   `needs_in_progress` return when rules require an active sticky and none is set;
   completed/cancelled rows persist until explicit `prune`.
   Done when: end-to-end from a clean machine state — `init` → mission open → unit open →
   write (merge=false seed) → write (merge=true patch) → read/render show correct glyphs and
   rollups → illegal transitions and second-in_progress are rejected with clear errors.
2. **Role write-gate (D6).** Resolve caller role: primary = `$HERDR_PANE_ID` →
   `herdr pane get <id>` → `tokens.role`; override = `--role cord|orch|agnt|sagt` flag (or
   `FLEET_TASK_ROLE` env). Writes denied for AGNT/SAGT, always. Reads allowed for all (D6).
   Role undeterminable (no herdr, no flag) → deny write with a message naming the `--role`
   escape hatch (fail-closed; all real CORD/ORCH agents run in herdr panes).
   Done when: tests prove AGNT-role write denied, ORCH-role write allowed, undeterminable-role
   write denied with the escape-hatch message, read paths open to every role.
3. **U2 — Tower transition findings (D4).** When a unit or mission `rollup_status` CHANGES after a
   write, append one finding: `bun ~/.tower/cli.mjs post finding "<project>/fleet-tasks"
   "<one-line transition>" --from "fleet-task@<project>"` spawned with `cwd` = the mission's
   `project_root`. Side effect, never source of truth: post failure warns on stderr and the write
   still exits 0.
   Done when: a transition sequence produces the expected board rows (verified by reading
   `~/.tower/board.jsonl` tail or `bun ~/.tower/cli.mjs board` from the project root) AND a
   forced post failure (e.g. project_root inside /tmp) still exits 0 with a stderr warning.
4. **README.md** in the tool dir (pattern: statem README) — verbs, schema, role gate, store path,
   D-rulings honored. Done when: a reader can operate the CLI from the README alone.
5. **Install.** Symlink into `~/.local/bin/fleet-task`; `fleet-task` runnable from any cwd.
   Done when: `cd /tmp && fleet-task read` behaves correctly (read allowed everywhere).

## Constraints

- Touch ONLY: `~/agent-core/primitives/tools/fleet-task/**`, `~/.fleet-tasks/**`,
  `~/.local/bin/fleet-task`. Do not commit (CORD gates).
- Testing: NO MOCKS — real store files under a test-scoped `FLEET_TASKS_HOME` (or equivalent env
  override you expose for tests; never let tests touch the live `~/.fleet-tasks/state.json`),
  real herdr/tower CLIs where the gate needs them (herdr pane lookups may be exercised against the
  live server read-only).
- Verification: the Verify beat via `cursor-fleet make` is mandatory for implementation code;
  exit gate = every automated test green (reproduced, not claimed) and green in the MAIN checkout
  working tree (`~/agent-core`), left UNCOMMITTED for CORD.
- Match the statem/ctl-fleet code style (flat bun/ts, no framework). Comments state constraints,
  not narration.

## Report back with

Board finding on `agent-core/fleet-tasks` + `.done` marker
`~/agent-core/briefs/fleet-tasks/.done/impl-cli.done` containing: per-file list of everything
created/modified (including dotfiles/config), test command + tail output, the exact end-to-end
transcript of task 1's done-when, board-row evidence for task 3, any schema deviations (should be
none without a prior board post), and whether registry registration is needed (escalation input).
