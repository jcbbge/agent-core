#BQ:---
#XX:name: scratchpad
#SK:description: Persistent Python execution environment shared across all harnesses with session persistence
#WY:disable-model-invocation: true
#HH:---

# Scratchpad Plugin

Persistent Python execution environment with session persistence across harness calls.

## Runtime

- **Binary:** `~/bin/scratchpad.py`
- **Sessions:** `~/.scratchpad/sessions/`
- **Timeout:** 30s per call
- **TTL:** 30min session expiry
- **Max concurrent:** 10 sessions

## Invocation

Called via Bash — NOT an MCP tool:

```bash
# Single call
echo '{"args":{"code":"x = 42\nx * 2","sessionId":"my-session"}}' | python3 ~/bin/scratchpad.py

# Multi-line code (use Python to build payload)
python3 -c "
import subprocess, json
payload = json.dumps({'args': {'code': '''
x = 42
y = x * 2
y
''', 'sessionId': 'my-session'}})
r = subprocess.run(['python3', '/Users/jcbbge/bin/scratchpad.py'], input=payload, capture_output=True, text=True)
print(r.stdout)
"

# Reset a session
echo '{"args":{"code":"","sessionId":"my-session","resetSession":true}}' | python3 ~/bin/scratchpad.py

# List active sessions
echo '{"args":{"listSessions":true}}' | python3 ~/bin/scratchpad.py
```

## API Surface

**`fs`** — readFile, writeFile, exists, mkdir, readdir, stat
**`path`** — join, dirname, basename, extname, resolve, relative, parse
**`http`** — get, post with .text() and .json()
**`sh(cmd)`** — shell execution with stdout/stderr/code
**`data.csv`** — parse, stringify
**`data.json`** — pretty, flatten, diff
**`session`** — id, get, set, save, load
**Standard modules:** json, os, re, datetime

## When to Use

- Multi-step computation (load data once, query many times)
- File operations needing parsing, transforming, filtering
- HTTP API calls with response processing
- Shell output needing non-trivial processing
- Arithmetic, date math, text manipulation
- Any pipeline: fetch → transform → write

## Session Naming

Name sessions by task, not by conversation:
- `"csv-analysis"` — processing a specific dataset
- `"api-explore-github"` — exploring a specific API
- `"build-report"` — multi-step report generation
