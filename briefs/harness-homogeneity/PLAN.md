# PLAN — one spine, every harness

Unit 2 deliverable. Author: `CORD [harness-homogeneity]`, 2026-08-16.
Grounded in `TUP-GROUNDING.md` (Unit 0) and `COUPLING-MAP.md` (Unit 1).
Nothing below may be implemented until this is ruled.

---

## 0. The ruling asked for by the brief

> *"Whether you wire the seam now or close the split against it as an interim
> step is yours to rule in Unit 2 — but rule it against the contract."*

**RULING: close the split against the contract. Do not build tup's `socket/`
now.** Four contract reasons, in order of weight:

1. **`shape.md:258` already resolved the migration posture** — *"strangler fig
   around the existing estate, first root at the outer loop (finding → unit →
   agent)."* Building `socket/` for this unit would plant a **second root**, at
   the spawn layer, contradicting a resolution the operator landed eight days
   before this unit opened.
2. **`thesis.md:73-77`** — *"The durable layer is not built... Layer 4 is where
   Tup becomes true."* The socket's verbs are specified against durable objects
   that do not exist. Wiring the seam first means writing it against inferred
   state, which is the exact failure `thesis.md:75-76` names: *"it disagrees
   with itself, and no refusal written against it can be trusted."*
3. **`shape.md:254` keeps "whether a second runtime is ever wired" undecided** —
   and per `TUP-GROUNDING.md` §0, **this unit is not a second runtime.** There
   is one runtime (herdr) and two clients of it. Nothing here forces that
   decision, and nothing here should pretend to.
4. **`shape.md:50` prescribes the interim exactly** — *"one canonical body with
   thin per-engine adapters."* That is achievable entirely inside
   `~/herdr-spine/` with zero tup code.

**What "against the contract" therefore means concretely:** `spine-spawn`
becomes the one canonical body; cursor becomes a thin adapter; and the twelve
socket verbs of `shape.md:62-69` are the **specification the body is written
against and recorded against**, not code that moves. When `socket/` is
eventually built, it inherits one body to lift, not two to reconcile.

**What this ruling does NOT license:** it is not permission to leave the fork
in place and write a compatibility note. The split closes. Only the
*destination* of the canonical body is being ruled — `herdr-spine`, now —
rather than `~/tup/socket/`, later.

---

## 1. How `spine-spawn` dispatches cursor, and where the adapter boundary sits

### 1.1 The change is smaller than the brief assumed

`spine-spawn:628` already makes the call that seats a cursor agent:

```
run_json("agent", "start", name, "--kind", kind, "--pane", pane_id,
         "--timeout", timeout_ms, *passthrough, ...)
```

`cursor-spine:741` makes the identical call. `~/bin/herdr:78` makes it at the
desk door. Two cursor panes are live on this machine right now with
`agent_session.source = "herdr:cursor"`. **The refusal at `:1470-1475` blocks a
call `spine-spawn` is already capable of making.**

### 1.2 The four edits to `spine-spawn`

| # | Site | Change | Why |
|---|---|---|---|
| A | `:1470-1475` | Delete the refusal branch entirely | It is the whole barrier |
| B | `:554-572` `kind_model()` | Add a cursor branch: when `kind == "cursor"` and the profile model is a `cursor/<id>` gateway slug, translate it to a cursor-agent model id and return that | Today cursor falls to `models.json` → `kind_models` has **no cursor key** → returns `None` → the agent silently inherits cursor-agent's default and the operator's profile choice is discarded. The translation table already exists as `cursor-spine:522-543` `map_model()` |
| C | `:613-624` `start_agent()` | Extend the `--` passthrough to carry `--force --trust --model <id>` for cursor, and `--mode <plan\|ask>` when given | Same mechanism as the existing `--model`/`--thinking` pi passthrough at `:620-623`. `cursor-spine:590` proves herdr forwards these correctly after `--` |
| D | `:1354+` `add_common()` | Add `--mode {plan,ask}`, validated | `cursor-spine:419-428`; a top-level cursor-agent flag |

**Everything else in `spine-spawn` is already kind-independent** and was
verified as such: `ensure_git_worktree` (`:446-500`), `apply_coder_isolation`
(`:505-523`), `create_tab`/`split_pane` (`:922-943`), `spawn_into_pane`
(`:862-895`), `verified_prompt` (`:172-210`), all five stamping functions,
`cmd_reap` (`:1274-1353`).

### 1.3 Three cursor-specific surfaces evaporate rather than move

This is the substantive design finding of Unit 2.

`spine-spawn` creates the worktree itself (`:514` `args.cwd =
ensure_git_worktree(...)`) and then creates the pane **in that directory**
(`create_tab:925` and `split_pane:936` both pass `--cwd`). The agent is seated
into a pane whose cwd is already the isolated, sparse checkout.

Therefore `cursor-agent --worktree` is **never passed**, and with it:

- **`cursor-spine:76-79` `worktree_name_for`** — needed only because
  `cursor-agent --worktree` takes an optional value that eats the next
  positional (`:584-587`). **Not needed.**
- **`cursor-spine:85-113` `precreate_sparse_worktree`** — needed only to beat
  `cursor-agent`'s asynchronous worktree setup race (`:89-92`). **Not needed.**
- **`cursor-spine:368-389` `sparse-apply`** — the entire no-sparse-flag
  workaround, needed only to narrow a checkout `cursor-agent` already made.
  **Not needed.**

Three of the brief's named "genuinely cursor-specific" items are artefacts of
letting `cursor-agent` own the worktree. Give the worktree back to the spawner
and they cease to exist. This also removes the `--cone` / `--no-cone`
divergence in `COUPLING-MAP.md` §6 by construction: one code path, one sparse
semantic.

### 1.4 The adapter boundary, stated exactly

**Stays in the cursor adapter — 5 items:**

| Item | Current location | Why it must stay |
|---|---|---|
| `cursor-agent` binary resolution | `cursor-spine:60` | Names a specific outside program (`shape.md:210`) |
| Model slug map (gateway slug → cursor-agent id) | `cursor-spine:522-543` | A per-engine capability-table row (`shape.md:41-43`) |
| `--mode plan\|ask` vocabulary | `cursor-spine:419-428` | Cursor-agent's own flag; the spine passes it through opaquely |
| Headless `-p` execution + `stream-json` parsing | `cursor-spine:575-591, 777-829` | `spine-spawn` has **no headless mode at all**. Legitimately cursor-only until the spine grows one |
| `create-chat` / `resume` + `~/.cursor/worktrees` | `cursor-spine:304-337, 691-701`; `cursor-finish:92-97` | Cursor chat durability has no spine equivalent; the path convention belongs to the headless path only |

**Moves to the spine — everything else.** 1,634 of 1,887 lines (86.6%) are
duplicated generic logic per `COUPLING-MAP.md` §5. The high-value moves:

- Verify gate + `.authored` markers (`cursor-spine:211-220, 339-366, 444-474`)
  → already exist at `spine-spawn:240-258, 398-437, 531-552`. **Delete the
  copy; unify the break-glass on `VERIFY_GATE=off`,** retiring
  `CURSOR_VERIFY_GATE` with a labelled deprecation per `shape.md:49-50`.
- Worktree preservation and teardown (`cursor-finish:325-427`) → `spine-spawn
  reap` (`:1274-1353`). This is where the `worktree-lifecycle.md:94` DOCTRINE
  residual gets resolved — see §3 Phase 5.
- Identity stamping (`cursor-spine:703-715`) → `spine-spawn:862-895`, which
  additionally writes a ledger row as source of truth rather than best-effort
  metadata with `|| true`.
- Lineage writing (`cursor-spine:205-209`) → `spine-spawn:736-767`. **This is
  what closes the 3,107 id-less board rows.**

**The acceptance test for the boundary is `ecosystem.md:64`'s rip-out test,
made concrete:**

> After this lands, `rm -rf ~/cursor-shim` must leave
> `spine-spawn orch --kind cursor --profile orchestrator` working.

Today that deletion removes the ability to spawn a cursor agent at all. That is
the precise sense in which `~/agent-core/primitives/AGENTS.md` is currently
wrong to call cursor-shim "rip-out-able".

---

## 2. How the other 18 entries reach cursor agents

Per `COUPLING-MAP.md` §1: **17 of 19 are already harness-agnostic in fact.**
Almost every row below is therefore "works unmodified" — and the work is not
code but **delivery of an instruction that was never issued**.

| Entry | Reaches cursor? | Action needed | Reason |
|---|---|---|---|
| `spine-claim` | **works unmodified** | **Doctrine only** — issue it in cursor profiles and briefs | `:157` `$HERDR_PANE_ID`, `:213` `herdr pane report-metadata`. Both engine-blind. Nothing in cursor-shim ever tells a cursor agent to call it |
| `spine-report` | **works unmodified** | Doctrine only | `:20,64` `$HERDR_PANE_ID`; `:84-101` `exec herdr pane report-metadata` |
| `spine-workspace` | **works unmodified** | Doctrine only | `:40,60` pure `herdr workspace` calls; no pane or engine concept |
| `spine-ruling` | **works unmodified** | Doctrine only | Pure board append; no pane concept at all |
| `spine-watch` | **works unmodified** | None | No source filter of any kind; observes every pane. Needs only that *something* stamps cursor tokens — edit A/§1.2 supplies that |
| `spine-hook` | **works unmodified** | None | Dispatches `pane.agent_status_changed`, which herdr emits for cursor panes today |
| `handlers/10-notify` | **works unmodified** | None | Acts on pane status + tokens |
| `handlers/15-restore-view` | **works unmodified** | None | Pane-view only |
| `handlers/16-parent-wake` | **works unmodified** | None | Wakes the spawner on worker finish; keyed on lineage, which edit A supplies for cursor |
| `handlers/17-field-pull` | **works unmodified** | None | **Cursor panes already inherit the stigmergic field-pull law for free** — it fires on any pane going idle |
| `handlers/20-reflex` | **works unmodified** | None | Policy-gated auto-answer on blocked panes |
| `handlers/30-choreo` | **works unmodified** | None | Ships disabled; no engine concept |
| `handlers/40-tower-bridge` | **works unmodified** | None | Pane status → Tower ledger. `:302`'s "a real Claude" is a comment |
| `spine-wave` | **works unmodified** | None | Renders a fan-out checklist from pane tokens |
| `spine-inbox` | **works unmodified** | None | Its `kind` hits are Tower message kinds, not harness kinds |
| `spine-fleet` | **works unmodified** | None | Same — `ack`/`answer`/`deliverable`/`alert`/`question` |
| `spine-startup` | **works unmodified** | None | Ensures CTRL + TOWR panes exist |
| `spine-greeting` | **works unmodified** | None | A herdr popup; engine-blind |
| `spine-sigil` | **works unmodified** | None | Synthetic-agent self-report |
| `spine-agent` | **works unmodified** | None | Synthetic-agent registration |
| `spine-lab` | **works unmodified** | None | Named-session lifecycle |
| `spine-choreo` | **works unmodified** | None | Config toggle |
| `spine-wormhole` | **works unmodified** | None | Link generation |
| `ctl-fleet` | **partial — needs a shim** | **Adapter, or an honest blank** | `:12,228-237,240` derive session duration by globbing `~/.claude/projects`. Non-claude panes render `""` with no explanation |
| `spine-spawn` | **the subject** | Edits A-D | §1.2 |

**Nothing in the list "genuinely cannot apply."** That is the finding: the
spine was built engine-blind and the fork was never necessary.

### 2.1 The one real adapter: `ctl-fleet`

Two options, and I rule the second:

- ~~Add a `~/.cursor/` transcript reader mirroring `CLAUDE_PROJECTS`.~~
  **Rejected.** `thesis.md:67` rules out truth derived from exhaust; adding a
  second exhaust reader doubles down on a violation `ctl-fleet:227` already
  labels honestly as "the best proxy".
- **Render the duration cell as `—` for any pane whose session source has no
  reader, and say so.** `HARNESS-PARITY.md:56` is the governing law: *"An
  unwired gate reports ✗, not ✓."* A blank cell that looks like a short
  session is worse than a dash that says "not measured here."

**Ruling: `ctl-fleet` renders `—`, and `HARNESS-PARITY.md` carries a row saying
session duration is claude-only and why.** Cheap, honest, and it does not grow
a second exhaust reader.

---

## 3. Migration order — and what stays working at every step

**Binding constraint: cursor fleets are in use. No step may break cursor
spawning.** Every phase below is additive or provably neutral; the old path
stays live until the new one is proven by a real spawn.

| Phase | Change | What still works | Gate to pass before the next phase |
|---|---|---|---|
| **1** | `spine-spawn` edits A-D. **Nothing in `~/cursor-shim` is touched.** | Everything. `cursor-fleet`/`cursor-spine` untouched and still the only path anyone uses | A real `spine-spawn orch --kind cursor` spawn whose `agent_status` flips to `working`, observed in `herdr agent list` |
| **2** | Prove the 17 agnostic verbs on a live cursor agent | Both paths | The cursor agent itself runs `spine-claim claim`, appears in `spine-watch`, and passes `spine-workspace`. Real runs, no reading of code |
| **3** | Deliver the instruction: cursor profiles + `brief/SKILL.md` + the brief sweep (Unit 4) | Both paths | Every brief naming `spine-claim` is correct on every harness |
| **4** | Repoint `cursor-fleet`'s `orch`/`worker`/`fanout`/`make` at `spine-spawn`. `cursor-fleet` keeps its name and its CLI face | `cursor-fleet` commands unchanged for callers; `cursor-spine`'s generic 615 lines become unreached | `cursor-fleet up\|orch\|make\|fanout` all green against the same acceptance run they pass today (`~/cursor-shim/docs/qa-verify.sh`, 71/71 per `AGENTS.md`) |
| **5** | Shrink the adapter to the 5 items in §1.4; delete the dead generic copies; unify break-glass on `VERIFY_GATE=off`; route lineage through `spine-spawn:736-767` | Headless `-p` runs unchanged | **The rip-out test:** `rm -rf ~/cursor-shim` (in a scratch clone) leaves `spine-spawn orch --kind cursor` working. Board writes: **zero new id-less rows** |
| **6** | Rename (§5); update `HARNESS-PARITY.md`, `AGENTS.md`, `worktree-lifecycle.md`; deposit the supersession ruling | Everything | The parity table's every claim re-verified by its own listed command |

**Phase 5 is where `worktree-lifecycle.md:94`'s DOCTRINE residual resolves.**
That file's honest gap is that `spine-spawn reap` exists but nothing invokes
it, "because `cursor-finish` owns a unit's whole lifetime so an EXIT trap
belongs there, whereas `spine-spawn` exits immediately while the pane lives
on." Once `cursor-finish`'s teardown calls `spine-spawn reap` instead of its
own copy, **`cursor-finish` becomes the tier that owns the reap** — which is
precisely the "some other tier must own the reap" the law asks for. The row
then reads DOOR for the cursor path and stays DOCTRINE for pi/claude, stated
per-path rather than as one mixed verdict.

---

## 4. The storage problem

`~/agent-core/primitives/AGENTS.md` calls cursor-shim "self-contained,
rip-out-able... Delete the dir = integration gone." A spawn primitive lives
there. Deleting the directory today removes a spine, not an adapter.

**Ruling: the canonical body's home is `~/herdr-spine/bin/`** — git-tracked,
currently clean at `fbb76b9`, and already the home of the other 18 entries. Not
`~/agent-core/`: agent-core is the law and directive store, and
`AGENTS.md` itself records that the spawn execution path is herdr-spine's.
Not `~/tup/` — see §0.

`~/cursor-shim/` keeps only the 5 adapter items, and its stated contract
becomes true rather than aspirational. The proof is Phase 5's rip-out test, and
it is a **real command run in a scratch clone**, not a claim in a README.

`~/cursor-shim/README.md:20` must change. It currently states the fork as
design intent — *"Calls only herdr's public commands... — **never**
`spine-spawn`."* After Phase 4 that sentence is false, and it is the sentence
that made the fork look principled.

---

## 5. The naming

`cursor-spine` reads as a peer of `herdr-spine`: one spine per harness,
symmetrical. It is a fork of one nineteenth of it, and after this lands it is
a fork of nothing.

**Ruling:**

- `cursor-spine` → **`cursor-bridge`**. tup's own register already has the
  word: `shape.md:205-213` `bridges/` — *"one bridge per engine, bolt-on and
  rip-out-able without a trace."* The rename makes the file's name state its
  actual rank.
- `cursor-fleet` **keeps its name.** It is a fleet-topology CLI, not a spine,
  and its name never asserted otherwise.
- `cursor-finish` **keeps its name** through Phase 5; it is a Verify-beat
  driver. If it ends up generic enough to serve pi and claude — likely, given
  it has zero `cursor-agent` references — it becomes a spine verb in a later
  unit. **Out of scope here;** flagged, not done.
- Per `shape.md:49-50` (*"retired vocabulary stays labelled, not deleted"*) a
  one-line `cursor-spine` stub remains for one cycle, exiting non-zero with a
  pointer to `cursor-bridge`. It is deleted in the next unit, not this one.

---

## 6. What this plan deliberately does not do

Named so the scope is auditable, per the brief's "a finding to report with
evidence — not a reason to narrow the goal":

1. **Does not build tup's `socket/`.** Ruled in §0, against four contract
   clauses.
2. **Does not repair existing board data.** The 3,107 id-less rows are
   `agent-core/tower-bus-integrity`'s repair; this unit closes the **writer**
   so the count stops growing. Evidence handed to that CORD on their topic;
   sequencing is theirs to call.
3. **Does not generalise `cursor-finish`** into a spine verb (§5).
4. **Does not add a headless `-p` mode to `spine-spawn`.** That is why the
   headless path stays in the adapter (§1.4). A real gap, named, not filled
   here.
5. **Does not address the `handlers/17-field-pull` / peer-messaging tension.**
   `cursor-finish:270-291` re-prompts a named peer pane directly, which
   `thesis.md:66` and `org-topology.md:51` forbid. Recorded in
   `TUP-GROUNDING.md` §2; fixing the triage loop to deposit rather than
   deliver is a separate unit.

---

## 7. Open question for the operator — the only one

**nQ spent: 0 of 3.** The rubric (craft · DX · UX · agentic efficiency)
decided every ruling above. One item is genuinely not mine:

> **Phase 5 deletes `cursor-spine`'s headless generic scaffolding and rewrites
> `cursor-fleet` to call `spine-spawn`. `~/cursor-shim` is on branch
> `feat/a5-batch-record` (@ `d9c3590`), not `main`.** Land this unit on that
> branch, on a new branch off it, or does the operator want
> `feat/a5-batch-record` resolved first?

This does not block Phases 1-3, which touch only `~/herdr-spine` (clean, on
`main`). **Work proceeds to the Phase 3 gate under the assumption "new branch
off `feat/a5-batch-record`", and stops at Phase 4 if unanswered.**

---

SOURCES (2026-08-16, this session): all citations inherited from
`TUP-GROUNDING.md` and `COUPLING-MAP.md`, whose SOURCES blocks list the reads
and commands. New to this document: `spine-spawn:505-523` `apply_coder_isolation`,
`:554-572` `kind_model`, `:862-895` `spawn_into_pane`, `:922-943`
`create_tab`/`split_pane` — read directly this session, and jointly the
evidence for §1.3's claim that the pane is created in the worktree and the
agent seated into it, making `cursor-agent --worktree` unnecessary.
`~/agent-core/primitives/profiles/models.json` read in full: every profile's
`kind_models` map contains only a `claude` key, which is the evidence for edit
B. `~/cursor-shim` branch and cleanliness from `git status --porcelain` +
`rev-parse`. The 71/71 `qa-verify.sh` figure is quoted from
`~/.claude/CLAUDE.md` and is **NOT independently verified** — Phase 4's gate
must run it, not cite it.
