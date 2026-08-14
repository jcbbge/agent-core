# Retry loops

Exact ≥3-repeat loops: 33. Excess calls (beyond one per loop): 162.

| Kind | Harness | Session | Verb | Repeats | Errors | Total B | Sample |
|---|---|---|---|---:|---:|---:|---|
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 41 | 0 | 11193 | `herdr agent wait w1A:p3 --until blocked --until done --timeout 3600000 2>&1 | tail -3` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 32 | 0 | 8736 | `herdr agent wait w1A:p3 --until working --until blocked --timeout 3600000 2>&1 | tail -1` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 30 | 0 | 8190 | `herdr agent wait w1A:p3 --until blocked --until done --timeout 3600000 2>&1 | tail -1` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 25 | 0 | 6825 | `herdr agent wait w1A:p3 --until working --until blocked --timeout 3600000 2>&1 | tail -1` |
| near | cc | `5177663a-c870-4862-80af-394e36462b01` | `grep` | 13 | 6 | 1999 | `grep -n "function renderReviewDoc" /Users/jrg/circadian-worktrees/wse/src/migrate.ts` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 12 | 0 | 3276 | `herdr agent wait w1A:pE --until working --until blocked --timeout 3600000 2>&1 | tail -1` |
| near | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `lsof` | 12 | 11 | 4081 | `lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep -E "6420|6421|6425"` |
| near | cc | `5177663a-c870-4862-80af-394e36462b01` | `cd` | 11 | 0 | 6573 | `cd /Users/jrg/circadian-worktrees/wse bun test src/migrate.test.ts 2>&1 | tail -60` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr api` | 11 | 0 | 2015 | `herdr api snapshot 2>/dev/null | python3 -c " import json,sys o=json.load(sys.stdin)['result']['snapshot'] for a in o.get('agents',[]):     print(a['pane_id'], a.get('tab_id'), '·` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 10 | 0 | 2730 | `herdr agent wait w1A:pE --until blocked --until done --timeout 3600000 2>&1 | tail -1` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `ls` | 10 | 10 | 3330 | `ls /Users/jrg/.orbstack/run/ 2>&1 | head` |
| near | cc | `cec7a4e9-f7f7-40f7-99a6-0b0b439b00b6` | `herdr agent` | 9 | 0 | 2448 | `herdr agent wait w11:p2 --until done --until blocked --until idle --timeout 1800000` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `lsof` | 8 | 7 | 2749 | `lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep -E "6420|6421|6425"` |
| near | cc | `cd7776b7-1a09-4757-b6ad-6a9fe17138d5` | `bun [script]` | 8 | 0 | 4836 | `bun -e ' import { significantTokens, jaccard } from "./src/ltp.ts"; const BASE_CLAIM = "The cliff is complexity accretion across the whole system."; const HIGH_OVERLAP_CLAIM = "The` |
| near | cc | `5177663a-c870-4862-80af-394e36462b01` | `cd` | 7 | 1 | 46 | `cd /Users/jrg/circadian-worktrees/wse bun -e "import('./src/migrate.ts').then(()=>console.log('ok')).catch(e=>{console.error(e);process.exit(1)})"` |
| exact | cc | `5177663a-c870-4862-80af-394e36462b01` | `cd` | 6 | 0 | 12 | `cd /Users/jrg/circadian-worktrees/wse bun -e "import('./src/migrate.ts').then(()=>console.log('ok')).catch(e=>{console.error(e);process.exit(1)})"` |
| exact | cc | `b443dcbc-c98e-4f4a-8ca5-b129e7b66e41` | `grep` | 6 | 0 | 12 | `grep -cF "gauntlet-batch" /private/tmp/claude-501/-Users-jrg-circadian-worktrees-wsg2/b443dcbc-c98e-4f4a-8ca5-b129e7b66e41/scratchpad/gauntlet-full-run.log` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `python3` | 6 | 0 | 5322 | `python3 - <<'EOF' import json lines=[json.loads(l) for l in open('/Users/jrg/.tower/board.jsonl') if 'c003' in l] for o in lines[-4:]:     print(f"--- {o.get('type')} · {o.get('fr` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr pane` | 6 | 0 | 11422 | `herdr pane read w1A:p3 --source recent-unwrapped --lines 40 2>&1 | sed -n '/Wave 3 dispatched/,$p' | head -25; herdr api snapshot 2>/dev/null | python3 -c " import json,sys o=json.` |
| near | cc | `c25606ea-f5ff-4b59-8ee4-ec9a69dc94f5` | `cd` | 6 | 0 | 2625 | `cd /private/tmp/claude-501/-Users-jrg-infinity-bento/c25606ea-f5ff-4b59-8ee4-ec9a69dc94f5/scratchpad/mpdftest && php t2.php 2>/dev/null` |
| exact | cc | `5177663a-c870-4862-80af-394e36462b01` | `cd` | 5 | 0 | 5800 | `cd /Users/jrg/circadian-worktrees/wse bun test 2>&1 | tail -8` |
| exact | cc | `46a3311d-2a6e-439d-9c65-69b486ba4d40` | `cd` | 5 | 0 | 15 | `cd ~/herdr-spine && wc -l bin/ctl-fleet` |
| near | cc | `cec7a4e9-f7f7-40f7-99a6-0b0b439b00b6` | `ls` | 5 | 0 | 756 | `ls -t ~/.tower/deliverables/ | head -3` |
| near | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `open` | 5 | 4 | 1340 | `open -a OrbStack; sleep 5; docker info >/dev/null 2>&1 && echo "docker up" || echo "docker not yet"` |
| near | cc | `d4a05a61-6085-4f63-84ec-ff5d8994bfc9` | `source` | 5 | 0 | 3964 | `source /private/tmp/claude-501/-Users-jrg-circadian-worktrees-wsf/d4a05a61-6085-4f63-84ec-ff5d8994bfc9/scratchpad/.rehearsal-env export SANDBOX cd /Users/jrg/circadian-worktrees/ws` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 5 | 0 | 584 | `herdr agent prompt w1A:p3 "Process note from coordinator: your turn ended with no wake signal armed on your workers — when they finish, nothing resumes you. Fix now and keep as d` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `python3` | 5 | 0 | 72 | `python3 - <<'EOF' import json, os, datetime with open('.madewell/DECISIONS.md','a') as f:     f.write("2026-08-09 | The fut resource model is the base | Per operator + https://fut.` |
| near | cc | `b443dcbc-c98e-4f4a-8ca5-b129e7b66e41` | `python3` | 5 | 0 | 3214 | `python3 -c " import json with open('/Users/jrg/circadian/logs/stacker-io.jsonl') as f:     lines = f.readlines() for l in lines:     d = json.loads(l)     if d.get('episode','').fi` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `python3` | 5 | 0 | 91 | `python3 - <<'EOF' p='/Users/jrg/agent-core/primitives/rules/control-flow.md' s=open(p).read() s += """ ## Observability spec (operator answers, 2026-08-10)  - **Live state in the c` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `cd` | 4 | 3 | 1551 | `cd /Users/jrg/cairn && nohup "$PWD/scripts/run-runner.sh" >/tmp/cairn-runner-cairn.log 2>&1 & disown; echo "supervisor pid $!"; sleep 6; echo "=== ps ==="; ps -ax -o pid,ppid,etime` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `pgrep` | 4 | 4 | 1332 | `pgrep -fl OrbStack | head; ls /Users/jrg/.orbstack/run/ 2>&1 | head` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `orb` | 4 | 4 | 1332 | `orb status 2>&1 | head -15` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 4 | 0 | 1092 | `herdr agent wait w1A:pZ --until working --until blocked --timeout 3600000 2>&1 | tail -1` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `lsof` | 4 | 4 | 1332 | `lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep -E '6420|6421|6425'` |
| exact | cc | `cd7776b7-1a09-4757-b6ad-6a9fe17138d5` | `true` | 4 | 0 | 124 | `true` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 4 | 0 | 1092 | `herdr agent wait w1A:pZ --until blocked --until done --timeout 3600000 2>&1 | tail -1` |
| exact | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `herdr agent` | 4 | 0 | 1092 | `herdr agent wait w1A:p5 --until blocked --until done --timeout 3600000 2>&1 | tail -1` |
| exact | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `cd` | 4 | 3 | 1066 | `cd /Users/jrg/cairn && docker compose up -d 2>&1 | tail -4` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `python3` | 4 | 0 | 3537 | `python3 - <<'EOF' import json out=[] for l in open('/Users/jrg/.tower/board.jsonl'):     if 'c003' not in l: continue     try: out.append(json.loads(l.strip()))     except Exceptio` |
| near | pi | `019fcdfc-52b7-7a9d-aa2c-420b77e3dae2` | `cd` | 4 | 3 | 2577 | `cd /Users/jrg/circadian-wave/worktrees/b07 && bun src/relindex.ts --reindex >/dev/null 2>&1 && echo "=== herdr k=6 (episodes should now rank top) ===" && bun src/relindex.ts --quer` |
| near | cc | `5177663a-c870-4862-80af-394e36462b01` | `sed` | 4 | 0 | 17918 | `sed -n '60,141p' /Users/jrg/circadian-worktrees/wse/docs/POPMEM-MIGRATION-REVIEW.md` |
| near | pi | `019fc9de-a59f-7f13-9557-2b0daeb66d63` | `printf` | 4 | 2 | 926 | `printf '%s\n' '{"id":"b04-phase1","ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","cwd":"/Users/jrg/circadian-wave/worktrees/b04","type":"finding","from":"orch-b04","topic":"wave-b04","b` |
| near | cc | `d4a05a61-6085-4f63-84ec-ff5d8994bfc9` | `grep` | 4 | 0 | 3602 | `grep -n "^export function\|^export const\|REM_SLOT_HOURS\|if-due\|computeFreezeDecision\|countBacklog\|enumerateInjectedItems\|freeze" src/rem.ts | head -80` |
| near | cc | `cec7a4e9-f7f7-40f7-99a6-0b0b439b00b6` | `herdr agent` | 4 | 0 | 1088 | `herdr agent wait w11:pB --until done --until blocked --until idle --timeout 3600000` |
| near | cc | `6a214495-e55e-4441-9e0e-634f410f7d96` | `python3` | 4 | 0 | 121 | `python3 - <<'EOF' import json, datetime, uuid body = """RULING — coordinator (w1A:p1) answers to orch-c003 question batch. All five resolved; no operator escalation needed.  FIND` |
| near | pi | `019fd909-c52d-76c5-9e1d-2363182226a3` | `open` | 4 | 4 | 1332 | `open -a OrbStack 2>&1; echo "waiting for orbstack..."; for i in $(seq 1 30); do docker info >/dev/null 2>&1 && { echo "docker ready at ${i}s"; break; }; sleep 1; done; echo "=== do` |
| near | cc | `576edaaf-39b9-4f59-b680-bebed4b92fff` | `bun [script]` | 4 | 0 | 2697 | `bun -e ' import { collectAllEpisodesAt } from "./src/replay.ts"; const eps = collectAllEpisodesAt("6271e090226a9970b158399d621d69eac15c5a80", "/Users/jrg/circadian/mind"); const fl` |
| near | pi | `019fcd9d-842c-7e96-9bc8-a57664651d2a` | `cd` | 4 | 1 | 507 | `cd /Users/jrg/circadian-wave/worktrees/b06 && bun test 2>&1 | grep -E "\(fail\)|[0-9]+ pass|[0-9]+ fail|Ran " | tail -15` |
| near | cc | `cec7a4e9-f7f7-40f7-99a6-0b0b439b00b6` | `bun run` | 4 | 0 | 2149 | `bun run test 2>&1 | tail -12` |
| near | cc | `c25606ea-f5ff-4b59-8ee4-ec9a69dc94f5` | `export` | 4 | 1 | 3939 | `export DB_URI="postgresql://doadmin:AVNS_<REDACTED>@db-bento-prod-postgresql-nyc1-40467-do-user-4130303-0.d.db.ondigitalocean.com:25060/bento?sslmode=require"; psql "$DB_U` |
