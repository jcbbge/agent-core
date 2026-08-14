/**
 * tower-auto — make Tower ambient in every pi session (WS-1, tower-auto program).
 *
 * Authority: briefs/tower-ergo/TOWER-AUTO-CONTRACT.md (section 8 is this
 * file's spec). Ledger grammar is a direct port of ~/.tower/lib.mjs — the
 * Claude Code stop-guard reads the same derivations, so these functions must
 * not drift.
 *
 * What it does (pi lifecycle only — no timers, no watchers, no polling):
 *   - before_agent_start: inject the Tower inbox for ctx.cwd (unrelayed
 *     deliverables/alerts verbatim, open questions, answers to questions this
 *     session asked). Silent-when-clear is a HARD rule: nothing to show =>
 *     inject nothing. Injection NEVER acks (contract R6) — only tower_relay
 *     acks, and only what it rendered in its own tool result.
 *   - tower_relay tool: render the inbox verbatim + append ONE ack row for
 *     the rendered deliverable/alert ids; answers to open questions ride the
 *     optional answers param (questions are never acked — they are answered).
 *   - tower_ask tool: append a kind:question row, set the pane's $q token
 *     to the real question text (BEFORE the emit — 40-tower-bridge's
 *     adopt-check matches on it, R2 amendment), emit herdr:blocked
 *     {active:true} (counter semantics — herdr-agent-state consumes it; the
 *     aliou pattern, no herdr import), track the id. When a later injection
 *     sees an answer with ref = tracked id, it includes the answer, emits
 *     {active:false}, clears $q, and untracks.
 *   - agent_settled: append kind:progress "done: <last user request>" so the
 *     ledger records what this pane finished (pi panes may never flip herdr
 *     `done` — this progress line IS pi's completion signal).
 *
 * Ownership (contract section 4): this extension writes ONLY entries derived
 * from pi lifecycle / user action (from: "pi:tower-auto" or the tower_ask
 * `from` param). Entries derived from herdr events are the plugin's job
 * (bin/handlers/40-tower-bridge, WS-2).
 *
 * Fire-and-forget everywhere: every append is appendFileSync on
 * ~/.tower/ledger.jsonl, every entry serializes to < 4,000 bytes (contract
 * section 1: POSIX O_APPEND is atomic under PIPE_BUF), and no handler ever
 * throws into pi's event loop.
 *
 * Works in any pi session with a cwd — Tower is the substrate, herdr only
 * consumes the blocked emit. Outside herdr panes (or in `pi -p` print mode,
 * where herdr-agent-state is not a root session) the emit is a harmless
 * no-op; the ledger read/write paths are identical everywhere.
 *
 * Known v1 limitation (contract section 8, accepted): a /reload or session
 * restart loses the in-memory tracked-question set — the ledger question
 * stays open (still surfaced as an open question by injection) but the
 * matching answer will not auto-emit herdr:blocked {active:false}; any stale
 * blocked count clears with the session.
 */

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "typebox";

// ---------------------------------------------------------------------------
// Ledger primitives — verbatim ports of ~/.tower/lib.mjs semantics.
// ---------------------------------------------------------------------------

const LEDGER = join(homedir(), ".tower", "ledger.jsonl");
const MAX_ENTRY_BYTES = 4000; // contract section 1: margin under PIPE_BUF (4096)

// Spine $q token (docs/spine-tokens.md) — the blocking-question token the
// sidebar, spine-inbox, and 40-tower-bridge all read. tower_ask sets it so
// the fleet sees the REAL question text (not the tool label "tower ask")
// and so the bridge's adopt-check can match byte-identically (R2 amendment).
const HERDR_PANE = process.env.HERDR_PANE_ID;
const SPINE_SOURCE = "custom:spine"; // same source id spine-report uses
const Q_TTL_MS = 3600000; // 1h — matches spine-report's TTL_Q

// Fire-and-forget `herdr pane report-metadata` for the $q token, awaited
// with a hard cap so tool execution cannot hang (herdr-task-report's
// detached-spawn pattern, plus a bounded wait for ordering). No-op outside
// herdr panes. Returns when the CLI exited or the cap elapsed.
function reportQ(value: string | null, capMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    if (process.env.HERDR_ENV !== "1" || !HERDR_PANE) return resolve();
    try {
      const args = ["pane", "report-metadata", HERDR_PANE, "--source", SPINE_SOURCE];
      if (value) args.push("--token", `q=${value}`, "--ttl-ms", String(Q_TTL_MS));
      else args.push("--clear-token", "q");
      const child = spawn("herdr", args, { stdio: "ignore" });
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
          /* ignore */
        }
        resolve();
      }, capMs);
      child.on("close", () => {
        clearTimeout(timer);
        resolve();
      });
      child.on("error", () => {
        clearTimeout(timer);
        resolve();
      });
    } catch {
      resolve(); // presence reporting must never break a turn
    }
  });
}

type Row = Record<string, any>;

const normCwd = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

const newId = (): string =>
  `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const isoNow = (): string => new Date().toISOString();

function readAll(file: string): Row[] {
  try {
    if (!existsSync(file)) return [];
    return readFileSync(file, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null; // unparseable lines are skipped silently (lib.mjs)
        }
      })
      .filter(Boolean) as Row[];
  } catch {
    return [];
  }
}

// inboxState(cwd) — exact port of lib.mjs (contract section 3). Scope is by
// realpath(cwd) so /tmp vs /private/tmp style aliases collapse.
function inboxState(cwd: string) {
  const scope = cwd ? normCwd(cwd) : null;
  const rows = readAll(LEDGER).filter(
    (r) => !scope || normCwd(String(r.cwd ?? "")) === scope,
  );
  const acked = new Set(rows.filter((r) => r.kind === "ack").flatMap((r) => r.ids ?? []));
  const answeredIds = new Set(rows.filter((r) => r.kind === "answer").map((r) => r.ref));
  const answers = rows.filter((r) => r.kind === "answer");
  const unrelayed = rows.filter(
    (r) => (r.kind === "deliverable" || r.kind === "alert") && !acked.has(r.id),
  );
  const openQuestions = rows.filter((r) => r.kind === "question" && !answeredIds.has(r.id));
  const progress = rows.filter((r) => r.kind === "progress");
  return { unrelayed, openQuestions, answers, progress, all: rows };
}

// renderMessage — exact port of lib.mjs. The verbatim relay frame.
function renderMessage(m: Row): string {
  const head = `Tower ${m.id} · ${m.kind}${m.title ? ` · ${m.title}` : ""} · from ${m.from ?? "unknown"} · ${m.ts}`;
  const opts = m.options?.length ? `\noptions: ${m.options.join(" | ")}` : "";
  return `${head}\n${m.message}${opts}`;
}

// Serialize + append one entry, guaranteed < MAX_ENTRY_BYTES. `message` is
// the only elastic field — truncate it (byte-safe) to fit; never exceed.
function appendLedger(entry: Row): void {
  let line = JSON.stringify(entry);
  if (Buffer.byteLength(line) >= MAX_ENTRY_BYTES && typeof entry.message === "string") {
    const fixed = Buffer.byteLength(JSON.stringify({ ...entry, message: "" }));
    const budget = Math.max(0, MAX_ENTRY_BYTES - fixed - 16);
    const truncated = Buffer.from(entry.message, "utf8").subarray(0, budget).toString("utf8");
    line = JSON.stringify({ ...entry, message: `${truncated}…` });
  }
  appendFileSync(LEDGER, `${line}\n`);
}

// ---------------------------------------------------------------------------
// Session state (module scope — dies with the pi process; see v1 limitation).
// ---------------------------------------------------------------------------

const trackedQuestions = new Set<string>(); // tower_ask ids awaiting answers
let lastRequest = ""; // most recent real user request (for the done: line)

const cwdOf = (ctx: any): string => ctx?.cwd ?? process.cwd();

export default function (pi: any) {
  // Emit onto the herdr:blocked bus (aliou pattern — no herdr import).
  // herdr-agent-state applies counter semantics (inc on active, dec on
  // inactive); with no listener — outside herdr panes or in print mode —
  // this is a harmless no-op.
  const emitBlocked = (active: boolean, label?: string): void => {
    try {
      pi.events?.emit?.(
        "herdr:blocked",
        active
          ? { active: true, label: (label ?? "Tower question").slice(0, 80) }
          : { active: false },
      );
    } catch {
      /* never let presence reporting break a turn */
    }
  };

  // -------------------------------------------------------------------------
  // before_agent_start — ambient inbox injection (contract section 8).
  // Fires in print mode too (`pi -p`) — that is load-bearing, do not gate
  // this on ctx.hasUI.
  // -------------------------------------------------------------------------
  pi.on("before_agent_start", async (_event: any, ctx: any) => {
    try {
      const state = inboxState(cwdOf(ctx));

      // Answers to questions THIS session opened via tower_ask.
      const answeredTracked = state.answers.filter((a) => trackedQuestions.has(a.ref));

      // Silent-when-clear is a HARD rule: no unrelayed, no open questions,
      // and no answers to my tracked questions => inject NOTHING.
      if (
        state.unrelayed.length + state.openQuestions.length === 0 &&
        answeredTracked.length === 0
      ) {
        return;
      }

      // A tracked question with an answer unblocks this pane: emit the
      // decrement exactly once per question, clear the $q token, untrack.
      for (const a of answeredTracked) {
        trackedQuestions.delete(a.ref);
        emitBlocked(false);
        void reportQ(null);
      }

      const sections: string[] = [
        `[Tower] ${state.unrelayed.length} unrelayed, ${state.openQuestions.length} open questions.`,
      ];
      for (const m of state.unrelayed) sections.push(renderMessage(m));
      for (const q of state.openQuestions) sections.push(renderMessage(q));
      for (const a of answeredTracked) sections.push(`Tower answer to ${a.ref}: ${a.message}`);
      sections.push(
        "Call tower_relay to render+ack deliverables/alerts in one call. " +
          "Surface questions verbatim to the user; answers via tower_relay's answers param.",
      );

      return {
        message: {
          customType: "tower-inbox",
          content: sections.join("\n\n"),
          display: true,
        },
      };
    } catch {
      return; // never throw into pi's event loop
    }
  });

  // -------------------------------------------------------------------------
  // message_start — track the last real user request (herdr-task-report
  // pattern: user role, text content only; synthetic/injected turns skipped).
  // -------------------------------------------------------------------------
  pi.on("message_start", async (event: any) => {
    try {
      const msg = event?.message;
      if (msg?.role !== "user") return;
      const content = msg.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .filter((p: any) => p?.type === "text" && typeof p.text === "string")
                .map((p: any) => p.text)
                .join(" ")
            : "";
      if (!text.trim()) return; // injected/synthetic turns are not requests
      lastRequest = text.replace(/\s+/g, " ").trim();
    } catch {
      /* ignore */
    }
  });

  // -------------------------------------------------------------------------
  // agent_settled — pi's completion signal (contract section 8): one
  // kind:progress row, from "pi:tower-auto", "done: <last user request>".
  // agent_settled (not agent_end) so auto-retry/compaction cannot double-post.
  // Ambient, no teeth — the stop-guard never blocks on progress rows.
  // -------------------------------------------------------------------------
  pi.on("agent_settled", async (_event: any, ctx: any) => {
    try {
      if (!lastRequest) return; // no real user request this session
      appendLedger({
        id: newId(),
        ts: isoNow(),
        cwd: cwdOf(ctx),
        kind: "progress",
        from: "pi:tower-auto",
        message: `done: ${lastRequest.slice(0, 114)}`, // "done: " + 114 <= 120
      });
    } catch {
      /* fire-and-forget */
    }
  });

  // -------------------------------------------------------------------------
  // tower_relay — render the inbox verbatim and ack it in ONE call (contract
  // section 8 + R6: the tool result IS the rendering; acking exactly what was
  // rendered is the verbatim guarantee, atomically). Questions are NEVER
  // acked — they are answered via the answers param.
  // -------------------------------------------------------------------------
  pi.registerTool({
    name: "tower_relay",
    label: "Tower Relay",
    description:
      "Render the Tower inbox verbatim and acknowledge it in ONE call. Returns every unrelayed deliverable/alert in full plus every open question (id, from, message), then appends exactly one ledger ack covering the rendered deliverable/alert ids. Questions are never acked — answer one by passing {question_id, answer} in the answers param. Call this whenever a [Tower] inbox injection appears or the user asks what Tower is holding.",
    promptSnippet: "Render and ack the Tower inbox in one call",
    promptGuidelines: [
      "Use tower_relay when a [Tower] inbox injection is present or the user asks about Tower traffic; it renders verbatim and acks in one call.",
      "Never answer Tower questions silently — pass the user's answer through tower_relay's answers param so the ledger records it.",
    ],
    parameters: Type.Object({
      answers: Type.Optional(
        Type.Array(
          Type.Object({
            question_id: Type.String({ description: "id of the open Tower question being answered" }),
            answer: Type.String({ description: "the user's answer text, verbatim" }),
          }),
        ),
      ),
    }),
    async execute(_toolCallId: string, params: any, _signal: any, _onUpdate: any, ctx: any) {
      try {
        const cwd = cwdOf(ctx);
        const state = inboxState(cwd);
        const parts: string[] = [];

        if (state.unrelayed.length === 0 && state.openQuestions.length === 0) {
          parts.push("Tower inbox is clear — nothing unrelayed, no open questions.");
        } else {
          for (const m of state.unrelayed) parts.push(renderMessage(m));
          for (const q of state.openQuestions) parts.push(renderMessage(q));
        }

        // ONE ack row covering exactly the deliverable/alert ids rendered
        // above (skip when none). Questions are never in this list.
        if (state.unrelayed.length > 0) {
          appendLedger({
            id: newId(),
            ts: isoNow(),
            cwd,
            kind: "ack",
            ids: state.unrelayed.map((m) => m.id),
          });
        }

        // Answers ride the same call so question + answer land atomically.
        const answers = Array.isArray(params?.answers) ? params.answers : [];
        const recorded: string[] = [];
        for (const a of answers) {
          if (!a?.question_id || typeof a?.answer !== "string" || !a.answer.trim()) continue;
          appendLedger({
            id: newId(),
            ts: isoNow(),
            cwd,
            kind: "answer",
            ref: String(a.question_id),
            message: a.answer,
            from: "pi:tower-auto",
          });
          recorded.push(String(a.question_id));
        }
        if (recorded.length > 0) parts.push(`Recorded answers for: ${recorded.join(", ")}`);

        return {
          content: [{ type: "text", text: parts.join("\n\n") }],
          details: {
            acked: state.unrelayed.map((m) => m.id),
            openQuestions: state.openQuestions.map((q) => q.id),
            answered: recorded,
          },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `tower_relay failed (non-fatal): ${String(err)}` }],
          details: { error: String(err) },
        };
      }
    },
  });

  // -------------------------------------------------------------------------
  // tower_ask — ask the user through the ledger + flip this pane blocked
  // fleet-wide (contract section 8). The answer arrives in a later [Tower]
  // inbox injection, which also emits the unblocking decrement.
  // -------------------------------------------------------------------------
  pi.registerTool({
    name: "tower_ask",
    label: "Tower Ask",
    description:
      "Ask the user a blocking question through the Tower ledger. Appends a kind:question row, marks this pane blocked fleet-wide (herdr), and tracks the question id. When the answer lands in the ledger, a later [Tower] inbox injection surfaces it and the pane unblocks. Returns the question id. Use when you need a human decision before you can proceed.",
    promptSnippet: "Ask the user a blocking question via the Tower ledger",
    promptGuidelines: [
      "Use tower_ask when you are blocked on a human decision; it pages the user through the Tower ledger and marks the pane blocked until answered.",
    ],
    parameters: Type.Object({
      question: Type.String({ description: "the question text, shown to the user verbatim" }),
      options: Type.Optional(
        Type.Array(Type.String(), { description: "optional short choices, rendered as a | b | c" }),
      ),
      from: Type.Optional(
        Type.String({ description: "caller role recorded on the row; defaults to pi:tower-auto" }),
      ),
    }),
    async execute(_toolCallId: string, params: any, _signal: any, _onUpdate: any, ctx: any) {
      try {
        const question = String(params?.question ?? "").trim();
        if (!question) {
          return {
            content: [{ type: "text", text: "tower_ask requires a non-empty question." }],
            details: { error: "empty question" },
          };
        }
        const row: Row = {
          id: newId(),
          ts: isoNow(),
          cwd: cwdOf(ctx),
          kind: "question",
          from:
            typeof params?.from === "string" && params.from.trim()
              ? params.from.trim()
              : "pi:tower-auto",
          message: question,
        };
        if (Array.isArray(params?.options) && params.options.length > 0) {
          row.options = params.options.map(String);
        }
        appendLedger(row);
        trackedQuestions.add(row.id);
        // ORDER MATTERS (R2 amendment): set the pane's $q token to the real
        // question text BEFORE emitting herdr:blocked. The emit induces a
        // pane.agent_status_changed -> blocked event, and 40-tower-bridge's
        // adopt-check matches THIS ledger row by the $q text — if the token
        // lands late, the bridge falls back to the $task label and would
        // double-post. Await the bounded report, then emit.
        await reportQ(question);
        emitBlocked(true, question);
        return {
          content: [
            {
              type: "text",
              text: `Tower question ${row.id} posted; this pane is now blocked pending the user's answer. It will arrive in a later [Tower] inbox injection.`,
            },
          ],
          details: { question_id: row.id },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `tower_ask failed (non-fatal): ${String(err)}` }],
          details: { error: String(err) },
        };
      }
    },
  });
}
