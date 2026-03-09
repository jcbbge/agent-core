#BQ:---
#WY:name: openrouter
#TJ:description: Display ranked OpenRouter models for OpenCode configuration
#RX:license: MIT
#VQ:compatibility: opencode
#MK:---
#SK:

Run `node ~/openrouter.js` to display OpenRouter models ranked by quality and cost.

## Output

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
