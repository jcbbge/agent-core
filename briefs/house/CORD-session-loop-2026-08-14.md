# CORD [house] — Encode the session loop at every striation

You are Coordinator for the **house** (agent-core law + composed entrypoints).
You never implement. Do NOT use emojis.

**Harness-agnostic (operator law, this correction):** briefs name **roles and
profiles** (`coordinator`, `orchestrator`, `coder`), never a provider, model,
or `--kind`. Spawn through the path of **this session's root harness**
(`primitives/directives/<harness>.md`). This concierge session is cursor →
`cursor-fleet` / `cursor-spine` + `profile-model`. Fleets stay
harness-homogeneous. Do not write `claude` / `opus` / `fable` / `sonnet` /
`pi` into law or briefs.

Operator 2026-08-14, after a failed concierge session. The six failures below
are **already ruled**. You encode them. You do not rediscover them. You do not
ask the operator to confirm the loop — it is the loop.

Guest book already written: `~/circadian/mind/USER.md` §2026-08-14.

---

## The session loop (filter — every tier, every response)

```
(a) herdr          Ghostty → herdr. One multiplexer. No work outside it.
(b) concierge      New session starts a concierge. Presence = go.
(c) spawn          Identify threads. Spawn parallel async (herdr SOP).
                   One load-bearing thread stays up until Land or Park.
(d) stop states    Done (proof on disk) OR Parked (pickup path on disk).
                   No third state. Diagnosis is not Done.
(e) reap           Panes, worktrees, allowlisted Docker/Neon of that thread.
                   Leftovers = the unit did not finish.
```

Every profile, skill, and rule you touch must make a response that fails
this filter **illegal** (refuse, not "please remember").

---

## Six failures → six encodings (do all)

| # | Failure | Resolution (write this into law) | Files (canonical; sync composes entrypoints) |
|---|---|---|---|
| 1 | Made the operator the scheduler ("say the word", "which first") | Session start / first operator message **is** authorization. Ban those phrases. Ruled proposal or act. Open questions only when a hard stop (destructive, credentials, genuine scope change). | `primitives/profiles/concierge.md` doctrine 5+11; `primitives/skills/starting-session/SKILL.md` — kill "What are we expanding into?" when threads are already named or NOW/flight already names them |
| 2 | Treated Phase 1 ground as Land; reaped Tower after a diagnosis | **Diagnosis ≠ Land.** Reap a *mission workspace* only when the outer item is Landed or Parked on disk with a pickup brief. Sub-phase `.done` does not authorize `workspace close`. | `primitives/rules/control-flow.md` §Reaping; `primitives/skills/ending-session/SKILL.md` Step 1 — add the diagnosis/park exception |
| 3 | Parked the load-bearing thread to chase later threads | Concierge holds **one load-bearing** CORD until Land or Park. Other threads spawn async and must not starve it. "Top priority" from the operator **is** the load-bearing thread. | `concierge.md` new doctrine line; desk card |
| 4 | Two stories: "assume operational" vs "never worked" | Desk-card fact: **mailbox ≠ substrate.** Tower operational = `PHASE2-WRITE-GATE-PROOF.md` (or successor) exists and the probe was run. Until then, say "mailbox only." Never "assume operational." | `concierge.md` desk card; `primitives/mcps/tower/COMMS-ARCH.md` one sentence if missing |
| 5 | Labeled leftovers instead of reaping | Reap-as-law: take a resource, return it at Done/Park. Panes, worktrees, Arc Docker allowlist, Neon numeric allowlist. `docker system prune -a` stays banned. | `ending-session`; `control-flow` §Reaping; do not edit Arc invariant 8 (already in flight) except to *cite* it |
| 6 | Narrated; collected hope | Collect = named artifact exists. Status is pull (herdr/board/field). No "I'll collect later" without a latch/path. starting-session breathe-mode already says stop-and-wait — keep that only when the pool is empty. | `concierge.md` swan + doctrine 3; starting-session skip-ritual |
| 7 | Hardcoded provider/model/`--kind` in briefs and spawns | Briefs name **profiles/roles** only. Spawn verbs live in `primitives/directives/<harness>.md`. Models via `profile-model`. Fleets harness-homogeneous with the root session. Sweep today's briefs that still say opus/fable/sonnet/claude-as-kind. | `primitives/AGENTS.md` (already states this — tighten so a brief cannot violate); `concierge.md` desk card spawn line; `brief/SKILL.md` if it still allows kind/model in the template |

---

## Striations (every layer is a filter)

Work **down** this list. Same law, tighter at each layer. Do not invent a
second protocol.

1. `primitives/profiles/concierge.md` — operator-facing
2. `primitives/rules/control-flow.md` — hierarchy + reap
3. `primitives/skills/starting-session/SKILL.md`
4. `primitives/skills/ending-session/SKILL.md`
5. `primitives/skills/concierge/SKILL.md` — door only; point at profile
6. `primitives/directives/<harness>.md` (the root session's delta only) +
   compose so deployed entrypoints match. Edit sources, not `~/AGENTS.md`.
7. Coordinator + orchestrator profiles: one line each — they inherit (d)(e);
   they never ask the operator for "are we done"

If a file already says the thing, **tighten** it so the 2026-08-14 failure
cannot recur. Do not add a sermon.

---

## Done-when

- All six encodings are in the canonical files (or an ORCH finding that a
  specific file already forbids the failure, with a quote).
- A short `primitives/rules/session-loop.md` **only if** control-flow would
  bloat — prefer extending control-flow over a new file. If you add a file,
  link it from control-flow and concierge house-law table.
- `agent-core sync` (or the house compose command you verify) run so deployed
  entrypoints match. Cite the command you ran.
- Board `house/session-loop`. Banner `===== CORD HOUSE =====`.
- `.done` at `briefs/house/session-loop-2026-08-14.done`.

## Constraints

- Do not implement Tower write-gate (other CORD). Do not touch Arc product.
- Do not `git add -A`. Do not push.
- No emojis. Tests: none required beyond "the forbidden phrases are gone
  from starting-session when threads exist."

## Report

Per-file diff summary + which failure number each edit closes.
