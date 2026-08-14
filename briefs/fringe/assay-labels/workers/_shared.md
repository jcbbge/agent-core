# SHARED — assay-build AGNT contract

You are an AGNT under orch-assay-build. Build the `assay` Zig instrument.
Do NOT use emojis anywhere. Never commit. Never run `agent-core sync`.
Never write to `~/circadian` (read-only). Name law: never use "molt"/"molting".

## Board
- Topic: `circadian/memory-assay`
- FIRST action: `cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post claim circadian/memory-assay "CLAIM <your-name>: <one line>" --from <your-name>`
- Findings: same CLI with `post finding`
- Questions: UP to board as finding addressed to orch-assay-build — never operator

## Truth law
Unparseable / schema drift / missing LLM → literal `UNKNOWN` / skip-count; never invent numbers.
Exit codes (must match lib): 0 ok · 2 usage · 3 I/O · 4 schema-UNKNOWN · 5 LLM-unavailable (degraded output still written).

## Vein reuse (do not fork the walk)
Import vein as a sibling Zig module from
`/Users/jrg/agent-core/primitives/tools/vein/src/lib.zig`.
Use `vein.session.discoverAll`, `selectLastN`, `resolveRef`, `parseSessionsFile`
and existing JSONL schema knowledge. Do NOT copy-diverge session discovery.

## Zig
- Version: 0.16.0 (`zig version` must print that)
- Target: macOS arm64, stdlib only (+ HTTP to local LLM for classify)
- Build from: `cd ~/agent-core/primitives/tools/assay && zig build && zig build test`

## Final action
When done-when is met: board finding `DONE <your-name>: <summary>` then
`touch` your assigned `.done` path. Idle after that is correct.
