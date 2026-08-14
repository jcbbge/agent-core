# A6 — Correction-tax baseline from transcript corpus

**Date:** 2026-08-13  
**Agent:** agnt-a6-tax-baseline (Rumen R3 prototype)  
**Decision context:** peer-ignition-decision-brief.md section A6  
**Headline:** The between-class correction-tax signal is **noise** for certification thresholds (SNR ≈ 0.02). Per-class point estimates exist but overlap heavily; do not promote envelope gates from this baseline alone.

---

## Method

### Corpus scope

| Field | Value |
|---|---|
| Transcript sources | `~/.claude/projects/**/*.jsonl` (Claude Code), `~/.pi/agent/sessions/**/*.jsonl` (pi) |
| Selection list | `/tmp/a6-baseline/sessions.txt` (691 paths) |
| CC sessions | 447 |
| pi sessions | 244 |
| mtime window | 2026-07-01 .. 2026-08-13 inclusive (observed oldest 2026-07-02, newest 2026-08-14) |
| Minimum file size | 100 KiB (`102400` bytes) |

**Exclusions (and counts skipped):**

- Below 100 KiB: 1,395 files (short or low-activity sessions)
- Outside mtime window: 111 files
- `private-tmp` paths: 51 files
- Tower flight markdown (`~/.tower/flight/`, 781 files): not vein JSONL — excluded from vein scope
- Hook capture scripts under `~/agent-core/primitives/hooks/`: source scripts, not transcript dumps — no separate capture dir found

**Reproducibility:** rebuild the list with `/tmp/a6-baseline/build-sessions.sh` (writes `selection-meta.txt` alongside `sessions.txt`).

### Vein invocations (exact)

```bash
mkdir -p /tmp/a6-baseline

# 1. Build session list (see build-sessions.sh in /tmp/a6-baseline/)
/tmp/a6-baseline/build-sessions.sh

# 2. Scan shell calls → CSV
/Users/jrg/.local/bin/vein scan \
  --sessions /tmp/a6-baseline/sessions.txt \
  --out /tmp/a6-baseline/commands.csv

# 3. Aggregate reports
/Users/jrg/.local/bin/vein report \
  --csv /tmp/a6-baseline/commands.csv \
  --out-dir /tmp/a6-baseline/report
```

**Artifacts (scratch, not deliverable):**

- `/tmp/a6-baseline/commands.csv` — 157,665 rows including header (24,945 parsed shell calls across 573 sessions; 118 selected sessions had zero bash/tool shell rows)
- `/tmp/a6-baseline/report/{verbs,retries,hooks,failures}.md`
- `/tmp/a6-baseline/tax-analysis.json` — per-class tax aggregation script output

**Supporting evidence (read-only, not reimplemented):**

- Arc tax ledger: `~/Infinity/arc/.madewell/work/tax.jsonl` — **0 bytes**
- `git log --grep='LEARNED:'` in Arc (849 commits) and agent-core — **0** each
- Tower board/ledger: consulted for DONE-post patterns; malformed timestamp rows prevented a clean fleet-wide DONE→follow-up rate (see Cannot-be-answered)

### Correction-tax definition (declared before measurement)

**Primary (transcript proxy):** A session incurs correction tax when (1) an assistant turn matches a *declared-done* pattern (`done`, `finished`, `complete`, `shipped`, `.done`, `work-done`, `all tests pass`), and (2) a subsequent user turn matches a *correction* pattern (operator pushback, revert language, "bad implementation", "verify first", profanity-as-correction, etc.). Regex lists in `/tmp/a6-baseline/tax-analysis.json` source script; full session scan, not sampled.

**Secondary (shell proxies, reported separately):** ≥2 test commands with errors in one session; `git revert` in session. Neither dominated: 21 sessions with repeated test errors; **0** sessions with `git revert`.

**Not measured (outside vein + regex reach):** arbiter routing labels, exact QA bounce counts, commit-sequence "fix after merge" without transcript signal, operator framing corrections that do not match regex.

**Deviation from brief's proposed definition:** We cannot observe "first declared done" reliably — assistant self-declarations are noisy and often premature. The measured rate is *post-declared-done user correction*, which is a lower bound on true rework (misses silent fixes and corrections without profanity). Git revert and forward tax ledger were unavailable (0 reverts; 0-byte tax.jsonl).

---

## Taxonomy

Derived from per-session shell-command profiles + transcript scan. Candidate ladder from A6 brief; collapse decisions explicit.

| Class | n | How assigned | Collapse / notes |
|---|---:|---|---|
| **feature-with-schema** | 312 | Default coding session: commits and/or schema/migration/graphql hits and/or mixed dev work | Supported |
| **docs-only** | 235 | ≥3 `.md` touches, ≤1 test command, ≤1 commit, no schema hits; includes 118 zero-shell sessions reclassified from unclassified | Supported but fuzzy — many "research/read" sessions land here |
| **test-authoring** | 101 | ≥5 test invocations or ≥6% of calls are test runners | Supported |
| **irreversible/data-ops** | 35 | prod SSH, DROP/TRUNCATE, or destructive rm patterns | Supported; **smallest n with highest point tax** |
| **mechanical-refactor** | 8 | `git revert` or multi-commit + sed/mv without doc character | **Collapsed for thresholds** — n too small; merged into feature-with-schema for any gate math |
| ~~mechanical-refactor (standalone prior)~~ | — | — | **Refuse threshold** until n ≥ 30 |

**226 sessions** initially scored `unclassified` by strict rules; collapsed by rule: zero-shell → docs-only; test-heavy residual → test-authoring; else → feature-with-schema. This inflates docs-only and feature-with-schema at the expense of a crisp mechanical-refactor boundary — the corpus does not support that ladder rung.

---

## Per-class tax

Rates are **post-declared-done user correction** events per session (Wilson 95% CI). `n` = sessions in class with successful transcript parse.

| Class | n | Tax events (k) | Rate | 95% CI | Rate \| done (n_done) | 95% CI (done) |
|---|---:|---:|---:|---|---:|---|
| irreversible/data-ops | 35 | 6 | 17.1% | 8.1% – 32.7% | 28.6% (21) | 13.8% – 50.0% |
| feature-with-schema | 312 | 23 | 7.4% | 5.0% – 10.8% | 11.1% (207) | 7.5% – 16.1% |
| test-authoring | 101 | 3 | 3.0% | 1.0% – 8.4% | 4.6% (65) | 1.6% – 12.7% |
| docs-only | 235 | 6 | 2.6% | 1.2% – 5.5% | 7.9% (76) | 3.7% – 16.2% |
| mechanical-refactor | 8 | 0 | 0.0% | 0.0% – 32.4% | 0.0% (8) | 0.0% – 32.4% |

**Secondary shell proxies:**

| Class | Sessions with ≥2 test errors | Sessions with git revert |
|---|---:|---:|
| test-authoring | 15 | 0 |
| feature-with-schema | 4 | 0 |
| irreversible/data-ops | 2 | 0 |
| docs-only | 0 | 0 |

**Vein corpus context (not tax, but bounds miner quality):** 24,945 shell calls; 2,257 error-marked calls (9.0%); 145 exact ≥3-repeat retry loops; 84 oracle test-failure labels. CC hook ledger: 7,467 executions, 3.48M ms (79.7% `afplay`).

---

## S/N on the metric

**Between-class variance (rate dispersion):** 0.00127  
**Within-class variance proxy (mean p(1−p)):** 0.053  
**SNR ratio (between / within):** **0.024**

Interpretation: confidence intervals overlap for all pairs except the extreme irreversible/data-ops vs docs-only point estimates — and even that pair shares CI overlap at the upper/lower edges. **Within-class binomial noise swamps between-class separation by ~40×.** The ranking of classes (irreversible > feature > test ≈ docs) is directionally sensible but not stable enough for certification envelopes.

Any-correction rate (not conditioned on done): feature-with-schema 13.5%, irreversible/data-ops 20.0%, docs-only 6.0%, test-authoring 5.0% — same overlap story.

---

## Provisional thresholds + reversion criteria

**Caveat:** With SNR ≈ 0.02, these are **priors for human judgment only**, not auto-promotion gates.

| Class | Provisional dark-run prior | Refuse? | Reversion criteria (if ever used) |
|---|---|---|---|
| docs-only | ≤8% post-done correction | No — widest n, lowest point rate | 2 consecutive units above 15% or any silent-third-state |
| test-authoring | ≤12% | Weak — overlaps docs-only CI | 2 units above 20% or test-maker/arbiter bounce without transcript match |
| feature-with-schema | ≤16% | Weak | 2 units above 25% or schema migration rollback |
| irreversible/data-ops | **No threshold** | **Yes** — n=35, CI half-width >15pp | Always lit; revisit when n≥100 |
| mechanical-refactor | **No threshold** | **Yes** — collapsed n=8 | Merge with feature-with-schema until identifiable |

**Reversion (general):** Drop class to lit-running when (a) observed tax exceeds upper CI of baseline for that class in 2 consecutive landed units, (b) any silent-third-state incident, or (c) operator override of a gate refusal traced to stale brief — those are factory defects, not tax noise.

---

## Cannot-be-answered list

- **True correction tax from git alone:** `tax.jsonl` empty; zero `LEARNED:` commits; no forward ledger to calibrate retro proxy.
- **Arbiter / CURSOR_VERIFY_GATE bounce rate per class:** routing labels not in vein JSONL; would need cursor-shim verify logs (out of scope).
- **Mechanical-refactor as distinct class:** n=8, no revert commits observed — ladder rung unsupported.
- **Population-weighted fleet tax:** selection biases toward large (≥100 KiB) sessions; underweights quick doc edits and cursor-only sessions not in pi/CC paths.
- **Clean DONE→rework rate on Tower board:** `board.jsonl` contains malformed timestamp rows; automated 3-day follow-up scan aborted — manual spot-checks show follow-ups exist but fleet rate is uncomputed.
- **Operator corrections without regex match:** polite corrections, single-word fixes, and visual/UI corrections are undercounted.
- **Cross-harness cursor transcript parity:** cursor JSONL not in vein corpus (CC + pi only); cursor-heavy August work is underrepresented.
- **Causal "tax causes delay":** no duration model tied to rework events in this pass.

---

## Summary for ORCH

| Item | Value |
|---|---|
| Report path | `~/agent-core/research/A6-tax-baseline-2026-08-13.md` |
| Corpus N | 691 sessions (447 CC + 244 pi), 2026-07-02 .. 2026-08-14 |
| Vein calls | 24,945 shell invocations (573 sessions with shell) |
| Signal verdict | **Noise** for between-class certification (SNR 0.024) |
| Strongest prior | irreversible/data-ops ~17% correction (n=35, wide CI) — lit-only recommendation |
| Safest prior | docs-only ~2.6% (n=235) — still overlaps test-authoring CI |
| A6 success criterion met | Yes — priors with honest error bars exist; unmeasurability for gates is explicitly priced |
