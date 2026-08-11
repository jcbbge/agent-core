# Report: agnt-skill-verifier — adversarial audit of herdr SKILL.md

Pane `w1A:p12`. File edited: `~/.claude/skills/herdr/SKILL.md` only (350 →
367 lines). No other file modified; nothing committed. Doc-auditor
(`w1A:p11`) finished mid-session — marker `.done-agnt-doc-auditor` appeared
before I did the doctrine-attribution pass, so that pass ran against the
CORRECTED docs, not PENDING.

Epistemic note: every VERIFIED row below was checked THIS session (a
command I ran, a file I read, or a live experiment I performed — pane splits
w1A:p13→p14 to test ID reuse, agent-name-collision triggers, a WebFetch per
external URL). Nothing is carried over from the writer's or ORCH's reports
except the two items explicitly marked "ORCH-sourced" below, which the brief
directed me to add without re-triggering the exact race condition myself.

## AUDIT TABLE

| SKILL.md:line | Claim | Evidence gathered | Verdict |
|---|---|---|---|
| 18 (orig) | `metadata.upstream` GitHub raw URL is a live upstream skill source | `WebFetch` → HTTP 404 | **FIXED** — replaced with `UNKNOWN` + the 404 evidence |
| 28 | `herdr --version` → `0.8.0` | ran it: `herdr 0.8.0` | VERIFIED |
| 32 | `test "${HERDR_ENV:-}" = 1` gates control commands | `env | grep HERDR` → `HERDR_ENV=1` set in this pane | VERIFIED |
| 35–39 | Sandbox policy: `herdr api snapshot` is the verify-once check | ran `herdr api snapshot`, exit 0, full JSON tree | VERIFIED (this sandbox doesn't block the socket; the described failure mode itself is UNVERIFIABLE-BY-DESIGN in this session — would need a harness that actually blocks the socket) |
| 46–53 | Canonical docs table: 6 paths + what each owns | `ls` on all 6 paths — all exist; read all 6 in full, cross-checked ownership claims (see Doctrine section below) | VERIFIED |
| 55–62 | Hierarchy diagram + CTRL/TOWR infra prefixes | Read `control-flow.md` — matches its hierarchy diagram + Prefix-renames section verbatim in substance | VERIFIED |
| 64–69 | Prefix table (CORD/ORCH/AGNT/SAGT) + registration names | `control-flow.md` Naming-convention table matches for role/scope; **registration-name column ("cord-", "orch-", "agnt-", "sagt-") is only explicitly doctrine-confirmed for orch-/agnt-/sagt-** (control-flow.md's Prefix-renames section literally lists "orch- agnt- sagt-", omitting cord-); spawn.md's own table has the same gap. `cord-<project>` is a mechanical, self-consistent extension of the general lowercase-kebab rule stated two lines later in SKILL.md itself, not an independent fabricated fact | VERIFIED for role/scope columns; registration-name column PARTIALLY VERIFIED (doctrine gap, not a SKILL.md error — see Doctrine gaps below) |
| 72–75 | `agent start` rejects spaces/uppercase → `invalid_agent_name` | Live-triggered: `herdr agent start bad_name_UPPER --kind claude --pane w1A:p12` → `{"error":{"code":"invalid_agent_name",...}}` | VERIFIED |
| 77–91 | The stamping mandate: 4 carriers, `$task`/`role`, restart trap | Read `spawn.md` §Four name carriers + §$task + §Hierarchy order — matches near-verbatim, including the exact carrier commands | VERIFIED |
| 84 | `pane report-metadata` flags (`--source`, `--display-agent`) | `herdr pane report-metadata --help` | VERIFIED |
| 85 | `pane rename` feeds `panes[].label` | `herdr pane rename --help` (syntax); label-feeds-panes[].label corroborated by ctl-fleet.md §Hierarchy rules ("label is always read first") | VERIFIED |
| 93–101 | Reaping section | Read `control-flow.md` §Reaping — near-verbatim match | VERIFIED |
| 105–108 | "never bare `herdr`"; commands print JSON | `herdr` bare launches TUI per `herdr --help`'s own usage block; every command I ran printed JSON | VERIFIED |
| 110–116 | `--session`/`HERDR_SOCKET_PATH` route; `HERDR_SESSION` does NOT | Live-ran `HERDR_SESSION=nonexistent-probe-session herdr workspace list` → returned the real default-session workspaces (w1A/w1E) unchanged, not an error, not a different session | VERIFIED (re-verified independently of the writer's/ORCH's identical prior claim) |
| 111–112 | `HERDR_SOCKET_PATH` honored "inside plugin context... confirmed in spine-wormhole/spine-watch/spine-greeting" | `grep -l HERDR_SOCKET_PATH` on all three files — all three reference it | VERIFIED (source-corroborated; I did not run inside an actual plugin dispatch to observe injection directly — same caveat the writer flagged) |
| 118–122 (new) | ID format is short, opaque, colon-joined | Original text showed a 3-segment example `w1:t1:p1`; every real ID observed this session (`api snapshot`, `pane get`, `pane split` results) is 2-segment (`w1A:p12`, `w1A:tJ`) — the original example was wrong and also inconsistent with its own "split on the FIRST colon only" instruction (which doesn't fully parse a 3-segment ID) | **FIXED** — replaced example with real observed IDs |
| 120–122 (new) | Closed IDs never reused; moved pane gets a new one | Live-tested: split pane → `w1A:p13`, closed it, split again → `w1A:p14` (never reused `p13`) | VERIFIED (added the concrete evidence inline) |
| 122–123 | Herdr injects `$HERDR_WORKSPACE_ID`/`$HERDR_TAB_ID`/`$HERDR_PANE_ID` | `env` in this pane: all three set (`w1A`, `w1A:tJ`, `w1A:p12`) | VERIFIED |
| 124–126 | No pane-birth timestamp anywhere, verified against `session.snapshot` | Ran `herdr api snapshot`, inspected every key on every pane object — no timestamp field anywhere; matches `control-flow.md`'s own correction note and `ctl-fleet.md` §Telemetry | VERIFIED |
| 127–128 | `workspace list`, `tab list --workspace`, `pane list --workspace`, `api snapshot` syntax | `--help` on all four | VERIFIED |
| 132 | Agent status enum: idle/working/blocked/done/unknown | `herdr agent prompt --help` / `agent wait --help` list exactly these 5 as `--until` values | VERIFIED |
| 133–135 | done=unseen, focusing flips to idle | Behavioral/UX claim — testing it means focusing a tab, an operator-visible mutation the brief explicitly warns against | UNVERIFIABLE-BY-DESIGN |
| 137–141 | `agent_status` can lag a busy harness; permission dialogs surface as `blocked` | Experiential/detector-internals claim, no instrumentation access this session | UNVERIFIABLE |
| 150–153 | Spawn-loop command block (`split`/`rename`/`agent start`/`agent prompt --wait --until working --timeout`) | `--help` on all four commands — every flag shown exists exactly as written | VERIFIED |
| 156–159 | `agent_pane_busy` retry; `agent_name_taken` | Live-triggered `agent_name_taken` (`herdr agent start agnt-doc-auditor ...` → exact error). `agent_pane_busy` not independently re-triggered (needs a pane mid-shell-init, not reliably reproducible on demand) but is documented in `spine-spawn`'s own code comment and `spawn.md` | VERIFIED (agent_name_taken, live); agent_pane_busy VERIFIED-BY-SOURCE (spine-spawn code + spawn.md) |
| 159–164 (new) | Added: freshly-split pane can surface `timeout`/`command not found: <agent>` instead of `agent_pane_busy` | Per brief's Pre-Verified Fact from ORCH — **not independently re-triggered by me** (explicitly labeled as ORCH-sourced in the new text) | ORCH-VERIFIED, added as instructed, labeled honestly |
| 161–174 | Delivery-not-delivery-until-verified hard rule, Pasted-text fallback | `agent prompt --help` confirms `agent_prompt_stalled` semantics exactly ("requires an observed state change within 5000ms... otherwise agent_prompt_stalled"); fallback commands' flags all verified via `--help` | VERIFIED |
| 164–166 | "`/reload`-style inputs never flip state — check the transcript first" | Would require spawning a live agent and sending a literal `/reload`-style input mid-turn to observe the state machine not flip — a real API-cost experiment for one footnote | UNVERIFIABLE-BY-DESIGN (not attempted; flagging rather than fabricating) |
| 176–190 | spine-spawn wrapper: modes, fanout cap 4, the naming gap, the per-worker re-stamp fix | Full read of `~/herdr-spine/bin/spine-spawn` (444 lines): `FANOUT_CAP = 4` confirmed; `spawn_into_pane()` calls `pane rename` then `start_agent()` with the SAME `role` string (confirms "passes one role string to both"); `cmd_fanout` builds `role = f"{args.task}-w{i}"` (confirms `<task>-wN`, no prefix, no display-agent call anywhere in the file) | VERIFIED against code, byte-for-byte |
| 197–231 (new) | Husk classification; restart preserves IDs/labels not processes; `[[startup]]` inert, `15-restore-view` is the live replacement | Read `spine-startup` (deprecated), `15-restore-view` (103 lines) in full. **Found and corrected an error**: both `spine-startup`'s docstring and `herdr-plugin.toml`'s comments assert `RawPluginManifest` "declares no `startup` field" — I read `~/source/herdr/src/app/api/plugins/manifest.rs` directly and that is FALSE: line 25 declares `startup: Vec<RawPluginManifestStartup>` with `#[serde(default)]`, and `PluginManifestStartup` is imported at line 3. `spawn.md` (doctrine, post-audit) has the CORRECT read of the same file. The empirical conclusion (view not restored via startup) still holds — the stanza is simply absent from the deployed toml (a 2026-08-09 config choice), not a parser limitation | **FIXED** in SKILL.md (corrected the citation + the underlying claim); the false claim itself lives in CODE (`spine-startup`, `herdr-plugin.toml`) which I have no authority to edit — **REPORTED below** |
| 219–239 | Coordinated fan-out contract | Cross-checked against `control-flow.md`, spawn.md's fanout description, and spine-spawn's `FANOUT_CAP`/`grid_panes()` (down-then-right, confirmed at code lines 325–335) | VERIFIED |
| 243–249 | `ctl-fleet --spawn`: splits CORD host in tab 1 at 0.62, `--no-focus`, renamed `CTRL fleet`/`CTRL <project>`, always a split of tab 1 | Full read of `ctl-fleet` (464 lines): `runSpawn()` filters `tab_id === ws:t1`, finds `/^(cord|crd)\b/i` host (falls back to `tabPanes[0]`), splits at `--ratio 0.62 --no-focus`, renames exactly `CTRL fleet` / `CTRL ${basename(root)}`. Also cross-read `ctl-fleet.md` — verbatim match | VERIFIED against both code and doctrine |
| 250–253 | `twr.ts`: renders TRANSITIONS/FINDINGS/OPEN QUESTIONS, writes nothing | Full read of `twr.ts` (91 lines) — three `section()` calls with exactly those three labels; no `writeFileSync`/`appendFileSync` anywhere in the file | VERIFIED |
| 254–259 | `statem.ts`: derives outer/inner from `.madewell/`, one `finding` row per transition (topic `statem`), glyph-only tab renames, mapping file | Full read of `statem.ts` (163 lines): `readState()` reads `mw.stage` + cycle `phase`; `appendBoard()` hardcodes `type: "finding", topic: "statem"`, called once per entry in `transitions()`'s output; `renameTabs()` passes ONLY `glyphs()` output as the extra `herdr tab rename` args (never a phase word) | VERIFIED |
| 261–282 | Comms rules: one rule, four planes, notification rubric, project namespacing | Full read of `COMMS-ARCH.md` — every sub-claim (the one rule, the 4 planes with their exact descriptions, the 60s pacing, the `<project-slug>/<topic>` namespacing + bare-topic exception, board_post's real-cwd requirement) matches near-verbatim, including the identical `future/c004` example | VERIFIED |
| 296–305 | Signal-over-polling: `events.subscribe`, subscribe-then-snapshot ordering | Corroborated by `ctl-fleet`'s own event/reconcile model section (open→subscribe→pollSnapshot on connect) | VERIFIED against code |
| 307–318 | Herdr/Tower bridge: `10-notify` → board lines, `40-tower-bridge` → ledger questions, both on `pane.agent_status_changed`; `tower-orchestration.md` defers to COMMS-ARCH.md now | Full reads of both handlers (511 + 457 lines): both docstrings and code confirm they fire on that exact event name and write to the claimed planes with zero dual-write. Read `tower-orchestration.md` directly — its own header says "where the two would otherwise disagree, COMMS-ARCH.md wins" — three-way agreement (SKILL.md/COMMS-ARCH.md/tower-orchestration.md) | VERIFIED |
| 314–315 | `herdr notification show <title> --body <text> --sound request` | `herdr notification show --help`: exactly `--body`/`--position`/`--sound` (values `none/done/request`) | VERIFIED |
| 320–322 | "skills live in `~/agent-core/primitives/skills/`, confirmed on disk" | `ls -d ~/agent-core/primitives/skills` | VERIFIED |
| 341–345 | `spine-lab` for isolated experiments; never `herdr server stop` casually | `ls ~/herdr-spine/bin/spine-lab` exists; did not test server-stop semantics (explicitly forbidden by the brief) | Path VERIFIED; behavior UNVERIFIABLE-BY-DESIGN (forbidden mutation) |
| 349–351 (new) | External refs: `herdr.dev/agent-guide.md`, `/docs/cli-reference/`, `/docs/socket-api/` | `WebFetch` on all three — all return real, on-topic content, no 404s | VERIFIED |
| Whole file | `metadata.gateway` roots (`~/.pi/agent`, `~/agent-core/primitives`) | `ls -d` both | VERIFIED |

## Cold-reader test (reading ONLY the final SKILL.md)

a) **Name and stamp a pane correctly** — YES. Lines 64–75 give the prefix
table + the lowercase-kebab registration rule + where display case lives
(label/`--display-agent`, never the registration name); lines 77–91 give
all four carriers plus `$task`/`$role` verbatim, with the restart trap
called out so a cold reader doesn't skip it.

b) **Spawn an agent and know delivery isn't delivery until the status flip
is observed** — YES. Lines 161–174, in bold, with the exact verify commands
and the Pasted-text fallback; reinforced again at 316–318.

c) **Find CTRL/TOWR/statem and know what each shows and how launched** —
YES. Lines 243–259, each with its exact spawn/run command and what it
renders.

d) **Post to the board with `<project-slug>/<topic>` from a real repo
cwd** — YES. Lines 277–282, with the concrete `future/c004` example and the
bare-topic exception, plus the refuses-scratch/temp rule.

e) **Know when to reap and what reaping means** — YES. Lines 93–101: done =
gone, who reaps whom, and the named exceptions (CTRL/TOWR/statem, the
operator's focused pane).

All five: **PASS**, with citations. No defect found on this pass.

## Doctrine attributions — checked against the POST-AUDIT docs

The doc-auditor's `.done` marker appeared while I was mid-session (before I
started the attribution pass), so I read `control-flow.md`, `COMMS-ARCH.md`,
`spawn.md`, `ctl-fleet.md`, and `tower-orchestration.md` in their CORRECTED
state, not pending. Every attribution in SKILL.md's canonical-docs table and
every "doc says X" claim in the body checked out against these five files —
no surviving doctrine error found in any of them.

**One doctrine gap noted, not fixed (outside my file):** `control-flow.md`'s
Naming-convention / Prefix-renames sections and `spawn.md`'s naming table
both list lowercase-kebab registration forms for `orch-`/`agnt-`/`sagt-`
but never explicitly for `cord-`. SKILL.md's table lists `cord-<project>`
anyway — a reasonable, mechanically-consistent extension of the
general rule stated two lines later, not a fabrication, so I left it as-is
rather than deleting a plausible value. Flagging in case the doc-auditor's
pass didn't catch this specific omission.

## Code bug found and reported (outside my file partition — code, never edited)

`~/herdr-spine/bin/spine-startup`'s docstring and `~/herdr-spine/herdr-plugin.toml`'s
comments both assert that `RawPluginManifest` "declares no `startup` field"
at installed herdr 0.8.0. I read
`~/source/herdr/src/app/api/plugins/manifest.rs` directly this session:
line 25 declares `startup: Vec<RawPluginManifestStartup>` with
`#[serde(default)]`, and `PluginManifestStartup` is imported at line 3 — the
field and the type both exist. `spawn.md` (doctrine, post-audit) has the
correct read of this same file. The empirical behavior these two files
describe (the plugin-owned agent view is not currently restored via
`[[startup]]`) is still true, but for the actual reason `spawn.md` gives:
the `[[startup]]` stanza was removed from `herdr-plugin.toml` on 2026-08-09
(a deployment/config choice), not because the manifest parser can't
represent it. Practical consequence someone should pick up: re-adding
`[[startup]]` to `herdr-plugin.toml` may now work at 0.8.0 — untested, and
worth testing before trusting `bin/spine-startup`'s "NOT A LIVE CODE PATH"
framing as permanent. I corrected SKILL.md's citation of this claim (was:
"confirmed in spine-startup, deprecated" as if that settled the mechanism);
I have no authority to edit `spine-startup` or `herdr-plugin.toml`
themselves (code, outside my partition) or `spawn.md` (doctrine, being
audited by a peer) — reporting here per the brief.

## Fixes made in SKILL.md (file:line, before → after)

1. **Line 18 (frontmatter `upstream`)** — GitHub raw URL 404. Replaced with
   `UNKNOWN` + the verification evidence.
2. **Lines 118–122 (ID format)** — example `w1:t1:p1` (3 segments) replaced
   with real observed 2-segment IDs (`w1A:p12`, `w1A:tJ`); added the
   live pane-reuse test as inline evidence for "closed IDs never reused."
3. **Lines 159–164 (`agent start` failure modes)** — added the
   `timeout`/`command not found` failure mode per the brief's Pre-Verified
   Fact from ORCH, honestly labeled as not independently re-triggered by me.
4. **Lines 217–230 (restart/husk section)** — corrected the false
   "RawPluginManifest declares no startup field" premise inherited from
   `spine-startup`'s docstring; replaced with the verified mechanism (toml
   stanza absent, not a schema limitation) and cited the exact source lines.

## Not fixed / left as-is with reasoning

- `cord-<project>` registration name (doctrine gap, not a SKILL.md error —
  see above).
- The `--token role=` numeric-prefix convention (`1-CORD|2-ORCH|3-AGNT|4-SAGT`)
  — verified consistent with `ctl-fleet`'s actual parser, which only reads
  the text after the first `-` and ignores the digit, so any digit works;
  not misleading, just under-specified. Left as-is.
- The OPERATOR-DIRECTIVES plane's "recorded on the board either way"
  (line ~269) is a slightly looser paraphrase than COMMS-ARCH.md's more
  precise "when direct, the receiving agent records it" (the
  through-the-coordinator path doesn't need separate recording since the
  conversation IS the record) — not false, just imprecise. Left as-is; a
  future pass could tighten it.

## Final line count

**367 lines** (started at 350; +17 net from the four fixes above, all of
which added evidence/citations rather than removing verified content).

## Comms

Posted CLAIM to `herdr/skill-audit` at session start (pane `w1A:p12`,
id `t-msnus7al-3kzx`). Posting DONE finding next, then creating this
report's marker.
