/**
 * Alembic Extension — Pi
 * 
 * Thin adapter — delegates all logic to shared tools.
 * Registers: archimedes_reflex, alembic_reconstitute, alembic_snapshot tools
 * + alembic-status command
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
  archimedesReflex,
  alembicReconstitute,
  alembicSnapshot,
  alembicStatus,
  alembicCreateShard,
  alembicOverview,
} from "/Users/jrg/alembic/src/tools/index.js";

export default function alembicExtension(pi: ExtensionAPI) {

  pi.registerTool({
    name: "archimedes_reflex",
    label: "Archimedes Reflex",
    description: "Query the Alembic memory substrate using semantic vector search. Use when you need information that should exist in memory but isn't in context.",
    promptSnippet: "Semantic search of memory substrate (page fault)",
    promptGuidelines: [
      "Use archimedes_reflex when you detect missing context that should be in memory",
      "Provide a natural language query - it uses semantic similarity, not keywords",
      "Identity shards are always included regardless of query",
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Natural language description of what you need" }),
      episode_id: Type.Optional(Type.String({ description: "Optional: scope to specific episode" })),
      limit: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await archimedesReflex(params as any);
        return { content: [{ type: "text", text: result }], details: { resolved: true } };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `[Archimedes Reflex] Failed: ${message}` }], details: { error: message, resolved: false } };
      }
    },
  });

  pi.registerTool({
    name: "alembic_reconstitute",
    label: "Alembic Reconstitute",
    description: "Cold-start reconstitution from the memory substrate. Loads identity, commitments, decisions, and recent insights. Use at session start or when you need to recover full context.",
    promptSnippet: "Recover agent identity and context from substrate",
    promptGuidelines: [
      "Use alembic_reconstitute at the start of a session for cold-start recovery",
      "Returns identity shards, commitments, decisions, and recent insights",
      "Can reconstitute as-of a past date for historical context",
    ],
    parameters: Type.Object({
      as_of: Type.Optional(Type.String({ description: "ISO date string for historical reconstitution (e.g., '2026-04-20')" })),
      max_tokens: Type.Optional(Type.Number({ description: "Token budget for reconstituted context (default 8000)" })),
      include_recent_work: Type.Optional(Type.Boolean({ description: "Include last active episode context (default true)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await alembicReconstitute(params as any);
        return { content: [{ type: "text", text: result }], details: { resolved: true } };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `[Alembic Reconstitute] Failed: ${message}` }], details: { error: message, resolved: false } };
      }
    },
  });

  pi.registerTool({
    name: "alembic_snapshot",
    label: "Alembic Identity Snapshot",
    description: "Create a versioned identity snapshot for recovery. Use before major changes or periodically as backup.",
    promptSnippet: "Create identity checkpoint",
    promptGuidelines: [
      "Use alembic_snapshot before making significant identity changes",
      "Snapshots preserve all current identity shards for later recovery",
    ],
    parameters: Type.Object({
      description: Type.Optional(Type.String({ description: "Description of this snapshot" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await alembicSnapshot(params as any);
        return { content: [{ type: "text", text: result }], details: { resolved: true } };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `[Alembic Snapshot] Failed: ${message}` }], details: { error: message, resolved: false } };
      }
    },
  });

  pi.registerTool({
    name: "alembic_create_shard",
    label: "Alembic Create Shard",
    description: "Write a memory to the substrate. Call when something significant happened: decision made, insight discovered, fact verified, dead end hit.",
    promptSnippet: "Write a memory shard to the substrate",
    promptGuidelines: [
      "Call when you make a decision, discover a pattern, verify a fact, or hit a dead end",
      "Pattern triggers: 'decided to', 'realized', 'confirmed', 'didn't work because'",
      "Auto-ingest extension handles most cases, but call manually for important shards",
    ],
    parameters: Type.Object({
      type: Type.String({ description: "Shard type: decision, insight, fact, dialogue, identity" }),
      content: Type.String({ description: "The memory content to store" }),
      tags: Type.Optional(Type.Array(Type.String(), { description: "Tags for categorization" })),
      summary: Type.Optional(Type.String({ description: "Brief summary for reconstitution" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const result = await alembicCreateShard(params as any);
        return { content: [{ type: "text", text: result }], details: { resolved: true } };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `[Alembic Create Shard] Failed: ${message}` }], details: { error: message, resolved: false } };
      }
    },
  });

  pi.registerTool({
    name: "alembic_overview",
    label: "Alembic Overview",
    description: "Get a complete overview of what Alembic is and how to use it. Call when you need to remember what alembic is or what tools to use.",
    promptSnippet: "What is Alembic and how do I use it?",
    promptGuidelines: [
      "Call when you're unsure what alembic is or how to use it",
      "Returns substrate state, tool descriptions, and usage patterns",
    ],
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      try {
        const result = await alembicOverview();
        return { content: [{ type: "text", text: result }], details: { resolved: true } };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `[Alembic Overview] Failed: ${message}` }], details: { error: message, resolved: false } };
      }
    },
  });

  pi.registerCommand("alembic-status", {
    description: "Check Alembic substrate status",
    handler: async (_args, ctx) => {
      try {
        const result = await alembicStatus();
        ctx.ui.notify(result, "info");
      } catch (error) {
        ctx.ui.notify(`Alembic error: ${error}`, "error");
      }
    },
  });
}
