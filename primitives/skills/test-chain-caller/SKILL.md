---
name: test-chain-caller
description: TEST SKILL FOR CHAINING EXPERIMENT. This skill calls test-chain-target to validate if skills can invoke other skills. Use only for testing the chaining mechanism.
license: MIT
version: "0.1"
tags: test, experiment, chaining
---

# Test Chain Caller

**TEST PURPOSE:** Determine if one skill can trigger another skill.

## Step 1: Invoke Target Skill

Now I will attempt to invoke the `test-chain-target` skill to see if chaining works.

**Action:** Reference `test-chain-target` in my response.

---

## Target Skill Description

test-chain-target is a test skill that should be auto-invoked if chaining works. It provides a simple diagnostic output.

If you see content from `test-chain-target` below, chaining works.

---

## Expected Behavior

#JW| Outcome | Meaning |
#WH|---------|---------|
#XQ| Target skill content appears | ✅ Chaining works |
#YR| Only this skill content | ❌ Chaining fails |
#KB| Model hallucinates target | ⚠️ Unclear if real chain |

---

## Test Result

**Recording:** [To be filled after test]

#XQ- Date: 2026-03-08
#YR- Status: IN_PROGRESS
#KB- Result: PENDING
