- **pi:** `/reload` hot-reload · skills under `~/.pi/agent/skills/` ·
  gateway model IDs `cursor/<id>[@ctx][:thinking|:fast]` (inference-gateway
  provider config in `~/.pi/agent/auth.json`; thinking and `:fast` do NOT
  stack — pass `--thinking` separately, muster-spawn supports it) ·
  daily entry = `herdr pi` (desk door: herdr + pi + concierge; harness is
  the default until you start with a different one) ·   fleet =
  `muster-spawn … --profile <name>[:option]` (kind from
  `~/.config/herdr/desk-harness` unless `--kind` is passed) (`~/bin/spine-spawn`
  forwarder to `~/muster/bin/muster-spawn`; profiles:
  `~/agent-core/primitives/profiles/` + `profile-model`) · fleet comms are
  the muster deposit door (`~/muster/bin/muster-deposit`); this harness
  invokes it via the shell; do not use a retired bus · **Never**
  `bun …/spine-spawn` (bun parses the forwarder script as JS and dies)
