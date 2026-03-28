# Backend-First Security

Zero-trust architecture. Frontend is view layer only.

## Constraints

- **NEVER** write business logic or data access in client components
- **NEVER** access the database from the client — all DB access via server-side handlers only
- **NEVER** expose DB credentials or internal APIs to the frontend
- **NO PUBLIC BUCKETS** — signed URLs, UUID filenames only
- **VERIFY SIGNATURES** on all webhooks — return 400 if verification fails
- **NEVER** hardcode secrets in ANY file type — source code, plist `EnvironmentVariables`, docker-compose `environment:`, CI yml, Makefile, JSON config. Validate at load time (Zod for web apps; runtime `.env` load for daemons). There is no "it's just config" exception.
- **VALIDATE ALL INPUTS** with Zod — trust nothing from outside
- **RATE LIMITS** on all mutation endpoints

## Pre-code check

> "Is this asking the frontend to talk to the database?"
> **If YES → REJECT IT**
