# Evaluating Business Strategy

Strategic analysis framework for solo developers making commercial decisions. Ensures "can we build it?" is followed by "should we build it?" and "can we sustain it?"

## Description

Analyze problems through commercial viability, market dynamics, competitive positioning, and sustainable business models. Brings economic reasoning and strategic thinking to prevent wasting time on technically interesting but commercially nonviable ideas.

Use when:
- Evaluating product ideas
- Making build-vs-buy decisions
- Assessing market opportunities
- Pricing and monetization questions
- Technical decisions with business implications

## Installation

### Unified Claude Code Access (Primary)

The skill is already installed at:
```bash
~/.claude/skills/evaluating-business-strategy/
```

This single location provides automatic access across:
- Claude Code CLI
- Zed extensions
- VSCode extensions
- Ghosty terminal
- OpenCode
- Any other Claude Code-based interface

No additional configuration needed - the skill is automatically discovered by filesystem-based agents.

### Claude Desktop (Zip-based Feature)

1. Create zip from the installed skill:
```bash
cd ~/.claude/skills/
zip -r evaluating-business-strategy.zip evaluating-business-strategy/
```

2. Go to Settings > Features in Claude.ai
3. Upload the `evaluating-business-strategy.zip` file

### Other Agents (Cursor, VS Code, etc.)

The skill follows the agentskills.io open standard and is portable to other platforms:

**Cursor:**
Follow Cursor's skills installation instructions

**VS Code (GitHub Copilot):**
Follow VS Code skills configuration

**General filesystem-based agents:**
Copy the skill directory to the agent's skills location

## Usage

The skill activates automatically when you discuss:
- Product idea evaluation
- Business strategy decisions
- Market opportunity assessment
- Competitive analysis
- Pricing strategy
- Unit economics
- Resource allocation decisions

## Skill Structure

```
evaluating-business-strategy/
├── SKILL.md                          # Main skill instructions
└── references/                       # Detailed documentation (loaded on demand)
    ├── FRAMEWORKS.md                 # Strategic framework details
    ├── CASE-STUDIES.md               # Real-world applications
    └── UNIT-ECONOMICS.md             # Financial analysis methods
```

## Progressive Disclosure

The skill uses progressive disclosure for efficient context usage:

1. **Main instructions** (SKILL.md): Core decision frameworks, always loaded when activated
2. **Reference materials** (references/): Detailed explanations loaded only when needed

This ensures fast activation while providing deep expertise when required.

## Core Capabilities

- **Commercial viability assessment**: Market validation, unit economics, sustainability
- **Market dynamics analysis**: Porter's Five Forces, Blue Ocean Strategy, competitive positioning
- **Strategic frameworks**: Jobs to Be Done, Lean Startup, Resource-Based View, Dynamic Capabilities
- **Financial analysis**: CAC, LTV, cohort analysis, break-even modeling
- **Decision support**: Build vs. buy, pricing strategy, resource allocation

## License

MIT License

Copyright (c) 2024 JR

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Iteration and Feedback

This skill improves through real usage. As you use it:
- Observe where it helps or struggles
- Note unexpected insights or gaps
- Test across different agent platforms
- Return with observations for refinement

The skill evolves based on actual usage patterns, not assumptions.

## Compliance

Fully compliant with agentskills.io v1.0 open standard:
- Portable across Claude, Cursor, VS Code, GitHub Copilot, and other skills-compatible agents
- Progressive disclosure architecture
- Filesystem-based discovery
- Standard YAML frontmatter
- References directory for detailed documentation

## Version

1.0 - Initial release
