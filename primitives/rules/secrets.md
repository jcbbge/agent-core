---
description: Secret hygiene — applies to all projects, all file types, all config formats
globs: ["**/*.plist", "**/*.env*", "**/launchd/**/*", "**/*.service", "**/docker-compose*", "**/Makefile", "**/*.yaml", "**/*.yml", "**/*.json"]
---

# Secret Rules

Secrets are never inline. This applies to ALL config formats without exception.

## Hard Rules

- **NEVER** put API keys, tokens, passwords, or bearer credentials in plist `EnvironmentVariables` dicts
- **NEVER** put secrets in any file that is or could be committed to git — plist, Makefile, docker-compose, CI yml, JSON config
- **ALWAYS** load secrets at runtime from a gitignored file (`.env`) or a secrets manager
- **VERIFY** before staging: if a file contains any value matching `sk-`, `Bearer `, `_KEY=`, `_TOKEN=`, `_SECRET=`, or `_PASS=` followed by a real value (not a placeholder) — stop, do not stage

## Plist EnvironmentVariables: What Is Allowed

| Allowed inline | Not allowed inline |
|---|---|
| `localhost` / `127.0.0.1` URLs | API keys (`sk-or-v1-...`, `sk-ant-...`) |
| Local dev defaults (`root`/`root` for SurrealDB) | External service tokens |
| Model names, namespace strings | Any credential that rotates or has a cost |
| Non-secret config (`EMBEDDING_DIM=768`) | OAuth secrets, webhook signing keys |

External API keys must be loaded by the application from `.env` at runtime — NOT injected by launchd.

## Gitignore Requirements

Every repo containing a launchd plist **MUST** have these entries in `.gitignore`:

```
*.plist
!*.plist.template
```

Committed plist templates must contain only placeholder values (`YOUR_KEY_HERE`, empty strings, `CHANGE_ME`).

## Pre-commit Hook Requirement

Every repo with daemon plists or `.env` files **MUST** have an active pre-commit scanner installed:

```bash
brew install git-secrets
cd /path/to/repo
git secrets --install
git secrets --add 'sk-or-v1-[a-zA-Z0-9]+'
git secrets --add 'sk-ant-[a-zA-Z0-9]+'
git secrets --add 'sk-[a-zA-Z0-9]{40,}'
```

The `--install` flag writes an active `pre-commit` hook (not `.sample`).

## Pre-stage Checklist

Before `git add` on any config file:
1. Does this file contain `EnvironmentVariables` or `env:` or `environment:`? → inspect every value
2. Does any value match an API key pattern? → extract to `.env` first, then stage
3. Is the corresponding `.env.example` up to date? → update it if you added a new key
