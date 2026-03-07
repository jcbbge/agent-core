---
name: openrouter
description: Display ranked OpenRouter models for OpenCode configuration
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: configuration
---

# OpenRouter Model Rankings

Run `node ~/openrouter.js` to display OpenRouter models.

## Output

Displays:
- Model IDs (cyan for free models)
- Cost per 1M tokens (prompt/completion)
- Context window size
- Intelligence index (iq: 0-100)
- Capabilities: ⚙ tools · ◉ vision · ◈ reasoning · ◊ code · ◐ cache

## Technical

- **Data sources:**
  - OpenRouter API: https://openrouter.ai/api/v1/models
  - Artificial Analysis API: Quality scores
- **Ranking algorithm:**
  - Free models: 70% quality + 30% context
  - Paid models: 60% quality + 40% cost
- **Cost threshold:** <$5/1M prompt tokens
- **Execution:** Runs `node ~/openrouter.js`

## Instructions

Run: `node ~/openrouter.js`

That's it. Just run the script and let the output display.
