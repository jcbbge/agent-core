# building-with-solidstart

Agent Skill for building full-stack applications with SolidStart, the meta-framework for SolidJS.

## Description

This skill provides comprehensive guidance for working with SolidStart applications, covering:

- **File-based routing** - Dynamic routes, nested layouts, route groups
- **Server functions** - "use server" directive and server/client boundaries
- **Data fetching** - query, createAsync, preloading patterns
- **Forms and actions** - Progressive enhancement, validation, optimistic UI
- **SSR/SSG/Streaming** - Rendering strategies and optimization
- **API routes** - REST endpoints and serverless functions
- **Deployment** - Platform-specific guides (Cloudflare, Vercel, Netlify, AWS)
- **Performance** - Bundle optimization, caching, lazy loading
- **Ecosystem** - UI libraries, testing, authentication, databases

**Note**: For SolidJS core reactivity concepts (signals, effects, stores, components), reference the `building-with-solidjs` skill.

## Installation

### Unified Claude Code Access (Primary)

The skill is already installed at:

```bash
~/.claude/skills/building-with-solidstart/
```

This location provides automatic access across:
- Claude Code CLI
- Zed extensions
- VSCode extensions
- Ghosty terminal
- OpenCode

No additional installation needed - the skill is available immediately across all Claude Code interfaces.

### Claude Desktop (Zip-based Feature)

To use this skill in Claude Desktop (claude.ai):

1. Locate the zip file at: `~/.claude/skills/building-with-solidstart.zip`
2. Go to Claude Desktop → Settings → Features
3. Upload `building-with-solidstart.zip`
4. The skill will be available in your Claude Desktop sessions

### Other Agents

For Cursor, VS Code, GitHub Copilot, or other platforms:

```bash
# Copy to your agent's skills directory
cp -r ~/.claude/skills/building-with-solidstart /path/to/your/agent/skills/
```

Follow your platform's specific instructions for skills installation.

## Usage

The skill activates when you:
- Ask about SolidStart features
- Work with file-based routing
- Use server functions or "use server" directive
- Implement data fetching with createAsync
- Create forms and actions
- Configure SSR/SSG/streaming
- Build API routes
- Deploy to hosting platforms
- Optimize performance

### Example Queries

```
"How do I create a dynamic route in SolidStart?"
"Show me how to use server functions with database access"
"How do I implement form actions with validation?"
"What's the best way to deploy to Cloudflare Pages?"
"How do I optimize bundle size in SolidStart?"
```

## Directory Structure

```
building-with-solidstart/
├── SKILL.md                      # Main instructions with quick starts
└── references/
    ├── ROUTING.md                # Complete routing patterns
    ├── DATA-LOADING.md           # query, createAsync, caching
    ├── SERVER-FUNCTIONS.md       # Server boundaries, serialization
    ├── FORMS-ACTIONS.md          # Progressive enhancement, validation
    ├── DEPLOYMENT.md             # Platform deployment guides
    ├── PERFORMANCE.md            # Optimization techniques
    └── ECOSYSTEM.md              # Libraries and integrations
```

## Key Features

### Progressive Disclosure

The skill uses a layered approach:

1. **SKILL.md** - Quick reference with common patterns
2. **references/** - Detailed guides loaded on demand

This keeps context efficient while providing comprehensive documentation when needed.

### Compliant with agentskills.io

This skill follows the open standard specification:
- Portable across all skills-compatible agents
- Uses proper YAML frontmatter
- Implements progressive disclosure
- Includes comprehensive reference documentation

## Related Skills

- **building-with-solidjs** - Core SolidJS reactivity, components, and patterns

Use this skill for SolidJS fundamentals (signals, effects, stores, control flow) and `building-with-solidstart` for framework-specific features (routing, server functions, deployment).

## Requirements

- SolidStart v1.0.0+
- Node.js v18+
- Understanding of web development fundamentals
- Basic knowledge of SolidJS (see `building-with-solidjs` skill)

## Version

1.0.0

## Author

JR

## License

Internal use

## Feedback & Iteration

This skill improves through real usage. If you encounter:
- Missing patterns
- Unclear instructions
- Outdated information
- Edge cases not covered

Please provide feedback for future iterations.

## Additional Resources

- [SolidStart Documentation](https://docs.solidjs.com/solid-start/)
- [SolidJS Documentation](https://docs.solidjs.com/)
- [Solid Router Documentation](https://docs.solidjs.com/solid-router/)
- [SolidJS Discord](https://discord.com/invite/solidjs)
