# Retry loops

Exact ≥3-repeat loops: 3. Excess calls (beyond one per loop): 7.

| Kind | Harness | Session | Verb | Repeats | Errors | Total B | Sample |
|---|---|---|---|---:|---:|---:|---|
| near | cc | `9e16cb9c-2c76-4b5b-b590-27f4e91c3e2f` | `cd` | 18 | 2 | 12410 | `cd /private/tmp/claude-501/-Users-jrg-infinity-bento/9e16cb9c-2c76-4b5b-b590-27f4e91c3e2f/scratchpad && ./q.sh " WITH em AS (   SELECT ci.instance,          lower(trim(ci.object_da` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `python3` | 9 | 0 | 21998 | `python3 -c " import json, pathlib for l in pathlib.Path('/Users/jrg/.tower/board.jsonl').expanduser().read_text().splitlines():     l=l.strip()     if not l: continue     try: e=js` |
| near | cc | `9e16cb9c-2c76-4b5b-b590-27f4e91c3e2f` | `cd` | 6 | 0 | 10331 | `cd /Users/jrg/infinity/bento; sed -n '360,430p' _SRC/pagoda/_pgObjectsMT.php` |
| near | cc | `97502dbf-00c7-46e2-977a-2c0cf1955ca5` | `herdr pane` | 5 | 0 | 853 | `herdr pane list 2>/dev/null | python3 -c " import json,sys d=json.load(sys.stdin) for p in d.get('result',{}).get('panes',[]):     l=(p.get('label') or '').strip()     if 'CTRL' in` |
| near | cc | `9e16cb9c-2c76-4b5b-b590-27f4e91c3e2f` | `cd` | 5 | 0 | 2455 | `cd /Users/jrg/infinity/bento; grep -n "ILIKE\|ilike" _SRC/pagoda/_pgObjectsMT.php | head -20` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `while` | 5 | 0 | 1380 | `i=0; while [ $i -lt 360 ]; do for p in wJ:p3 wJ:p4; do s=$(herdr pane get $p | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['pane']['agent_status'])" 2>/dev/nu` |
| exact | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `while` | 4 | 0 | 1104 | `i=0; while [ $i -lt 360 ]; do for p in wJ:p3 wJ:p4; do s=$(herdr pane get $p | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['pane']['agent_status'])" 2>/dev/nu` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `herdr tab` | 4 | 0 | 20 | `herdr tab create --label popmem-workers --no-focus | python3 -c "import json,sys; p=json.load(sys.stdin)['result']['root_pane']; print(p['pane_id'])"` |
| near | cc | `0a34b40a-c79b-43f2-a247-264e4c00a2d9` | `herdr api` | 4 | 0 | 2289 | `herdr api snapshot 2>&1 | python3 -c " import json,sys d = json.load(sys.stdin) for w in d.get('workspaces', []):     print('WS', w.get('workspace_id'), w.get('label'), 'repo_name=` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `herdr pane` | 4 | 0 | 6472 | `herdr pane read wJ:p3 --source visible --lines 40` |
| near | pi | `019fd099-f2f7-7926-af32-55289c8c80ca` | `sed` | 4 | 0 | 8437 | `sed -n '756p' ~/.tower/board.jsonl | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['body'])"` |
| near | pi | `019fd099-f2f7-7926-af32-55289c8c80ca` | `sleep` | 4 | 0 | 2021 | `sleep 240; grep -E '"from":"(tr-claim|tr-supervisor|triage-spine|tr-escalate|td-dictionary)"' ~/.tower/board.jsonl | python3 -c "import json,sys for l in sys.stdin:   d=json.loads(` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `while` | 4 | 0 | 1104 | `i=0; while [ $i -lt 360 ]; do s=$(herdr pane get wJ:p3 | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['pane']['agent_status'])" 2>/dev/null); if [ "$s" != "wor` |
| near | cc | `198bba2b-d472-4b26-b754-4a7e8d90b83a` | `herdr pane` | 4 | 3 | 3635 | `herdr pane get w1A:p11 2>&1 | head -50; echo "---marker---"; ls -la ~/agent-core/briefs/.done-agnt-doc-auditor 2>&1` |
| near | cc | `e842b684-8e27-48ac-aaf2-eb5778c52265` | `export` | 4 | 2 | 1065 | `export PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH; grep -n "is_uncorrelated_transition_error\|uncorrelated_busy_streak" src/daemon/mod.rs` |
| exact | cc | `198bba2b-d472-4b26-b754-4a7e8d90b83a` | `wc` | 3 | 0 | 9 | `wc -l ~/.claude/skills/herdr/SKILL.md` |
| exact | pi | `019fe2c5-12ff-7d03-9f2b-aea6d7696416` | `cat` | 3 | 2 | 668 | `cat >> ~/.tower/board.jsonl <<'EOF' {"id":"ws4-done-1786216158","ts":"2026-08-08T19:09:18Z","cwd":"/Users/jrg/fut","type":"finding","from":"ws4","topic":"fut-rename","body":"DONE w` |
| near | cc | `62444b33-0b33-40c1-b75a-5b3c649ae201` | `bun run` | 3 | 0 | 2396 | `bun run src/cli/verbs/doctor.ts 2>&1 | tail -20` |
| near | cc | `d0ccaa44-040a-4a07-9b32-6d8a0f975a4c` | `herdr pane` | 3 | 0 | 10454 | `herdr pane read wJ:p4 --source recent-unwrapped --lines 60` |
| near | cc | `e842b684-8e27-48ac-aaf2-eb5778c52265` | `export` | 3 | 0 | 773 | `export PATH=~/.rustup/toolchains/1.95.0-aarch64-apple-darwin/bin:$PATH; grep -nF "SharedState {" src/daemon/mod.rs` |
| near | pi | `019fb690-ede2-7e57-ac07-f9686994f37f` | `cd` | 3 | 0 | 2020 | `cd /Users/jrg/auto-research/runs/pi-agents-md && python3 prepare.py --eval 2>&1 | tail -40` |
