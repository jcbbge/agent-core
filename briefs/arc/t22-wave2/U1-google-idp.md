# UNIT — Google is Arc's IdP; HubSpot is a data pull (STG-664)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-664 — Arc's IdP is Google; HubSpot is a data pull, not login.** [infra]
Josh: he switched Arc auth to Google because HubSpot was using Google anyway —
*"when you log in Arc you'll be using Google."* HubSpot remains connected for
data. Mimi offered her existing HubSpot pull engine (one pull, ~10-minute cache;
she had been hitting HubSpot rate limits on live-event views) and a shared
"infinity hub" of utilities. **The IdP cut is Arc's; the shared pull engine is
Mimi's unless Josh takes a dependency.**
Route: `platform/BACKLOG-infra.md`; **do not rebuild HubSpot OAuth as the staff
login.**

## What to hash out

- The IdP half looks settled (Josh already cut it). Confirm whether it is
  *shipped* or *decided* — those are different, and only one needs a brief.
- The live decision is the **dependency question**: does Arc consume Mimi's
  HubSpot pull engine, or run its own pull? Rate limits are the stated driver —
  she was hitting them on live-event views, and a shared cache is the remedy.
  Taking her engine is a cross-team runtime dependency; running your own
  duplicates the rate-limit exposure. This is a real fork with real cost.
- The "infinity hub" of shared utilities is a broader posture question hiding
  inside a small item. Related: STG-651 (a second Infinity server for utility
  workloads) is STAGED. Read it — the hub may be the same idea arriving twice.
- Interacts with STG-670 (no unattended HubSpot writes): reads and writes to
  HubSpot may want the same gateway.
