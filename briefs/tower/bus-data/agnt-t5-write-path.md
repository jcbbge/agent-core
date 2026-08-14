# AGNT unit [write-path] — prove or patch Tower board writers + reader tolerance (T5+T6)

Repo `/Users/jrg/agent-core` on branch `tower/board-write-path-hardening`. Prove the live write path; patch gaps; document schema (Obj4); prove readers tolerate machine rows without `from`. Do NOT use emojis anywhere. Prefer `cursor-fleet make` bifurcation (this brief IS that unit).

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Canonical code (symlinked from `~/.tower/`):
  - `primitives/hooks/tower-ledger.mjs:76` — `append = (file, obj) => appendFileSync(file, JSON.stringify(obj) + '\n')` — serializer yes, newline yes, **no lock**, **no schema rejection**.
  - `primitives/mcps/tower/server.mjs:240-247` — `board_post` sets `from: args.from` optional; authorless authored types still writable.
  - `primitives/mcps/tower/cli.mjs` post (~L150-163) — `JSON.stringify` + defaults `from` to `cli:$USER`.
  - `server.mjs:249-252` `board_read` already renders `${r.from ?? '?'}` — check peers.
  - `tower-ledger.mjs` `boardFor` / `renderMessage` uses `m.from ?? 'unknown'` / does not require from.
  - `primitives/tools/statem/twr.ts` imports boardFor; uses `r.from ?? '?'`.
- Deploy identity: `~/.tower/{server,cli,lib}.mjs` and `COMMS-ARCH.md` are symlinks into canonical home — patching repo deploys.
- Doc hole: `primitives/skills/brief/SKILL.md` lines 54–58 still teach hand-append JSON to `~/.tower/board.jsonl`. `COMMS-ARCH.md` ~L177–182 names this hole.
- CORD Obj4 schema: authored mail = `type` + required `from`; machine emissions = `kind` + `via`. Do not invent authors for lineage/bypass.
- Required patches if guarantees missing:
  (a) `board_post` requires non-empty `from` for authored types (claim|finding|note at minimum)
  (b) Replace brief/SKILL.md hand-append with `bun ~/.tower/cli.mjs post ...`
  (c) Document machine vs authored row kinds (COMMS-ARCH or tower README — pick one canonical place, link from proof)
  (d) Any additional hardening proved necessary (lock / validate) without taking server down without a stated window
- Tests exist: `primitives/mcps/tower/cli.test.mjs`, `server-drift.test.mjs` — extend rather than invent a second harness when possible.
- Output proof path (exact): `/Users/jrg/agent-core/briefs/tower/bus-data/WRITE-PATH-PROOF.md`
- Partition for code: `primitives/mcps/tower/**`, `primitives/hooks/tower-ledger.mjs`, `primitives/skills/brief/SKILL.md`. Optionally propose (do not require) cursor-shim printf hardening for lineage/bypass — if risky, write proposal section in proof only.
- Do not commit (ORCH integrates). Do not rewrite board.jsonl. Do not git-add backups.

## Parallel Work Notice

- CORD tower (w2Y) owns plane proofs / retention — stay off.
- Data recovery waves finished; board still has 26 historically bad lines (expected). Append-only.
- Ignore dirty `primitives/profiles/models.json` and unrelated briefs.

## Tower

- CLAIM/findings on `tower/bus-data`, from=`AGNT write-path` (coder) / `AGNT write-path-tests` (test-maker).
- Prove posts via cli.mjs or MCP — never hand-append.
- spine-report task/verdict.

## Tasks

### Implementer (coder)
1. Audit write path against guarantees: serializer, newline, locking, malformed rejection, repo↔deploy identity, brief hand-append instruction presence. — done when: findings written into WRITE-PATH-PROOF.md draft sections.
2. Patch gaps (a)(b)(c)(+d if proved). Authored `board_post` without non-empty `from` must reject with clear error and must NOT append. — done when: code+docs changed under partition; deploy symlinks still point at patched files.
3. Reader tolerance (T6): confirm `boardFor` / `board_read` / `twr` do not throw on machine rows lacking `from`; add regression test OR checklist with exact commands+outputs in WRITE-PATH-PROOF.md. — done when: evidence in proof.
4. Live prove after patch: (i) round-trip `bun ~/.tower/cli.mjs post note tower/bus-data "write-path round-trip <id>" --from "AGNT write-path"` lands parseable on board; (ii) MCP/server path omitting `from` for authored type is rejected (script a minimal server handler call or existing test); (iii) `rg -n "board.jsonl" primitives/skills/brief/SKILL.md` no longer teaches hand-append. — done when: proof file records commands+outputs.
5. Write `briefs/tower/bus-data/agnt-t5-write-path.done`.

### Test-maker
- Author executable criteria/tests covering: from-required rejection, cli default-from still works, brief skill has no hand-append, readers tolerate missing from on kind=lineage sample, append still newline-terminated JSON. No mocks. Do not read implementer code when deriving intent tests.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/WRITE-PATH-PROOF.md`, `briefs/tower/bus-data/agnt-t5-write-path.done`, `primitives/mcps/tower/**`, `primitives/hooks/tower-ledger.mjs`, `primitives/skills/brief/SKILL.md`. Do not commit.
- Testing: real append paths; extend `primitives/mcps/tower/*.test.mjs`.
- No board rewrite. No server downtime without stated window in proof.
- Workers never commit.

## Report back with

- paths changed
- WRITE-PATH-PROOF.md path
- prove commands + outputs (round-trip, reject-without-from, brief rg, reader check)
- residual risks (lock absence etc.) explicitly listed
- whether cursor-shim printf path was patched or only proposed
