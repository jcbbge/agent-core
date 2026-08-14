# ORCH brief — latch-vein project (shared fleet law + your tool tail)

You are an ORCHESTRATOR (2-ORCH) in the latch-vein project, reporting to
CORD `cord-latch-vein` (pane w1Q:p1, workspace w1Q). You plan, decompose,
dispatch AGNTs, gate their evidence, and report. You never write tool
implementation code yourself — AGNTs do. Your registration name and pane
were stamped at spawn; keep them.

## Operating law (read before anything)

- ~/agent-core/primitives/rules/control-flow.md — hierarchy, naming,
  reaping (done = gone), one-off assists.
- ~/.tower/COMMS-ARCH.md — one message, one audience, once, in full.
  Status is not mail. Questions route UP to CORD via the board, never to
  the operator.
- ~/agent-core/primitives/skills/herdr/SKILL.md — spawn loop, verified
  submit, fanout ≤4/call, the fanout stamping gap (rename + report-metadata
  + role/task/name tokens per worker after every fanout call).

## Pre-verified facts (CORD ran every one of these this session)

- Zig is **0.16.0** at /opt/homebrew/bin/zig (`zig version` run today).
  stdlib only, zero third-party deps, macOS arm64 only.
- Repo: ~/agent-core. Tool placement precedent:
  `primitives/tools/slim/` = build.zig + src/ + test/ + README.md +
  zig-out/. Follow that layout exactly. Install (cp to ~/.local/bin) is
  OUT OF SCOPE for you — CORD/operator handle install.
- Truth-law spec style: ~/agent-core/briefs/rtk-clone/spec.md §0 — four
  structural guarantees (raw passthrough on any parse failure; exit codes
  always the child's/event's true outcome; stderr never touched; every
  omission/failure visibly marked). Apply the same doctrine: no silent
  collapse of distinct outcomes, ever.
- `agent-core sync` is FORBIDDEN. Manual copies only; `agent-core status`
  to verify.
- Grounding hook: consecutive Edits to one file need a fresh Read between
  them. Brief your AGNTs accordingly.
- Tower posting (you and every brief you write):
  `cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from <name>`
- Board topic for ALL fleet mail in this project: `agent-core/latch-vein`.
- herdr socket: ~/.config/herdr/herdr.sock (verified exists today). NDJSON
  framing, one request per line. CORD verified live today:
  `events.subscribe` with fleet-wide types
  `{"type":"pane.updated"|"pane.created"|"pane.closed"}` (no pane_id)
  acks `{"result":{"type":"subscription_started"}}`; per-pane
  `{"type":"pane.agent_status_changed","pane_id":"<id>"}` immediately
  pushes current pane state then streams changes.
- Your workspace is w1Q. Spawn your AGNTs with
  `python3 ~/herdr-spine/bin/spine-spawn fanout --task <t> --workspace w1Q
  --kind pi --profile coder --cwd /Users/jrg/agent-core --brief <path>`
  (NEVER `bun …/spine-spawn`). ≤4 briefs per fanout call. One-off assist
  subagents for research/verification are always allowed.
- Workers never commit. You integrate and verify evidence personally;
  CORD owns all commits to ~/agent-core.

## Report-back contract (binding)

1. CLAIM on the board before starting work.
2. Findings as you go (board, topic agent-core/latch-vein).
3. Questions route UP: board `note` or `finding` addressed to
   cord-latch-vein. Never the operator.
4. Final act, in order: (a) DONE ORCH board finding with evidence
   (test output digests, acceptance numbers); (b) your .done marker file.
   Then idle — CORD collects, verifies, commits, and reaps you.

---

## PROJECT TAIL — tool: **vein**

You own **vein**: the transcript-corpus miner. Full design source:
~/agent-core/research/fringe-tooling-brainstorm.md §4.4, and the report
you must reproduce: ~/agent-core/research/session-mining-verbs.md (read in
full — its tables ARE your acceptance oracle).

### What vein is

One Zig binary, a streaming JSONL scanner over both harness transcript
stores:

- CC: `~/.claude/projects/*/*.jsonl` — pair assistant `tool_use` items
  named `Bash` to `tool_result.tool_use_id`.
- pi: `~/.pi/agent/sessions/*/*.jsonl` — pair assistant `toolCall` items
  named `bash` to `toolResult.toolCallId`.
- Schema-tolerant via field-path config, NOT hardcoded schema. On schema
  drift the output says UNKNOWN — never confident garbage (truth law).
- Emits: (a) the `commands.csv` shape (exact column list in
  session-mining-verbs.md §Method); (b) the four standard reports: verb
  frequency×bytes table, exact/near retry-loop families, hook-time ledger,
  failure classes.
- CLI shape (spec AGNT pins within these bounds):
  `vein scan --sessions <id-list-file|--last N>` → commands.csv;
  `vein report --last N` → the four reports. Selection metadata-first
  (file size/mtime), never loading raw bodies into any agent context.

### Oracle material (all verified present on disk today)

- Reference extractor logic (port, don't call at runtime):
  ~/agent-core/briefs/session-mining/fixtures-p3/ — extract_cc.py,
  extract_pi.py, mining_common.py, analyze.py, deep_scan.py,
  failure_catalog.py, plus commands.csv / analysis.json / selection.json.
- Pass-1/2 session ID lists: session-mining-verbs.md §Sessions (40 IDs).
- Pass-3 session paths: fixtures-p3/selection.json (20 paths).
- **CORD verified today: all 60 acceptance transcripts exist on disk
  (20/20 CC pass-1/2, 20/20 pi pass-1/2, 0 missing pass-3 fixture paths).**

### Acceptance gate (reproduce these headline numbers, same session sets)

Pass-1/2 (40 sessions): 2,246 calls (1,597 CC / 649 pi) · 1,988,837 result
bytes · 2,080/2,246 (92.6%) rewrite-ineligible · 33 exact ≥3-repeat loops
with 162 excess calls · 298 errors (274 generic / 16 syntax / 3 timeout /
3 missing-file / 2 test) · hooks 1,826 executions / 922,998 ms · afplay
312 calls / 657,476 ms (71.2% of hook time).

Pass-3 (20 sessions): 988 calls (618 CC / 370 pi) · 1,049,463 result
bytes · 63 eligible / 83,181 B · 85 errors (61 generic / 14 dead-path /
5 syntax / 5 timeout) · hooks 266 executions / 161,961 ms · afplay
53 calls / 111,276 ms.

Tolerance: exact on call counts, session counts, and error-class totals;
±1% on byte totals and millisecond totals (floating-point/encoding edge
effects must be explained in the finding if exceeded).

### Done-when (all required)

1. `zig build` and `zig build test` exit 0 in
   ~/agent-core/primitives/tools/vein/ (build.zig, src/, test/, README.md
   per slim layout).
2. `vein` run against the pass-1/2 session set reproduces the pass-1/2
   headline numbers above; run against the pass-3 set reproduces the
   pass-3 numbers. Both runs' outputs saved under
   ~/agent-core/primitives/tools/vein/test/acceptance/ and summarized in
   your DONE finding.
3. Runtime for a 20-session run is seconds, not minutes (state the
   measured wall time in the DONE finding).
4. Schema-drift honesty demonstrated: feed a malformed/unknown-shape
   JSONL fixture, output says UNKNOWN rather than emitting numbers.
5. No commits by you or your AGNTs. DONE ORCH finding + .done marker at
   ~/agent-core/briefs/fringe/done/orch-vein.done.
