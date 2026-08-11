import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * tower-lifecycle — pi port of the CC tower hook trio (~/.tower/hooks/):
 *
 *   flight-recorder  → session_before_compact + session_shutdown
 *   stop-verdict     → agent_end (sets herdr pane $verdict token)
 *   deposit-reminder → tool_result on bash `git commit`
 *
 * Deliberate deviations from the CC originals:
 *  - flight-recorder's "harvest-before-evict" block (POST to SurrealDB
 *    :6000 / alembic) is NOT ported — substrate retired 2026-08-02.
 *  - deposit-reminder points at the Tower board, not mcp__alembic__*.
 *
 * Discipline: never throw into the harness. Every handler is best-effort.
 */

// ── ledger primitives (verbatim port of ~/.tower/lib.mjs semantics) ──────────

const TOWER = join(homedir(), ".tower");
const LEDGER = join(TOWER, "ledger.jsonl");
const FLIGHT = join(TOWER, "flight");

const normCwd = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

function readAll(file: string): any[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function inboxState(cwd: string) {
  const scope = normCwd(cwd);
  const rows = readAll(LEDGER).filter((r) => normCwd(r.cwd ?? "") === scope);
  const acked = new Set(rows.filter((r) => r.kind === "ack").flatMap((r) => r.ids ?? []));
  const answeredIds = new Set(rows.filter((r) => r.kind === "answer").map((r) => r.ref));
  const unrelayed = rows.filter(
    (r) => (r.kind === "deliverable" || r.kind === "alert") && !acked.has(r.id),
  );
  const openQuestions = rows.filter((r) => r.kind === "question" && !answeredIds.has(r.id));
  return { unrelayed, openQuestions };
}

// ── flight recorder ──────────────────────────────────────────────────────────

function snapshot(reason: string, ctx: any) {
  try {
    const cwd = ctx.cwd ?? process.cwd();
    const ts = new Date().toISOString();
    const session8 = String(ctx.sessionManager?.getSessionId?.() ?? "unknown").slice(0, 8);

    const git = (cmd: string): string => {
      try {
        return execSync(`git ${cmd}`, { cwd, stdio: ["ignore", "pipe", "ignore"] })
          .toString()
          .trim();
      } catch {
        return "(not a git repo)";
      }
    };

    const { unrelayed, openQuestions } = inboxState(cwd);

    const body = `# Flight snapshot — ${reason}

ts: ${ts}
session: ${ctx.sessionManager?.getSessionId?.() ?? "unknown"}
cwd: ${cwd}
branch: ${git("branch --show-current")}

## Working tree (uncommitted = open work)
${git("status --short") || "(clean)"}

## Diff shape
${git("diff --stat | tail -15") || "(no diff)"}

## Last 3 commits
${git("log --oneline -3")}

## Tower pending
unrelayed: ${unrelayed.length} · open questions: ${openQuestions.length}
${unrelayed.map((m) => `! ${m.id} ${m.kind} from ${m.from ?? "?"}: ${String(m.message).slice(0, 80)}`).join("\n")}
${openQuestions.map((q) => `? ${q.id} from ${q.from ?? "?"}: ${String(q.message).slice(0, 80)}`).join("\n")}
`;

    mkdirSync(FLIGHT, { recursive: true });
    writeFileSync(join(FLIGHT, `${ts.slice(0, 10)}-${reason}-${session8}.md`), body);
  } catch {
    // a recorder never blocks the flight
  }
}

// ── stop-verdict ─────────────────────────────────────────────────────────────

const MAX = 200;
const TTL_MS = "86400000";

function resolveHerdr(): string {
  const candidates = [
    process.env.HERDR_BIN,
    join(homedir(), ".local", "bin", "herdr"),
    "/opt/homebrew/bin/herdr",
    "/usr/local/bin/herdr",
  ];
  for (const c of candidates) {
    try {
      if (c && existsSync(c)) return c;
    } catch {
      // next
    }
  }
  return "herdr";
}

function shorten(s: string): string | null {
  s = String(s)
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;
  if (s.length <= MAX) return s;
  const cut = s.slice(0, MAX);
  const sp = cut.lastIndexOf(" ");
  return (sp > MAX * 0.6 ? cut.slice(0, sp) : cut) + "…";
}

function lastAssistantText(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "assistant") continue;
    const content = m.content;
    if (typeof content === "string" && content.trim()) return content;
    if (Array.isArray(content)) {
      for (let j = content.length - 1; j >= 0; j--) {
        const b = content[j];
        if (b?.type === "text" && typeof b.text === "string" && b.text.trim()) return b.text;
      }
    }
  }
  return null;
}

// ── extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.on("session_before_compact", async (_event, ctx) => {
    snapshot("before-compact", ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    snapshot("session-end", ctx);
  });

  pi.on("agent_end", async (event, _ctx) => {
    try {
      if (process.env.HERDR_ENV !== "1") return;
      const pane = process.env.HERDR_PANE_ID;
      if (!pane) return;
      const sock = process.env.HERDR_SOCKET_PATH;
      if (!sock || !existsSync(sock)) return;

      const text = shorten(lastAssistantText((event as any).messages ?? []) ?? "");
      if (!text) return;

      spawnSync(
        resolveHerdr(),
        [
          "pane",
          "report-metadata",
          pane,
          "--source",
          "custom:spine",
          "--token",
          `verdict=${text}`,
          "--ttl-ms",
          TTL_MS,
          "--clear-token",
          "task",
        ],
        { stdio: "ignore", timeout: 5000, env: process.env },
      );
    } catch {
      // never throw into the harness
    }
  });

  pi.on("tool_result", async (event, _ctx) => {
    try {
      if (event.toolName !== "bash") return undefined;
      const cmd = String((event.input as any)?.command ?? "");
      if (!/git commit/.test(cmd) || /--amend/.test(cmd)) return undefined;
      const note =
        "[Tower] Commit detected — if this commit carries a decision, a verified fact, or a hard-won lesson the fleet needs, post it to the Tower board NOW (~/.tower/board.jsonl). Deposit-at-the-moment, not at session end.";
      if (Array.isArray((event as any).content)) {
        return { content: [...(event as any).content, { type: "text", text: note }] };
      }
    } catch {
      // never brick the harness
    }
    return undefined;
  });
}
