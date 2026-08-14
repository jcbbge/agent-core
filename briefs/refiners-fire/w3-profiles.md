# W3 — Model profiles rebuilt on pi grammar (refiners-fire fix, Phase 1)

## Mission
`~/agent-core/primitives/profiles/models.json` holds Cursor-CLI model slugs; 13 of 15 do not resolve in pi. Rewrite the option values to pi-resolvable IDs, verify every one, and update the profile docs. The gateway itself stays — pi reaches it via the `cursor` provider. Audit source: `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` P0-2 + §4.2.

## Pre-Verified Facts (verified today by the coordinating audit)
- pi 0.84.1; cursor provider READY (key in `~/.pi/agent/auth.json`, 205 cached models in `~/.pi/agent/cursor-sdk-model-list.json`, via `pi-cursor-sdk` extension using `@cursor/sdk@1.0.23`; settings.json defaultProvider=cursor).
- pi cursor model grammar (pi-cursor-sdk README §models, `~/.pi/agent/npm/node_modules/pi-cursor-sdk/README.md:179-201`): `cursor/<id>[@ctx][:suffix]` — `@1m/@300k/@272k` context variants; `:off|minimal|low|medium|high|xhigh|max` thinking; `:fast`/`:slow` speed aliases where the model exposes them.
- Verified-present base IDs include: `grok-4.5`, `composer-2.5`, `kimi-k3`, `kimi-k2.7-code`, `claude-opus-5`, `claude-sonnet-5`, `gpt-5.6-sol`, `gpt-5.6-luna`.
- `composer-2.5` and `kimi-k2.7-code` are the only two current models.json values that already resolve.
- `selection.json` (active picks: grok/open/grok/composer/fast) and `profile-model`'s resolve logic need NO structural change — only models.json VALUES change.
- UNVERIFIED (your job): whether `:fast` stacks with a thinking suffix in one ID.
- `pi auth check --provider cursor` returns `provider_not_found` (extension providers invisible to that CLI) — do not use it as a readiness probe; use `pi --offline --list-models`.

## File partition — touch ONLY these
- `~/agent-core/primitives/profiles/models.json`
- `~/agent-core/primitives/profiles/PROFILES.md`
- `~/agent-core/primitives/profiles/profile-model` (header comment ONLY — logic untouched)
READ-ONLY: `selection.json`, the 5 role prompt .md files (already model-agnostic — do not edit), everything else. Never commit. No git commands.

## Tasks
1. **Rewrite models.json** values (keys, roles, defaults unchanged) to this proposed mapping — correct any entry your verification disproves, documenting the substitution:
   - concierge: grok→`cursor/grok-4.5:high` · claude→`cursor/claude-opus-5@300k:high` · open→`cursor/kimi-k3:high`
   - coordinator: open→`cursor/kimi-k3:high` · claude→`cursor/claude-sonnet-5@300k:high` · gpt→`cursor/gpt-5.6-sol@272k:high`
   - orchestrator: grok→`cursor/grok-4.5:high` · claude→`cursor/claude-opus-5@300k:high` · luna→`cursor/gpt-5.6-luna@272k:high`
   - coder: composer→`cursor/composer-2.5` · kimi→`cursor/kimi-k2.7-code` · luna→`cursor/gpt-5.6-luna@272k:high`
   - researcher: fast→`cursor/composer-2.5:fast` · grok→`cursor/grok-4.5:fast` · open→`cursor/kimi-k3`
   Done when: every one of the 15 values (a) appears in `pi --offline --list-models` output or matches a documented pattern the SDK README defines for a catalog model, evidence captured per value, and (b) `profile-model get <profile>` returns the new default for all 5 profiles.
2. **Stacking verdict**: determine whether `:fast` + thinking level combine in one ID (README + catalog inspection; if still ambiguous, one live probe). Done when: a yes/no/unsupported verdict with evidence is recorded in PROFILES.md.
3. **Live smoke of the 5 defaults**: find pi's non-interactive mode via `pi --help` (print/exec flag); run a one-prompt test per default slug (`reply with exactly OK`). Done when: 5/5 respond OK, or each failure is documented with the exact command + error (a failing slug must be replaced with a working variant and re-tested).
4. **Docs**: rewrite PROFILES.md — pi-first (spawn examples use `spine-spawn ... --kind pi --profile <name[:option]>`), the new model table, the stacking verdict, remove the Cursor-CLI framing and the OpenRouter-analogue table if obsolete; update `profile-model` header comment (cursor→pi wording). Done when: `grep -riE 'cursor-agent|--kind cursor' ~/agent-core/primitives/profiles/` (use /usr/bin/grep) returns nothing.

## Tower
Post to board topic `agent-core/refiners-fire`: `claim` at start ("W3 owns profiles dir"), a `finding` with the verified model table after task 1, final `finding` starting `DONE W3:`. MCP tower tools if available, else the `~/.tower/board.jsonl` fallback from a real repo cwd.

## Report back with
Final message AND the DONE post carry: the final 15-value table with per-value verification evidence, the stacking verdict, the 5 smoke results, and doc diffstat. LAST action after the board post: `touch ~/agent-core/briefs/refiners-fire/w3.done` — only after every done-when is verified.
