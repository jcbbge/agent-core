# SAGT — prove the spine verbs reach a live cursor agent

You are the first agent ever seated by `spine-spawn --kind cursor`. Your whole
job is to run four commands yourself and paste what they print. **You must run
them; nobody may run them on your behalf, or the proof is worthless.**

Your ORCH is `ORCH [spine-routes-cursor]` (pane `w3R:p1E`). Board topic:
`agent-core/harness-homogeneity`. **No emojis anywhere.**

## Pre-Verified Facts

Verified by your ORCH this session, 2026-08-16.

- You are running in a herdr pane. herdr injects `$HERDR_PANE_ID` into every
  pane it owns, whatever agent is seated in it. `spine-claim:157` and
  `spine-report:20,64` read exactly that variable — neither has any notion of
  which engine is running.
- `spine-claim:213` calls `herdr pane report-metadata "$pane_id" --source spine:claim`.
  That is an engine-blind herdr call.
- `spine-workspace:40,60` are pure `herdr workspace` calls with no pane or
  engine concept.
- `spine-watch` has **no source filter of any kind**, so it observes every pane
  regardless of what wrote its tokens.
- Full paths, because `~/bin` may not be on your PATH:
  `/Users/jrg/herdr-spine/bin/spine-claim`,
  `/Users/jrg/herdr-spine/bin/spine-workspace`,
  `/Users/jrg/herdr-spine/bin/spine-report`.
- The Tower CLI is `bun /Users/jrg/.tower/cli.mjs`.

**Nothing here is expected to fail.** But if something does, **that failure is
the deliverable** — capture the exact command, the exact output, and the exit
code, and post it as a finding. A corrected fact is a valuable result. Do not
retry-until-green, do not work around a refusal, and do not paper over an error.

## Tasks — run each command and keep its verbatim output

### 1. Identity

```
echo "HERDR_PANE_ID=$HERDR_PANE_ID"
```

### 2. Resource claim (`spine-claim`)

```
/Users/jrg/herdr-spine/bin/spine-claim claim "cursor-parity-probe" --ttl 30
```

Then, immediately after, so the claim is observable while it is still alive:

```
herdr pane list 2>&1 | grep -i "cursor-parity-probe"
```

Then release it:

```
/Users/jrg/herdr-spine/bin/spine-claim release "cursor-parity-probe"
```

- **Done when:** you have the output of all three, including the claim token
  string, and the exit code of each.

### 3. Workspace door (`spine-workspace`)

Read-only — **do not create or close a workspace**, and in particular never
close the one you are sitting in.

```
/Users/jrg/herdr-spine/bin/spine-workspace list
```

If `list` is not a verb it accepts, run it with no arguments to get its usage
and paste that instead — the point is to prove the door runs and answers from a
cursor pane, not to mutate anything.

- **Done when:** you have its output and exit code.

### 4. Self-report (`spine-report`)

```
/Users/jrg/herdr-spine/bin/spine-report task "cursor verb-parity probe"
/Users/jrg/herdr-spine/bin/spine-report verdict "cursor pane ran spine-claim, spine-workspace and spine-report itself"
```

- **Done when:** you have both outputs and exit codes.

### 5. Deposit the evidence

Post ONE board note with every command above, its verbatim output, and its exit
code:

```
cd /Users/jrg/agent-core && bun /Users/jrg/.tower/cli.mjs post note agent-core/harness-homogeneity "<your full transcript>" --from "SAGT cursor-verb-parity"
```

- **Done when:** the post returns a `posted <id>` line and you paste that line
  as your final output.

## Constraints

- Run the commands **yourself**, in your own shell. Do not describe what they
  would print.
- Do not edit any file anywhere. This is a read-and-run probe only.
- Do not spawn any agent.
- Do not close any workspace or kill any pane, including your own.
- Do not bypass any hook or guard. A refusal is information — capture it.
- **NO MOCKS.** No simulated output, no "expected" output. Only what your
  terminal actually printed.

## Tower

Tower is **MAILBOX ONLY** right now — the write gate is unproven. Do not
describe Tower as operational. Your board note in task 5 is your report.

**MANDATORY — the stigmergic field.** Coordinate through the environment, never
by messaging a named peer. If you get stuck, emit `need-help` rather than going
quiet:

`bun /Users/jrg/.tower/cli.mjs emit need-help agent-core/harness-homogeneity "<what you need and who owns it>"`

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state.

## Report back with

- Each of the commands above, its verbatim output, and its exit code.
- The `posted <id>` confirmation line from task 5.
- Anything that failed, refused, or surprised you, quoted exactly.
