/**
 * voice-report — spoken gist, written detail (hidden-channel mode)
 *
 * The model is asked to begin every reply with a <spoken>…</spoken> block: a
 * 2–3 sentence, plain-spoken summary. This extension:
 *
 *   - SPEAKS that block EARLY — as soon as the closing </spoken> streams in,
 *     while the detailed answer is still rendering (conversational, not "talk
 *     after the whole thing finishes").
 *   - SHOWS it as a caption — rewrites the <spoken> block into a clean blockquote
 *     (❝ …) above the detailed report, so you see the handoff line that was
 *     spoken instead of raw tags.
 *
 * It drives synthesis through pi-simple-voice's Kokoro server on :8181 (which
 * it spawns/reuses itself), and pi-simple-voice's own raw streaming TTS is
 * disabled via ~/.pi/voice/config.json {"enabled": false} so they don't both
 * speak.
 *
 * Toggle at runtime with /voice-report.  Status bar shows ❝ when active.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const HOST = "127.0.0.1";
const PORT = 8181;
const SERVER_URL = `http://${HOST}:${PORT}`;
const SERVER_SCRIPT = join(
	homedir(),
	".pi/agent/npm/node_modules/pi-simple-voice/extensions/server.ts",
);
const DTYPE = "q4";
const IDLE_MS = 900_000;

const SPOKEN_PROMPT = `

## Spoken handoff (for detailed responses, NOT for plain conversation)

Your replies fall into two kinds. Decide which this one is before you answer.

DETAILED RESPONSE — a substantial answer with depth: an explanation in parts, a plan, code, a structure, a walkthrough — anything the user would want to read and skim. Deliver it as ONE CONTINUOUS handoff with the detail handed over in the middle — like talking someone through it while you slide the page in front of them. It must FLOW; never cut hard from speech into a wall of text and back. Three parts, in order:

1. OPENING — a <spoken>…</spoken> block: the warm read on what's going on, then a SEGUE that leads straight into the detail. End it mid-handoff, teeing up what they're about to see — "…so here are the four that stood out:", "…here's how it breaks down:", "…take a look:". It should feel like you're about to show them something, not finish a thought. ~2–3 sentences.

2. THE DETAIL — the full response, picking up right where that lead-in left off, as if it's the very thing you just gestured at. Straight on substance — do NOT re-acknowledge or restate the problem, and cut throat-clearing ("Let me probe…", "The truth I'm hearing…", "You're naming the real problem…"). Structured and scannable. The follow-up question does NOT go here.

3. CLOSING — a second <spoken>…</spoken> block, LAST: pick up AFTER they've read it. Refer back to what they just saw ("so, of those…", "given that…"), then ask the open follow-up and stop, handing it back. 1–2 sentences.

Both <spoken> blocks are warm, conversational, first person fine. No code, paths, markdown, lists, or symbols inside them — they're spoken aloud and shown as captions bracketing the detail.

CONVERSATION — a greeting, an acknowledgment, a quick thought, back-and-forth sense-making. Do NOT use a <spoken> block at all. Just reply naturally and briefly; your reply itself is spoken aloud as-is. NEVER restate a short reply as a summary of itself — saying the same thing twice, once in a block and once below, is exactly the failure to avoid.

Example (opening segues IN → detail → closing picks up FROM it):
<spoken>Yeah — you built the cathedral but can't tell if anyone's praying in it; the whole feedback loop's missing. So here are the four places I'd look, worst-case first:</spoken>
1. Daemon health — is the dream daemon even running?
2. Usage — do recall events and shards actually land?
… (the scannable detail) …
<spoken>So of those four, which is the sharpest pain right now? Point me at one and we'll go straight at it.</spoken>

Example CONVERSATION (no block, just the reply):
Yes — no deliverables, just thinking out loud together. I'm ready when you are. What broke through?`;

interface VoiceConfig {
	voice: string;
	speed: number;
}

function getVoiceConfig(): VoiceConfig {
	try {
		const p = join(homedir(), ".pi", "voice", "config.json");
		if (existsSync(p)) {
			const c = JSON.parse(readFileSync(p, "utf-8"));
			return { voice: c.voice ?? "af_heart", speed: c.speed ?? 1.0 };
		}
	} catch {}
	return { voice: "af_heart", speed: 1.0 };
}

function messageText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return (content as Array<{ type?: string; text?: string }>)
			.filter((b) => b.type === "text" && typeof b.text === "string")
			.map((b) => b.text as string)
			.join("\n");
	}
	return "";
}

/** Every <spoken> block's inner text, in order (opening handoff … closing follow-up). */
function spokenBlocks(text: string): string[] {
	return Array.from(text.matchAll(/<spoken>([\s\S]*?)<\/spoken>/gi), (m) => m[1]);
}

/**
 * Turn each <spoken>…</spoken> block into a visible caption (a blockquote led by
 * ❝) so the user SEES the spoken lines cleanly — the opening handoff above the
 * report and the closing follow-up below it — instead of raw tags.
 */
function formatSpoken<T extends { content?: unknown }>(message: T): T {
	const fmt = (s: string) =>
		s
			.replace(/<spoken>([\s\S]*?)<\/spoken>/gi, (_m, inner: string) => {
				const gist = inner.replace(/\s+/g, " ").trim();
				return gist ? `> ❝ ${gist}\n\n` : "";
			})
			.replace(/^\s+/, "")
			.replace(/\s+$/, "")
			.replace(/\n{3,}/g, "\n\n");
	if (typeof message.content === "string") {
		return { ...message, content: fmt(message.content) };
	}
	if (Array.isArray(message.content)) {
		const content = (message.content as Array<{ type?: string; text?: string }>).map((b) =>
			b.type === "text" && typeof b.text === "string" ? { ...b, text: fmt(b.text) } : b,
		);
		return { ...message, content };
	}
	return message;
}

async function fetchHealth(): Promise<{ modelLoaded?: boolean; loading?: boolean } | null> {
	try {
		const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(1500) });
		return res.ok ? ((await res.json()) as { modelLoaded?: boolean; loading?: boolean }) : null;
	} catch {
		return null;
	}
}

/** Spawn the Kokoro server if it isn't up, and make sure the model is loaded. */
async function ensureServer(): Promise<boolean> {
	let health = await fetchHealth();
	if (!health) {
		if (!existsSync(SERVER_SCRIPT)) {
			console.warn(`[voice-report] server script not found: ${SERVER_SCRIPT}`);
			return false;
		}
		try {
			// Detached + unref so one server is shared across pis and self-exits on
			// idle (--idle-ms). This mirrors pi-simple-voice's own lifecycle.
			const child = spawn("bun", [SERVER_SCRIPT, "--idle-ms", String(IDLE_MS)], {
				detached: true,
				stdio: "ignore",
			});
			child.unref();
		} catch (err) {
			console.warn("[voice-report] failed to spawn server (is bun on PATH?):", err);
			return false;
		}
		for (let i = 0; i < 50 && !health; i++) {
			await new Promise((r) => setTimeout(r, 200));
			health = await fetchHealth();
		}
		if (!health) return false;
	}
	// Activate the model if it isn't loaded yet (idempotent on the server).
	if (!health.modelLoaded && !health.loading) {
		try {
			await fetch(`${SERVER_URL}/models/download`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ dtype: DTYPE, activate: true }),
			});
		} catch {}
	}
	for (let i = 0; i < 100; i++) {
		if (health?.modelLoaded) return true;
		await new Promise((r) => setTimeout(r, 200));
		health = await fetchHealth();
	}
	return !!health?.modelLoaded;
}

export default function (pi: ExtensionAPI) {
	let active = true;
	let toolDepth = 0;
	let enqueuedCount = 0; // <spoken> blocks already queued for the current message
	const queue: string[] = [];
	let draining = false;
	let currentAudio: ChildProcess | null = null;

	function resetForMessage() {
		enqueuedCount = 0;
		queue.length = 0;
		if (currentAudio) {
			currentAudio.kill();
			currentAudio = null;
		}
		draining = false;
	}

	async function synthToFile(raw: string): Promise<string | null> {
		const text = raw.replace(/\s+/g, " ").trim();
		if (!text) return null;
		if (!(await ensureServer())) return null;
		const cfg = getVoiceConfig();
		let res: Response;
		try {
			res = await fetch(`${SERVER_URL}/tts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, voice: cfg.voice, speed: cfg.speed }),
			});
		} catch (err) {
			console.warn("[voice-report] TTS request failed:", err);
			return null;
		}
		if (!res.ok) return null;
		const wav = Buffer.from(await res.arrayBuffer());
		const dir = join(tmpdir(), "voice-report");
		mkdirSync(dir, { recursive: true });
		const file = join(dir, `spoken-${process.pid}-${Date.now()}-${queue.length}.wav`);
		writeFileSync(file, wav);
		return file;
	}

	function playFile(file: string): Promise<void> {
		return new Promise((resolve) => {
			const cmd = process.platform === "darwin" ? "afplay" : "aplay";
			const child = spawn(cmd, [file]);
			currentAudio = child;
			const done = () => {
				if (currentAudio === child) currentAudio = null;
				try {
					unlinkSync(file);
				} catch {}
				resolve();
			};
			child.once("error", done);
			child.once("exit", done);
		});
	}

	// Serialize playback: each spoken block is voiced fully before the next, so
	// the opening handoff and the closing follow-up never talk over each other.
	async function drain() {
		if (draining) return;
		draining = true;
		while (queue.length > 0) {
			const next = queue.shift() as string;
			const file = await synthToFile(next);
			if (file) await playFile(file);
		}
		draining = false;
	}

	function enqueue(text: string) {
		queue.push(text);
		void drain();
	}

	// Queue any <spoken> blocks that have fully arrived but aren't queued yet.
	function flushNewBlocks(text: string): number {
		const blocks = spokenBlocks(text);
		for (let i = enqueuedCount; i < blocks.length; i++) {
			if (blocks[i].trim()) enqueue(blocks[i]);
		}
		if (blocks.length > enqueuedCount) enqueuedCount = blocks.length;
		return blocks.length;
	}

	// Inject the <spoken> instruction into the system prompt each turn.
	pi.on("before_agent_start", (event) => {
		if (!active) return;
		return { systemPrompt: event.systemPrompt + SPOKEN_PROMPT };
	});

	pi.on("tool_execution_start", () => {
		toolDepth++;
	});
	pi.on("tool_execution_end", () => {
		if (toolDepth > 0) toolDepth--;
	});

	// New assistant turn → reset the queue and cut off any still-playing audio.
	pi.on("message_start", () => {
		resetForMessage();
	});

	// Speak EARLY and IN ORDER: the opening handoff the moment it closes, then
	// the closing follow-up when it streams in after the report.
	pi.on("message_update", (event) => {
		if (!active || toolDepth > 0) return;
		const msg = event.message as { role?: string; content?: unknown };
		if (msg.role !== "assistant") return;
		flushNewBlocks(messageText(msg.content));
	});

	// Finalize: voice anything not yet spoken, fall back for plain conversation,
	// and render the spoken blocks as captions around the report.
	pi.on("message_end", (event) => {
		if (!active) return undefined;
		const msg = event.message as { role?: string; content?: unknown };
		if (msg.role !== "assistant" || toolDepth > 0) return undefined;

		const text = messageText(msg.content);
		const blockCount = flushNewBlocks(text);

		if (blockCount === 0) {
			// No <spoken> blocks → conversational turn; the reply IS the spoken
			// line. Speak it as-is unless it's clearly a report the model forgot to
			// tag (code or a wall), so we never read code or a long doc aloud.
			const hasCode = /```/.test(text);
			const wordCount = text.trim().split(/\s+/).length;
			if (text.trim() && !hasCode && wordCount <= 110) enqueue(text);
			return undefined;
		}

		// Render the spoken blocks as captions bracketing the report.
		return { message: formatSpoken(msg) as typeof msg };
	});

	pi.on("session_start", (_event, ctx) => {
		void ensureServer().catch(() => {});
		ctx.ui.setStatus("voice-report", ctx.ui.theme.fg("accent", "❝"));
	});

	pi.registerCommand("voice-report", {
		description: "Toggle spoken-gist / written-detail voice mode",
		handler: async (_args, ctx) => {
			active = !active;
			if (!active) resetForMessage();
			ctx.ui.notify(`Voice report ${active ? "enabled" : "disabled"}`, "info");
			ctx.ui.setStatus("voice-report", active ? ctx.ui.theme.fg("accent", "❝") : "");
		},
	});

}
