/**
 * no-fabrication — injects the epistemics rule into the system prompt EVERY
 * turn (not just session start), so it survives long sessions where turn-one
 * instructions decay under task pressure.
 *
 * This is the pi-specific conditioning layer of a harness-agnostic stack:
 *   - convention:  SOURCES: line in commit-convention.md (git, agnostic)
 *   - process:     verify-then-write skill (any harness, agnostic)
 *   - mechanical:  ~/dotfiles/bin/verify-sources git hook (bash, agnostic)
 *   - context:     CLAUDE.md + AGENTS.md EPISTEMICS blocks (agnostic-ish)
 *   - this file:   per-turn injection (pi only)
 *
 * Installed 2026-07-17 at jrg's explicit direction ("do it all").
 */

const RULE = `
EPISTEMICS — non-negotiable:
- A fact stated must have a source acquired THIS session: a file read, a command run, a URL fetched, or the user's words. No exceptions for "well-known" values — well-known is what confabulation feels like from the inside.
- Acquire before assert: for any external-reality value (spec, price, version, API shape, model parameter), the fetch is the FIRST tool call, before any edit.
- No source → field omitted or written UNKNOWN → ask the user. Never a plausible value. Guess-and-disclose is banned: the caveat dies with the session; the fabricated value persists looking verified.
- Configs/specs: cite the source inline in the same message the value is written. Commits carry a SOURCES: line.
- Underspecified task → clarifying question BEFORE work, not caveats after.
- "I don't know" is a correct, complete answer.`;

export default function (pi: any) {
  pi.on("before_agent_start", (event: any) => {
    return {
      systemPrompt: event.systemPrompt + "\n" + RULE,
    };
  });
}
