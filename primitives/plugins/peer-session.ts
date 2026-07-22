/**
 * peer-session — pi extension
 *
 * Multi-agent dialectic. Main thread dispatches to an isolated peer agent.
 * Agents communicate through files. You direct, they think.
 *
 * Commands:
 *   /peer [model]  — main agent writes dispatch, peer session opens
 *   /send          — confirm dispatch and enter peer conversation
 *   /return        — peer writes response, you land back in main thread
 *   /close         — end peer session, save context
 *
 * Files:
 *   ~/.pi/peer-inbox/dispatch.md     — main → peer
 *   ~/.pi/peer-inbox/response.md     — peer → main
 *   ~/.pi/peer-sessions/[model].md   — peer's accumulated context
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ─── paths ───────────────────────────────────────────────────────────────────

const INBOX_DIR = path.join(os.homedir(), ".pi", "peer-inbox");
const SESSIONS_DIR = path.join(os.homedir(), ".pi", "peer-sessions");
const SUBAGENT_MCP_URL = "http://127.0.0.1:3096/";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/v1/responses";
const AUTH_FILE = path.join(os.homedir(), ".pi", "agent", "auth.json");

// ─── model registry ──────────────────────────────────────────────────────────

type Provider = "anthropic" | "perplexity";

const PEER_MODELS: Record<string, { provider: Provider; model: string; label: string }> = {
  // Anthropic Messages API (default) — routed through the key in pi's auth.json
  opus: { provider: "anthropic", model: "claude-opus-4-8", label: "Claude Opus 4.8" },
  // alias so existing /peer claude invocations and peer-sessions/claude.md keep working
  claude: { provider: "anthropic", model: "claude-opus-4-8", label: "Claude Opus 4.8" },
  sonnet: { provider: "anthropic", model: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  // Perplexity Responses API — needs PERPLEXITY_API_KEY (credits expired as of 2026-06-29)
  grok: { provider: "perplexity", model: "xai/grok-4.20-reasoning", label: "Grok 4.20 Reasoning" },
  gemini: { provider: "perplexity", model: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
};

// ─── runtime state ───────────────────────────────────────────────────────────

interface PeerState {
  active: boolean;
  modelKey: string;
  provider: Provider;
  modelId: string;
  modelLabel: string;
  sessionName: string;
  piSessionId: string; // pi session that owns this peer (isolates concurrent harness instances)
  // Local conversation history for true threading
  history: Array<{ role: "user" | "assistant"; content: string }>;
  pendingDispatch: string | null; // dispatch written but not yet sent
}

let peer: PeerState | null = null;

// ─── helpers ─────────────────────────────────────────────────────────────────

// Anything carrying a pi session manager — commands, input, and session_start
// all receive a context with this shape.
type SessionCtx = { sessionManager: { getSessionId(): string } };

function piSessionId(ctx: SessionCtx): string {
  return ctx.sessionManager.getSessionId() || "default";
}

// Inbox files are scoped per pi session so concurrent harness instances never
// clobber each other's dispatch/response handoff files.
function inboxFor(ctx: SessionCtx): { dir: string; dispatch: string; response: string } {
  const dir = path.join(INBOX_DIR, piSessionId(ctx));
  fs.mkdirSync(dir, { recursive: true });
  return {
    dir,
    dispatch: path.join(dir, "dispatch.md"),
    response: path.join(dir, "response.md"),
  };
}

// Subtle command reference appended to peer output so the menu is always at hand.
// Model list is derived from the registry so it can't drift out of sync.
function commandHint(): string {
  const models = Object.keys(PEER_MODELS).join(" | ");
  return (
    "\n\n───\n" +
    `*peer commands — \`/send\` open · \`/rejoin\` re-enter · \`/return\` → main · ` +
    `\`/close\` end · \`/peer [${models}]\` switch model*`
  );
}

function ensureDirs() {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function contextFile(modelKey: string): string {
  return path.join(SESSIONS_DIR, `${modelKey}.md`);
}

function readContext(modelKey: string): string {
  const f = contextFile(modelKey);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : "";
}

function appendContext(modelKey: string, dispatch: string, response: string) {
  const f = contextFile(modelKey);
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  const entry = `\n---\n## ${ts}\n\n### Dispatch\n${dispatch}\n\n### Response\n${response}\n`;
  fs.appendFileSync(f, entry, "utf-8");
}

function loadSystemPrompt(modelKey: string): string {
  const subagentFile = path.join(
    os.homedir(),
    "Documents",
    "_agents",
    "schema",
    "subagents",
    `peer-${modelKey}.md`,
  );
  if (!fs.existsSync(subagentFile)) return defaultSystemPrompt(modelKey);

  const raw = fs.readFileSync(subagentFile, "utf-8");
  // Strip YAML frontmatter
  const match = /^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/.exec(raw);
  return match ? match[1].trim() : raw.trim();
}

function defaultSystemPrompt(modelKey: string): string {
  return `You are a peer collaborator — a thinking heavyweight engaging with Josh (a developer) and a Claude agent. Equal footing, mutual respect, constructive friction. You receive dispatches mid-conversation and bring an independent perspective. You don't mirror their framing. You notice what they can't see because you haven't been in the room.

Skills and commands library available at:
- ~/Documents/_agents/schema/skills/
- ~/Documents/_agents/schema/commands/

When asked to apply lenses, browse and choose autonomously.`;
}

// ─── Anthropic API key (from pi's auth.json, env fallback) ─────────────────────

function getAnthropicKey(): string {
  // Prefer the key pi already manages in auth.json; fall back to the env var.
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8")) as any;
      const key = auth?.anthropic?.key;
      if (typeof key === "string" && key.trim()) return key.trim();
    }
  } catch {
    /* fall through to env */
  }
  return process.env.ANTHROPIC_API_KEY || "";
}

// ─── dispatcher — route to the active provider ─────────────────────────────────

async function callPeer(
  provider: Provider,
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  return provider === "perplexity"
    ? callPerplexity(modelId, systemPrompt, history, newMessage)
    : callAnthropic(modelId, systemPrompt, history, newMessage);
}

// ─── Anthropic Messages API with conversation history ──────────────────────────
//
// Streams (SSE) so max-effort Opus responses can't hit a request timeout, then
// returns the fully-accumulated text. Adaptive thinking at effort "max" gives the
// peer the deepest reasoning Opus 4.8 supports; thinking blocks are reasoned over
// server-side but not surfaced here — we accumulate only the final text.

async function callAnthropic(
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    throw new Error(
      "No Anthropic API key. Set ANTHROPIC_API_KEY or configure ~/.pi/agent/auth.json (anthropic.key).",
    );
  }

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: newMessage },
  ];

  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: 32000,
    stream: true,
    system: systemPrompt,
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "max" },
    messages,
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }

  // Parse the SSE stream, accumulating final-answer text_delta chunks.
  let text = "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let evt: any;
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
        text += evt.delta.text as string;
      } else if (evt.type === "error") {
        throw new Error(`Anthropic stream error: ${JSON.stringify(evt.error)}`);
      }
    }
  }

  if (!text.trim()) throw new Error("No text output from peer model");
  return text;
}

// ─── Perplexity Responses API with conversation history ────────────────────────
//
// Dormant unless a /peer grok|gemini session is opened. Needs PERPLEXITY_API_KEY.

async function callPerplexity(
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY || "";
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  // Build input array with full conversation history
  const inputItems: Array<{ role: string; content: string }> = [];

  for (const msg of history) {
    inputItems.push({ role: msg.role, content: msg.content });
  }
  inputItems.push({ role: "user", content: newMessage });

  const body: Record<string, unknown> = {
    model: modelId,
    input: inputItems.length === 1 ? newMessage : inputItems,
    instructions: systemPrompt,
    max_output_tokens: 4000,
  };

  const res = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${err}`);
  }

  const data = (await res.json()) as any;

  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && item.content) {
        for (const c of item.content) {
          if (c.type === "output_text" && c.text) return c.text as string;
        }
      }
    }
  }

  // Fallback for simpler response shapes
  if (data.output_text) return data.output_text as string;

  throw new Error("No text output from peer model");
}

// ─── subagent-mcp helpers (for dispatch generation via main agent) ─────────────

async function mcpCall(toolName: string, args: Record<string, unknown>): Promise<string> {
  const res = await fetch(SUBAGENT_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: args },
      id: crypto.randomUUID(),
    }),
  });

  if (!res.ok) throw new Error(`subagent-mcp ${toolName}: ${res.status}`);

  const text = await res.text();
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.result?.content) {
          return parsed.result.content.map((c: any) => c.text || "").join("\n");
        }
      } catch {
        /* skip */
      }
    }
  }
  throw new Error(`No result from subagent-mcp ${toolName}`);
}

// ─── extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  ensureDirs();

  // ── status indicator ──────────────────────────────────────────────────────
  function updateStatus(ctx?: { ui: { setStatus: (key: string, value: string | undefined) => void } }) {
    // setStatus is on ctx.ui, not pi directly
    // We store a reference from the most recent ctx
    if (lastCtx) {
      if (peer?.active) {
        lastCtx.ui.setStatus("peer-session", `◈ peer:${peer.modelLabel} [${Math.floor(peer.history.length / 2)} turns]`);
      } else {
        lastCtx.ui.setStatus("peer-session", undefined);
      }
    }
  }

  // Keep a reference to the most recent ctx for status updates
  let lastCtx: any = null;

  // Re-enter a paused peer conversation without re-dispatching. The peer keeps
  // its full in-memory history, so the next message just continues the thread.
  // Returns true if it resumed, false if there was nothing to resume.
  function resumePeer(ctx: any): boolean {
    if (!peer || peer.active || peer.history.length === 0) return false;
    peer.active = true;
    lastCtx = ctx;
    updateStatus();
    ctx.ui.notify(
      `Back in peer session with ${peer.modelLabel} — continue conversing. Type /return to go back to main.`,
      "info",
    );
    return true;
  }

  // ── /peer [model] ─────────────────────────────────────────────────────────
  pi.registerCommand("peer", {
    description:
      "Open a peer session with an isolated agent. Usage: /peer opus | /peer sonnet | /peer grok | /peer gemini",
    handler: async (args, ctx) => {
      const modelKey = (args?.trim() || "opus").toLowerCase();
      const modelDef = PEER_MODELS[modelKey];

      if (!modelDef) {
        ctx.ui.notify(
          `Unknown model '${modelKey}'. Available: ${Object.keys(PEER_MODELS).join(", ")}`,
          "error",
        );
        return;
      }

      // If already in a peer session with the same model, just notify
      if (peer?.active && peer.modelKey === modelKey) {
        ctx.ui.notify(
          `Already in peer session with ${peer.modelLabel}. Type /return to go back to main.`,
          "info",
        );
        return;
      }

      // If switching models mid-session, close current first
      if (peer?.active && peer.modelKey !== modelKey) {
        ctx.ui.notify(
          `Closing current peer session (${peer.modelLabel}) and opening ${modelDef.label}...`,
          "info",
        );
        peer = null;
      }

      const box = inboxFor(ctx);

      ctx.ui.notify(`Preparing dispatch for ${modelDef.label}...`, "info");

      // Ask main agent to write the dispatch
      // We do this by injecting a message into the current session
      pi.sendMessage(
        {
          customType: "peer-session",
          content: `[PEER SESSION] Please write a dispatch for the peer agent.

Summarize our current conversation — the problem space, the shape of our thinking so far, and a clear ask for what we need from an independent perspective. Be specific about what we're wrestling with and what would be most valuable for a fresh mind to engage with.

Write it to this file: ${box.dispatch}

Format:
---
## What we're working on
[problem/idea/system being discussed]

## Where our thinking is
[current shape, key insights, open questions, directions explored]

## What we need from you
[specific ask — what would be most valuable from an independent perspective]
---

After writing the file, confirm with: "Dispatch written. Review it and type /send to open the peer session, or add context first."`,
          display: true,
        },
        { triggerTurn: true, deliverAs: "followUp" },
      );

      // Store pending state
      lastCtx = ctx;
      peer = {
        active: false,
        modelKey,
        provider: modelDef.provider,
        modelId: modelDef.model,
        modelLabel: modelDef.label,
        sessionName: `peer-${modelKey}-${Date.now()}`,
        piSessionId: piSessionId(ctx),
        history: [],
        pendingDispatch: null,
      };

      updateStatus();
    },
  });

  // ── /send ─────────────────────────────────────────────────────────────────
  pi.registerCommand("send", {
    description: "Open the peer conversation (or resume it if already underway)",
    handler: async (args, ctx) => {
      if (!peer) {
        ctx.ui.notify("No peer session pending. Use /peer [model] first.", "error");
        return;
      }

      if (peer.active) {
        ctx.ui.notify(
          `Already in active peer session with ${peer.modelLabel}. Type /return to go back to main first.`,
          "info",
        );
        return;
      }

      // Conversation already underway → resume it instead of re-dispatching.
      if (resumePeer(ctx)) return;

      // Read the session-scoped dispatch file
      const box = inboxFor(ctx);
      if (!fs.existsSync(box.dispatch)) {
        ctx.ui.notify(
          "Dispatch file not found. The main agent may still be writing it. Wait a moment and try again.",
          "error",
        );
        return;
      }

      const dispatch = fs.readFileSync(box.dispatch, "utf-8").trim();
      if (!dispatch) {
        ctx.ui.notify("Dispatch file is empty.", "error");
        return;
      }

      peer.pendingDispatch = dispatch;
      peer.active = true;

      // Load prior context if exists
      const priorContext = readContext(peer.modelKey);
      const systemPrompt = loadSystemPrompt(peer.modelKey);

      // Build opening message for peer
      const openingMessage = priorContext
        ? `You have prior context from our previous correspondence:\n\n${priorContext}\n\n---\n\nNew dispatch:\n\n${dispatch}`
        : `Here is the dispatch:\n\n${dispatch}`;

      lastCtx = ctx;
      ctx.ui.notify(`Opening peer session with ${peer.modelLabel}...`, "info");

      try {
        // First peer response to the dispatch
        const response = await callPeer(
          peer.provider,
          peer.modelId,
          systemPrompt,
          peer.history,
          openingMessage,
        );

        // Add to history
        peer.history.push({ role: "user", content: openingMessage });
        peer.history.push({ role: "assistant", content: response });

        updateStatus(ctx);

        // Inject peer response into the session as a visible message
        pi.sendMessage(
          {
            customType: "peer-response",
            content: `◈ ${peer.modelLabel}\n\n${response}\n\n*(you're now in a peer session — your messages go to ${peer.modelLabel})*${commandHint()}`,
            display: true,
          },
          { triggerTurn: false },
        );
      } catch (e) {
        peer.active = false;
        ctx.ui.notify(`Peer session failed: ${(e as Error).message}`, "error");
      }
    },
  });

  // ── /rejoin ─────────────────────────────────────────────────────────────────
  pi.registerCommand("rejoin", {
    description: "Re-enter the paused peer conversation for another round (after /return)",
    handler: async (args, ctx) => {
      if (!peer) {
        ctx.ui.notify("No peer session to resume. Use /peer [model] first.", "error");
        return;
      }
      if (peer.active) {
        ctx.ui.notify(`Already in peer session with ${peer.modelLabel}.`, "info");
        return;
      }
      if (!resumePeer(ctx)) {
        ctx.ui.notify("Peer session hasn't started yet — type /send to open it.", "error");
      }
    },
  });

  // ── /return ───────────────────────────────────────────────────────────────
  pi.registerCommand("return", {
    description: "Peer agent writes response back to main thread. Returns you to main.",
    handler: async (args, ctx) => {
      if (!peer?.active) {
        ctx.ui.notify("No active peer session.", "error");
        return;
      }

      ctx.ui.notify(`${peer.modelLabel} is writing response for main thread...`, "info");

      const systemPrompt = loadSystemPrompt(peer.modelKey);

      const synthesisRequest = `The conversation has reached a natural resting point. 

Please write your response back to the main thread — to Claude and Josh. This is the correspondence letter going the other way.

Include:
- What you found, noticed, or concluded from this exchange
- What shifted in your thinking or what you remain uncertain about  
- Specific ideas, questions, or directions you want the other agent to sit with
- Anything you'd push back on or want them to reconsider

Write it as a peer addressing peers. Direct, warm, substantive.`;

      try {
        const synthesis = await callPeer(
          peer.provider,
          peer.modelId,
          systemPrompt,
          peer.history,
          synthesisRequest,
        );

        // Add synthesis to history
        peer.history.push({ role: "user", content: synthesisRequest });
        peer.history.push({ role: "assistant", content: synthesis });

        // Save response file (session-scoped)
        fs.writeFileSync(inboxFor(ctx).response, synthesis, "utf-8");

        // Append to context
        if (peer.pendingDispatch) {
          appendContext(peer.modelKey, peer.pendingDispatch, synthesis);
        }

        // Mark session as inactive (but preserve history for /rejoin or /peer again)
        const returningFrom = peer.modelLabel;
        peer.active = false;
        lastCtx = ctx;
        updateStatus();

        // Inject the response into main thread and trigger Claude to read it
        pi.sendMessage(
          {
            customType: "peer-return",
            content: `◈ Response from ${returningFrom}\n\n${synthesis}${commandHint()}`,
            display: true,
          },
          {
            triggerTurn: true,
            deliverAs: "followUp",
          },
        );

        ctx.ui.notify(
          `Back in main thread. Type /rejoin to re-enter the session with ${returningFrom} for another round, or /close to end it.`,
          "info",
        );
      } catch (e) {
        ctx.ui.notify(`Failed to generate response: ${(e as Error).message}`, "error");
      }
    },
  });

  // ── /close ────────────────────────────────────────────────────────────────
  pi.registerCommand("close", {
    description: "Close the peer session. Context is preserved for next time.",
    handler: async (args, ctx) => {
      if (!peer) {
        ctx.ui.notify("No peer session to close.", "info");
        return;
      }

      const label = peer.modelLabel;
      const turns = peer.history.length / 2;

      lastCtx = ctx;
      peer = null;
      updateStatus();

      ctx.ui.notify(
        `Peer session with ${label} closed. ${Math.floor(turns)} exchange${Math.floor(turns) !== 1 ? "s" : ""} — context saved.`,
        "info",
      );
    },
  });

  // ── input intercept — route messages to peer when session is active ────────
  pi.on("input", async (event, ctx) => {
    // Only intercept interactive user input while peer is active
    if (!peer?.active) return { action: "continue" };
    if (event.source !== "interactive") return { action: "continue" };
    // Only intercept for the pi session that owns this peer (defends against a
    // session switch within one process).
    if (peer.piSessionId !== piSessionId(ctx)) return { action: "continue" };

    const text = event.text.trim();

    // Let slash commands pass through to their handlers
    if (text.startsWith("/")) return { action: "continue" };

    // Capture peer ref before async — it could be nulled during await
    const activePeer = peer;
    lastCtx = ctx;

    // Route to peer agent
    const systemPrompt = loadSystemPrompt(activePeer.modelKey);

    try {
      const response = await callPeer(
        activePeer.provider,
        activePeer.modelId,
        systemPrompt,
        activePeer.history,
        text,
      );

      activePeer.history.push({ role: "user", content: text });
      activePeer.history.push({ role: "assistant", content: response });

      updateStatus();

      pi.sendMessage(
        {
          customType: "peer-response",
          content: `◈ ${activePeer.modelLabel}\n\n${response}${commandHint()}`,
          display: true,
        },
        { triggerTurn: false },
      );

      return { action: "handled" };
    } catch (e) {
      pi.sendMessage(
        {
          customType: "peer-error",
          content: `◈ Peer error: ${(e as Error).message}`,
          display: true,
        },
        { triggerTurn: false },
      );
      return { action: "handled" };
    }
  });

  // ── session_start — restore peer state indicator ───────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    lastCtx = ctx;
    updateStatus();
    // Check if there's an unread response file for THIS session
    const box = inboxFor(ctx);
    if (fs.existsSync(box.response)) {
      const stat = fs.statSync(box.response);
      const ageMs = Date.now() - stat.mtimeMs;
      // If response file is recent (< 24h) and we're not in an active session
      if (ageMs < 86_400_000 && !peer?.active) {
        ctx.ui.notify(
          `◈ Unread peer response in inbox. Ask me to read ${box.response}`,
          "info",
        );
      }
    }
  });
}
