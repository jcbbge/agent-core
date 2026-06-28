---
description: Universal git conventions — applies to all projects
globs: ["**/.git/**/*", "**/COMMIT_EDITMSG"]
---

# Git Rules

- Never commit or push without explicit confirmation unless blanket permission granted for the session.
- Never force-push to main/master. Warn if asked.
- Never use `--no-verify` or bypass hooks unless explicitly requested.
- Never amend a published commit — create a new one.
- Stage specific files by name. Never `git add -A` or `git add .` without reviewing what's staged.
- Before staging any config file (plist, yml, Makefile, docker-compose, JSON), scan for secrets: look for `sk-`, `_KEY=`, `_TOKEN=`, `_SECRET=`, `Bearer ` followed by a real value — not a placeholder. If found, extract to `.env` first.
- Prefer new commits over amending. If a pre-commit hook fails, fix the issue and create a NEW commit.
