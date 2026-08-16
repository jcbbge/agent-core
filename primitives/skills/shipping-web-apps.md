---
name: shipping-web-apps
description: Stack-agnostic best practices for deploying and serving a modern web app in production — asset delivery, caching, edge/CDN, reverse proxies, app-runtime concurrency, DB/deploy separation, client persistence, and "set it and forget it" reliability. Use when setting up or reviewing a deployment, debugging slow/failed loads in production, choosing where static assets are served, deciding on a CDN, wiring a reverse proxy (Caddy/nginx/Traefik), separating DB lifecycle from code deploys, or hardening a local-first / offline app. Triggers on "why is prod slow", "deploy setup", "serving assets", "cache headers", "CDN", "reverse proxy config", "zero-downtime deploy", "it works locally but not in prod".
---

# Shipping Web Apps to Production

A checklist of what to get right when a web app goes to production, and how to make it
stay fast without babysitting. Stack-agnostic — the principles hold whether the app
server is Node, Bun, Go, Rust, PHP, Python, or Ruby, and whether the proxy is Caddy,
nginx, or Traefik.

## The mental model: four layers, each doing only its job

A request flows through four tiers. Most production pain is a job done at the wrong tier.

```
Client (browser/cache)  →  Edge/CDN  →  Reverse proxy  →  App server  →  Data store
```

- **Edge/CDN** — caches and serves bytes globally; collapses concurrent load off your origin.
- **Reverse proxy** — TLS, routing, compression, headers. Serves *static files itself*.
- **App server** — computes: auth, business logic, queries, mutations. Nothing else.
- **Data store** — the source of truth; its lifecycle is independent of app deploys.

**The cardinal rule: never make a higher-cost tier do a lower tier's job.** Streaming a
10 MB static file *through your app server* is the classic mistake — it turns cheap disk
I/O into app-runtime load. Let the proxy or CDN serve files; reserve the app for compute.

## 1. Static asset delivery & caching (the #1 source of "why is prod slow")

- **Serve static assets from the proxy/CDN, not the app runtime.** A proxy's file server
  (`file_server`, nginx `root`, etc.) reads from disk and streams far faster than an app
  process, and it never competes with your API for CPU.
- **Content-hash asset filenames** (fingerprinting — most bundlers do this by default) and
  cache them **forever**: `Cache-Control: public, max-age=31536000, immutable`. The URL
  changes when the content changes, so the browser (and CDN) never re-fetch or revalidate.
- **NEVER cache the HTML entry point** (`index.html`): `Cache-Control: no-cache` /
  `max-age=0, must-revalidate`. Its name is stable but its content changes every deploy;
  a cached entry point points users at deleted asset hashes → white screen after deploy.
- **Precompress large assets at build time** (brotli + gzip) and let the proxy serve the
  precompressed file. On-the-fly compression of large or incompressible payloads burns CPU
  on every request and can stall streams. Brotli beats gzip; WASM/JS compress ~5×.
- **Verify with the real response, not assumptions:** `curl -sI` the asset and check
  `200`, correct `Content-Type` (e.g. `application/wasm`), full `Content-Length`, and the
  `Cache-Control` header. A big binary served with the wrong MIME type can be rejected by
  strict clients (`nosniff`).

## 2. Reverse proxy / edge config

- **Version the proxy config in the repo**, deployed by your pipeline. A config that lives
  only on the box drifts; a manual hot-patch on the server is silently overwritten by the
  next deploy. **Any emergency hot-patch must be back-ported to the repo immediately**, or
  it regresses.
- **Watch global timeouts.** A blanket write/response timeout (e.g. "30s") will guillotine
  large or slow responses mid-stream — surfaces as a protocol error (`ERR_HTTP2_PROTOCOL_ERROR`)
  and a truncated download. Scope timeouts to the routes that need them; don't apply an
  API-sized deadline to large static downloads.
- **Route by path:** proxy only the dynamic paths (`/api/*`, sync endpoints) to the app;
  serve everything else as files. Add an SPA fallback (`try_files → index.html`).
- **TLS is the proxy's job** — auto-provision + auto-renew (Caddy does this natively; nginx
  via certbot). Don't hand-manage certs in the app.
- **CDN in front collapses concurrent load** — N clients become a handful of origin hits.
  Control edge caching with `Cache-Control` (and `CDN-Cache-Control` where supported).
  Know your CDN's defaults (many cache JS/CSS/media but NOT HTML/JSON — usually what you want).

### DNS caveat when adding a CDN
Putting a CDN in front usually means pointing DNS (or nameservers) at it. If your domain's
DNS moves, it moves for the **whole domain** — replicate **every** existing record (MX/email
especially) at the new provider *before* cutting over, and expect a propagation window.
This is a careful migration, never a single toggle.

## 3. App-runtime concurrency (don't panic about "single-threaded")

- A single-event-loop runtime (Node, Bun) handles **thousands of concurrent I/O-bound
  requests** on one core — that's what it's designed for. It only bottlenecks on
  **CPU-bound work on the request path** (compression, image processing, crypto, huge-file
  streaming). The fix is to move that work off the request path, not to change languages.
- **Scale horizontally when compute (not I/O) saturates a core:** run N processes/replicas
  (`cluster`, a process manager, or N containers) behind the proxy's load balancer. Every
  runtime scales this way — process pool (Node/PHP-fpm) or thread pool (Go/Rust) — same
  end state. **Rewriting the backend in another language is almost never the answer to a
  serving problem.**

## 4. Separate the data store from the app deploy

- **Code deploys must not rebuild or reseed production data.** The data store is a standing
  service with its own lifecycle. A deploy applies **pending, additive migrations** (a
  no-op when the schema is unchanged) — it never drops/recreates data.
- **Path-filter migrations** so a frontend/API-only change doesn't run the DB job at all.
- **Destructive migrations ride separately** from the code that stops using a column; when
  an irreversible op is unavoidable under automation, prefer the reversible path (drop a
  constraint, keep the data) over blind data loss.
- **Managed replication/sync services** (CDC, logical-replication readers) often need a
  **direct** DB connection (not a pooler) and can drop their slot after prolonged downtime,
  forcing a full re-sync. Keep them up; monitor them.

## 5. Client persistence, local-first & multi-tab

- **A client-side store (IndexedDB/SQLite-WASM/OPFS) is single-writer.** Multiple tabs each
  booting their own instance against the same store causes lock contention and corruption
  ("failed to open / blocked storage"). Use a **shared worker + leader election** (Web Locks
  API elects one owner tab; others RPC to it over `BroadcastChannel`). One instance, one
  writer, regardless of tab count.
- **Auth across tabs:** a cookie is shared across all tabs of an origin automatically —
  users don't re-log per tab. **On logout, wipe client-side caches/stores** or the next user
  on that browser can read the previous user's cached data. Broadcast logout across tabs.
- **A large WASM/runtime download is a one-time cost IF cached** (see §1). Persisted local
  state should survive reloads without a full re-sync; scope what you sync so initial-load
  cost tracks *what the client needs*, not total data size.

## 6. Deploy pipeline hygiene

- **Multi-stage builds:** a fat builder stage, a lean runtime stage. Order layers
  least-changed → most-changed (base → deps → lockfile → install → source → build) to
  maximize cache hits.
- **Zero-downtime:** bring the new version up, health-check it, then flip the proxy —
  don't recreate in place. Keep serving old immutable assets during the swap.
- **Verify the deploy actually shipped:** a green pipeline badge is not proof. Check a
  runtime signal — a served asset's hash, a version endpoint, a unique string in the
  deployed artifact. Stale images redeploy silently.
- **Health checks + observability:** a readiness endpoint the proxy/orchestrator polls;
  structured logs with enough context to diagnose without redeploying.

## 7. Diagnosis discipline (when prod is on fire)

- **Read the real error first.** The user-facing message is often a wrapper; the root cause
  is the underlying exception / the network tab / the server log. Get the actual status
  code, content-type, byte count, and timing before theorizing.
- **Confirm the tier.** Is it the client, the CDN, the proxy, the app, or the data store?
  One `curl -sI` against the origin usually isolates it — assets `200` with right headers →
  not serving; app `200` but slow → app or data.
- **One command, one fact.** Prefer a single command that returns one decisive fact over
  building diagnostic infrastructure. Reproduce before you fix.
- **Env-specific failures are usually config, not code.** "Works locally, fails in prod"
  points at cache headers, timeouts, MIME types, missing env, or the serving topology —
  the things that differ between dev and prod.

## The "set it and forget it" endstate

You've shipped it right when: content-hashed assets cache forever and the entry point never
caches; the CDN absorbs concurrent load; the proxy serves static and terminates TLS while
the app only computes; the app scales by adding processes, not rewrites; deploys apply only
pending migrations and never touch data; the client store is multi-tab-safe and clears on
logout; and every config lives in the repo so nothing drifts. Then a deploy is boring, and
a traffic spike is the CDN's problem, not yours.
