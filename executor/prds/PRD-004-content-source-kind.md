# PRD-004: Build "content" Source Kind in Executor Core

**Task ID:** #8
**Wave:** 1 (no dependencies — parallel with PRD-001, PRD-005)
**Blocks:** #6
**Runtime:** TypeScript / Bun
**Repo:** `/Users/jcbbge/executor` (already cloned)

---

## Kotadb Code Intelligence

The executor repo is indexed in kotadb. Use it throughout this task for symbol lookup, file navigation, and dependency tracing.

**Kotadb MCP endpoint:** `http://localhost:3099/` (HTTP MCP, streamable transport)

Useful queries before touching any file:
```bash
# Find all usages of SourceKindSchema
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_symbols","arguments":{"query":"SourceKindSchema","repository":"RhysSullivan/executor"}}}'

# Find all files importing from source.ts
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"find_references","arguments":{"symbol":"SourceKindSchema","repository":"RhysSullivan/executor"}}}'
```

Use kotadb before and after each file change to verify no unintended consumers are broken.

---

## Overview

Add a new `"content"` source kind to executor's core. This enables filesystem-based sources — markdown files, directory trees — to be indexed into the typed tool catalog. Once built, rules, skills, and commands from `~/Documents/_agents/primitives/` can be connected as content sources, making them discoverable and retrievable by agents writing TypeScript in executor's sandbox.

**Important scope note:** This is for the agent-runtime layer only. Claude Code still loads skills/rules from the filesystem via its own harness-native mechanisms. This enables agents writing TypeScript inside executor's sandbox to query and retrieve primitive content programmatically.

Fork at `https://github.com/RhysSullivan/executor`. Open as a PR upstream after local verification.

---

## Goals

- `{ kind: "content", basePath, fileGlob, namespace }` is a valid source type
- Each matched file becomes a retrievable tool: `{namespace}.{filename}.get()`
- Directory gets `{namespace}.list()` and `{namespace}.search({ query })` tools
- HTTP probing is skipped for content sources
- Compatible with all existing source kinds — zero regression

## Non-Goals

- Do not modify existing source kinds
- Do not add authentication or remote fetching
- Do not build semantic/vector search — use existing token-scored search

---

## Architecture

Content source fits the existing abstraction as a persisted-artifact source (same path as MCP):

```
Source (kind: "content")
  ├── Connection: basePath + fileGlob → walk filesystem → build ToolArtifacts
  ├── Indexing: each file → ToolArtifact { providerKind: "content", title, description, searchText }
  ├── Tool generation: list + search (directory-level) + get (per-file)
  └── Invocation: filesystem read at tool-call time — no HTTP, no auth
```

**Reference implementation: MCP source kind** — the simplest existing kind. It uses `discoverAndIndexMcpSourceToolArtifacts` → stores `ToolArtifact` records → invokes via `makeToolInvokerFromTools` at line 1144 of workspace-execution-environment.ts. Follow this exact pattern for content.

---

## Files to Modify (7 total, verified via kotadb)

### 1. `packages/control-plane/src/schema/models/source.ts`

**What's there now (lines 10–15):**
```typescript
export const SourceKindSchema = Schema.Literal(
  "mcp",
  "openapi",
  "graphql",
  "internal",
);
export type SourceKind = typeof SourceKindSchema.Type;  // line 160
```

**Change:** Add `"content"` to `SourceKindSchema`:
```typescript
export const SourceKindSchema = Schema.Literal(
  "mcp",
  "openapi",
  "graphql",
  "internal",
  "content",   // add this
);
```

No other changes to this file. `ConnectSourcePayload` lives in api.ts, not here.

---

### 2. `packages/control-plane/src/schema/models/tool-artifact.ts`

**What's there now (lines 13–16):**
```typescript
export const ToolArtifactProviderKindSchema = Schema.Literal(
  "mcp",
  "openapi",
);
export type ToolArtifactProviderKind = typeof ToolArtifactProviderKindSchema.Type;  // line ~160
```

**Change:** Add `"content"`:
```typescript
export const ToolArtifactProviderKindSchema = Schema.Literal(
  "mcp",
  "openapi",
  "content",   // add this
);
```

---

### 3. `packages/control-plane/src/api/sources/api.ts`

**What's there now (lines 132–157):** `ConnectSourcePayload` is a `Schema.Union` of three discriminated structs on `kind`:
- `kind: "openapi"` — requires `endpoint` + `specUrl`, optional `name`, `namespace`, `auth`
- `kind: "graphql"` — requires `endpoint`, optional `name`, `namespace`, `auth`
- `kind: "mcp"` — requires `endpoint`, optional `name`, `namespace`, `transport`, `queryParams`, `headers`

**Change:** Add a fourth branch for content. Model it after the MCP branch (fewest fields):

```typescript
const ConnectContentSourcePayload = Schema.Struct({
  kind: Schema.Literal("content"),
  basePath: Schema.String,        // absolute path on disk, e.g. "/Users/jcbbge/Documents/_agents/primitives/rules"
  fileGlob: Schema.String,        // e.g. "**/*.md"
  namespace: Schema.String,       // e.g. "rules", "skills", "commands"
  indexStrategy: Schema.optional(Schema.Literal("flat"), { default: () => "flat" }),
  // "flat" = each file is one item (suitable for rules, commands, skills)
});
```

Add to the `ConnectSourcePayload` union alongside the existing three branches.

Also add validation in the connection handler:
```typescript
// When kind === "content", validate basePath exists before proceeding:
if (!existsSync(payload.basePath)) {
  // return 400 using existing HttpApiError pattern in this file
}
```

---

### 4. `packages/control-plane/src/runtime/tool-artifacts.ts`

**What's there now (lines 440–460):** Three consecutive `if (input.source.kind === ...)` blocks:
```typescript
if (input.source.kind === "mcp") { ... }        // calls discoverAndIndexMcpSourceToolArtifacts
if (input.source.kind === "openapi") { ... }    // calls discoverAndIndexOpenApiSourceToolArtifacts
if (input.source.kind === "graphql") { ... }    // calls discoverAndIndexGraphqlSourceToolArtifacts
```

**Change:** Add a fourth block after graphql:
```typescript
if (input.source.kind === "content") {
  return yield* discoverAndIndexContentSourceToolArtifacts(input);
}
```

Implement `discoverAndIndexContentSourceToolArtifacts`:
```typescript
const discoverAndIndexContentSourceToolArtifacts = (input: { source: ContentSource; workspaceId: string }) =>
  Effect.gen(function* () {
    const { basePath, fileGlob, namespace } = input.source;

    // Walk filesystem
    const files = yield* Effect.tryPromise(() => glob(fileGlob, { cwd: basePath, absolute: true }));

    const artifacts: ToolArtifact[] = [];

    for (const filePath of files) {
      const raw = yield* Effect.tryPromise(() => readFile(filePath, "utf-8"));
      const fileName = basename(filePath, extname(filePath));
      const title = extractFirstHeading(raw) ?? fileName;
      const description = extractFirstParagraph(raw) ?? "";

      artifacts.push({
        providerKind: "content",
        namespace,
        toolId: `${fileName}.get`,
        title,
        description,
        searchText: buildWeightedSearchText({ title, description, body: raw }),
        // persist full content for retrieval
        rawContent: raw,
        filePath,
      });
    }

    // Directory-level tools
    artifacts.push(
      { providerKind: "content", namespace, toolId: "list", title: `List ${namespace}`, description: `List all items in ${namespace}`, searchText: "" },
      { providerKind: "content", namespace, toolId: "search", title: `Search ${namespace}`, description: `Search ${namespace} by query`, searchText: "" },
    );

    return artifacts;
  });
```

Helper functions (add to same file or a `content-utils.ts` sibling):
- `extractFirstHeading(md: string): string | null` — regex match `^# (.+)` first occurrence
- `extractFirstParagraph(md: string): string | null` — first non-empty, non-heading line block
- `buildWeightedSearchText({ title, description, body })` — title repeated ×12, description ×8, body ×1 (follow existing `buildSearchText` pattern in the file)

---

### 5. `packages/control-plane/src/runtime/source-discovery.ts`

**What's there now:** `discoverSource` at line 858 calls probes in order: OpenAPI → GraphQL → MCP → fallback. HTTP probe function is `executeHttpProbe` at line 197.

**Change:** Add an early return at the top of `discoverSource` before any probe:
```typescript
// Content sources are local filesystem — no HTTP probe, always ready
if (source.kind === "content") {
  return { kind: "content" as const, status: "ready" as const };
}
```

This prevents executor from attempting HTTP discovery against a local file path.

---

### 6. `packages/control-plane/src/runtime/source-inspection.ts`

**What's there now:** `resolveSourceInspection` at line 467:
```typescript
if (source.kind === "openapi" && sourceRecord.sourceDocumentText) → loadOpenApiInspection   // line 474
if (source.kind === "graphql" && sourceRecord.sourceDocumentText) → loadGraphqlInspection   // line 488
→ loadPersistedInspection   // line 502 — fallback for mcp, internal, missing doc
```

**Change:** Content sources fall through to `loadPersistedInspection` naturally — no new branch needed. The existing fallback handles persisted artifacts correctly.

**Verify only:** Read `resolveSourceInspection` at line 467 and confirm that `kind === "content"` will indeed fall through to `loadPersistedInspection`. If there is any guard that would reject unknown kinds, add an explicit pass-through.

---

### 7. `packages/control-plane/src/runtime/workspace-execution-environment.ts`

**What's there now:** NOT a switch statement — sequential `if` chains. MCP artifact invocation at line 1144:
```typescript
if (artifact.providerKind === "mcp") {
  // builds tools from stored manifest, calls makeToolInvokerFromTools
}
```

**Change:** Add content invocation path alongside the MCP branch:
```typescript
if (artifact.providerKind === "content") {
  return createContentToolInvoker(artifact);
}
```

Implement `createContentToolInvoker`:
```typescript
function createContentToolInvoker(artifact: ContentToolArtifact) {
  return makeToolInvokerFromTools([{
    name: artifact.toolId,
    description: artifact.description,
    invoke: async (args: unknown) => {
      if (artifact.toolId === "list") {
        // Return from catalog — all .get artifacts in namespace
        return listContentArtifacts(artifact.namespace);
      }
      if (artifact.toolId === "search") {
        const { query } = args as { query: string };
        return searchContentArtifacts(artifact.namespace, query);
      }
      // Individual file get — return persisted rawContent
      return artifact.rawContent;
    },
  }]);
}
```

> **Note:** `makeToolInvokerFromTools` is the existing helper used by the MCP branch. Use it directly rather than building a custom invoker, to stay consistent with the rest of the runtime.

---

## Testing

After implementation, build and start executor locally from `~/executor`:

```bash
cd ~/executor
bun install
bun dev
```

Then verify with:
```bash
# Connect rules as a content source
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "content",
    basePath: "/Users/jcbbge/Documents/_agents/primitives/rules",
    fileGlob: "**/*.md",
    namespace: "rules"
  });
'

# List all rules
executor --base-url http://127.0.0.1:8000 call 'return await tools.rules.list();'

# Get a specific rule
executor --base-url http://127.0.0.1:8000 call 'return await tools.rules["solidjs"].get();'

# Search rules
executor --base-url http://127.0.0.1:8000 call 'return await tools.rules.search({ query: "rate limits" });'
```

---

## Acceptance Criteria

- [ ] `sources.add({ kind: "content", ... })` succeeds without error
- [ ] `tools.{namespace}.list()` returns all indexed files with titles and descriptions
- [ ] `tools.{namespace}.search({ query: "..." })` returns ranked results
- [ ] `tools.{namespace}.{filename}.get()` returns full markdown content
- [ ] HTTP probe is NOT attempted for content sources (check logs)
- [ ] Existing source kinds (mcp, openapi, graphql, internal) unaffected — run existing tests
- [ ] Sources persist across executor restarts

---

## Notes

- Follow MCP source kind as the reference implementation throughout — it is the simplest existing kind
- `ToolArtifactProviderKindSchema` currently only has "mcp" and "openapi" — graphql tools are handled dynamically, not via persisted artifacts. Content follows the "mcp" pattern (persisted artifacts).
- Use kotadb to verify no consumers of `SourceKindSchema` or `ToolArtifactProviderKindSchema` are broken by the additions before opening a PR
