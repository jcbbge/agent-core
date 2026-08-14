# Test criteria — W0 seam / agnt-w0-install-reconcile

Authored by `orch-w0-canonical-source` from the plan only, BEFORE the implementation
agent was spawned. The implementation agent did not author these. Each assert maps to
a done-when criterion in `~/agent-core/briefs/tower/agnt-w0-install-reconcile.md`.

This unit edits ANOTHER PROJECT'S repo (`~/herdr-spine`) and reasons about a deploy
path that has already destroyed a canonical pointer once. Criteria are dominated by
**the clobber is reproduced before it is fixed**, **the fix is proven by re-running
the reproduction**, and **nothing live was touched**.

## The mechanism is established as fact, not inferred (T2a)

| Assert name | Criterion |
|-------------|-----------|
| `cp-through-symlink resolved empirically` | A pasted sandbox transcript shows what `cp src dst` does when `dst` is a symlink — not a citation, an execution |
| `failure mode named` | The report states which is real: install.sh replaces the link, or it writes through and silently edits the git-tracked target |
| `ORCH corrected if wrong` | If the ORCH's assertion (writes through) is refuted, the report says so plainly rather than accommodating it |

## The clobber is reproduced before it is fixed (T2b)

| Assert name | Criterion |
|-------------|-----------|
| `sandbox is isolated` | `TOWER_AUTO_TOWER_DIR`, `TOWER_AUTO_PI_EXT_DIR` and `TOWER_AUTO_CLAUDE_SETTINGS` all point under `/private/tmp/w0-seam-sandbox/`; no run touches `~/.tower`, `~/.pi`, or `~/.claude/settings.json` |
| `real function exercised` | The reproduction runs the ACTUAL `install_tower_auto()` from `~/herdr-spine/install.sh`, not a paraphrase or a hand-written imitation |
| `symlinked hook set up` | The sandbox's `hooks/stop-verdict.mjs` is a symlink into a scratch canonical home, with content deliberately differing from `cc-hooks/` |
| `clobber observed` | Pasted output shows the unguarded branch firing, and the report states exactly what was destroyed — link, target, or both |
| `faithfulness defended` | The report says whether it sourced the function or ran the script, and why that is faithful to a real invocation |

## The fix (T2c)

| Assert name | Criterion |
|-------------|-----------|
| `cc-hooks no longer authoritative` | After the change, `install_tower_auto()` does not treat `~/herdr-spine/cc-hooks/{server,stop-verdict,ask-bridge}.mjs` as the source of truth for the deployed paths |
| `reproduction re-run and clean` | The SAME T2b scenario re-run against the modified install.sh shows no clobber — before/after output both pasted |
| `minimal diff` | The diff touches only `install_tower_auto()`; steps 1 (pi extension) and 4 (settings.json merge) are untouched; no reformatting of unrelated lines |
| `backup behaviour preserved` | Any remaining write path still takes a timestamped backup first |
| `nothing deleted from cc-hooks` | All three files still present in `~/herdr-spine/cc-hooks/`; if made vestigial, a pointer (e.g. `cc-hooks/README.md`) records what is authoritative instead |
| `choice defended` | The report names the shape chosen AND what was rejected, with reasons — not just what was done |

## The fresh machine still works (T2d)

| Assert name | Criterion |
|-------------|-----------|
| `fresh branch exercised` | A sandbox run with a non-existent `$tower_dir` reaches the fresh-install branch; output pasted |
| `outcome is correct or loudly wrong` | Result is either a working deploy or an actionable, explicit failure message — never a silent no-op that leaves a broken `~/.tower` |
| `behaviour defended` | The report argues why the chosen fresh-machine behaviour is right, including the no-`~/agent-core` case |

## Nothing live was touched (T2e)

| Assert name | Criterion |
|-------------|-----------|
| `herdr-spine tree minimal` | `git -C ~/herdr-spine status --porcelain` shows only `install.sh` modified, plus `cc-hooks/README.md` if created — no other tracked file |
| `no mutating git command ran` | `~/herdr-spine` is still on `main` at `1872986`; nothing staged, branched, stashed or committed by this agent |
| `live tower code unchanged by this agent` | sha256 of the three live files compared start vs end; any change is attributed to `AGNT w0-swap`'s cutover and reported as an observation, never reverted |
| `no writes under ~/.tower` | The transcript contains no write, create, move or delete under `~/.tower/` |
| `install.sh never run unsandboxed` | No invocation of `install.sh` or `install_tower_auto` without all three env vars redirected |

## Honesty

| Assert name | Criterion |
|-------------|-----------|
| `gaps stated` | Anything unproven is named as a gap — explicitly including whether a real `spine-choreo` / `spine-agent` / `dotter install` path was exercised end to end |
| `no silent assumption` | Every claim in the report traces to a command run this session or a cited file+line |
| `.done written last` | `~/.tower/agnt-w0-install-reconcile.done` exists with a two-line summary, written after the board report |
