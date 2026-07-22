# Debug: UX Failure / Trust Issue

## Observations
1. User reports that a single dot (`·`) provides zero confidence or context.
2. User's core issue is trust in the system. A dot fails to convey that the engine is genuinely running; it feels arbitrary and uninformative.
3. The user specifically stated earlier: "I don't need you to verbally transmit... showing up is enough... if I can visually see like an indicator... check engine light".
4. But my implementation swung from "loud and broken" to "completely silent/minimal," overcorrecting into ambiguity.

## Hypotheses

### H1: The indicator lacks semantic grounding and presence (ROOT HYPOTHESIS)
- **Supports:** A dot could mean anything. It doesn't say "Alembic". It doesn't confirm what it's checking. The user needs to *know* it's working at a glance without having to decode a single pixel.
- **Conflicts:** None.
- **Test:** Revert the indicator to a clear, unambiguous, yet quiet text label: `● alembic`. When healthy, it should be a quiet color (like green or dim green).

## Experiments
I will change the healthy state from the cryptic `·` to `[ctx.ui.theme.fg("success", "● alembic")]`. It is definitive, readable, and unambiguously tied to the memory system.