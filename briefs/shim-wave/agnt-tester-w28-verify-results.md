# Tester verify results — assay writer-API fix (w28)

**Role:** TESTER (AGNT · Aldebaran)  
**When:** 2026-08-11T23:12Z (local)  
**Verdict:** **fail**  
**Code/tests touched:** none (tester run-only)

---

## Commands run

### 1. `zig build test` (gate)

```bash
cd ~/agent-core/primitives/tools/assay && zig build test
```

**Exit code:** 1

**Summary:** Build summary reports `5/6 tests passed (1 failed)`. Acceptance module `test/llm_acceptance.zig`: `3 pass, 1 fail (4 total); 4 leaks`.

**Failing test (hard):**

- `llm_acceptance.test.AC3: classifySnippet returns non-empty parseable label for model local`
  - Output: `AC3: unparseable classify label: SHAPED`
  - Stack: `llm.zig:155` (`classifySnippet` → `client.fetch`)

**Leak failures (DebugAllocator, same run):**

- `AC1: probe completes models and chat round-trip when local LLM up` — 2 leaked allocations (`llm.zig:30` probe, `llm.zig:64` probeChat)
- `AC1: pickModel discovers local model id from /v1/models when endpoint up` — 1 leaked allocation (`llm.zig:89` pickModel)
- `AC3: classifySnippet …` — 1 leaked allocation (`llm.zig:155` classifySnippet)

### 2. `zig build` (build-only)

```bash
cd ~/agent-core/primitives/tools/assay && zig build
```

**Exit code:** 0

### 3. Live probe POST (`model: local`)

```bash
curl -s -X POST http://127.0.0.1:10240/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"local","messages":[{"role":"user","content":"Reply with one word: ok"}],"max_tokens":16}'
```

**Models endpoint:** `GET http://127.0.0.1:10240/v1/models` → HTTP 200

**Chat completion:** HTTP 200; `content_len=2`; snippet=`Ok`

Local LLM is up; raw POST round-trip succeeds independently of unit-test failures.

---

## Test files in scope (not edited)

- `primitives/tools/assay/test/llm_acceptance.zig` (AC1–AC3 acceptance tests)
- `primitives/tools/assay/src/llm.zig` (implementation under test)

---

## Human QA checklist (`test/qa-doc-orch-golden.md`)

ORCH integration items — **class = human** (not auto-ticked by tester):

- [ ] H-ORCH-1: `assay golden` exits 0; SHAPED floors numeric (not UNKNOWN)
- [ ] H-ORCH-2: Decoy false-SHAPED exactly 0/25

---

## Q → arbiter

**Q1:** `zig build test` exits 1. AC3 fails with LLM raw label `SHAPED` reported unparseable; AC1/pickModel/AC3 also report Allocating-writer response-buffer leaks at `llm.zig` fetch sites. Is this bad test, bad implementation, or both?
