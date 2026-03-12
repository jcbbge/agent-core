# Scratchpad

Persistent Python execution environment. Invoked via Bash — NOT an MCP tool.

## When to use (reach for this first)

- Multi-step computation where you need state across tool calls
- Load a file once, query or transform it many times
- HTTP fetch → parse → filter → write pipelines
- Any non-trivial shell output processing
- Arithmetic, date math, text manipulation with intermediate state

For single stateless operations (count braces in one file), Bash alone is fine.

## Invocation

```bash
# Single call
echo '{"args":{"code":"x = 42\nprint(x * 2)","sessionId":"task-name"}}' | python3 ~/bin/scratchpad.py

# Multi-line code
python3 -c "
import subprocess, json
payload = json.dumps({'args': {'code': '''
x = 42
y = x * 2
print(y)
''', 'sessionId': 'task-name'}})
r = subprocess.run(['python3', '/Users/jcbbge/bin/scratchpad.py'], input=payload, capture_output=True, text=True)
print(r.stdout)
"

# Reset a session
echo '{"args":{"code":"","sessionId":"task-name","resetSession":true}}' | python3 ~/bin/scratchpad.py

# List active sessions
echo '{"args":{"listSessions":true}}' | python3 ~/bin/scratchpad.py
```

## Session naming

Name by task, not conversation: `"csv-analysis"`, `"api-explore-github"`, `"debug-brace-depth"`.

## Available in session scope

`fs`, `path`, `http`, `sh(cmd)`, `data.csv`, `data.json`, `session`, `json`, `os`, `re`, `datetime`
