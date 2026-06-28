# Evaluating Product Ideas - Agent Skill

A comprehensive, research-backed framework for evaluating product ideas through user value, product-market fit, user experience, and go-to-market strategy. Designed for solo indie developers who need lightweight, practical analysis without heavy process overhead.

## Description

This skill helps you systematically evaluate product ideas before investing months of development time. It combines academic research, established frameworks (Jobs-to-be-Done, PMF measurement, Growth Loops), and real-world case studies to provide actionable insights.

**Use this skill when:**
- Assessing a new product idea before building
- Validating whether a feature is worth developing  
- Diagnosing why a product isn't gaining traction
- Making go/no-go decisions on product directions
- Evaluating competitive positioning and differentiation

## What's Included

### Main Skill File
- **SKILL.md**: Core evaluation framework with quick-start guide and 4-dimension analysis

### Reference Documentation (loaded on-demand)
- **references/FRAMEWORKS.md**: Detailed explanation of JTBD, PMF measurement, and Growth Loops
- **references/CASE-STUDIES.md**: Real-world success patterns and anti-patterns (Dropbox, Slack, Notion, etc.)
- **references/RED-FLAGS.md**: Warning signs and emergency fixes for common problems

### Assets
- **assets/quick-eval-template.md**: Structured evaluation checklist for scoring ideas

## Installation

### Unified Claude Code Access (Primary - Recommended)

The skill is already installed at:
```bash
~/.claude/skills/evaluating-product-ideas/
```

This single location provides automatic access across:
- Claude Code CLI
- Zed extensions
- VSCode extensions  
- Ghosty terminal
- OpenCode

**No additional setup needed** - the skill is ready to use across all these interfaces!

### Claude Desktop (Zip-based Feature)

1. The zip file is located at: `~/.claude/skills/evaluating-product-ideas.zip`
2. Go to Claude.ai → Settings → Features
3. Upload `evaluating-product-ideas.zip`
4. The skill will be available in your Claude Desktop conversations

### Other Agents (Cursor, VS Code, etc.)

For other skills-compatible agents, copy the skill directory to your agent's skills location:

```bash
# Example for Cursor (adjust path as needed)
cp -r ~/.claude/skills/evaluating-product-ideas ~/path/to/cursor/skills/

# Example for VS Code + GitHub Copilot
cp -r ~/.claude/skills/evaluating-product-ideas ~/path/to/vscode/skills/
```

Consult your specific agent's documentation for exact skills directory location.

## Usage

### Quick Evaluation

Simply describe your product idea to any Claude Code interface or Claude Desktop:

```
I have an idea for a meal planning app for busy parents. 
Can you help me evaluate if it's worth building?
```

The skill will guide you through:
1. Jobs-to-be-Done analysis
2. Product-market fit assessment
3. User experience evaluation
4. Go-to-market strategy analysis

### Structured Evaluation

For more comprehensive analysis, request the evaluation template:

```
I want to do a full evaluation of my idea using the quick-eval template.
```

Claude will guide you through the structured checklist with weighted scoring across all four dimensions.

### Targeted Analysis

You can also ask about specific aspects:

```
What growth loop would work for [your product idea]?

What are the red flags I should watch for with [your idea]?

Show me case studies similar to [your product category]
```

## Key Frameworks

### 1. Jobs-to-be-Done (JTBD)
- Focus on circumstances and progress-making, not demographics
- Three dimensions: functional, social, and emotional
- Real competition includes ANY alternative solution users employ

### 2. Product-Market Fit (PMF)
- PMF is a trajectory, not a milestone
- Key metrics: Day-7/Day-30 retention, Sean Ellis 40% threshold, NPS
- Hybrid quantitative + qualitative approach

### 3. Growth Loops
- Compounding growth mechanisms vs. linear funnels
- Types: UGC, viral, product-led, content/SEO
- Focus on 1-2 major loops, not many minor ones

### 4. Evaluation Scoring
- User Value (30%): JTBD + problem-solution fit
- Product-Market Fit (25%): Retention + growth loop potential  
- User Experience (25%): Cognitive load + usability heuristics
- Go-to-Market (20%): Channel-fit + scalability

## Example Workflow

```
Idea: Meal planning app for busy parents

1. JTBD: "When exhausted after work, I want to feed my family 
   healthy food quickly, so I can feel like a good parent"

2. PMF Signal: Daily use case, 60% day-7 retention hypothesis

3. UX: Core job completable in <1 minute, low cognitive load

4. Growth: Product-led (free 1-week → paid full month) + 
   recipe sharing creates viral loop

Evaluation: 8/10 - Strong idea, proceed with MVP
```

## Directory Structure

```
evaluating-product-ideas/
├── SKILL.md                          # Main skill (284 lines)
├── references/
│   ├── FRAMEWORKS.md                 # Detailed frameworks (441 lines)
│   ├── CASE-STUDIES.md              # Real-world patterns (345 lines)
│   └── RED-FLAGS.md                 # Warning signs (391 lines)
└── assets/
    └── quick-eval-template.md       # Evaluation checklist (352 lines)
```

## Progressive Disclosure

The skill uses progressive disclosure to manage context:

1. **Quick Start** (SKILL.md): Get started in minutes with core concepts
2. **Deep Dive** (references/): Load detailed frameworks when needed  
3. **Templates** (assets/): Use structured checklists for comprehensive evaluation

Claude loads files on-demand, so you only consume context for what you actually need.

## Research Foundation

This skill is built on:
- **Academic Research**: PMF measurement, human-AI collaboration, behavioral economics
- **Established Frameworks**: JTBD (Christensen), Lean UX, Customer Development (Blank)
- **Real-world Applications**: Dropbox, Slack, Notion, Pinterest, Stripe case studies
- **Supporting Concepts**: Cognitive science, decision-making theory, growth mechanisms

All concepts are research-backed and validated through real-world product successes.

## Skill Metadata

- **Name**: evaluating-product-ideas
- **Version**: 1.0
- **Author**: JR
- **Compliance**: agentskills.io open standard v1.0
- **License**: (No specific license - open for use)

## Testing the Skill

To verify the skill is working across your interfaces:

**Claude Code CLI:**
```bash
claude "Help me evaluate this idea: [your idea]"
```

**Zed/VSCode/Ghosty:**
Open a conversation and reference your product idea - the skill should activate automatically when you mention evaluation, validation, or product assessment.

**Claude Desktop:**
After uploading the zip, start a new conversation and describe your product idea.

## Iteration and Feedback

This skill improves through real usage. If you notice:
- Missing frameworks or patterns
- Unclear guidance
- Helpful additions from your experience

Update the skill files directly in `~/.claude/skills/evaluating-product-ideas/` and the changes will be immediately available across all your Claude Code interfaces.

## Next Steps

1. **Try a quick evaluation** with a real idea you're considering
2. **Use the template** for comprehensive analysis
3. **Explore the reference docs** when you need deeper understanding
4. **Iterate** based on what you learn from real evaluations

The best evaluations come from applying the framework to actual ideas, observing where it helps and where it needs refinement.

---

**Remember**: Good evaluation prevents bad building. Spend hours evaluating to save months building the wrong thing.

Happy evaluating! 🚀
