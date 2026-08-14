# proem PHASE 1 — cache probe report

**Date:** 2026-08-11 · **By:** cord-proem (probe executed by orch-proem-probe,
evidence independently re-parsed and extended by cord-proem)
**Question:** does the pi gateway's cache reward byte-identical prompt
prefixes across separate spawns?
**Verdict: DOES-NOT-PAY (not client-controllable).** Cache hits exist but
are stochastic and server-side; byte-identical geometry neither guarantees
nor measurably increases them. PHASE 2 (build proem) is OFF per the brief.

## Evidence

### Probe matrix (orch-proem-probe; cursor/grok-4.5, `pi -p --no-tools`, sequential, ~13 s apart)

Shared prefix = `research/fringe-tooling-brainstorm.md` (26,802 B ≈ 6.7k
tokens; NOT part of pi's injected system prompt). p4 = 4× concatenation
(≈27k tokens). Tail nonce per spawn defeats whole-response caching.
H-arm = unique junk line prepended at the HEAD (kills prefix match).

| tag | input | cacheRead | cacheWrite | note |
|-----|------:|----------:|-----------:|------|
| B0  | 31593 | 0 | 0 | bare baseline |
| A1  | 38210 | 0 | 0 | prime small (+6617 = p1 ✓) |
| A2  | 38210 | 0 | 0 | byte-identical repeat — MISS |
| A3  | 38210 | 0 | 0 | byte-identical repeat — MISS |
| H1  | 21843 | 16384 | 0 | control (payload misconstructed, smaller) |
| H2  | 38227 | 0 | 0 | control — clean |
| C1  | 58061 | 0 | 0 | prime large (+26.5k = p4 ✓) |
| C2  | 58061 | 0 | 0 | byte-identical repeat — MISS |
| C3  | 58076 | 0 | 0 | byte-identical repeat — MISS |

Sessions: `/tmp/proem-probe/sessions/` (may be cleaned; table is the record).

### Within-session positive control (cord-proem, same window, same model/flags)

Two-turn session (`--continue`): turn 2's prompt necessarily contains turn
1's full 38k-token context — a guaranteed prefix match.

| turn | input | cacheRead |
|------|------:|----------:|
| T1 | 38260 | 0 |
| T2 | 46915 | **0** — even a guaranteed within-session repeat does not pay |

### Spontaneous hits (the instrument works — hits are real, just not inducible)

- cord-proem verification spawn 19:57Z, bare prompt, fresh session:
  cacheRead=31552 (pi system prefix, hot from fleet traffic). Two minutes
  later B0, identical shape: cacheRead=0.
- H1: cacheRead=16384 on a perturbed payload (partial/block-granularity hit).
- Historical scan of `~/.pi/agent/sessions/*/*.jsonl` (400 newest):
  grok-4.5 cacheRead 40064/46464/172864 (2026-08-11 ~06:19Z); glm-5.2 up to
  135136; claude-opus-4-8@1m:fast up to 638657; kimi-k3 4879. All
  cacheWrite=0 on the cursor gateway.
- anthropic-direct sessions (June 2026) show systematic cacheRead/cacheWrite
  with real dollar costs — cache geometry DOES pay on cache-reporting
  providers. The fleet's current path (cursor gateway) reports but does not
  reliably reward it.

## Interpretation

6/6 cross-spawn identical-repeat opportunities missed; 1/1 within-session
guaranteed repeat missed; spontaneous hits occur at server discretion
(admission/eviction/routing invisible to the client — mechanism UNKNOWN,
not asserted). Conclusion: on grok-4.5 via the cursor gateway, prompt-cache
warmth cannot be engineered from the client side. A cache-geometry compiler
whose payoff is cache hits has no payoff to compile for.

## Design note — what geometry still buys (context budget, not cache)

1. **Role-sliced wake is still the real lever — for input tokens, not
   cache.** A bare headless spawn already costs ~31.5k input tokens before
   any brief (pi system prompt + AGENTS.md + extension context). Slicing
   the circadian wake (AGNT/SAGT get constitution + top-N atoms + relevant
   NOW slice, not the full flood) reduces billed/computed input on EVERY
   spawn, cache or no cache. That is a context-budget tool, measurable via
   the same usage records (`input` per spawn), no cache dependency.
2. **Volatility-at-the-tail still buys** clean diffs, auditability, and
   free upside: if the fleet ever routes through a cache-reporting provider
   (anthropic-direct evidence above), byte-identical prefixes pay
   automatically. Keeping the geometry costs nothing.
3. **The manifest line survives on its own merits** — `role=AGNT slice=N
   atoms prefix=shared/3` makes wake-slice auditing explicit; that value is
   independent of caching.
4. **Do not build** the full proem compiler as specified (cache-geometry
   payoff). The surviving idea is a wake-slicer (context budget). That is a
   new scoping decision for the operator, outside this project's brief.

## Reproduction

Commands and spawn matrix: `briefs/fringe/orch-proem-probe.md` (§The
experiment). Positive control: `pi -p --model cursor/grok-4.5 --no-tools
--session-dir <dir> "<long payload>"` then same with `--continue`.
