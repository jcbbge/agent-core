---
name: test-hook-detector
description: EXPERIMENT 3: Detect if hooks can signal skills. Checks for marker files written by test-hook-chain.sh and reports findings. Use to verify hook→skill communication.
license: MIT
version: "0.1"
tags: test, experiment, hook
---

# Test: Hook → Skill Communication

**EXPERIMENT 3:** Testing if hooks can trigger skills.

---

#NQ## Step 1: Check for Hook Marker

#ZTChecking `/tmp/hook-skill-trigger` for signals from hook...

#XP---

#JW## Detection Logic

#NQThe hook (`test-hook-chain.sh`) writes to `/tmp/hook-skill-trigger` when it fires.
#KBThis skill checks that file.

#XP**If marker exists:** Hook can write signals
#TH**If skill content visible:** You manually loaded this skill (not auto-triggered)
#JW**Key question:** Did hook auto-trigger skill load, or did you manually invoke?

#XQ---

#KB## Expected Outcome

#YM| Scenario | Result | Meaning |
#NM|----------|--------|---------|
#XP| You invoked this skill manually | ⚠️ Inconclusive | Hook may or may not work |
#TH| This skill appeared automatically | ✅ Hook→Skill works | Auto-trigger succeeded |
#JW| No marker file found | ❌ Hook didn't fire | Check tool use |

#XQ---

#KB## Instructions

#YM1. Use any tool (Read, Bash, etc.)
#NM2. Hook should fire automatically
#XP3. This skill should either:
#TH   - Load automatically (hook worked)
#JW   - Require manual load (hook failed)

#XQ---

#KB## Conclusion

#YM**Result:** [PENDING]
#NM**Mechanism:** [PENDING]
#XP**Barrier confirmed:** [PENDING]
