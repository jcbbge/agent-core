# Criteria — AGNT-A3 doctrine skills

1. `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' primitives/skills/herdr/SKILL.md primitives/skills/brief/SKILL.md primitives/skills/muster/SKILL.md primitives/skills/concierge/SKILL.md primitives/skills/ending-session/SKILL.md` returns only (a) fallback/compat wording justified in the done body, (b) SOURCES/history that does not instruct running those paths, or (c) explicit "retired / do not call".
2. `primitives/skills/tup/` remains absent (not restored).
3. `primitives/skills/coordinator/SKILL.md` and `primitives/skills/orchestrator/SKILL.md` are untouched by this agent.
