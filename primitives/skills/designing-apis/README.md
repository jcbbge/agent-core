# Designing APIs

A practical skill for designing REST APIs that are simple, stable, and scalable.

## Description

This skill helps solo developers and small teams design REST APIs following modern best practices. It covers the essential topics without over-engineering: versioning, authentication, pagination, idempotency, and rate limiting.

## Installation

### Claude Code
```bash
cp -r designing-apis ~/.claude/skills/
```

The skill will be automatically discovered when you start a new Claude Code session.

### Claude Desktop
1. Zip the skill directory:
   ```bash
   cd ~/.claude/skills/
   zip -r designing-apis.zip designing-apis/
   ```
2. Open Claude Desktop
3. Go to Settings > Features
4. Upload `designing-apis.zip`

### Other Agents (Cursor, VS Code, GitHub Copilot, etc.)
This skill follows the agentskills.io open standard and is portable across platforms.

**VS Code/GitHub Copilot:**
- Copy to `.github/skills/designing-apis/` in your project root

**Cursor:**
- Follow Cursor's skill installation instructions

**General filesystem-based agents:**
- Copy to the agent's skill directory (varies by platform)

## Usage

The skill activates automatically when you:
- Design new API endpoints
- Review existing API designs
- Discuss versioning, authentication, or pagination
- Plan idempotency or rate limiting strategies

Example triggers:
- "Help me design a REST API for user management"
- "Should I version this API endpoint?"
- "How do I implement pagination?"
- "What authentication should I use?"

## What's Included

### Main Skill (SKILL.md)
- Golden rules (WE DO NOT BREAK USERSPACE)
- API design workflow checklist
- Quick decision trees
- Common REST patterns
- Error handling guide

### References
- **versioning.md** - API versioning strategies and migration timelines
- **pagination.md** - Offset vs cursor-based pagination with examples
- **authentication.md** - API keys, OAuth, and JWT patterns
- **safety.md** - Idempotency and rate limiting implementation

## Philosophy

This skill follows these principles:

1. **Good APIs are boring** - Use familiar patterns
2. **Never break userspace** - Stability over elegance
3. **Start simple** - Add complexity only when needed
4. **Design for non-engineers** - Many users aren't professional developers
5. **Plan for scale** - Use cursor pagination and rate limits from day one

## Requirements

None. This skill is pure guidance with code examples. No external dependencies.

## License

MIT

## Author

jrg | claude

## Version

1.0

## Portability

This skill is compliant with the agentskills.io open standard and works across:
- Claude Code
- Claude Desktop (claude.ai)
- Cursor
- VS Code (GitHub Copilot)
- GitHub Copilot CLI
- OpenCode
- And other skills-compatible agents

## Contributing

To improve this skill:
1. Use it in real API design scenarios
2. Note where it helps or where it falls short
3. Update based on actual usage patterns
4. Test portability across different agent platforms

## Support

For questions or issues, refer to the skill files or the original article that inspired this skill:
https://til.simonwillison.net/llms/api-design
