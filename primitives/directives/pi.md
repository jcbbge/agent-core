- **pi:** `/reload` hot-reload · skills under `~/.pi/agent/skills/` ·
  gateway model IDs `cursor/<id>[@ctx][:thinking|:fast]` (inference-gateway
  provider config in `~/.pi/agent/auth.json`; thinking and `:fast` do NOT
  stack — pass `--thinking` separately, spine-spawn supports it) ·
  daily entry = `herdr pi` (desk door: herdr + pi + concierge; harness is
  the default until you start with a different one) ·   fleet =
  `spine-spawn … --profile <name>[:option]` (kind from `~/.config/herdr/desk-harness`
  unless `--kind` is passed) (`~/bin/spine-spawn` =
  `python3 ~/herdr-spine/bin/spine-spawn`; profiles:
  `~/agent-core/primitives/profiles/` + `profile-model`) · **Never**
  `bun …/spine-spawn` (bun parses the Python file as JS and dies)
