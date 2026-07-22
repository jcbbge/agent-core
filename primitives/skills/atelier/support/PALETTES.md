# Color Palettes

## Selection Protocol

When generating a presentation, select a palette using this decision tree:

### If user specifies a palette ID → use it directly.
### If user says `random` → roll from the full table, equal weight.
### Otherwise → derive from input signals:

| Signal | Weight toward | Avoid |
|---|---|---|
| Technical / code-heavy | `slate`, `ink`, `midnight`, `dark-navy` | `ember`, `sand` |
| Business / pitch / fundraising | `bone`, `paper`, `signal-orange`, `electric-blue` | `midnight`, `voltage` |
| Academic / research | `paper`, `bone`, `cream`, `forest` | `voltage`, `signal-orange` |
| Creative / design / art | `ink`, `ember`, `voltage`, `dark-warm` | `slate`, `paper` |
| Internal explainer / teaching | `paper`, `bone`, `forest`, `cream` | `dark-navy`, `voltage` |
| Dark mode preference or "dramatic" | `ink`, `midnight`, `dark-warm`, `dark-navy` | all light palettes |
| Light / calm / readable | `paper`, `bone`, `sand`, `cream` | all dark palettes |
| General / unclear | roll from: `paper`, `bone`, `ink`, `slate`, `forest` | — |

### Diversity rule
Never use the same palette twice in a row across decks in the same session. If the signal points to a group, pick randomly within that group.

### Light/dark pairing rule
When a palette is chosen, the `--bg-alt` value is used for alternating dark slides (the `.dark` variant) in light palettes, and vice versa. The `--stage-bg` (the letterbox color around the 16:9 stage) should be the darkest value in the palette.

---

## The Library

Each palette defines CSS custom properties. Copy the block into `:root`.

### Warm / Editorial

#### `paper` — Classic Tufte
```css
--bg-primary: #f4f1ea; --bg-alt: #efeae0;
--ink: #1c1b19; --muted: #6f6a61; --faint: #b9b2a5;
--accent: #8c2f22; --rule: #d8d2c5;
--stage-bg: #1c1b19;
```

#### `bone` — Quiet Authority
```css
--bg-primary: #f0ece4; --bg-alt: #e6e0d6;
--ink: #1a1a2e; --muted: #5a5872; --faint: #9e99b0;
--accent: #2d5a7b; --rule: #cdc6ba;
--stage-bg: #1a1a2e;
```

#### `sand` — Earthy, Archival
```css
--bg-primary: #f5f0e6; --bg-alt: #ebe4d6;
--ink: #2c2416; --muted: #6b5d4a; --faint: #a89880;
--accent: #a67c52; --rule: #d6ccb8;
--stage-bg: #2c2416;
```

#### `ember` — Bold Warmth
```css
--bg-primary: #faf5f0; --bg-alt: #f0e8df;
--ink: #2a1f1a; --muted: #6b5545; --faint: #b09a88;
--accent: #b5543a; --rule: #ddd4c8;
--stage-bg: #2a1f1a;
```

#### `forest` — Natural, Grounded
```css
--bg-primary: #f2f0eb; --bg-alt: #e8e5de;
--ink: #1b2420; --muted: #4a5e52; --faint: #8fa398;
--accent: #4a7c59; --rule: #cdd4cc;
--stage-bg: #1b2420;
```

#### `cream` — Paper & Ink
```css
--bg-primary: #faf9f7; --bg-alt: #f5f3ee;
--ink: #1a1a1a; --muted: #555555; --faint: #aaaaaa;
--accent: #c41e3a; --rule: #e0ddd6;
--stage-bg: #1a1a1a;
```

### Cool / Technical

#### `slate` — Technical Clarity
```css
--bg-primary: #f5f6f8; --bg-alt: #e9ebef;
--ink: #1e2028; --muted: #555b6e; --faint: #9098ab;
--accent: #4a6fa5; --rule: #d0d4dc;
--stage-bg: #1e2028;
```

### Dark

#### `ink` — Dark Editorial
```css
--bg-primary: #0d0c0b; --bg-alt: #161514;
--ink: #e8e4dc; --muted: #8a847a; --faint: #5a5650;
--accent: #c49a6c; --rule: #2a2826;
--stage-bg: #0d0c0b;
```

#### `midnight` — Deep, Contemplative
```css
--bg-primary: #111118; --bg-alt: #1a1a24;
--ink: #d4d0c8; --muted: #7a7888; --faint: #4e4c5a;
--accent: #7b8cc4; --rule: #28283a;
--stage-bg: #111118;
```

#### `dark-navy` — Futuristic, Techy
```css
--bg-primary: #0a0f1c; --bg-alt: #111827;
--ink: #e8eaf0; --muted: #8892a8; --faint: #4a5268;
--accent: #00ffcc; --rule: #1e2840;
--stage-bg: #0a0f1c;
```

#### `dark-warm` — Elegant, Premium
```css
--bg-primary: #0f0f0f; --bg-alt: #1a1a1a;
--ink: #e8e4df; --muted: #9a9590; --faint: #5a5855;
--accent: #d4a574; --accent-2: #e8b4b8;
--rule: #2a2828;
--stage-bg: #0f0f0f;
```

### Bold / Signal

#### `signal-orange` — Confident, High-Impact
```css
--bg-primary: #1a1a1a; --bg-alt: #2d2d2d;
--ink: #ffffff; --muted: #999999; --faint: #555555;
--accent: #FF5722; --rule: #333333;
--stage-bg: #111111;
```

#### `electric-blue` — Split-Panel Professional
```css
--bg-primary: #ffffff; --bg-alt: #0a0a0a;
--ink: #0a0a0a; --muted: #666666; --faint: #aaaaaa;
--accent: #4361ee; --rule: #e0e0e0;
--stage-bg: #0a0a0a;
```

#### `voltage` — Energetic, Retro-Modern
```css
--bg-primary: #0066ff; --bg-alt: #1a1a2e;
--ink: #ffffff; --muted: #b0c4ff; --faint: #6688cc;
--accent: #d4ff00; --rule: #3380ff;
--stage-bg: #001a44;
```

---

## Forbidden (anti-slop)

- `#6366f1` — generic AI indigo
- Purple gradients on white backgrounds
- Evenly distributed, timid palettes — commit to a dominant with sharp accents
- Any palette where accent and background have <4.5:1 contrast ratio
- The same palette the LLM used last time in the same session
