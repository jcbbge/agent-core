# Reframing Problems - Agent Skill

## Description

Challenge how problems are formulated to ensure we're solving the right problem. Often the stated problem is a symptom, constraint, or solution in disguise—reframing reveals the actual underlying issue.

This skill helps AI assistants collaboratively explore problem formulations through question-driven inquiry, constraint analysis, and meta-problem identification.

## Installation

### Unified Claude Code Access (Primary)

The skill is already installed at:
```bash
~/.claude/skills/reframing-problems/
```

This location provides automatic access across:
- Claude Code CLI
- Zed extensions
- VSCode extensions
- Ghosty terminal
- OpenCode
- Any other filesystem-based Claude Code interface

No additional installation needed for these platforms.

### Claude Desktop (Zip-based Feature)

For Claude.ai desktop/web interface:

1. Locate the zip file: `~/.claude/skills/reframing-problems.zip`
2. Go to Claude.ai → Settings → Features
3. Upload the zip file
4. Skill will be available in your conversations

### Other Agent Platforms

The skill follows the agentskills.io open standard and is portable to:
- Cursor
- VS Code (GitHub Copilot)
- GitHub Copilot CLI
- OpenCode
- Amp
- Letta
- Goose
- Any other skills-compatible agent

Follow your platform's skill installation instructions.

## Usage

### When to trigger

The skill activates when users:
- Say "I'm stuck on this" or "this isn't working"
- Face intractable problems despite reasonable efforts
- Request validation of their problem formulation
- Ask questions suggesting their approach may need reframing
- Are about to start major projects (preventive reframing)

### What it does

The AI assistant will:
1. Ask exploratory questions about the stated problem
2. Identify assumed constraints vs real requirements
3. Look for meta-problems worth solving instead
4. Offer multiple alternative problem framings
5. Validate reframes against user's actual goals
6. Proceed collaboratively based on user's chosen framing

### Example interaction

```
User: "Our database queries are too slow. How do I optimize them?"

AI: Before diving into query optimization, let me understand the context:
- How slow is "too slow"? What's the actual vs required performance?
- When did this become a problem? What changed?
- Who's experiencing slow queries? All users or specific use cases?
- What's the business impact?

Based on your answers, I'm seeing a few possible framings:
1. Could this be about data model design rather than query optimization?
2. Would aggressive caching be simpler than optimizing all queries?
3. Is this about actual speed or user perception of speed?

Which of these feels closest to what you're actually trying to achieve?
```

## Structure

```
reframing-problems/
├── SKILL.md              # Main instructions (200 lines)
└── references/
    ├── FRAMEWORKS.md     # Detailed framework documentation
    └── EXAMPLES.md       # Extended examples and case studies
```

**Progressive disclosure:** The AI loads SKILL.md by default, then references framework details or examples on demand as needed.

## Key Features

- **Question-driven approach:** Uses inquiry rather than declarative statements
- **Multiple frameworks:** Five Whys, Ladder of Inference, Constraint Mapping, Systems Thinking, and more
- **Collaborative:** Respects user agency, offers options rather than corrections
- **Practical examples:** Real-world case studies from tech, product, career, and business domains
- **Validation protocols:** Ensures reframing leads to actionable clarity

## Requirements

- No external dependencies
- Works with any AI assistant supporting the agentskills.io standard
- Text-based interaction only (no special tools required)

## Frameworks Included

- **Five Whys:** Root cause analysis through iterative questioning
- **Ladder of Inference:** Challenge assumptions and interpretations
- **Constraint Mapping:** Distinguish real vs assumed constraints
- **Theory of Constraints:** Identify and address system bottlenecks
- **Systems Thinking:** Understand feedback loops and leverage points
- **Appreciative Inquiry:** Strength-based problem exploration
- **Wicked vs Tame Problems:** Problem classification and approach selection

## License

MIT License - See skill metadata for details

## Version

1.0

## Author

agentskills.io

## Feedback and Iteration

This skill improves through real usage. Observations about what works well or what could be better are valuable for future iterations.

## Learn More

- agentskills.io open standard: https://github.com/agentskills/agentskills
- Skill validation tool: https://github.com/agentskills/agentskills/tree/main/skills-ref
