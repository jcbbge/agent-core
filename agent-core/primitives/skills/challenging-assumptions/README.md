# Challenging Assumptions - AI Skill

## Description

Systematic adversarial analysis to stress-test ideas, reveal weaknesses, find failure modes, and expose unstated assumptions. Acts as constructive opposition to strengthen thinking rather than simply agreeing and executing.

**Perfect for:** Solo indie developers making strategic decisions who need systematic challenge mechanisms.

## What This Skill Does

### Core Methodology
1. **Steel-man first, then challenge** - Build strongest version of idea before critiquing
2. **Attack unstated assumptions** - Surface what's being taken for granted
3. **Find failure modes** - Pre-mortem analysis to reveal how things could go wrong
4. **Inversion thinking** - "How could this fail?" reveals hidden risks
5. **Red team thinking** - Take adversarial position to expose vulnerabilities

### When to Use
- Before major decisions or commitments
- When asked "poke holes in this" or "what could go wrong"
- Before launching products or deployments
- When someone seems overconfident
- At strategic pivot points
- When something feels off but you can't articulate why

### Challenge Patterns for Indie Developers
- **Cost optimization** - Is time cost worth money savings?
- **Build vs buy** - Opportunity cost of DIY
- **Product ideas** - Real demand vs assumed demand
- **Architecture** - Scale characteristics and maintenance burden
- **Feature prioritization** - Complexity vs value ratio

## Installation

### For Claude Code (Unified Access)
```bash
# Already installed at:
~/.claude/skills/challenging-assumptions/

# This location works across:
# - Claude Code CLI
# - Zed extensions
# - VSCode extensions
# - Ghosty terminal
# - OpenCode
```

Skill is automatically discovered by all Claude Code interfaces.

### For Claude Desktop (Zip-based Feature)
1. Download: `~/.claude/skills/challenging-assumptions.zip`
2. Go to Settings > Features in Claude Desktop
3. Upload the zip file
4. Skill becomes available in your Claude Desktop conversations

### For Other Agents (Cursor, VS Code, etc.)
This skill follows the agentskills.io open standard and is portable to:
- Cursor
- VS Code (GitHub Copilot)
- GitHub Copilot CLI
- OpenCode
- Other skills-compatible agents

Follow your platform's skill installation instructions.

## Skill Structure

```
challenging-assumptions/
├── SKILL.md                          # Core methodology (~400 lines)
├── references/
│   ├── REFERENCE.md                  # Academic research & case studies
│   └── FRAMEWORKS.md                 # Detailed frameworks (FMEA, pre-mortem, etc.)
└── assets/
    └── pre-mortem-template.md        # Practical worksheet
```

**Progressive disclosure:** Core instructions load first, reference materials load on-demand.

## Usage Examples

### Example 1: Challenge a migration decision
```
User: "I'm migrating to a VPS to save 95% on costs"

Skill activates and provides:
- Steel-man understanding of the decision
- Key assumptions that must be true
- Failure modes (availability crisis, scale surprise, time sink)
- Risk assessment (fatal, significant, manageable)
- Alternative approaches
- Concrete mitigation steps
```

### Example 2: Challenge a product idea
```
User: "I'll build streaming overlays as a micro-SaaS"

Skill activates and provides:
- Understanding of the opportunity
- Key assumptions about monetization
- Failure modes (price sensitivity, customization trap, clone risk)
- Market validation questions
- Alternative approaches
- Steps to address risks
```

## Key Features

### Constructive Opposition
Challenge strengthens, doesn't demoralize:
- Offers alternatives alongside critique
- Distinguishes fatal flaws from manageable risks
- Respects your agency and goals
- Uses questions to guide discovery
- Acknowledges what's working

### Calibrated Intensity
Matches challenge level to decision stakes:
- **High intensity** for major commitments (architectural changes, financial investments)
- **Medium intensity** for significant decisions (feature prioritization)
- **Low intensity** for experiments (easily reversible choices)

### Multiple Frameworks
Access detailed methodologies in references/:
- **FMEA** - Systematic failure mode analysis
- **Pre-mortem** - Project into failure, work backward
- **Inversion** - "How could this fail?" reveals risks
- **Red team** - Adversarial thinking
- **Steel man** - Strengthen before critique
- **Decision matrix** - Quantify under uncertainty

## Validation

✓ Compliant with agentskills.io v1.0 open standard  
✓ Metadata validation passed  
✓ Structure follows progressive disclosure principles  
✓ Portable across multiple agent platforms  
✓ Research-backed methodologies (Klein, Munger, MITRE)  
✓ Real-world case studies (McKinsey, Google, DARPA, Bridgewater)

## Research Foundation

Based on established frameworks:
- Pre-mortem technique (Gary Klein)
- Inversion thinking (Charlie Munger)
- Red team thinking (MITRE, Military)
- Steel man argumentation
- Failure Mode and Effects Analysis (FMEA)
- Cognitive bias detection (Kahneman & Tversky)

See `references/REFERENCE.md` for full academic research compilation.

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

## Version

1.0 - Initial release

## Author

JR - Solo indie developer building AI tooling for the SolidJS ecosystem

## Tags

critical-thinking, decision-making, risk-analysis, pre-mortem, red-team, inversion-thinking, systematic-challenge, adversarial-analysis, strategic-decisions, indie-developer

## Contributing

This skill is designed for personal use but can be adapted. If you create improvements:
1. Maintain agentskills.io open standard compliance
2. Keep progressive disclosure architecture
3. Test across multiple agent platforms
4. Document changes clearly

## Troubleshooting

### Skill not activating?
- Verify file location: `~/.claude/skills/challenging-assumptions/SKILL.md`
- Check YAML frontmatter is valid
- Ensure skill name matches directory name
- Try explicit trigger: "Use challenging-assumptions skill to..."

### Need more detail?
Reference files load on-demand:
- Academic research: `references/REFERENCE.md`
- Detailed frameworks: `references/FRAMEWORKS.md`
- Pre-mortem worksheet: `assets/pre-mortem-template.md`

### Want to customize?
Edit `SKILL.md` for your specific context:
- Add domain-specific challenge patterns
- Adjust calibration for your risk tolerance
- Include your own examples and case studies

## Related Skills

Works well with:
- **detecting-blind-spots** - Surface what's not being said
- **reframing-problems** - Challenge often leads to reframing
- **evaluating-business-strategy** - Challenge commercial viability
- **thinking-systemically** - Challenge reveals second-order effects
- **collaborating-partner-mode** - Challenge is partnership behavior

## Support

This skill is part of a suite of AI tools for indie developers. For questions or improvements, reach out to JR.

---

**Remember:** Challenge is a tool for collaborative improvement, not an exercise in being right. Steel-man first, challenge constructively, offer solutions, and respect human agency.
