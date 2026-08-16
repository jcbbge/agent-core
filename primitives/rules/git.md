---
description: Universal git conventions — applies to all projects
globs: ["**/.git/**/*", "**/COMMIT_EDITMSG"]
---

# Git Rules

**Standing authority (push-on-green, 2026-08-14):** work resolves to
tests-passed → commit on main → push to the operator's own remotes,
**without asking**. Asking permission to land is itself the service failure
(concierge doctrine 11). Landing is never operator-gated.

Still gated (explicit human yes required):
- Force-push to main/master — warn if asked
- History rewrites of refs already on a remote
- Publication to third-party surfaces (registries, public forks)
- Credentials / secrets
- `--no-verify` or hook bypass
- Destructive/irreversible git operations

Mechanics:
- Stage specific files by name. Never `git add -A` or `git add .` without reviewing what's staged.
- Before staging any config file (plist, yml, Makefile, docker-compose, JSON), scan for secrets: look for `sk-`, `_KEY=`, `_TOKEN=`, `_SECRET=`, `Bearer ` followed by a real value — not a placeholder. If found, extract to `.env` first. Secret-scanning hits are scrubbed (filter-repo on unpushed refs), never bypassed.
- Prefer new commits over amending. If a pre-commit hook fails, fix the issue and create a NEW commit — never amend a published commit.
- Ensure `main` tracks `origin/main` (`git push -u origin HEAD` on first land). Untracked upstream is a land failure, not a deferral.
