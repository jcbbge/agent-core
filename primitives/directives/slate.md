- **slate:** orchestrator harness — an LLM piloting via the orchestrate REPL
  (`run` / `spawn` / `getHandle`) plus trace, skills, and programs tools. Slate
  delegates every file / terminal / edit / search action to worker agents
  (`read` / `general` / `self`) and never touches the environment directly.
  Config dir `~/.config/slate/`; composed entry `~/.config/slate/AGENTS.md`
  (directive/core + this delta via `agent-core sync directive/core`). Stack =
  herdr (panes) + muster (durable Lisp runtime) + madewell (Imagine-Plan-Make-
  Verify). Fleet spawn through muster's spawn door; fleet comms through the
  muster deposit door `~/muster/bin/muster-deposit`. Workers run as herdr panes;
  slate owns slicing, sequencing, verification, and reaping.
