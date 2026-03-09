March 8, 2026

  ---
  What We Found

  Four projects. One pipeline. Never connected.

  Sigil → Roux → Agent Core → Harnesses
  capture  classify  deploy     execute

  Sigil captures content from the world. Roux classifies it — decides what mechanism type it should become (hook, rule, skill, command). Agent Core (_agents)
  deploys primitives to harnesses. The harnesses run them.

  These were always the same system built in three different sessions without realizing it.

  ---
  The Core Problem

  The Roux → Agent Core handoff doesn't exist.

  Roux classifies a pattern and says "this should be a SessionStart hook." Nothing carries that decision into _agents. The deployment never happens. The loop
  never closes. Content rots in /tmp or in a research doc somewhere.

  That's why you keep rebuilding the same things. Not because the ideas are wrong — because the pipeline leaks between every stage.

  Secondary: the same diagnostic concept (verify.sh, toolbox-check.sh, brain check) was built three times because there was no canonical "operate" layer. That's
   fixed — it's core chain now, wired to SessionStart.

  ---
  What Was Done Today

  - core CLI — replaces brain, nuclear vocabulary, core chain / core deploy / core status
  - SessionStart hook — silent if operational, surfaces problems with fix commands
  - OMP harness adapter — Agent Core now deploys to all three harnesses
  - /chain slash command — live in all harnesses via symlink
  - toolbox → chain — one diagnostic, three entry points
  - Registry updated — tool counts corrected, OMP added

  ---
  What Needs to Happen Next

  1. Define the Roux → Agent Core interface.
  This is the missing connection. When Roux classifies something as "should be a hook," what happens? Does it write to the registry? Does it generate a file?
  This one decision closes the loop on everything.

  2. Decide: does Roux live inside Agent Core or alongside it?
  Roux is the classification layer of Agent Core. They should probably be one repo. The manifest.json and registry.json are doing related work that could be
  unified.

  3. Build the Sigil → Roux path.
  Content captured in Sigil needs a clear pipeline into Roux classification. Right now it's manual. The /processing-sigils skill is a start — it's the
  distillation step. Wire it.

  4. Write the unified spec.
  One document. The full pipeline from capture to deployed primitive. That's the PRD. Now that the pieces are named and the gaps are identified, it's writable.
