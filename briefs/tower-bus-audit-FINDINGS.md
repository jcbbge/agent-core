# Tower Bus Audit — Findings

Audited 2026-08-13, by AGNT bus-audit (read-only, one-off). Corpus: `~/.tower/`
(deployed/executing), `~/agent-core/primitives/mcps/tower/` (canonical, git
HEAD `8e54604` at time of writing — two orchestrators were actively committing
to it during this audit; see Finding 3), `~/agent-core/primitives/hooks/`,
`~/agent-core/primitives/rules/`, `~/agent-core/primitives/profiles/`,
`~/agent-core/primitives/skills/{herdr,brief}/`, `~/herdr-spine/bin/handlers/`,
`~/agent-core/primitives/tools/{statem,fleet-task}/`, `~/Infinity/arc/.madewell/`.
Live data: `~/.tower/board.jsonl` (5,976–6,098 lines / 3.8–3.9MB depending on
read time), `~/.tower/ledger.jsonl` (2,654 lines / 1.1MB), plus cursors/
odometer/pheromones/deliverables/flight.

No writes were made to any store, file, or MCP tool during this audit except
the single closing board post this report describes at the end. Two live
fixes (commits `b584ef2`, `8e54604`) landed in the canonical repo *during*
this audit and are cited with their timestamps so this report stays checkable
after the repo moves further.

---

## Verdict

**The bus is not trustworthy for agent-to-agent communication today, in one
specific, common, and already-realized way: the tool an agent is told
guarantees delivery does not enforce that guarantee, and the live production
ledger proves it — 458 of 467 real `deliverable`/`alert` rows in the current
ledger are exempt from the relay guard that `send_to_user`'s own return text
promises the caller.** Everything else about Tower — the append primitive,
the MCP transport, cwd/project scoping, the Made Well integration, the
bridge-race guard — works as designed and was verified working. But the one
thing a fleet of unattended agents needs most from a message bus — "if I hand
you this, either it reaches its audience or I find out it didn't" — fails
silently on the single most-used delivery-guarantee path, fails silently on
malformed data (26 known-corrupt lines right now, invisibly dropped by every
reader), and has a live, currently-latent regression (Finding 3) that will
reproduce a real data-loss incident that already happened once this week the
next time a routine symlink operation runs. Call it: trustworthy for status
and progress chatter, not yet trustworthy for "the human/orchestrator must
see this," which is precisely the case it was built to guarantee.

---

## Findings, worst-first by agentic impact

### 1 — CRITICAL: `send_to_user`'s delivery guarantee is false as implemented — proven on 458/467 live rows

**Claim:** An agent calling `send_to_user(kind:"deliverable")` is told its
turn cannot end until the message is relayed verbatim, but the code makes
that true almost never.

**Evidence:**
- `server.mjs:189`: `const entry = { id: id(), ts: now, cwd: CWD, kind, title: args.title, from: args.from, message: args.message }` — no `to` field; `inputSchema` for `send_to_user` (`server.mjs:40-49`) has no `to` property to set one.
- `server.mjs:198-201`: `kind === 'progress' ? 'Ambient...' : 'The orchestrator cannot end its turn until this is relayed to the user verbatim.'` — this text is returned to the calling agent for `deliverable` and `alert` alike.
- `~/agent-core/primitives/hooks/tower-ledger.mjs:341,358`: `((r.kind==='alert' && (r.to===undefined||r.to==='operator')) || (r.kind==='deliverable' && r.to==='operator'))` — `alert` defaults operator-visible when `to` is absent; `deliverable` requires exact `to==='operator'`, no fallback. Since `send_to_user` never sets `to`, every deliverable it ever mints has `to===undefined` and can never enter `unrelayed`.
- Design doc `~/agent-core/primitives/mcps/tower/COMMS-ARCH.md:105-117` self-documents this exact gap as an **open, unfixed migration item** as of 2026-08-10.
- Live count, run against the real ledger: `~/.tower/ledger.jsonl` has 467 `deliverable`+`alert` rows; **458 have `to:null`, 9 have `to:"operator"`.**

**Failure scenario:** Any agent — worker, orchestrator, this very audit's peers — calls `send_to_user(kind:"deliverable", message:"...")` believing it just guaranteed the human sees it before the run ends. In reality, unless the caller separately, manually sets `to` (which the tool's schema doesn't even expose), the row is functionally a status line. The Stop-hook guard never blocks on it. The only reason anything gets seen today is that 9 of 467 rows happened to carry `to:"operator"` some other way, and that agents additionally, separately call the herdr doorbell (a convention, not enforced — see Finding 13's neighbor, the AGENTS.md "Doorbell hard rule").

**Rubric:** Craft/care — a tool whose own return string lies to its caller is the opposite of care; the agent did its job (called the documented API) and was told something false about the result. World-class DX — a delivery-guarantee tool should either deliver or say it didn't; this does neither. Lovable UX — nothing about silently-dropped operator deliverables is lovable; it is the single scariest thing a fleet of unattended agents can experience without knowing it. Agentic experience — this is the textbook silent failure the rubric calls the cardinal sin: the agent believes it communicated, 98% of the time it structurally could not have.

**10X move:** `send_to_user` should default `to:"operator"` for `deliverable`/`alert` (matching `alert`'s own `undefined`-defaults-visible rule), or explicitly require the caller to state an audience with no silent default at all. Either way, the fix is one line, already spelled out in COMMS-ARCH.md's own migration item 4 — it has been diagnosed and not applied.

---

### 2 — CRITICAL: the exact bug that caused a prior production outage is unfixed for Claude Code sessions

**Claim:** `RESPONSIBLE-PARTY-AND-NQ.md` §4 documents a real prior outage — a
human's typed reply didn't close its question, so the question re-injected
forever and stormed the operator — and states it's fixed. The fix is pi-only;
no equivalent exists for Claude Code, the harness this very session runs on.

**Evidence:**
- `RESPONSIBLE-PARTY-AND-NQ.md:90-97` (§4): "Before this fix, a reply was inert... so the question never closed and re-injected forever." Implementation line (114-118): "`~/.pi/agent/extensions/tower-auto.ts` (tower_ask routing, tower_escalate, injection scoping + nQ, human-answer path)".
- Exhaustive search across `~/.tower/hooks/`, `~/agent-core/primitives/hooks/`, `~/agent-core/primitives/mcps/tower/hooks/`, and the full CC hook wiring in `~/.claude/settings.json` for the §4 guard language (leading-slash / empty-text / closes-the-open-question) — zero matches. The only CC `UserPromptSubmit` hook touching Tower, `prompt-inject.mjs`, is read-only (renders `inboxState`, never writes a ledger row).
- Corroborating: `grep -c '"kind":"escalation"' ~/.tower/ledger.jsonl` → 0. `grep -c '"nq"' ~/.tower/ledger.jsonl` → 0. The entire nQ rank-based escalation protocol this design doc describes has never produced a single row in this ledger — CC's `ask_user`/`reply` bypass it completely; every open question surfaces immediately and unconditionally, with no rank throttling, to whatever cwd asks.
- In CC, closing a question requires the orchestrator LLM to remember to call `mcp__tower__reply`/`relay_inbox({answers})` after telling the human's answer to the asker — a prompt-adherence step, not a mechanical guarantee.

**Failure scenario:** A CC-based orchestrator asks the human a blocking question. The human answers in the chat. If the orchestrator's own turn doesn't explicitly call `reply`/`relay_inbox`, the question stays open in the ledger forever, re-injecting on every subsequent prompt and blocking every Stop — the identical mechanism §4 describes as having already caused a "production-down of the coordination plane" that "storm[ed] the operator." Nothing in the code prevents this from recurring today, in this harness, right now.

**Rubric:** This is the harness this session — and every Tower-using Claude Code session on this machine — actually runs. A fix that exists for one harness and is documented as *the* fix is worse than no fix, because it reads as closed. Efficient/optimized agentic experience: an agent cannot know it needs to manually replicate a mechanism it's never told exists.

**10X move:** Port the human-answer-path guard to a CC hook (likely alongside `prompt-inject.mjs` or as a new `UserPromptSubmit` handler) so the mechanical guarantee — not a hoped-for LLM habit — closes the loop, exactly as pi already has it.

---

### 3 — CRITICAL, time-sensitive: canonical/deployed drift on `cli.mjs` — a fixed bug is running unfixed in production right now

**Claim:** The exact bug that already caused a real 5-message loss (documented
in commit `b584ef2`) was code-fixed in the canonical repo minutes before this
audit (commit `8e54604`) — but the deployed file every live `post` actually
executes was never updated, and is safe only by coincidence.

**Evidence:**
- `~/agent-core/primitives/mcps/tower/cli.mjs:159-163` (canonical, post-`8e54604`): `// Never resolve state relative to import.meta.url: this file is symlinked from ~/.tower/ into the canonical repo, so a file-relative path writes posts into the git working tree instead of the live bus — silently, with no error. ... appendFileSync(BOARD, JSON.stringify(row) + '\n')`.
- Direct `diff` run at the time of this audit: `~/.tower/cli.mjs` (deployed) still reads `appendFileSync(new URL('./board.jsonl', import.meta.url).pathname, ...)` at its line 159 — the pre-fix code — while the canonical file at the same path uses the fixed `BOARD` import.
- Deployed file mtime: `Aug 12 13:54:05` — predates both the incident-response commit `b584ef2` (`00:16:18` local) and the code fix `8e54604` (`00:23:29` local).
- `b584ef2`'s own commit message: "Not silently fixed in code: the correct repair is to use the homedir-anchored BOARD constant... deliberately left as REAL FILES [for two other hooks]... the CORD's call, not made [for cli.mjs's re-symlinking]."
- It is safe *right now* purely because the deployed file physically resides at `/Users/jrg/.tower/cli.mjs`, so `import.meta.url` happens to resolve to the same place `BOARD` would.

**Failure scenario:** Live board data from this very session shows the swap already landed once and is being re-litigated (`orch-w0-canonical-source`'s 05:14Z status post: "cutover has LANDED... the E1 exposure is now LIVE rather than prospective... Not an emergency — all three files are byte-identical right now"). The moment anyone re-symlinks `~/.tower/cli.mjs` into the canonical repo (the very swap two orchestrators are actively working toward on this machine as of this audit), every `cli.mjs post` from that point on silently writes into the git working tree instead of the bus — the identical incident, verbatim, a second time — because the code fix was applied to one twin and never propagated to the one that runs.

**Rubric:** No deploy/sync mechanism exists between canonical and deployed (pre-verified fact, still true). A world-class DX does not require a human/agent to remember which of two identical-looking files is the one that's real. This is the single highest-blast-radius latent bug found in this audit precisely because it is *not* hypothetical — it already fired once this week, evidence of it is sitting in a gitignored stray file right now, and the same class of agents who caused it are still actively working in the exact area that would trigger it again.

**10X move:** There should be exactly one file. If canonical/deployed duality must exist during a migration, a pre-commit or pre-symlink check that diffs deployed-vs-canonical and refuses the swap on mismatch is a two-line guard that would have caught this before it ever became "safe by coincidence."

---

### 4 — HIGH: `mark_relayed` clears the delivery guard on say-so alone

**Claim:** The MCP tool that's supposed to mean "I relayed this to the human"
accepts any id list from any caller and clears the guard unconditionally,
with no proof the content was ever shown.

**Evidence:** `server.mjs:236-239`:
```js
case 'mark_relayed': {
  append(LEDGER, { id: id(), ts: now, cwd: CWD, kind: 'ack', ids: args.ids })
  return `Acknowledged ${args.ids.length} message(s). Guard cleared for: ${args.ids.join(', ')}.`
}
```
No check that `args.ids` were ever returned by `check_inbox`, that they exist,
or that they belong to the calling cwd. Compare `relay_inbox` (`server.mjs:254-277`),
which renders then acks atomically in one call — safe by construction, and the
one path an agent should actually use. `mark_relayed` is a second, unguarded
door to the same lock.

Compounding: the acked-id `Set` is built over the **entire ledger, all cwds**
(`tower-ledger.mjs:335`, `const acked = new Set(all.filter(r=>r.kind==='ack').flatMap(r=>r.ids??[]))`)
— nothing scopes an ack to the cwd that issued it.

**Failure scenario:** Any agent that calls `mark_relayed` with a guessed,
stale, or copy-pasted id list clears the Stop-guard for messages it never
displayed. Because ids are random tokens, accidental cross-cwd collision is
unlikely, but nothing in the code rules it out, and nothing rules out an
agent calling `mark_relayed` prematurely (before it actually finishes
rendering) to unblock its own turn faster.

**Rubric:** Ceremony the tool should enforce, not the agent remember —
exactly the rubric's "ceremony" complaint. The fix (make `mark_relayed`
require the exact set `relay_inbox` would have returned, or remove it in
favor of `relay_inbox` alone) is small.

**10X move:** Delete `mark_relayed` as a free-standing tool, or have it derive
its own id list from the caller's last `check_inbox`/`relay_inbox` response
rather than trusting caller-supplied ids.

---

### 5 — HIGH: no request validation anywhere in `server.mjs` — a "success" can hide permanently lost data

**Claim:** None of the MCP tools' declared `inputSchema.required` fields are
enforced; a missing field silently vanishes (JS drops `undefined` keys on
`JSON.stringify`) while the tool still reports success.

**Evidence:**
- `server.mjs:339-341`, `handle()`: calls `callTool(params.name, params.arguments ?? {})` directly — no ajv/schema layer. The only enforcement anywhere is ad hoc: `pheromone_emit`'s `if (!args.from) throw new Error('from is required')` (`server.mjs:282`) and validation inside `emitPheromone` itself. `send_to_user`, `ask_user`, `reply`, `board_post` have zero required-field checks.
- Worst case, `reply` (`server.mjs:209-212`): `append(LEDGER, { id: id(), ts: now, cwd: CWD, kind: 'answer', ref: args.question_id, message: args.answer })`. If `args.question_id` is omitted, `ref` is `undefined` → dropped by `JSON.stringify` → the row has no `ref` key at all. `check_inbox`'s matching logic (`server.mjs:220`, `answers.filter((a) => a.ref === args.question_id)`) can never match a row with no `ref` — **the answer is recorded, "success" is returned, and it is permanently unmatchable, forever.** The only visible tell is the return string literally saying `"Answer recorded for undefined."` — visible to a careful reader, invisible to anything that just checks for a non-throwing return.

**Failure scenario:** An orchestrator LLM calls `reply` with a slightly
malformed argument (e.g. forgets `question_id` because it's answering from
memory of a prior turn) — gets back a plausible-looking success string,
moves on, and the asking agent waits forever for an answer that was written
and immediately orphaned.

**Rubric:** World-class DX means a schema you declare is a schema you
enforce — right now `inputSchema.required` is decoration. Efficient agentic
experience: round-trip dead ends like this are exactly what the rubric calls
out ("Questions that can never be answered").

**10X move:** Enforce `inputSchema.required` centrally in `handle()` before
dispatch, once, for every tool — not per-case ad hoc checks that three of
five tools skip entirely.

---

### 6 — HIGH: the documented hand-append fallback has no escaping/newline/verification guidance, and is the proven root cause of live corruption

**Claim:** Two differently-worded copies of a "hand-append raw JSON when no
MCP is available" instruction exist, neither warns about escaping or
verification, and the live board's real corruption is diagnostically
consistent with exactly this failure mode.

**Evidence:**
- `~/agent-core/primitives/skills/herdr/SKILL.md:306-311`: "File-append fallback when no MCP is present: `{"id","ts","cwd","type":"finding","from":"<you>","topic":"<t>","body":"..."}` into `~/.tower/board.jsonl`."
- `~/.claude/skills/brief/SKILL.md:54-58`: "Harnesses without the tower MCP (e.g. pi): append one JSON line to ~/.tower/board.jsonl — {"id","ts","cwd","type":"finding|alert","from","topic","body"}... File append works everywhere; no MCP required. (Verified in pi 2026-07-23.)"
- Neither mentions JSON-escaping the body, newline termination, or verifying the write landed. `~/agent-core/primitives/AGENTS.md` — where the audit brief expected this instruction to live — does **not** contain it (confirmed by direct read and grep); the brief's own citation was imprecise, itself worth noting as a small finding-about-the-audit-process.
- Tower's own design doc says the same thing independently: `COMMS-ARCH.md:177-182` — "Known hole: the documented pi fallback... bypasses the MCP server, and with it [the scratch-cwd] guard, entirely. There is no code chokepoint for that path... This is written down, not closed."
- `cli.mjs:8-9`'s own comment on the sanctioned `post` verb: "the ONLY sanctioned non-MCP write... Added 2026-08-11 after workers hand-rolled broken JSONL." — i.e. the tool exists specifically because this fallback already broke things once.
- Diagnosed root cause of the real corrupt lines, read directly (`sed -n '553p;2113p;2502p' ~/.tower/board.jsonl`, parsed with `python3 json.loads`): line 553 (2026-07-28) fails on an unescaped literal `"` inside the body around the phrase `"tower ask"` — a hand-typed quote never escaped; line 2113 (2026-08-08) fails on invalid `\-`, `\,`, `\)` escapes inside a body quoting code like `NAME.replace(-,_)` — a hand-transcription of source text, not `JSON.stringify` output. **Both predate 2026-08-11**, when the sanctioned `cli.mjs post` path was added specifically to stop this. Every code-generated writer found in this audit (`server.mjs`'s `append()`, `tower-ledger.mjs`'s `append()`, `_spine_common.py`'s `board_append()`, `cli.mjs post`, `statem.ts`'s `appendBoard`) routes through a real serializer and cannot produce these two failure signatures.

**Failure scenario:** An agent on a harness without MCP (or one that believes
it doesn't have MCP) free-hands a JSON line containing a quote, backslash, or
embedded newline in the body without escaping it — the line lands, is
unreadable forever after, and (per Finding 7) every reader silently drops it
with no signal to anyone.

**Rubric:** This is written-down, known, and still open per Tower's own
design doc — an unusually honest self-report that hasn't yet turned into a
fix. Context cost and discoverability: an agent following this instruction
literally has no way to know it's producing a landmine.

**10X move:** Either close the hole (require the fallback to shell out to a
one-liner `JSON.stringify`-equivalent, e.g. `node -e` / `bun -e`, instead of
literal hand-typed JSON), or delete the fallback now that `cli.mjs post`
exists "everywhere" per its own comment and is strictly safer.

---

### 7 — HIGH: no lock on the actual store appends; a full-file truncation data-loss incident already happened

**Claim:** Locking exists only for derived cursor-cache files, never for the
raw JSONL stores themselves, and a real incident already destroyed board
history this way.

**Evidence:**
- `tower-ledger.mjs:203-223`, `withCursorLock()`: the only lock primitive found anywhere in the codebase (`writeFileSync(lockPath, pid, {flag:'wx'})` + spin-retry). It wraps only `cursors/ledger.inbox.cursor.json` / `cursors/board.scope.cursor.json`.
- `tower-ledger.mjs:76`, `export const append = (file, obj) => appendFileSync(file, JSON.stringify(obj)+'\n')` — the actual write path for board/ledger/pheromones/odometer. No lock, no retry, no shape validation (`append()` accepts any JSON-serializable object).
- A real prior incident, preserved live in `~/.tower/board.jsonl` itself (a "coordinator" alert, 2026-07-24): "board file was TRUNCATED at ~09:18:30Z (127 bytes remained, full w2 history lost; last surviving fragment was a spine post cut mid-line)... this is a real data-loss bug in something that ran today... audit every spine-owned writer of ~/.tower/board.jsonl... for anything that could open the board non-append (mode w, copy-truncate, seek-rewrite)."

**Failure scenario:** Any future writer — hand-rolled or otherwise — that
opens the board in a non-append mode (a naive "read, modify, rewrite" script,
a broken migration, a test harness pointed at the wrong path) can destroy the
entire fleet's shared history in one call, with no lock to prevent it and no
backup/rotation to recover from it (pre-verified: no rotation anywhere on any
store).

**Rubric:** This already happened once. "Craft, beauty, and care" for a
shared, unrotated, unlocked append-only log used by every agent on the
machine means the log should be structurally hard to destroy, not merely
policy-forbidden ("the board is append-only, always... never prune it
mid-program" is discipline, not a guard).

**10X move:** Wrap real store appends in the same `withCursorLock` primitive
already built and proven for the cursor files (cheap — writes are small and
infrequent relative to reads), and/or open every store handle `O_APPEND`-only
at the OS level so an accidental `mode:'w'` open simply cannot truncate it.

---

### 8 — MEDIUM-HIGH: at least five independent hand-rolled write implementations, with proven schema drift

**Claim:** Nobody imports a single canonical writer; JS, Python, and
TypeScript each reinvent "build a dict, serialize, append a newline," and the
live data already shows the resulting drift.

**Evidence — five separate implementations found:**
1. `tower-ledger.mjs`'s `append()` (JS/Bun, canonical).
2. `~/herdr-spine/bin/handlers/_spine_common.py:326-341`, `board_append()` (Python) — used by `10-notify`, `16-parent-wake`, `50-scent-digest`.
3. `~/herdr-spine/bin/handlers/40-tower-bridge` itself defines its **own** `ledger_append()` (134-149) and `new_id()`/`b36()` (107-118), separate from #2.
4. `~/herdr-spine/bin/spine-inbox` carries its **own copy** of `ledger_append`/`new_id`/`scan_ledger_tail` (169-328), explicitly commented "copied not imported" (line 171).
5. `~/agent-core/primitives/tools/statem/statem.ts:87-98`, `appendBoard()` (TypeScript/Bun) — a fifth.
(`~/herdr-spine/bin/spine-claim` embeds a sixth, a Python heredoc reproducing #2's shape, lines 86-100.)

**Drift already visible in live data:**
- **ID schemes**, three independent: `t-<base36 ts>-<rand>` (`tower-ledger.mjs:74`), `cli-<uuid>` (`cli.mjs:151`), `spine-<uuid4>` (`_spine_common.py:330`, `spine-claim:88`). No collision check anywhere in any of the three — a caller-supplied `id` that collides is never detected or rejected.
- **Timestamp formats**, at least seven distinct shapes counted live (`grep -o '"ts":[ ]*"[^"]*"' ~/.tower/board.jsonl | sed -E 's/[0-9]+/N/g' | sort | uniq -c`): millis-no-space (JS `toISOString()`+`JSON.stringify`, 3,539 rows), no-millis-with-space (Python `strftime`+`json.dumps`, 1,763 rows), microseconds+explicit-offset-with-space (a *fourth*, unidentified Python writer using `datetime.now(timezone.utc).isoformat()`, e.g. `from:"cord-lever-6-statem-reap"` — not located in the searched trees), and two rows carrying a literal, never-expanded `"$(date -u +%Y-%m-%dT%H:%M:%SZ)"` string — a shell command-substitution snippet pasted as data instead of executed.
- **An undocumented sixth ledger `kind`**: `verify-gate-bypass` (28 rows, written by `~/herdr-spine/bin/spine-spawn:244` as a break-glass audit trail) is invisible to `inboxState`/`deriveInboxState` (which only recognize `{ack, answer, alert, deliverable, question, progress}`) — its only reader is a standalone grep-based QA script, `~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh`.

**Failure scenario:** Any future change to the row schema (a new required
field, a rename, a validation rule) must be replicated across at least five
independent implementations in three languages to actually take effect
everywhere; it will not, by construction, since none of them import a shared
library. The `verify-gate-bypass` kind already demonstrates this: a real,
already-shipped ledger row shape that every canonical Tower reader is blind
to.

**Rubric:** Discoverability and craft — an agent (or a future maintainer)
grepping for "how does Tower write a row" will find the canonical answer and
still be wrong about what actually writes half the rows in the live file.

**10X move:** One writer, one language-boundary shim if cross-language is
unavoidable (a single `tower-append` CLI, called by every non-JS writer,
that itself imports the canonical schema/id/timestamp logic) — not five
copies drifting independently.

---

### 9 — MEDIUM: `cli.mjs board <topic>` silently ignores its topic argument

**Claim:** Passing a topic to the `board` CLI verb produces no error and
silently returns the wrong (cwd-scoped, not topic-scoped) rows.

**Evidence:** `cli.mjs:128`, the `board` branch: `const rows = boardFor(cwd)`
— no topic argument is ever read from `argv`, unlike `field`/`scan` which do
support `--topic`. Live-verified:
```
$ bun ~/.tower/cli.mjs board tower/w0-canonical-source 2>&1 | head -5
[2026-08-12T18:37:30.252Z] (finding) AGNT tower-cli-fix @ tower/cli-fix: DONE — defensive JSONL parsing...
```
— cwd-scoped output (topic `tower/cli-fix`, not the requested
`tower/w0-canonical-source`), with the body visibly cut off mid-word at
`p.mess` by `rowPreview`'s hardcoded 100-char slice (`cli.mjs:21-29`).

**Failure scenario:** An agent trying to check one specific topic before
posting to it (the exact workflow `board_post`'s own return string
recommends — "Peers will see it on their next board_read") gets back an
unrelated dump instead, with no error telling it the filter didn't apply.

**Rubric:** Discoverability — nothing distinguishes "this verb doesn't
support filtering" from "this verb silently ignored your filter"; the first
is a documented limitation, the second is a trap.

**10X move:** Either implement the topic filter (trivial — `boardFor` already
accepts one) or reject an unexpected positional argument with a usage error.

---

### 10 — MEDIUM: topic namespacing is discipline-only, unenforced, and undiscoverable

**Claim:** The `<project>/<topic>` convention has no code behind it — no
validation, no reserved-namespace check, no way to list existing topics — and
both conventions already coexist ungoverned in production.

**Evidence:** `grep -n topic tower-ledger.mjs` shows `topic` used only as an
opaque filter key; no regex/shape check anywhere in `tower-ledger.mjs`,
`cli.mjs`, or `server.mjs`. No `list-topics`/`distinct-topics` verb exists
anywhere (grep for "topics" across all three returns zero hits). Live board
data already shows both bare topics (`tower-auto`, `fut-rename`, `c003`) and
namespaced ones (`cursor-shim/lever-6-statem-reap`,
`constellation-zg/tower-stigmergy`) coexisting with no enforcement
distinguishing them.

**Failure scenario:** An agent typos a topic when posting (`tower-stigmergy`
instead of `constellation-zg/tower-stigmergy`) — the post succeeds, no error,
and creates a permanent, silent, unread island with no code path that would
ever surface the mismatch to anyone.

**Rubric:** Discoverability — an agent cannot verify it's posting to the
topic its intended reader is actually watching without already knowing the
exact string in advance.

**10X move:** A `board topics` verb that lists distinct topics seen (with
counts and last-post time) turns a silent typo into a one-command check.

---

### 11 — MEDIUM: three uncoordinated truncation policies over the same rows

**Claim:** The same board row reads as three different lengths depending on
which surface an agent or human uses, with no shared policy.

**Evidence:** CLI `rowPreview`/`preview` hard-truncates to 100 characters,
mid-word, no ellipsis-awareness (`cli.mjs:21-29`); MCP `board_read`
(`server.mjs:249-253`) returns `r.body` **verbatim, untruncated**;
`flight-recorder.mjs:55-56` truncates to 80 characters independently. Three
different answers to "how much of this message do I get to see," chosen per
consumer, not per message.

**Rubric:** Craft and consistency — the "No truncation" hard invariant in
`COMMS-ARCH.md:71-73` ("If a message enters a plane, it enters whole") is
already violated by the CLI's own default read path.

**10X move:** One shared preview policy (length + word-boundary-aware) in
`tower-ledger.mjs`, used by every consumer, with an explicit "and N more
characters, read via board_read for the full body" tail so truncation is
visible rather than silent.

---

### 12 — MEDIUM: `statem.ts` can crash silently, twice over, with no board announcement of its own death

**Claim:** The Made Well → Tower bridge process has two unguarded crash
points that would kill it with zero signal to anyone watching the board.

**Evidence:** `statem.ts:128` (module top level, before any try/catch
exists): `let prev = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;`
— unguarded `JSON.parse` of its own cache file. The paired write
(`writeFileSync(BASELINE, JSON.stringify(next))`, line 152) is a direct
overwrite with no tmp+rename atomicity, so a crash mid-write can leave a
truncated/corrupt baseline for the *next* start to choke on. Separately,
`appendBoard(t.body)` inside `poll()` (line 145) has no try/catch, and
`poll()` is invoked via `setInterval(poll, INTERVAL)` (line 163) with no
wrapping handler either — an `appendFileSync` failure (ENOSPC, EACCES, the
target directory vanishing) throws out of the interval callback uncaught,
which crashes the whole Bun process.

**Failure scenario:** The state-tracking poller for a live project (already
proven wired and actively used — 81 `statem` rows, most recent same-day) dies
from any transient filesystem hiccup, and nothing on the board ever records
that it stopped. Made Well transitions silently stop reaching Tower from that
point on, and nothing about the bus itself reveals the gap — only a process
monitor watching `statem.ts`'s own liveness would notice.

**10X move:** Wrap both the baseline load and every `poll()` invocation in
try/catch that posts a `finding`/`alert` row on its own failure before
exiting — a process that can die should be able to say so on its way out.

---

### 13 — LOW-MEDIUM: parent-wake is a separate channel from Tower and can silently diverge

**Claim:** `16-parent-wake` drives waking a spawner off a herdr pane
metadata token, not off any Tower-recorded lineage — the two can disagree
with nothing to catch it.

**Evidence:** `resolve_parent()` (`16-parent-wake:90-99`) resolves the wake
target from the pane's `parent=` token (stamped once at spawn by
`spine-spawn`); the actual wake (`sc.verified_prompt(parent_id, ...)`, line
160) uses that token directly. It writes one `note` row to the board for
audit (line 146) but never cross-checks the token against any Tower-recorded
lineage row.

**Failure scenario:** If a pane is renamed, respawned, or its `parent=` token
goes stale for any reason, parent-wake prompts whatever pane the token
currently names — independent of what Tower's own lineage rows say the real
spawner relationship is — with no code path that would ever flag the
mismatch.

**10X move:** Cross-check the `parent=` token against the `kind:"lineage"`
row Tower already records at spawn (per `RESPONSIBLE-PARTY-AND-NQ.md §1`) and
flag a divergence rather than trusting the token silently.

---

### 14 — LOW: `twr.ts`'s "open questions" view is a text heuristic, not the real mechanism

**Claim:** The TOWR pane's question tracking is a regex over board-row
bodies, not Tower's actual `kind:"question"`/answered-id tracking.

**Evidence:** `twr.ts:44-47`, `openQuestions()`: flags any board row whose
body matches `/question/i` with no later same-topic row matching
`/ruling|answer/i` — a much weaker, body-text heuristic than `inboxState`'s
real `kind==='question'` + `answeredIds` tracking used everywhere else.

**Failure scenario:** A board finding that merely discusses "a design
question" (with no ruling posted afterward, on that topic) shows up as an
open question in TOWR that isn't one; conversely a real question closed on a
different topic string, or with wording that doesn't say "ruling"/"answer,"
stays flagged open when it isn't.

**10X move:** Route TOWR's question view through the same `inboxState`
primitive every other consumer uses, rather than a second, weaker
reimplementation.

---

## Positive findings (for balance — not everything here is broken)

- **`normCwd`'s git-worktree collapse works exactly as designed.** Traced live
  against a real worktree cwd (`/Users/jrg/.spine/worktrees/arc/agnt-ws-g-adr`)
  through `git rev-parse --path-format=absolute --git-common-dir` +
  `dirname` + `realpathSync` → correctly resolves to `/Users/jrg/infinity/arc`,
  the shared parent project. Project isolation via `boardFor`/`normCwd` is
  real, not aspirational.
- **The 40-tower-bridge "never fabricate a question from a screen scrape"
  guard is real code**, not doc language: `on_blocked()` (`40-tower-bridge:299-311`)
  explicitly refuses to mint a question with no `$q` token, logging
  `"question NOT fabricated from screen"`.
- **Made Well's `statem` → Tower integration is genuinely wired and used**,
  not dormant: 81 live `statem`-topic rows, most recent from earlier the same
  day as this audit, real project cwds, real transition text.
- **`stop-verdict.mjs`/`ask-bridge.mjs` are byte-identical between deployed
  and canonical** as of this reading (unlike `cli.mjs` — Finding 3) — no
  drift there.
- **Every code-generated writer produces well-formed, newline-terminated
  JSON.** The live corruption traced in Finding 6 is fully attributable to
  pre-2026-08-11 hand-typed fallout, not an ongoing defect in any code path
  audited here.

---

## Message-lifecycle map

Tracing one message from an agent's intent through to acknowledgment, marking
every point evidenced in this audit where it can be silently lost:

```
INTENT (agent decides to send)
   │
   ├─▶ mcp__tower__send_to_user(kind=deliverable/alert)
   │      │
   │      ├─ no `to` ever set (F1) ──────────────▶ ⚠ SILENT LOSS: never enters `unrelayed`,
   │      │                                          tool's own return text claims otherwise
   │      └─ no required-field check (F5) ───────▶ ⚠ SILENT LOSS: missing field just vanishes,
   │                                                  "success" still returned
   │
   ├─▶ mcp__tower__ask_user → mcp__tower__reply
   │      │
   │      ├─ reply({question_id: undefined}) (F5) ▶ ⚠ SILENT LOSS: answer written, unmatchable forever
   │      └─ no nQ/human-answer-path guard in CC (F2) ▶ ⚠ SILENT LOOP: question never mechanically closes
   │
   ├─▶ cli.mjs post  (sanctioned non-MCP path, added 2026-08-11)
   │      │
   │      └─ deployed file still pre-fix (F3) ────▶ ⚠ LATENT: safe today by coincidence only;
   │                                                  fires the moment a symlink swap lands
   │
   ├─▶ hand-append raw JSON (documented fallback, F6)
   │      │
   │      └─ no escaping/newline/verify guidance ─▶ ⚠ PROVEN LOSS: 26 known-corrupt lines live today
   │
   └─▶ N independent hand-rolled writers (Python/TS, F8)
          │
          └─ schema drift (ids, timestamps, an invisible 6th `kind`) ▶ ⚠ SILENT: some readers structurally blind to some writers
   │
   ▼
STORAGE (board.jsonl / ledger.jsonl / pheromones.jsonl / odometer.jsonl)
   │
   ├─ no lock on real appends (F7) ───────────────▶ ⚠ once already caused total truncation (2026-07-24)
   │
   ▼
READ (parseLines: try/catch-per-line, tower-ledger.mjs)
   │
   └─ malformed line → null → filtered, no signal (F6/live-verified) ▶ ⚠ SILENT, PERMANENT: shared by
                                                                          every reader — CLI, MCP, all 5
                                                                          Tower-reading hooks — systemically
   │
   ▼
SURFACE (cli.mjs / board_read / hooks / TOWR / notifications)
   │
   ├─ cli.mjs `board <topic>` ignores filter (F9) ▶ ⚠ wrong data, no error
   ├─ 3 uncoordinated truncation policies (F11) ──▶ inconsistent completeness by surface
   ├─ 10-notify only fires on pane blocked/done ───▶ deliverable/alert with no pane-status change = no toast
   │   (doorbell is an agent convention, not code-enforced)
   ├─ twr.ts question view is a regex heuristic (F14) ▶ false positives/negatives
   │
   ▼
ACK (mark_relayed / relay_inbox)
   │
   └─ mark_relayed trusts caller-supplied ids (F4) ▶ ⚠ guard clearable without proof of display
```

---

## Proven vs assumed

| Proven (read/ran directly this session) | Assumed / inferred / out of scope |
|---|---|
| `server.mjs`'s every tool-handler case, line-exact, read in full (`send_to_user`, `ask_user`, `reply`, `check_inbox`, `mark_relayed`, `board_post`, `board_read`, `relay_inbox`, `pheromone_emit`) | Whether `stop-guard.mjs`'s missing try/catch actually fails open in the CC runtime's hook contract — would require forcing `inboxState()` to throw and observing whether Stop is blocked; not done (would be a live mutation-adjacent exercise) |
| `tower-ledger.mjs`'s `append`, `parseLines`, `inboxState`, `normCwd`, `withCursorLock`, ID/timestamp generation — read in full | Whether cross-cwd `mark_relayed` acking has ever actually occurred in practice — shown structurally possible, not observed |
| Live `diff` of deployed vs. canonical `cli.mjs`, `stop-verdict.mjs`, `ask-bridge.mjs` at time of audit | Exact identity of the writer that produced the missing-trailing-newline at board.jsonl line 2502 — ruled out true race (93s gap between the two objects' timestamps) but the specific tool wasn't locatable in the searched trees |
| Direct `json.loads`/parse diagnosis of corrupt lines 553, 2113, 2502 | Whether other harness-specific hooks (pi, cursor) outside `~/.tower/hooks`/`primitives/hooks`/`primitives/mcps/tower/hooks` repeat the `import.meta.url` anti-pattern |
| Live counts: `grep -c` for `"kind":"escalation"`, `"nq"`, `"topic":"statem"`, deliverable/alert `to`-field distribution (458/467 null) | Origin of `ODOMETER`'s writer — not located in `mcps/tower/`, `hooks/`, or `herdr-spine/`; out of the searched scope |
| Git log/commit messages for `b584ef2`, `8e54604`, `5e281be`, `9ff8778` — read in full, timestamps cross-checked against live board data | Whether the in-flight `install_tower_auto` reconciliation (visible live on the board as `AGNT w0-install-reconcile`) will actually prevent Finding 3 from recurring — work observed in progress, not verified complete |
| `40-tower-bridge`'s bridge-race guard, `on_blocked()`, read in full | — |
| `statem.ts`'s baseline-load/write/poll code paths, read in full | — |
| Made Well `.madewell/` existence and `statem` topic live-wiring (81 rows, real cwds) | — |
| `normCwd`'s worktree-collapse, traced against one real live worktree cwd end to end | — |
| The 2026-07-24 board-truncation incident, read verbatim from its own preserved alert text inside the live board file | — |

A note on process: one subagent's returned text was automatically
sanitized by the harness because it quoted `~/.claude/settings.json` hook
configuration verbatim, which pattern-matched as instruction-shaped content.
This was benign — local config content, not an external or adversarial
source — and is noted here only for transparency, not as a security finding
about the bus itself.

---

## What a 10X bus would look like

A message bus for unattended agents earns trust the same way a filesystem
does: by making "I wrote it" and "it's actually there, intact, for the right
reader" the same fact, mechanically, not by convention. Concretely:

1. **One writer.** A single `tower-append` primitive (already 90% built —
   `tower-ledger.mjs`'s `append()` — just not universally used) that every
   language/harness calls into, even non-JS callers, via one thin CLI shim.
   Not five independent reimplementations quietly drifting.
2. **Delivery guarantees that are actually guarantees.** `send_to_user`
   should be structurally incapable of returning "cannot end turn until
   relayed" without also making that mechanically true — same principle for
   every promise a tool's return string makes to its caller.
3. **Malformed data is loud, not silent.** A parse failure should surface
   somewhere an operator will see it — a standing `board`/`ledger`
   integrity count, a `.corrupt` sidecar log, anything — not vanish into a
   `.filter(Boolean)`.
4. **One truth about how much of a message you're seeing.** A single
   preview/truncation policy, shared by every consumer, that says so when it
   truncates.
5. **A bus that is hard to destroy, not merely forbidden to destroy.**
   Locked or `O_APPEND`-only real stores; the 2026-07-24 incident should have
   been structurally impossible, not a policy violation.
6. **Nothing to remember, only things to call.** `mark_relayed`'s
   trust-the-caller pattern, the escalation protocol that silently doesn't
   exist for one harness, the hand-append fallback with no safety rails —
   all examples of ceremony living in an agent's discipline instead of the
   tool's contract. A 10X bus makes the safe path the only path.

The bus already has the right shape — five clean planes, a real project-
isolation mechanism, a working bridge-race guard, real Made Well wiring. The
gap between where it is and 10X is not architecture; it's that several of its
own stated guarantees were diagnosed as broken (COMMS-ARCH.md says so about
itself) and not yet closed.
