# Harness: [NAME]

<!-- Copy this file to harnesses/[name]/HARNESS.md and fill it out -->

## Identity

| Field | Value |
|-------|-------|
| Name | [e.g. cursor, windsurf, aider, goose] |
| Config dir | [e.g. ~/.config/cursor/] |
| Rules file | [e.g. ~/.cursor/rules or .cursorrules] |
| Status | active / inactive / unknown |
| Tested | YYYY-MM-DD |

## Primitive Support

| Primitive | Supported | Format | Deploy target | Notes |
|-----------|-----------|--------|---------------|-------|
| Skills | yes/no | [format, e.g. .md with YAML frontmatter] | [path] | |
| Commands | yes/no | [format] | [path] | |
| Rules | yes/no | [format, e.g. always-loaded .md] | [path] | |
| Hooks | yes/no | [shell/TypeScript/other] | [config path] | |
| MCP (HTTP) | yes/no | [config format] | [config path] | |
| MCP (stdio) | yes/no | [config format] | [config path] | |
| Sub-agents | yes/no | [format] | [path] | |

## Config Files

```
[list every config file this harness reads]
~/.config/[harness]/config.json   — main config
~/.config/[harness]/mcp.json      — MCP registrations (if separate)
~/.config/[harness]/rules/        — rules directory (if applicable)
```

## How MCP Is Configured

```json
{
  "example": {
    "type": "http",
    "url": "http://localhost:PORT/"
  }
}
```

Or stdio:
```json
{
  "example": {
    "type": "local",
    "command": ["/path/to/runtime", "/path/to/server.js"]
  }
}
```

## How to Reload After Changes

```bash
# [command to reload this harness after config changes]
# e.g.: restart the process, or changes take effect on next session
```

## How Rules Are Loaded

[Describe: is there a single rules file? A directory? Always loaded or conditional?]

## Quirks and Gotchas

- [List anything non-obvious about this harness]
- [e.g. "Does not support HTTP MCP, stdio only"]
- [e.g. "Rules file must be at project root, not global"]
- [e.g. "Skill trigger phrases don't work, must invoke by exact name"]

## Adding This Harness to Deploy

1. Copy `harnesses/_template/adapter.sh` to `harnesses/[name]/adapter.sh`
2. Fill in each section following the inline comments
3. Run `deploy.sh [name]` to test
4. Add to `harnesses/_template/HARNESS.md` supported harness list
