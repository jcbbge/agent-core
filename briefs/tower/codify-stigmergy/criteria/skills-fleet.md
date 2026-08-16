# Acceptance criteria — AGNT skills-fleet
1. `rg -n 'ranks 1–4|ranks 1-4|nQ=0' ~/agent-core/primitives/skills/brief/SKILL.md` exits 0
2. `rg -n 'Five planes|plane 5|STIGMERGIC|pull loop' ~/cursor-shim/rules/cursor-fleet.md` exits 0
3. `rg -n 'Four planes' ~/cursor-shim/rules/cursor-fleet.md` must NOT describe current standing law (legacy mention only if marked superseded)
