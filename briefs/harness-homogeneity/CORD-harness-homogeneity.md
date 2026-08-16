# CORD — Harness homogeneity: one spine, every harness

You are the **coordinator (CORD)** for this unit. You read, verify, research,
plan, brief, and dispatch. You never implement. Your project spans
`~/herdr-spine` (the control plane), `~/cursor-shim` (the cursor bridge), and
`~/agent-core` (the canonical core and its law).

**The operator has ruled harness homogeneity NON-NEGOTIABLE.** This is not a
question to re-open, a tradeoff to weigh, or a preference to confirm. Your
mandate is to make it true. If you find a reason it cannot be fully true, that
is a finding to report with evidence — not a reason to narrow the goal.

The house claims to run a harness-agnostic fleet. It does not. One harness is
locked out of the machine's control plane by a single error string, and the
workaround forked a primitive into a directory that is designed to be deleted.
Everything downstream of that — worktrees reinvented twice, resource claims
missing on one harness, doors that exist on one side and not the other — is a
symptom of this one break.

Do NOT use emojis anywhere.

## Skills to load before dispatching

- **herdr** (`~/.claude/skills/herdr`) — pane operation, spawning, observation,
  notification.
- **tup** (`~/.claude/skills/tup`) — findings, spawn-door law, supervisor,
  mirror. The `socket/` seam contract; herdr is the runtime behind it today.

## Pre-Verified Facts (concierge verified every one personally, 2026-08-16)

**The control plane and who reaches it:**

- `~/herdr-spine/bin/` contains **19 entries**: `spine-spawn`, `spine-claim`,
  `spine-report`, `spine-workspace`, `spine-ruling`, `spine-fleet`,
  `spine-watch`, `spine-inbox`, `spine-wave`, `spine-choreo`, `spine-agent`,
  `spine-hook`, `spine-greeting`, `spine-sigil`, `spine-startup`, `spine-lab`,
  `spine-wormhole`, `ctl-fleet`, `handlers`. This is the machine's nervous
  system. It is not claude's or pi's — it is the general one.
- **Only 3 of the 19 mention `kind` or `harness` at all**: `spine-fleet`,
  `spine-inbox`, `spine-spawn`. Verified by
  `grep -ln 'kind\|harness' ~/herdr-spine/bin/spine-*`. The other 16 are
  already harness-agnostic and would serve cursor today, unmodified. **Confirm
  this yourself per-verb before relying on it** — the grep is a proxy, not a
  proof, and a verb can be harness-coupled without using either word.
- `~/herdr-spine/bin/spine-spawn:1470-1475` hard-refuses cursor:
  ```
  if getattr(args, "kind", None) == "cursor":
      log("error: cursor spawns do not go through spine-spawn — use the "
          "cursor-shim (~/cursor-shim/): cursor-fleet up|orch|worker|make|"
          "fanout, or cursor-spine for the atomic primitive. spine-spawn "
          "owns pi/claude kinds only (ruling 2026-08-11).")
      sys.exit(1)
  ```
  One refusal in one verb is the entire origin of the split.

**What the fork actually is:**

- `~/cursor-shim/cursor-spine` is **858 lines of bash** reimplementing the spawn
  primitive for cursor. `cursor-fleet` is 556 lines with verbs `up`, `orch`,
  `worker`, `make`, `fanout`. `cursor-finish` is 473 lines. Total 1,887 lines.
- Its genuinely cursor-specific surface is narrow: it EXECS `cursor-agent`
  (`cursor-spine:13`, binary resolved at `:60` via `CURSOR_AGENT_BIN`), resolves
  Cursor model slugs (`:519`), and works around `cursor-agent --worktree` having
  no sparse flag (`:369`). Nearly everything else — profile-to-label mapping
  (`:547-550`), role tokens (`:706`), pane/tab/workspace plumbing, worktree
  isolation — duplicates logic `spine-spawn` already has.

**The cost, which is the actual damage:**

- **cursor-shim references 1 of the 19 verbs.** `spine-report` appears in a
  single file. `spine-claim`, `spine-workspace`, `spine-ruling`, `spine-fleet`,
  `spine-watch`, `spine-inbox`, `spine-wave` — **zero references, every one.**
  Verified by `grep -rl` per verb across `~/cursor-shim`.
- Therefore cursor agents do not claim resources, do not pass through the
  workspace door, do not deposit rulings, and are not visible to `spine-watch`.
  They are second-class members of a fleet the doctrine calls homogeneous, and
  nothing in the system surfaces that.
- The concierge dispatched briefs earlier today instructing workers to use
  `spine-claim` for resource ownership. **On cursor that instruction is dead on
  arrival.** Treat any brief in `~/agent-core/briefs/` that names `spine-claim`
  as suspect for cursor workers until this unit lands.

**Where it is stored, which makes it worse:**

- `~/agent-core/primitives/AGENTS.md` describes cursor-shim as "self-contained,
  rip-out-able bridge... Delete the dir = integration gone." A spawn primitive
  currently lives there. Ripping out the shim does not remove an adapter; it
  removes a spine.

**The naming hid all of it:** `cursor-spine` reads as a peer of `herdr-spine` —
one spine per harness, symmetrical. It is a fork of one nineteenth of it. The
name asserts an architecture that does not exist.

**Tup already specifies the target architecture. Ground here FIRST.**

This is not a design you invent. `~/tup/contracts/` holds a written architecture
that this break violates clause by clause. Read `thesis.md` and `shape.md` in
full before planning anything.

- `thesis.md`: *"An agent is a durable object with an engine seated in it. The
  object is the agent... The engine is a process borrowed for one context and
  discarded. Tup is the durable half of every agent."* Harnesses are **engines**
  — the disposable half. Homogeneity is not a feature to bolt on; it is what
  falls out when the durable object stops knowing which engine is seated in it.
- `thesis.md`: *"No object may know which engine is seated in it. Profiles
  resolve to models at the seat, never in a spec; law is written once and
  adapted per engine, never forked."*
- `thesis.md` §What this rules out names the current state directly:
  *"Any component that works only because one particular engine is seated."* ·
  *"Any layer whose foundation is one particular runtime."* ·
  *"A second law body per engine, and a second transport per handler."*
  `cursor-spine` is a second law body per engine and a second transport per
  handler. Tup's own contract already forbids it, in writing.
- `shape.md` §`socket/` owns precisely the verbs currently duplicated: *"spawn ·
  address · send · read · wait-for-status · lifecycle events · tokens · claim ·
  observe"*, plus *"the spawn door, which stamps identity and org coordinates at
  birth, delivers the brief, verifies the submit landed, and registers the
  claim"*, plus *"adopt-and-release · reaping."*
- `shape.md` §`socket/` membership test: *"does it seat a caller-supplied
  program, in a caller-supplied environment, under an identity stamped at birth?
  A runtime that cannot is one Tup drives, never one Tup stands on."*
- `shape.md` §`kernel/` owns *"the per-engine capability table (can this engine
  take a message mid-turn? does it read its own context file natively?)"* —
  engine differences belong in a table in the law, not a forked script.
- `shape.md` §`kernel/` constraint, the diagnosis in one line: *"one canonical
  body with thin per-engine adapters; a forked law rots silently, because each
  fork stays plausible on its own."* That is exactly why this survived —
  `cursor-spine` reads perfectly reasonable on its own.
- `shape.md` §1: *"a seam written against one implementation is a description,
  so the socket is specified against two runtimes though only one is wired."*
  The seam was deliberately specified for more than one runtime. It is not wired.

**So the correct framing is NOT "make `spine-spawn` route cursor."** It is:
`spine-spawn` and `cursor-spine` are two competing partial implementations of a
seam already written down in `~/tup/contracts/`. Both should satisfy that
contract; neither should define it. Whether you wire the seam now or close the
split against it as an interim step is yours to rule in Unit 2 — but rule it
against the contract, not against convenience, and state plainly which you chose
and why.

`~/agent-core/primitives/AGENTS.md` already records the intent: *"Spawn-door law
(stamp identity, deliver brief, verify the submit landed) lives in tup
`socket/`; execution on this install is herdr + `spine-spawn`."* The law was
placed in tup. The execution forked anyway. That gap is your unit.

**Law you are working inside:**

- `~/agent-core/primitives/AGENTS.md` — provider/model/harness-agnostic by
  contract; no provider names outside `primitives/directives/<harness>.md`.
  Fleets are harness-homogeneous; the root spawn's harness defines the fleet.
- `~/agent-core/primitives/rules/ENFORCEMENT.md` — every law names its enforcer:
  DOOR, HOOK, or an explicit DOCTRINE label.
- `~/agent-core/primitives/HARNESS-PARITY.md` — parity table; an unwired gate
  reports as unwired, never as green.
- `~/agent-core/primitives/rules/worktree-lifecycle.md` — landed today
  (`e6167d0`); its ledger row is honestly marked DOOR+DOCTRINE because the
  spine-side reap exists but nothing invokes it. That residual is **in scope
  here**: it is the same disease.
- The 2026-08-11 ruling that produced the refusal is cited in the error string
  itself. A prior ruling is context, not a veto — the operator has ruled again,
  later, and homogeneity wins. Record the supersession explicitly rather than
  silently contradicting it.

## Parallel Work Notice

Two CORDs are live in `~/agent-core` right now. **Read their board topics
before you touch either repo.**

- `agent-core/credential-scrub` — running `git filter-repo` on agent-core and
  force-pushing three remote refs. **Do not commit to agent-core while a history
  rewrite is in flight.** Coordinate through the board.
- `agent-core/tower-bus-integrity` — repairing 26 corrupt board rows and
  probing the Tower write gate. The bus you are posting to is under repair;
  if a board read looks wrong, check that topic before concluding anything.
- A separate live agent holds ~18 uncommitted changes in agent-core
  (super-search retirement, `utensil-guard` hooks). **Do not investigate,
  revert, commit, or fix them.**

Your board topic: `agent-core/harness-homogeneity`.
Partition your workers so no two share a file. `spine-spawn` and `cursor-spine`
are the contended files — do not let two workers hold either concurrently.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md` does not exist;
the write gate is unproven and a peer CORD is currently probing it. Do not
describe Tower as operational.

- `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "<role>"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`.
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`,
  heartbeat every 10-20s, `release` when done. **Note the irony and the
  constraint: this verb works for you and not for a cursor worker. That gap is
  the thing you are fixing.**

**MANDATORY — the stigmergic field. You are rank 1.** Ranks 1-4 coordinate
through the environment, never by talking to each other directly. Emit
`work-available` with **mandatory evidence** — an emit without evidence is not
an emit. Read the field before ever going idle; claim with `work-claimed`
`ref`-ing the exact pheromone id; `work-done` `ref`-ing what you claimed;
`need-help` rather than going quiet, carrying `nq` (default 3 minus
escalations) expressed as a route derivation hint one link up the lineage,
never a hard address. **nQ=0 before any deliverable.** Heartbeat claims — TTL
is 30s and an unheartbeated claim evaporates by design, which is what protects
the fleet from a dead agent.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `... field`.
**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state.

## Tasks

This unit is **ground, research, plan, then coordinate** — in that order. Do not
let a worker touch `spine-spawn` before Unit 2 is written and ruled.

### Unit 0 — Ground in tup's contracts before anything else

Read `~/tup/contracts/thesis.md`, `shape.md`, `objects.md`, `ecosystem.md`,
`org-topology.md`, `roadmap.md`, and `amendments-2026-08-15.md`. Then answer, in
writing, against the socket contract's own verb list (spawn, address, send,
read, wait-for-status, lifecycle events, tokens, claim, observe, spawn door,
adopt-and-release, reaping):

1. For each socket verb: is it implemented in `spine-spawn`, in `cursor-spine`,
   in both, in neither, or elsewhere entirely? Cite file and line.
2. Which of tup's §What-this-rules-out clauses does the current state violate,
   with the specific artifact that violates each.
3. What is actually wired today versus specified — `shape.md` says the socket is
   specified against two runtimes with only one wired. Name what "wired" means
   concretely on this install and what would have to exist for a second runtime
   to satisfy the seam.
   - **Done when:**
     `~/agent-core/briefs/harness-homogeneity/TUP-GROUNDING.md` exists with a
     verb-by-verb implementation table, the violated-clause list with artifacts,
     and the wired-versus-specified answer. Every row cites a file and line.
     If tup's contracts turn out to contradict each other or the install, say
     so — `shape.md` states the thesis wins where they disagree.

### Unit 1 — Ground: the true coupling map

The claim "16 of 19 verbs are already harness-agnostic" came from a grep. Prove
or disprove it verb by verb.

1. For each of the 19 entries in `~/herdr-spine/bin/`, determine: what it does
   in one line; whether it is harness-coupled in fact (not merely by keyword);
   and if coupled, exactly where and why.
2. For `cursor-spine`, `cursor-fleet`, and `cursor-finish`, classify every
   responsibility as **genuinely cursor-specific** (must stay in an adapter) or
   **duplicated generic logic** (belongs in the spine). Cite line ranges.
   - **Done when:** `~/agent-core/briefs/harness-homogeneity/COUPLING-MAP.md`
     exists, covers all 19 verbs plus all three cursor scripts, and every
     classification cites a file and line range. No entry may read "unknown"
     without the evidence that made it unknowable.

### Unit 2 — Plan: the target architecture, ruled

Produce the design before anyone writes code.

1. Specify how `spine-spawn` dispatches to a cursor backend the way it dispatches
   to claude and pi — the refusal at `:1470` becoming a routing branch. Name
   what the adapter boundary is: what `cursor-shim` keeps (cursor-agent exec,
   Cursor model slugs, the no-sparse-flag workaround) and what moves to the
   spine.
2. Specify how the other 18 verbs reach cursor agents. For each verb currently
   unreferenced by cursor-shim, state whether it works unmodified, needs an
   adapter shim, or genuinely cannot apply — with the reason.
3. State the migration order and what stays working at each step. **A step that
   breaks cursor spawning is not acceptable**; cursor fleets are in use.
4. Address the storage problem: a spawn primitive must not live in a directory
   whose contract is "delete the dir = integration gone."
5. Address the naming: `cursor-spine` asserts a peer relationship that will not
   exist after this lands.
   - **Done when:** `~/agent-core/briefs/harness-homogeneity/PLAN.md` exists
     covering all five points, with a per-verb table for point 2, and is posted
     as a finding for the operator to see before implementation begins.

### Unit 3 — Coordinate: land it

Dispatch implementation against the ruled plan. Partition so no two workers hold
`spine-spawn` or `cursor-spine` at once.

1. `spine-spawn` routes cursor instead of refusing it.
   - **Done when:** `spine-spawn orch --kind cursor ...` spawns a working cursor
     agent, demonstrated by a real spawn whose `agent_status` flips to `working`,
     and the old refusal path is gone.
2. Cursor agents reach the spine verbs the plan says they should — at minimum
   `spine-claim`, `spine-workspace`, `spine-ruling`.
   - **Done when:** a live cursor agent successfully claims a resource, is
     visible to `spine-watch`, and passes through the workspace door — each
     proven by a real run, not by reading code.
3. Every parity claim is recorded honestly in `HARNESS-PARITY.md`. An unwired
   gate reports unwired.
   - **Done when:** the parity table has a row per affected capability with its
     true state, and `worktree-lifecycle.md`'s DOOR+DOCTRINE residual is either
     resolved to DOOR or re-stated with its reason.
4. Record the supersession of the 2026-08-11 ruling with `spine-ruling`, scoped.
   The door refuses an unscoped ruling.
   - **Done when:** the ruling is deposited with an explicit scope naming what
     it does and does not apply to.

### Unit 4 — Sweep the briefs that carry the false instruction

Briefs in `~/agent-core/briefs/` instruct workers to use `spine-claim` without
qualification. For cursor workers that was never true.
   - **Done when:** every brief naming `spine-claim` is either corrected or
     annotated, and the `brief` skill
     (`~/agent-core/primitives/skills/brief/SKILL.md`) no longer emits an
     instruction that is false on any harness.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information.
- **Do not break cursor spawning at any point.** It is in use.
- Do not commit to agent-core while `agent-core/credential-scrub` reports a
  rewrite in flight. Check that topic first.
- Do not touch the other agent's uncommitted work.
- No provider, model, or harness names in briefs or in canonical core files —
  those belong only in `primitives/directives/<harness>.md`.
- Testing: NO MOCKS. Every parity claim proven by a real spawn of a real agent.
- Match surrounding style: `spine-spawn` is Python; `cursor-spine`,
  `cursor-fleet`, `cursor-finish` are bash, and macOS ships **bash 3.2** — no
  `mapfile`, no associative arrays.
- **Land and push** to the operator's own remotes on green. Do not push to
  third-party or shared org remotes.

## Report back with

- The coupling map's headline numbers: how many verbs truly harness-agnostic,
  how many coupled, how many cursor responsibilities were duplicated generic
  logic rather than cursor-specific.
- The plan's per-verb table for cursor reachability.
- Proof cursor spawns through `spine-spawn`: the command and the observed
  status flip.
- Proof a cursor agent claims, is watched, and passes the workspace door.
- The honest parity table state, including anything still DOCTRINE.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact that turned out wrong, and what you found instead. The
  "16 of 19" figure is a grep-derived estimate — correcting it is a valuable
  result, not a failure.
