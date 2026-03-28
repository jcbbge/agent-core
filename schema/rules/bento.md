---
description: Bento product context — stack, domain, production safety rules
globs: ["**/Infinity/bento/**/*", "**/Infinity/bento-build/**/*", "**/Infinity/bento-merge-service/**/*"]
---

# Bento

**Stack:** Laravel (PHP) backend · Vue 3 frontend · PostgreSQL · HubSpot CRM integration · Forte payment gateway

**Key domain concepts:** inventory groups · payment schedules · user-vendor mapping · charge schedules

**Production path:** `/Users/jcbbge/Infinity/bento` — `main` branch is production.
Stop and confirm before any push or destructive operation on main.

**Available tools:**
- HubSpot MCP for CRM queries
- `bento-do-query` skill for direct DB access (always confirm before running against production)
