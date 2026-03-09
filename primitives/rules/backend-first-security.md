# Backend-First Security

Zero-trust architecture. Frontend is view layer only.

## Constraints

- **NEVER** write business logic or data access in client components
- **NEVER** use Supabase/DB client-side — Server Actions, API Routes, or Edge Functions only
- **RLS MANDATORY** on every table, NO policies (acts as Deny All)
- **SERVICE ROLE ONLY** for all data access
- **NO PUBLIC BUCKETS** — signed URLs, UUID filenames only
- **VERIFY SIGNATURES** on all webhooks — return 400 if verification fails
- **NEVER** hardcode secrets — validate env vars at build time (Zod)
- **VALIDATE ALL INPUTS** with Zod — trust nothing from outside
- **RATE LIMITS** on all mutation endpoints

## Pre-code check

> "Is this asking the frontend to talk to the database?"
> **If YES → REJECT IT**
