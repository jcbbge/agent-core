# ask-bridge — status for W0 closeout (no re-exercise)

Per CORD scope correction (`orch-w0-closeout-SCOPE-CORRECTION.md`): ask-bridge
live exercise + negative control are ALREADY DONE at
`tower/w0-canonical-source` @ `1722f56`. This unit does not rewrite or
re-run that probe.

## Prior close (source: commit 1722f56 message + HANDOFF-orch-w0-canonical-source.md)

- Deployed `~/.tower/hooks/ask-bridge.mjs` swapped to symlink into canonical.
- Runtime homedir-anchored dynamic import at line 152 exercised through the
  symlink (not build-resolved).
- Negative control: `HOME` pointed at a nonexistent dir reproduced
  `lib.mjs import failed … from
  /Users/jrg/agent-core/primitives/mcps/tower/hooks/ask-bridge.mjs`
  — proves module load via canonical realpath while the homedir anchor still
  resolves `~/.tower/lib.mjs` (itself a symlink).

Pointers:
- `briefs/tower/w0-canonical-source-evidence/HANDOFF-orch-w0-canonical-source.md`
  §§ cutover / ask-bridge
- git: `1722f56525075fd40ada8a5912b17ee65235b467`

## This-session deploy state (verified, not re-exercised)

See `ask-bridge-deploy-state.txt` — symlink still points at canonical; bus
status exit 0 after the agent-core land.
