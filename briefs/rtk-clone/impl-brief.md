# IMPL BRIEF — build `slim`, the six-verb Zig replacement for rtk

You are the builder for `slim`. This brief is self-contained and binding. The full build spec is `~/agent-core/briefs/rtk-clone/spec.md` — read it completely before writing code; it defines every verb's algorithm exactly. This brief adds the operational envelope (facts, partition, done-when, comms).

## Mission
Implement `slim`: a closed six-verb (`ls`, `ps`, `wc`, `df`, `git status`, `git log`) native-command output compactor + a `rewrite` mapper, in Zig, macOS arm64, zero third-party deps. It fully replaces rtk on the allowlisted path. The one law: **truth over compactness** — parse failure → raw passthrough; child exit code always propagated; stderr untouched; every omission visibly marked. No banner-instead-of-output, no exit-0-on-error, no silent empty result. The rtk bug catalog is the anti-spec (see spec §0 and §7.4) and must be structurally impossible.

## Pre-Verified Facts (verified this session by the spec author — trust these; re-verify only if something contradicts)
- **Toolchain:** `zig version` → **0.16.0**, at `/opt/homebrew/bin/zig`. Build with `zig build`; test with `zig build test`. (Repo `AGENTS.md` says 0.15.2 — stale; the installed compiler is 0.16.0, pin to it.)
- **Tool location:** source dir `~/agent-core/primitives/tools/slim/` (sibling of existing `bigfile/`, `statem/`). Binary installs to `~/.local/bin/slim` (on PATH; `rtk` currently lives there — verified).
- **Consumer contract (do not modify these files):** `~/.claude/hooks/rtk-guard.sh` and `~/agent-core/primitives/hooks/rtk-rewrite.ts` invoke `rtk rewrite "<cmd>"` → exit 0 + rewritten command on stdout (match) / exit 1 (no match), then allowlist keeps only `^rtk (ls|ps|wc|df|git status|git log)` and blocks `| ; & $( \` --porcelain --format --pretty`. `slim` must expose the identical `rewrite` contract (spec §3.7) and a `--version` printing a semver ≥ 0.23.0 (spec §4) so cutover is a binary-name swap only.
- **Oracle:** `rtk 0.34.3` is installed at `~/.local/bin/rtk` (`rtk --version` verified) — use it as the differential oracle for the git verbs (spec §7.3). It stays installed until cutover.
- **Fixtures (already copied, deterministic):** `~/agent-core/briefs/rtk-clone/fixtures/` contains raw→compact pairs `ls`, `ps`, `df`, `wc` (`.raw.txt`/`.rtk.txt`), human-shape references `git-status`/`git-log`, and `rewrite-corpus.txt`/`rewrite-boundaries.txt` (rtk's rewrite behavior being replaced). ls/ps/df/wc goldens are pure-function tests on the `.raw.txt` files (spec §7.1).
- **Design study (background):** `~/agent-core/research/rtk-minimal-clone.md` — per-verb mechanisms confirmed against pinned rtk v0.34.3 sources.
- **Target constraints:** macOS arm64 only; fixed native paths `/bin/ls`, `/bin/ps`, `/usr/bin/wc`, `/bin/df`, `/usr/bin/git`. Sub-10ms p95 cold start for `rewrite` (runs per Bash call).

## File partition — write ONLY under these
- `~/agent-core/primitives/tools/slim/` (all Zig source, `build.zig`, `build.zig.zon` if needed, `test/`, a short `README.md`).
- `~/agent-core/briefs/rtk-clone/fixtures/` (add generated scratch fixtures if needed; do not delete the copied ones).

Read-only everywhere else. **Do NOT** modify rtk, `~/.claude/hooks/*`, `~/.claude/settings.json`, `rtk-rewrite.ts`, or install the binary to `~/.local/bin/` (leave that as a documented manual step). **No git commits, no `git add`, no push** — repo hygiene is the operator's, not yours. Cutover (binary-name swap + rtk removal) is explicitly out of scope (spec §9).

## Tasks (each with its done-when)
1. **Scaffold + build.** `build.zig` (Zig 0.16.0) producing `zig-out/bin/slim` (`-Doptimize=ReleaseFast` for release) and a `test` step. Module skeleton per spec §6.
   - *Done when:* `zig build` produces the binary and `zig build test` runs (even with stub tests).
2. **`rewrite` mapper** (spec §3.7): closed table, metachar refusal, env/`sudo`/`NAME=VALUE`/`git -C` handling, machine-format-flag refusal, `SLIM_DISABLED`, `--version`→`slim 1.0.0`.
   - *Done when:* every row of the spec §3.7 expectation table passes as `T-REW-CONTRACT` (exact stdout + exit code), and `slim --version` prints a semver ≥ 0.23.0 exit 0.
3. **Runner + truth contract** (spec §2): spawn fixed path, capture stdout (16 MiB cap), inherit stderr/stdin, filter only on exit 0, raw-passthrough on parse fail / nonzero / cap, always propagate child exit code.
   - *Done when:* `T-EXIT-NONZERO`, `T-TRUTH-RAWPASS`, `T-STDERR-UNTOUCHED` pass (spec §7.4).
4. **Six filters** (spec §3.1–3.6): `ls`, `psdf` (ps 120×30, df 80×20), `wc`, `git_status`, `git_log`, plus `common.zig` (codepoint-aware truncate, row-cap marker, `humanize`).
   - *Done when:* goldens `T-GOLD-LS/PS/DF/WC` are byte-equal (spec §7.1); parser units `T-GS-PARSE`/`T-GL-PARSE` pass (spec §7.2); `T-TRUNC-MARK-PS/GL` and `T-UTF8-WIDTH` pass; the `[CONFIRM-VS-ORACLE]` constants (`MAX_PATHS`, clean marker, ps row/off-by-one) are locked via differential `T-DIFF-GS/GL/LS` against rtk (spec §7.3) — or documented as SKIP with the golden still green if rtk is unexpectedly absent.
5. **Hook-swap smoke + latency** (spec §7.5, §7.6): `test/hook-swap-smoke.sh` (operates on a COPY of the guard, never the real one) proving the six allowlisted rewrites fire and everything else passes through; `test/latency.sh` reporting `rewrite` p95.
   - *Done when:* smoke script passes all five cases in spec §7.5, and `rewrite` p95 < 10 ms is measured and recorded.
6. **Anti-spec coverage + `T-NO-VERB`** (spec §7.4 matrix): confirm no `diff`/`find`/`grep`/`cat`/`read`/`head`/`tail` verb exists and each maps to a passing test.
   - *Done when:* the anti-spec coverage matrix in spec §7.4 is fully green (every rtk catalog bug → ≥1 passing test).

All four DoD gates (spec §8) must hold: (1) `zig build test` green, (2) reject-shapes exit 1 / accept-shapes exact, (3) `rewrite` p95 < 10 ms, (4) no telemetry/persistence/config/network by inspection.

## Tower
Board topic: `agent-core/rtk-clone`. If your harness has the tower board tools (`board_post`/`board_read` via `~/.tower/cli.mjs` or MCP), post: a `claim` at start ("impl phase, writes only primitives/tools/slim/ + briefs/rtk-clone/fixtures/"), a `finding` when `zig build test` first goes green (one-line shape), and a final `finding` starting `DONE IMPL:`. If you do **not** have those tools, skip intermediate posts and rely on the report-back — **do NOT hand-roll JSONL appends to `board.jsonl`** (a prior fallback scrambled fields and wrote a stray file).

## Report back with
Final message must carry: the built binary path (`zig-out/bin/slim`) and confirmation `zig build test` is green; the golden/differential results (which passed byte-equal, which `[CONFIRM-VS-ORACLE]` constants you locked and to what values); the measured `rewrite` p95 + wrapper overhead; the anti-spec coverage matrix status; any deviation from the spec with its reason; and the final impl LOC vs the ~750 estimate.

## Report-back marker (LAST action, only after all task done-whens + the four DoD gates hold)
`touch ~/agent-core/briefs/rtk-clone/impl.done`
