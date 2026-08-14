Fair. Let me give you the world view.

## The frame

Today ran the August seven-stream plan. Four streams closed, one is blocked on you, one is held on you. **53 commits, 7 migrations.** The through-line: this wave built *foundations under the three biggest unbuilt product areas* — catering, portal, inventory — plus the connective tissue between builds and documents. Almost nothing user-facing shipped. That's deliberate and it's the right read of the wave.

---

## WS-B — Contracts and merge tags

**Original intent:** merge tags, document→build binding, and section-optionality — with a mirror-faithful namespace, meaning tags carry HubSpot's own property paths and Arc never renames across that boundary.

**What changed.** The merge-tag vocabulary was **hard-cut** to mirror-faithful `deal.*` / `contact.*` paths, and a new package `packages/contracts/merge-tags` now holds `tag-whitelist.ts`, described in its own header as the *"authoritative merge-tag registry — single enumerable source for Toolbar, resolver validation, and agent tooling."* Alongside it: subsection addressing, an unknown-builder chip, path-aware finalize, `contract_versions` bound to `build_id`, and a fix where signed-document image URLs refresh on read.

**What it solves.** The vocabulary previously lived in three places at once — the editor Toolbar, the resolver registry, and whatever an author remembered. They could drift, so a tag could appear in the picker and fail to resolve. Now one enumerable registry drives all three. The image fix is a real bug: presigned URLs were expiring, so old signed documents rendered broken images.

**Where it sits.** Between the TipTap editor and the API's resolver registry. Critically, the whitelist also declares `DEFAULT_BUILDER_SECTION_KEYS` — venue, catering, rentals, vendors, additional_labor — which is the join between merge tags and the Build's section model.

**Trajectory.** `{{builder.catering}}` and `{{builder.vendors}}` now have a home to resolve into. They light up when D's read arrow lands. That's the B→D seam closing.

---

## WS-D — Galley data plane

**Original intent:** mirror Galley's catering data into Arc and build the menu-plan write-back, with a single write surface and approve as the reconciliation gate.

**What changed, and this is the important one.** The existing mirror was pointed at **the wrong Galley primitive** — it targeted `Menu`, and the work retargeted sync, the Electric DDL, and the tests to `MenuPlan`. Then migration `0059` built a **nested three-level mirror**, FK-chained: `galley_menu_plan_events` → `galley_menu_plan_event_item_groups` → `galley_menu_plan_event_items`. The recipe read-arrow now stamps `galley_recipe_id` and snapshots. A **write-arrow substrate** landed — allowlist plus `mutateAndEnqueue` — and `approveMenuPlanEvent` was added to the allowlist **with no UI**.

**What it solves.** Arc could read Galley recipes but had no representation of *a menu plan for an event*, which is the actual unit catering is planned in. A recipe is a library fact; a menu plan is the instance. Without it there was nothing for a catering section to attach to.

**Where it sits.** Galley schema in `packages/db` → Electric shapes → PGlite reads on the client. The write side goes through the allowlist and write-ledger — the write arrow of the four-arrow architecture.

**Trajectory.** This is the foundation of the biggest planned wave, the Galley mini-client. And the approve mutation being allowlisted-but-unwired is the right shape: the capability is proven and the gate stays shut until you decide reconciliation semantics.

---

## WS-F — Multi-location inventory

**Original intent:** location as a *scope*, not a deployment — per-location par, counts, and ordering. Spec was material for the meeting.

**What changed.** The 662-line spec landed, then three migrations. `0061` adds `par numeric(12,4)` and `sort_order` to `catalog_item_allocations`, plus `unit_label` on `catalog_items`. `0062` widens `allocation.quantity` from **integer to `numeric(12,4)`**. `0064` creates `inventory_walk_tokens` and `inventory_walk_sessions`. On top: an authenticated count walk, a location rollup, and the R-8 ruling — a walk token is **exchanged for a scoped session** rather than acting as a long-lived credential.

**What it solves.** Precisely the STG-647 finding: Nathaniel's team runs per-location PAR sheets with fractional counts in pack units — 3.5 cases — and Arc's schema could express none of it. Quantity was an integer, there was no par column anywhere, and `stock_locations` was name-only. Now par is per-location, quantity is decimal, and items carry a pack-unit label.

**Where it sits.** `catalog_item_allocations` is the location-scoped join. The walk reuses the portal-token pattern — text a link to a counter who has no Arc account — but R-8 hardened it into a token-for-session exchange.

**The honest gap.** `0064` is auth and session only. **The append-only `inventory_counts` ledger is not in this wave.** So a counter can authenticate into a walk, but count *history* has nowhere to live yet, which means restock-equals-count-minus-par isn't computable end to end.

---

## WS-G — Portal client auth

**Original intent:** reverse Pillar 4 — the standing law that the portal is pure-public with no auth — and give the portal real client accounts. This is the one you signed off on.

**What changed.** The superseding ADR plus its contradiction sweep, then migration `0060` creating `client_accounts`, `client_sessions`, and `client_deal_access` — that third table is the per-deal scoping. Then `requireClientAuth`, client registration and login, the portal shell, **staff view-as-client with server-side refusal**, and `0063`, which binds `client_account_id` onto `signature_records` and `actor_client_account_id` onto `contract_events`.

**What it solves.** A signature previously had no identity behind it — someone with a link signed something. Now a signature carries *who* signed, which is the part that matters legally. And access is scoped per deal rather than per link.

**Where it sits.** A second, deliberately siloed auth realm alongside staff Google OIDC. `requireClientAuth` is the boundary. View-as refuses on the server rather than hiding UI, so a staff member can't reach client data by guessing a URL.

---

## The schema, since you own it

Seven migrations, `0058`–`0064`. Two worth a second look: **`0062` is a type widen on live data** — integer to numeric, non-lossy and safe, but it touches real allocation rows. And **`0060` plus `0063` introduce a second identity realm and wire it into contract signatures**, which is the highest-consequence change in the wave.

## Where this leaves you

Catering and portal both have foundations where they had none. The merge-tag registry is now the spine between builds and documents. Inventory has its schema but not its ledger. **WS-C is the only blocked lane** — 22 UI-behavioral Galley unknowns needing your browser, 9 already closed from introspection while you were out. **WS-A is still held** on the Google OAuth client.

Tell me which lens to change and I'll go deeper — a single migration, one stream's diff line by line, the four-arrow picture, or what the next wave should be given what's now standing.

---

## Operator CTRL addendum (same session, later)

Item 4 first, since you asked for it and it's now measured:

**164 files changed, +15,021 / −923.** By area: `apps/api` 64, `apps/web` 53, `docs` 17, `packages/db` 15, `packages/contracts` 5, `packages/sync` 2. And the top of the churn list answers your item 5 by accident — six of the ten biggest files are **integration tests**: `inventory-walk.integration.test.ts`, `contracts-sign-identity.integration.test.ts`, `menu-plan-snapshot-coherence.test.ts`, `ws-b-pr5-merge-tags.integration.test.ts`. The verify work was the bulk of the wave and my rollup rendered it invisible.

**Item 3 — answered, then dropped.** `WS-D` is just the filename of a brief: `docs/developer/orchestration/ws-b..g-*.md`, the seven streams from the August plan, lettered so I could sequence them this morning. It's fleet-internal bookkeeping that leaked into your briefing. Gone — from now on it's "Galley data plane," "portal client auth," "multi-location inventory."

**Item 2 — I think I know the shape, and it's smaller than a tracking system.** It's not new metadata on ADRs. It's a standing, accumulating section of the rollup: **substrate that exists but isn't wired.** Each entry is four fields — what exists, where it is (`file:line`), what it's missing, what would wire it. It's append-only across waves, entries retire when something consumes them, and Made Well's ground step reads it before planning.

Today alone produced three entries, all exactly your `mutateAndEnqueue` case:

- **Galley write arrow exists, nothing calls it.** `mutateAndEnqueue` plus the allowlist shipped as substrate with no UI. Wiring it is a caller, not a build.
- **`approveMenuPlanEvent` is allowlisted and deliberately unwired.** The reconciliation gate is built and shut.
- **Inventory walk has auth but no ledger.** `inventory_walk_tokens` and `inventory_walk_sessions` exist; the append-only `inventory_counts` table does not. Counting authenticates and then has nowhere to write.

Without that list, the next wave rebuilds one of those three. That's the whole value.

**Item 5 — you've found a real modeling bug, and it's the same one as "inventory is one scalar."** `statem` tracks *one* outer stage per project and one inner phase per cycle. But a project runs many concurrent cycles — five today. So the project's outer stage read `build` all day and told you nothing, and Land has no meaningful trigger because it's asking "is the project landed" when the answer is per-item. My proposal: **Land is per committed item, and the project-level outer stage becomes a rollup of its cycle states rather than a scalar.** Verify then emits evidence per unit — what ran, what passed, which suites — and the rollup surfaces it instead of hiding it in churn. That clarifies the shape without touching the four-phase grammar. It needs your ruling because it's your methodology, not my call.

**Item 6 — this is the big one, and it collides with what just shipped.** Portal client auth landed *today*: three tables, a middleware boundary, signature identity binding. If the portal moves to Mimi's planning app, that's the historic-home relocation you described — and the carry-forward from item 2 is exactly what stops us building further on a foundation that's moving. The transport and CLI/MCP read layer you named already has a head start: the agent-surface work and `arc-cli`/`arc-mcp` exist for precisely "something outside Arc needs to read Arc data."

I need the transcripts to run discovery properly. Discovery's convention is `~/Infinity/discovery/analyses/T<N>_<slug>.md` — the Nathaniel weeklies are `T16_nathaniel_0610`, `T17_nathaniel_0701`, so today's would be `T21_nathaniel_0813`. Nothing new has landed in discovery yet. Where are they — a file, Google Meet transcript, or should I pull from `google_transcript_network.json`?

Meanwhile I'm building item 1 so this stops being me hand-writing briefings.