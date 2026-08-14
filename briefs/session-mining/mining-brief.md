# SESSION MINING — verb inference + optimization insights from real transcripts

## Mission
Mine real past conversations from BOTH harnesses (Claude Code + pi) to answer three questions with data, not intuition: (1) which command verbs, beyond slim's six (ls, ps, wc, df, git status, git log), actually occur frequently enough AND produce enough output bytes to be worth a compaction filter; (2) what other optimizations does real usage reveal (repeated waste, retry loops, oversized tool results, hook friction); (3) what other insights fall out of the data. Context: `slim` (a 6-verb Zig output-compactor replacing rtk) is being built right now from `~/agent-core/briefs/rtk-clone/spec.md`; your findings feed its v2 verb table and the wider workflow-hardening effort (`~/agent-core/AUDIT-2026-08-11-refiners-fire.md`).

RESOURCE LAW (operator-mandated): process in batches — **10 sessions per harness, then a second batch of 10 per harness** — never all at once. Extract with scripts (python3/jq) that write aggregate CSV/JSON to your scratch dir; NEVER read raw transcript bodies into your context (they are MBs each). Read only your own aggregates. Sequential batches, no parallel subprocessing beyond one script at a time.

## Pre-Verified Facts (verified by the coordinator just now)
- Claude Code transcripts: `~/.claude/projects/<sanitized-cwd>/*.jsonl` — 418 files >100KB machine-wide. Structure: JSONL; assistant lines carry `message.content[]` entries with `type:"tool_use"`, `name:"Bash"`, `input.command`; tool results appear as `type:"tool_result"` content (inspect ONE file's line shapes with a script before writing the extractor — do not assume beyond this).
- pi transcripts: `~/.pi/agent/sessions/<sanitized-cwd>/*.jsonl` — 287 files >100KB. Different line schema from CC; inspect one file first, same script-only rule.
- EXCLUDE: any transcript modified in the last 30 minutes (live sessions, including the coordinator's and the slim builder's), and anything under `-private-tmp*` project dirs (test junk).
- Selection: most recent first, real project dirs preferred (`--Users-jrg-*` / `-Users-jrg-*`), aim for cwd diversity across the 10.
- slim's current 6 verbs + measured savings: ls -la 78%, ps aux 98%, git status 62-80%, git log 61%, wc 90%, df 12%. Known rewrite-refusals by design: pipes, compounds, heredocs, substitution, machine-format flags (`--porcelain`, `--format`, `-c`).
- rtk history for cross-reference: rtk's own SQLite ledger claims read=3,881 calls / grep=4,803 calls historically but measures ~0% real savings on those verbs — transcript data can confirm or refute what rtk's ledger claims.
- Scratch space for extraction scripts + aggregates: `/private/tmp/claude-501/-Users-jrg/de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/mining/` (create it).

## File partition — write ONLY under these
- Scratch: the mining/ dir above (scripts, CSVs, intermediates)
- Deliverable: `~/agent-core/research/session-mining-verbs.md` (one file)
Read-only everywhere else. Never commit. No git mutations (git log/show read-only is fine).

## Tasks
1. **Extractor**: inspect one CC + one pi transcript's line schema via script, then write one extractor per harness that emits, per Bash/bash tool call: command string, result byte-size (if recoverable), exit/error signal (if recoverable), session id, cwd. Output: CSV rows appended to `mining/commands.csv`. Done when both extractors run clean on 1 sample file each and the CSV schema is documented at the top of the deliverable.
2. **Batch 1 — 10 CC + 10 pi sessions** (selection rules above). Aggregate: verb frequency table (first token after env/sudo stripping, plus subcommand for git/npm/bun/etc.), total + median output bytes per verb, top-20 by (frequency × bytes). Done when the batch-1 table exists in the deliverable with session ids listed.
3. **Batch 2 — next 10 + 10.** Re-run, merge, and note stability: which verbs held rank between batches (stable signal) vs appeared only in one (project-specific noise). Done when the merged table + stability column exists.
4. **Verb verdicts**: for each candidate verb NOT in slim's six, judge: compactable without semantic loss? (structured output? line-oriented? already terse?) — and give a verdict: ADD (with sketch of the filter rule + projected savings from real byte data), SKIP (reason), or HARNESS-SIDE (better solved by the harness's own tools, e.g. Read/Grep already replace cat/grep for CC agents — check whether pi agents show different patterns). Done when every top-20 verb has a verdict row.
5. **Optimization + insight sweep** (from the same data, script-driven): (a) retry loops — identical/near-identical commands repeated ≥3× in one session (what failed? what would have prevented it?); (b) oversized results — tool results >50KB: what produced them and would a filter/cap have helped?; (c) failure patterns — commands that consistently error across sessions (missing binaries, wrong flags, permission denials); (d) anything else the data surfaces that you did not go looking for — one section of genuine surprises. Done when each of a-d has findings with counts + at least one concrete recommendation, or an explicit "none found."
6. **Deliverable**: write `~/agent-core/research/session-mining-verbs.md` — method, batch tables, verdicts, optimization findings, and a final "slim v2 verb table" recommendation block. Done when the doc exists and every claim in it traces to a count or byte figure from your CSVs (no vibes).

## Tower
Post to board topic `agent-core/session-mining`: `claim` at start, `finding` after each batch (one-line: sessions processed + top verb), final `finding` starting `DONE MINING:`. Mechanism (any harness): `cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/session-mining "<body>" --from agnt-session-mining`. Never hand-roll JSONL appends to board.jsonl.

## Report back with
Final message carries: the merged top-20 verb table (condensed), the ADD-verdict list with projected savings, the top 3 optimization findings, and the surprises section. LAST action: `touch ~/agent-core/briefs/session-mining/mining.done` — only after all six done-when conditions hold.
