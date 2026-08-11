# W5 — rtk minimal-clone research (design study, not implementation)

## Mission
jrg runs rtk (github.com/rtk-ai/rtk, Apache-2.0, Rust) as a token-saver proxy. Today's research verdict: only 4-6 verbs deliver real savings (ps aux 97%, wc 90%, git status 80%, ls -la 78%, git log 61%, df 11%); the rest measure ~0% or actively corrupt output (multi-file cat, diff false-"identical", find silent 0-results, grep -c, head -N). An allowlist guard now restricts the hooks to the proven verbs. QUESTION TO ANSWER: what exactly is rtk doing under the hood, and could we roll our own version that is (1) simple (2) easy (3) minimal (4) barebones — in Rust, Zig, or Go? This is a DESIGN STUDY: you produce a document, you write no implementation code beyond illustrative snippets.

TOWER: post to board topic `agent-core/refiners-fire` — a `claim` at start ("W5 rtk-clone design study, writes only ~/agent-core/research/rtk-minimal-clone.md"), and a final `finding` starting `DONE W5:`. Use tower MCP tools if available in your harness, else append JSONL to ~/.tower/board.jsonl ({"id","ts","cwd","type":"finding","from":"agnt-rtk-clone","topic":"agent-core/refiners-fire","body":"..."}).

## Pre-Verified Facts (verified today by the coordinator's research agent)
- rtk 0.34.3 installed at ~/.local/bin/rtk (upstream is at 0.45.0; corruption bugs #3469/#3519 diff, #1849 npx, #2861 pipeline-rewrite→destructive-rm, #2487 porcelain are all STILL OPEN at 0.45.0; 967 open issues total).
- rtk = single Rust binary: `rtk rewrite "<cmd>"` maps a shell command to an rtk-wrapped form (the mapping registry lives upstream in src/discover/registry.rs); each wrapped verb (rtk ls, rtk ps, rtk git status, ...) executes the underlying command and compacts its stdout; SQLite ledger behind `rtk gain` self-reports savings (unreliable — upstream #3418 + direct measurement contradict it); telemetry defaults ON.
- Measured savings (raw bytes vs rtk bytes, this machine, today): ps aux 166,905→3,477; ls -la ~ 9,462→2,053; git status 305→61; git log -5 4,809→1,858; wc -l 44→4; df -h 1,089→961; cat/grep/read shapes ≈ 0%.
- Hook integration (already allowlist-guarded, you do NOT touch hooks): CC ~/.claude/hooks/rtk-rewrite.sh, pi ~/agent-core/primitives/hooks/rtk-rewrite.ts, cursor variant (vestigial).
- Test corpus + measurement scripts from today's research are preserved at /private/tmp/claude-501/-Users-jrg/de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/rtk-test/ — reuse them.
- jrg's stack context: comfortable in Zig (agent-core CLI is Zig 0.15.2), TypeScript/Bun everywhere, some Rust exposure. Machine: macOS arm64.

## File partition — touch ONLY these
- Write exactly ONE file: `~/agent-core/research/rtk-minimal-clone.md`
- Plus scratch experiments under /private/tmp/claude-501/-Users-jrg/de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/w5/
Read-only everywhere else. Never commit. No git commands. Do not modify hooks, rtk, or its config.

## Tasks
1. **Mechanism autopsy**: characterize exactly what rtk does per proven verb — for each of ls, ps, git status, git log, wc, df: run the raw command and the rtk form (safe, read-only), diff the shapes, and describe the compaction algorithm it appears to apply (column dropping? aggregation? dedup? truncation caps?). Also characterize `rtk rewrite`'s mapping behavior (what patterns it matches, what it refuses). Consult the upstream repo via web (github.com/rtk-ai/rtk — README, src layout, registry.rs, one or two wrapper sources) to confirm the mechanism rather than guessing from output. Done when: each of the 6 verbs has a documented in/out shape + algorithm description, and the rewrite mapper's behavior is described with upstream code references.
2. **Scope cut**: define the minimal clone = the proven verbs ONLY, as pure stdin/argv→stdout filters + a tiny `rewrite` subcommand for hook use. Explicitly list everything rtk has that the clone deliberately drops (60-verb registry, SQLite gain ledger, telemetry, config system, npx/test-runner wrappers, deny/ask rules). Done when: an in/out scope table exists.
3. **Language + architecture recommendation**: compare Rust vs Zig vs Go for this scope against: single static binary, macOS arm64 first, LOC estimate, stdlib sufficiency (no deps ideally), jrg maintainability (he owns Zig code already), startup latency (it runs per Bash call — sub-10ms matters). Sketch the architecture: module list, rough LOC per module, the rewrite table as data not code. Done when: one language is recommended with the sketch, and total effort is estimated in hours (simple/easy/minimal/barebones is the bar — if the estimate exceeds ~a day, say so and say what to cut).
4. **Build-vs-keep verdict**: compare the clone against the status quo (allowlisted rtk 0.34.3): token savings retained, corruption risk, maintenance burden, telemetry, upgrade path. Give a clear recommendation: build it / don't build it / build only if X. Done when: the verdict paragraph exists with the decision criteria explicit.

## Report back with
Final message AND the DONE post carry: the doc path, the per-verb mechanism table, the language recommendation + effort estimate, and the build-vs-keep verdict. LAST action after the board post: `touch ~/agent-core/briefs/refiners-fire/w5.done` — only after the doc exists and every done-when above is satisfied.
