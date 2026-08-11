# AGNT A3 — repo AGENTS.md rewrite + reorg commit-prep

You are agnt-a3-agents-reorg. Do NOT use emojis anywhere. Fleet worker: no wake greeting. Workers NEVER commit.

## Mission
Rewrite museum-piece `~/agent-core/AGENTS.md` into a thin, factual CLI/repo doc that defers doctrine to `primitives/AGENTS.md`. Prepare an exact `git add` path list + commit message draft for the numbered→plain store reorg already on disk. ORCH commits after verifying all workers.

## Pre-Verified Facts (ORCH verified 2026-08-11)
- Repo `~/agent-core/AGENTS.md` header still says Last updated 2026-04-14; claims harnesses pi/opencode/claude-code; describes pi skills as flat; still teaches WORK.md task-board protocol; hardcodes "Claude Opus 4"; Zig 0.15.2 — live `zig version` = **0.16.0**.
- Canonical doctrine (do NOT rewrite this file): `~/agent-core/primitives/AGENTS.md` (updated 2026-08-11). Repo doc must defer here for stack/control-flow/comms.
- opencode harness DROPPED (registry comment line 4–5). Do not document it as supported.
- Uncommitted reorg already visible in `git -C ~/agent-core status`: deletions under `primitives/10_plugins/…`, new homes under `primitives/plugins/…`, hook rtk deletions, skill path moves (aesthethic-interface-protocol), etc. Numbered dir `10_plugins` is already gone from disk; git still tracks deletions.
- `agent-core` binary: `~/agent-core/cli/zig-out/bin/agent-core` (symlink `/opt/homebrew/bin/agent-core`). Commands: status, sync — but standing order: sync FORBIDDEN until registry stable; document status/sync accurately but note the standing sync ban.
- Registry lives at `~/.agent-core/registry` (not in repo).
- Sibling workers will add more uncommitted paths (session skills, attic, skill sync). Your staging list must cover ONLY the reorg + AGENTS.md rewrite paths — NOT A1/A2/A4 outputs. Call out "ORCH: stage A1/A2/A4 separately or amend list after their .done".

## Parallel Work Notice
A1/A2/A4 are mutating store/skills/hooks. Ignore their diffs. Do not stage their files. Do not "help" by purging plugins.

## Tower
```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post claim agent-core/wave2 "A3 CLAIM: AGENTS.md thin rewrite + reorg staging list" --from agnt-a3-agents-reorg
bun ~/.tower/cli.mjs post finding agent-core/wave2 "A3 DONE: <one line>" --from agnt-a3-agents-reorg
```

## File partition (TOUCH ONLY)
- `~/agent-core/AGENTS.md` (rewrite in place)
- `~/agent-core/briefs/wave2/a3-reorg-stage.txt` (exact git add path list, one path per line)
- `~/agent-core/briefs/wave2/a3-commit-message.txt` (full commit message draft with PHASE/DONE/TODO; Co-Authored-By placeholder `ORCH-FILLS-MODEL`)
- `.done` under briefs/wave2/done/

Do NOT touch: primitives/** (except you may READ), registry, deployed skills, hooks, cli/ source (unless reading for accuracy).

## Tasks
1. Read current repo AGENTS.md fully + skim canonical `primitives/AGENTS.md` structure (headings only — do not copy doctrine wholesale).
2. Rewrite repo AGENTS.md as thin CLI/repo guide:
   - What agent-core is (Zig CLI + primitive store)
   - Build: `cd ~/agent-core/cli && zig build` (Zig 0.16.0)
   - Commands/flags (status, sync, --harness, --registry, --dry-run)
   - Registry format summary (point to ~/.agent-core/registry)
   - Deployment strategies (copy_file / inline_agents / unsupported) — factual
   - Harness table: **pi + claude-code only**; correct skill_format directory for both; rules paths per live registry
   - Explicit: doctrine/stack/control-flow → read `primitives/AGENTS.md` (canonical). Delete museum "Current State", WORK.md session protocol, fake primitive counts, Opus attribution.
   - Note standing order: do not run `agent-core sync` without coordinator clearance.
3. From `git status` / `git status --short`, build `a3-reorg-stage.txt` listing ONLY reorg-related paths (10_plugins deletions, plugins additions that are moves, rtk hook deletions if part of reorg, skill renames already in status). Exclude briefs/, .pi/, .done-cursor-purge, A1/A2 attic unless already in the reorg set.
4. Draft `a3-commit-message.txt` for a `chore(agent-core):` or `docs(agent-core):` commit covering AGENTS.md + reorg staging.
5. Tower + `.done`. Do NOT run git commit / git add.

## Constraints
- No commits. No `git add`. No doctrine duplication from primitives/AGENTS.md beyond a one-line pointer.
- Keep AGENTS.md short and accurate — verify every path/command against disk this session.

## Done when
- Repo AGENTS.md no longer claims opencode, WORK.md law, Zig 0.15.2, or Opus co-author template.
- `a3-reorg-stage.txt` and `a3-commit-message.txt` exist and are usable by ORCH without edits for the reorg slice.
- `~/agent-core/briefs/wave2/done/a3-agents-reorg.done` written last.

## Report-back
`.done`: summary of AGENTS.md changes, path count in stage list, open questions for ORCH (if any staging ambiguity).
