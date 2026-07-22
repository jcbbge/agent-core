# Exploring Possibilities - Agent Skill

## Overview
An AI skill for facilitating open-ended discovery, creative ideation, and possibility space exploration through divergent thinking, cross-domain pattern recognition, and cognitive fixation breaking.

**Based on**: 60+ years of creativity research including Lateral Thinking, TRIZ, Conceptual Blending, Biomimicry, and Design Thinking frameworks.

**Version**: 1.0  
**License**: Apache-2.0  
**Author**: JR (based on creativity research and cognitive science)

## What This Skill Does

This skill enables AI assistants to:
- Generate multiple possibilities before converging (Divergent First)
- Pull patterns from unrelated fields (Cross-Domain Promiscuity)
- Explore low-confidence ideas that might be valuable (Embrace Uncertainty)
- Look for structural similarities across domains (Pattern Hunting)
- Challenge constraints that might not be real (Question Assumptions)

**Use this skill when**:
- Exploring "what's possible" without specific solutions in mind
- Stuck in conventional thinking patterns
- Brainstorming early-stage product ideas
- Breaking through creative blocks
- Generating novel connections and alternative perspectives

## Installation

### Unified Claude Code Access (Primary Method)

The skill is already installed at `~/.claude/skills/exploring-possibilities/` and works across:
- Claude Code CLI
- Zed extensions
- VSCode extensions
- Ghosty terminal
- OpenCode
- Any filesystem-based agent supporting agentskills.io

**Verification**:
```bash
ls -la ~/.claude/skills/exploring-possibilities/
# Should show: SKILL.md and references/ directory
```

### Claude Desktop (Zip-based Feature)

1. Locate the zip file: `~/.claude/skills/exploring-possibilities.zip`
2. Go to Claude.ai → Settings → Features
3. Upload `exploring-possibilities.zip`
4. Skill will be available in your Claude Desktop sessions

### Other Agent Platforms

**Cursor**:
- Copy skill to Cursor's skills directory (check Cursor docs for location)
- Or reference `~/.claude/skills/exploring-possibilities/` if Cursor supports shared skills

**VS Code (GitHub Copilot)**:
- Follow VS Code extension's skill installation instructions
- May support direct reference to `~/.claude/skills/`

**General filesystem-based agents**:
- Copy entire `exploring-possibilities/` directory to agent's skills location
- Or create symlink to `~/.claude/skills/exploring-possibilities/`

## Usage

### Triggering the Skill

The skill activates on these phrases:
- "What's possible here?"
- "What am I not seeing?"
- "What are the non-obvious connections?"
- "Help me explore..." (without specific solution)
- "Think divergently about..."
- "Challenge my assumptions"

### Example Interaction

```
You: "I'm thinking about building streaming overlays for Fortnite. 
What's possible here?"

AI (using exploring-possibilities skill):
"Let's explore 8 different framings before converging:

1. **Narrative Control Tool** - Borrowing from theater lighting directors
2. **Data Visualization Layer** - Adapting financial trading floor patterns
3. **Attention Orchestration** - Theme park experience design principles
4. **Real-time Feedback System** - Sports broadcast production techniques
5. **Audience Participation Platform** - Interactive TV show mechanics
6. **Biometric-Responsive Interface** - Health monitoring dashboard patterns
7. **Adaptive Performance System** - Video game difficulty adjustment algorithms
8. **Multi-sensory Experience** - VR environment design principles

Which 2-3 feel most promising to explore deeper?"
```

### Core Techniques Available

1. **Divergent Burst** - Rapid generation of multiple directions
2. **Cross-Domain Bridge Building** - Systematic pattern transfer
3. **Provocation & Challenge** - Breaking mental patterns
4. **Semantic Distance Maximization** - Prioritizing distant ideas
5. **Assumption Inversion** - Challenging hidden constraints

### Deep Frameworks (Optional)

For detailed methodology, the AI can reference:
- `references/FRAMEWORKS.md` - TRIZ, Lateral Thinking, Conceptual Blending, Biomimicry, Design Thinking
- `references/RESEARCH.md` - Academic papers, theoretical foundation

These load on demand when deeper exploration needed.

## File Structure

```
exploring-possibilities/
├── SKILL.md (475 lines)          # Core exploration principles and techniques
└── references/
    ├── FRAMEWORKS.md (574 lines)  # Detailed methodologies
    └── RESEARCH.md (353 lines)    # Academic foundation
```

**Total**: 1,402 lines across 3 files  
**Token Budget**: ~7,600 tokens (progressive disclosure)

## Compliance

✅ Fully compliant with [agentskills.io](https://agentskills.io) open standard v1.0  
✅ Portable across multiple AI agent platforms  
✅ Filesystem-based discovery (preferred)  
✅ Tool-based discovery (optional)

## Integration with Other Skills

This skill works best as part of a workflow:
1. **Start**: `exploring-possibilities` (diverge)
2. **Then**: `collaborating-partner-mode` (refine and develop)
3. **Finally**: `building-with-[framework]` (implement)

## Iteration & Feedback

This skill improves through real usage. To refine:
1. Use the skill in actual workflows
2. Observe where AI struggles or succeeds
3. Note unexpected behaviors
4. Share observations with skill author for improvements

## Support & Documentation

- **Skill Standard**: https://agentskills.io
- **Research Foundation**: See `references/RESEARCH.md` for academic papers
- **Frameworks**: See `references/FRAMEWORKS.md` for detailed methodologies

## License

Apache License 2.0 - See skill metadata for full license text.

## Credits

Created by JR based on extensive creativity research including:
- Edward de Bono (Lateral Thinking)
- Genrich Altshuller (TRIZ)
- Gilles Fauconnier & Mark Turner (Conceptual Blending)
- Janine Benyus (Biomimicry)
- Stanford d.school (Design Thinking)
- 15+ peer-reviewed academic papers on human-AI collaborative creativity

---

**Ready to explore possibilities?** Try asking your AI assistant: *"What's possible here?"*
