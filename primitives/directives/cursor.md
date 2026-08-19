- **cursor:** loads composed `~/AGENTS.md` (core+delta via `agent-core sync
  directive/core`) · hooks in `~/.cursor/hooks.json` (preToolUse
  `slim-guard-cursor.sh` rewrites the six slim verbs on Shell calls;
  `utensil-guard.mjs` matcher `Read\|Grep\|Shell` points huge-file Read /
  NL Grep / sleep-poll at bigfile / colgrep / latch) · MCP in
  `~/.cursor/mcp.json` (`bigfile`) · tool skills in
  `~/.cursor/skills-cursor/` (CLI-managed copies, not symlinks — `herdr`,
  `navigating-big-files`, `slim`, `latch`, `vein`, `assay`, `coraline`,
  `colgrep`, `pickbrain`, `composto`) ·
  fleet spawn = `muster-spawn --kind cursor --profile <role>` (forwarder
  `~/bin/spine-spawn` OK) · briefs name profiles only; models via
  `profile-model` at spawn — never provider/model/`--kind` in brief text ·
  fleet comms are the muster deposit door (`~/muster/bin/muster-deposit`);
  this harness invokes it via the shell; do not use a retired bus · daily
  entry = `herdr cursor`


- **muster (global package — WIP, stress-test mode):** Muster lives at
  /Users/jrg/muster and is invoked from anywhere; you NEVER cd into it — it
  is a global utility, not a project. It is a live-but-unfinished Common
  Lisp coordination runtime. Whenever you touch a muster door (the deposit
  door /Users/jrg/muster/bin/muster-deposit, the durable door
  durable/cli.lisp, or plan/coordination) or use it for fleet comms: (1)
  assume it is functional and drive it for real; (2) NEVER shortcut around a
  failure — do not stub, hard-code, weaken a test, or skip; STOP that thread,
  append a structured entry to the global bug ledger
  /Users/jrg/muster/docs/BUGREPORT.md, then continue your other work. The full
  driving manual — honest green-vs-WIP baseline, herdr integration, the door
  contract, the context-init-chain map, and the bug-report template — is
  /Users/jrg/muster/docs/DRIVING.md. Known blocker today: run-plan and
  run-test-a are declared but unimplemented. Isolation law: never write the
  live field or hash-chain by hand; point MUSTER_FIELD_DIR, MUSTER_STORE_DIR,
  MUSTER_EVENTS_PATH at scratch dirs (one-release compat fallback only:
  TUP_FIELD_DIR / TUP_STORE_DIR / TUP_EVENTS_PATH).
