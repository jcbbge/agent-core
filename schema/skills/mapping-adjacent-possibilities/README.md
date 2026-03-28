# Mapping Adjacent Possibilities

An AI skill for identifying strategic opportunities unlocked by solving problems or removing constraints.

## Description

This skill helps you map second-order effects, reveal compounding advantages, and distinguish platform opportunities from point solutions. It's particularly valuable for solo developers making strategic decisions about what to build, what to learn, and how to sequence work for maximum leverage.

## What it does

- **Maps opportunity spaces** - Identifies what becomes accessible when constraints are removed
- **Reveals compounding effects** - Shows how current work enables future opportunities  
- **Distinguishes platforms from point solutions** - Helps prioritize work with multiplicative returns
- **Evaluates option value** - Assesses decisions by what they keep open, not just what they produce
- **Strategic sequencing** - Determines optimal order of operations for maximum leverage

## Installation

### Claude Code (Unified Access) - **Primary Method**

The skill is already installed at:
```bash
~/.claude/skills/mapping-adjacent-possibilities/
```

This location provides **automatic access across all Claude Code interfaces**:
- ✅ Claude Code CLI
- ✅ Zed extensions  
- ✅ VSCode extensions
- ✅ Ghosty terminal
- ✅ OpenCode

**No additional configuration needed** - all Claude Code tools discover skills automatically from `~/.claude/skills/`

To verify installation:
```bash
ls -la ~/.claude/skills/mapping-adjacent-possibilities/
```

You should see:
```
SKILL.md
references/
  ├── FRAMEWORKS.md
  └── EXAMPLES.md
```

### Claude Desktop - **Zip-Based Deployment**

For Claude Desktop (claude.ai), use the provided zip file:

1. Locate the zip file at: `~/.claude/skills/mapping-adjacent-possibilities.zip`
2. Go to Claude Desktop → Settings → Features
3. Upload `mapping-adjacent-possibilities.zip`

**Note:** This deploys to your individual account only (not org-wide).

### Other Agent Platforms

This skill follows the agentskills.io open standard and works across multiple platforms:

**Cursor:**
- Copy skill directory to Cursor's skills location
- See Cursor documentation for platform-specific path

**VS Code (GitHub Copilot):**
- Copy skill directory to VS Code skills location  
- See VS Code documentation for platform-specific path

**Other skills-compatible agents:**
- This skill is portable across any agent supporting filesystem-based skills
- Copy the directory to the agent's skills location
- Consult platform documentation for specific instructions

## Usage

### Trigger Phrases

The skill activates when you ask questions like:
- "Should I work on X or Y?"
- "What should I build next?"
- "Is this worth learning?"
- "How should I prioritize these projects?"
- "What becomes possible if I solve this problem?"

### Core Frameworks

The skill provides five core analytical lenses:

1. **Dominoes** - What does solving X enable you to solve next?
2. **Constraint removal** - What becomes possible if Y is no longer limiting?
3. **Compounding effects** - What builds on what?
4. **Unexpected unlocks** - What non-obvious things become easier?
5. **Opportunity mapping** - What's now in reach that wasn't before?

### Example Usage

```
User: I'm deciding between learning TypeScript or building a client project. 
Which should I prioritize?

Claude (using mapping-adjacent-possibilities):
Let me map the adjacent possibilities for each path...

[Analyzes TypeScript learning unlocks, transfer potential, compounding effects]
[Analyzes client project unlocks, option value, strategic positioning]
[Provides strategic recommendation based on your constraints and goals]
```

### Progressive Disclosure

The skill uses three levels of detail:

1. **SKILL.md** - Core frameworks and practical guidance (~15KB)
2. **references/FRAMEWORKS.md** - Academic foundations and cognitive stack (~19KB)
3. **references/EXAMPLES.md** - Extended case studies across domains (~28KB)

The agent loads the appropriate level based on your question's complexity.

## File Structure

```
mapping-adjacent-possibilities/
├── SKILL.md                      # Core skill (main instructions)
└── references/                   # Loaded on demand
    ├── FRAMEWORKS.md             # Academic foundations, cognitive stack
    └── EXAMPLES.md               # Extended case studies
```

## Key Concepts

- **Platform vs Point Solution** - Work that creates foundations vs work that solves one problem
- **Option Value** - Worth of what a decision keeps open, not just what it produces  
- **Compounding Advantages** - How current work makes future work easier
- **Strategic Sequencing** - Optimal order of operations for multiplicative returns
- **Adjacent Possible** - What's accessible from current state (not all possibilities are equal)

## Integration with Other Skills

Works particularly well combined with:
- **evaluating-product-ideas** - Use adjacencies for product-market fit assessment
- **collaborating-partner-mode** - Combine strategic thinking with tactical execution
- **thinking-systemically** - Identify feedback loops in opportunity spaces
- **synthesizing-insights** - Connect patterns across domains

## Testing the Skill

To verify the skill is working:

1. **In Claude Code CLI:**
```bash
claude "I'm considering learning infrastructure (Docker, K8s) vs staying focused on 
frontend. What adjacent possibilities does each path unlock?"
```

2. **In any Claude Code interface:**
Just ask a strategic prioritization question using the trigger phrases above.

3. **Verify skill loaded:**
The response should include adjacent-possibilities analysis using the frameworks from the skill.

## Requirements

- No dependencies
- Works across all Claude Code interfaces automatically
- Compatible with Claude Desktop (via zip upload)
- Portable to other skills-compatible agents

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

1.0.0 (December 2024)

## Author

JR (via Claude collaboration)

## Standard Compliance

This skill follows the agentskills.io v1.0 open standard:
- ✅ Valid YAML frontmatter with all required fields
- ✅ Progressive disclosure architecture  
- ✅ Portable across skills-compatible agents
- ✅ Filesystem-based discovery compatible
- ✅ References directory for extended documentation

## Support & Feedback

This is an open-source skill following the agentskills.io standard. Feel free to:
- Modify for your specific needs
- Share with others
- Suggest improvements
- Adapt to other domains

## Next Steps

1. **Test the skill** - Ask Claude a strategic prioritization question
2. **Review frameworks** - Consult FRAMEWORKS.md for deeper analysis methods
3. **Study examples** - Read EXAMPLES.md for case studies across domains
4. **Iterate based on usage** - Refine the skill based on how it performs in practice

## Acknowledgments

Built using comprehensive research on:
- Real options theory (Nassim Taleb)
- Adjacent possible framework (Stuart Kauffman)
- Network effects and platform economics
- Constraint-based design principles
- Strategic sequencing models

See references/FRAMEWORKS.md for complete academic foundations.
