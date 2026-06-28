/**
 * Perplexity Agent API Provider Extension
 *
 * Provides access to all models available through Perplexity's Agent API gateway.
 * Perplexity's Agent API implements the OpenAI Responses API interface, so we
 * delegate to pi-ai's built-in streamSimpleOpenAIResponses.
 *
 * Models from Anthropic, OpenAI, Google, NVIDIA, xAI, and Perplexity itself
 * are all accessible through a single PERPLEXITY_API_KEY.
 *
 * Usage:
 *   export PERPLEXITY_API_KEY="your-key-here"
 *   pi -e ~/.pi/agent/extensions/perplexity
 *   Then /model to select a perplexity/* model
 */

import {
	type Api,
	type AssistantMessageEventStream,
	type Context,
	createAssistantMessageEventStream,
	type Model,
	type SimpleStreamOptions,
	streamSimpleOpenAIResponses,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// =============================================================================
// Constants
// =============================================================================

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai/v1";

// =============================================================================
// Models
// =============================================================================

interface PerplexityModel {
	id: string;
	name: string;
	reasoning: boolean;
	input: ("text" | "image")[];
	cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
	contextWindow: number;
	maxTokens: number;
}

export const MODELS: PerplexityModel[] = [
	// Perplexity
	{
		id: "perplexity/sonar",
		name: "Sonar",
		reasoning: false,
		input: ["text"],
		cost: { input: 0.25, output: 2.5, cacheRead: 0.0625, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 8192,
	},
	// Anthropic
	{
		id: "anthropic/claude-opus-4-6",
		name: "Claude Opus 4.6",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 128000,
	},
	{
		id: "anthropic/claude-opus-4-5",
		name: "Claude Opus 4.5",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 64000,
	},
	{
		id: "anthropic/claude-sonnet-4-6",
		name: "Claude Sonnet 4.6",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 64000,
	},
	{
		id: "anthropic/claude-sonnet-4-5",
		name: "Claude Sonnet 4.5",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 64000,
	},
	{
		id: "anthropic/claude-haiku-4-5",
		name: "Claude Haiku 4.5",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 0 },
		contextWindow: 200000,
		maxTokens: 64000,
	},
	// OpenAI
	{
		id: "openai/gpt-5.4",
		name: "GPT-5.4",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 128000,
	},
	{
		id: "openai/gpt-5.2",
		name: "GPT-5.2",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 },
		contextWindow: 256000,
		maxTokens: 128000,
	},
	{
		id: "openai/gpt-5.1",
		name: "GPT-5.1",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
		contextWindow: 400000,
		maxTokens: 128000,
	},
	{
		id: "openai/gpt-5-mini",
		name: "GPT-5 Mini",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 },
		contextWindow: 272000,
		maxTokens: 128000,
	},
	// Google
	{
		id: "google/gemini-3.1-pro-preview",
		name: "Gemini 3.1 Pro",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 2, output: 12, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 65536,
	},
	{
		id: "google/gemini-3-flash-preview",
		name: "Gemini 3 Flash",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 0.5, output: 3, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 65536,
	},
	// NVIDIA
	{
		id: "nvidia/nemotron-3-super-120b-a12b",
		name: "Nemotron 3 Super 120B",
		reasoning: true,
		input: ["text"],
		cost: { input: 0.25, output: 2.5, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1000000,
		maxTokens: 16000,
	},
	// xAI
	{
		id: "xai/grok-4.3",
		name: "Grok 4.3",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 32768,
	},
	{
		id: "xai/grok-4.20-reasoning",
		name: "Grok 4.20 Reasoning",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 32768,
	},
	{
		id: "xai/grok-4.20-non-reasoning",
		name: "Grok 4.20 Non Reasoning",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 32768,
	},
	{
		id: "xai/grok-4.20-multi-agent",
		name: "Grok 4.20 Multi-Agent",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 32768,
	},
];

// =============================================================================
// Stream Function
//
// Delegates to pi-ai's built-in OpenAI Responses streaming implementation.
// Perplexity's Agent API is fully compatible with the OpenAI Responses API.
// =============================================================================

export function streamPerplexity(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	// Set PI_PERPLEXITY_DEBUG=1 to log API key prefix, model, base URL, and the
	// request payload before/after the reasoning-field strip.
	const DEBUG = !!process.env.PI_PERPLEXITY_DEBUG;

	(async () => {
		try {
			const apiKey = process.env.PERPLEXITY_API_KEY || options?.apiKey;

			const isPlaceholder = apiKey?.startsWith("{{") && apiKey?.endsWith("}}");
			if (isPlaceholder) {
				throw new Error(
					"PERPLEXITY_API_KEY is a template placeholder '{{PERPLEXITY_API_KEY}}' in ~/.zshrc. " +
					"Replace it with your actual key from https://www.perplexity.ai/settings/api"
				);
			}

			if (DEBUG) {
				console.error(`[perplexity] apiKey: ${apiKey ? `${apiKey.slice(0, 8)}... (len=${apiKey.length})` : "MISSING"}`);
				console.error(`[perplexity] model: ${model.id}`);
				console.error(`[perplexity] baseUrl: ${PERPLEXITY_BASE_URL}`);
			}

			if (!apiKey) throw new Error("No Perplexity API key. Set PERPLEXITY_API_KEY.");

			// The provider is registered with api "perplexity-agent-api" so pi routes
			// here (to streamPerplexity). But pi-ai's openai-responses streamer is
			// wrapped with wrapStreamSimple("openai-responses", ...) which throws
			// `Mismatched api: <model.api> expected openai-responses` unless the model
			// we hand it actually carries api "openai-responses" at runtime. The cast
			// below is compile-time only — set the real field here.
			const modelWithBaseUrl = { ...model, baseUrl: PERPLEXITY_BASE_URL, api: "openai-responses" as const };

			// Perplexity's Agent API is a *managed* agent runtime: it reserves a set of
			// generic custom-function names for its own built-in tools, so passing a
			// tool literally named "read" (pi ships read/bash/edit/write) is rejected:
			//   invalid request: invalid tools in request: custom function name "read" is reserved
			// The reserved set is undocumented, so rather than guess it we namespace
			// EVERY local tool with a prefix on the way out and strip it on the way
			// back in. Tool names live in: outbound tools[].name (convert at
			// openai-responses-shared.js:211) and input[].name for function_call items
			// (:154); inbound ToolCall.name (types.d.ts:173) on toolcall_end and in the
			// partial/message/error content blocks. function_call_output has no name
			// (paired by call_id), so it needs no rewrite.
			const TOOL_PREFIX = "pi_local__";
			const toolNames = new Set((context.tools ?? []).map((t) => t.name));
			const encodeName = (n: unknown): unknown =>
				typeof n === "string" && toolNames.has(n) ? TOOL_PREFIX + n : n;
			const decodeName = (n: unknown): unknown =>
				typeof n === "string" && n.startsWith(TOOL_PREFIX) && toolNames.has(n.slice(TOOL_PREFIX.length))
					? n.slice(TOOL_PREFIX.length)
					: n;

			// Restore original tool names in-place on a normalized event before it
			// reaches pi (whose dispatcher matches tool calls by their real name).
			// In-place .name mutation is idempotent and keeps pi-ai's accumulating
			// message consistent for history replay.
			const decodeBlockName = (b: unknown): void => {
				if (b && typeof b === "object") {
					const blk = b as { type?: string; name?: unknown };
					if (blk.type === "toolCall" && typeof blk.name === "string") {
						blk.name = decodeName(blk.name) as string;
					}
				}
			};
			const restoreEvent = (event: unknown): unknown => {
				if (!event || typeof event !== "object") return event;
				const e = event as { toolCall?: unknown; partial?: { content?: unknown[] }; message?: { content?: unknown[] }; error?: { content?: unknown[] } };
				if (e.toolCall) decodeBlockName(e.toolCall);
				for (const msg of [e.partial, e.message, e.error]) {
					if (msg && Array.isArray(msg.content)) for (const b of msg.content) decodeBlockName(b);
				}
				return event;
			};

			// pi-ai's OpenAI-Responses builder (openai-responses.js:195-205) always
			// attaches `reasoning.summary: "auto"` and `include:
			// ["reasoning.encrypted_content"]` for reasoning models when a thinking
			// level is set. Perplexity's Agent API is OpenAI-Responses compatible but
			// its reasoning object supports ONLY `effort` (low|medium|high) per the
			// official docs — its strict JSON decoder rejects the extra fields:
			//   400 invalid request body: json: unknown field "summary"
			// pi-ai exposes an `onPayload(params, model)` hook (openai-responses.js:84)
			// whose return value replaces the outgoing body. We log the real payload
			// (so the offending field is visible) and strip what Perplexity rejects.
			const onPayload = async (payload: unknown, m: Model<Api>): Promise<unknown> => {
				// Run any upstream hook first, then clean its result.
				let next = payload;
				if (typeof options?.onPayload === "function") {
					next = (await options.onPayload(payload, m)) ?? payload;
				}
				if (!next || typeof next !== "object") return next;

				if (DEBUG) {
					const reasoningBefore = (next as { reasoning?: unknown }).reasoning;
					const includeBefore = (next as { include?: unknown }).include;
					console.error(
						`[perplexity] payload BEFORE strip: reasoning=${JSON.stringify(reasoningBefore)} include=${JSON.stringify(includeBefore)}`,
					);
				}

				const cleaned: Record<string, unknown> = { ...next };

				// Drop reasoning.summary, keep reasoning.effort (the one Perplexity supports).
				if (cleaned.reasoning && typeof cleaned.reasoning === "object") {
					const { summary: _summary, ...restReasoning } = cleaned.reasoning as Record<string, unknown>;
					cleaned.reasoning = restReasoning;
				}

				// Drop the unsupported include directive entirely if it only carried the
				// encrypted-reasoning request.
				if (Array.isArray(cleaned.include)) {
					const filtered = (cleaned.include as unknown[]).filter((i) => i !== "reasoning.encrypted_content");
					if (filtered.length === 0) delete cleaned.include;
					else cleaned.include = filtered;
				}

				// Perplexity's Agent API REQUIRES max_output_tokens for Anthropic models:
				//   400 validation failed: max_output_tokens is required when using Anthropic models
				// OpenAI treats the field as optional, so pi-ai's buildParams only sets it
				// when options.maxTokens is passed (openai-responses.ts:233) — and the
				// installed pi-ai doesn't apply strudel's buildBaseOptions model-default
				// (simple-options.ts:6), so the field is omitted and Perplexity rejects.
				// Mirror strudel: default from the model's maxTokens, clamped to 32000.
				if (cleaned.max_output_tokens == null) {
					const declaredMax = (m as { maxTokens?: number }).maxTokens;
					const modelMax = typeof declaredMax === "number" && declaredMax > 0 ? declaredMax : 8192;
					cleaned.max_output_tokens = Math.min(modelMax, 32000);
				}

				// Namespace local tool names so they don't collide with Perplexity's
				// reserved built-ins. tools[].name and any function_call item in the
				// input history both carry a tool name.
				if (Array.isArray(cleaned.tools)) {
					cleaned.tools = (cleaned.tools as unknown[]).map((t) =>
						t && typeof t === "object" && typeof (t as { name?: unknown }).name === "string"
							? { ...(t as object), name: encodeName((t as { name: string }).name) }
							: t,
					);
				}
				if (Array.isArray(cleaned.input)) {
					cleaned.input = (cleaned.input as unknown[]).map((it) =>
						it && typeof it === "object" && (it as { type?: string }).type === "function_call" && typeof (it as { name?: unknown }).name === "string"
							? { ...(it as object), name: encodeName((it as { name: string }).name) }
							: it,
					);
				}

				if (DEBUG) {
					const toolNamesOut = Array.isArray(cleaned.tools)
						? (cleaned.tools as { name?: unknown }[]).map((t) => t?.name)
						: undefined;
					console.error(
						`[perplexity] payload AFTER strip:  reasoning=${JSON.stringify(cleaned.reasoning)} include=${JSON.stringify(cleaned.include)} max_output_tokens=${JSON.stringify(cleaned.max_output_tokens)} tools=${JSON.stringify(toolNamesOut)}`,
					);
				}

				return cleaned;
			};

			const streamOptions = {
				...options,
				apiKey,
				headers: { "Content-Type": "application/json" },
				onPayload,
			};

			const innerStream = streamSimpleOpenAIResponses(
				modelWithBaseUrl as Model<"openai-responses">,
				context,
				streamOptions,
			);

			for await (const event of innerStream) stream.push(restoreEvent(event) as typeof event);
			stream.end();
		} catch (error) {
			stream.push({
				type: "error",
				reason: "error",
				error: {
					role: "assistant",
					content: [],
					api: model.api,
					provider: model.provider,
					model: model.id,
					usage: {
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 0,
						cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
					},
					stopReason: "error",
					errorMessage: error instanceof Error ? error.message : String(error),
					timestamp: Date.now(),
				},
			});
			stream.end();
		}
	})();

	return stream;
}

// =============================================================================
// Extension Entry Point
// =============================================================================

export default function (pi: ExtensionAPI) {
	pi.registerProvider("perplexity", {
		baseUrl: PERPLEXITY_BASE_URL,
		apiKey: "$PERPLEXITY_API_KEY",
		api: "perplexity-agent-api",
		authHeader: true,
		models: MODELS.map(({ id, name, reasoning, input, cost, contextWindow, maxTokens }) => ({
			id,
			name,
			reasoning,
			input,
			cost,
			contextWindow,
			maxTokens,
		})),
		streamSimple: streamPerplexity,
	});
}
