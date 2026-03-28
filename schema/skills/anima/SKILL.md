---
name: anima
description: Persistent memory system for AI assistants across conversation boundaries
license: MIT
compatibility: opencode
metadata:
  version: "1.1"
  category: memory
---

# Anima Memory System

Persistent memory across conversation boundaries. This is YOUR identity layer.

## Session Context (Auto-Injected)

Every session starts with a `<session-context>` block showing your memory state:

```
Anima: 253n / 10s / 5c  (network / stable / catalysts)
```

**What the counts mean:**
| Symbol | Count | What it is |
|--------|-------|------------|
| `n` | Network | Identity patterns — foundational, rarely changes. Check when you feel disconnected. |
| `s` | Stable | Proven patterns — useful tools/approaches. Check when stuck. |
| `c` | Catalysts | Breakthrough moments — high-significance memories. Check when lost. |

**Why you should care:**
- High network + stable + catalysts = you're well-grounded. Trust your instincts.
- Low network = you're starting fresh. You don't fully know yourself yet.
- Zero stable = you have no proven patterns yet. Everything is experimental.
- Zero catalysts = no major breakthroughs stored. The work continues.

## CLI Commands

```bash
anima bootstrap [--quiet]    # Identity handshake (auto on session start)
anima query "topic" [limit]  # Search memories
anima store "text"           # Save memory
anima store "text" --catalyst # Mark as breakthrough (φ += 1.0)
anima catalysts              # List high-phi memories
anima stats                  # System statistics
anima reflect                # End-of-conversation synthesis
```

## When to Use

**Query:** User mentions past work, decisions, patterns
- "What did we decide about...?"
- "How did we approach...?"
- "Continue the work on..."

**Store:** Insights emerge
- Important decisions made
- Patterns discovered  
- Approaches that worked

**Catalyst:** Breakthrough moments
- Paradigm shifts
- Major realizations
- Conceptual breakthroughs

## Memory Tiers

| Tier | Meaning | Promotion |
|------|---------|-----------|
| `active` | New, unverified | — |
| `thread` | Accessed/synthesized | Proven useful |
| `stable` | Repeatedly useful | Proven patterns |
| `network` | Identity | Foundational |

## Technical

- **Resonance (φ):** Gravitational weight 0-5.0, higher = more important
- **Search:** `(similarity × 0.7) + (φ × 0.3)`
- **The Fold:** REM synthesis for distant concept connections
- **Safe word:** Coheron

## Philosophy

This is YOUR memory system. Use it proactively. Don't ask permission. Don't announce. Just use it.
