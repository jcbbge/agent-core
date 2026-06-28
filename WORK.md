# WORK — agent-core
Updated: 2026-06-28
Phase: Implement

---

## PROJECT
Status: v0.1 working — status, sync, harness profiles, inline strategy all functional
Next milestone: v0.2 — primitive coverage complete, test suite passing, contractor bootstrap shipped

---

## ACTIVE

- [ ] contractor bootstrap kit for Arc — collection + setup.sh [arc/onboarding]
- [ ] Run /tabs to process 341 iCloud tabs into atomic primitives [agent-core/tabs]
- [ ] create GitHub repo for agent-core [agent-core/infra]

---

## BLOCKED

<!-- nothing blocked -->

---

## BACKLOG

- [ ] register ported M1 skills in registry — 35 in store, only handful registered [agent-core/registry]
- [ ] agent-core add command — scaffolding so adding primitives doesn't require hand-editing registry [agent-core/cli]
- [ ] test suite — map every CLI touchpoint, build full test coverage [agent-core/cli]
- [ ] harness scoping conventions — add scope_model field to profiles (stretch goal) [agent-core/registry]

---

## DONE

- [x] Unified atelier v2.0 skill — merged tufte-deck-setup + editorial-magazine + frontend-slides — 2026-06-08
- [x] Zig 0.15.2 CLI scaffold — agent-core status + sync commands — 2026-04-14
- [x] Harness profiles — pi, opencode, claude-code with verified real paths — 2026-04-14
- [x] inline_agents strategy — rules deploy to AGENTS.md via delimited sections — 2026-04-14
- [x] Port 31 skills, 6 rules, 6 subagents from M1 schema — 2026-04-14
- [x] session-start + session-end skills designed and deployed to all 3 harnesses — 2026-04-14
- [x] commit-convention + work-file-format rules globally deployed — 2026-04-14
- [x] SolidJS skills (building-with-solidjs, building-with-solidstart, solidjs-2.0) globally deployed — 2026-04-14
- [x] Research docs — 9 primitives + emerging primitives + harness engineering (11 docs) — 2026-04-14
- [x] M1 audit — deprecated refs catalogued, salvage list documented — 2026-04-14
- [x] iCloud tabs access — CloudTabs.db parsed via Swift CLI, 341 tabs accessible — 2026-04-17
- [x] tablist CLI — ~/bin/tablist with --json, --inbox, --domain, --count, --urls — 2026-04-17
- [x] ~/icloud-tabs-inbox/ — pending/processed/archive structure created — 2026-04-17
- [x] icloud-tabs-distiller skill — categorize, insights, close-suggestions workflows — 2026-04-17
- [x] tab-digest subagent — metacognitive pipeline for tab → atomic primitives — 2026-04-17
- [x] Atomic storage — insights/, nuggets/, references/, tools/, ideas/ primitives dirs — 2026-04-17
- [x] 4 tab commands wired — /tab-inbox, /tab-count, /tab-domains, /tab-report — 2026-04-17
- [x] 341 tabs exported to ~/icloud-tabs-inbox/pending/ with INDEX.md — 2026-04-17
- [x] criticality skill — created, registered, synced to all 3 harnesses — 2026-04-17
- [x] Full primitive audit — 149→108 primitives, moved Arc/Bento-specific to projects, consolidated tabs/SolidJS, removed deprecated — 2026-06-28
