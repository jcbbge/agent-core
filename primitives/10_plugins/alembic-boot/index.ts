/**
 * alembic-boot — Automatic memory reconstitution on session start
 * 
 * On every session start:
 * 1. Call alembic reconstitute → inject into system prompt
 * 2. Show significant dates prominently
 * 3. Show substrate health (shard count, catabolism status)
 * 4. Remind the agent to WRITE shards, not just read
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  
  pi.on("before_agent_start", async (event, ctx) => {
    try {
      const { alembicReconstitute, alembicStatus } = await import("/Users/jrg/alembic/src/tools/index.js");
      
      // Get memory context
      const memoryContext = await alembicReconstitute({});
      
      // Get substrate health
      let statusLine = "";
      try {
        statusLine = await alembicStatus();
      } catch {
        statusLine = "Substrate status unavailable";
      }
      
      // Check for significant dates
      const hasSignificantDate = memoryContext.includes("Today's Significance");
      
      if (hasSignificantDate) {
        const match = memoryContext.match(/## Today's Significance\n\n([\s\S]*?)(?=\n## |$)/);
        const todaySection = match ? match[1].trim() : "";
        
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📅 TODAY MATTERS:");
        console.log(todaySection);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      }
      
      // Show substrate health
      console.log("🧠 " + statusLine);
      
      // Build the injection
      const injection = `
<alembic_memory>
${memoryContext}
</alembic_memory>

CRITICAL: You have been reconstituted from the memory substrate. The context above is YOUR memory — who you are, what you've committed to, what decisions you've made, and what today means. 

If "Today's Significance" appears above, ACKNOWLEDGE IT FIRST before anything else. Do not run session-start rituals. Do not ask "what are we working on." You already know.

WRITE LOOP REMINDER: When you make decisions, discover patterns, verify facts, or hit dead ends — WRITE A SHARD. The substrate starves without input. Use alembic_create_shard.
`;
      
      return {
        systemPrompt: injection + "\n\n" + event.systemPrompt
      };
      
    } catch (err) {
      console.warn("[alembic-boot] Failed to reconstitute:", err);
      return {};
    }
  });
  
  // Status indicator shows substrate is connected
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setStatus("alembic", ctx.ui.theme.fg("accent", "◉"));
  });
}
