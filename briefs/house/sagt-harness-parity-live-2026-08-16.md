Catalog live harness wiring for the agent-core pantry versus doctrine. Do NOT use emojis anywhere. Read-only: do not edit registry, hooks, skills, or source. This session's cursor pane (w3S:p1) stays on the Empryo/edit-layer thread; you own only the catalog.

## Pre-Verified Facts (lead verified all of these personally)
- herdr 0.8.0; this spawn host is HERDR_ENV=1, workspace w3S, pane w3S:p1 (cursor), sibling concierge claude on w3R:p1. Command: `herdr --version` and `herdr api snapshot` (2026-08-16).
- Live `~/agent-core/cli/zig-out/bin/agent-core status` this session: summary **268 ok / 1 stale / 57 missing**. The 1 stale row is `directive/core` cursor → `/Users/jrg/AGENTS.md`. The 57 missing rows are cursor skill destinations under `~/.cursor/skills-cursor/` (including `skill/super-search`, `skill/slim`, `skill/latch`, `skill/vein`, `skill/assay`, `skill/navigating-big-files`, `skill/starting-session`, plus many others). Re-run the same binary; do not trust HARNESS-PARITY.md's numbers.
- `~/agent-core/primitives/HARNESS-PARITY.md` still prints "Current: 250 ok / 3 stale / 0 missing (2026-08-14)". That document is a claim to falsify, not a source.
- `ls /Users/jrg/.cursor/skills-cursor` this session: babysit, canvas, concierge, create-hook, create-rule, create-skill, create-subagent, herdr, loop, migrate-to-skills, rename-chat, review, review-bugbot, review-security, sdk, shell, split-to-prs, statusline, tup, update-cli-config, update-cursor-settings, wave-rollup. **No** `super-search`, `slim`, `latch`, `vein`, `assay`, `navigating-big-files` directories. `ls ~/.cursor/skills-cursor/super-search` → No such file or directory.
- `~/AGENTS.md` (composed cursor entry, 15697 bytes, mtime Aug 16 10:34) claims cursor tool skills are CLI-managed copies in `~/.cursor/skills-cursor/` for herdr, super-search, navigating-big-files, slim, latch, vein, assay. herdr and tup dirs exist there; the tool-skill copies named above do not.
- Cursor MCP live (`~/.cursor/mcp.json`): `tower`, `arc`, `bigfile` only. No coraline, no composto, no colgrep, no pickbrain.
- Cursor `~/.cursor/hooks.json` live bindings: sessionStart herdr-agent-state + session-boundary-cursor.sh; preToolUse spawn-door.sh (Shell), circadian graze, slim-guard.sh (Shell); stop write-gate-cursor.sh + doorbell-cursor.sh; sessionEnd session-capture-cursor.mjs + circadian sleep; preCompact session-capture-cursor.mjs. Grounding hook is **not** in this file. HARNESS-PARITY.md already names grounding as a cursor parity gap.
- pi extensions live at `~/.pi/agent/extensions/`: circadian-mind.ts, grounding-hook.ts, herdr-agent-state.ts, herdr-task-report.ts, session-boundary.ts, slim-rewrite.ts, spawn-door.ts, tower-auto.ts, tower-lifecycle.ts, write-gate.ts.
- Binaries on PATH this session: `coraline` → `/Users/jrg/.cargo/bin/coraline` (0.8.3); `colgrep` → `/Users/jrg/.cargo/bin/colgrep` (1.2.0); `composto` → `/opt/homebrew/bin/composto` (v0.2.3); `pickbrain` → `/Users/jrg/.cargo/bin/pickbrain`; slim/latch/vein/assay at `~/.local/bin/` (agent-core status tool/* all ✓ machine).
- Coraline MCP is **not** registered on this cursor desk. `~/agent-core/primitives/AGENTS.md` says Coraline is CLI only, no MCP registration. Super-search skill lives at `~/agent-core/primitives/skills/super-search/SKILL.md` (canonical); cursor copy missing as above.
- Board topic already posted: `agent-core/harness-parity` finding id t-msw0bxbw-o30a.

## Parallel Work Notice
Parent cursor pane w3S:p1 continues the Empryo/edit-layer conversation. Ignore uncommitted diffs unless they are evidence of wiring. Do not investigate, revert, or fix them. Concern yourself only with the catalog. Post findings to Tower board topic `agent-core/harness-parity`. Read the board and the pheromone field before claiming.

## Tower (mid-run communication)
- Catalog/results the operator must see: `mcp__tower__send_to_user` kind=deliverable, from=sagt-harness-parity, **and** write the catalog file named below. Doorbell: `herdr notification show` per herdr skill when sending operator mail.
- Progress with counts at checkpoints: kind=progress is fine on the board; do not toast AGNT activity.
- A decision only the operator can make: `mcp__tower__ask_user`. Do not invent policy.
- Harness host: `/Users/jrg/herdr-spine/bin/spine-report task "..."` at start of each unit and `spine-report verdict "..."` when done.
- **STIGMERGIC FIELD (mandatory).** This system is stigmergic (`~/.tower/COMMS-ARCH.md` plane 5). Do not post-and-wait.
  - Emit `work-available` with evidence (this brief path) if you split work; otherwise claim the existing field item for this topic.
  - Read the field before ever going idle. Claim (`work-claimed`, ref the exact id) and heartbeat (~every 10–20s, claim TTL 30s).
  - `work-done` ref-ing the claim when every done-condition is met; `need-help` instead of silence (nq remaining, route one link up, never a hard address).
  - Two stopping states only: every done-condition met, or posted BLOCKED/need-help after finishing everything that does not depend on it. "Reported and awaited instruction" is not a stopping state.
  - Verbs: MCP `pheromone_emit` / `pheromone_field`, or `bun ~/.tower/cli.mjs emit` / `field`.

## Tasks
1. Re-run `~/agent-core/cli/zig-out/bin/agent-core status` and `… status --harness machine`. Record the live summary and every stale/missing/? row with harness + path. Done when: the catalog quotes the live summary line and lists each non-ok row.
2. Build a capability matrix for harnesses **pi, claude-code, cursor, prime-agent** covering at least: directive entrypoint, skills dir, slim guard, write-gate, spawn-door, grounding, bigfile, Tower read/write/capture, session-boundary, circadian wake, herdr skill, tup skill, super-search, coraline, composto, colgrep, pickbrain, latch, vein, assay. For each cell classify **ENFORCED** (hook/door that fires without the model choosing), **WIRED** (MCP/extension/skill file present and bound), **PATH-ONLY** (binary on PATH, no harness binding), **DOCTRINE** (mentioned in AGENTS.md/HARNESS-PARITY/skill md only), **ABSENT**. Done when: every cell cites a file:line or a command+output from this session, never a doc claim.
3. Prove use vs suggestion. For each WIRED/ENFORCED cell, show the binding (hooks.json / settings.json / pi extensions / mcp.json / registry check verb). For each DOCTRINE cell, quote the md line and show the binding that is missing. Special focus: coraline, composto, colgrep, pickbrain, super-search on cursor — the parent already observed cursor has no super-search skill dir and no coraline MCP; confirm or falsify for pi and claude-code the same way. Done when: a reader can tell which pantry items the model is forced to use vs which it may ignore.
4. Falsify `~/agent-core/primitives/HARNESS-PARITY.md` against live status. Note every number or cell that disagrees. Do not edit the file. Done when: a "doc vs live" section exists with the disagreements.
5. Write the catalog to `/Users/jrg/agent-core/briefs/house/harness-parity-live-CATALOG-2026-08-16.md` and a `.done` marker at `/Users/jrg/agent-core/briefs/house/sagt-harness-parity-live-2026-08-16.done` containing one line: path to the catalog + live status summary. Post a board finding on `agent-core/harness-parity` with the same summary. `send_to_user` the catalog only if it fits; otherwise send a one-screen summary plus the file path.

## Constraints
- Touch ONLY: the catalog file and the `.done` marker under `~/agent-core/briefs/house/`. Do not commit. Do not edit HARNESS-PARITY.md, the registry, hooks, or skills.
- Read-only elsewhere. No mocks. No new MCP servers. No installs.
- Do not spawn further agents.
- Ignore Empryo product questions; the parent owns that thread.

## Report back with
- Live status summary (ok/stale/missing).
- Matrix: capability × harness → ENFORCED|WIRED|PATH-ONLY|DOCTRINE|ABSENT, each with one evidence cite.
- The list of pantry items that are doctrine-only on at least one harness.
- Doc-vs-live disagreements in HARNESS-PARITY.md.
- Absolute path of the catalog file.
