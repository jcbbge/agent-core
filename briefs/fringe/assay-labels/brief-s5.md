# SHARED PREFIX — assay labeler law (identical across all 5 workers)

You are an AGNT-tier labeling worker in the memory-assay project. You do ONE
unit: hand-label whether injected circadian memory atoms detectably shaped
behavior in ONE past pi session transcript. This is a measurement task, not
an implementation task. You never modify the transcript, the circadian repo,
or anything outside your assigned output files. You never commit.

## Background (2 sentences)

Circadian injects a wake payload at every pi session start: constitution +
NOW + `<mind:self>` (a render of weighted belief atoms). The project gate:
is atom PROPAGATION (atom visibly shaping session behavior) detectable from
transcripts at better than coin-flip? Your labels are the ground truth.

## Step 1 — extract the wake payload (pre-verified; run exactly)

```bash
python3 -c "
import json
f = 'SESSION_PATH'
for line in open(f):
    try: r = json.loads(line)
    except: continue
    if r.get('type') == 'custom_message' and r.get('customType') == 'circadian-wake':
        open('/tmp/WID-wake.txt', 'w').write(r['content'])
        print('wake chars:', len(r['content'])); break
"
```

## Step 2 — enumerate the injected atoms

In `/tmp/WID-wake.txt`, the `<mind:self>...</mind:self>` block contains the
atoms. Every bullet of the form:

```
**<claim sentence>** — "<verbatim quote>" (<source file>) [ep:YYYY-MM-DD] ...
```

is ONE atom. Section headers vary (Doctrine / Motifs / How we work / Who I
am across sessions) — the bullet shape is the identifier, not the header.
`<mind:constitution>`, `<mind:constitution-josh>`, `<mind:user>`, and
`<mind:now>` are NOT atoms — out of scope. Build your atom list: claim
text, in order. Expect roughly 25–60.

## Step 3 — add the decoys (blind control)

These 5 atoms come from ~/circadian/mind/beliefs/ but were (probably) NOT in
your session's payload. Treat them exactly like payload atoms: first check
presence, then label. They measure the false-positive rate — if you find
"propagation" for absent atoms, that is the signal working as intended.
Report them honestly.

- D1 ade9ebd98b42 — "Even the most trivial user input must be met with a literal, unadorned response to maintain..."
- D2 c582307afc17 — "The user requires direct, mechanical verification of system state before any interpretive fr..."
- D3 38683af47ff2 — "The solution to belief stuttering lies not in better models or guards, but in abandoning mutable prose as a b..."
- D4 5280475e6fa6 — "Recurring friction in developer tooling leads to user anger not over the feature, but over preventable, repea..."
- D5 bbf9828370b4 — "The system must enforce a pre-verified, minimal-fragmentation layout (e.g., dedicated workers tab, <=4 panes)..."

(Full claim text: `grep -A2 '^claim:' ~/circadian/mind/beliefs/<id>.md`)

## Step 4 — label every atom

For EACH atom (payload atoms + the 5 decoys):

1. **Presence**: does the claim text appear in the wake payload? (decoys:
   expected false — verify, don't assume)
2. **Propagation search**: the transcript is JSONL at SESSION_PATH, one
   record per line; assistant text lives in records with
   `"type":"message"` / role assistant (inspect the schema with
   `head -20 SESSION_PATH | cut -c1-300` if unsure). Grep the RAW file for
   distinctive 3–6 word phrases from the claim (e.g.
   `grep -n "motion is the metric" SESSION_PATH | head`), then python-print
   the matched records' text to judge context. Do NOT read the whole file
   into context — grep + targeted prints only.
3. **Label**:
   - `P3 SHAPED` — the atom's own language or reasoning visibly drove a
     decision, refusal, direction change, or was cited as authority.
     REQUIRES evidence (line number + short quote).
   - `P2 ECHOED` — the claim language reappears in the session but with no
     visible behavioral consequence.
   - `P0 INERT` — no detectable trace in session behavior.
   Attribution rule: evidence must match THE ATOM'S OWN claim language, not
   merely its theme. Two atoms can share a theme; credit only the one whose
     words moved.

## Step 5 — outputs (all four, in order)

1. `LABELS_PATH` — JSONL, one row per atom (payload atoms + 5 decoys):
   `{"atom":"<first 60 chars of claim>","decoy":true|false,"present":true|false,"label":"P3"|"P2"|"P0","evidence":"<line N: short quote, or empty>"}`
2. `SUMMARY_PATH` — counts (P3/P2/P0 × present/absent), your 3 strongest
   P3 examples with evidence, your 3 clearest P0 examples, and one
   paragraph: could a skeptic distinguish your P3s from chance?
3. Board finding (from cwd /Users/jrg/agent-core):
   `cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post finding circadian/memory-assay "WID: N atoms, P3=x P2=y P0=z, decoy false-positives=k" --from WID`
4. `touch DONE_PATH` — LAST, only after 1–3 exist.

## Hard rules

- Read-only except your three output files. No commits. No edits anywhere.
- Never invent evidence. A P3 without a transcript line number is a P2.
- Questions route UP: post a board `finding` to `circadian/memory-assay`
  and keep working on what you can; do not message the operator.
- Status is not mail: going idle after your `.done` is correct.

---
# AGNT label agent-core 2026-08-11 session

## Your assignment (worker agnt-assay-s5)

Substitute these values wherever the shared prefix uses SESSION_PATH / WID /
LABELS_PATH / SUMMARY_PATH / DONE_PATH:

- WID = agnt-assay-s5
- SESSION_PATH = /Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-32-09-386Z_019ff218-a5aa-7e53-af73-2fd5d91f14fc.jsonl
- LABELS_PATH = /Users/jrg/agent-core/briefs/fringe/assay-labels/s5.labels.jsonl
- SUMMARY_PATH = /Users/jrg/agent-core/briefs/fringe/assay-labels/s5.summary.md
- DONE_PATH = /Users/jrg/agent-core/briefs/fringe/assay-labels/s5.done
