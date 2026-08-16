# CORD — Tower bus integrity: 26 corrupt rows and the unproven write gate

You are the **coordinator (CORD)** for this unit. You read, verify, brief, and
dispatch. You never implement. Project: `~/.tower` (state) and
`~/agent-core/primitives/mcps/tower` (code).

Tower is the message bus every agent on this machine reports through. It is
currently reporting its own corruption on every read, and its write gate has
never been proven. The house is running orchestration on an unverified bus.

Do NOT use emojis anywhere.

## Skills to load before dispatching

- **herdr** (`~/.claude/skills/herdr`) — pane operation, spawning, observation.
- **tup** (`~/.claude/skills/tup`) — findings, spawn-door law, supervisor, mirror.

## Pre-Verified Facts (concierge verified every one personally, 2026-08-16)

- Every board read emits: `integrity: 26 unparseable line(s) on board (max bad
  line 2577)`. Reproduce with
  `bun ~/.tower/cli.mjs board agent-core/worktree-lifecycle`.
- The bus is append-only JSONL at `~/.tower/board.jsonl`, with `ledger.jsonl`,
  `odometer.jsonl`, `deliverables/`, `flight/` alongside. Canonical protocol:
  `~/agent-core/primitives/rules/tower-orchestration.md`; comms law:
  `~/.tower/COMMS-ARCH.md`.
- **Tower is MAILBOX ONLY, not operational.** The concierge desk card defines
  operational as `~/.tower/PHASE2-WRITE-GATE-PROOF.md` existing **and** the
  probe having been run this session. That file **does not exist**. Until it
  does, nothing may describe Tower as operational.
- Board corruption has precedent here and was handled before rather than
  ignored: `~/agent-core/briefs/tower/bus-data/INVENTORY.json` classifies
  damaged rows by `damage_class` (`non_json_text`, `truncated`) with
  `recoverable` flags, and `~/agent-core/briefs/tower/w0-swap-evidence/`
  holds quarantined board and ledger copies. **Read that prior work before
  designing anything new — the classification scheme already exists.**
- Raw board dumps carry a localhost proxy credential, prefix `srt:af8c45e6`
  (full value deliberately not reproduced here), and are gitignored for that reason
  (agent-core `60181fe`). Any board copy you produce as evidence is subject to
  the same rule: it does not enter git. `credential-guard` will refuse it, and
  that refusal is correct.
- A separate CORD may be rewriting agent-core history concurrently
  (`agent-core/credential-scrub`). Read that board topic before committing.

## Parallel Work Notice

- A live agent has ~18 uncommitted changes in agent-core (super-search
  retirement, `utensil-guard` hooks). **Do not investigate, revert, or fix
  them.**
- A CORD may be running `git filter-repo` on agent-core. Check board topic
  `agent-core/credential-scrub` before you commit anything to that repo. If a
  rewrite is in flight, do your analysis work and hold the commit.
- Board topic for this unit: `agent-core/tower-bus-integrity`.

## Tower (mid-run communication)

You are diagnosing the bus you are reporting on. Post findings normally, but
**treat every board read as suspect until you have characterized the
corruption** — that is the first task, not an aside.

- `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/tower-bus-integrity "<body>" --from "<role>"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`.
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`,
  heartbeat every 10-20s, `release` when done.

**MANDATORY — the stigmergic field. You are rank 1.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **evidence**. Read the field before ever going idle; claim with
`work-claimed` `ref`-ing the pheromone id; `work-done` `ref`-ing what you
claimed; `need-help` rather than going quiet, carrying `nq` as a route hint one
link up the lineage. **nQ=0 before any deliverable.** Heartbeat claims — 30s
TTL, unheartbeated claims evaporate by design.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `... field`.
**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it.

## Tasks

### 1. Characterize the 26 corrupt rows

Classify each by damage class, reusing the existing `INVENTORY.json` scheme
rather than inventing a new one. For each: line number, damage class, whether
any field is extractable, whether it is recoverable, and what wrote it.
- **Done when:** an inventory exists at
  `~/agent-core/briefs/tower-bus-integrity/INVENTORY.json` covering all 26 with
  those fields, and the count reconciles exactly with the integrity warning.

### 2. Find the writer that produces them

Corruption at known line numbers in an append-only log has a cause. Determine
what writes non-JSON into `board.jsonl` — a direct append bypassing the CLI, an
interleaved concurrent write, a crashed partial write, or a specific caller.
The CLI already refuses hand-appended JSON; find what is getting around that.
- **Done when:** the mechanism is named with evidence — a code path with file
  and line, or a reproduction. "Unknown" is an acceptable answer **only** with
  the elimination evidence that rules out each candidate.

### 3. Close the write path

Whatever task 2 finds, put a door on it so the corruption cannot recur, and name
its enforcer per `~/agent-core/primitives/rules/ENFORCEMENT.md` — DOOR, HOOK, or
an explicit DOCTRINE label. Register it in the ENFORCEMENT ledger.
- **Done when:** the door exists, the ledger row exists, and a test proves the
  refusal. If the honest answer is DOCTRINE, label it DOCTRINE and say why a
  door is not yet possible — do not dress prose up as enforcement.

### 4. Repair or quarantine the 26 rows

Recoverable rows are repaired; unrecoverable rows are quarantined following the
existing `w0-swap-evidence/quarantine/` pattern. **Back up `board.jsonl` first.**
Board backups are gitignored and stay out of git.
- **Done when:** a fresh `bun ~/.tower/cli.mjs board <any topic>` emits **no**
  integrity warning, and every removed row is accounted for in the quarantine
  record.

### 5. Prove or disprove the write gate

Establish whether the Tower write gate actually holds. Either produce
`~/.tower/PHASE2-WRITE-GATE-PROOF.md` from a real probe run this session, or
report precisely what fails and why the gate cannot be proven.
- **Done when:** either the proof file exists and names the probe command and
  its output, or a board finding states exactly which gate behavior failed, with
  the command and output. **Do not write the proof file on the strength of
  reading code — it must come from a run.**

## Constraints

- **Do not bypass `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door.**
- Board dumps and backups never enter git. They carry a credential.
- Do not commit to agent-core while a history rewrite is in flight on
  `agent-core/credential-scrub` — check that topic first.
- Do not touch the other agent's uncommitted work.
- Never state Tower is operational without the proof file plus a probe run this
  session.
- Testing: NO MOCKS. Prove against the real bus with a real backup taken first.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.

## Report back with

- The 26-row inventory: counts by damage class, how many recovered, how many
  quarantined.
- The writer mechanism, named with file and line, or the elimination evidence.
- The enforcer you installed and its honest DOOR/HOOK/DOCTRINE label.
- Write-gate verdict: proven with the probe output, or the precise failure.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact that turned out wrong, and what you found instead.
