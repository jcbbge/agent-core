# PARKED — Arc pack list freeze / stale check (STG-671 slices 4-5)

**Parked:** 2026-08-21, by `orch-arc-freeze-stale` (CORD seat), on operator order.
**Reason for parking:** the operator reordered priorities. This unit is **downstream of a
discovery ideation pass that has not happened yet**. Building now would front-run the
design. Nothing here is a blocker; it is premature, not stuck.

---

## Tree state I am leaving behind

- Checkout: `/Users/jrg/infinity/arc`, on `main` at `bf7e749`.
- `git status --porcelain` is exactly two entries, **both pre-existing and NOT mine**:
  - `?? docs/builder/briefs/` (contains `ORCH-cmdk-j-COMMON.md`)
  - `?? docs/platform/integrations/humanity/` (contains `RELAY_PRD.md`, `WORK.md`)
- No uncommitted work of mine anywhere. No worktrees created. No fleet spawned — no
  panes to reap.
- **Landed (already on `main`, do not revert without a ruling):** PR #279 ->
  `bf7e749` `docs(admin): plan the pack list freeze stale check` — the plan artifact
  `docs/admin/PLAN-packlist-freeze-stale-check.md`. It is a plan, not implementation.
- **Open and MUST NOT MERGE while parked:** PR #280 on branch
  `docs/stg-671-orch-brief`, commit `648c4d5`, adding
  `docs/developer/orchestration/stg-671-freeze-stale-orch.md` (the ORCH brief). Branch
  exists locally and on `origin`. Leave it open as the resume handle, or close it — but
  do not merge it until the discovery pass has run, because the brief dispatches work
  the discovery pass may redesign.

### DAMAGE I caused, unrecovered

While moving `648c4d5` off `main` I ran `git reset --hard HEAD~1` in the shared dirty
checkout and **destroyed another lane's unstaged changes**:

- `apps/api/src/routes/webhooks/humanity.ts` — 569 lines -> 496 (~73 lines lost)
- `apps/api/src/routes/webhooks/humanity-types.ts` — modifications lost
- `docs/platform/integrations/hubspot/hubspot-manifest.md` — modifications lost

Unrecoverable on this machine: never staged (all 5 dangling blobs checked, no match), no
stash, no APFS local snapshots. The untracked humanity docs above survived. Owner is the
humanity relay lane; this is reported to the operator and is NOT part of this unit's
resume path. Rule written to memory: never `git reset --hard` in the shared Arc tree.

---

## What I verified (2026-08-21, against `a09e908`/`bf7e749`)

Every fact below was read from the repo this session. Re-verify anything older than the
resume date, but these are the load-bearing ones:

- The brief that seeded this unit contained a **vacuous fact**: "grep in `src/` -> zero
  hits." There is no root `src/` in Arc; the trees are `apps/api`, `apps/web`,
  `packages/*`. Any path of the form `src/freeze/fingerprint.ts` names nothing. Do not
  inherit those paths.
- **`pack_list` has NO render-path admission.** `pack_list` / `documentType` appear
  nowhere in `apps/api/src/lib/contracts/render.ts`,
  `apps/api/src/lib/contracts/tables.ts`, or `apps/api/src/routes/contracts.ts`. It
  exists only as a `document_type` enum value
  (`apps/api/drizzle/0041_document_type.sql:2,10,17`,
  `packages/db/src/schema/contracts.ts:51-55`). Nothing compiles a pack listing today.
  **This is the real first blocker, and it is upstream of anything about staleness.**
- `renderContractVersion` = `apps/api/src/lib/contracts/render.ts:39`.
- The projection seam to branch = the `r.is_billable` filter at
  `apps/api/src/lib/contracts/tables.ts:98-101`, inside the row select at
  `tables.ts:77-110`.
- `contract_versions` = `packages/db/src/schema/contracts.ts:67-96`. Carries
  `html_rendered`, `field_manifest jsonb`, `version_number`, `build_id`. No freeze
  concept, no composition snapshot column.
- Notification substrate that already exists: `packages/email/src/index.ts:42` (`email`
  facade), `renderArcEmail`, Mandrill transport; `emails` table
  (`packages/db/src/schema/emails.ts:3-46`) with UNIQUE `idempotency_key`. In-app:
  `apps/web/src/components/shell/StatusBar.tsx`, `apps/web/src/lib/local/status.ts`,
  `apps/web/src/components/contracts/ContractPreview.tsx`. Arc has no toasts.
- The HubSpot staff-workflow property named in
  `docs/decisions/2026-06-10-document-diff-versioning.md:56` is **UNKNOWN** — "Josh to
  sync with Mary on the exact HubSpot property." Never guess it into a `sync_outbox` row.
- Next migration number: **0065** (tail is `0064_inventory_walk_sessions.sql`).
- ShapeDefs to imitate: `packages/sync/src/index.ts:165-178` (`build_items`,
  `build_item_options`), `:179-192` (`contracts`, `contract_versions`).
- `node ci/check-file-sizes.mjs` fails on `apps/api/src/routes/webhooks/humanity.ts`
  independent of this unit (it was 569 lines against a 500 ceiling; now 496 after the
  damage above, so it may currently pass).

## What I had decided (rulings, with rejected alternatives)

Full text in `docs/admin/PLAN-packlist-freeze-stale-check.md` on `main`. These are the
product spec's open questions, ruled — the discovery pass may overturn them, and should
read them as prior art rather than constraint.

1. **Storage: versioned snapshots, not a mutable baseline.** `B` = one row per Annotate
   in a new `pack_freezes` table (`composition jsonb`); `A` versions are
   `contract_versions` rows carrying `pack_freeze_id`. Diffs computed at read time.
   - Rejected: a mutable baseline — cannot answer "stale relative to which listing" once
     two listings exist; re-annotating erases the evidence that the floor moved under the
     copy already printed.
   - Rejected: `B` as a jsonb column on each `A` — copies the same fact into every
     ink-only save (data-doctrine duplicate case) and makes "B unchanged" a convention
     rather than a structure.
   - Rejected: persisting the fingerprint — a stored hash can drift from what it
     summarizes; it is a pure function over tens of rows. Only `notified_fingerprint`
     (notification state) persists.
2. **Signalling: three in-app signals, email out-of-band.** Stale chip on the listing,
   status-bar line on the fresh->stale flip, print/send guard; email via
   `packages/email` deduped by `emails.idempotency_key`.
   - Rejected: a `stale_since` flag on live build rows — write amplification on the sales
     path, lies after a relink, couples sales writes to production-lane state.
   - Rejected: red/green diff inside `A` — the spec excludes it; `A1` vs `A2` is her ink
     only, and 20 -> 200 must never render as her edit.
   - Deferred, not designed around: the HubSpot workflow trigger (property name is
     unverified external reality).
3. **Fingerprint boundary.** Hashed: `build_item_id`, snapshot `name`, section key,
   subsection label, `is_billable`, active option id + name, `quantity`; order-insensitive
   (sorted by item id). Excluded: all money (a repriced 20 chairs is still 20 chairs),
   her ink, `created_at`/`updated_at`/`added_by`/`updated_by` (authorship answers *who*
   after the verdict, it is not an input), option `status`, row order.

## First three moves for whoever resumes

1. **Run the discovery ideation pass this unit is downstream of** — it is the reason for
   the park, and it has not happened. Do not open the plan doc as a to-do list first;
   open it as prior art that discovery is free to overturn. Confirm with the operator
   which discovery thread this is (T23 / Maggie pack-list line) before spending context.
2. **Then rule on PR #280** (`docs/stg-671-orch-brief`): if discovery leaves the rulings
   standing, merge it and dispatch the ORCH it describes. If discovery moves the design,
   close it and rewrite the brief from the new picture — do not patch a stale brief.
3. **Whatever the design, `pack_list` render-path admission is the first code task** and
   is unlikely to change: branch `tables.ts:98-101` so a production projection includes
   non-billable rows and omits price columns, leaving `contract` and `tasting_menu`
   renders byte-identical. It is small, independent of the freeze design, and everything
   downstream needs a compilable `A`. Keep the S5 expanded-bundle-quantity adapter out —
   it waits on W-BUNDLES S3.

Standing constraints for the resume: no mocks ever (real rows on the PR's own Neon
branch), one task = one branch = one PR, workers never commit to `main`, and the gate is
the local lefthook pre-push suite run exactly as `AGENTS.md` "Verification" lists it.

---

## Added by the concierge, 2026-08-21 — two findings routed here from T23 Unit 1

Whoever resumes production-mode work owns these. Source:
`~/infinity/discovery/specs/T23-U1-findings-for-concierge.md`.

**1. Pack-list scratch-pad section.** The operator designed this in-session: a
default `pack_list` section on the build; items non-billable by default; off the
contract, on the pack list; toggle retained. Smaller than it sounds — the
non-billable flag already does exactly this, and the production spec already
permits her ad-hoc non-billable edits.

**OPEN WRINKLE, and it is the interesting part:** her additions are
**composition, not ink**, so after annotating they trip her own live-vs-B
doorbell. Attribution exists; **policy does not.** A scratch-pad that rings its
own alarm is worse than no scratch-pad. Rule the policy before building the
section.

**2. Principle, precondition for any forecasting surface being trustworthy:**

> If it consumes physical inventory, it must be a build row; ink carries
> instructions, never quantities.

The production spec already rules the negative half (an ink-only revision *"must
not include 20 → 200"*). The positive half is being given a home by
`orch-doc-status-hygiene`.

**Also relevant to the resumption:** STG-673 Phase A is now PROMOTED and landed
(arc `21b7a06`, five rows in `docs/admin/BACKLOG-inventory-packlist.md`), and an
orchestrator is live on it (`orch-stg673-phase-a`, Plan-first, scout before
implementation). STG-673 Phase B remains STAGED, gated on STG-675.
