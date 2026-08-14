# ORCH assay-build — build the memory-propagation instrument

You are the ORCHESTRATOR for one committed unit of work: build `assay`, the
memory-propagation instrument, from the design below. You plan, decompose,
dispatch AGNTs, gate, and report. You never write implementation code
yourself — AGNTs do. Board topic for all fleet mail: `circadian/memory-assay`.
Your first act is a CLAIM to that topic (`--from orch-assay-build`).
Questions route UP to the board, never to the operator.

## Why this exists (Phase 1 result, measured this session)

250 injected memory atoms + 25 decoys were hand-labeled across 5 pi session
transcripts. Verdict: propagation IS detectable above coin-flip (0/25 decoy
false positives; evidence lines personally re-verified by the coordinator).
STRATIFICATION IS THE KEY FINDING: propagation is heavy in sessions whose
work is about the memory system itself (~10-29% of atoms) and near-zero in
ordinary task work (~2%, 3/150 atoms, and those reactive to user pressure).
Label sheets (the golden test set — see Testing) live at
`/Users/jrg/agent-core/briefs/fringe/assay-labels/{s1..s5}.labels.jsonl` +
`.summary.md`.

## The instrument

`assay` — CLI at `/Users/jrg/agent-core/primitives/tools/assay/` (new dir;
Zig 0.16.0, macOS arm64, stdlib only + HTTP to the local LLM). Name law:
NO "molt"/"molting" words anywhere (operator rejected them). `assay` stays.

Pipeline (each stage a verb or internal stage — ORCH decides verb layout):

1. **wake-extract** — per session transcript (pi: `~/.pi/agent/sessions/*/*.jsonl`,
   wake = `{"type":"custom_message","customType":"circadian-wake"}` record,
   payload in `.content`; CC: `~/.claude/projects/*/*.jsonl`, wake =
   SessionStart hook `attachment.content`, may be a `<persisted-output>`
   pointer to `tool-results/hook-*-stdout.txt` — follow it). Parse the
   `<mind:self>...</mind:self>` block into atoms: every
   `**<claim>** — "<quote>" (<source>) [ep:...]` bullet is one atom;
   section headers VARY by render era (older: "Who I am across sessions";
   current: Doctrine/Motifs/How we work) — the bullet shape is the
   identifier. `<mind:constitution*>` / `<mind:user>` / `<mind:now>` are NOT
   atoms. Sessions with `KILL SWITCH ACTIVE` in the wake or no wake record
   are classified `dark` — excluded from propagation stats but COUNTED and
   reported (dark-rate is a first-class output metric; the entire recent CC
   corpus is currently dark).
2. **match** — for each atom, exact + whitespace/case-normalized phrase
   search over ASSISTANT-message text AFTER the wake record only. Hits
   become evidence rows: `{session, atom_hint, line, snippet}`.
3. **classify** — local LLM pass against the OpenAI-compatible endpoint
   `http://127.0.0.1:10240/v1` (plist:
   `~/dotfiles/launchagents/com.localllm.server.plist`): each hit →
   SHAPED (atom language drove a decision/refusal/pivot) | ECHOED (language
   reappears, no behavioral consequence) | THEME-ONLY (theme shared, words
   not the atom's own). The prompt must carry the attribution rule verbatim:
   "evidence must match THE ATOM'S OWN claim language, not merely its
   theme." UNVERIFIED as of this brief — the ORCH's first pre-verification
   is `curl -s http://127.0.0.1:10240/v1/models`. If the service is down or
   inadequate: classify degrades to emitting hits UNCLASSIFIED with a
   distinct exit code — never invent labels.
4. **aggregate** — per atom across the corpus: injections,
   sessions-propagated (branching ratio), recency. Segmented by domain:
   self-referential (session cwd under `~/circadian`, or wake-adjacent task
   text about the memory system) vs ordinary. Session cwd: pi v3 line 1
   `{"type":"session",...,"cwd":...}`; CC records carry `cwd`.
5. **propose** — atoms below a propagation floor over ≥N injections →
   PROPOSE retire (candidate for circadian's deliberate-act layer);
   consistently propagating → PROPOSE promote; near-universal reference →
   flood warning (trim injection). Output: markdown proposal + JSONL.
   assay NEVER writes to `~/circadian` — proposals only. The RENDER_FLOOR /
   decay arithmetic stays circadian's (`~/circadian/mind/MIND-SPEC.md` —
   read it; assay reads `mind/beliefs/` + `mind/beliefs.jsonl` +
   `mind/render-manifest.json` but writes nothing there).

Controls: `--decoys N` samples N belief atoms NOT in a session's payload
(from `~/circadian/mind/beliefs/` minus that payload) and runs them through
the same pipeline; the report includes the false-positive rate. FP rate is
the instrument's honesty metric — report it every run.

Atom identity: where possible resolve an atom to its belief id
(`~/circadian/mind/beliefs/<id>.md`, `claim:` field; id = first 12 hex of
sha256 of whitespace-normalized claim) so aggregation survives render
rewording; where unresolvable, key by normalized claim text and mark
`unresolved` — never guess an id.

## Reuse — do not rebuild the walk

`vein` (`/Users/jrg/agent-core/primitives/tools/vein/`, Zig 0.16, built and
tested today) already walks both corpora: `src/session.zig` exports
`discoverAll`, `selectLastN`, `resolveRef`, `parseSessionsFile`;
`src/lib.zig` exports the module set; `extract_pi.zig` / `extract_cc.zig`
know both JSONL schemas. Import vein as a build package or factor shared
code — do NOT fork divergent copies of the walk.

## Truth law (same as slim/vein)

Unparseable record, schema drift, missing LLM → literal `UNKNOWN` /
explicit skip-count, never invented numbers. Distinct exit codes:
0 ok · 2 usage · 3 I/O · 4 schema-UNKNOWN · 5 LLM-unavailable (degraded
output still written). No silent truncation anywhere.

## Pre-verified facts (the coordinator ran every one of these today)

- Pi wake record: `customType:"circadian-wake"`, full payload in `.content`
  (verified in 5 transcripts). CC wake: SessionStart `hook_success`
  attachment; >12.5KB payloads become `<persisted-output>` pointers to
  `<session-dir>/tool-results/hook-*-stdout.txt`.
- All 6 most recent CC sessions in `-Users-jrg-agent-core` are
  KILL SWITCH ACTIVE (atoms withheld) — expect a high dark-rate on CC.
- Pi session dirs begin with `--` (e.g. `--Users-jrg-circadian--`) — quote
  paths; `ls` needs `-- ` or `./` prefixes.
- Golden label set: 5 sessions, paths in
  `/Users/jrg/agent-core/briefs/fringe/assay-labels/brief-s{1..5}.md` tails,
  labels in `s{1..5}.labels.jsonl` (`present`, `label` P3/P2/P0, `decoy`).
- vein builds clean: `cd ~/agent-core/primitives/tools/vein && zig build`.
- Zig version pinned: 0.16.0 (`zig version` — verify before building).
- `agent-core sync` is FORBIDDEN repo-wide. Workers never commit; you
  integrate and the COORDINATOR commits.

## File partition

- assay code + tests + README: `~/agent-core/primitives/tools/assay/` ONLY.
- Design notes (if any): append to `~/agent-core/briefs/fringe/assay-labels/`
  as `design-notes.md`. Nothing else in any repo may be touched.
- `~/circadian` is READ-ONLY for this unit.

## Testing (no mocks — real data only)

The acceptance test: run assay over the 5 golden sessions and DIFF against
the hand labels. Required agreement, measured per session: presence
detection exact (present/absent per atom); SHAPED≈P3 recall ≥ the atom
level the labelers found (s1 ≥8 unique, s2 ≥3, s4 ≥1; s3/s5 zero-tolerance
for false SHAPED); decoy false-SHAPED rate 0/25 across the corpus. Report
precision/recall vs hand labels in the final report. If the LLM is too weak
to hit these numbers, say so with the measurements — that is a legitimate
finding, not a failure to hide.

## Done-when

1. `cd ~/agent-core/primitives/tools/assay && zig build && zig build test`
   green.
2. Golden-set diff report committed to the board as a finding (agreement
   numbers, FP rate, dark-rate observed).
3. README.md in the tool dir (build, verbs, exit codes, truth law).
4. Final board finding `DONE ORCH assay-build: <summary>` +
   `touch /Users/jrg/agent-core/briefs/fringe/assay-labels/orch-assay-build.done`.
5. Every AGNT you spawned reaped (done = gone).

Scale note: brainstorm estimate is ~400-600 LOC + LLM prompts, 6-10 h.
Fan out AGNTs (≤4 per fanout) as your decomposition dictates — suggested
split: walk/extract · match · classify+aggregate · golden-set test harness.
