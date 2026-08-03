import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * openrouter-research
 *
 * Web/research tool that uses OpenRouter's OpenAI-compatible endpoint.
 * Supports any model available on OpenRouter (sonar, gemini-2.5-pro,
 * deepseek-r1, glm-4.5, kimi, etc.).
 *
 * Requires OPENROUTER_API_KEY in the environment.
 */

interface SearchResult {
  query: string;
  model: string;
  answer: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "openrouter_search",
    label: "OpenRouter Research",
    description: [
      "Search the internet and synthesize current information via OpenRouter.",
      "Supports any model that has strong web/research capabilities.",
      "Requires OPENROUTER_API_KEY environment variable.",
      "",
      "Recommended research models:",
      "  • perplexity/sonar-reasoning          (best balance)",
      "  • google/gemini-2.5-pro               (excellent grounding)",
      "  • deepseek/deepseek-chat              (cheap + capable)",
      "  • openrouter/auto                     (lets OpenRouter pick)",
    ].join("\n"),

    parameters: Type.Object({
      query: Type.String({ description: "Research question or topic" }),
      model: Type.Optional(
        Type.String({
          description: "OpenRouter model slug (e.g. perplexity/sonar-reasoning). Default: perplexity/sonar",
          default: "perplexity/sonar",
        })
      ),
      maxResults: Type.Optional(
        Type.Number({ description: "Maximum sources to request (default 8)", default: 8 })
      ),
    }),

    execute: async (_toolCallId, params, _signal) => {
      // Try environment first, then fall back to the same auth.json Pi uses
      let apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        try {
          const fs = await import("node:fs/promises");
          const path = await import("node:path");
          const authPath = path.join(process.env.HOME || "", ".pi/agent/auth.json");
          const auth = JSON.parse(await fs.readFile(authPath, "utf8"));
          apiKey = auth?.openrouter?.key;
        } catch {
          /* ignore */
        }
      }
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "No OpenRouter API key found. Set OPENROUTER_API_KEY or ensure ~/.pi/agent/auth.json has an openrouter entry (same as /model uses).",
            },
          ],
          isError: true,
        };
      }

      const model = params.model ?? "perplexity/sonar";
      const query = params.query;

      const systemPrompt = [
        "You are a precise research assistant with access to current information.",
        "When given a query, perform web research and return:",
        "1. A clear, concise synthesis of the current state of knowledge.",
        "2. Key facts, numbers, and recent developments (with dates if possible).",
        "3. A short list of the most authoritative sources with URLs.",
        "",
        "Format your final answer as JSON with keys:",
        '{ "answer": "...", "sources": [ { "title": "...", "url": "...", "snippet": "..." } ] }',
      ].join("\n");

      try {
        const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/earendil-works/pi-coding-agent",
            "X-Title": "Pi OpenRouter Research",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: 0.1,
            max_tokens: 4000,
            // Ask for usage so we can show cost
            usage: { include: true },
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          return {
            content: [{ type: "text", text: `OpenRouter error (${resp.status}): ${errText}` }],
            isError: true,
          };
        }

        const data: any = await resp.json();
        const choice = data.choices?.[0]?.message?.content ?? "";
        const usage = data.usage;

        // Try to parse structured output
        let parsed: Partial<SearchResult> = {};
        try {
          parsed = JSON.parse(choice);
        } catch {
          // Fallback: treat whole response as the answer
          parsed = { answer: choice };
        }

        const result: SearchResult = {
          query,
          model,
          answer: parsed.answer ?? choice,
          sources: parsed.sources,
          usage: usage
            ? {
                prompt_tokens: usage.prompt_tokens ?? 0,
                completion_tokens: usage.completion_tokens ?? 0,
                total_tokens: usage.total_tokens ?? 0,
                cost: data?.usage?.cost, // OpenRouter sometimes includes this
              }
            : undefined,
        };

        const text = [
          `**Model:** ${model}`,
          "",
          result.answer,
          "",
          result.sources && result.sources.length > 0
            ? "**Sources:**\n" +
              result.sources
                .map((s) => `- [${s.title}](${s.url})${s.snippet ? ` — ${s.snippet}` : ""}`)
                .join("\n")
            : "",
          result.usage
            ? `\n**Usage:** ${result.usage.prompt_tokens}↑ ${result.usage.completion_tokens}↓ (${result.usage.total_tokens} total)` +
              (result.usage.cost ? ` • $${result.usage.cost.toFixed(4)}` : "")
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        return {
          content: [{ type: "text", text }],
          details: result,
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `OpenRouter request failed: ${err.message}` }],
          isError: true,
        };
      }
    },
  });
}
