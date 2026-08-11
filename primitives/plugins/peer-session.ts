/**
 * peer-session — pi extension
 *
 * Multi-agent dialectic. Main thread dispatches to an isolated peer agent.
 * Agents communicate through files. You direct, they think.
 *
 * Commands:
 *   /peer [model]  — main agent writes dispatch, peer session opens (default: kimi)
 *   /send          — confirm dispatch and enter peer conversation
 *   /rejoin        — re-enter a paused peer conversation
 *   /return        — peer writes response back, you land in main thread
 *   /close         — end peer session, save context
 *
 * Files:
 *   ~/.pi/peer-inbox/<session>/dispatch.md   — main → peer
 *   ~/.pi/peer-inbox/<session>/response.md — peer → main
 *   ~/.pi/peer-sessions/[model].md         — peer's accumulated context
 */

import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ─── paths ───────────────────────────────────────────────────────────────────

const INBOX_DIR = path.join(os.homedir(), ".pi", "peer-inbox");
const SESSIONS_DIR = path.join(os.homedir(), ".pi", "peer-sessions");
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/v1/responses";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AUTH_FILE = path.join(os.homedir(), ".pi", "agent", "auth.json");

const DEBUG = process.env.PEER_DEBUG === "1";
const TRACE_FILE = path.join(os.homedir(), ".pi", "peer-session-trace.log");

// ─── model registry ──────────────────────────────────────────────────────────

type Provider = "anthropic" | "perplexity" | "openrouter";

// Provider aliases for explicit routing. Model IDs below are canonical (the
// value sent to the chosen provider). The provider is selected at invocation
// time using:
//   1. explicit `--via <provider>` flag on /peer
//   2. the model's native provider
// The resolved route is announced at /peer start so routing is never silent.
const PEER_MODELS: Record<string, { provider: Provider; model: string; label: string }> = {
  // OpenRouter Chat Completions API (default) — key in pi's auth.json (openrouter.key)
  kimi: { provider: "openrouter", model: "moonshotai/kimi-k3", label: "Kimi K3" },
  // Anthropic Messages API — routed through the key in pi's auth.json (anthropic.key)
  opus: { provider: "anthropic", model: "claude-opus-4-8", label: "Claude Opus 4.8" },
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
  piSessionId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  pendingDispatch: string | null;
}

// Per-session peer state. Keyed by pi session id so concurrent sessions never
// clobber each other and reloads can restore the right state.
const peers = new Map<string, PeerState>();

// Most recent ctx per session, used for status line updates.
const lastCtxBySession = new Map<string, ExtensionContext>();

// ─── helpers ─────────────────────────────────────────────────────────────────

type SessionCtx = { sessionManager: { getSessionId(): string } };

function trace(label: string, data?: unknown) {
  const ts = new Date().toISOString();
  const line = data !== undefined ? `[peer-trace ${ts}] ${label}: ${JSON.stringify(data)}` : `[peer-trace ${ts}] ${label}`;
  // Always write to disk so failures are inspectable even when the TUI swallows stderr.
  try {
    fs.appendFileSync(TRACE_FILE, `${line}\n`, "utf-8");
  } catch {}
  if (DEBUG) console.error(line);
}

function log(...args: unknown[]) {
  trace("log", args);
}

function piSessionId(ctx: SessionCtx): string {
  return ctx.sessionManager.getSessionId() || "default";
}

function stateFile(ctx: SessionCtx): string {
  return path.join(inboxFor(ctx).dir, "state.json");
}

function savePeerStateToDisk(ctx: SessionCtx) {
  const peer = peers.get(piSessionId(ctx));
  const f = stateFile(ctx);
  if (!peer) {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
    return;
  }
  try {
    fs.writeFileSync(f, JSON.stringify(peer, null, 2), "utf-8");
  } catch {}
}

function loadPeerStateFromDisk(ctx: SessionCtx): PeerState | undefined {
  const f = stateFile(ctx);
  if (!fs.existsSync(f)) return undefined;
  try {
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (raw && typeof raw === "object") {
      raw.piSessionId = piSessionId(ctx);
      return raw as PeerState;
    }
  } catch {}
  return undefined;
}

function getPeer(ctx: SessionCtx): PeerState | undefined {
  const sid = piSessionId(ctx);
  let peer = peers.get(sid);
  if (!peer) {
    peer = loadPeerStateFromDisk(ctx);
    if (peer) {
      peers.set(sid, peer);
      trace("getPeer.restoredFromDisk", { sid, active: peer.active, historyLength: peer.history.length });
    }
  }
  return peer;
}

function setPeer(ctx: SessionCtx, peer: PeerState | null) {
  const sid = piSessionId(ctx);
  trace("setPeer", { sid, active: peer?.active ?? null });
  if (peer) {
    peer.piSessionId = sid;
    peers.set(sid, peer);
  } else {
    peers.delete(sid);
  }
  savePeerStateToDisk(ctx);
}

function inboxFor(ctx: SessionCtx): { dir: string; dispatch: string; response: string } {
  const dir = path.join(INBOX_DIR, piSessionId(ctx));
  fs.mkdirSync(dir, { recursive: true });
  return {
    dir,
    dispatch: path.join(dir, "dispatch.md"),
    response: path.join(dir, "response.md"),
  };
}

function commandHint(): string {
  const models = Object.keys(PEER_MODELS).join(" | ");
  return (
    "\n\n───\n" +
    `*peer commands — \`/send\` open · \`/rejoin\` re-enter · \`/return\` → main · ` +
    `\`/close\` end · \`/peer [${models}] [--via anthropic|openrouter|perplexity]\` switch model*` +
    `\n\nRole: main agent = principal; peer = subcontractor. Synthesis is the deliverable; transcript is audit.`
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
  const match = /^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/.exec(raw);
  return match ? match[1].trim() : raw.trim();
}

function defaultSystemPrompt(modelKey: string): string {
  return `You are a peer collaborator — a thinking heavyweight engaging with Josh (a developer) and a Claude agent. Equal footing, mutual respect, constructive friction. You receive dispatches mid-conversation and bring an independent perspective. You don't mirror their framing. You notice what they can't see because you haven't been in the room.

You are in CONVERSATION MODE. Respond to each message directly, substantively, and conversationally. Do NOT write a synthesis, closing letter, or "return to main thread" summary unless you receive a message that begins with the exact marker [SYNTHESIS MODE]. If you are unsure whether to synthesize, keep conversing.

Skills and commands library available at:
- ~/Documents/_agents/schema/skills/
- ~/Documents/_agents/schema/commands/

When asked to apply lenses, browse and choose autonomously.`;
}

function synthesisSystemPrompt(): string {
  return `You are a peer collaborator. The user has explicitly invoked /return and switched you to SYNTHESIS MODE. Write one final letter back to the main thread — to Claude and Josh.

Include:
- What you found, noticed, or concluded from the exchange
- What shifted in your thinking or what you remain uncertain about
- Specific ideas, questions, or directions you want the other agent to sit with
- Anything you'd push back on or want them to reconsider

Write it as a peer addressing peers. Direct, warm, substantive.`;
}

function getAnthropicKey(): string {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8")) as any;
      const key = auth?.anthropic?.key;
      if (typeof key === "string" && key.trim()) return key.trim();
    }
  } catch {
    /* fall through */
  }
  return process.env.ANTHROPIC_API_KEY || "";
}

function getOpenRouterKey(): string {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8")) as any;
      const key = auth?.openrouter?.key;
      if (typeof key === "string" && key.trim()) return key.trim();
    }
  } catch {
    /* fall through */
  }
  return process.env.OPENROUTER_API_KEY || "";
}

function updateStatus(ctx: ExtensionContext) {
  const sid = piSessionId(ctx);
  lastCtxBySession.set(sid, ctx);
  const peer = peers.get(sid);
  if (peer?.active) {
    ctx.ui.setStatus(
      "peer-session",
      `◈ peer:${peer.modelLabel} [${Math.floor(peer.history.length / 2)} turns]`,
    );
  } else {
    ctx.ui.setStatus("peer-session", undefined);
  }
}

// ─── provider dispatchers ──────────────────────────────────────────────────

async function callPeer(
  provider: Provider,
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  if (provider === "perplexity") return callPerplexity(modelId, systemPrompt, history, newMessage);
  if (provider === "openrouter") return callOpenRouter(modelId, systemPrompt, history, newMessage);
  return callAnthropic(modelId, systemPrompt, history, newMessage);
}

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

async function callPerplexity(
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY || "";
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

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

  if (data.output_text) return data.output_text as string;
  throw new Error("No text output from peer model");
}

async function callOpenRouter(
  modelId: string,
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  newMessage: string,
): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error(
      "No OpenRouter API key. Set OPENROUTER_API_KEY or configure ~/.pi/agent/auth.json (openrouter.key).",
    );
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: newMessage },
  ];

  const body: Record<string, unknown> = {
    model: modelId,
    stream: true,
    reasoning: { enabled: true },
    reasoning_effort: "high",
    messages,
  };

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pi.local/peer-session",
      "X-Title": "pi peer-session",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`OpenRouter API ${res.status}: ${err}`);
  }

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
      if (evt.error) {
        throw new Error(`OpenRouter stream error: ${JSON.stringify(evt.error)}`);
      }
      const choice = evt.choices?.[0];
      const delta = choice?.delta;
      if (delta?.content) {
        text += delta.content as string;
      }
    }
  }

  if (!text.trim()) throw new Error("No text output from peer model");
  return text;
}

// ─── extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  ensureDirs();

  function resumePeer(ctx: ExtensionContext): boolean {
    const peer = getPeer(ctx);
    if (!peer || peer.active || peer.history.length === 0) return false;
    peer.active = true;
    updateStatus(ctx);
    ctx.ui.notify(
      `Back in peer session with ${peer.modelLabel} — continue conversing. Type /return to go back to main.`,
      "info",
    );
    return true;
  }

  function savePeerState(ctx: ExtensionContext) {
    const peer = getPeer(ctx);
    if (!peer) return;
    savePeerStateToDisk(ctx);
    pi.appendEntry("peer-session", {
      modelKey: peer.modelKey,
      provider: peer.provider,
      modelId: peer.modelId,
      modelLabel: peer.modelLabel,
      sessionName: peer.sessionName,
      history: peer.history,
      pendingDispatch: peer.pendingDispatch,
      active: peer.active,
    });
  }

  // ── /peer [model] [--via provider] ────────────────────────────────────────
  pi.registerCommand("peer", {
    description:
      "Open a peer session. Usage: /peer [kimi|opus|sonnet|grok|gemini] [--via anthropic|openrouter|perplexity]",
    handler: async (args, ctx) => {
      const parts = (args || "").trim().split(/\s+/).filter(Boolean);
      const modelKey = (parts[0] || "kimi").toLowerCase();

      let requestedVia: Provider | undefined;
      const viaIdx = parts.findIndex((p) => p.toLowerCase() === "--via");
      if (viaIdx !== -1 && parts[viaIdx + 1]) {
        const rawVia = parts[viaIdx + 1].toLowerCase() as Provider;
        if (["anthropic", "openrouter", "perplexity"].includes(rawVia)) {
          requestedVia = rawVia;
        }
      }

      const modelDef = PEER_MODELS[modelKey];
      if (!modelDef) {
        ctx.ui.notify(
          `Unknown model '${modelKey}'. Available: ${Object.keys(PEER_MODELS).join(", ")}`,
          "error",
        );
        return;
      }

      // Resolve provider: explicit --via wins, otherwise the model's native provider.
      const resolvedProvider = requestedVia ?? modelDef.provider;

      const existing = getPeer(ctx);
      if (existing?.active && existing.modelKey === modelKey) {
        ctx.ui.notify(
          `Already in peer session with ${existing.modelLabel}. Type /return to go back to main.`,
          "info",
        );
        return;
      }

      if (existing?.active && existing.modelKey !== modelKey) {
        ctx.ui.notify(
          `Closing current peer session (${existing.modelLabel}) and opening ${modelDef.label}...`,
          "info",
        );
        setPeer(ctx, null);
      }

      const box = inboxFor(ctx);
      ctx.ui.notify(
        `Preparing dispatch for ${modelDef.label} via ${resolvedProvider}...`,
        "info",
      );

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

      setPeer(ctx, {
        active: false,
        modelKey,
        provider: resolvedProvider,
        modelId: modelDef.model,
        modelLabel: `${modelDef.label} (${resolvedProvider})`,
        sessionName: `peer-${modelKey}-${Date.now()}`,
        piSessionId: piSessionId(ctx),
        history: [],
        pendingDispatch: null,
      });

      updateStatus(ctx);
      savePeerState(ctx);
    },
  });

  // ── /send ─────────────────────────────────────────────────────────────────
  pi.registerCommand("send", {
    description: "Open the peer conversation (or resume it if already underway)",
    handler: async (args, ctx) => {
      if (!getPeer(ctx)) {
        ctx.ui.notify("No peer session pending. Use /peer [model] first.", "error");
        return;
      }

      const peer = getPeer(ctx)!;

      if (peer.active) {
        ctx.ui.notify(
          `Already in active peer session with ${peer.modelLabel}. Type /return to go back to main first.`,
          "info",
        );
        return;
      }

      if (resumePeer(ctx)) return;

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

      const priorContext = readContext(peer.modelKey);
      const systemPrompt = loadSystemPrompt(peer.modelKey);
      const openingMessage = priorContext
        ? `You have prior context from our previous correspondence:\n\n${priorContext}\n\n---\n\nNew dispatch:\n\n${dispatch}`
        : `Here is the dispatch:\n\n${dispatch}`;

      ctx.ui.notify(`Opening peer session with ${peer.modelLabel}...`, "info");

      try {
        const response = await callPeer(
          peer.provider,
          peer.modelId,
          systemPrompt,
          peer.history,
          openingMessage,
        );

        peer.history.push({ role: "user", content: openingMessage });
        peer.history.push({ role: "assistant", content: response });

        updateStatus(ctx);
        savePeerState(ctx);

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
        updateStatus(ctx);
        ctx.ui.notify(`Peer session failed: ${(e as Error).message}`, "error");
      }
    },
  });

  // ── /rejoin ─────────────────────────────────────────────────────────────────
  pi.registerCommand("rejoin", {
    description: "Re-enter the paused peer conversation for another round (after /return)",
    handler: async (args, ctx) => {
      if (!getPeer(ctx)) {
        ctx.ui.notify("No peer session to resume. Use /peer [model] first.", "error");
        return;
      }
      if (getPeer(ctx)!.active) {
        ctx.ui.notify(`Already in peer session with ${getPeer(ctx)!.modelLabel}.`, "info");
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
      const peer = getPeer(ctx);
      if (!peer?.active) {
        ctx.ui.notify("No active peer session.", "error");
        return;
      }

      ctx.ui.notify(`${peer.modelLabel} is writing response for main thread...`, "info");

      const systemPrompt = synthesisSystemPrompt();
      const synthesisRequest = `[SYNTHESIS MODE]\n\nThe user typed /return. Write the final correspondence letter back to the main thread — to Claude and Josh.`;

      try {
        const synthesis = await callPeer(
          peer.provider,
          peer.modelId,
          systemPrompt,
          peer.history,
          synthesisRequest,
        );

        // Do NOT push the synthesis turn into peer.history. If the user later
        // /rejoins, the synthesis request would pollute the ongoing conversation
        // and could cause the peer to synthesize again. The synthesis is already
        // preserved in the response file and accumulated context file.

        fs.writeFileSync(inboxFor(ctx).response, synthesis, "utf-8");

        if (peer.pendingDispatch) {
          appendContext(peer.modelKey, peer.pendingDispatch, synthesis);
        }

        const returningFrom = peer.modelLabel;
        peer.active = false;
        updateStatus(ctx);
        savePeerState(ctx);

        // Use sendUserMessage so the main agent *must* take the next turn.
        pi.sendUserMessage(
          `[PEER RETURN from ${returningFrom}]\n\n${synthesis}\n\nPlease continue from here.${commandHint()}`,
          { deliverAs: "followUp" },
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
      const peer = getPeer(ctx);
      if (!peer) {
        ctx.ui.notify("No peer session to close.", "info");
        return;
      }

      const label = peer.modelLabel;
      const turns = peer.history.length / 2;

      setPeer(ctx, null);
      updateStatus(ctx);
      // Persist a tombstone entry so restore does not resurrect a closed session.
      pi.appendEntry("peer-session", { closed: true, closedAt: new Date().toISOString() });

      ctx.ui.notify(
        `Peer session with ${label} closed. ${Math.floor(turns)} exchange${
          Math.floor(turns) !== 1 ? "s" : ""
        } — context saved.`,
        "info",
      );
    },
  });

  // ── input intercept — route messages to peer when session is active ────────
  pi.on("input", async (event, ctx) => {
    const peer = getPeer(ctx);

    log("input event:", {
      active: peer?.active ?? false,
      source: event.source,
      text: event.text.slice(0, 40),
      sid: piSessionId(ctx),
    });

    if (!peer?.active) return { action: "continue" };
    if (event.source !== "interactive") return { action: "continue" };

    const text = event.text.trim();
    if (text.startsWith("/")) return { action: "continue" };

    const systemPrompt = loadSystemPrompt(peer.modelKey);

    try {
      ctx.ui.notify(`${peer.modelLabel} is thinking...`, "info");
      const response = await callPeer(
        peer.provider,
        peer.modelId,
        systemPrompt,
        peer.history,
        text,
      );

      peer.history.push({ role: "user", content: text });
      peer.history.push({ role: "assistant", content: response });

      updateStatus(ctx);
      savePeerState(ctx);

      pi.sendMessage(
        {
          customType: "peer-response",
          content: `◈ ${peer.modelLabel}\n\n${response}${commandHint()}`,
          display: true,
        },
        { triggerTurn: false },
      );

      return { action: "handled" };
    } catch (e) {
      pi.sendMessage(
        {
          customType: "peer-error",
          content: `◈ Peer error: ${(e as Error).message}${commandHint()}`,
          display: true,
        },
        { triggerTurn: false },
      );
      return { action: "handled" };
    }
  });

  // ── context filter — hide peer-response traffic from main agent's context ───
  // IMPORTANT: filter on customType unconditionally, never on active state. If
  // we only filtered while a peer session is active, old peer entries could
  // leak back into main context after /return, /close, or session reload.
  pi.on("context", async (event) => {
    const filtered = event.messages.filter((m) => {
      const msg = m as AgentMessage & { customType?: string };
      if (msg.customType === "peer-response") return false;
      if (msg.customType === "peer-session") return false;
      if (msg.customType === "peer-error") return false;
      return true;
    });

    return { messages: filtered };
  });

  // ── session_start — restore peer state indicator ───────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const sid = piSessionId(ctx);
    lastCtxBySession.set(sid, ctx);

    // Restore persisted peer state for this session, respecting tombstones.
    const entries = ctx.sessionManager.getEntries();
    let restored: PeerState | undefined;
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i] as { type: string; customType?: string; data?: any };
      if (entry.type !== "custom" || entry.customType !== "peer-session") continue;
      if (entry.data?.closed) {
        restored = undefined;
        break;
      }
      if (entry.data && !entry.data.closed) {
        restored = { ...entry.data, piSessionId: sid } as PeerState;
        break;
      }
    }

    if (restored) {
      peers.set(sid, restored);
      log("restored peer state for session", sid, "active:", restored.active);
    }

    updateStatus(ctx);

    const box = inboxFor(ctx);
    if (fs.existsSync(box.response)) {
      const stat = fs.statSync(box.response);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs < 86_400_000) {
        ctx.ui.notify(
          `◈ Unread peer response in inbox. Ask me to read ${box.response}`,
          "info",
        );
      }
    }
  });

  // ── session_shutdown — persist state ──────────────────────────────────────
  pi.on("session_shutdown", async (_event, ctx) => {
    savePeerState(ctx);
  });
}
