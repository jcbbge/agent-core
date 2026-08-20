# HARNESS SHAPE — what agent-core expects of any harness

**Created:** 2026-08-20. Companion to `HARNESS-PARITY.md` (which records the
*state* of each registered harness) and to the registry grammar in
`cli/src/registry.zig` (which is the *machine* form of this shape).

This file is the SHAPE: the harness-agnostic contract a harness must satisfy to
carry the agent-core stack. It names no provider, no model, and no vendor. It is
what an agent reads before onboarding a harness nobody has onboarded before.

Onboarding is a MAPPING problem, not a porting problem. agent-core does not ship
an adapter per harness. It ships this shape, and an agent maps the harness's own
API surface onto it. Run `/agentcore onboard <harness>` to do that.

---

## Law: a capability is not installed until a registry row can fail

This file exists because of a real outage. On 2026-08-20 circadian's `wake.ts` —
the memory-injection binding — was found unbound in claude-code, absent from
`~/.pi/agent/extensions/`, and unreachable in cursor (leg 4 of a boundary hook
that itself was never bound). `graze` and `sleep` still fired everywhere, so the
substrate wrote memory that nothing ever read. For days. Silently.

`agent-core status` reported zero failures for circadian, because circadian had
zero rows. It had been excluded from the registry on the honest-sounding grounds
that agent-core "does not claim other programs' files."

**An audit that cannot fail is not an audit.** Ownership and coverage are
different questions. `deploy` answers ownership (agent-core owns these bytes).
`check` answers coverage (this capability is live here) and claims no bytes at
all. Every capability in the tables below MUST own at least one row — `deploy`
where agent-core authors the thing, `check` where another program does. A
capability with no row is not "unmanaged"; it is unmonitored, and it will rot
without a single ✗ to warn you.

---

## Half 1 — the FILE surface (deployable primitives)

Files agent-core authors and copies in. Registry verb: `deploy` (managed —
`sync` writes the destination bytes and `status` checksums them).

| Capability | What lands | Profile key | Notes |
|---|---|---|---|
| **Directive entrypoint** | composed `directive/core` + per-harness delta | `delta` + explicit deploy path | One file. Never a raw symlink — it is COMPOSED at sync time. |
| **Skills** | `SKILL.md` + every support file under it | `skills`, `skill_format` | `skill_format` is `flat` (`<dir>/<name>.md`) or `directory` (`<dir>/<name>/SKILL.md`). Support files travel with the skill or the skill is broken. |
| **Subagents** | `agents/<name>.md` | `agents` | |
| **Slash commands** | `<name>.md` | `commands`, or `prompts` as fallback | Some harnesses have only one of the two. |
| **Rules** | store-only by default | `rules`, `rule_strategy` | Default is READ-ON-DEMAND from `primitives/rules/` — deliberate, and identical across harnesses. Only set `rules` if the harness genuinely needs copies. |

## Half 2 — the BINDING surface (lifecycle capabilities)

Behavior. This is the half that rots, because a hook script sitting on disk
enforces nothing — the load-bearing fact is the BINDING: the harness config
naming it on an event. Registry verb: usually `check <harness> <config>#<needle>`.

Capability names below are agent-core's vocabulary. A harness's own event names
will differ; mapping them is the onboarding job.

| Capability | Fires when | What we bind there today |
|---|---|---|
| `wake` | session starts | Boundary legs 1–3 (carry-over, last `TODO:` handoff, flight pointer) + leg 4 memory injection (`circadian/src/wake.ts`) |
| `prompt_submit` | user submits a prompt | memory graze; task-report |
| `pre_tool` | before a tool call | the guards: utensil-guard, slim-guard, spawn-door, grounding-hook |
| `post_tool` | after a tool call | memory graze; odometer |
| `stop` | assistant turn ends | the gates: write-gate, doorbell |
| `session_end` | session closes | memory sleep; flight/session capture |
| `pre_compact` | before compaction | flight/session capture |
| `status_line` | status render | memory status line, pane/task state |

**Ordering matters at `wake`.** Legs 1–3 orient, leg 4 supplies memory. Bind them
in that order so the injected block reads handoff → flight → memory.

**Injection contract.** A `wake` binding is only useful if the harness feeds the
hook's stdout back into session context. Harnesses differ sharply here — one
takes raw stdout, another needs `{"additional_context": "..."}` JSON, a third
has no such event and needs an extension callback instead. Determine this
empirically during onboarding; do not assume.

---

## The API-surface interview

To onboard harness `X`, answer every question below **from its own docs or by
local repro** — never by analogy to another harness. Unanswered question = the
harness is not registered. Write `UNKNOWN` rather than guessing; a guess here
produces a silently dead capability, which is strictly worse than a blank.

**File surface**
1. Where is the global (user-scope) config directory?
2. What is the directive/system-prompt entrypoint filename, and is it composed or verbatim?
3. Skills: which directory, and `flat` or `directory` format? Do support files travel?
4. Subagent definitions: which directory, what filename convention?
5. Slash commands / prompts: which directory?
6. MCP registration: which file, what schema?

**Binding surface**
7. What is the hook mechanism — a config file (which one? JSON/JSONC/TOML?), a
   script directory, or code extensions (which language, which directory, which
   exported symbol)?
8. What are the harness's own event names, mapped onto the eight capabilities above?
   Which capabilities does it simply not have?
9. Hook input: what arrives on stdin/args, and what is the schema? Specifically —
   how does a hook learn the session's cwd/workspace?
10. Hook output: how does a hook inject context, block an action, or stay silent?
    What exit codes mean what?
11. Is there a status-line / sidebar surface, and how is it fed?
12. For each binding: what command PROVES it is live, without launching an interactive session?

**Fleet surface**
13. How is a non-interactive/headless session started (for spawned workers)?
14. How is a per-session identity/role stamped (env var? flag?)?

---

## Writing the profile

Answers 1–6 and 7 become a `harness` block in `~/.agent-core/registry`:

```
harness <name>
  skills       <dir>
  skill_format flat|directory
  commands     <dir>          # or prompts
  agents       <dir>
  hooks        <dir>          # script dir, if it has one
  hooks_json   <file>         # single-file hook config, if that's the mechanism
  delta        ~/agent-core/primitives/directives/<name>.md
end
```

Then a `deploy <name>` line on every primitive the harness should carry, and a
`check <name> <config>#<needle>` row for every binding from answers 8–12.

**Needle discipline.** Point the needle at the binding's own defining substring —
the hook path, or the door's defining line. A needle that survives the binding's
removal launders absence as coverage. Today's registry uses e.g.
`~/.claude/settings.json#circadian/src/wake.ts` and
`~/muster/bin/muster-spawn#def cmd_reap(`.

**Retarget, don't delete, when a door moves.** `rule/worktree-teardown-spine`
pointed at `~/herdr-spine/bin/spine-spawn` long after the reap door moved to
`~/muster/bin/muster-spawn`; the row read as breakage when it was a move. A ✗
means "look", not "delete the row."

---

## Definition of done

A harness is registered when all of these hold:

1. Every interview question is answered or explicitly `UNKNOWN`.
2. Its `harness` block is in `~/.agent-core/registry`.
3. Its directive delta exists at `primitives/directives/<name>.md`.
4. `agent-core sync --harness <name>` completes and `agent-core status --harness <name>`
   shows **0 stale, 0 missing** — or every exception is named in `HARNESS-PARITY.md`
   with a reason, not left blank.
5. Every capability it supports has a row that can fail.
6. Every capability it does NOT support is written down as a parity gap. A blank
   cell is a NO, and NO means: name what it needs — copy, shim, port, or adapter.
