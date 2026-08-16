# CORD [herdr-spine] — harness parity: everything cursor-shimmed gets a claude + pi match

**Operator mandate, 2026-08-14, verbatim intent:** *"everything cursor shimmed needs to have
a match in Claude Code and pi."*

**Why this is law, not tidiness.** The operator bounces between the Anthropic and Cursor
subscriptions by design — rate limits force it, and provider-agnosticism is his core
cost-control instrument, not an aesthetic. **A gate that exists only on cursor means every
claude and pi run is silently ungated.** He would not be trading a slow factory for a fast
one; he would be trading a *gated* factory for an *ungated* one without being told. Same for
a Land that only runs on cursor: half the work would never reconcile.

You own `~/herdr-spine` — `spine-spawn` (the claude/pi/codex spawn primitive), `bin/handlers/`
(the event dispatcher), and the spine tooling. `CORD cursor-shim` owns `~/cursor-shim`.
**Neither of you owns the contract alone** — see §4.

---

## 1. Measured state (verified 2026-08-14 — re-verify before building)

| Capability | cursor | claude / pi | Verdict |
| --- | --- | --- | --- |
| Verify gate (criteria-before-code) | `CURSOR_VERIFY_GATE` in `cursor-spine` | **`SPINE_VERIFY_GATE` in `spine-spawn`** — `verify-mark`, `verify_unit_key`, REFUSED path | **PARITY EXISTS.** Do not rebuild; align semantics only. |
| Forced coder worktree isolation | yes, every path | **verify** — confirm `spine-spawn` forces it too | check before assuming |
| Verify-beat roles: `test-maker`, `tester`, `arbiter` | `~/cursor-shim/profiles/` | **ABSENT** — agent-core has only coder, concierge, coordinator, orchestrator, researcher | **GAP** |
| Finisher / Land (`cursor-finish`) | exists; merges, runs qa-verify, tears down, posts deliverable | **NOTHING** | **GAP — the worst one** |
| Freshness gate (A3) | being built | not built | **build both, together** |
| WIP rope (A4) | being built | not built | **build both, together** |

## 2. Gap 1 — the Verify-beat roles (do this first; it is cheap and it unblocks everything)

The doctrine is that a single agent running the loop fails in **four distinct ways**: it games
its own tests, it cannot see past a pre-existing bug, the implementation is simply wrong, or
the tests are simply wrong. Four failure modes, four separated roles. **Off cursor, three of
those four roles do not exist**, so a claude or pi fleet cannot staff the loop at all.

Port `test-maker`, `tester`, and `arbiter` into `~/agent-core/primitives/profiles/` so
`spine-spawn --profile` can resolve them, and add them to `models.json` with `kind_models` for
the claude tier. Read the cursor originals first; **preserve the role semantics exactly** —
the test-maker derives from plan only and never reads code, the tester never diagnoses, the
arbiter alone rules bad-test vs bad-implementation vs pre-existing/out-of-scope with an nQ
ceiling of 3.

**Carry the dissimilarity rule across with them.** The six-agent loop is dissimilar redundancy
— the avionics pattern where channels are deliberately different so failures do not correlate.
The design rule: **never the same model family for test-maker and implementer.** Today on
cursor both resolve to `composer-2.5:fast`, which is exactly the correlated-failure case the
pattern exists to prevent. Encode the rule where models are chosen so it cannot drift, and
raise it as a ruled proposal if honoring it costs rate-limit headroom — the operator's
constraint is real and his call.

## 3. Gap 2 — a finisher for claude/pi (this is A5's other half)

`cursor-finish` is the only Land that runs anywhere in this operation. Measured consequence:
`.madewell/work/tax.jsonl` is **0 bytes, created 2026-07-13**, and `git log --grep="LEARNED:"`
returns **0 of 849 commits**. Land was designed, specified, provisioned, and never written
once — and outside cursor there is not even a mechanism that could write it.

`CORD cursor-shim` is extending `cursor-finish` with the four Land faces — **DELTA, LEARNED,
PROPAGATED, TAX** — appending TAX to `tax.jsonl`. You build the claude/pi match.

- **Do not fork their implementation.** Agree the *contract* (§4), then implement it for your
  primitive. Two divergent finishers is the same defect as two divergent gates.
- **PROPAGATED is the carry-forward** — what this unit's landing invalidated or unblocked.
  That edge is what stops the next wave rebuilding what already shipped; a client asked for a
  caller to substrate that had landed hours earlier, unwired.
- Land is **per unit of work**, not per session.

## 4. THE CONTRACT IS SHARED — this is the part that must not be got wrong

Do not implement A3 (freshness gate), A4 (WIP rope), or the finisher as a cursor thing plus a
spine thing that happen to resemble each other. **Write ONE door contract, in agent-core,
owned jointly with `CORD cursor-shim`**, naming for each refusal: its trigger, its inputs, its
failure mode, its break-glass, and its audit row shape. Then each primitive implements that
contract.

Two facts already known that the contract must accommodate, so neither side rediscovers them:

- **Deps capture is strongest on Claude Code and weakest on cursor.** CC registers
  `PostToolUse` with matcher `*` (fires after every tool, including `Bash`). Cursor exposes
  only `sessionStart`, `preToolUse`, `sessionEnd`, `preCompact` — **no `PostToolUse`** — so it
  must capture pre-call. This is the exact inverse of the finisher, which ships cursor-first.
  **No single "cursor-first" or "claude-first" policy is correct for both**; the contract must
  state per-capability which primitive leads.
- **Fail closed on staleness, fail VISIBLE on incompleteness.** Grounding legitimately runs
  through the shell, which tool-level read hooks miss, so the deps graph will have holes on
  every harness. A graph that hides its holes is worse than no graph, because the gate
  downstream trusts it.

Coordinate through the field, not through the concierge: emit `work-available` routed to
`CORD cursor-shim` for the contract, claim theirs when it is routed to you. `17-field-pull`
now injects routed work when a pane goes idle, so waiting is a choice.

## 5. Contract

Branch first; one unit, one branch, one PR each. **`~/herdr-spine` is load-bearing right now**
— every claude and pi spawn in the operation goes through `spine-spawn`, and the dispatcher in
`bin/handlers/` fires on every pane event, so a broken handler degrades the whole fleet.
Additive and reversible; verify a real spawn and a real event still work after every change.
Note `bin/handlers/17-field-pull` was added tonight by the concierge — read it before touching
the dispatcher.

Anything destructive or irreversible comes to the concierge as a ruled proposal. Two acceptable
stopping states: every done-condition met, or a posted `need-help`/BLOCKED naming what you need
and who owns it, after doing everything that does not depend on it.

Post to board topic `herdr-spine/parity`.

SOURCES: `grep` of `spine-spawn` for `SPINE_VERIFY_GATE`/`verify-mark`/`verify_unit_key`
(present); `ls ~/herdr-spine/bin` (no finisher); `ls ~/cursor-shim/profiles` vs
`~/agent-core/primitives/profiles` (test-maker/tester/arbiter absent off cursor);
`~/.claude/settings.json` and `~/.cursor/hooks.json` hook surfaces; `tax.jsonl` 0 bytes;
`git log --grep="LEARNED:"` 0 of 849 — all verified 2026-08-13/14 by the concierge.
