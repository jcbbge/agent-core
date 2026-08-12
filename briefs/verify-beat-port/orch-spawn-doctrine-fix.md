# ORCH spawn-doctrine-fix — correct the spawn-path doctrine in herdr-spine docs

Model tier: cursor-shim defaults, no overrides (desk card, 2026-08-12). Do NOT use emojis anywhere.

Mission: `~/herdr-spine` commit `63e1010` ("fleet spawn-path doctrine — cursor-shim is the spawn path") codified a per-session resource decision as universal law. That is wrong. You own the correction unit (U1): amend `docs/spawn.md` so the docs carry the operator's actual law. Docs-only unit; small; gate it hard anyway. You run one inner cycle (Imagine → Plan → Make → Verify): decompose to a single docs AGNT via `cursor-fleet make` (the Verify beat applies to docs work too — test-maker authors the acceptance checks from this brief, coder edits, tester runs the checks), integrate, commit, report. Workers never commit.

## Operator law (verbatim emphasis is the operator's; these bind)

- **"IM AGNOSTIC BY DESIGN"** — the entire stack is provider/model/harness/platform/vendor-agnostic. Nothing in any repo may codify a harness preference.
- Harness selection is an **operator intake decision per mission/session, cost-determined** (operator's words: pi for personal projects, claude-code for client projects, cursor currently for subscription subsidization, possibly an API gateway like openrouter later — "effectively this is a cost determined situation").
- **Fleets are harness-homogeneous:** the root spawn's harness defines every downstream agent. pi root → pi fleet. claude-code root → claude fleet. cursor root → cursor fleet.
- The 2026-08-12 topology doctrine (Engine Shop, task workspaces — commit `7778575`) stands **untouched**; this corrects the spawn-path framing only.

## Pre-Verified Facts (CORD verified all of these personally, 2026-08-12 ~18:25 UTC)

- Repo: `~/herdr-spine`, HEAD `4838882f7ff8881fd8476e5af39e2ec7302e46c3`. Working tree has only pre-existing untracked paths (`.future/`, `bin/spine-wave`, `briefs/cabinet/`, `research/*`) — ignore them entirely; never stage them.
- `docs/spawn.md` line 21 carries the stale comment: `# Fleet work: --kind pi superseded — see §Spawn-path doctrine (cursor-shim).`
- `docs/spawn.md` lines 129–164 are the `## Spawn-path doctrine` section (incl. `### Prior art: CTRL/TOWR singletons` and `### Structural delta (gap to reconcile)`). This is the section written by 63e1010. Its framing — "All NEW fleet spawns are kind=cursor via the cursor-shim", "`~/bin/spine-spawn --kind pi --profile …` is superseded for fleet work" — is the wrong law.
- `docs/spawn.md` lines 207–208: the acceptance-evidence bullet for `--kind pi` ends `(historical; superseded for fleet work — see §Spawn-path doctrine)` — stale framing, must be corrected.
- `docs/ctl-fleet.md` carries NO repetition of the doctrine: grep for `cursor|spawn-path|superseded` over `docs/ctl-fleet.md` returns zero matches (CORD ran it). Re-run the grep yourself; amend ctl-fleet.md ONLY if your grep finds a repetition, and say so in the report.
- `bin/spine-spawn` lines 671–676 refuse `--kind cursor` and route to the cursor-shim ("spine-spawn owns pi/claude kinds only"). This behavior is CORRECT under the new law (per-harness spawn paths) and stays — it is a partition boundary, not a harness preference. Do not touch `bin/` in this unit.
- The shim's default model table (docs/spawn.md lines 140–146: coordinator `cursor/kimi-k3:high`, orchestrator `cursor/grok-4.5:high`, coder `cursor/composer-2.5`) is cursor-shim house config, not universal law — it may be cited as the shim's own defaults but never framed as fleet-wide doctrine.
- Commit convention (operator law, from ~/AGENTS.md): `<type>(<scope>): <summary>` + PHASE/DONE/TODO/BLOCKED trailer block + Co-Authored-By. Stage explicitly — never `git add -A`.

## Parallel Work Notice

A second mission unit (U2, ORCH verify-beat-port) is in flight in the SAME repo, owning `bin/spine-spawn` + new sibling spawn-path files only. It will not touch `docs/`. Ignore any uncommitted changes under `bin/` — do not investigate, revert, or fix them. Other live missions own `bin/handlers/`, `bin/ctl-fleet*`, and `~/agent-core/` — none of those are yours. Board topics: your findings go to `herdr-spine/verify-beat-port` (mcp__tower__board_post); read `herdr-spine/topology-doctrine` for the history you are correcting.

## Tower (mid-run communication)

- CLAIM this unit on `herdr-spine/verify-beat-port` before spawning workers (topic shared with U2; prefix your posts `[U1]`).
- Post your DONE as a board finding with the commit sha + gate evidence.
- Operator mail only for a genuine external fork (none expected).
- `.done` contract: workers write `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-<name>.done`; you write `orch-u1.done` after your gate passes.

## Tasks

1. Rewrite `docs/spawn.md` `## Spawn-path doctrine` (lines 129–164) to carry the corrected law — done when the section states ALL of: (a) fleets are harness-homogeneous (root spawn's harness defines every downstream agent, with the pi/claude/cursor examples); (b) per-harness spawn paths are `spine-spawn --kind pi|claude` and `cursor-fleet`/`cursor-spine` for cursor; (c) harness choice is the operator's per-mission intake decision, driven by cost; (d) pi's sole distinction is open-source + inference-gateway capable; (e) the agnostic-by-design principle (no repo may codify a harness preference); (f) the `spine-spawn` cursor-refusal (bin/spine-spawn:671–676) documented as the partition boundary between per-harness paths; (g) the §Structural delta content (operator tab2=ORCH/tab3=workers law vs shim per-ORCH-tab gap) preserved — it is topology, not spawn-path framing. The §Prior art subsection may stay if consistent with the corrected framing.
2. Fix the two stale references — done when: line ~21 comment no longer says `--kind pi` is superseded (it is a live per-harness path), and the line ~207 acceptance-evidence note no longer frames pi as superseded (reframe as historical evidence for the pi path).
3. Grep sweep — done when: `rg -n -i 'superseded|THE (fleet )?spawn path|cursor-shim is' docs/spawn.md` returns nothing that frames one harness as universal law, and the report includes the grep output.
4. Gate + commit — done when: the diff touches ONLY `docs/spawn.md` (plus `docs/ctl-fleet.md` solely if your own grep justified it); commit `docs(herdr-spine): …` per the convention with PHASE: Implement, DONE/TODO lines; HEAD sha reported.

## Constraints

- Touch ONLY: `docs/spawn.md` (conditionally `docs/ctl-fleet.md`). Workers never commit; the ORCH integrates from the main checkout and commits once.
- Keep the operator's verbatim quotes exact where quoted; do not paraphrase inside quotation marks.
- Do not delete the verified-recipes or topology content; this is a surgical correction of the spawn-path framing.
- Verification environment: the gate is `git -C ~/herdr-spine diff`/`status` plus the greps above, run from the main checkout.

## Report back with

- Per-file diff summary (lines +/-), the full commit message, and HEAD sha.
- The grep outputs from task 3 (before/after).
- Your independent ctl-fleet.md grep result and whether it justified an amendment.
- Any deviation from this brief, with reasons.
- Provenance block: `date -u`; `pwd -P`; `git -C ~/herdr-spine rev-parse HEAD`.
