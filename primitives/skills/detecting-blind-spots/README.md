# Detecting Blind Spots - AI Skill

Surface what's not being said, considered, or acknowledged in plans and decisions. Identifies missing perspectives, ignored risks, unstated assumptions, and knowledge gaps that could derail effectiveness.

## Description

This AI skill enables systematic blind spot detection in human-AI collaboration through five core mechanisms:

1. **Absence detection** - What's conspicuously not mentioned?
2. **Assumption mapping** - What's being taken for granted?
3. **Knowledge gap identification** - Where is uncertainty masked as certainty?
4. **Perspective shifting** - What would others say about this?
5. **Temporal blindness** - What changes over time not accounted for?

The skill applies established frameworks (Johari Window, Pre-Mortem, Red Team thinking, Devil's Advocate) and is informed by academic research on cognitive bias detection, AI-augmented judgment, and perspective-taking in collaborative problem solving.

## When to Use

- Making major decisions or strategic plans
- Before launching or committing to projects
- When something feels "off" but it's unclear why
- When asking "What am I missing?" or "Am I overlooking something?"
- When everyone seems to agree (potential groupthink)
- Conducting post-mortems or retrospectives
- Planning resource allocation or architectural changes

## Installation

### Unified Claude Code Access (Primary - Recommended)

This provides automatic access across all Claude Code-based interfaces from a single installation:

```bash
# Option 1: Copy from this location if already installed
cp -r detecting-blind-spots ~/.claude/skills/

# Option 2: Unzip to the unified skills directory
cd ~/.claude/skills/
unzip detecting-blind-spots.zip
```

**Works automatically with:**
- Claude Code CLI
- Zed editor extensions
- VSCode extensions
- Ghosty terminal
- OpenCode
- Any other filesystem-based agent using ~/.claude/skills/

### Claude Desktop (Zip-based Feature)

1. Locate the zip file: `detecting-blind-spots.zip`
2. Open Claude Desktop (claude.ai)
3. Go to Settings > Features
4. Upload the zip file
5. Skill will be available in your Claude Desktop sessions

**Note:** This is per-user installation, not shared org-wide.

### Other Agent Platforms

This skill follows the [agentskills.io open standard](https://github.com/agentskills/agentskills), making it portable across multiple platforms:

- **Cursor**: Follow Cursor's skills installation instructions
- **VS Code**: Follow GitHub Copilot skills installation instructions  
- **GitHub Copilot CLI**: Follow platform-specific installation
- **OpenCode, Amp, Letta, Goose**: Follow respective platform instructions

## Skill Structure

```
detecting-blind-spots/
├── SKILL.md                      # Main skill instructions
└── references/                   # Progressive disclosure documentation
    ├── FRAMEWORKS.md            # Detailed framework reference
    ├── RESEARCH.md              # Academic foundations & case studies
    └── EXAMPLES.md              # Extended application examples
```

## How It Works

The skill uses **progressive disclosure**:

- **Metadata** (~100 tokens): Loaded at startup for all skills
- **SKILL.md** (~5000 tokens): Main instructions loaded when skill activates
- **references/** (as needed): Detailed documentation loaded on demand

AI agents can reference the detailed frameworks, research, and examples when deeper understanding is needed, while keeping the main instructions concise and actionable.

## Core Delivery Principles

**Critical:** Blind spot detection must be delivered carefully to be useful.

- **Frame as questions, not accusations**: "Have you considered X?" vs "You're missing X"
- **Explain WHY it matters**: Connect blind spot to potential consequences
- **Distinguish ignorance from choice**: Is this overlooked or intentionally deprioritized?
- **Calibrate intensity to stakes**: Light touch for low stakes, comprehensive for high stakes
- **Offer paths forward**: Suggest how to address, not just identify problems

## Examples

**Scenario: "I'm migrating to VPS to save money"**

Blind spots surfaced:
- Time/complexity opportunity cost: "You're optimizing for money but not mentioning time investment. Why?"
- Mental health contingency: "You're confident in your ability to manage this, but you've mentioned burnout. What happens if your mental health fluctuates?"
- Future collaboration: "What happens when you want to hire someone? Does this architecture support that?"

**Scenario: "I need a creative outlet"**

Blind spots surfaced:
- Actual motivation: "This might not be about creativity - could it be about connection, recognition, or purpose?"
- Timing trigger: "Why now? What changed? What's the actual trigger for this need?"
- Public vs private: "You said 'creative outlet' but everything you're describing is public performance. Is the privacy aspect important?"

## Research Foundation

The skill is informed by:

- Academic research on cognitive bias detection (Helberger et al., Kahneman & Tversky)
- AI-augmented human judgment enhancement research
- Perspective-taking in human-AI teams (Galinsky et al.)
- Real-world case studies (Microsoft Azure, Google, Amazon, NASA)
- Established frameworks (Johari Window, Pre-Mortem, Red Team, Devil's Advocate)

See [references/RESEARCH.md](references/RESEARCH.md) for detailed citations and findings.

## Testing the Skill

To verify the skill is working:

1. **Open a new Claude Code session** (or restart your Claude Desktop)
2. **Test with a trigger phrase**: "I'm planning to [major decision]. What am I missing?"
3. **Expect**: AI should systematically explore blind spots using the five mechanisms
4. **Validate**: AI should surface unstated assumptions, ignored perspectives, and temporal changes

The skill should activate when:
- Making major decisions
- User asks "What am I missing?"
- Planning significant projects or changes
- Something feels "off" but unclear why

## Customization

You can adapt this skill by:

- Modifying SKILL.md to adjust delivery style or emphasis
- Adding domain-specific examples to references/EXAMPLES.md
- Extending frameworks in references/FRAMEWORKS.md
- Updating research foundations in references/RESEARCH.md

## Validation

This skill has been validated against agentskills.io open standard requirements:

✓ Name: lowercase, hyphens, max 64 chars, matches directory  
✓ Description: includes what it does AND when to use it  
✓ License: MIT  
✓ Structure: SKILL.md under 500 lines with progressive disclosure  
✓ References: Focused files in references/ directory  
✓ Portability: Works across multiple agent platforms  

## License

MIT License

Copyright (c) 2024 JR

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

This skill follows the [agentskills.io open standard](https://github.com/agentskills/agentskills) for maximum portability.

To improve this skill:
1. Test it in real workflows across different agent platforms
2. Note where agents struggle or succeed
3. Identify patterns of actual blind spots vs false alarms
4. Submit improvements with observations from real usage

## Support

For issues, questions, or suggestions:
- Reference the research foundations in references/RESEARCH.md
- Check examples in references/EXAMPLES.md for application patterns
- Review frameworks in references/FRAMEWORKS.md for deeper understanding

## Version

v1.0 - Initial release

## Author

JR - Solo indie developer specializing in SolidJS ecosystem and AI tooling
