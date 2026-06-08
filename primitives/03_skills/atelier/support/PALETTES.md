# Color Palettes

Each palette defines: `--bg-primary`, `--bg-alt`, `--ink`, `--muted`, `--faint`, `--accent`, `--accent-2` (optional), `--rule`.

Pick one or use `random`. For alternating light/dark pages in horizontal mode, use `--bg-primary` and `--bg-alt`.

## Warm / Editorial

| ID | Name | Bg | Bg-Alt | Ink | Accent | Mood |
|---|---|---|---|---|---|---|
| `paper` | Warm Paper | `#f4f1ea` | `#efeae0` | `#1c1b19` | `#8c2f22` | Classic Tufte |
| `bone` | Bone & Indigo | `#f0ece4` | `#e6e0d6` | `#1a1a2e` | `#2d5a7b` | Quiet authority |
| `sand` | Desert Sand | `#f5f0e6` | `#ebe4d6` | `#2c2416` | `#a67c52` | Earthy, archival |
| `ember` | Warm Ember | `#faf5f0` | `#f0e8df` | `#2a1f1a` | `#b5543a` | Bold warmth |
| `forest` | Deep Forest | `#f2f0eb` | `#e8e5de` | `#1b2420` | `#4a7c59` | Natural, grounded |
| `cream` | Cream & Crimson | `#faf9f7` | `#f5f3ee` | `#1a1a1a` | `#c41e3a` | Paper & ink |

## Cool / Technical

| ID | Name | Bg | Bg-Alt | Ink | Accent | Mood |
|---|---|---|---|---|---|---|
| `slate` | Cool Slate | `#f5f6f8` | `#e9ebef` | `#1e2028` | `#4a6fa5` | Technical clarity |

## Dark

| ID | Name | Bg | Bg-Alt | Ink | Accent | Mood |
|---|---|---|---|---|---|---|
| `ink` | Dark Ink | `#0d0c0b` | `#161514` | `#e8e4dc` | `#c49a6c` | Dark editorial |
| `midnight` | Midnight | `#111118` | `#1a1a24` | `#d4d0c8` | `#7b8cc4` | Deep, contemplative |
| `dark-navy` | Dark Navy | `#0a0f1c` | `#111827` | `#ffffff` | `#00ffcc` | Futuristic, techy |
| `dark-warm` | Dark Warm | `#0f0f0f` | `#1a1a1a` | `#e8e4df` | `#d4a574` | Elegant, premium |

## Bold / Signal

| ID | Name | Bg | Bg-Alt | Ink | Accent | Mood |
|---|---|---|---|---|---|---|
| `signal-orange` | Bold Signal | `#1a1a1a` | `#2d2d2d` | `#ffffff` | `#FF5722` | Confident, high-impact |
| `electric-blue` | Electric | `#0a0a0a` | `#ffffff` | dynamic | `#4361ee` | Split-panel professional |
| `voltage` | Voltage | `#0066ff` | `#1a1a2e` | `#ffffff` | `#d4ff00` | Energetic, retro-modern |

## DO NOT USE

- `#6366f1` — generic AI indigo
- Purple gradients on white backgrounds
- Evenly distributed, timid palettes — commit to a dominant color with sharp accents
- Any palette where accent and background have low contrast

## Rules

- One accent color. Never two fighting for attention (accent-2 is for secondary use only).
- On dark palettes: invert `--ink` and `--bg-primary` for text contrast.
- The accent marks ONLY what matters most: kicker, key terms, code rules, the single most important data point.
