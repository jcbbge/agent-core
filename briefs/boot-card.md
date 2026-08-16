# BRIEF — boot-card: the session-start yes/no checklist, all harnesses

Mission: the operator cannot see which Session Boundary Contract legs
actually loaded when a session starts. Build the boot card: (A) a one-line
per-leg ✓/✗ stamp appended to each harness's injected context by its own
adapter, and (B) a standalone deep-audit command (`boot`) printing the full
checklist on demand. Deterministic, side-effect-free, cross-harness
(pi, claude-code, cursor). Do NOT use emojis in code or output beyond the
two glyphs specified. Do not commit — the coordinator gates.

## Pre-Verified Facts (lead verified personally, 2026-08-12)
- Contract + layer law: `~/agent-core/primitives/rules/session-lifecycle.md`.
  Legs at start: 1 Tower carry-over, 2 TODO handoff, 3 flight pointer (<24h,
  `~/.tower/flight/`), 4 memory (circadian).
- Adapters that will carry the per-leg stamp (all exist, all green today):
  - claude-code: `~/.tower/hooks/session-start.mjs` (legs 1-3) + circadian
    `~/circadian/src/wake.ts` (leg 4, separate hook — do NOT modify wake;
    the CC stamp covers legs 1-3 and reports leg 4 as "separate hook").
  - pi: `~/agent-core/primitives/hooks/session-boundary-pi.ts` (legs 2-3;
    leg 1 is tower-auto's, leg 4 circadian-mind's — same reporting rule).
  - cursor: `~/agent-core/primitives/hooks/session-boundary-cursor.sh`
    (legs 1-4, all in one script).
  Rule: an adapter stamps ONLY the legs it owns; legs owned elsewhere are
  marked with the owner's name, never guessed.
- Wake probe without side effects: `CIRCADIAN_INTERNAL=1 bun
  ~/circadian/src/wake.ts` exits 0 silently (verified this session) — proves
  runnability without payload, scoreboard rows, or token spend.
- Deep-audit checks and their evidence sources:
  - directive: entrypoint file exists and contains the composed marker
    (`<!-- agent-core: composed` …) — paths: `~/.claude/CLAUDE.md`,
    `~/.pi/agent/AGENTS.md`, `~/AGENTS.md`.
  - skills/registry: `~/agent-core/cli/zig-out/bin/agent-core status` tail
    line (expect `0 stale  0 missing`; current 214 ok).
  - tower: `bun ~/.tower/cli.mjs status` exits 0.
  - handoff: `git log --format='%h %s%n%b' -5` contains a `TODO:` line
    (report `—` honestly as "handoff: none declared").
  - flight: newest `~/.tower/flight/*.md` mtime < 24h.
  - memory: the CIRCADIAN_INTERNAL probe above.
  - wiring per harness: CC `~/.claude/settings.json` hooks contain
    session-start.mjs + wake.ts; pi `~/.pi/agent/extensions/` contains
    session-boundary.ts + tower-auto.ts + circadian-mind.ts; cursor
    `~/.cursor/hooks.json` sessionStart/sessionEnd/preCompact entries.
- Output style precedent: `starting-session` skill's orientation block
  (fixed-width, `━` rules). Glyphs: `✓` and `✗` only, one leg per line,
  reason after `✗`.
- VERIFY LAW (registry header + HARNESS-PARITY §Doctrine): new component =
  `VERIFY.toml` manifest + index-matched oracles BEFORE registration; runner
  = `component-verify` (`primitives/tools/component-verify/`, 6 components
  16/16 today — read `primitives/tools/component-verify/VERIFY.toml` as the
  exemplar).
- bun at `/Users/jrg/.bun/bin/bun`; wrapper precedent:
  `~/.local/bin/component-verify` honors `AGENT_CORE_ROOT`.

## Parallel Work Notice
Nothing else owns these files right now. Vein fixture files
(`primitives/tools/vein/test/acceptance/pass12*`) are another mission's
uncommitted work — ignore. Touch ONLY: `primitives/tools/boot-card/`
(new), the three adapter files named above, `~/.local/bin/boot` (new
wrapper), `~/.cursor/hooks.json` NOT touched (adapters already wired).

## Tower (mid-run communication)
Post CLAIM to board topic `agent-core/boot-card` first
(mcp__tower__board_post or the file-append fallback), findings for any
Pre-Verified Fact that proves wrong, and your `.done` last:
`briefs/boot-card.done` in your worktree.

## Tasks
1. `primitives/tools/boot-card/boot-card.mjs` (bun): `--harness
   pi|claude-code|cursor` (default: detect from env/entrypoint presence),
   runs the deep-audit checks above, prints the card — one `✓/✗` line per
   check with a terse reason, exit 0 if all ✓, exit 1 listing failures.
   Done when: run on this machine prints all ✓ for claude-code (or honestly
   reports a real ✗) and exit code matches the card.
2. Per-leg stamps in the three adapters: each appends ONE line to its
   injected output, e.g. `[boot] tower ✓ · handoff ✓ · flight ✗(none<24h) ·
   memory: circadian hook` — computed from what the adapter actually did,
   never re-derived. Done when: each adapter run standalone shows the stamp
   (CC: node/bun run with cwd; pi: handler smoke via fake ctx like the
   session-boundary acceptance did; cursor: `echo '{}' | bash …` and the
   stamp appears inside additional_context).
3. Wrapper `~/.local/bin/boot` → runs boot-card.mjs, honors
   AGENT_CORE_ROOT. Done when: `boot` from any cwd prints the card.
4. `primitives/tools/boot-card/VERIFY.toml` + oracles (contract lines: card
   exit code mirrors check results; stamps present in each adapter's
   output; probe is side-effect-free — assert scoreboard row count
   unchanged across a run). Done when: `component-verify tool/boot-card`
   PASS and `component-verify --all` stays green (now 7 components).
5. Update `briefs/component-verify.coverage.txt` via `component-verify
   --coverage`. Done when: file regenerated and committed on your branch.

## Constraints
- The deep audit must be SIDE-EFFECT-FREE: no wake payload runs, no board
  posts, no file writes outside its own output. A recorder never blocks: an
  adapter stamp failure must never break the adapter (wrap in try/catch —
  the stamp reports, it never gates).
- Match each adapter's existing style. No commits.

## Report back with
Card output verbatim from this machine; per-adapter stamp evidence
(command + tail); component-verify results (7/7 components); every file
created/modified; deviations with reasons.
