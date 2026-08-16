# COUPLING-MAP — what is actually harness-coupled, verb by verb

Unit 1 deliverable. Author: `CORD [harness-homogeneity]`, 2026-08-16.
Companion to `TUP-GROUNDING.md`. Repo states: `~/herdr-spine` main @ `fbb76b9`
(clean), `~/cursor-shim` `feat/a5-batch-record` @ `d9c3590` (clean).

## Method, stated so the numbers can be audited

The brief's "16 of 19 harness-agnostic" figure came from
`grep -ln 'kind\|harness' ~/herdr-spine/bin/spine-*`. That proxy fails in both
directions, so it was discarded and replaced with three passes:

1. **Keyword pass**, widened to every engine name and to the whole directory
   (the original glob `spine-*` silently excluded `ctl-fleet` and `handlers/`):
   `grep -n -i -E '\b(claude|cursor|opencode|pi|prime|codex|harness|kind|agent_kind|cursor-agent)\b' *`
2. **Path pass** — the coupling a keyword grep cannot see:
   `grep -rn -E '\.claude|\.pi/|\.cursor|\.prime|\.codex|cursor-agent|claude-code|prime-agent|pi/agent' .`
   This is the pass that matters; a verb can hardcode `~/.claude/projects`
   without ever writing the word "harness".
3. **Mechanism pass** — read each file's entry points and ask what it actually
   touches. A verb that only calls `herdr <verb>` and reads `$HERDR_PANE_ID`
   is engine-blind by construction, because herdr injects that variable into
   every pane it owns regardless of what is seated in it.

Every hit from passes 1 and 2 was then read in context; a hit is only recorded
as coupling if it changes behaviour, not if it appears in a comment or matches
a same-spelled unrelated concept.

---

## 1. The nineteen entries in `~/herdr-spine/bin/`

`spine-report` and `spine-workspace` line counts confirmed by `wc -l`; all
19 entries confirmed present by `ls`.

| # | Entry | Lines | Lang | What it does, in one line | Harness-coupled in fact? | Where and why |
|---|---|---|---|---|---|---|
| 1 | `spine-spawn` | 1484 | py | The spawn door: create pane/tab/worktree, stamp identity, deliver brief, verify submit | **YES — three sites** | `:1470-1475` hard-refuses `kind == "cursor"`; `:615-618` a `prime`-only `pane run prime-agent` branch bypassing `agent start`; `:554-572` `kind_model()` resolves models per kind from `models.json`, whose `kind_models` maps contain **only `claude`** |
| 2 | `ctl-fleet` | 676 | bun/ts | Machine-wide fleet control-plane renderer for one pane | **YES — one site, silent degradation** | `:12` `CLAUDE_PROJECTS = ~/.claude/projects`; `:228` `claudeUuid` gated on `agent_session.source === "herdr:claude"`; `:229-237` globs the claude transcript for session start; `:240` returns `""` for any other engine. Non-claude panes render a blank duration with no indication why |
| 3 | `spine-agent` | 695 | py | Turn a non-LLM process into a first-class synthetic agent in herdr | no | zero hits in passes 1 and 2 |
| 4 | `spine-inbox` | 693 | py | Unified triage popup: blocked panes + open Tower questions | **no — false positive in the brief** | all 10 `kind` hits (`:43,289,313,314,440,533,556,599,601`) are Tower *message* kinds — `"answer"`, `"question"`, `"deliverable"`. Nothing to do with harnesses |
| 5 | `spine-greeting` | 607 | py | The re-entry ritual, bound as a herdr popup | no | zero hits |
| 6 | `spine-fleet` | 459 | py | Read-only one-shot fleet concierge: drawers, panes, Tower traffic | **no — false positive in the brief** | all 5 `kind` hits (`:248,252,258,259,263`) are `"ack"` / `"answer"` / `"deliverable"` / `"alert"` / `"question"` |
| 7 | `spine-wormhole` | 283 | py | Clickable `spine.local/<verb>` links that teleport the operator | no | zero hits |
| 8 | `spine-claim` | 268 | bash | Advisory fleet-wide resource claims via herdr metadata tokens | no | `:213` `herdr pane report-metadata "$pane_id" --source spine:claim`; identity is `$HERDR_PANE_ID` (`:157`). Engine-blind by construction |
| 9 | `spine-lab` | 219 | bash | Guarded named-session lifecycle for isolated verification | no | zero hits |
| 10 | `spine-watch` | 199 | py | Event-driven fleet token-change watcher on the herdr socket | no | zero hits; **no source filter of any kind** (`grep -n 'source'` → nothing), so it observes every pane whatever wrote its tokens |
| 11 | `spine-sigil` | 191 | bash | Self-report a synthetic agent's identity/state to herdr | no | zero hits |
| 12 | `spine-startup` | 185 | py | herdr `[[startup]]` hook: ensure CTRL + TOWR infra panes exist | no | zero hits |
| 13 | `spine-choreo` | 154 | bash | One-command toggle for the choreography handler | no | zero hits |
| 14 | `spine-wave` | 149 | py | Render a delegation wave as a live sidebar checklist | no | zero hits |
| 15 | `spine-report` | 107 | bash | Publish this agent's fleet-visible status tokens | no | `:84-101` `exec herdr pane report-metadata "$pane_id" --source custom:spine`; identity `$HERDR_PANE_ID` (`:20`, `:64`) |
| 16 | `spine-hook` | 101 | py | Thin dispatcher for `pane.agent_status_changed` events | no | zero hits |
| 17 | `spine-workspace` | 68 | bash | The workspace lifecycle door; every create/close leaves a board trace | no | `:40` `herdr workspace create`, `:60` `herdr workspace list` |
| 18 | `spine-ruling` | 41 | bash | Typed door for operator corrections; refuses an unscoped ruling | no | pure board append; no pane or engine concept at all |
| 19 | `handlers/` | dir | py | 7 event handlers + `_spine_common.py`: `10-notify`, `15-restore-view`, `16-parent-wake`, `17-field-pull`, `20-reflex`, `30-choreo`, `40-tower-bridge` | **no — false positive** | 30 keyword hits across `10-notify` and `40-tower-bridge`, every one a comment or a Tower message kind (e.g. `40-tower-bridge:302` "a real Claude"; `10-notify:192` `(kind, reason)` where kind ∈ worker/non-worker). Zero path hits. They act on pane status events, so they fire for a cursor pane exactly as for a claude one |

### Headline numbers

| Measure | Brief's estimate | Verified |
|---|---|---|
| Entries mentioning `kind`/`harness` | 3 | 4 by keyword (`spine-spawn`, `spine-fleet`, `spine-inbox`, `ctl-fleet`) + 2 handlers |
| Entries **genuinely** harness-coupled | (implied 3) | **2 — `spine-spawn` and `ctl-fleet`** |
| Entries harness-agnostic in fact | 16 | **17 of 19 (89.5%)** |
| Of the coupled two, coupling that blocks work | — | **1 — `spine-spawn:1470`.** `ctl-fleet`'s is cosmetic (a blank column) |

**The brief undersold the spine and oversold the problem.** Seventeen of
nineteen verbs would serve a cursor agent today, unmodified, and the two that
would not are one hard refusal and one blank table cell.

### The entries most worth knowing are already agnostic

- `spine-claim`, `spine-report`, `spine-workspace`, `spine-ruling` — the four
  the brief flags as unreachable from cursor — are all thin `herdr` CLI
  wrappers keyed on `$HERDR_PANE_ID`. **They work on a cursor pane today.**
- `handlers/17-field-pull` fires the stigmergic field read when *any* pane goes
  idle. Cursor panes inherit the field-pull law for free.
- `spine-watch` filters on nothing, so a cursor pane's tokens are already
  visible to it — provided something stamps them.

---

## 2. `cursor-spine` (858 lines) — responsibility classification

Produced by a full-file read-only pass; the rows marked **[v]** were
re-verified personally against the file by the coordinator.

| Line range | Responsibility | Class | Evidence |
|---|---|---|---|
| 1-23 | Banner: rip-out contract, "EXECS cursor-agent" | CURSOR | `:13` `- EXECS   cursor-agent` |
| 24-53 | Usage synopsis, verify-gate doctrine, option docs | GENERIC | `:39` `CURSOR_VERIFY_GATE=off` |
| 54-64 | Env constants (`:60` is the cursor bit) | GENERIC | `:58` `HERDR="${HERDR_BIN_PATH:-...}"` |
| 66-74 | `die` / `log` / `hj` herdr socket wrappers | GENERIC | `:70` `hj() { "$HERDR" "$@" 2>/dev/null; }` |
| 76-79 | `worktree_name_for` — mint a name `cursor-agent` accepts | CURSOR | `:76` comment: "legal cursor-agent --worktree name" |
| 81-83 | `is_git_repo_dir` | GENERIC | `:82` `git rev-parse --git-dir` |
| **85-113** | `precreate_sparse_worktree` — create the worktree ourselves to beat cursor-agent's async setup race | CURSOR **[v]** | `:99` `wt_path="$HOME/.cursor/worktrees/$repo/$wt"`; `:104` `worktree add -q -b "$wt" --no-checkout`; `:106` `sparse-checkout init --cone` |
| 115-135 | `pane_id_from_json`, `pane_exists` | GENERIC | `:123` `for k in ("pane_id","paneId","id")` |
| 137-169 | `caller_role_token`, control-plane split guard | GENERIC | `:165` `0-CONCIERGE\|1-CORD)` |
| 171-182 | `reap_pane`, `reap_job_dir` | GENERIC | `:175` `hj pane close "$p"` |
| 184-188 | `registry_add` — spawn ledger row | GENERIC | `:186` `"via":"cursor-shim","chat_id":"%s"` |
| 190-203 | `registry_model_for_chat` | CURSOR | `:200` `d.get("chat_id")==want` |
| **205-209** | `tower_lineage` — raw append to `board.jsonl` | GENERIC **[v]** | `:207` `printf '{"ts":"%s","kind":"lineage","via":"cursor-shim"...` |
| 211-253 | `verify_unit_key`, `registry_panes`, `job_dir_for_pane` | GENERIC | `:218` sha1 of realpath |
| 255-302 | `reap` and `ps` subcommands | GENERIC | `:271` `reap --done: closed $n completed shim pane(s)` |
| 304-337 | `resume` — re-enter a cursor chat | CURSOR | `:332` `"$CURSOR_AGENT" ... --resume "$CHAT_ID"` |
| 339-366 | `verify-mark` / `verify-status` markers | GENERIC | `:353` writes `.authored` |
| **368-389** | `sparse-apply` — the no-sparse-flag workaround | CURSOR **[v]** | `:369-370` "cursor-agent's own --worktree has no sparse flag" |
| 391-418 | Spawn argument parsing | GENERIC | `:403` `--partition)` |
| 419-428 | `--mode plan\|ask` validation | CURSOR | `:423` "cursor-agent read-only mode" |
| 429-442 | Tier lifecycle (who self-reaps) | GENERIC | `:431` `coordinator\|orchestrator\|concierge) KEEP=1` |
| 444-474 | Plan→Implementation VERIFY GATE + break-glass | GENERIC | `:464` `die "VERIFY GATE ... implementation REFUSED."` |
| 476-497 | Forced worktree isolation for `coder` | GENERIC | `:488` "forcing --worktree for coder" |
| 499-506 | Role-prompt resolution from `agent-core` profiles | GENERIC | `:503` `PROMPT_PATH="$SHIM_DIR/profiles/$BASE.md"` |
| **508-543** | `profile-model get` + shim-local slugs + `map_model` | CURSOR **[v]** | `:518` `test-maker\|tester) PI_SLUG="cursor/composer-2.5"`; `:534` `cursor/claude-opus-5@300k:high) echo "claude-opus-5-thinking-high"` |
| 545-573 | Profile→LABEL mapping, instruction composition | GENERIC | `:549` `orchestrator) LABEL="ORCH $BASE"` |
| 575-591 | `CA_ARGS` / `IA_ARGS` cursor-agent command lines | CURSOR | `:588` `("$CURSOR_AGENT" --force --trust --model "$MODEL" -p ...)` |
| 593-672 | `--dry-run` report; pane/tab/workspace acquisition | GENERIC | `:654` `TAB_ARGS=(tab create --no-focus)` |
| 674-701 | Wire worktree into argv; `create-chat` | CURSOR | `:686` `CA_ARGS+=(--worktree "$WT_NAME")`; `:699` `create-chat` |
| **703-715** | Identity stamping at birth | GENERIC **[v]** | `:713` `--token "role=$ROLE_TOKEN" --token "task=$LABEL" --token "name=$LABEL"`; every call `\|\| true` |
| **717-757** | Interactive path: `herdr agent start --kind cursor` | GENERIC **[v]** | `:741` `START_ARGS=(agent start "$AGENT_NAME" --kind cursor --pane "$NEW_PANE" ...)` |
| 759-776 | Job dir, error trap, instruction file | GENERIC | `:764` `mktemp -d .../cursor-spine.XXXXXX` |
| 777-804 | `parse.py` — cursor-agent stream-json renderer | CURSOR | `:789` `if t == "thinking" and st == "delta"` |
| 805-858 | Runner assembly, self-reap, headless poll, result JSON | GENERIC | `:829` 0.5s poll loop; `:855` result JSON |

## 3. `cursor-fleet` (556 lines)

**`cursor-fleet` never invokes `cursor-agent` at all** — the string appears
once, in a comment at `:5`. It is a fleet topology driver that happens to live
in the cursor bridge.

| Line range | Responsibility | Class | Evidence |
|---|---|---|---|
| 1-30 | Header: control-flow topology law + verb synopsis | GENERIC | `:5` "same reaping law as spine-spawn — just cursor-agent in the panes" |
| 32-51 | Tool paths, `die`/`log`/`hj` | GENERIC | `:35` `CTL_FLEET="$HOME/herdr-spine/bin/ctl-fleet"` |
| 53-82 | `pane_id_from_json` (verbatim twin of `cursor-spine:115-130`), `spine_stdout_json` | GENERIC | `:58` `for parent in ("pane","root_pane","rootPane")` |
| 84-87 | `worktree_name_for` — third copy of the cursor namer | CURSOR | `:84` "matches cursor-spine worktree_name_for" |
| 89-124 | `workspace_by_label`, `pane_exists`, `run_forever_in_pane`, dispatch | GENERIC | `:120` `HERDR_ENV != 1` precondition |
| 126-172 | `up` — workspace create, pwd stamp, CORD into root pane | GENERIC | `:147` `workspace report-metadata --source cursor-fleet --token "pwd=..."` |
| 174-236 | `orch` — task tab + `statem-tabs.json` registration + ORCH spawn | GENERIC | `:194` `~/.tower/statem-tabs.json` |
| 238-242 | `worker` — passthrough to `cursor-spine` | GENERIC | `:241` `exec "$SPINE" "$@"` |
| 244-357 | `make` — Plan→Impl bifurcation, parallel coder ∥ test-maker | GENERIC | `:289` `"$SPINE" verify-mark "$ABS_BRIEF"` |
| 359-415 | `monitor` — singleton CTRL + TOWR funnel | GENERIC | `:398` runs `ctl-fleet`; `:408` runs `twr` |
| 417-475 | `fanout` — ≤4 briefs, grid layout | GENERIC | `:428` refuses >4 briefs |
| 477-527 | `down` — `--wait-done`, reap, close workspace | GENERIC | `:507` `hj agent wait "$PANE" --until done` |
| 529-556 | `status`, help | GENERIC | `:538` `== monitor (singleton) ==` |

## 4. `cursor-finish` (473 lines)

**Zero references to `cursor-agent`.** Its only cursor coupling is a path
convention. This file is a generic Made-Well Verify-beat driver.

| Line range | Responsibility | Class | Evidence |
|---|---|---|---|
| 1-59 | Header, config, `die`/`log`/`hj`, third copies of `pane_id_from_json` / `spine_stdout_json` / `pane_exists`, `tower_board` | GENERIC | `:58` `bun "$TOWER_CLI" post "$1" "$BOARD_TOPIC" "$2" --from cursor-finish` |
| 61-90 | `tower_operator` (operator-addressed ledger rows), `append_ruling` | GENERIC | `:73` `"to": "operator"` |
| **92-97** | `worktree_path` — hardcodes cursor-agent's worktree root | CURSOR **[v]** | `:96` `printf '%s/.cursor/worktrees/%s/%s' "$HOME" "$repo" "$1"` |
| 99-137 | `load_state`, `resolve_git_root`, `print_dry_run_plan` | GENERIC | `:100` `.make/$SLUG.json` |
| 139-154 | `wait_workers` — latch on panes | GENERIC | `:147` `"$LATCH" wait --pane "$pane" --until done --timeout 24h` |
| 156-202 | `commit_worktree`, `integrate` (merge both worktrees, conflict → operator alert) | GENERIC | `:187` `git worktree add -b "$FINISH_WT" "$finish_path" main` |
| 204-251 | `write_tester_brief`, `run_tester`, `read_verdict` | GENERIC | `:231` `"$SPINE" tester --dir ... --brief "$TESTER_BRIEF"` |
| 253-291 | `spawn_arbiter`, `re_prompt_worker` | GENERIC | `:279` `hj agent prompt "$pane" "$msg" --wait --until working` |
| 293-323 | `triage` (nQ-bounded loop), `land_main` | GENERIC | `:302` `if [[ $nq -gt $NQ_MAX ]]` |
| 325-380 | `preserve_worktree`, `branch_reachable_elsewhere` | GENERIC | `:377` `merge-base --is-ancestor` |
| 382-434 | `cleanup`, `cleanup_and_preserve_rc` EXIT trap, `post_land_deliverable` | GENERIC | `:424` `local trap_rc=$?` |
| 436-473 | Main: parse, dry-run, arm trap, run pipeline | GENERIC | `:466-469` `wait_workers` / `integrate` / `triage` / `land_main` |

## 5. The classification totals

| File | CURSOR-SPECIFIC | DUPLICATED-GENERIC | UNCLEAR | Total |
|---|---|---|---|---|
| `cursor-spine` | 243 | 615 | 0 | 858 |
| `cursor-fleet` | 4 | 552 | 0 | 556 |
| `cursor-finish` | 6 | 467 | 0 | 473 |
| **All three** | **253 (13.4%)** | **1,634 (86.6%)** | **0** | **1,887** |

**No row is UNCLEAR.** Four blocks are *mixed* rather than unknowable —
`cursor-spine:54-64` (constants, one of which is `CURSOR_AGENT`), `:391-418`
(arg parsing, one flag of which is `--mode`), `:593-644` (a dry-run report that
prints a cursor-agent command line), `:717-757` (the herdr call, whose only
cursor content is the literal `cursor` at `:741`) — each classified by its
dominant responsibility with the minority line named inline.

### The genuinely cursor-specific surface, complete

Everything that must survive in an adapter, in full:

1. **`cursor-agent` invocation** — `:60` binary resolution via
   `CURSOR_AGENT_BIN`; `:588` the `-p` argv; `:332` the resume argv; `:699`
   `create-chat`.
2. **Model slug mapping** — `:508-543`, pi gateway slug → cursor-agent model
   id, plus two shim-local role defaults.
3. **Worktree naming + pre-creation** — `:76-79`, `:85-113`, because
   `cursor-agent --worktree` takes an optional value that eats the next
   positional (`:584-587`) and sets its worktree up asynchronously (`:89-92`).
4. **The no-sparse-flag workaround** — `:368-389`.
5. **`--mode plan|ask`** — `:419-428`, a cursor-agent top-level flag.
6. **Stream-json output parsing** — `:777-804`.
7. **The `~/.cursor/worktrees/` path convention** — `cursor-spine:99`,
   `cursor-finish:96`.

Seven items, 253 lines. Everything else in the 1,887 is a second copy of
something `~/herdr-spine/bin/` already has.

---

## 6. Divergences that are not mere duplication

Duplication is cheap to fix. These are places where the two bodies **behave
differently for the same input**, which is the part that will bite during
migration.

| Behaviour | `spine-spawn` | `cursor-shim` | Consequence |
|---|---|---|---|
| Sparse mode | `--no-cone` (`:450-453`: "cone mode always includes top-level files; non-cone is pure pattern matching") | `--cone` (`cursor-spine:106`) | **Same declared partition yields a wider checkout on cursor.** `worktree-lifecycle.md:92` calls sparse-at-spawn DOOR on "both spawners" without recording that the two doors are not the same size |
| Worktree root | `~/.spine/worktrees/<repo>/<slug>` (`:447`) | `~/.cursor/worktrees/<repo>/<name>` (`cursor-spine:99`) | Two trees to reap; `spine-spawn reap` cannot see cursor's |
| Existing path | adopts with a WARN (`:461-465`) | **refuses** (`cursor-spine:100-103`) | Opposite recovery behaviour after a crash |
| Existing branch | reuses if it verifies (`:469-477`) | always `-b` (`cursor-spine:104`) | Cursor re-spawn on the same slug fails where spine recovers |
| Partition source | explicit `--sparse` **or derived from the brief** (`:315-317`) | explicit `--partition` only (`cursor-spine:403`) | A cursor coder with a `Touch ONLY` brief silently gets a full checkout |
| Full-checkout warning | quantified disk cost (`:339`, `:355`) | one-line log (`cursor-spine:687`) | — |
| Break-glass env var | `VERIFY_GATE=off` (`:366-376`) | `CURSOR_VERIFY_GATE=off` (`cursor-spine:457`) | Two names for one law; an audit for one misses the other |
| Lineage destination | `~/.tower/ledger.jsonl` (`:719`) | `~/.tower/board.jsonl` (`cursor-spine:59`) | 3,107 id-less rows on the board — see `TUP-GROUNDING.md` §2 |
| Wait mechanism | flip-or-fail (`:172-208`) | 0.5s poll (`cursor-spine:829`) — while `cursor-finish:147` uses `latch` correctly | The shim disagrees with itself |
| Identity stamp | ledger row is source of truth, metadata is "a nicety" (`:766`) | metadata only, all `\|\| true` (`cursor-spine:711-714`) | A cursor stamp that fails leaves no trace anywhere |

---

## 7. Corrections to the brief's Pre-Verified Facts

| # | Brief's claim | Verdict | What is true |
|---|---|---|---|
| 1 | "Only 3 of the 19 mention `kind` or `harness`... The other 16 are already harness-agnostic" | **Wrong in both directions; conclusion survives and improves** | `spine-fleet` and `spine-inbox` are **false positives** — their `kind` hits are Tower message kinds. `ctl-fleet` and two `handlers/` files were **missed** because the glob was `spine-*`. Genuinely coupled: **2 of 19**, so **17 are agnostic, not 16** |
| 2 | "cursor-shim references 1 of the 19 verbs" | **Understated** | Three appear by name: `spine-spawn` (5 mentions, all negative or aspirational — `README.md:20` says "**never** `spine-spawn`"), `spine-report` (1 file), `ctl-fleet` (2, and the **only** spine binary actually executed, at `cursor-fleet:398`). The seven verbs listed as zero-reference are **confirmed zero** |
| 3 | "The concierge dispatched briefs instructing workers to use `spine-claim`... **On cursor that instruction is dead on arrival**" | **Wrong, and this changes Unit 4** | `spine-claim:157,213` uses `$HERDR_PANE_ID` + `herdr pane report-metadata`. Both are engine-blind. **The instruction works on a cursor pane today, unmodified.** The gap is that nothing in cursor-shim's briefs or profiles ever issues it. This is a **doctrine gap, not a capability gap** — Unit 4 is "deliver a true instruction that was never delivered", not "correct a false one" |
| 4 | `spine-spawn:1470-1475` refusal | **Confirmed verbatim** | — |
| 5 | `cursor-spine` 858 / `cursor-fleet` 556 / `cursor-finish` 473 = 1,887 | **Confirmed** | — |
| 6 | Cursor-specific surface "is narrow" | **Confirmed and quantified** | **253 lines, 13.4%.** The brief's three named examples (`:13` exec, `:519` model slugs, `:369` sparse) are all real; four more exist (worktree naming/pre-creation, `--mode`, stream-json parsing, the `.cursor/worktrees` path) |
| 7 | Implied: the barrier is architectural | **Wrong — the barrier is one `if` statement** | herdr seats cursor natively. `~/bin/herdr:78` runs `agent start "$name" --kind cursor --pane "$pane"` at the desk door; `cursor-spine:741` runs the identical call; two cursor panes are live on this machine now (`w3S:p1`, `w3V:p1`, `agent_session.source = "herdr:cursor"`). `spine-spawn:628` makes exactly that call for every other kind. **`spine-spawn` refuses a capability its own runtime already has** |

### New finding not in the brief: the enforcement estate misdirects cursor

`primitives/hooks/spawn-door.sh:37-39` denies `herdr agent start`
unconditionally — no harness branch — and points the agent at
`~/bin/spine-spawn`. `HARNESS-PARITY.md:70` records that hook as FULL on
cursor. `spine-spawn:1459-1468` reads the desk default, which `~/bin/herdr:83`
sets to `cursor` after `herdr cursor`. `spine-spawn:1470` then refuses it.

**A cursor agent spawning by the book is denied by the door, redirected to the
spine, and refused by the spine — and the deny text never names
`cursor-fleet`.** Full write-up in `TUP-GROUNDING.md` §3.

---

SOURCES (2026-08-16, this session): `ls ~/herdr-spine/bin/` → 19 entries;
per-file `wc -l` and shebangs; the three grep passes above run over the whole
directory including `handlers/`; every recorded hit read in context. Header
docstrings read for all 17 non-`spine-spawn` verbs. `spine-spawn` function
index plus `:446-455`, `:545-660`, `:613-641`, `:724-770`, `:1440-1484` read
directly. `ctl-fleet:8-24, 227-244` read directly. `spine-claim`,
`spine-report`, `spine-workspace`, `spine-ruling` mechanisms read directly.
`herdr api schema --json` (251 KB) dumped and searched. `herdr agent list` run
live. `~/bin/herdr` read in full. `primitives/hooks/spawn-door.sh` read in
full. The `cursor-spine` / `cursor-fleet` / `cursor-finish` classification was
produced by a read-only full-file assist; the rows marked **[v]**
(`cursor-spine:96-113`, `:205-209`, `:368-389`, `:508-543`, `:703-715`,
`:717-757`; `cursor-finish:92-97`), the spine-verb reference counts, and
`README.md:20` were re-verified personally against the files before entering
this document. Line-count totals in §5 are the assist's arithmetic over ranges
the coordinator spot-checked but did not re-add.
