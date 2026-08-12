// Session Boundary Contract, legs 2-3, for the pi harness.
//
// Canonical contract: ~/agent-core/primitives/rules/session-lifecycle.md
// (SS "The Session Boundary Contract"):
//   2. Last TODO: handoff (provider + authority: `git log` — repo is truth)
//   3. Flight snapshot pointer, <24h (provider: ~/.tower/flight/)
//
// Leg 1 (Tower carry-over) is already covered by tower-auto.ts's
// before_agent_start inbox injection; leg 4 (memory substrate) by the
// circadian-mind shim. This extension covers ONLY legs 2-3, mirroring the
// exact logic already proven in ~/.tower/hooks/session-start.mjs
// (claude-code's adapter for the same legs, lines 36-58) so both harnesses
// read the same authorities and never mint a second copy of the data (law 3
// in session-lifecycle.md).
//
// Event choice: before_agent_start, not session_start.
//   - Only before_agent_start's handler result is consumed for context
//     injection: BeforeAgentStartEventResult { message: { customType,
//     content, display, details } } — see
//     /opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts:805-808,
//     registered at :882. This is the exact API tower-auto.ts already uses
//     to inject the Tower inbox (tower-auto.ts:303-309).
//   - session_start (types.d.ts:869) has no result type in the `on()`
//     overload — its handler is void, side-effect-only. grounding-hook.ts
//     uses it that way at line 108-110 (`pi.on("session_start", async
//     (_event, ctx) => { state.delete(sid(ctx)); })`), never to inject
//     context.
//   - before_agent_start fires on EVERY user turn, not just the first, so a
//     module-scope boolean guard (`injected`) makes it fire exactly once per
//     session: the module is freshly loaded exactly once per pi process
//     (jiti loads it at boot; /reload re-imports it fresh, resetting the
//     flag along with it), so `injected` starts false exactly once per
//     session and flips true after the first call, before any early return
//     — the same module-scope-state pattern tower-auto.ts already relies on
//     for its own per-session state (tower-auto.ts:212, "module scope —
//     dies with the pi process; see v1 limitation").
//
// A recorder never blocks the flight: every step is wrapped so this
// extension can never throw into pi's event loop or delay a turn. Silent
// when there is nothing to say (not a git repo, no TODO: line, no fresh
// flight snapshot) — matching session-start.mjs's silent-when-clear rule.

import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FLIGHT = join(homedir(), ".tower", "flight");

function handoffLine(cwd: string): string | undefined {
  try {
    const log = execSync('git log --format="%h %s%n%b" -5', {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    const todoMatch = log.match(/^([0-9a-f]+ .+)$[\s\S]*?^TODO: (.+)$/m);
    if (todoMatch && todoMatch[2].trim() !== "—") {
      return `[Tower] Last handoff (${todoMatch[1].split(" ")[0]}): TODO: ${todoMatch[2]}`;
    }
  } catch {
    // not a git repo, or git unavailable — nothing to say
  }
  return undefined;
}

function flightPointerLine(): string | undefined {
  try {
    const snaps = readdirSync(FLIGHT)
      .map((f) => ({ f, m: statSync(join(FLIGHT, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (snaps.length > 0 && Date.now() - snaps[0].m < 24 * 60 * 60 * 1000) {
      return `[Tower] Flight snapshot from the previous context: ${join(FLIGHT, snaps[0].f)} - read it if the handoff above seems incomplete.`;
    }
  } catch {
    // no flight dir, or unreadable — nothing to say
  }
  return undefined;
}

export default function (pi: any) {
  let injected = false; // fired-once guard: module scope dies with the pi process

  pi.on("before_agent_start", async (_event: any, ctx: any) => {
    if (injected) return;
    injected = true; // flip before any work — never retry on error, never repeat on later turns

    try {
      const cwd = ctx?.cwd ?? process.cwd();
      const lines: string[] = [];

      const handoff = handoffLine(cwd);
      if (handoff) lines.push(handoff);

      const pointer = flightPointerLine();
      if (pointer) lines.push(pointer);

      // Boot card stamp (primitives/tools/boot-card/): which Session
      // Boundary Contract legs this extension actually loaded this run.
      // This extension owns legs 2-3 only; leg 1 is tower-auto's, leg 4 is
      // circadian-mind's — reported by name, never re-derived here.
      try {
        const stamp = `[boot] handoff ${handoff ? "✓" : "✗(none declared)"} · flight ${pointer ? "✓" : "✗(none<24h)"} · tower: tower-auto extension · memory: circadian-mind extension`;
        lines.push(stamp);
      } catch {
        // a recorder never blocks the flight: stamp failure must never break the extension
      }

      if (lines.length === 0) return; // silent when there is nothing to say

      return {
        message: {
          customType: "session-boundary",
          content: lines.join("\n\n"),
          display: true,
        },
      };
    } catch {
      // a recorder never blocks the flight
      return;
    }
  });
}
