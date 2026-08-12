- **pi:** `/reload` hot-reload · skills under `~/.pi/agent/skills/` ·
  gateway model IDs `cursor/<id>[@ctx][:thinking|:fast]` (inference-gateway
  provider config in `~/.pi/agent/auth.json`; thinking and `:fast` do NOT
  stack — pass `--thinking` separately, spine-spawn supports it) ·
  daily entry = `herdr` then `herdr pi [profile[:option]]` · fleet =
  `spine-spawn … --kind pi --profile <name>[:option]` (profiles:
  `~/agent-core/primitives/profiles/` + `profile-model`)
