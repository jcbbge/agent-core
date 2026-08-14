# WORK — agent-core
Updated: 2026-08-14
Phase: Implement

---

## PROJECT
Status: three harnesses (pi, claude-code, cursor) at full parity; registry gained check-only verbs (link/check/binary) + machine pseudo-harness 2026-08-14; `agent-core status` = 249 ok/1 stale/0 missing. Full narrative state: `AUDIT-2026-08-14-topology.md`.
Next milestone: close the P1/P2 backlog in that audit doc (frankenstein-root fixes + parity debt). The three ACTIVE items below sat untouched ~7 weeks and were triaged this pass (2026-08-14, AGNT [doc-truth]) rather than left silently stale.

---

## ACTIVE

<!-- nothing currently active — see BACKLOG; pick up from AUDIT-2026-08-14-topology.md P1/P2 -->

---

## BLOCKED

<!-- nothing blocked -->

---

## BACKLOG

- [ ] Run /tabs to process remaining iCloud tabs into atomic primitives — 182 of 341 still in `~/icloud-tabs-inbox/pending/` (verified 2026-08-14) [agent-core/tabs]
- [ ] contractor bootstrap kit for Arc — collection + setup.sh; Arc now has `.madewell/guides/BOOTSTRAP.md` (Made Well meta-layer) which may already cover this — verify overlap before restarting the task [arc/onboarding]
- [ ] register ported M1 skills in registry — audit still open, count has moved a lot since 06-28 (see TAXONOMY.md) [agent-core/registry]
- [ ] agent-core add command — scaffolding so adding primitives doesn't require hand-editing registry [agent-core/cli]
- [ ] test suite — map every CLI touchpoint, build full test coverage [agent-core/cli]
- [ ] harness scoping conventions — add scope_model field to profiles (stretch goal) [agent-core/registry]

---

## DONE

- [x] create GitHub repo for agent-core — `git@github.com:jcbbge/agent-core.git` (verified live 2026-08-14; closing stale ACTIVE item, exact ship date not re-derived)

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
- [x] herdr skill refresh — 0.7.5 primitives (agent start/prompt/wait) + Firstmate-adapter doctrine (10 items); spine-lab guarded lab helper in herdr-spine; .pi skill copy converted to symlink — 2026-08-02
