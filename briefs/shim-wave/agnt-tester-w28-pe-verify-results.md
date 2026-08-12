# Tester verify results — assay writer-API fix (w28-pe)

**Role:** TESTER (AGNT · Aldebaran)  
**When:** 2026-08-11T23:19Z (local)  
**Verdict:** **pass**  
**Code/tests touched:** none (tester run-only)

---

## Commands run

### 1. `zig build test` (gate)

```bash
cd ~/agent-core/primitives/tools/assay && zig build test --summary all
```

**Exit code:** 0

**Summary:** `Build Summary: 7/7 steps succeeded; 6/6 tests passed`

| Module | Result |
|--------|--------|
| lib tests | 1 pass (1 total) |
| smoke tests | 1 pass (1 total) |
| llm_acceptance | 4 pass (4 total) |

Acceptance tests (`test/llm_acceptance.zig`):
- AC1: probe completes models and chat round-trip when local LLM up — PASS
- AC1: pickModel discovers local model id from /v1/models when endpoint up — PASS
- AC2: llm module exports probe pickModel classifySnippet for zig build test — PASS
- AC3: classifySnippet returns non-empty parseable label for model local — PASS

No leak failures reported.

### 2. `zig build` (build-only)

```bash
cd ~/agent-core/primitives/tools/assay && zig build
```

**Exit code:** 0

### 3. Live probe POST (`model: local`)

```bash
curl -s http://127.0.0.1:10240/v1/models
curl -s -X POST http://127.0.0.1:10240/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"local","messages":[{"role":"user","content":"Reply with one word: ok"}],"max_tokens":16}'
```

**Models endpoint:** `GET http://127.0.0.1:10240/v1/models` → HTTP 200; first model id `local`

**Chat completion:** HTTP 200; `content_len=2`; snippet=`Ok`

---

## Test files in scope (not edited)

- `primitives/tools/assay/test/llm_acceptance.zig` (AC1–AC3 acceptance tests)
- `primitives/tools/assay/test/smoke.zig`
- `primitives/tools/assay/src/llm.zig` (implementation under test)

---

## Human QA checklist (`test/qa-doc-orch-golden.md`)

ORCH integration items — **class = human** (not auto-ticked by tester):

- [ ] H-ORCH-1: `assay golden` exits 0; SHAPED floors numeric (not UNKNOWN)
- [ ] H-ORCH-2: Decoy false-SHAPED exactly 0/25

---

## Q → arbiter

None. All automated gates green.
