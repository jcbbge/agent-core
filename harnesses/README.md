# Harnesses

Each harness directory contains:
- `profile.json` — machine-readable primitive support mapping (paths, formats, verify commands)
- `HARNESS.md` — human-readable documentation and update procedure

## How Primitive Updates Work

There are no sync scripts. Updates are manual, driven by the harness profile.

When you need to propagate a schema change to a harness:

1. Read the harness `HARNESS.md` — it describes exactly what lives where and how each primitive is configured
2. Give the profile and the change to an assistant
3. The assistant applies the specific edit to the specific config file for that harness

Each harness has a different config format and different file locations. A script that tries to cover all of them will always have gaps or make wrong assumptions. The profile + manual process is the only approach that stays accurate.

## Harnesses

| Harness | Config dir | Status |
|---------|------------|--------|
| claude-code | `~/.claude/` | active |
| opencode | `~/.config/opencode/` | active |
| omp | `~/.omp/agent/` | active |
| slate | `~/.config/slate/` | active |

## Adding a New Harness

See `_sop.md` for the research-first onboarding protocol.
