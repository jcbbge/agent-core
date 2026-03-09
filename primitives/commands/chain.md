---
name: chain
description: Verify Agent Core is operational. Checks MCP servers and primitive sync across all harnesses. Run at session start or when tools behave unexpectedly.
---

Run the Agent Core chain diagnostic:

```bash
core chain
```

Silent if fully operational. Surfaces only what's broken and how to fix it.

Reports:
- MCP server status (online/offline, tool count, latency)
- Primitive sync state per harness (symlinks valid, configs match registry)

To fix issues:
- MCP server down: `launchctl start [daemon]`
- Primitives out of sync: `core deploy`
- Full status: `core chain`
