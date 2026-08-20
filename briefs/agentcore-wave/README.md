# agentcore-wave — 2026-08-20

Eleven orchestrator briefs closing the gaps found when circadian's memory-READ
binding was discovered dead in three of five harnesses while its memory-WRITE
bindings fired everywhere. Root cause was structural: a capability with no
registry row cannot fail an audit, so it rots silently. Full write-up in
`primitives/COMPONENTS.md` and `primitives/HARNESS-SHAPE.md`.

Every brief inherits `CONTRACT.md`. Read that first.

## Launch

Each brief is one orchestrator in its own workspace, working in its own git
worktree. To seat one:

```bash
cd ~/agent-core   # or ~/circadian for the sleep-queue brief
slate --dangerously-skip-permissions
```

Then paste the prompt from `PROMPTS.md` for that brief.

## Order

`orch-registry-vcs` **first and alone.** It puts `~/.agent-core/registry` under
version control. Four briefs append rows to that file concurrently, and until it
is versioned a lost write is silent and unrecoverable.

After it lands, everything else may run in parallel.

| Brief | Slug | Repo | Kind |
|---|---|---|---|
| `orch-registry-vcs` | `registry-vcs` | agent-core | infrastructure — **run first** |
| `orch-tool-rows` | `tool-rows` | agent-core | registry coverage |
| `orch-muster-rows` | `muster-rows` | agent-core | registry coverage |
| `orch-bigfile-mcp-row` | `bigfile-mcp` | agent-core | registry coverage |
| `orch-localllm-row` | `localllm-row` | agent-core | registry coverage |
| `orch-circadian-skill` | `circadian-skill` | agent-core | authoring |
| `orch-tower-evidence` | `tower-evidence` | agent-core | evidence → ruling |
| `orch-tools-fate` | `tools-fate` | agent-core | evidence → ruling |
| `orch-sleep-queue-evidence` | `sleep-queue` | **circadian** | evidence → ruling |
| `orch-opencode-onboard` | `opencode-onboard` | agent-core | harness onboarding |
| `orch-slate-onboard` | `slate-onboard` | agent-core | harness onboarding |

## Contention map

Four briefs append to `~/.agent-core/registry`: `tool-rows`, `muster-rows`,
`bigfile-mcp`, `localllm-row`. Two more touch it while onboarding:
`opencode-onboard`, `slate-onboard`. CONTRACT.md's registry rules — back up,
append only your own block, re-read immediately before writing, verify with
`agent-core status` — are what keep them from clobbering each other.

Shared doc files that several briefs edit: `primitives/COMPONENTS.md` (gap list)
and `primitives/HARNESS-PARITY.md` (harness columns). Each brief edits only its
own rows or gap entries. Merge conflicts here are expected and harmless; the
concierge resolves them at merge.

Explicitly partitioned to avoid overlap:

- `tool-rows` owns the eight **installed** unrowed binaries. `tools-fate` owns
  `boot-card` and `statem`, which are **not installed**, and adds no rows.
- `muster-rows` must not touch `rule/worktree-teardown-spine`, retargeted earlier
  today and passing.
- `circadian-skill` must not fix the stuck sleep entry; `sleep-queue` owns it.
- `tower-evidence` changes no bindings and removes no rows.

## Evidence-only briefs

`tower-evidence`, `tools-fate`, and `sleep-queue` produce a **finding document
with a recommendation** and change nothing structural. The work is gathering the
evidence; the ruling is the operator's. Each writes a `FINDING-*.md` whose top
paragraph is written to be rulable on its own.

## Everything lands on a branch

No brief merges to main and none pushes. Each commits its own paths on
`wave/<slug>`, stages explicitly, and never touches the repo's pre-existing
uncommitted changes from other sessions. The concierge gates the merge.
