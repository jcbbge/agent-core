# ORCH [author the circadian skill]

slug: `circadian-skill` · branch: `wave/circadian-skill` · depends on: `orch-registry-vcs` landing first

Read `CONTRACT.md` in this directory first.

## Mission

Circadian is the memory substrate for every agent session on this machine: six
CLI entrypoints, four lifecycle hook bindings across five harnesses, three
launchd services, and a paragraph of the composed directive. It has **no skill.**
No agent knows how to inspect it, interpret it, or repair it.

On 2026-08-20 its memory-READ binding was found dead in three of five harnesses
while its memory-WRITE bindings fired everywhere — the substrate accumulated
memory nothing ever read, for days. It was found by the operator noticing an
absence, not by any agent, because no agent had been told how to look. Write the
skill that would have caught it.

## Pre-Verified Facts (verified 2026-08-20)

**Home:** `~/circadian` (git repo, branch `main`). `CIRCADIAN_HOME` overrides the
path; the mind data lives at `$CIRCADIAN_HOME/mind`.

**CLI entrypoints** — `~/circadian/package.json` `bin` block:
`circadian-wake` → `src/wake.ts`, `circadian-sleep` → `src/sleep.ts`,
`circadian-rem` → `src/rem-popmem.ts`, `circadian-graze` → `src/graze.ts`,
`circadian-status` → `src/status.ts`, `circadian-doctor` → `src/doctor.ts`.
Note: these bin names are **not currently on PATH** — confirm and record how they
are actually invoked (`bun ~/circadian/src/<x>.ts`).

**Lifecycle bindings, as of this session:**

| Capability | claude-code | cursor | pi / prime |
|---|---|---|---|
| wake (memory READ) | `SessionStart` → `src/wake.ts` | leg 4 of `primitives/hooks/session-boundary-cursor.sh` | `circadian-mind.ts` extension shim |
| graze (WRITE) | `PostToolUse` + `UserPromptSubmit` | `preToolUse` | same shim |
| sleep (WRITE) | `SessionEnd` | `sessionEnd` | same shim |
| status line | `SessionStart` → `src/status.ts --line` | — | — |

**Registry rows** (all ✓): `hook/circadian-wake`, `hook/circadian-sleep`,
`hook/circadian-graze`, `hook/circadian-status`, `hook/circadian-mind-pi`,
`hook/circadian-mind-prime`.

**Services:** `~/Library/LaunchAgents/com.circadian.rem.plist` (09:00 + 21:00),
`com.circadian.rem-catchup.plist` (`--if-due` at login/restart),
`com.circadian.doctor.plist`.

**Health:** `bun ~/circadian/src/doctor.ts` → `12 ok, 3 idle, 1 warn, 1 fail`.
The FAIL is a stuck pending-sleep entry; a sibling orchestrator
(`orch-sleep-queue-evidence`) owns that investigation — **do not fix it**, but DO
make sure your skill teaches an agent how to find and read it.

**The trap that hid the outage:** the one-line status banner at session start
(`circadian · wake 2.8d ago · self 5284/6000 · ...`) comes from
`src/status.ts --line`, **not from wake**. It reports on the mind's contents, so
it prints happily while nothing is reading the mind. Any diagnostic that treats
that banner as proof of a working substrate is wrong. This must be in the skill.

**Spec:** `~/circadian/mind/MIND-SPEC.md`. Law 7 — file reads only; the mind must
never take a session down with it. Wake ALWAYS delivers; obs events are telemetry
and never block. Observability ledger: `~/circadian/logs/circadian.events.jsonl`.

**Skill conventions:** study `~/agent-core/primitives/skills/agentcore/SKILL.md`
(written this session, same shape you need) and `skills/install/SKILL.md`. Skills
carry YAML frontmatter: `name`, `description` (trigger phrases matter — this is
what makes the skill fire), optional `argument-hint`,
`disable-model-invocation`, `allowed-tools`.

Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives/skills`.
2. Read the substrate before describing it: `mind/MIND-SPEC.md`, `src/doctor.ts`,
   `src/status.ts`, `src/wake.ts`, and the obs ledger. Run `doctor.ts` and
   `status.ts` yourself and record real output. **Every fact in the skill must be
   one you acquired this session.**
3. Write `~/agent-core/primitives/skills/circadian/SKILL.md`. It must let an agent:
   - explain what circadian is and where its data lives;
   - run a health check and **interpret** the result — what `ok/idle/warn/fail`
     mean, and what to do about each;
   - answer "is memory actually working in this harness?" — which specifically
     means checking that the READ binding is live, not just that the banner
     printed. Teach the write-vs-read asymmetry explicitly, with the 2026-08-20
     outage as the worked example;
   - locate and read the obs ledger to see decision points rather than guessing;
   - know the repair path (`~/circadian/install.sh` is idempotent and
     non-destructive: it leaves an existing `mind/`, existing launchd jobs, and
     existing hooks alone, and only fills gaps);
   - know the hard boundary: **never edit `mind/` contents by hand.** That is the
     operator's private memory and it is a git repo with no remote, by design.
4. Keep it a *skill*, not an encyclopedia. Point at `MIND-SPEC.md` for spec detail
   rather than restating it. Do not name any provider or model.
5. Register `skill/circadian` in `~/.agent-core/registry` with `deploy` to all six
   harnesses — claude-code, pi, cursor, prime-agent, opencode, slate — matching
   the `skill/agentcore` block added this session.
6. `agent-core sync skill/circadian`, then `agent-core status`.
7. Update `primitives/COMPONENTS.md`: circadian's Skill column, and delete gap 3.
8. Commit. Deposit `done`.

## Done-when

- `primitives/skills/circadian/SKILL.md` exists, with frontmatter whose
  `description` carries real trigger phrases.
- `skill/circadian` registered and deployed to **all six** harnesses; paste the
  six ✓ sync lines.
- `agent-core status` → 0 stale, 0 missing, and at least 360 ok. Paste it.
- The skill explicitly documents the status-banner trap and the read/write
  asymmetry. Quote the passage in your report.
- **Dogfood it:** follow your own skill from a cold start to answer "is memory
  live in claude-code?" and paste the transcript of what you ran and concluded.
  If your own skill cannot answer that in a handful of commands, it is not done.
- `COMPONENTS.md` gap 3 deleted, committed on `wave/circadian-skill`.

## Report-back

Deposit `done` to `concierge` with the summary line, the six sync lines, the
quoted trap passage, and your dogfood transcript. Write
`orch-circadian-skill.md.done`.
