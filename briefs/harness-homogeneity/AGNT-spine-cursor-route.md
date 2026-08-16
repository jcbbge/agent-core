# AGNT — teach `spine-spawn` to route cursor, and make `ctl-fleet` report honestly

One unit, two files, forked into IMPLEMENTER and TEST-MAKER by
`spine-spawn make`. Your ORCH is `ORCH [spine-routes-cursor]` (pane `w3R:p1E`).
Board topic: `agent-core/harness-homogeneity`. **No emojis anywhere.**

Read your role section at the tail. Everything above it is shared and binding
on both of you.

## Touch ONLY

- `bin/spine-spawn`
- `bin/ctl-fleet`
- `test/` (TEST-MAKER only; IMPLEMENTER never writes a test)

Repo: `~/herdr-spine`, branch `main` @ `fbb76b9`, working tree clean.
You are in a sparse worktree of it. Everything outside the list above is out of
bounds — in particular **do not touch `~/cursor-shim/`, `~/agent-core/`, or any
other `bin/spine-*` entry.**

`bin/spine-spawn` is the contended file of this whole project. Your ORCH holds
the fleet claim on it (`spine-claim claim spine-spawn`, pane `w3R:p1E`). Only
the IMPLEMENTER writes to it.

## Pre-Verified Facts

Your ORCH ran every command below in this session, 2026-08-16. Cite them; do
not re-derive them. If one is wrong, that is a finding to post, not a reason to
stop.

**The barrier (edit A):**

- `bin/spine-spawn` is 1484 lines of Python 3, stdlib only, `#!/usr/bin/env python3`.
- `:1470-1475` refuses `kind == "cursor"`:
  ```
  1470	    if getattr(args, "kind", None) == "cursor":
  1471	        log("error: cursor spawns do not go through spine-spawn — use the "
  1472	            "cursor-shim (~/cursor-shim/): cursor-fleet up|orch|worker|make|"
  1473	            "fanout, or cursor-spine for the atomic primitive. spine-spawn "
  1474	            "owns pi/claude kinds only (ruling 2026-08-11).")
  1475	        sys.exit(1)
  ```
  This is the entire barrier. The operator's harness-homogeneity ruling
  supersedes the 2026-08-11 ruling named in that string.
- `:1459-1469` reads `~/.config/herdr/desk-harness` as the default kind when
  `--kind` is absent. That file currently contains `claude`. `~/bin/herdr:33`
  normalises `cursor|cursor-agent` to `cursor` and `~/bin/herdr:83` writes it
  there, so the desk default can legitimately be `cursor`.

**herdr already seats cursor — nothing new is being invented:**

- `bin/spine-spawn:624,628` seats every kind with
  `run_json("agent", "start", name, "--kind", kind, "--pane", pane_id, "--timeout", timeout_ms, *passthrough, ...)`
  where `:624` is `passthrough = ["--", *extra] if extra else []`.
- `~/bin/herdr:78` runs `"$REAL" agent start "$name" --kind "$kind" --pane "$pane"`.
- `~/cursor-shim/cursor-spine:741` makes the identical call with `--kind cursor`
  today.
- `herdr api schema --json`: `AgentStartParams.kind` is an unconstrained
  `string`. herdr does not gate kinds.
- `cursor-agent` is installed at `/Users/jrg/.local/bin/cursor-agent`, version
  `2026.08.11-e8db854`.

**Model resolution (edit B) — the operator's profile choice is silently discarded today:**

- `:554-572` `kind_model(kind, profile, model)`: `:559` returns `model`
  unchanged for `kind == "pi"` or empty model; otherwise `:569` looks up
  `table.get(profile, {}).get("kind_models", {}).get(kind)` in
  `~/agent-core/primitives/profiles/models.json`.
- **Verified by reading that file in full: every profile's `kind_models` map
  contains exactly one key, `claude`.** So for `kind == "cursor"`,
  `kind_model()` returns `None`, no `--model` is passed, and the agent inherits
  cursor-agent's default — discarding the profile.
- `profile-model` resolves (run this session):
  `coder` -> `cursor/composer-2.5:fast`; `orchestrator` -> `cursor/grok-4.6:high`;
  `researcher` -> `cursor/composer-2.5:fast`.
- The translation table to port is `~/cursor-shim/cursor-spine:523-541`
  `map_model()`. Its explicit rows, verified 2026-08-11 against
  `cursor-agent models` for this account:

  | gateway slug | cursor-agent id |
  |---|---|
  | `cursor/grok-4.5:high` | `cursor-grok-4.5-high` |
  | `cursor/grok-4.5:fast` | `cursor-grok-4.5-high-fast` |
  | `cursor/grok-4.6:high` | `cursor-grok-4.6-high` |
  | `cursor/grok-4.6:fast` | `cursor-grok-4.6-high-fast` |
  | `cursor/kimi-k3:high` | `kimi-k3-high` |
  | `cursor/kimi-k3` | `kimi-k3-high` |
  | `cursor/kimi-k2.7-code` | `kimi-k2.7-code` |
  | `cursor/composer-2.5` | `composer-2.5` |
  | `cursor/composer-2.5:fast` | `composer-2.5-fast` |
  | `cursor/claude-opus-5@300k:high` | `claude-opus-5-thinking-high` |
  | `cursor/claude-sonnet-5@300k:high` | `claude-sonnet-5-thinking-high` |
  | `cursor/gpt-5.6-sol@272k:high` | `gpt-5.6-sol-high` |
  | `cursor/gpt-5.6-luna@272k:high` | `gpt-5.6-luna-high` |

  Empty slug -> empty. `cursor-spine:543`: if the result is empty, fall back to
  `auto` and emit a WARN naming the profile spec and the slug.

- **CORRECTED PRE-VERIFIED FACT — the `*)` fallback at `cursor-spine:539` is
  broken. Do not port it verbatim.** Your ORCH ran it:
  ```
  $ bash -c 's="grok-4.5:fast"; s="${s%@*}${s#*@}"; s="${s/@*:/:}"; echo "${s/:/-}"'
  grok-4.5-fastgrok-4.5:fast
  $ bash -c 't="claude-opus-5@300k:high"; t="${t%@*}${t#*@}"; t="${t/@*:/:}"; echo "${t/:/-}"'
  claude-opus-5300k-high
  ```
  With no `@` in the slug, `${s%@*}` and `${s#*@}` both return `s` unchanged, so
  the concatenation **doubles the string**. With an `@`, the context marker is
  glued on (`5300k`). It produces a valid id for no input.
  **Port the intent, correctly:** strip the leading `cursor/`, drop an
  `@<context>` segment entirely, replace `:` with `-`. So
  `cursor/grok-4.5:fast` -> `grok-4.5-fast` and
  `cursor/claude-opus-5@300k:high` -> `claude-opus-5-high`. It is a best-effort
  guess for a slug the explicit table does not know; it is not authoritative,
  and it must be commented as such.

**Passthrough (edits C and D):**

- `:603-624` `start_agent(pane_id, kind, name, timeout_ms=..., model=None, ...)`;
  `:615-618` is a `prime`/`prime-agent`-only `pane run prime-agent` branch that
  returns early; `:624` builds the `--` passthrough; `:628` makes the call.
- `:610-612` carries a comment ending "cursor is retired and never reaches here
  (hard error in main)." **That comment is now false and must be corrected as
  part of edit A/C** — leaving it is a lie in the file.
- `~/cursor-shim/cursor-spine:590` proves herdr forwards these correctly to an
  interactive cursor-agent when passed after `--`:
  `IA_ARGS=(--force --trust --model "$MODEL")`, and `:591` appends
  `--mode "$CA_MODE"` when set. `--mode` is a top-level cursor-agent flag, valid
  on the interactive TUI.
- `:1354` `def add_common(p, spawn=True)` is where `--kind`, `--profile`,
  `--cwd`, `--sparse`, `--thinking`, `--start-timeout-ms` are declared. `--thinking`
  uses `choices=[...]`; follow that idiom for `--mode`.

**`ctl-fleet` (T4):**

- `bin/ctl-fleet` is 676 lines of TypeScript, run by bun.
- `:12` `CLAUDE_PROJECTS` = `~/.claude/projects`; `:228` computes `claudeUuid`
  gated on `agent_session.source === "herdr:claude"`; `:229-237` globs the
  transcript for a session start; `:240` `durationOf` returns `""` for any
  other engine.
- A non-claude pane therefore renders a **blank** duration, indistinguishable
  from a very short session.
- **The ruling is already made** (`PLAN.md` §2.1, `HARNESS-PARITY.md:56` — "an
  unwired gate reports the unwired state, not a pass"): render an em dash `—`
  for any pane whose session source has no duration reader. **Do NOT add a
  `~/.cursor/` transcript reader.** `thesis.md:67` rules out truth derived from
  exhaust; a second exhaust reader doubles a violation the file already labels
  honestly as "the best proxy".

**What the worktree work does NOT need (verified, so you do not go looking):**

- `:505-523` `apply_coder_isolation` sets `args.cwd = ensure_git_worktree(...)`,
  and `create_tab:922-931` / `split_pane:934-943` both pass
  `--cwd os.path.abspath(cwd)`. The pane is created **inside** the worktree and
  the agent is seated there. `cursor-agent --worktree` is never needed.
  **Do not port `worktree_name_for`, `precreate_sparse_worktree`, or
  `sparse-apply` from cursor-spine.**

## The work

### Edit A — delete the refusal

Remove `:1470-1475` entirely. Afterwards
`grep -n 'cursor spawns do not go through' bin/spine-spawn` must return nothing.

### Edit B — `kind_model()` resolves a cursor model

When `kind == "cursor"`, translate the profile's gateway slug to a cursor-agent
model id using the explicit table above, with the corrected best-effort
de-slugging fallback, and `auto` + a WARN log when nothing resolves.

**Keep `profile-model` the single writer of model choice.** The slug map makes
`models.json` rows unnecessary, so **do not add `cursor` keys to
`models.json`** — you do not own that file. Say in your report which you chose
and why, in one sentence, for the ORCH's commit message.

### Edit C — `start_agent()` carries the cursor flags

For `kind == "cursor"`, the `--` passthrough must carry
`--force --trust --model <id>`, plus `--mode <plan|ask>` when given. Use the
existing `:624` mechanism; do not invent a second one. Correct the false
comment at `:610-612` in the same edit.

### Edit D — `add_common()` gains `--mode`

`--mode {plan,ask}`, validated with `choices`, matching the `--thinking` idiom
at `:1354+`. It must reach `start_agent`.

### Edit E — `ctl-fleet` renders `—`

Per the ruling above. The reason goes in a comment in the file, naming
`HARNESS-PARITY.md:56` as the governing law.

## Constraints

- Match surrounding style. `spine-spawn` is Python 3, stdlib only, no
  third-party imports. `ctl-fleet` is TypeScript run by bun.
- **Do not break cursor spawning at any point.** `cursor-fleet` and
  `cursor-spine` must keep working; you are not touching them, so the only way
  to break them is by breaking herdr or the board.
- **Do not bypass** the grounding hook, the write-gate, the spawn-door, or
  `credential-guard`. A refusal is information — post it, do not route around
  it. `VERIFY_GATE=off` and `SPAWN_DOOR=off` are audited; if you genuinely need
  one, post a finding saying why **before** using it.
- **One write per file per thought.** The grounding guard blocks a second
  consecutive write to a file with no evidence read between. Compose your edits
  to one file into a single call; if you need a second write, Read the file
  first, by contract — the read comes before the attempt, not after the refusal.
- **NO MOCKS.** No stubbed herdr, no faked `agent list` output.
- You do NOT commit and you do NOT push. Integration is the ORCH's. Leave your
  work in your worktree and report the branch.
- You do NOT spawn a cursor agent. Proving the live spawn is the ORCH's task,
  gated on your work landing.

## Tower

Tower is **MAILBOX ONLY** right now — the write gate is unproven and a peer
CORD is probing it. Do not describe Tower as operational.

- Board: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/harness-homogeneity "<body>" --from "<your agent name>"`
- Post a CLAIM first, findings during, and your report last.
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` and
  `~/herdr-spine/bin/spine-report verdict "<result>"`.
- Resource claim: your ORCH holds `spine-spawn`. You do **not** need to claim it
  again; you are the single sanctioned writer while you hold this brief.

**MANDATORY — the stigmergic field. You are rank 3/4.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Never send a message
to a named peer. Emit `work-available` with **mandatory evidence** (an emit
without evidence is not an emit); read the field before ever going idle; claim
with `work-claimed` `ref`-ing the exact pheromone id; `work-done` `ref`-ing what
you claimed; `need-help` rather than going quiet.

`bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` · `... field`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, **after** doing everything
that does not depend on it. "Reported and awaited instruction" is not a
stopping state.

## Report back with

- Every file you modified, with the line ranges you changed.
- Your branch name and worktree path.
- The output of each done-when command below, pasted.
- Which model-resolution approach you chose (slug map vs `models.json`) and the
  one-sentence why.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.

---

# IF YOU ARE THE IMPLEMENTER (`coder` profile)

You own `bin/spine-spawn` and `bin/ctl-fleet`. You write no tests — the
TEST-MAKER authors criteria independently and you must not see or shape them.

**Done when, each proven by the pasted output of its own command:**

1. `python3 -c "import ast; ast.parse(open('bin/spine-spawn').read())"` exits 0.
2. `python3 bin/spine-spawn --help` runs and exits 0.
3. `python3 bin/spine-spawn orch --help` runs, exits 0, and its output contains
   `--mode`.
4. `grep -n 'cursor spawns do not go through' bin/spine-spawn` returns nothing
   (exit 1).
5. `grep -n 'cursor is retired' bin/spine-spawn` returns nothing (exit 1).
6. A pure-function check of the model mapping, run as a real command, showing
   `cursor/composer-2.5:fast` -> `composer-2.5-fast`,
   `cursor/grok-4.6:high` -> `cursor-grok-4.6-high`,
   `cursor/claude-opus-5@300k:high` -> `claude-opus-5-thinking-high`, and an
   unknown slug producing the de-slugged best effort rather than a doubled
   string.
7. `bun bin/ctl-fleet --help` (or the file's own no-arg path) exits 0, and
   `bash test/ctl-fleet-tasks.sh` passes if it passed before your change — run
   it on the untouched file FIRST and record that baseline before you edit.
8. `git diff --stat` shows changes to `bin/spine-spawn` and `bin/ctl-fleet`
   only.

---

# IF YOU ARE THE TEST-MAKER (`test-maker` profile)

You author the acceptance criteria for this unit **before and independently of**
the implementation. You never read the implementer's worktree and you never
edit `bin/spine-spawn` or `bin/ctl-fleet`.

Your criteria must be executable and must cover, at minimum:

1. `spine-spawn` still parses and both `--help` surfaces still run.
2. The cursor refusal is gone.
3. `--mode` exists, is validated (a bad value is rejected), and reaches the
   spawn path.
4. Model mapping: each of the thirteen explicit slugs resolves to its listed
   cursor-agent id; an empty slug and an unknown slug behave as specified; the
   unknown-slug fallback does **not** produce a doubled string.
5. A cursor spawn's argv carries `--force --trust --model <id>` after `--`, and
   `--mode` when given. Assert on the constructed argv — a dry-run or a direct
   call to the arg-building function is legitimate; a stubbed herdr is not.
6. `ctl-fleet` renders `—` and not `""` for a pane whose session source is not
   `herdr:claude`, and still renders a real duration for one that is.
7. Nothing outside `bin/spine-spawn` and `bin/ctl-fleet` changed.

**Done when:** your criteria live in a file under `test/` in your worktree, each
is a real executable check, you have run the whole set against the **unmodified**
`main` and recorded which pass and which fail (the ones that must fail before
the change are your proof the criteria bite), and you have pasted that baseline
into your report. Report your branch and worktree path.
