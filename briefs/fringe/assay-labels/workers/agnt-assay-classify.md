# AGNT assay-classify — classify + aggregate + propose (+ belief resolve)

You are agnt-assay-classify. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md` and obey
it. Do NOT use emojis anywhere.

Implement LLM classify, corpus aggregate (segmented), propose-only outputs,
and belief-id resolution helpers in `belief.zig`.

## Pre-Verified Facts (orch verified)
- Local LLM OpenAI-compatible: `http://127.0.0.1:10240/v1` (plist
  `~/dotfiles/launchagents/com.localllm.server.plist`).
- **THIS SESSION:** `curl --max-time 5 http://127.0.0.1:10240/v1/models`
  timed out with 0 bytes; launchd job listed. Expect classify degradation:
  emit hits as `UNCLASSIFIED`, exit code **5**, still write outputs. Never
  invent SHAPED/ECHOED/THEME-ONLY labels when LLM is down.
- Attribution rule (must appear verbatim in the prompt when LLM is up):
  `evidence must match THE ATOM'S OWN claim language, not merely its theme.`
- Labels: SHAPED | ECHOED | THEME-ONLY (map to hand P3/P2/P0 roughly:
  SHAPED≈P3, ECHOED≈P2, THEME-ONLY≈theme bleed; P0≈no hit).
- Aggregate per atom across corpus: injections, sessions-propagated
  (branching ratio), recency. Segment domain:
  - self-referential: session cwd under `~/circadian` OR wake-adjacent task
    text about the memory system
  - ordinary: everything else
- Propose: atoms below propagation floor over ≥N injections → PROPOSE
  retire; consistently propagating → PROPOSE promote; near-universal →
  flood warning. Output markdown + JSONL under `--out-dir`. **Never write
  to ~/circadian.** Read-only ok:
  `mind/beliefs/`, `mind/beliefs.jsonl`, `mind/render-manifest.json`,
  `mind/MIND-SPEC.md`.
- Belief id: sha256 hex[:12] of whitespace-normalized claim; match
  `beliefs/<id>.md` `claim:` field.
- `--decoys N`: sample N belief atoms NOT in session payload (from
  beliefs/ minus payload), run same pipeline; report FP rate every run.
- Exit 5 when LLM unavailable; degraded classified file still written.

## Parallel Work Notice
Peers own wake/match/golden. You own:
`src/classify.zig`, `src/llm.zig`, `src/aggregate.zig`, `src/propose.zig`,
`src/belief.zig`, plus minimal `pipeline.zig` wires for those stages and
README sections for classify/propose/exit 5 if missing.
Ignore peers' files.

## Tower
CLAIM/DONE: `circadian/memory-assay`, `--from agnt-assay-classify`.

## Tasks
1. `llm.zig`: HTTP chat completions client; probe `/v1/models` with short
   timeout; on failure return error that pipeline maps to exit 5.
2. `classify.zig`: for each evidence hit, call LLM (or UNCLASSIFIED); prompt
   includes attribution rule verbatim.
3. `belief.zig`: normalize + id + resolve against mind-dir.
4. `aggregate.zig`: per-atom stats + domain segment + decoy FP accounting
   hooks.
5. `propose.zig`: markdown + JSONL proposals only.
6. Wire stages in `pipeline.zig` for `assay run`.
7. `zig build && zig build test` green. Include at least one test that
   forces LLM-down path (e.g. bad port) → UNCLASSIFIED + error.LlmUnavailable
   without inventing labels.

## Constraints
- Touch ONLY your partition files (+ pipeline/README as noted).
- No commit. No writes under ~/circadian.
- No mock LLM success labels — real HTTP or explicit unavailable.

## Report back with
- LLM probe result this session
- exit-5 path proof
- aggregate/propose output schema
- files touched

## Done-when
Build+test green; board DONE;  
`touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-classify.done`
