# Handoff — Pi → Cursor CLI migration (plan locked, not executed)

**Session:** 2026-08-10 · Cursor chat (home / META) → next: Cursor Agent CLI inside herdr  
**Plan file:** `~/.cursor/plans/Pi to Cursor CLI-17e06db7.plan.md`  
**PHASE:** Plan (complete) → next session starts **Implement**

---

## Intent (do not re-litigate)

- **Keep and lean into:** herdr, Tower, circadian, `~/agent-core` (provider/model/CLI-agnostic substrate).
- **Do not touch:** `~/.pi/**` (fallback), Claude Code (client constraint), dotfiles harness install.
- **Target:** Cursor Agent CLI (`~/.local/bin/agent`) in herdr panes (`--kind cursor`).
- Catalog Pi surfaces → classify-before-mapping → port to Cursor primitives; shared logic stays in agent-core.

---

## What this session did (no implementation yet)

1. Oriented on Pi stack vs Cursor CLI; mapped inventory (extensions, packages, skills, agents, hooks).
2. Locked migration plan through several iterations (see plan file).
3. **Profiles:** five control-flow profiles × **exactly 3 model options** each; swappable via `selection.json` / `profile-model set` / `--profile name:option`.
4. **Default concierge** = `cursor-grok-4.5-high` (`grok` option) — best general Grok.
5. **AGENTS.md:** `~/.cursor/AGENTS.md` → symlink to `~/agent-core/primitives/AGENTS.md` (same canonical Pi/CC already use). `primitives/directives/` is empty — do not relocate.
6. pi-spine: harvest intent best-effort into circadian/Tower; not pixel-parity. Constellation stars: not required.
7. User ending session to smoke-test Cursor CLI inside herdr multiplexer next.

---

## Locked profile → 3 options (defaults marked)

| Profile | Default key | Default model | Other options |
|---|---|---|---|
| concierge | **grok** | `cursor-grok-4.5-high` | `claude`→`claude-opus-5-high`, `open`→`kimi-k3-high` |
| coordinator | **open** | `kimi-k3-high` | `claude`→`claude-sonnet-5-thinking-high`, `gpt`→`gpt-5.6-sol-high` |
| orchestrator | **grok** | `cursor-grok-4.5-high` | `claude`→`claude-opus-5-thinking-high`, `luna`→`gpt-5.6-luna-high` |
| coder | **composer** | `composer-2.5` | `kimi`→`kimi-k2.7-code`, `luna`→`gpt-5.6-luna-high` |
| researcher | **fast** | `composer-2.5-fast` | `grok`→`cursor-grok-4.5-low-fast`, `open`→`kimi-k3-high` |

Prompts are model-agnostic; only selection changes `--model`.

---

## TODO — exact next actions (Implement)

1. Read plan: `~/.cursor/plans/Pi to Cursor CLI-17e06db7.plan.md`
2. Create `~/agent-core/primitives/profiles/` (`PROFILES.md`, `models.json`, `selection.json`, `profile-model` helper, five `*.md` prompts)
3. Symlink: `ln -sfn ~/agent-core/primitives/AGENTS.md ~/.cursor/AGENTS.md`
4. Wire Cursor hooks: circadian wake/sleep, tower ambient, rtk-rewrite, herdr spine-report (do not break existing superconductor/superset hooks)
5. Extend `spine-spawn` for `--kind cursor --profile <name>[:option]`
6. PORT-MAP.md catalog then port; smoke five profiles in herdr

**Never:** edit `~/.pi/**`, Claude Code config, or unrelated dirty files already present in agent-core working tree from other work.

---

## Useful paths

- Plan: `~/.cursor/plans/Pi to Cursor CLI-17e06db7.plan.md`
- Control flow: `~/agent-core/primitives/rules/control-flow.md`
- Canonical AGENTS: `~/agent-core/primitives/AGENTS.md` (pi + claude already symlinked)
- Cursor CLI: `~/.local/bin/agent` · hooks: `~/.cursor/hooks.json`
- Pi inventory (read-only): `~/.pi/agent/extensions/`, `settings.json` packages, `skills/`
- Circadian: `~/circadian` · Tower: `~/.tower/` · Herdr spine: `~/herdr-spine/`
