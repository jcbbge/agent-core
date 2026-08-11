# Agent profiles (pi × control-flow)

Five profiles map to [control-flow.md](../rules/control-flow.md). Each has
**exactly three** model options resolved through **pi's `cursor` provider**
(the inference gateway, reached via the `pi-cursor-sdk` extension — pi
0.84.1, `@cursor/sdk`). pi is the only launcher. Prompts are model-agnostic;
swap models via `selection.json` / `profile-model set` / `--profile
name:option`.

Authority files in this directory:

| File | Role |
|---|---|
| `models.json` | Machine registry: `default` + 3 `options` per profile |
| `selection.json` | Active picks only (local; gitignored) |
| `profile-model` | CLI: `get` / `set` / `list` |
| `*.md` | Model-agnostic role prompts |

## Model ID grammar (pi cursor provider)

`cursor/<id>[@ctx][:suffix]` — verified against
`pi-cursor-sdk/README.md` and `pi --offline --list-models` (2026-08-11):

- `<id>` — base model id from the cursor catalog (e.g. `grok-4.5`, `kimi-k3`,
  `claude-opus-5`, `composer-2.5`).
- `@ctx` — context-window variant: `@1m`, `@300k`, `@272k`, `@200k` (only the
  variants a model actually publishes; e.g. `claude-opus-5@300k`,
  `gpt-5.6-sol@272k`).
- `:suffix` — **one** suffix slot, either a pi thinking level
  (`off|minimal|low|medium|high|xhigh|max`, valid only where the catalog's
  `thinking` column is `yes`) **or** a speed alias (`:fast` / `:slow`, valid
  only where the model exposes a `fast` param in the gateway catalog).

## Table (verified 2026-08-11)

Every value below was verified present in `pi --offline --list-models` (base
id / `@ctx` / `:fast` rows) and resolves through `profile-model get`. Thinking
`:high` is applied only to `thinking=yes` models.

| Profile | Role | Default key | Default model | Other options |
|---|---|---|---|---|
| `concierge` | CONCIERGE | **grok** | `cursor/grok-4.5:high` | `claude`→`cursor/claude-opus-5@300k:high`, `open`→`cursor/kimi-k3:high` |
| `coordinator` | CORD | **open** | `cursor/kimi-k3:high` | `claude`→`cursor/claude-sonnet-5@300k:high`, `gpt`→`cursor/gpt-5.6-sol@272k:high` |
| `orchestrator` | ORCH | **grok** | `cursor/grok-4.5:high` | `claude`→`cursor/claude-opus-5@300k:high`, `luna`→`cursor/gpt-5.6-luna@272k:high` |
| `coder` | AGNT | **composer** | `cursor/composer-2.5` | `kimi`→`cursor/kimi-k2.7-code`, `luna`→`cursor/gpt-5.6-luna@272k:high` |
| `researcher` | SAGT | **fast** | `cursor/composer-2.5:fast` | `grok`→`cursor/grok-4.5:fast`, `open`→`cursor/kimi-k3` |

Notes: `composer-2.5` and `kimi-k2.7-code` are `thinking=no` in the catalog, so
they carry no thinking suffix (composer uses `:fast` for the researcher default
instead). All other options are `thinking=yes`.

## Stacking verdict — `:fast` + thinking (verified 2026-08-11)

**Unsupported in a single ID.** `:fast`/`:slow` and the thinking `:level`
occupy the same single `:suffix` slot. The `pi-cursor-sdk` extension registers
them as separate virtual aliases and does **not** register any stacked
`id:fast:high` form — `pi --offline --list-models` has **0** rows matching
`:(fast|slow):(off|…|max)`. A live `pi --model cursor/grok-4.5:fast:high`
did not error, but that is pi's fuzzy pattern matcher, not a real stacked
alias, so it is not a reliable contract.

To combine fast mode with a thinking level, put `:fast` in the ID and pass the
thinking level as a **flag**: verified live —
`pi --model cursor/grok-4.5:fast --thinking high -p …` → `OK`. spine-spawn
should therefore carry `--thinking` separately rather than encoding it in the
slug alongside `:fast`.

## Live smoke (5 defaults, 2026-08-11)

`pi --model <slug> --no-session -p "Reply with exactly OK and nothing else."`
— all returned `OK`, exit 0:

| Profile | Default slug | Result |
|---|---|---|
| concierge | `cursor/grok-4.5:high` | OK |
| coordinator | `cursor/kimi-k3:high` | OK |
| orchestrator | `cursor/grok-4.5:high` | OK |
| coder | `cursor/composer-2.5` | OK |
| researcher | `cursor/composer-2.5:fast` | OK |

## Usage

```bash
profile-model get concierge
profile-model set concierge claude
profile-model list
spine-spawn orch --task demo --kind pi --profile orchestrator --brief ./brief.md --workspace "$HERDR_WORKSPACE_ID"
spine-spawn worker --label agnt-demo --kind pi --profile coder:luna --brief ./brief.md
```
