# HANDOFF — Claude → Cursor harness switch, mid-flight

Written by the concierge, 2026-08-13, as the Anthropic 5-hour window neared exhaustion.
Every claude-harness pane in the fleet will start hitting network errors mid-turn. The
fleet resumes on the **Cursor subscription** via `cursor-shim`.

**Nothing about the work changes. Nothing about the law changes. The ONLY thing that
changes is how the fleet is invoked.**

---

## 1. How to invoke the fleet under Cursor (the only delta)

Verified against the live CLI 2026-08-13. **Never `spine-spawn --kind cursor`** — that
path is refused and points here.

```bash
cursor-fleet monitor [--dir <root>] [--down]          # the ONE CTRL + TOWR funnel (idempotent)
cursor-fleet up <project> [--dir <root>] [--brief <p>|--prompt <t>] [--statem]
cursor-fleet orch <slug> (--brief <p>|--prompt <t>) [--workspace <id>] [--dir <root>]
cursor-fleet make <slug> --brief <p> [--workspace <id>] [--dir <root>] [--no-finish]
cursor-fleet worker <profile>[:opt] (--brief <p>|--prompt <t>) [--pane <id>] [--workspace <id>] [--dir <root>]
cursor-fleet fanout <task> --brief <p> [--brief <p>...] [--workspace <id>]   # cap 4
cursor-fleet down <project> [--wait-done [--timeout MS]]
cursor-fleet status
cursor-spine <profile> --prompt _ --dry-run           # inspect model resolution, spawn nothing
cursor-spine resume <chat_id> --prompt "..."          # re-prompt a persistent tier
cursor-spine verify-status <brief>                    # is the test path forked?
cursor-spine reap --all|--done
```

### Topology differences from the claude-era shape (IMPORTANT)

- **`CTRL` and `TOWR` are FLEET-WIDE SINGLETONS**, stood up ONCE at the concierge tab by
  `cursor-fleet monitor`. herdr is one multiplexer, so a per-workspace CTRL is N copies of
  one view. **The claude-era layout I built has three CTRL panes** (`CTRL fleet`,
  `CTRL arc`, `CTRL .tower`) — consolidate to the single funnel when you relaunch.
- **`statem` IS per-project** — one per project, via `up --statem`, as a split off that
  project's CORD. `statem arc` is already running that way and is correct.
- Each ORCH gets its **own tab**; its AGNT/SAGT workers are **panes in that tab**.
- **Naming, role tokens, and lineage are stamped at birth by the shim — do NOT restamp.**
  This is the opposite of the claude path, where `spine-spawn orch` mints a broken
  registration name and a wrong role token that must be fixed by hand.
- Async AGNT/SAGT panes **self-reap** on completion; CORD/ORCH never self-reap.

### The Verify beat is MECHANICALLY ENFORCED here

`cursor-fleet make` is a hard bifurcation: implementer and test-maker spawn in parallel in
**separate worktrees** from the same plan, so the coder's filesystem physically cannot
contain the tests. A `coder` spawn is **refused** for any unit with no forked test path.
Test-maker derives tests from intent only and never reads code; only the `tester` sees
both. A red test is a "Q" for the `arbiter`, which rules bad-test / bad-implementation /
out-of-scope, with **nQ ceiling 3**. Break-glass `CURSOR_VERIFY_GATE=off` is loud and
audited. Exit gate: automated green (reproduced, not claimed) AND human-QA items passed
AND green on `main`. Full spec: `~/cursor-shim/docs/inner-loop-verify.md`.

### Pre-verified environment facts

- `cursor-agent models` → **201 models**, subscription live.
- **Model assignment — operator directive 2026-08-13, Cursor is ALSO rate-limited.**
  Coordinators and orchestrators run `cursor-grok-4.5-high-fast`; coding and sub agents
  run `composer-2.5-fast`. Set as the **default** option for each profile in
  `~/agent-core/primitives/profiles/models.json` and activated via `profile-model set`,
  so a fresh spawn gets it with no flag. Verified by `--dry-run`:

  | Profile | pi-slug | cursor model |
  | --- | --- | --- |
  | coordinator | `cursor/grok-4.5:fast` | `cursor-grok-4.5-high-fast` |
  | orchestrator | `cursor/grok-4.5:fast` | `cursor-grok-4.5-high-fast` |
  | coder | `cursor/composer-2.5:fast` | `composer-2.5-fast` |
  | researcher | `cursor/composer-2.5:fast` | `composer-2.5-fast` |
  | test-maker / tester | `cursor/composer-2.5:fast` | `composer-2.5-fast` |
  | arbiter | `cursor/kimi-k3:high` | `kimi-k3-high` (deliberate exception) |

  The `test-maker`/`tester`/`arbiter` slugs are shim-local fallbacks hardcoded in
  `~/cursor-shim/cursor-spine` (~line 461), not in `profile-model` — change them there.
  **The arbiter is deliberately NOT downgraded:** it fires only on a red test, so its
  volume is negligible, while a wrong bad-test/bad-implementation ruling re-loops the
  whole unit against an nQ≤3 ceiling. Cheapening the judge to save tokens spends more.
  The old non-fast options remain selectable per profile if a lane needs more headroom.
- `.cursor/agents/*.md` bake the model in at generation time, so **re-run
  `~/cursor-shim/bolt-on <repo>` after any model change** — done for Arc and agent-core.
- Profiles: `~/agent-core/primitives/profiles/` (concierge, coordinator, orchestrator,
  coder, researcher) plus the Verify-beat set at `~/cursor-shim/profiles/` (coder,
  test-maker, tester, arbiter).
- Cursor fleet agents carry **native `tower_*` and `arc_*` MCP tools** — use those, not
  CLI shell-outs, for board posts and Arc reads.
- **Arc was NOT bolted on; I bolted it on today.** `~/infinity/arc/.cursor/` now holds
  `rules/cursor-fleet.md` + five generated `agents/*.md`. **These files are UNTRACKED** —
  the Arc infra-retrofit lane should commit them (it already owns root config, W5).
  `~/agent-core/.cursor/rules/cursor-fleet.md` was already present.

---

## 2. Standing operator law that does NOT change

- **Hierarchy:** OPERATOR → CONCIERGE → CORD (one per project) → ORCH (one per unit) →
  AGNT/SAGT. `~/agent-core/primitives/rules/control-flow.md` is the law.
- **No background agents for units of work.** Operator directive, 2026-08-12, verbatim
  intent: *no Claude agents running in the background; use herdr.* If it is a unit of
  work it is a **visible pane**. The only sanctioned harness-internal use is a
  single-turn read-only assist. Note the cursor-shim README mentions Cursor's native
  `Task` tool for in-process subagents — the operator's standing directive overrides
  that for anything that is a unit of work.
- **Comms:** `~/.tower/COMMS-ARCH.md`. One message, one audience, once, in full. Status is
  not mail. Fleet mail flows up the chain. Only `to:"operator"` reaches Josh.
- **The rubric, mandatory** (`~/.tower/RESPONSIBLE-PARTY-AND-NQ.md` §3): craft/beauty/care ·
  world-class DX · memorable and lovable UX · efficient optimized agentic experience.
  The operator's current priority is the **10X agentic experience** clause.
- **Reaping:** done = gone. Furniture (CTRL/TOWR/TSKS/statem) lives as long as the session
  that stood it up, and an operator instruction to spin one down is executed immediately.
- **A worker's "done" is not done.** Verify the artifact on `main`, never the report.

---

## 3. Live lanes at the moment of the switch

`main` tips: **Arc `cadcc24`**, **agent-core `07089d3`**.

### Arc — workspace `arc` (w2V), CORD in tab 1

| Lane | State | Where the work lives |
| --- | --- | --- |
| **CORD Arc** (`cord-arc`) | coordinating; ratified: root checkout read-only to ORCHs, no `bun install` under parallel streams | brief `docs/developer/orchestration/CORD-broad-launch-2026-08-12.md`; board `arc/broad-launch` |
| **ORCH infra-upgrade** | ACTIVE — the priority lane. Grounded; **ruled W1 SAFE with line-by-line evidence** (kernel `install.sh` is the documented idempotent path; `madewell.json` existence-guarded so the seam map survives; `cycles/` untouched so paused ORCH state survives; schemas byte-identical; 0 deletions / 22 additions). Was holding for CORD's go on contested surfaces. | brief `docs/developer/orchestration/ORCH-infra-upgrade-2026-08-12.md`; board `arc/infra-upgrade` |
| WS-B merge tags | PAUSED, state posted | `docs/ws-b-merge-tag-vocabulary`, `test/ws-b-build-id-criteria`, worktree `arc-worktree-feat/ws-b-contract-version-build-id`; board `arc/ws-b` |
| WS-C Galley parity | PAUSED, state posted | board `arc/ws-c` |
| WS-D Galley data plane | PAUSED, state posted (its first halt post was corrected by the CORD) | `fix/ws-d-sellable-filter`, `spine/ws-d-sellable-filter-test`, `docs/ws-d-galley-corpus-integrity`; board `arc/ws-d` |
| WS-F inventory | PAUSED — **deliverable LANDED**: PR #230 / `cadcc24`, the 662-line multi-location inventory spec (the meeting gate) | board `arc/ws-f` |
| WS-G portal auth | PAUSED, state posted | `docs/ws-g-client-auth-spec`, `docs/ws-g-impl-briefs`, `docs/ws-g-portal-client-auth`; board `arc/ws-g` |

Stream worktrees also live under `~/.spine/worktrees/arc/` (agnt-ws-g-{adr,briefs,spec},
ws-d-{corpus-integrity,sellable-filter,sellable-filter-test}).

**Streams resume ONLY on operator say-so**, and they inherit corrected instructions once
the retrofit lands.

### Tower — workspace `tower` (w2W), CORD in tab 1

| Lane | State | Where |
| --- | --- | --- |
| **CORD Tower** (`cord-tower`) | coordinating; caught a real blocker pre-commit (a stray untracked `ledger.jsonl` in the canonical home that would have committed live bus state) | brief `~/agent-core/briefs/tower-fully-operational.md`; board `tower/fully-operational` |
| **ORCH w0-version-control** | wave 1 LANDED: `5e281be` on `tower/w0-version-control` — Tower's code under version control at `~/agent-core/primitives/mcps/tower/`, 9 backups preserved into `attic/` with 9/9 sha256 match, originals untouched | branch `tower/w0-version-control`; workers on `spine/w0-{preserve-and-stage-w1,preserve-and-stage-w2,readme}` |
| **ORCH w0-canonical-source** | ACTIVE — making the repo the real source, not a snapshot. No deploy/sync mechanism existed as of `5e281be`, so the law "edit canonical, never deployed" is currently unenforceable for Tower | branches `spine/w0-swap` (`9ff8778`), `spine/w0-driftcheck` (`dbabe4f`) |
| **AGNT bus-audit** | ACTIVE, sonnet tier, READ-ONLY. Auditing the bus across four axes: agents sending, agents receiving, messages into the bus, messages read from it | brief `~/agent-core/briefs/tower-bus-audit.md`; deliverable `~/agent-core/briefs/tower-bus-audit-FINDINGS.md`; board `tower/bus-audit` |

**Tower's own open defects, already diagnosed — do not re-derive:** 26 malformed rows in
`board.jsonl` in four modes (non-JSON tool output at lines 1-3; unescaped content at 553;
invalid escape at 2113; two objects concatenated at 2502), root-caused to the documented
hand-built `echo`-a-JSON-line fallback plus unlocked appends. Every consumer parses
strictly and dies on the first bad row. No rotation anywhere (board 3.8MB, ledger 1.1MB,
843 flight, 450 deliverables). The `board` CLI verb truncates row bodies.

### Parked / deferred

- **Production uptime canary: DEFERRED by operator ruling** (Arc is not live for real
  users yet). Roll our own later, probably on a second Infinity utility server. Filed as
  **STG-651** in `~/Infinity/discovery/STAGING.md`. Do NOT stand up UptimeRobot; do NOT
  graveyard `.github/workflows/monitor.yml` until the hosting question resolves.
- `feat/openapi-drift-gate` (Arc) holds real unmerged work — merge/revive/kill is Josh's
  call, never raised.

---

## 4. Traps that will cost you a turn if you do not know them

- **`cursor-spine`/`cursor-fleet worker` with no `--pane`/`--workspace` targets the CURRENT
  pane.** A dry-run from the concierge pane resolved to `--pane w2T:p1` — i.e. it would
  have taken over the concierge's own pane. Always pass a target explicitly.
- **`herdr agent prompt` REPLACES a pane's input box, it does not append.** Text an
  operator typed but never submitted is destroyed with no error. **Read the pane's visible
  buffer before prompting it**; if there is text, capture it and re-send it separately.
  This already cost one operator instruction today.
- **`herdr pane move` leaves `HERDR_PANE_ID` stale** (injected at birth, never refreshed),
  which silently breaks `fleet-task`'s role resolution for a moved agent. Pass the pane
  explicitly.
- **`herdr pane send-keys` can silently fail to submit** on a moved pane.
- **Verify prompt delivery from the target's transcript**, not from a status flip —
  `agent prompt --wait --until working` times out uselessly against an already-working
  pane. Claude panes: `~/.claude/projects/*/<agent_session.value>.jsonl`.
- **`herdr workspace rename` takes positional `<ID> <LABEL>`** — passing `--label` sets the
  label to the literal string `--label`.
- **Parse `board.jsonl` tolerantly** — skip and count bad lines, or you die on line 1.
- **`statem` repaints tab glyphs only on a TRANSITION.** It needs both an entry in
  `~/.tower/statem-tabs.json` (Arc's is present, with per-cycle tracking) and real
  `.madewell/cycles/` state being written by the fleet.

SOURCES: `~/cursor-shim/{README.md,rules/cursor-fleet.md}`, `cursor-fleet --help`,
`cursor-agent models`, `cursor-spine coordinator --dry-run`, `bolt-on` output,
`~/agent-core/primitives/directives/cursor.md`, `control-flow.md`, `COMMS-ARCH.md`,
`RESPONSIBLE-PARTY-AND-NQ.md` §3, git branch/worktree/log in Arc and agent-core, Tower
board — all read or run 2026-08-12/13 by the concierge.
