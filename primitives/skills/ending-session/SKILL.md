---
name: ending-session
description: Close a session cleanly against the full infrastructure - strike the
  fleet (herdr/spine), commit with the standard handoff, land it, clear the Tower
  bus, deliver the retrospective, mirror the boot. Project-agnostic. Call at the
  end of every session.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "5.1"
  tags: session, handoff, git, fleet, workflow
  changelog: "5.1 — operator additions: full substrate teardown (every pane/tab/
    workspace you stood up) + push your own landed work (2026-08-12 late). 5.0 —
    infrastructure reshape + retrospective mandate. 4.1 — gerund rename. 4.0 —
    thin reconcile"
---

# Ending Session

**A session closes only when: work is committed with a complete handoff, landed
to this project's definition of done, the fleet is struck, the bus is clear,
and the retrospective is delivered.**

Repo is truth: open = `git diff`, done = `git log`. No side-ledgers. Commit
format: `~/agent-core/primitives/AGENTS.md` (Work tracking). Run applicable
steps in order; skip only steps that genuinely do not apply.

---

## Step 1 — Strike the fleet (herdr / herdr-spine)

Only if you spawned agents this session. Done = gone (control-flow.md §Reaping):

```bash
herdr pane list --workspace "$HERDR_WORKSPACE_ID"   # panes you spawned still alive?
git worktree list | grep -c spine/worktrees          # leftover spine worktrees?
```

- Collect stragglers via board + `.done` + status plane — never re-prompt idle panes.
- Reap verified-done panes; remove merged worktrees; delete merged `spine/*` branches.
- If the project carries `.madewell/`, confirm statem reflects reality (the unit's
  Land is recorded, no phantom in-flight cycles).

Then **tear the substrate down to zero**: every herdr pane, tab, and workspace
you created or were responsible for this session is closed before you are —
worker panes, worker tabs, and the observability panes you stood up for your
own oversight (your CTRL/TOWR splits included; their job ends with your
session). Survivors are exactly two kinds: the operator's focused pane, and
standing infrastructure owned by missions that are not yours (never close
what another live mission is using). The test is ownership, not tidiness:
if you made it, you unmake it.

An orphan pane, tab, workspace, worktree, or branch is unfinished work:
finish it now or hand it off explicitly in the `TODO:` line — never leave it
implicit.

---

## Step 2 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, ask once:

> "These files have uncommitted changes: [list]. Include them in the session commit?"

Do not silently skip uncommitted work. Surface it. One decision. Continue.

---

## Step 3 — Commit the handoff

Use the commit template in `~/agent-core/primitives/AGENTS.md`. Stage explicitly
(never `git add -A`):

```bash
git add <modified files>
git commit -m "<message>"
git log --oneline -1
```

The `TODO:` line is the handoff — specific enough to cold-start next session
(the Session Boundary adapters surface it at the next wake, every harness).

---

## Step 4 — Land it (per the project's flow)

- **No remote** → commit on branch is the close. Done.
- **Remote, no CI, trunk flow** → push; merge to main if that is the project's habit.
- **Remote + CI + merge-to-main** (`.github/workflows/` exists) → push, PR, wait
  for CI, merge, verify main is green.

**Push the work you are responsible for.** When a remote exists, your own
commits leave this machine before the session ends — work that lives on one
laptop is not landed, it is parked. Push only what you own: never force-push,
never push another mission's unreviewed branches. If the push is refused (a
protection rule, a required review, a secret in history), do not bypass it —
report **BLOCKED** with the refusal verbatim and the named unblock path.

If a gate requires human review you cannot satisfy, stop and report **BLOCKED**.

---

## Step 5 — Clear the bus (Tower)

- Relay any unrelayed operator mail; answer or explicitly hand off every open
  question (an open question dies silently in a closed session).
- If fleet work happened: post the closure finding to the mission topic —
  what landed, verdicts, commit shas — and release any standing CLAIMs.
- Deliverables the operator must keep: confirm they exist under
  `~/.tower/deliverables/` or on disk at a named path, not only in scrollback.

---

## Step 6 — Retrospective (operator mandate, 2026-08-12)

Answer these questions — honestly, specifically, from THIS session's actual
history, not generically:

> From this session chat history and log, what were 2-3 things that genuinely
> went well? What didn't go so well? Taking a step back and looking at the
> whole of all code changes and updates, what were you the most confident
> about? What were you least confident about? For any items that you were
> least confident in, what future steps or actions would alleviate your
> concerns?

Then make the answers durable — a concern without an action is a worry, not a
handoff:

- **Every least-confident item ends in a named action:** a follow-up brief in
  `briefs/`, a `VERIFY.toml` oracle (a concern is usually a missing oracle —
  component-verify is the alleviation machine), a rule edit, or an explicit
  `TODO:` line.
- Corrections and confirmed approaches → durable memory (the guest book), in
  this session, not the next one. For a full pass, run `/retro`.

---

## Step 7 — Mirror the boot

```bash
boot   # exit 0 = every Session Boundary leg wired for the next wake
```

The boot card opened this session; it closes it. A ✗ here is THIS session's
defect — fix it now, don't bequeath it. (Capture legs 5–6 fire at exit;
`boot` verifies the wiring they depend on. Circadian sleep/REM runs
machine-side — no action here.)

---

## Step 8 — Tear down ephemeral resources (if any)

If starting-session provisioned something ephemeral, run the project's
spin-down (e.g. `./scripts/<provision>.sh down`). Skip if nothing was
provisioned.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  <date>  ·  <repo>/<branch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDED      <committed @hash  |  pushed  |  PR #N merged → main>
CI          <success  |  n/a>
FLEET       <N panes reaped · worktrees clean · claims closed  |  n/a>
TOWER       <inbox clear · closure posted  |  n/a>
BOOT        <7/7 ✓  |  the ✗ and its fix>
BLOCKED     <anything blocked, or: none>

WENT WELL   <2–3 items, specific>
FELL SHORT  <what didn't go well>
CONFIDENT   <most-confident change and why>
UNSURE      <least-confident change → the named alleviating action>

NEXT        <single concrete sentence — the exact entry point = the TODO: line>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NEXT is the most important line.**

---

## Phases (for the PHASE: line)

| Phase | Meaning |
|-------|---------|
| **Ideate** | Figuring out what to build and why. No code yet. |
| **Plan** | Designing, decomposing tasks. |
| **Implement** | Building it. Writing code. |
| **Verify** | Testing, reviewing, validating. |

Use the phase you were in for most of the session, or the phase next session
will begin in.

---

## Dispatch (optional)

If this session had genuine creative or architectural insight, write
`journal/<date>-<slug>.md` — both voices if conversation, verbatim, hook line
at top, dated. The roughness is the fidelity.
