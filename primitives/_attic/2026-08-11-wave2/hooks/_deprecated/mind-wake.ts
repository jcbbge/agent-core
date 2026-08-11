/**
 * Circadian mind-wake — file-based memory injection before_agent_start.
 *
 * Standalone by design (Law 7 of mind/MIND-SPEC.md: no DB in the wake
 * path): reads mind/{SELF,USER,NOW,greeting}.md directly with plain fs and
 * builds the same injection payload as src/wake.ts in the circadian repo
 * (staleness rule + 15k token hard cap + OVER-CAP announcement). Any
 * failure — missing mind dir, unreadable file — returns {} so the session
 * boots clean instead of failing before_agent_start.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Mirrors the CIRCADIAN_HOME contract in circadian/src/wake.ts: env override,
// default ~/circadian, mind data at $CIRCADIAN_HOME/mind.
const CIRCADIAN_HOME = process.env.CIRCADIAN_HOME || join(homedir(), "circadian");
const MIND = join(CIRCADIAN_HOME, "mind");
const CAP_TOKENS = 15000;
const STALE_MS = 48 * 60 * 60 * 1000;

function extractLastSleep(nowMd: string): string | null {
  const match = nowMd.match(/##\s*Last sleep\s*\n+\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

function buildPayload(files: { self: string; user: string; now: string; greeting: string }): string {
  const { self, user, now, greeting } = files;

  const lastSleepRaw = extractLastSleep(now);
  const lastSleepDate = lastSleepRaw ? new Date(lastSleepRaw) : null;
  const isValidDate = lastSleepDate instanceof Date && !isNaN(lastSleepDate.getTime());
  // An unparseable/missing "Last sleep" timestamp is treated as stale — never
  // silently assume freshness when the record is broken.
  const isStale = isValidDate ? Date.now() - lastSleepDate!.getTime() > STALE_MS : true;

  let greetingBlock = greeting.trim();
  if (isStale) {
    const staleLine = isValidDate
      ? `STALENESS WARNING: last sleep was ${lastSleepRaw} — more than 48h ago. Treat NOW.md as potentially outdated.`
      : `STALENESS WARNING: no parseable "Last sleep" timestamp in NOW.md — treating as stale.`;
    greetingBlock = `${staleLine}\n${greetingBlock}`;
  }

  const body = [
    "[Circadian] WAKE — memory substrate injection from ~/mind (see ~/mind/MIND-SPEC.md).",
    "",
    "<mind:self>",
    self.trim(),
    "</mind:self>",
    "",
    "<mind:user>",
    user.trim(),
    "</mind:user>",
    "",
    "<mind:now>",
    now.trim(),
    "</mind:now>",
    "",
    "<mind:greeting-instruction>",
    "Open your FIRST reply to the user with the greeting content below, verbatim, before anything else. The greeting orients to the work — the current arc, the live tension, the next move — never to the memory system itself (Law 8).",
    "",
    greetingBlock,
    "</mind:greeting-instruction>",
  ].join("\n");

  const tokens = Math.ceil(body.length / 4);
  if (tokens > CAP_TOKENS) {
    // Law 4: never truncate silently — announce loudly and still emit the
    // full payload.
    return `OVER-CAP: payload ${tokens} tokens > ${CAP_TOKENS} — compost required\n${body}`;
  }
  return body;
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event: any) => {
    try {
      const self = readFileSync(join(MIND, "SELF.md"), "utf8");
      const user = readFileSync(join(MIND, "USER.md"), "utf8");
      const now = readFileSync(join(MIND, "NOW.md"), "utf8");
      const greeting = readFileSync(join(MIND, "greeting.md"), "utf8");

      const injection = buildPayload({ self, user, now, greeting });

      try {
        appendFileSync(
          join(MIND, "scoreboard.jsonl"),
          JSON.stringify({
            ts: new Date().toISOString(),
            type: "wake",
            worldview_tokens: Math.ceil(self.length / 4),
          }) + "\n"
        );
      } catch {
        // scoreboard append failure must never withhold the injection below
      }

      return { systemPrompt: injection + "\n\n" + event.systemPrompt };
    } catch {
      // ~/mind missing/unreadable, or any other failure — never take the
      // session down (Law 7)
      return {};
    }
  });
}
