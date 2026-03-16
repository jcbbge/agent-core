# Session Handoff
Date: 2026-03-16
Mode: meta/systems

## Completed

- **OpenRouter API key exposure remediated** — Key was hardcoded in `~/anima/synthesis-worker/anima.synthesis.plist` and committed to GitHub. Removed from plist entirely (worker loads from `.env` at runtime). `.gitignore` updated with `*.plist / !*.plist.template`. Template committed with placeholder. Service tested and confirmed operational.

- **Four new/updated rules deployed** — `secrets.md` (new), `infrastructure.md` (plist hygiene section), `backend-first-security.md` (hardcoded secrets in any file type), `git.md` (scan config files before staging). All deployed to `~/.claude/rules/` and committed to schema.

- **Slate harness onboarded** — Fetched official docs, discovered actual config at `~/.config/slate/`. Key quirks: MCP type is `"remote"` (not `"http"`), no rules directory (all rules in AGENTS.md), no skills auto-load. `harnesses/slate/HARNESS.md` written.

- **All four harness HARNESS.md files rewritten** — claude-code, opencode, omp, slate. Now serve as precise manual update guides with exact file paths, exact formats, and step-by-step procedures per primitive.

- **All sync scripts deleted** — `sync.sh`, `harnesses/*/sync.py`. Manual process replaces scripted deployment (ADR-015).

- **`_sop.md` rewritten** — Removed all adapter.sh / sync script references. Now documents manual, profile-driven update process.

- **Slate added to MCP registry** — `schema/mcp/registry.json` updated with `"slate"` in harnesses arrays for all 5 servers.

## Decisions Captured

- ADR-015: Manual-only primitive deployment — scripts eliminated (supersedes ADR-010, ADR-011)

## agent-core state

- 4 harnesses documented: claude-code, opencode, omp, slate
- 5 MCP servers in registry: anima, kotadb, dev-brain, executor, subagent-mcp
- Rules deployed: secrets, infrastructure, backend-first-security, git (updated)

## Open Items

1. **Large unstaged changeset needs commit** — The `primitives/` → `schema/` restructure plus all HARNESS.md rewrites, sync script deletions, and new harness directories are all uncommitted. Stage and commit explicitly (check git status carefully — many deletions in `primitives/`, new files in `schema/` and `harnesses/`).
2. **Harness drift detection** — No automated way to check if all four harnesses are in sync with schema. Manual verification only for now (ADR-015 consequence).
3. **ADR-006 still Draft** — Cross-harness identity architecture. Was never moved to Accepted or closed.

## Next Session Focus

Stage and commit the full harness + schema restructure — the `primitives/` → `schema/` rename and all the HARNESS.md rewrites need a clean commit so the repo reflects the current state. Then do a manual pass verifying each harness config actually matches its HARNESS.md.
