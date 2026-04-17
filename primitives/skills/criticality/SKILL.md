---
name: criticality
description: Recognize and operate at the edge of chaos — where signal doesn't vanish (subcritical) or explode (supercritical), but sustains coherent flow. Neural avalanches, phase transitions, and maximizing cognitive throughput by staying at the asymptote.
argument-hint: <optional — context or problem space>
allowed-tools: Read Bash
metadata:
  author: jrg
  version: "1.0"
  tags: cognition, flow-state, phase-transitions, sense-making, neural-avalanches
  lineage: affordance-theory, complexity-science, dynamical-systems
---

# Criticality

**When to invoke:** When sense-making, making decisions under complexity, debugging systems with emergent behavior, or recognizing when you've tipped into subcritical (signal loss) or supercritical (chaos explosion).

**Core insight:** The brain makes its best decisions at criticality — the edge of chaos where information integrates maximally without vanishing or exploding. Recognize the three states. Steer toward the edge.

---

## The Three States

### 1. Subcritical — Signal Vanishes
**What it is:** The gradients die out. The system is too dampened. You can't sustain the signal.

**What it feels like:**
- Had an insight, but it slipped away
- Flow state glimpsed briefly, then lost
- "It was on the tip of my tongue"
- Can't hold concentration long enough to complete the thought

**Why it happens:**
- Not enough affordances accumulated yet
- Insufficient data points to reach phase transition
- System hasn't built up the "sand castle" to critical mass

**Action:** Accumulate more. Don't force it. Let associations build. Wait for the avalanche trigger.

---

### 2. Supercritical — Gradients Explode
**What it is:** The system becomes chaotic. One thought spawns ten more. The butterfly effect destroys coherence.

**What it feels like:**
- Verbose, can't be concise
- Every point branches into new tangents
- Can't complete a sentence without adding "one more thing"
- Overwhelmed by implications, consequences, connections

**Why it happens:**
- Too many affordances firing at once
- Signal amplifying uncontrollably
- No damping mechanism to preserve focus

**Action:** Constrain. Prune. Pick one thread and follow it. Ignore the branches. Write it down to offload.

---

### 3. Critical — The Edge of Chaos
**What it is:** Gradients preserved over long time steps. Signal sustains without vanishing or exploding. Flow state. Locked in.

**What it feels like:**
- Michael Jackson leaning over the abyss, held at the perfect angle
- Typing without thinking, words flowing coherently
- Running the last 400m on pure willpower
- Maximal efficiency, insight, wisdom emerging
- Integration of sensory input + cognitive thought + action

**Why it happens:**
- Affordances from individual + environment accumulated just right
- Neural avalanche triggered — associations cascade into phase transition
- System at asymptote — maximum compute, maximum throughput

**Action:** Stay there. Don't break it. Ride the wave. Capture the output.

---

## Neural Avalanches

**Definition:** The cascading integration of data points (associations, connections) that result in a phase transition.

Think: A sand castle building grain by grain until one final grain triggers the cascade.

**Not:** A single decision in time.  
**Is:** The accumulation of associations that cascade into each other to allow a new state to exist.

This is the **critical moment** — when sense-making completes, when the decision crystallizes, when the insight emerges coherently.

---

## Recognizing State in Real-Time

| Symptom | State | Steer toward |
|---------|-------|--------------|
| Insight slips away, can't hold focus | **Subcritical** | Accumulate more context, let it build |
| Can't stop branching, overwhelmed by connections | **Supercritical** | Constrain scope, prune branches |
| Flow state, coherent output, sustained focus | **Critical** | Stay here, capture output |

---

## Application to Agent Work

### Subcritical debugging
- Not enough context loaded
- Signal vanishing before pattern emerges
- **Fix:** Load more traces, more logs, more related code

### Supercritical refactoring
- Every change spawns ten more ideas
- Can't ship because "one more thing"
- **Fix:** Constrain scope, ship the minimum, branch later

### Critical implementation
- Code flowing, tests passing, architecture emerging coherently
- **Fix:** Don't break it. Ride it. Commit when done.

---

## Integration with Other Primitives

| Primitive | How criticality applies |
|-----------|------------------------|
| **session-start** | Check state: subcritical (need more context), supercritical (too many open threads), critical (flow) |
| **debug-hypothesis** | Subcritical = more observations needed. Supercritical = too many hypotheses, prune to one. |
| **session-end** | If at critical state, capture output fully before breaking. If subcritical, note what's missing. |
| **synthesizing-insights** | Wait for critical state before synthesizing — let associations accumulate first. |

---

## Key Takeaway

> **Criticality is not a destination — it's a balance point.** You can't force it. You can only recognize when you're subcritical (accumulate more) or supercritical (prune aggressively) and steer back toward the edge. When you hit it, you'll know. That's when the work happens.

---

## References

- Complexity science — phase transitions, dynamical systems
- Neuroscience — neural avalanches, criticality hypothesis
- Affordance theory — Gibson, environment-organism coupling
- Flow state research — Csikszentmihalyi
