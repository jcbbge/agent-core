# Unit C1 — Cursor harness profile + copy/PORT engine (ORCH brief)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md` (read it first). Operator rulings of 2026-08-12 (~15:57 UTC, on board `agent-core/cursor-parity`) EXPAND the mission and are incorporated here.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/unit-c1.done`.
> You orchestrate; spawn AGNT(s) (coder profile) for edits. The cli is a GIT SUBMODULE — commits land in `/Users/jrg/agent-core/cli` (its own repo), never the outer repo. Registry edits are serialized: board `claim` before editing `~/.agent-core/registry`, one editor at a time (you are the only editor this unit).

## Operator rulings that bind this unit (verbatim authority)

1. **No symlinks, no deploy_link.** "remove all symlinking. this will be a process covered by the cli itself that will copy and paste and port." The CLI copies AND PORTS (adapts format at deploy time) per harness. Fleet-wide, not just cursor. Drift detection = `agent-core status` checksums.
2. **Cursor skills dir = `~/.cursor/skills-cursor/`** (ratified).
4. **Full parity:** "if its in core its in X harness." Where a harness lacks a native mechanism, the ADAPTER is built in the CLI — divergence is the bug.

## Mission

Add `harness cursor` as a third registered harness and build the port engine that all later units (C2 directive composition, C3 commands/subagents/hooks) consume. Cursor skill deploys become CLI-managed COPIES in `~/.cursor/skills-cursor/`, replacing today's 7 hand-maintained symlinks.

## Pre-verified facts (verified by CORD this session, 2026-08-12)

- CLI builds green on Zig 0.16.0 at submodule HEAD `3cc7943` (Unit B, virgin-cache verified). Sources: `src/{main,registry,status,sync,inline,checksum,io_ctx}.zig` (~1,148 lines total). House idiom: `pub fn main(init: std.process.Init) !void`, `init.arena.allocator()`; allocations in status/sync/inline use `reg.allocator()` (registry arena) — preserve that design.
- Registry grammar already has unused profile fields: `directives`, `agents`, `commands`, `rules` (see `cli/src/registry.zig` doc comment + `HarnessProfile`). `resolveDeployPath` already maps types skill/hook/prompt/command/rule/directive/agents.
- Sync engine: `sync.zig` reads source, checksums raw source bytes, compares to dest, copies via `io_ctx.copyFileAbsolute`. `status.zig` same comparison read-only.
- Cursor surface (Unit A, verified): `~/.cursor/skills-cursor/` = 24 entries, 7 symlinks into `primitives/skills/` (herdr, super-search, navigating-big-files, slim, latch, vein, assay). `~/.cursor/hooks.json` exists (sessionStart + preToolUse/Shell). `~/.cursor/commands/` DOES NOT exist (documented cursor command home; create on deploy). Project `.cursor/agents/*.md` exists (5 role files) — subagents are C3, not this unit.
- `skill/herdr` is live on all three harnesses but has NO registry line (Unit A finding). Store source: `primitives/skills/herdr/SKILL.md`.
- `agent-core status` at C1 start: 37 ok / 0 stale / 0 missing (pi + claude-code only).

## Tasks

1. **Registry grammar + cursor profile.** Add to the CLI parser as needed and to `~/.agent-core/registry`:
   ```
   harness cursor
     skills ~/.cursor/skills-cursor
     skill_format directory
     commands ~/.cursor/commands
   end
   ```
   Hooks for cursor are a JSON file (`~/.cursor/hooks.json`), not a dir — do NOT force it into the `hooks` dir field; C3 owns hooks. If you need a new profile field beyond the above, post it to the board first (schema transparency), then proceed — ruling 4 authorizes schema additions for adapters.
2. **Port engine (`src/port.zig`, new).** A pure transform pipeline: `port(prim_type, harness, src_bytes) -> dest_bytes`. v1 transforms: identity for skill/command on all harnesses (cursor skills are byte-copies today). The point of C1 is the PIPELINE + correct checksum semantics, not a transform catalog — C2/C3 add transforms.
   - **Load-bearing invariant:** `status` and `sync` must checksum the TRANSFORMED bytes and compare against the dest file. Never checksum raw source against a ported dest (drift detection would be void).
   - **De-symlink rule:** `status` reports a dest that is a SYMLINK as stale (show `symlink` in the line); `sync` replaces it with the copied/ported file. This is ruling 1's enforcement mechanism.
3. **Registry entries.** Add `deploy cursor` to every skill primitive already deploying to pi+claude-code, and REGISTER `skill/herdr` (source `primitives/skills/herdr/SKILL.md`, deploy pi + claude-code + cursor). Keep the registry's comment style — annotate what changed and cite the 2026-08-12 operator ruling.
4. **Scoped sync (clearance per mission §4):** `agent-core sync --dry-run` first, post the preview to the board; then `agent-core sync <id>` ONLY for skill ids carrying the new cursor deploy lines + `skill/herdr`. No bare `agent-core sync`. After sync, verify on disk: the 7 skills-cursor symlinks are now regular files with content identical to source.
5. **Verification (virgin-cache, provenance-stamped):** `cd /Users/jrg/agent-core/cli && rm -rf .zig-cache zig-out && zig build` exit 0; `zig-out/bin/agent-core status` shows three harnesses, 0 stale 0 missing; `status --harness cursor` green; post evidence (provenance block: `date -u`, `pwd -P`, `git rev-parse HEAD` in submodule) to the board.
6. **Commit in the SUBMODULE ONLY** per the commit convention (`feat(cli): cursor harness profile + port engine` or split sensibly; PHASE/DONE/TODO trailers; stage explicitly, never `git add -A`). The registry file is NOT in either repo — no commit for it; note that in the report.

## File partition

- You own: `/Users/jrg/agent-core/cli/` (submodule) + `~/.agent-core/registry` (claim on board first).
- You never touch: `primitives/` sources, harness config files other than cursor skill deploys via the CLI, `~/cursor-shim/`, outer-repo files.
- No parallel units in flight. C2 (directive composition) is GATED on operator confirmation of the design proposal — do not start it. C3 starts after you land.

## Doctrine constraints (bind you)

- Epistemics: no asserted fact without a this-session source; never invent config schemas — read cursor's own docs/skills (`~/.cursor/skills-cursor/create-skill/SKILL.md` etc.) before assuming formats.
- Never modify canonical primitives to fit a harness — adaptation lives in the port engine.
- Comms law `~/.tower/COMMS-ARCH.md`: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never to the operator; status is not mail.
- Topology: you were spawned in workspace w2B. Spawn your AGNT(s) with `--workspace w2B` into the workers tab (create it if needed).

## Done-when

1. Virgin-cache `zig build` exit 0; `agent-core status` covers pi + claude-code + cursor with 0 stale 0 missing.
2. The 7 former skills-cursor symlinks are CLI-managed copies; `skill/herdr` registered and deployed on all three harnesses.
3. Port engine landed with transformed-bytes checksum semantics + symlink-is-stale rule, covered by at least a smoke-level test or a documented manual verification transcript posted to the board.
4. Submodule commit(s) exist; registry edit claimed-then-made with board trail; dry-run preview posted before any sync.
5. Final report to cord-agent-core on the board; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/unit-c1.done`.

## Report-back

Board post to `agent-core/cursor-parity`, from `orch-c1-port-engine`, addressed to cord-agent-core. Then the `.done` marker. You will be reaped on collection — durable state goes on disk and the board, never in scrollback.
