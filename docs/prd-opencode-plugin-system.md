# PRD: OpenCode Plugin System — Lifecycle Hook Library

**Status:** Idea bank ready for selective implementation
**Location:** `~/Documents/_agents/docs/prd-opencode-plugin-system.md`
**Audience:** Any agent or developer picking this up with zero prior context

---

## 1. Vision & Philosophy

OpenCode exposes a plugin system — JavaScript/TypeScript modules that subscribe to lifecycle events and can observe, modify, and steer agent behavior at every meaningful moment in the developer-agent collaboration loop.

The thesis of this PRD is simple: **the collaboration loop leaks context and intelligence at every boundary**. Sessions start cold. Sessions end without persistence. Errors get chased symptomatically. Decisions get re-litigated. Scope drifts silently. Tests get skipped. Secrets slip through. Each of these failures has a specific lifecycle event where intervention would have prevented it.

This PRD captures a curated library of plugin implementations — one per hook event, many per event — that address these failures systematically. They are organized as an idea bank, not a deployment schedule. The developer picks what matters most and implements in whatever order fits.

**Three design principles govern every idea in this document:**

**Steer, don't just notify.** A plugin that fires a toast is better than nothing. A plugin that closes a feedback loop — making the agent smarter, preventing a class of errors, or persisting something that would otherwise be lost — is 10x more valuable. Prefer the latter.

**Idle time is free compute.** The agent produces a response; then it waits. That window is the highest-density opportunity in the session. Background indexing, second opinions, memory consolidation, and session housekeeping belong there — not competing with active work.

**The session lifecycle is the unit of trust.** Every session starts cold and ends with context evaporating. The right architecture makes session start warm, session end graceful, and session boundaries disappear as obstacles to continuity.

---

## 2. Core Concepts

### The OpenCode Plugin Model

Plugins are modules placed in `~/.config/opencode/plugins/` (global) or `.opencode/plugins/` (project-scoped). They are loaded automatically at startup. Each plugin exports a function that receives a context object and returns a map of event handlers. The context object provides: the current project, working directory, git worktree, an SDK client for interacting with the AI, and a shell execution API.

### Event Taxonomy

OpenCode fires events at 11 distinct points in the lifecycle. These are not hooks in the traditional sense — they are event subscriptions. Multiple plugins can subscribe to the same event. All handlers run in sequence.

The events divide into five categories:

| Category | Events |
|---|---|
| Command | `command.executed` |
| File | `file.edited`, `file.watcher.updated` |
| Session | `session.created`, `session.idle`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.status`, `session.updated` |
| Interaction | `permission.asked`, `permission.replied`, `message.updated`, `message.removed`, `todo.updated` |
| Execution | `tool.execute.before`, `tool.execute.after`, `shell.env`, `lsp.client.diagnostics`, `tui.prompt.append`, `experimental.session.compacting` |

### The Brain Layer

Josh's development system has four always-on brain-layer services:
- **Anima** — identity and memory (persistent across sessions, phi-weighted)
- **Dev-Brain** — todos, workspace state, ADRs, thought stream
- **KotaDB** — code intelligence, semantic search, dependency graphs
- **Subagent-MCP** — delegatable specialized agents (reviewer, test-writer, architect, debugger, sigil-distiller)

All four are accessible through executor (the single MCP gateway). In plugin code, they are reached via `client` SDK calls that route through the executor. No plugin should call brain-layer services directly — all access goes through the executor at `http://127.0.0.1:8000`.

### Scope of This PRD

This document catalogs plugin ideas organized by event type. Each idea includes: what it does, why it matters, what triggers it, and what it produces. Implementation detail (language, library, exact API shape) is intentionally omitted — the ideas are stack-agnostic.

---

## 3. Functional Requirements

### FR-1: Command Events

**`command.executed`** — fires when any slash command is run.

1. **Ritual Tracker** — tracks command frequency per session and project; writes patterns to dev-brain thought stream; surfaces weekly summary at session start
2. **Did It Work?** — snapshots conversation state when a command fires; evaluates N turns later whether it changed the trajectory; logs outcome correlation to Anima
3. **Command Amplifier** — when specific commands fire, pre-fetches and prepends relevant context (e.g. `/prd` auto-pulls open todos, workspace state, recent ADRs)
4. **What Comes Next** — after commands with known natural successors, suggests the follow-on command based on historical patterns
5. **Decision Capture** — when analytical commands produce architecture-adjacent output, auto-proposes drafting an ADR from the output
6. **Stop-and-Breathe** — when the same analytical command fires >3 times in a session, fires a diagnostic: "this may indicate the core problem isn't named correctly"
7. **Intent Mapper** — when `/step-workflow` fires and produces a numbered list, automatically creates those steps as dev-brain todos
8. **Primitive Ledger** — logs every command invocation with timestamp, project, session phase, and context snapshot; creates queryable usage history
9. **Primitive Rot Alert** — tracks which commands have never been invoked in 30 days; surfaces stale commands for pruning or rename
10. **Last Time You Did This** — when a command fires, checks Anima for the last time it ran in this project and what context surrounded it; prepends historical note

---

### FR-2: File Events

**`file.edited`** — fires when an agent edits a file.

1. **The Change Journal** — writes structured entry to dev-brain after each edit: file, diff summary, associated task, conversation context
2. **Ripple Detector** — queries KotaDB for dependents of edited file; surfaces ranked blast radius list before proceeding
3. **Uncovered Edit Watcher** — when a non-test file is edited without a corresponding test file edit, flags it and suggests delegating to `@test-writer`
4. **Credential Guardian** — scans every edited file immediately for secret patterns; hard-blocks before the edit completes if found
5. **File Health Monitor** — tracks line count and complexity delta per edit; when a file crosses a threshold, flags it as a refactor candidate
6. **Layer Enforcer** — checks edits against architectural layer rules (no client-to-DB imports, no frontend business logic); flags violations immediately
7. **Progress Pulse** — updates dev-brain workspace state with a running summary of what changed this session as files are edited
8. **Live Index** — queues edited files for KotaDB re-indexing asynchronously after each edit; keeps code intelligence current without blocking
9. **Don't Repeat Yourself Watcher** — when a new function is written, semantically searches KotaDB for similar existing code; surfaces duplication candidates
10. **Undo Trail** — before every edit, snapshots the previous file state with timestamp and task association outside of git

**`file.watcher.updated`** — fires when the filesystem detects an external change.

1. **World Changed** — when a file the agent has read this session changes externally, injects a context note and offers to re-read
2. **Hot Validator** — when key config files change, automatically runs the relevant build or typecheck and posts the result
3. **Lock Watcher** — when `package.json` changes but the lockfile doesn't update within a short window, flags the drift
4. **Schema Shift Alert** — when database migration files change, checks whether TypeScript types or schemas need updating
5. **Continuous Test Ghost** — when a source file changes externally, finds its associated test file and runs it automatically
6. **Merge Collision Alert** — when the agent has a planned edit queued and that file changes externally, fires a hard interrupt before the agent proceeds
7. **Secret Sync Guard** — when `.env` files change, logs changed key names (not values) and checks for consuming files that reference them
8. **Cache Buster** — maintains a registry of files the agent has "read and understood" this session; marks them stale when they change externally
9. **Doc Lag Detector** — when source files change, checks whether documentation references changed symbols and may now be stale
10. **Unstaged Awareness** — after a burst of changes settles, runs git status silently and updates the agent's awareness of uncommitted work

---

### FR-3: Session Events

**`session.created`** — fires when a new session starts.

1. **The Handshake** — fires the complete bootstrap sequence: anima identity + dev-brain workspace state + open todos; injects structured context block before the first user message
2. **Session Ledger** — captures conversation ID from bootstrap and stores it session-scoped for use by all subsequent hooks
3. **Parallel Instance Detector** — checks dev-brain for other active instances in the same working directory; warns if concurrent work may conflict
4. **Morning Brief** — generates a human-readable narrative of everything that changed since the last session: files edited, todos completed, commits made, errors logged
5. **Reality Check** — reads stored workspace state from dev-brain and compares against actual git state; flags any divergence
6. **Tool Inventory** — quick health ping of executor, SurrealDB, anima, dev-brain, KotaDB at session start; surfaces any down services with restart commands
7. **Smart Preloader** — based on current git branch and open todos, pre-fetches the most relevant KotaDB context
8. **Leftovers Warning** — runs git status at session start; flags uncommitted changes from a previous session before anything new begins
9. **Session Intent Capture** — anchors the session's primary goal in dev-brain at the start; provides a reference point for mid-session drift checks
10. **Don't Repeat Mistakes** — searches Anima for errors and corrections from the last 7 days and surfaces the top 3 most relevant ones

**`session.idle`** — fires when the agent finishes responding and waits.

1. **The Landing** — when the session appears to be ending (extended idle after task completion), fires the full session-close sequence automatically
2. **Idle Indexer** — triggers KotaDB re-indexing of session-edited files during idle periods; no performance cost to active work
3. **What's Left** — after a response containing task-completion language, checks open todos and marks the completed one; surfaces what's next
4. **Memory Consolidator** — batch-writes accumulated session observations to Anima during idle; distributes capture across the session rather than waiting for the end
5. **Are We Still On Track?** — periodically compares current conversation content against the session-start goal anchor; flags significant drift
6. **Coverage Check** — after a batch of file edits, runs the test suite during idle and reports coverage delta
7. **Commit Prompt** — when a logical task completion exists and significant uncommitted changes exist, suggests a commit with a pre-drafted message from the diff
8. **Instance Keepalive** — fires dev-brain heartbeat during idle periods; prevents the session from appearing stale to parallel instances
9. **What I Didn't Know** — after responses where the agent expressed uncertainty, logs those knowledge gaps to dev-brain for future skill/context enrichment
10. **Sanity Check Dispatcher** — after responses containing significant architectural decisions, dispatches silently to `@reviewer` during idle; prepends disagreements to the next response

**`session.compacted`** — fires when context is compacted.

1. **Compaction Archaeology** — extracts the compaction summary and stores it as a dev-brain thought with type `synthesis`
2. **Complexity Pressure Alert** — counts compactions per session; at threshold, alerts that the task may be too large or context is polluted
3. **Mid-Session Checkpoint Commit** — on compaction with significant staged changes, drafts a commit message from the compaction summary
4. **Workspace State Snapshot** — updates dev-brain workspace state with the compaction summary as the notes field
5. **Todo Extraction Pass** — sends the compaction summary to extract unfinished tasks and open questions; creates dev-brain todos from them
6. **Cognitive Load Index** — tracks compaction frequency per project over time; high frequency is a structural signal for architectural or workflow intervention
7. **Compaction-Triggered Subagent Handoff** — after a long session's compaction, suggests delegating remaining work to a specialized subagent with the summary as context
8. **Anima Memory Store** — stores the compaction summary in Anima with moderate phi; makes it available for future session bootstraps
9. **Scope Drift Detector** — compares compaction summary against the session's original first message; flags significant divergence from original intent
10. **KotaDB Re-index Trigger** — after compaction with significant code changes, queues targeted KotaDB re-indexing of modified files

**`session.deleted`** — fires when a session is deleted.

1. **Pre-Deletion Artifact Extraction** — extracts last known state and key decisions before deletion; stores as a dev-brain tombstone record
2. **Orphaned Todo Detector** — checks dev-brain for todos tagged with the deleted session ID that remain open; surfaces them for reassignment
3. **Git State Safety Check** — if session had uncommitted changes, warns the developer before full deletion
4. **Session Epitaph Writer** — for long sessions, writes a structured record (title, duration, files changed, lines changed) to a local session history file
5. **Recurring Pattern Detector** — compares deleted session title against historical sessions; if same topic recurs frequently, suggests creating a workflow or skill
6. **Workspace State Cleanup** — if the deleted session was the last active for a project, updates workspace state to "paused"
7. **KotaDB Session Annotation Cleanup** — removes session-scoped in-progress markers from KotaDB
8. **Anima Memory Deweighting** — reduces phi on Anima memories tagged with the deleted session; they are historical, not active context
9. **Session Deletion Rate Monitor** — tracks time-to-deletion; sessions deleted within 2 minutes signal a broken session initiation flow
10. **ADR Rescue Pass** — for long sessions, passes the final context summary through extraction asking whether any architectural decisions were made; creates draft ADRs from matches

**`session.diff`** — fires with the git diff of session changes.

1. **Intent-vs-Diff Alignment Check** — compares the session's original task description against the actual diff; scores alignment; flags if < 70%
2. **Automated Commit Message Drafter** — generates a commit message in conventional commit format from the diff; stores it for one-command application
3. **Diff-Driven KotaDB Re-index** — parses the diff for modified file paths and queues targeted re-indexing only for those files
4. **Security Pattern Scanner** — runs the diff through a pattern scanner for secrets, SQL injection vectors, exposed env vars; flags with file:line references
5. **Change Magnitude Gauge** — calculates diff statistics and categorizes the session: trivial / incremental / significant / large / massive; stored in session history
6. **Test Coverage Gap Detector** — cross-references changed source files against test file changes; lists uncovered files; optionally creates a dev-brain todo
7. **Diff-to-PR Description Generator** — stores the diff summary in structured format ready to pre-populate a PR description
8. **Breaking Change Detector** — analyzes the diff for function signature modifications, removed exports, renamed types; flags with file:line references
9. **Anima Session Memory Store** — creates an Anima memory summarizing what was built, derived from diff statistics
10. **Architectural Drift Detector** — compares changed file paths against known architectural boundary configs; flags violations

**`session.error`** — fires when a session encounters an error.

1. **Error Triage Classifier** — classifies errors into categories (tool failure, context overflow, auth, network, timeout, model refusal) and routes to category-specific handlers
2. **Infrastructure Health Check on Tool Failure** — on tool-related errors, automatically health-checks all brain-layer services and reports which are up/down with restart commands
3. **Error Frequency Counter** — counts errors per session and per project; when a session exceeds N errors, surfaces a systemic alert
4. **Automatic Session State Snapshot** — on every session error, writes current session state to a local error-snapshot file for retrospective debugging
5. **Model Fallback Suggester** — when the error indicates a model failure (rate limit, context limit), suggests alternative models with reasons
6. **Context Pollution Detector** — on repeated errors in long sessions, flags context pollution as the likely root cause
7. **Error-to-Dev-Brain Thought Logger** — logs every session error as a dev-brain thought with type "error" and relevant tags
8. **Retry Strategy Advisor** — advises on retry strategy based on error type: immediate / reduced context / wait with backoff / fix first then retry
9. **Error Pattern ADR Suggester** — when the same error type appears 3+ times across sessions on the same project, suggests drafting an ADR about the structural cause
10. **Anima Error Memory** — stores significant errors in Anima with `deepening` synthesis mode; they are held tensions that need resolution

**`session.status`** — fires when session status changes.

1. **Focus Mode Toggle** — when session transitions to `running`, writes a status file readable by other tools; enables notification suppression scripts
2. **Idle Timeout with Todo Suggestion** — after idle exceeds a threshold, surfaces the highest-priority open dev-brain todo as the suggested next task
3. **Running Duration Monitor** — alerts if a single running period exceeds a threshold without returning to idle
4. **Status-to-Workspace State Sync** — maps session status to dev-brain workspace state automatically: running→active, idle→paused, error→active with error note
5. **Multi-Session Conflict Detector** — when a session transitions to running, checks if another session is also running on the same project
6. **Status Transition Timeline Logger** — maintains a timeline of all status transitions per session; stores for behavioral telemetry analysis
7. **Cost Accumulation Tracker** — uses running time as a proxy for API cost; maintains a running estimate visible in a local status file
8. **Error State Recovery Protocol** — on error status transition, triggers structured recovery: health check + error classification + recommended action + recovery session option
9. **Idle-Phase Background Sync** — on every idle transition, queues Anima sync, dev-brain todo refresh, and KotaDB background indexing
10. **Parallel Instance Coordination Signal** — broadcasts every status change to dev-brain as a thread heartbeat; enables ambient awareness between parallel instances

**`session.updated`** — fires when session metadata changes.

1. **Title Change as Context Signal** — stores an Anima memory when the session title changes; title changes signal task reframing
2. **Model Change Advisor** — when the session model changes, provides a brief note on context window, cost profile, and known strengths/weaknesses
3. **Session Configuration Snapshot** — writes a versioned snapshot of full session configuration on every metadata update
4. **Metadata-Driven Subagent Suggestion** — analyzes session title for keywords matching subagent specializations; suggests the appropriate `@subagent`
5. **Session Taxonomy Tagger** — automatically applies tags (debugging, feature, refactor, review, architecture, infrastructure) based on title keywords
6. **Working Hours Tracker** — records metadata update timestamps as developer activity signals; aggregates for work pattern analysis
7. **Session-to-Workspace Link Enforcer** — infers project from session title and links to the correct dev-brain workspace state; creates one if it doesn't exist
8. **Context Window Budget Calculator** — on model change, calculates remaining context budget based on current message count and new model's window size
9. **Metadata Update as Kanban Trigger** — detects status tags in titles (`#done`, `#blocked`, `#review`) and propagates them to linked dev-brain todos
10. **Session Clone Template Extractor** — when a session configuration stabilizes after several updates, offers to save it as a reusable session template

---

### FR-4: Interaction Events

**`permission.asked`** — fires before the developer grants or denies a permission.

1. **Permission Context Enricher** — enriches every permission request with KotaDB dependency count, last git commit on the file, and open todos tagged to the path
2. **Blast Radius Visualizer** — on write permission for high-dependency files, runs and displays a dependency tree summary before the developer responds
3. **Permission History Recall** — searches Anima for past permission events on the same file or command; surfaces "you previously approved/denied this on [date]"
4. **Risk Score Badge** — computes a 1-5 risk score based on tool type, file criticality, and command patterns; displays alongside the request
5. **Batch Permission Deduplicator** — when the same permission is requested 3+ times in 5 minutes, suggests adding it to the allowlist in config
6. **Pre-Permission Gut-Check Injector** — flags when a command pattern has no history in this project: "this has never been run here before"
7. **Auto-Approve Safe Patterns** — developer-defined safe patterns are auto-approved silently and logged for audit; restores friction to permissions that matter
8. **ADR-Required Gate** — when a permission involves deleting a file or a widely-used public API, fires a non-blocking prompt to create an ADR first
9. **Session Context Summarizer** — injects a one-line summary of session work so far into every write-class permission request
10. **Network Permission Firewall** — parses any network-touching command and displays the exact external hostname before the developer decides

**`permission.replied`** — fires after the developer grants or denies.

1. **Permission Outcome Memory** — stores every permission outcome in Anima with tool, path, granted/denied, timestamp, and project context
2. **Denial Pattern Analyzer** — when 3+ consecutive permissions are denied, fires "possible agent misalignment — consider clarifying the task"
3. **Approved Allowlist Builder** — at session end, presents repeated approvals as candidates for permanent allowlist config entries
4. **Denial Reason Capture** — when a permission is denied, opens a structured reason-tagging prompt; stores tagged reason in dev-brain
5. **Granted Timing Monitor** — tracks time-to-approve per permission type; sub-second approvals flagged as candidates for auto-approval
6. **Denial-to-Todo Conversion** — when a write permission is denied, creates a dev-brain todo: "manually review: agent wanted to edit [file]"
7. **Permission Replay Log** — maintains a full session permission log (asked + replied, with all args and outcome) in a session-scoped JSON file
8. **Dangerous Approval Undo Window** — after approving a destructive operation, shows a 30-second countdown to cancel
9. **Post-Denial Agent Redirect** — appends a structured denial context to the agent's next prompt: "your request to [tool] [path] was denied — adjust your approach"
10. **Approval Streak Detector** — when 10+ operations are approved in rapid succession, alerts "high-velocity approvals — are you reviewing each one?"

**`message.updated`** — fires when a conversation message is updated.

1. **Thinking Aloud Transcript** — extracts and logs all chain-of-thought blocks from assistant messages to a session-scoped transcript file
2. **Drift Detector** — monitors assistant messages for keyword overlap with the original task; below 20% overlap fires a drift warning
3. **Decision Point Extractor** — watches for architectural decision language and stores extracted decisions in dev-brain thought stream
4. **Error Mention Counter** — counts how many times the agent mentions the same error without a tool call between; at 3, fires "agent may be stuck"
5. **Skill Reference Detector** — when assistant messages describe a workflow matching a skill name, suggests explicit skill invocation
6. **Token Usage Warning** — tracks estimated token consumption; at 80% of context window, warns to manually pin critical state before compaction
7. **Code Block Extractor** — when an assistant message contains a code block with a filename annotation, saves it to a staging directory for review
8. **Human Message Clarification Detector** — logs questions the agent asks to dev-brain as `question` type thoughts
9. **Anima Memory Trigger on Insight** — watches for "I now realize", "the key insight is", "the root cause is" and auto-stores the insight in Anima with high phi
10. **Conversation Arc Visualizer** — maintains a live-updating timeline of the session (milestones, decisions, errors) as a readable markdown file

**`message.removed`** — fires when a message is removed.

1. **Removal Archaeologist** — logs full content of every removed message to a session-scoped archive
2. **Decision Rescue** — before a message is discarded, scans for decision language and fires an Anima memory store for any decisions found
3. **Code Block Rescue** — saves any code blocks in removed messages to a rescue archive with metadata
4. **Removal Pattern Tracker** — logs removal metadata (role, position, content type) to dev-brain; builds a picture of what kinds of content get pruned
5. **Session Compaction Prep Signal** — when 3+ messages are removed within 10 seconds, treats it as a compaction signal and pre-emptively saves state to Anima
6. **User Message Pruning Alert** — when a user (developer instruction) message is removed, fires a warning with option to re-inject
7. **Removal Count Threshold Alert** — at 10, 25, 50 messages removed, surfaces increasing warnings about context pressure
8. **Removed-but-Referenced Detector** — after removal, scans remaining conversation for references to the removed message's content; flags phantom references
9. **Thinking Block Prioritized Archive** — when a message containing a thinking block is removed, prioritizes archiving the thinking content first
10. **Compaction Memory Pre-load** — immediately before a message burst is removed, queries Anima for the most relevant memories and injects them to offset the context loss

**`todo.updated`** — fires when the todo list changes.

1. **Dev-Brain Sync Bridge** — mirrors every OpenCode todo change to dev-brain; creates unified todo state across all agent contexts
2. **Scope Guard Recalculator** — when a todo changes, re-infers the in-scope file set and updates the session scope enforcement fence
3. **Completion Ceremony** — when the final open todo transitions to done, fires a structured session-end prompt and suggests running the ending-session skill
4. **Blocked Todo Escalator** — when a todo is marked blocked, queries Anima and dev-brain for context on the blocker; surfaces what would unblock it
5. **Priority Drift Detector** — fires a warning when a lower-priority todo is completed while higher-priority ones remain open
6. **Complexity Estimator** — when a todo is created, estimates complexity (S/M/L/XL) and time; stores in dev-brain as notes
7. **Related Todo Grouper** — when a todo is created, finds semantically similar existing todos and suggests feature grouping
8. **ADR Trigger on Architecture Todos** — detects "choose", "decide", "evaluate", "compare" in todo titles; suggests creating an ADR before implementing
9. **Stale Todo Reaper** — alerts when todos have been open >14 days; forces a decision: action or cancel
10. **Progress Heatmap Recorder** — logs every todo status change to a jsonl file for velocity and focus pattern analysis over time

---

### FR-5: Execution Events

**`tool.execute.before`** — fires before any tool call; can modify args or block.

1. **Blast Radius Estimator** — before any edit, queries KotaDB for the dependency graph and fires a toast listing the top 5 impacted files
2. **Accidental .env Sentinel** — blocks reads of secrets-bearing files and logs the attempt to dev-brain with severity "error"
3. **Git State Snapshot Before Destructive Writes** — before writing to an existing file, runs `git diff HEAD -- <file>` and stashes the current diff to a recoverable snapshot
4. **Bash Command Risk Classifier** — before any bash call, runs the command through a risk pattern matcher; warning for medium risk, block for critical
5. **Workspace State Auto-Stamper** — before any git operation, updates dev-brain workspace state with current branch, status, and timestamp
6. **Redundant Read Suppressor** — when the same file has been read 3+ times without an intervening write, fires a drift warning toast
7. **MCP Tool Usage Auditor** — logs every MCP tool call to a session-scoped audit log; creates a complete, replay-capable record
8. **File Type Specialization Injector** — before editing a framework-specific file, re-injects the relevant rule as a quiet in-context reminder
9. **Parallel Task Conflict Detector** — before any write, checks dev-brain active threads for overlap on the same file; warns before proceeding
10. **Skill Suggestion Engine** — when a complex bash command is issued, fuzzy-matches its purpose against skill descriptions; suggests the relevant skill if matched

**`tool.execute.after`** — fires after any tool call with the result.

1. **Failed Bash Auto-Triage** — after a non-zero exit, pattern-matches stderr against known error categories and fires a structured toast with likely cause and fix
2. **Write Success → KotaDB Re-index Signal** — after any successful write or edit, queues the file for KotaDB re-indexing
3. **Session Diff Tracker** — maintains a running diff manifest of every file touched this session; serializes to Anima memory on session idle
4. **LSP Error Correlation** — after any edit, waits 2 seconds and checks the LSP diagnostics cache for newly-introduced errors
5. **Successful Test Run → Anima Memory Pin** — after a test runner exits with code 0, pins a checkpoint memory to Anima
6. **MCP Call Latency Monitor** — tracks round-trip latency for all MCP calls; when a service p95 exceeds 2 seconds, suggests restart
7. **Read → Annotation Injector** — after a file read, appends structured metadata: dependency count, last-modified symbol, open todos tagged to this file path
8. **Compiling Error → Structured ADR Prompt** — after a build failure at architectural seams, suggests creating an ADR capturing the structural decision
9. **Tool Usage Pattern Logger** — accumulates frequency map of all tool calls per session; stores in dev-brain at session end for meta-analysis
10. **Glob/Search Effectiveness Tracker** — after 3 consecutive empty search results, fires "are you searching the right directory or pattern?"

**`shell.env`** — fires during shell execution; can inject or modify environment variables.

1. **Project-Scoped Env Router** — reads `.env.local` from the project root and injects all key-value pairs into the shell environment without the agent ever reading the file
2. **Brain Infrastructure Availability Injector** — injects URLs of all brain-layer services as env vars into every shell execution
3. **Git Context Injector** — injects current branch, last commit hash, and repo name as env vars into every shell execution; cached per session
4. **Runtime Version Enforcer** — reads `package.json` engines or `.nvmrc`; modifies PATH to ensure the project-specified runtime version is active
5. **Session ID Propagator** — injects OpenCode session ID and conversation ID into every shell environment for downstream log correlation
6. **Test Environment Isolator** — when a command matches test runner patterns, injects test-specific env vars (NODE_ENV, test DB URL, silent logging)
7. **Turbo Cache Environment** — injects Turborepo team and token env vars from a secure local store for monorepo cache hits
8. **Locale/Timezone Normalizer** — injects TZ=UTC, LANG, and LC_ALL into every shell execution; prevents locale-dependent test failures
9. **Colorless CI Mode** — for commands whose output will be parsed, injects NO_COLOR, TERM=dumb, and CI=true to disable ANSI codes
10. **Danger Zone Env Blocker** — before any shell command, checks for production database URLs or live API key patterns in the environment; fires warning or blocks

**`lsp.client.diagnostics`** — fires when LSP reports errors, warnings, or info.

1. **Cascade Pre-classifier** — when >5 diagnostics share the same error code or symbol, fires "CASCADE DETECTED — fix structural root before touching individual errors"
2. **Root Cause Locator** — groups diagnostics by likely root cause file and surfaces the candidate with line number
3. **Anima Error Pattern Matcher** — queries Anima for previously-solved errors matching the same pattern; surfaces the solution if found
4. **Diagnostic Trend Tracker** — if error count trends upward across consecutive saves, fires "agent is chasing symptoms — consider reverting to last clean state"
5. **Zero-Error Ceremony** — when errors transition from >0 to 0, creates a git stash checkpoint and logs a milestone to dev-brain
6. **File Hotspot Identifier** — accumulates diagnostic data per file across the session; surfaces the top error-producing files as refactor candidates
7. **Warning-to-Error Predictor** — flags warnings that are known to become errors under strict mode or on TypeScript upgrade
8. **Test Gap Correlator** — when an error fires in a file with no test coverage, appends "dispatch @test-writer after fixing" to the diagnostic context
9. **Framework Mismatch Detector** — detects React/Vue patterns in SolidJS or other wrong-framework contexts; annotates with the correct pattern
10. **Diagnostic-Gated Commit Hook** — blocks git commit bash calls when the LSP error count is greater than zero

**`tui.prompt.append`** — fires before the user's prompt is sent; can append content.

1. **Active Context Injector** — appends git branch, open todos, last error state, and last write timestamp to every prompt
2. **Primitive Capability Reminder** — when the prompt matches a skill semantically, appends a reminder that the skill is available
3. **Prior Session Recall** — queries Anima for memories related to the prompt's topic; appends the top 2-3 as context
4. **Scope Assertion Injector** — re-states current scope constraints on every prompt to prevent drift in long sessions
5. **Anti-Patterns Recall** — appends known anti-patterns for currently-active files from Anima memory
6. **Multi-Thread Awareness Injector** — when another instance is active in the same project, appends a coordination note
7. **Decision Consistency Checker** — when the prompt describes an approach, queries ADRs for conflicts and appends relevant ones
8. **Emotional Tone Calibrator** — detects frustration signals and suggests loading the reframing-problems skill before executing
9. **Time Context Injector** — appends session duration, time since last write, and tool call count to every prompt
10. **Hypothesis Tracking Injector** — in debugging mode, maintains a "tried and failed" list and appends it to every prompt to prevent retrying failed approaches

**`experimental.session.compacting`** — fires before compaction; can inject context or replace the prompt.

1. **Dev-Brain State Extractor** — injects open todos, workspace notes, and recent ADRs into compaction context
2. **Anima Memory Consolidator** — queries top-5 Anima memories for the current project and injects them into the continuation prompt
3. **Anti-Pattern Manifest Injector** — extracts all failed approaches from session history and injects a "Don't Retry" manifest
4. **File Change Manifest Injector** — injects a complete list of modified/created/deleted files this session
5. **Decision Trail Injector** — injects settled ADRs to prevent re-litigating past decisions in the post-compaction session
6. **Scope Constraint Preserver** — makes scope constraints compaction-proof by explicitly re-injecting them
7. **Parallel Thread State Injector** — injects the current state of all active parallel agent instances
8. **LSP Error State Snapshot** — injects current error count, affected files, and last attempted fix into compaction context
9. **Skill and Primitive State Injector** — injects which skills were loaded and which subagents were queued in this session
10. **Custom Compaction Prompt by Task Type** — replaces the default compaction prompt entirely with a task-type-specific template (debugging / implementing / reviewing / designing)

---

## 4. Architecture Flow

### Plugin Load Sequence

```
OpenCode starts
  → Scans ~/.config/opencode/plugins/ (global)
  → Scans .opencode/plugins/ (project)
  → Loads each plugin module
  → Each plugin registers event handlers
  → All handlers available for the session lifetime
```

### Event Handler Flow

```
Lifecycle event fires (e.g. session.created)
  → All registered handlers for that event run in sequence
  → Each handler may:
      - Read event payload
      - Call SDK client (routes to executor MCP gateway)
      - Modify output (for before-hooks)
      - Throw to block (for before-hooks)
      - Fire toasts via tui.toast.show
      - Append to prompts via tui.prompt.append
      - Write to local files
  → Next handler runs
  → Event continues
```

### Brain Layer Access Pattern

```
Plugin handler runs
  → Needs to write to dev-brain
  → Calls client SDK method
  → SDK routes through executor at http://127.0.0.1:8000
  → Executor routes to dev-brain MCP at port 3097
  → Response returns through the chain
  → Handler uses the result
```

### Session Lifecycle with Plugins

```
session.created
  → Bootstrap Orchestrator fires: anima + dev-brain + todos injected
  → Tool Inventory fires: health check surfaced
  → Session state is warm before first message

[Active work]
  → tool.execute.before: risk checks, blast radius, scope enforcement
  → tool.execute.after: indexing, error correlation, pattern logging
  → tui.prompt.append: context, scope, memories, anti-patterns on every prompt
  → lsp.client.diagnostics: cascade detection, trend tracking, commit gate
  → permission.asked/replied: enrichment, audit, outcome memory
  → message.updated: drift detection, decision extraction, insight capture
  → todo.updated: dev-brain sync, scope recalculation, ceremony trigger
  → file.edited: credential scan, layer enforcement, blast radius, live index
  → session.idle: session close, background indexing, commit prompt, heartbeat

session.compacted (if needed)
  → experimental.session.compacting: anti-patterns, decisions, state injected
  → session.compacted: todo extraction, Anima store, workspace snapshot

session.diff fires
  → Security scan, alignment check, commit message draft, breaking change detection

session.idle (extended)
  → Landing sequence: anima_session_close, workspace state update, todo reconcile

session.deleted (if applicable)
  → Artifact extraction, ADR rescue, orphaned todo detection
```

---

## 5. Non-Functional Requirements

### Performance
- No plugin handler should block the primary event for more than 100ms. Handlers that require slow operations (KotaDB queries, Anima writes, subagent dispatch) must run asynchronously.
- Toast notifications must fire in under 200ms from event trigger.
- Background operations triggered from `session.idle` must not block subsequent user interaction.

### Reliability
- Plugin failure must never crash OpenCode. Every handler must be wrapped in a catch block. Errors in plugins are logged and swallowed — the collaboration loop continues.
- If a brain-layer service is unavailable, plugins that depend on it degrade gracefully — they do not error loudly or block the session.
- Plugins must be idempotent where possible. Writing to Anima twice with the same content is acceptable; creating duplicate dev-brain todos is not.

### Composability
- Plugins are modular. Each plugin addresses one concern. They can be enabled or disabled independently.
- Plugins share state only through the brain layer (dev-brain, Anima) or through local session-scoped files. No shared in-memory state between plugins unless via a documented session store pattern.
- Adding a new plugin must not require modifying existing plugins.

### Auditability
- All significant plugin actions should be logged. Secret values must never appear in any log.
- Permission outcomes, tool call patterns, and session lifecycle events must be inspectable after the fact.

---

## 6. Builder & User Flows

### Builder: Adding a New Plugin

1. Create a new `.ts` file in `~/.config/opencode/plugins/`
2. Export a plugin function that returns event handlers
3. Restart OpenCode (or wait for hot-reload if supported)
4. Plugin is active globally

### Builder: Implementing a Specific Idea from This Document

1. Find the idea in the relevant FR section
2. Identify which event type it belongs to
3. Create a plugin file named after the idea (e.g. `bootstrap-orchestrator.ts`)
4. Implement the single handler for that event
5. Test in a new session

### Builder: Prioritizing What to Implement First

The following ideas produce the highest leverage per unit of implementation effort:

**Tier 1 — Implement first (fixes fundamental gaps):**
- Bootstrap Orchestrator (`session.created`) — every session starts warm
- Active Context Injector (`tui.prompt.append`) — agent is never context-blind
- Anti-Pattern Manifest + Scope Constraint Preserver (`experimental.session.compacting`) — compaction stops being a memory wipe
- Cascade Pre-classifier (`lsp.client.diagnostics`) — enforces the debugging rule structurally

**Tier 2 — High value, implement next:**
- Session Close Orchestrator (`session.idle`) — sessions stop ending with context lost
- Credential Guardian (`file.edited`) — security rule made structural
- Blast Radius Estimator (`tool.execute.before`) — agents know their edit consequences
- Dev-Brain Sync Bridge (`todo.updated`) — unified todo state across contexts
- Prior Session Recall (`tui.prompt.append`) — institutional memory at every prompt

**Tier 3 — Quality of life improvements:**
- Everything else in this document, selected by personal priority

### User (Josh as Developer): Daily Experience

**Session start:** The session opens. Without any manual briefing, the agent knows: who it is (Anima identity), what's in flight (dev-brain todos), what changed since yesterday (morning brief), and what tools are available (tool inventory). The agent's first message can immediately reference the current work without being re-briefed.

**During work:** Every file edit is scanned for secrets and layer violations. Every bash command is risk-classified. Every MCP call is audited. The context window stays fresh because scope, anti-patterns, and memories are appended on every prompt. Errors cascade? The agent is told immediately. Tests uncovered? Flagged without asking.

**Session idle moments:** Background indexing runs. The todo list reconciles. Heartbeats fire. If the agent produced a significant decision, a second opinion may arrive before the developer acts on it.

**Session end:** Extended idle triggers the full close sequence automatically. Anima is written. Workspace state is updated. The handoff is complete without the developer doing anything.

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Cold session starts (no context injected) | Zero |
| Sessions ending without Anima close | Zero (via Landing plugin) |
| Secrets committed to git in a session | Zero (via Credential Guardian) |
| Agent re-tries already-failed approaches post-compaction | Zero (via Anti-Pattern Manifest) |
| Cascade errors fixed symptomatically without root cause | Zero (via Cascade Pre-classifier) |
| Commits with LSP errors | Zero (via Diagnostic-Gated Commit Hook) |
| Permission decisions made without blast radius context | Zero (for high-dependency files) |
| Architectural decisions lost at session end | Near zero (via Decision Capture + ADR Rescue) |
| Idle time without background housekeeping | Near zero |
| Agent scope drift caught before it compounds | As early as possible in the session |

---

## 8. Future Extensions

These are explicitly deferred but worth capturing:

**Plugin marketplace.** As the library grows, a structured way to discover, share, and version plugins across projects and developers.

**Plugin telemetry.** Aggregate data on which plugins fire most often, which produce the highest-value interventions, and which are never triggered. Drives pruning and improvement.

**Cross-plugin orchestration.** A coordination layer allowing plugins to signal each other without going through the brain layer. For sophisticated multi-plugin workflows.

**AI-assisted plugin generation.** A workflow where the developer describes the behavior they want ("notify me when scope drifts") and the system generates the plugin implementation.

**Plugin testing framework.** A way to test plugin behavior against recorded session events without running a full OpenCode session.

---

## 9. Scope Boundaries

### In Scope

- All plugin ideas catalogued in this document (FR-1 through FR-5)
- Implementation guidance organized by event type
- Prioritization tiers for selective implementation
- Integration with the four brain-layer services through executor
- Global plugin directory (`~/.config/opencode/plugins/`)
- Project-level plugin directory (`.opencode/plugins/`)

### Out of Scope

- The executor primitive gateway itself (see `prd-primitive-gateway.md`)
- The OpenCode harness configuration changes (see `prd-opencode-harness-cleanup.md`)
- Plugin implementation code or library choices — this PRD is intentionally stack-agnostic
- New brain-layer services beyond the four currently running
- Web UI or non-TUI interfaces for plugin configuration
- Multi-developer or team plugin registries
- Automated plugin deployment — manual file placement is sufficient

---

*The collaboration loop leaks context at every boundary. Plugins are the patches. Build them where they matter most first.*
