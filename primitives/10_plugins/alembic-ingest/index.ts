/**
 * alembic-ingest — Automatic shard emission on significant patterns
 * 
 * Scans every agent response for decision/insight/fact patterns.
 * When detected, auto-writes to the substrate. No manual discipline required.
 * 
 * The agent doesn't have to remember to write. The substrate feeds itself.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Pattern triggers — when these appear in agent output, emit a shard
const EMITTERS: Record<string, RegExp> = {
  decision: /\b(decided|choosing|going with|we('ll| will) use|architecture:|the approach is|settling on)\b/i,
  insight: /\b(realized|pattern:|the key is|turns out|discovered that|the insight is|what I learned)\b/i,
  fact: /\b(confirmed:|verified:|the answer is|it works because|the reason is)\b/i,
  dead_end: /\b(didn't work|failed because|won't work|dead end|abandoned|ruled out)\b/i,
};

// Extract the most significant sentence containing the pattern
function extractSignificant(text: string, pattern: RegExp): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if (pattern.test(sentence) && sentence.length > 20 && sentence.length < 500) {
      return sentence.trim();
    }
  }
  return null;
}

export default function (pi: ExtensionAPI) {
  
  pi.on("after_agent_response", async (event, ctx) => {
    const response = event.response?.content;
    if (!response || typeof response !== "string") return;
    
    // Don't ingest from tool calls or very short responses
    if (response.length < 100) return;
    
    try {
      const { createShard } = await import("/Users/jrg/alembic/src/db/client.js");
      const { SubstrateClient } = await import("/Users/jrg/alembic/src/db/client.js");
      
      const client = new SubstrateClient();
      await client.connect();
      
      for (const [type, pattern] of Object.entries(EMITTERS)) {
        if (pattern.test(response)) {
          const content = extractSignificant(response, pattern);
          if (content) {
            // Map dead_end to insight type (it's a kind of insight)
            const shardType = type === "dead_end" ? "insight" : type;
            
            // Get or create today's episode
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
            const episodeId = `episode:pi_${today}`;
            
            await createShard(client, {
              episodeId,
              role: "assistant",
              type: shardType,
              content,
              tags: ["auto-ingest", type],
              metadata: { source: "alembic-ingest", pattern: type },
              skipEmbedding: false,
            });
            
            // Visual feedback
            ctx.ui.notify(`📝 Shard: ${type}`, "info");
            break; // One shard per response max
          }
        }
      }
    } catch (err) {
      // Silent fail — don't interrupt the session for ingest failures
      console.warn("[alembic-ingest] Failed:", err);
    }
  });
}
