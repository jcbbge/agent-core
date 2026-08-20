# PROMPTS — paste-ready injection per brief

One prompt per orchestrator. Start slate in the repo named in the brief's header,
then paste the matching block. Launch:

```bash
cd ~/agent-core          # ~/circadian for the sleep-queue brief
slate --dangerously-skip-permissions
```

Every prompt carries the same three things: the ORCH profile, the brief, and the
wave context. Nothing about the terminal multiplexer — you spawn your own
subagents however slate does it.

---

## 1. registry-vcs — RUN THIS FIRST, ALONE

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: put the agent-core registry under version control.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md — the shared contract
   for this wave. Binding on you.
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-registry-vcs.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — the law you are recording
   in task 5.

Context: on 2026-08-20 an audit found the memory substrate's read binding dead in
three of five harnesses while its write bindings fired everywhere — memory was
accumulating that nothing read. The structural cause was that a capability with no
registry row cannot fail an audit. Ten sibling orchestrators are closing those
gaps, and four of them append rows to ~/.agent-core/registry concurrently. That
file has no version control, so a lost write today is silent and unrecoverable.
You run first and alone. Nothing else starts until you land.

The ruling is already made in your brief: git init in ~/.agent-core. Do not
redesign it. Do not move the file, symlink it, or add a CLI flag.

Decompose, dispatch your own subagents as you see fit, verify every done-when with
real command output, commit on your branch, then report per the brief.
```

---

## 2. tool-rows

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: close the tool/ coverage gap — eight installed binaries have no
registry row.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-tool-rows.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — read the law at the top.
4. /Users/jrg/agent-core/primitives/COMPONENTS.md — gap 2 is yours.

Context: this machine's search tooling was unbundled from a retired router into
five utensils called by name. Four of the five have a skill instructing agents to
run a binary that nothing verifies exists. Your brief contains a real design
problem — the `binary` verb checks freshness against a source tree, and vendor
CLIs have no source tree in the store. Read cli/src/presence.zig and decide from
the code what an honest row looks like. Do not invent a verb. If the grammar
cannot express presence-without-freshness, that finding is worth more than a
wrong row.

Sibling orchestrators are appending to ~/.agent-core/registry at the same time as
you. Follow CONTRACT.md's registry rules exactly: back up, append only your own
block, re-read immediately before writing.

boot-card and statem are NOT yours — a sibling owns them. Add no rows for them.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 3. muster-rows

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: register muster, the live fleet coordination runtime, which
today has exactly one registry row and that row is documentation.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-muster-rows.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — the coverage-vs-ownership
   distinction is the key to your verb choice.
4. /Users/jrg/agent-core/primitives/skills/muster/SKILL.md — what muster is.

Context: muster owns the spawn door and the deposit door. Every spawn on this
machine is forced through ~/muster/bin/muster-spawn by an enforcement hook, and
every fleet message moves through muster-deposit. If muster-spawn vanished, the
audit would stay green while every spawn failed. agent-core does not author
muster, so you register coverage, not ownership: check and binary, never deploy.

Sibling orchestrators are appending to ~/.agent-core/registry concurrently.
Follow CONTRACT.md's registry rules exactly.

Do not modify rule/worktree-teardown-spine — it was retargeted to muster-spawn
earlier today and it passes. Do not create a symlink or shim to put `muster` on
PATH; if the evidence says it should be there, that is a finding, not a fix.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 4. bigfile-mcp

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: register the bigfile MCP surface so a harness that loses it
fails an audit instead of failing an agent mid-task.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-bigfile-mcp-row.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md
4. /Users/jrg/agent-core/primitives/tools/README.md — what bigfile is.

Context: a hook actively denies native reads of 3k+ line PHP/JS/TS/TSX files and
redirects agents to bigfile's MCP tools. That redirect is only sound if the MCP
server is actually registered — and nothing checks. The registry has no `mcp`
verb, so you will express this as a config-needle check. Your brief names two
hazards to verify rather than assume, including how the CLI reads a large
machine-generated JSON config.

Your brief requires you to PROVE the row can fail: break the needle, capture the
✗, restore it, capture the ✓. A row you never saw fail is not evidence — that is
the exact failure this wave exists to correct.

Sibling orchestrators are appending to ~/.agent-core/registry concurrently.
Follow CONTRACT.md's registry rules exactly.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 5. localllm-row

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: register the local LLM service dependency that the memory
substrate needs in order to consolidate.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-localllm-row.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — the law at the top.

Context: the memory substrate calls a local OpenAI-compatible service to draft
during its sleep and REM cycles. If that service is down, memory stops
consolidating silently. There is no row asserting the dependency.

This is the smallest brief in the wave and it contains the sharpest trap. A
registry row asserts facts about FILES; it cannot make an HTTP request, so it
cannot prove a service is listening. Your deliverable is a row that is honest
about its own limit. A row that overstates what it verifies is worse than no row —
it launders absence as coverage. Naming the limit precisely IS the work. Do not
invent a verb and do not extend the CLI.

Sibling orchestrators are appending to ~/.agent-core/registry concurrently.
Follow CONTRACT.md's registry rules exactly.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 6. circadian-skill

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: author the skill for the circadian memory substrate, which has
six CLI entrypoints, bindings in five harnesses, three background services — and
no skill at all.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-circadian-skill.md — your brief.
3. /Users/jrg/circadian/mind/MIND-SPEC.md — the substrate's law. Law 7 especially.
4. /Users/jrg/agent-core/primitives/skills/agentcore/SKILL.md — written this
   session; the shape and register to match.
5. /Users/jrg/agent-core/primitives/COMPONENTS.md — circadian's row and gap 3.

Context: on 2026-08-20 this substrate's memory-READ binding was found dead in
three of five harnesses while its WRITE bindings fired everywhere. It accumulated
memory that nothing read, for days. It was caught by the operator noticing an
absence, not by any agent, because no agent had been told how to look. Your skill
is the thing that would have caught it — so the write-vs-read asymmetry and the
status-banner trap described in your brief are the heart of it, not footnotes.

Every fact in the skill must be one you acquired this session by reading the file
or running the command. Do not restate MIND-SPEC.md; point at it.

Hard boundary: never hand-edit anything under ~/circadian/mind/. That is the
operator's private memory, a git repo with no remote, by design. And do not fix
the stuck sleep-queue entry — a sibling orchestrator owns it.

Your brief requires you to dogfood the skill: follow it cold to answer "is memory
live in claude-code?" and paste the transcript. If your own skill cannot answer
that in a handful of commands, it is not done.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 7. tower-evidence

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: gather the evidence for a ruling on Tower, which is documented
as retired and is simultaneously load-bearing.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-tower-evidence.md — your brief.
3. /Users/jrg/agent-core/primitives/COMPONENTS.md — gap 5 is yours.
4. /Users/jrg/agent-core/primitives/HARNESS-PARITY.md — its Tower rows.

Context: Tower is called retired in the global directive, its deployed skill is a
stub that says "DEAD", and the brief skill carries a TOWER-WAIVED clause. At the
same time it has eleven live hook bindings, a registered MCP server, a CLI on
PATH, and twelve passing registry rows. Retired-but-load-bearing is the worst
state a component can occupy: nobody maintains it and everything depends on it.

This is an EVIDENCE brief. Change no bindings, remove no rows, unwire nothing,
migrate nothing. If you find something actively broken, report it — do not fix it.
The deliverable is a finding document whose first paragraph is sharp enough for
the operator to rule from in one read, with two or three named options and a
recommendation.

The question that matters most: is the write-gate bound at ~/.tower/hooks/ the
same enforcement as primitives/hooks/write-gate*, or a second one? A gate
existing twice may be enforcing inconsistently.

Decompose, dispatch your own subagents, verify with citations, commit the finding
on your branch, then report per the brief.
```

---

## 8. tools-fate

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: gather the evidence for a build-or-deprecate ruling on two
authored tools that have source in the store and no installed binary — boot-card
and statem.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-tools-fate.md — your brief.
3. /Users/jrg/agent-core/primitives/tools/README.md — what _deprecated/ is for.
4. /Users/jrg/agent-core/primitives/COMPONENTS.md — read the LINEAGE LAW at the
   bottom; it governs any deprecate recommendation you make.

Context: because neither tool has a registry row, it is currently impossible to
tell "never built" from "built once and silently broken." That ambiguity is the
defect. statem is a special case worth thinking carefully about: it is actively
documented as part of the observability surface and is invoked by interpreter
rather than as a compiled binary, so decide whether `tool/` is even the right
primitive type for it or whether the real gap is that nothing asserts the script
exists.

This is an EVIDENCE brief. Install nothing to PATH, move nothing to _deprecated/,
add no registry rows. You MAY build inside your worktree to test whether a tool
builds — that is evidence. If you recommend deprecating, your finding must include
paste-ready lineage text so the ruling is one step from execution.

statem's files are being edited by another session right now. Read-only. Do not
stage, revert, or fix them.

Decompose, dispatch your own subagents, verify with real command output including
failures, commit the finding on your branch, then report per the brief.
```

---

## 9. sleep-queue — start slate in ~/circadian, NOT ~/agent-core

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: gather the evidence for a ruling on a stuck pending-sleep queue
entry in the circadian memory substrate.

Your repo is /Users/jrg/circadian. Your worktree comes off that repo and your
commits land there — not in agent-core.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md — note the repo
   difference.
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-sleep-queue-evidence.md — your
   brief.
3. /Users/jrg/circadian/mind/MIND-SPEC.md — Law 7 binds you.

Context: circadian-doctor reports one hard FAIL — entry
0754fda7-3587-40be-8528-5a51c638a7e2 has survived multiple REM drains and is
marked as needing a human decision. Sleep is how a session's experience becomes
durable memory, so this is one session's experience sitting unconsolidated.

Start by reading briefs/pending-sleep-selfheal/done/orch-pending-sleep.done — a
prior orchestrator appears to have already worked this exact problem, and that
marker may contain the analysis you would otherwise redo. Summarize what it
established rather than rediscovering it. A dead-letter self-heal path was also
built at commit 85ed43b; determine whether it failed to fire for this entry or
fired and deliberately escalated.

This is primarily an EVIDENCE brief. Do not discard or hand-edit the entry. Never
hand-edit anything under mind/. Do not disable the doctor check to make the FAIL
go away. You may fix a clear code defect only if the fix is small and the full
test suite stays green, and you must state before/after counts.

Decompose, dispatch your own subagents, verify with citations, commit on your
branch, then report per the brief.
```

---

## 10. opencode-onboard

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: onboard opencode's binding surface. It is a registered harness
that receives skills and a directive but has zero lifecycle capabilities — no
memory at wake, no guards, no gates, no session capture.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-opencode-onboard.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — IN FULL. It is the contract
   you are mapping opencode onto and it carries the fourteen-question interview
   that is the core of your task.
4. /Users/jrg/agent-core/primitives/hooks/session-boundary-cursor.sh — the best
   reference adapter. Its header documents how its injection contract was
   established by local repro. Read that header carefully.

Context: on 2026-08-20 an audit of the memory substrate across five harnesses
found opencode had no wiring whatsoever. It is the only registered harness with no
binding surface at all.

The single most important instruction in your brief: establish the injection
contract EMPIRICALLY. Write a throwaway hook that dumps its stdin to a file, bind
it, start a session, read what actually arrived. Do not assume opencode uses the
same envelope as any other harness. Assumed schemas are exactly how bindings end
up silently dead — which is the failure this whole wave exists to correct.

Prioritize the wake capability above all others. If you get exactly one binding
live, make it that one, legs 1-3 before leg 4.

Report your capability→event mapping table as a question deposit BEFORE writing
registry rows, then continue with the file-surface work while you await
confirmation. Do not block.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```

---

## 11. slate-onboard

```
You are an ORCHESTRATOR (ORCH). Read and assume the role defined in
/Users/jrg/agent-core/primitives/profiles/orchestrator.md.

Your unit of work: onboard slate — the harness you are running in. It is
registered for its file surface only and has no binding surface at all.

Read in this order, in full:
1. /Users/jrg/agent-core/briefs/agentcore-wave/CONTRACT.md
2. /Users/jrg/agent-core/briefs/agentcore-wave/orch-slate-onboard.md — your brief.
3. /Users/jrg/agent-core/primitives/HARNESS-SHAPE.md — IN FULL. It is the contract
   you are mapping slate onto and it carries the fourteen-question interview that
   is the core of your task.
4. /Users/jrg/agent-core/primitives/hooks/session-boundary-cursor.sh — reference
   adapter for a single-config harness; read its header on how the injection
   contract was established by repro.

Context: slate receives skills, subagents, and a composed directive, but has no
hooks line in its profile and therefore no memory at wake, no guards, no gates.
You are the harness auditing itself, which is an advantage — you can determine
real behavior by observation rather than from documentation alone.

Two specifics already found and worth your attention. First, slate's registry
profile claims agents live at ~/.config/slate/agents, but the directory present on
disk is skills/ — verify whether agents/ exists at all, because that may be an
unverified assumption in the existing profile. Second, slate's model-slot concept
(main / search / subagent / program-search / program-execute) and its own subagent
spawning have no analogue in the other five harnesses; record them in the delta.

Establish the injection contract EMPIRICALLY — throwaway hook, dump stdin, bind,
start a session, read what arrived. If slate has no hook mechanism at all, that is
a legitimate and important finding: say so plainly and say what it would need,
because the answer decides whether slate can ever carry memory at wake.

Report your capability→event mapping table as a question deposit BEFORE writing
registry rows, then continue with the file-surface work. Do not block.

Decompose, dispatch your own subagents, verify every done-when with real output,
commit on your branch, then report per the brief.
```
