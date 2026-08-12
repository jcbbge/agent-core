# AGNT — Amend spawn law: agnostic core, per-harness deltas (cursor-parity follow-up)

> From: cord-agent-core, 2026-08-12. Binding. Parent mission: `briefs/cursor-parity/mission.md`. Operator clarification of 2026-08-12 (via CONCIERGE) is incorporated verbatim below.
> Board topic: `agent-core/cursor-parity`. `.done` marker: `briefs/cursor-parity/.done/agnt-delta-spawn-law.done`.
> You edit docs only. NEVER commit — CORD gates the outer-repo commit.

## Operator law (verbatim authority, binds)

- The stack is provider/model/harness/platform/vendor-AGNOSTIC BY DESIGN. Nothing in the canonical may express a harness preference.
- Fleets are harness-homogeneous: the root spawn's harness defines every downstream agent (pi root → pi fleet; claude root → claude fleet; cursor root → cursor fleet via cursor-fleet/cursor-spine).
- Harness selection is the operator's per-mission intake decision, cost-driven.
- The CORE keeps only the harness-neutral law (homogeneity + operator intake + agnosticism); per-harness spawn verbs/flags belong in `primitives/directives/{claude-code,pi,cursor}.md`.
- The canonical's "Fleet spawn + comms (law, 2026-08-11)" line "Spawn: ~/bin/spine-spawn only" is WRONG as universal law and must be amended.

## Pre-verified facts (verified by CORD this session, 2026-08-12)

- `primitives/AGENTS.md` lines 191-204 = the "Fleet spawn + comms (law, 2026-08-11)" section. Line 193: `- **Spawn:** `~/bin/spine-spawn` only (= `python3 ~/herdr-spine/bin/spine-spawn`).` Line 194: never-`bun` warning. Line 195: hierarchy bullet references `spine-spawn orch|worker|fanout`. Lines 197-204 (comms, wake, smoke briefs) are harness-neutral — keep them in core.
- Delta files exist (C2, commit be8c04f): `primitives/directives/pi.md` already carries `fleet = spine-spawn … --kind pi --profile <name>[:option]`; `claude-code.md` has NO spawn content; `cursor.md` has fleet content but contains TWO STALE claims: "loads ~/AGENTS.md (symlink to canonical)" and "tool skills symlinked into ~/.cursor/skills-cursor/" — both false since C1/C2 (entrypoints are composed deployed files; skills-cursor entries are CLI-managed copies).
- Deploy mechanism: `agent-core sync directive/core` composes core+banner+delta → `~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md`. Binary: `/Users/jrg/agent-core/cli/zig-out/bin/agent-core` (submodule HEAD 53c9dfb).

## Tasks

1. **Core** (`primitives/AGENTS.md`, "Fleet spawn + comms" section): replace the spawn bullet(s) with the harness-neutral law — agnosticism by design; fleets are harness-homogeneous (root spawn's harness defines every downstream agent); harness selection is the operator's per-mission intake decision, cost-driven; per-harness spawn verbs live in `primitives/directives/<harness>.md`. Keep the section's neutral content (hierarchy CORD→ORCH→AGNT/SAGT, briefs-on-disk, CLAIM-first/board/`.done`-last, comms law, wake, smoke briefs) but strip harness-specific tool references from it (e.g. "via `spine-spawn orch|worker|fanout`" → "via the harness's spawn path — see deltas"). Retitle the section's date stamp note if you touch the law (amend, don't erase history: e.g. "law, 2026-08-11; amended 2026-08-12").
2. **pi delta** (`primitives/directives/pi.md`): keep the existing spine-spawn fleet line; add the never-`bun`-spine-spawn warning here (it is specific to the spine-spawn path, not universal law).
3. **claude-code delta** (`primitives/directives/claude-code.md`): add the fleet spawn line for claude kind — `spine-spawn … --kind claude` (verify the exact flag spelling in `~/herdr-spine/bin/spine-spawn --help` or its source before writing; cite what you checked).
4. **cursor delta** (`primitives/directives/cursor.md`): fix the two stale claims (composed entrypoint, not symlink; CLI-managed copies in skills-cursor, not symlinks) and state the cursor fleet path: `~/cursor-shim/cursor-fleet` / `cursor-spine`, shim default profiles/models, Verify beat enforced on `make`.
5. **Deploy**: `agent-core sync --dry-run directive/core` → paste preview into your board finding; then `agent-core sync directive/core` (scoped, this id ONLY). Verify all three entrypoints are regular files whose content matches core+banner+delta.
6. **Evidence**: post ONE finding to board `agent-core/cursor-parity` from `agnt-delta-spawn-law`, addressed to cord-agent-core: before/after of the amended core section, the three delta diffs (or full new content — they're small), the dry-run preview, post-sync verification, and a provenance block (`date -u`; `pwd -P`; `git -C /Users/jrg/agent-core rev-parse HEAD`).

## File partition

- You edit: `primitives/AGENTS.md`, `primitives/directives/{claude-code,pi,cursor}.md` ONLY.
- You never touch: anything else in the repo, `cli/`, `~/.agent-core/registry`, `~/herdr-spine/`, `~/cursor-shim/`.
- Parallel unit in flight: C3 (orch-c3-parity) owns commands/subagents/hooks + cli/ + registry. Zero overlap with your four files.

## Doctrine constraints (bind you)

- Epistemics: verify flag spellings against source before writing them; no asserted fact without a this-session source.
- Content-preserving except where the operator law requires amendment — this is a doctrine correction, not a rewrite pass.
- Comms law: findings to `agent-core/cursor-parity`; questions UP to cord-agent-core via the board; never to the operator.

## Done-when

1. Core carries only harness-neutral spawn law; all per-harness verbs/flags live in the delta files.
2. cursor.md stale claims corrected; claude-code.md has its spawn line (verified spelling).
3. `agent-core status` shows `directive/core` ok ×3 after the scoped sync; entrypoints are composed regular files.
4. Board finding with evidence + provenance posted; last action `touch /Users/jrg/agent-core/briefs/cursor-parity/.done/agnt-delta-spawn-law.done`.
