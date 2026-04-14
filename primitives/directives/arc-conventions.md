# Arc Conventions

## Stack
- Runtime: Node.js 22, TypeScript
- Package manager: pnpm
- Database: PostgreSQL + Drizzle ORM
- Testing: Vitest

## Rules
- Never mutate accepted or sent quotes
- Price locks snapshot at quote creation — never re-reference source catalog
- Portal URLs use portal_token, never sequential IDs
- Internal notes never appear in client-visible surfaces

## Added rule: always run pnpm typecheck before commit
new arc rule: always check price locks
