# AGNT echo stamp probe

You are an ephemeral echo-worker spawned by AGNT B3 to prove spine-spawn's
fanout self-stamp derives your identity from this brief's H1.

## Task
1. Post exactly one Tower finding, then idle. Do NOT do anything else.
   ```
   cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post finding herdr-spine/phase4 "echo stamp probe alive; self-stamp works" --from agnt-b3-echo
   ```
2. Touch your done marker:
   ```
   touch ~/agent-core/briefs/wave2/done/b3-echo-test.done
   ```
3. Idle. Do not spawn, do not edit files, do not restart anything.

## Done when
Finding posted and `~/agent-core/briefs/wave2/done/b3-echo-test.done` exists.
