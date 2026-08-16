# TUP-GROUNDING — the split, read against `~/tup/contracts/`

Unit 0 deliverable. Author: `CORD [harness-homogeneity]`, 2026-08-16.
Every row cites a file and line verified in this session.

Contracts read in full: `thesis.md`, `shape.md`, `ecosystem.md`,
`amendments-2026-08-15.md`; `objects.md` and `org-topology.md` read (tool
output truncated on those two — every claim below citing them is from a line I
saw, and nothing here depends on the omitted regions).

Repo states at time of reading: `~/tup` main @ `cd3e719` (clean),
`~/herdr-spine` main @ `fbb76b9` (clean), `~/cursor-shim`
`feat/a5-batch-record` @ `d9c3590` (clean), `~/agent-core` main @ `8e470a7`.

---

## 0. The headline, before the tables

**The fork is not a second runtime. It is a second client of the same
runtime.**

`shape.md:18-19` says the socket "is specified against two runtimes though
only one is wired", and `shape.md:254` keeps "whether a second runtime is ever
wired" formally undecided. It is tempting to read `cursor-spine` as that
second runtime arriving early. It is not.

`spine-spawn:628` seats an agent with:

```
run_json("agent", "start", name, "--kind", kind, "--pane", pane_id,
         "--timeout", timeout_ms, *passthrough, ...)
```

`cursor-spine:741` seats an agent with:

```
START_ARGS=(agent start "$AGENT_NAME" --kind cursor --pane "$NEW_PANE" -- "${IA_ARGS[@]}" "Read the file $INSTR_FILE now and follow it exactly as your instructions.")
```

Same verb, same runtime, same socket. Both are callers of herdr. There is
exactly **one** wired runtime on this install and the fork does not change
that. What forked is the *caller* — the layer tup calls `socket/`, which owns
the spawn door and its verbs.

That reframes the whole unit. This is not "wire a second runtime"; it is
`shape.md:50` — *"one canonical body with thin per-engine adapters; a forked
law rots silently, because each fork stays plausible on its own."* Two
plausible bodies, one seam, one runtime underneath.

---

## 1. Socket verb by verb

`shape.md:62-69` gives the verb list. `spine-spawn` is
`~/herdr-spine/bin/spine-spawn`; `cursor-spine`, `cursor-fleet`,
`cursor-finish` are under `~/cursor-shim/`.

| # | Socket verb | In `spine-spawn` | In `cursor-spine` | Elsewhere | Verdict |
|---|---|---|---|---|---|
| 1 | **spawn** | `:603-638` `start_agent()`; refuses cursor at `:1470-1475` | `:717-757`, call at `:741` | herdr `agent start` is the actual implementation; `~/bin/herdr:78` uses it for `--kind cursor` at the desk door | **BOTH, duplicated.** Neither owns it; herdr does. |
| 2 | **address** | pane ids + registration name, `:862` `spawn_into_pane`, `:1459-1469` desk-default kind | `:711` `pane rename`, `:741` `--pane` | herdr pane/workspace ids | **NEITHER.** Both borrow herdr's addressing. Agreement here is accidental, not contracted. |
| 3 | **send** | `:172-210` `verified_prompt()` — flip-or-fail, `herdr agent prompt` | instruction delivered as a **file path in argv** (`:741`) or a script via `pane run` (`:824`) | `cursor-finish:279` `hj agent prompt --wait --until working --timeout 30000` | **BOTH, divergent contracts.** spine guarantees a status flip; cursor-spine hands over a filename and hopes. |
| 4 | **read** | not implemented | `:777-804` `parse.py`, a `cursor-agent` stream-json renderer | herdr `agent read` / `pane read` | **NEITHER implements the verb;** cursor-spine adds a reader only cursor's output format needs. |
| 5 | **wait-for-status** | `:172-208` flip-or-fail, bounded | `:829` a **0.5s poll loop** | `cursor-finish:147` `latch wait --pane --until done --timeout 24h` | **THREE implementations.** One of them (`cursor-spine:829`) is the sleep-poll that `latch` was built to abolish — and `cursor-finish` in the same repo uses `latch` correctly. |
| 6 | **lifecycle events** | — | **none** | `spine-hook` (dispatcher), `bin/handlers/*`, `spine-watch:1-20` (`events.subscribe`) | **SPINE ONLY.** cursor-shim subscribes to nothing. |
| 7 | **tokens** | `:736-767` `stamp_lineage`, `--source spine-spawn` | `:712-714`, `--source cursor-shim` | `spine-report:27` `--source custom:spine`; `spine-claim:34` `--source spine:claim`; `cursor-fleet:147` `--source cursor-fleet` | **FIVE source namespaces, no single writer.** Violates `shape.md:115-118` (single-writer). |
| 8 | **claim** | — | **none** | `spine-claim` (entire file) | **SPINE ONLY.** `grep -rl spine-claim ~/cursor-shim` → **0 files**. Cursor agents never claim. |
| 9 | **observe** | — | — | `spine-watch`, `spine-fleet`, `ctl-fleet`; `cursor-fleet:35,398` runs `ctl-fleet` | **SHARED, degrades silently on cursor** — see §2 clause 1. |
| 10 | **spawn door** | the whole file, plus hook `primitives/hooks/spawn-door.sh` | `:703-715` stamping — every call `|| true`, so best-effort, not a gate | — | **BOTH, and the hook misdirects cursor.** See §3. |
| 11 | **adopt-and-release** | `:461-477` adopts an existing worktree/branch with a WARN | `:100-103` **refuses** to reuse an existing path | — | **OPPOSITE POLICIES** for the same situation. |
| 12 | **reaping** | `:1274-1353` `cmd_reap` — correct, registered, and **nothing invokes it** | `:255-277` `reap` subcommand | `cursor-finish:382-427` `cleanup` + `trap cleanup_and_preserve_rc EXIT` at `:419-427` | **THREE.** The spine's is DOCTRINE (`worktree-lifecycle.md:94`); the cursor one is DOOR. |

**Score: 0 of 12 verbs have one canonical body.** Two are spine-only, one is
cursor-only in effect, one is unimplemented on both, and eight are forked or
divergent.

---

## 2. Which `thesis.md` §What-this-rules-out clauses are violated

`thesis.md:63-70` lists six. **Five of the six are violated, each with a named
artifact.**

### Clause `thesis.md:68` — "Any component that works only because one particular engine is seated"

- **`ctl-fleet:12`** `const CLAUDE_PROJECTS = ${homedir()}/.claude/projects;`
  → `:228` `claudeUuid` returns non-null only when
  `agent_session.source === "herdr:claude"` → `:240` `durationOf` returns `""`
  for every non-claude pane. The fleet renderer's duration column **works only
  because claude is seated.** It does not error; it renders blank. This is the
  exact failure mode `HARNESS-PARITY.md:56` forbids — "an unwired gate reports
  ✗, not ✓" — except here it reports nothing at all.
- **`spine-spawn:615-618`** — `if kind in ("prime", "prime-agent")` takes a
  `pane run prime-agent` path instead of `agent start`. A second engine-shaped
  branch already living in the canonical body.
- **`cursor-spine` in its entirety** (858 lines), of which only 13.4% is
  actually cursor-shaped — see `COUPLING-MAP.md`.

### Clause `thesis.md:69` — "Any layer whose foundation is one particular runtime"

- **`spine-spawn:1470-1475`.** The socket layer's spawn verb has a foundation
  that is *not merely one runtime* but one **engine list**: `pi`/`claude`
  only, by string comparison. `shape.md:71-72`'s membership test asks whether
  the thing "seats a caller-supplied program, in a caller-supplied
  environment, under an identity stamped at birth." herdr passes that test for
  cursor — proven by `~/bin/herdr:78` and by two live cursor panes on this
  machine right now (`w3S:p1`, `w3V:p1`, both `agent_session.source =
  "herdr:cursor"`). **spine-spawn refuses a capability its own runtime has.**

### Clause `thesis.md:70a` — "A second law body per engine"

Two law bodies, duplicated function for function:

| Law | Spine body | Cursor body |
|---|---|---|
| Plan→Implementation verify gate | `spine-spawn:398-437` `enforce_verify_gate` | `cursor-spine:444-474` |
| Criteria-authored marker | `spine-spawn:240-258, 531-552` | `cursor-spine:211-220, 339-366` |
| Worktree preservation on teardown | `spine-spawn:1274-1353` | `cursor-finish:325-417` |
| Coder worktree isolation | `spine-spawn:505-524` | `cursor-spine:476-497` |
| Break-glass audit | `VERIFY_GATE=off` → `spine-spawn:377-397` | `CURSOR_VERIFY_GATE=off` → `cursor-spine:457-459` |

Two break-glass env var names for one law is the rot `shape.md:50` predicts:
each is plausible alone, and no one reading either would notice.

### Clause `thesis.md:70b` — "A second transport per handler"

**Measured, not asserted.** `cursor-spine:59` sets
`TOWER_LEDGER="${TOWER_LEDGER:-$HOME/.tower/board.jsonl}"` — a variable named
*ledger* pointing at the *board*. `cursor-spine:207-209` then `printf`-appends
raw JSON straight into it, bypassing `bun ~/.tower/cli.mjs` entirely. The same
variable name in `cursor-finish:10` points at `~/.tower/ledger.jsonl`, so the
two halves of one shim disagree about which file the name means.

Live measurement of `~/.tower/board.jsonl` this session:

| Measure | Count |
|---|---|
| Total rows | 12,553 |
| Rows lacking an `id` field | 3,120 |
| — of those, written by `via:"cursor-shim"` | **3,107 (99.6%)** |
| cursor-shim rows by kind | `verify-gate-bypass` 1,452 · `lineage` 1,091 · `freshness-gate-bypass` 408 · `freshness-flag` 156 |

For contrast, `spine-spawn:719` writes lineage to `~/.tower/ledger.jsonl` with
a full schema (`id`, `ts`, `cwd`, `kind`, `pane`, `parent`, `role`, `from`,
built at `:750-758`); cursor-shim's row is `{ts, kind, via, role, child,
parent, model}` — no `id`, and `child` where the ledger says `pane`.

The second transport is not a design smell here. It is 3,107 malformed rows on
the shared bus. Posted to the board as a finding on both
`agent-core/harness-homogeneity` and `agent-core/tower-bus-integrity`.

### Clause `thesis.md:66` — "One agent messaging another agent"

- **`cursor-finish:270-291`** `re_prompt_worker` →
  `hj agent prompt "$pane" "$msg" --wait --until working`. That is a direct
  message to a named peer pane. `thesis.md:29-31` — *"nothing is delivered to
  a peer — it is deposited against an object"* — and `org-topology.md:51`
  (LATERAL: "no direct peer messages"). The shim's triage loop is built on the
  one thing the field law forbids.

### Clause `thesis.md:67` — "Truth derived from exhaust" — VIOLATED, mildly

- **`ctl-fleet:229-237`** `loadSessionStart` globs the claude transcript JSONL
  and parses the first `timestamp` to derive session start. Truth from
  exhaust, by the contract's own definition. It is cached and non-fatal, and
  the file's own comment at `:227` calls it "the best proxy" — an honest label,
  which is why this is listed as mild rather than as a defect to fix here.

### Clause `thesis.md:65` — "State whose only home is a context window" — NOT violated

Both spawners persist to disk (`~/.spine/`, `~/cursor-shim/.make/`,
`.spawned.jsonl`, the tower files). No finding.

---

## 3. The closed loop — the sharpest single artifact

This was not in the brief's Pre-Verified Facts and is the most consequential
thing Unit 0 found.

1. `primitives/hooks/spawn-door.sh:37-39` denies any command matching
   `herdr agent start` and returns: *"raw 'herdr agent start' is closed. Spawn
   through the door: ~/bin/spine-spawn"*. The deny is unconditional — no
   harness branch anywhere in the file.
2. `HARNESS-PARITY.md:70` records that hook as **FULL on cursor**
   (`spawn-door.sh`, store path invoked directly).
3. `spine-spawn:1459-1468` reads `~/.config/herdr/desk-harness` for the
   default kind. `~/bin/herdr:83` writes `cursor` there whenever the operator
   starts the desk with `herdr cursor`.
4. `spine-spawn:1470-1475` then refuses that kind.

**So on a cursor desk, a cursor agent that spawns by the book is denied by the
door, redirected to the spine, and refused by the spine — and the deny text
never mentions `cursor-fleet` or `cursor-spine`.** The enforcement estate does
not merely fail to help cursor; it actively routes cursor into a dead end.

This is `gates/` in `shape.md:131-134` — *"a gate must be right before it is
strict; an oracle that fails honest work is worse than no oracle."*

---

## 4. Wired versus specified

**What "wired" means concretely on this install:** exactly one process answers
the socket contract — the herdr server on `~/.config/herdr/herdr.sock`.
Everything else named in this unit (`spine-spawn`, `cursor-spine`,
`cursor-fleet`, `cursor-finish`, `spine-claim`, `spine-report`, `spine-watch`,
`ctl-fleet`) is a **client** of that socket. Verified: `spine-claim:213`,
`spine-report:84-101`, and `spine-workspace:40` are pure `herdr` CLI wrappers
keyed on `$HERDR_PANE_ID`, which herdr injects into every pane it owns —
which is why they are engine-blind by construction.

**What would have to exist for a second runtime to satisfy the seam:** a
non-herdr process that answers all twelve verbs in §1 — seating a
caller-supplied program in a caller-supplied environment under an identity
stamped at birth (`shape.md:71-72`), plus snapshot reconciliation, a bounded
event ring, a schema/version probe, adopt-and-release, and reaping
(`shape.md:66-80`). **Nothing in this unit is that.** cursor-shim satisfies
zero of those independently; it delegates every one to herdr.

**Therefore the correct target is not "wire a second runtime" and not even
"make `spine-spawn` route cursor" as a routing trick.** It is: `socket/` has
one seam and must have one client body, with per-engine differences expressed
where `shape.md:41-43` already puts them — *"the per-engine capability table"*
in `kernel/`. `cursor-agent` needs a model-slug map, a worktree-name minter, a
`--mode` flag, an output parser, and a no-sparse-flag workaround. Those are
**five table rows and one adapter**, not 1,887 lines and not a second spine.

---

## 5. Contradictions found

`shape.md:4-5` says the thesis wins where contracts disagree. I found no
contract-versus-contract contradiction. I found two contract-versus-install
disagreements:

1. **`shape.md:213`** — *"A bridge leaning on an experimental upstream flag
   names its kill signal in advance."* `cursor-spine:368-389` leans on
   `cursor-agent --worktree` lacking a sparse flag and `:85-113` leans on its
   async worktree-setup race. Neither names a kill signal. When `cursor-agent`
   ships a sparse flag, nothing tells anyone the workaround is now dead code.
2. **`ecosystem.md:64-69`** — *"Every in-box component passes its own rip-out
   test — delete it, register a conforming replacement, and the core is
   untouched."* `~/agent-core/primitives/AGENTS.md` grants cursor-shim exactly
   that status ("Delete the dir = integration gone"). But the thing inside it
   is the spawn primitive for an entire harness, and `README.md:20` states the
   fork as **design intent**: *"Calls only herdr's public commands ... —
   **never** `spine-spawn`."* A bridge whose stated contract is "never call the
   core" is not a bridge. `shape.md:210` — a bridge exists *"only because one
   specific outside thing is shaped oddly"* — and 86.6% of this one is not
   about cursor at all.

---

## 6. Pre-Verified Facts from the brief that need correcting

Carried forward into `COUPLING-MAP.md` §5 with evidence. Summary:

| Brief's claim | Status |
|---|---|
| "Only 3 of 19 mention `kind` or `harness`" | **Wrong twice over.** Two of the three (`spine-fleet`, `spine-inbox`) match on Tower *message* kinds (`ack`/`answer`/`question`/`deliverable`), not harness kinds. And the glob `spine-*` never covered `ctl-fleet` or `handlers/`, which do have real coupling. |
| "cursor-shim references 1 of the 19 verbs" | **Understated by two.** Three appear: `spine-report`, `ctl-fleet`, `spine-spawn`. Only `ctl-fleet` is executed. The seven verbs the brief named as zero-reference are confirmed **zero**. |
| "On cursor `spine-claim` is dead on arrival" | **Wrong, and the correction matters.** `spine-claim` is engine-blind and works on a cursor pane today, unmodified. Nothing in cursor-shim ever tells a cursor agent to call it. Capability gap → **doctrine gap**, which changes Unit 4 from "correct a false instruction" to "the instruction was true and never delivered". |
| `spine-spawn:1470-1475` refusal text | **Confirmed verbatim.** |
| cursor-shim = 1,887 lines across three files | **Confirmed** (858 / 556 / 473). |
| Cursor-specific surface "is narrow" | **Confirmed and quantified: 253 lines, 13.4%.** |

---

SOURCES (all read or run 2026-08-16 in this session): `~/tup/contracts/`
thesis.md, shape.md, ecosystem.md, amendments-2026-08-15.md read in full;
objects.md, org-topology.md read (partial tool output — cited lines seen).
`~/herdr-spine/bin/` all 19 entries enumerated; `spine-spawn` function list,
`:446-455`, `:545-660`, `:613-641`, `:724-770`, `:1440-1484` read directly.
`~/cursor-shim/cursor-spine` `:96-113`, `:205-230`, `:364-375`, `:508-525`,
`:705-720` read directly; README.md `:18-22`. `primitives/hooks/spawn-door.sh`
read in full. `~/bin/herdr` read in full. `HARNESS-PARITY.md`,
`worktree-lifecycle.md` read. `herdr api schema --json` dumped and searched
(`AgentStartParams.kind` is an unconstrained string; `IntegrationTarget` enum
includes `cursor`). `herdr agent list` run live — two panes with
`agent":"cursor"`, `source":"herdr:cursor"`. Board counts computed with
`python3` over `~/.tower/board.jsonl` (12,553 rows). Full-file classification
of the three cursor scripts produced by a read-only assist; its load-bearing
claims (`cursor-spine:96-113`, `spine-spawn:446-455`, `README.md:20`,
`cursor-finish:94-98`, the zero-reference verb list) re-verified personally
against the files before entering this document.
