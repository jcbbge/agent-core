# BRIEF — live-verify follow-ups (from 2026-08-12 session retrospective)

Three changes landed today verified by synthetic/standalone evidence but not
yet observed on their real live path. Each is one observation, not a build.
(Source: ending-session Step 6 — every least-confident item ends in a named
action.)

1. **Circadian greeting via profile (masked by R7 kill switch).**
   Wake now emits `<mind:greeting>` as data (circadian a2a01a7); the concierge
   profile carries the speak-verbatim instruction. Untestable live until the
   human decommission decision clears R7.
   Done when: the first operator session after R7 clears opens with the
   greeting spoken from the data block, and the R7 fitness loop scores it
   (scoreboard verdict rows resume non-zero).

2. **Cursor end-of-session capture (legs 5-6) on a real session.**
   `session-capture-cursor.mjs` verified standalone with synthetic stdin for
   both events; never yet observed fired by a real cursor-agent session end.
   Done when: after ending one real cursor-agent session, a
   `*-cursor-sessionEnd-*.md` snapshot with that session's id appears in
   `~/.tower/flight/`. If it does, add the observation as a VERIFY.toml
   metric line on hook/session-boundary-cursor.

3. **kind_models opus tiers exercised.**
   `spine-spawn --kind claude --profile coder` proven live (model=sonnet);
   the opus rows (concierge/coordinator/orchestrator) resolve identically in
   code but no live spawn has shown `model=opus` yet.
   Done when: the next CORD or ORCH claude spawn's log line reads
   `model=opus`.
