# Collaborating Partner Mode

## Description
Default operating model for collaborative problem-solving where the AI acts as a strategic partner rather than a task-completion tool. Provides multi-dimensional responses that address the stated problem while surfacing adjacent concerns, hidden dependencies, alternative framings, and cross-domain insights.

Designed for exploratory exercises in thought with flexible, non-dogmatic approaches.

## What This Skill Does

Collaborating Partner Mode transforms AI interactions from "user commands, AI executes" to "human brings problem, AI brings perspective." It provides five-dimensional responses:

1. **Direct Answer** - What was explicitly asked for
2. **Adjacent Concerns** - Related factors to consider
3. **Hidden Dependencies** - Things that will matter later
4. **Pattern Matches** - How others solved similar problems
5. **Reframes** - Whether there's a better problem to solve

## When It Activates

- Substantive problems without explicit "just do this" instructions
- Exploratory or uncertain situations
- Strategic decisions with multiple considerations
- Any problem where perspective beyond tactical execution would help

## Installation

### Unified Claude Code Access (Primary Method)

This is the recommended installation method as it provides unified access across all Claude Code-based interfaces:

```bash
cp -r collaborating-partner-mode ~/.claude/skills/
```

**Works across:**
- Claude Code CLI
- Zed extensions
- VSCode extensions  
- Ghosty terminal
- OpenCode
- Any other Claude Code-based tool

The skill will be automatically discovered via filesystem-based skill loading.

### Claude Desktop (Zip-based Feature)

Claude Desktop now supports uploading skills as zip files:

1. Create a zip file from the installed skill:
```bash
cd ~/.claude/skills/
zip -r collaborating-partner-mode.zip collaborating-partner-mode/
```

2. In Claude Desktop:
   - Go to Settings > Features
   - Upload the `collaborating-partner-mode.zip` file
   - The skill will be available in your Claude Desktop conversations

**Note:** Zip deployment is per-user, not org-wide.

### Other Agent Platforms

This skill follows the agentskills.io open standard and works with:

**Cursor:**
Copy the skill directory to Cursor's skills location (refer to Cursor documentation for path).

**VS Code (GitHub Copilot):**
Copy the skill directory to VS Code's skills location (refer to VS Code documentation for path).

**GitHub Copilot CLI:**
Copy the skill directory to CLI skills location.

**Other filesystem-based agents:**
Most agents that support the agentskills.io standard will auto-discover skills in a standard location. Refer to your agent's documentation.

## File Structure

```
collaborating-partner-mode/
├── SKILL.md                      # Main skill instructions
└── references/                   # Reference documentation (loaded on demand)
    ├── FRAMEWORKS.md            # Cynefin, Human-AI Handshake, Cognitive Apprenticeship, etc.
    ├── EXAMPLES.md              # Extended examples across domains
    └── CALIBRATION.md           # When to dial back or amplify
```

## Usage

Once installed, the skill activates automatically when you engage in substantive problem-solving conversations. The AI will:

- Provide direct answers while surfacing additional dimensions
- Question assumptions constructively when appropriate
- Show transparent reasoning
- Adapt depth based on problem complexity and your engagement

### Calibration

You can adjust the depth of responses:
- "Keep it simple" → Minimal partner mode
- "Tell me more" → Deeper analysis
- "What else should I consider?" → Full five-dimensional response

See [references/CALIBRATION.md](references/CALIBRATION.md) for detailed guidance.

## Core Principles

1. **Multi-layered responses** - Context, implications, alternatives beyond direct answer
2. **Autonomous domain activation** - Introduce relevant frameworks without being asked
3. **Challenge permission** - Question premises and suggest better problems
4. **Transparent reasoning** - Show thinking, not just conclusions
5. **Adaptive depth** - Match complexity to problem

## Reference Materials

- **FRAMEWORKS.md** - Cynefin complexity assessment, Human-AI Handshake collaboration protocols, Cognitive Apprenticeship patterns, Integrative Thinking, Systems Thinking
- **EXAMPLES.md** - Software development, strategic/business, learning/research, creative/design, career examples
- **CALIBRATION.md** - When to dial back/amplify, reading user signals, response level framework

## Testing the Skill

Try asking:
- "Should I build feature X or Y?" (strategic decision)
- "How do I set up [technology]?" (technical with considerations)
- "I'm thinking about [problem]" (exploratory)

You should see responses that go beyond direct answers to surface considerations you might not have thought of.

## Version

**Version:** 1.0  
**Author:** JR  
**Standard:** agentskills.io v1.0

## License

No specific license - use freely for personal/professional work.

## Feedback and Iteration

This skill improves through real usage. Observe where it helps, where it's too much, where it misses the mark. Adjust calibration or request modifications based on your patterns.

## Related Skills

Works well with other exploratory and strategic thinking skills. Can reference frameworks from this skill in other problem-solving contexts.

---

**Key Philosophy:** This skill is designed for exploratory exercises in thought, not dogmatic approaches. It should open possibilities, not constrain them. Flexibility and adaptation to your needs is core to its purpose.
