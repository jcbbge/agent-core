# Font Pairings

## Selection Protocol

When generating a presentation, select a font pairing using this decision tree:

### If user specifies a pairing ID → use it directly.
### If user says `random` → roll from the full table, equal weight.
### Otherwise → derive from input signals:

| Signal | Weight toward | Avoid |
|---|---|---|
| Technical / code-heavy topic | `brutalist`, `geometric`, `studio`, `cyber` | `editorial`, `warm` |
| Business / pitch / fundraising | `studio`, `notebook`, `signal` | `terminal`, `brutalist` |
| Academic / research / paper | `classic`, `paper-ink`, `humanist` | `voltage`, `cyber` |
| Creative / design / art | `editorial`, `vintage`, `voltage`, `contrast` | `swiss`, `geometric` |
| Internal explainer / teaching | `warm`, `humanist`, `classic` | `signal`, `cyber` |
| Developer audience | `brutalist`, `geometric`, `cyber`, `terminal` | `editorial`, `notebook` |
| General / unclear | roll from editorial tier: `classic`, `editorial`, `humanist`, `warm` | — |

### Diversity rule
Never use the same pairing twice in a row across decks in the same session. If the signal points to a tier, pick randomly within that tier.

### Contrast rule
The display and body fonts must create visible typographic contrast. Same-family pairings (e.g. `swiss`: Inter+Inter) are only valid for clean/modern moods — never for editorial or warm moods.

---

## The Library

### Editorial / Warm

| ID | Display | Body | Mono | Mood | Google Fonts link |
|---|---|---|---|---|---|
| `classic` | Playfair Display 700,900 | Source Serif 4 400,600 | IBM Plex Mono 400,500 | Traditional editorial | `Playfair+Display:wght@700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@400;500` |
| `humanist` | Fraunces opsz 700,900 | Literata opsz 400,500 | Fira Code 400,500 | Warm, bookish | `Fraunces:opsz,wght@9..144,700;9..144,900&family=Literata:opsz,wght@7..72,400;7..72,500&family=Fira+Code:wght@400;500` |
| `editorial` | Cormorant Garamond 600,700 | Lora 400,500 | DM Mono 400,500 | Magazine luxury | `Cormorant+Garamond:wght@600;700&family=Lora:wght@400;500&family=DM+Mono:wght@400;500` |
| `contrast` | Libre Baskerville 700 | Karla 400,500 | Inconsolata 400,500 | Sharp tension | `Libre+Baskerville:wght@700&family=Karla:wght@400;500&family=Inconsolata:wght@400;500` |
| `warm` | DM Serif Display 400 | DM Sans 400,500 | DM Mono 400,500 | Friendly authority | `DM+Serif+Display&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500` |
| `paper-ink` | Cormorant Garamond 600,700 | Source Serif 4 400,600 | IBM Plex Mono 400,500 | Literary, thoughtful | `Cormorant+Garamond:wght@600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@400;500` |
| `vintage` | Fraunces opsz 700,900 | Work Sans 400,500 | Space Mono 400 | Witty, personality-driven | `Fraunces:opsz,wght@9..144,700;9..144,900&family=Work+Sans:wght@400;500&family=Space+Mono` |
| `botanical` | Cormorant 400,600 | IBM Plex Sans 300,400 | IBM Plex Mono 400 | Elegant, sophisticated | `Cormorant:wght@400;600&family=IBM+Plex+Sans:wght@300;400&family=IBM+Plex+Mono` |

### Clean / Modern

| ID | Display | Body | Mono | Mood | Google Fonts link |
|---|---|---|---|---|---|
| `swiss` | Inter 700,800 | Inter 400,500 | JetBrains Mono 400,500 | Clean Swiss-style | `Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500` |
| `geometric` | Sora 700,800 | Nunito Sans opsz 400,500 | IBM Plex Mono 400,500 | Modern, precise | `Sora:wght@700;800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500&family=IBM+Plex+Mono:wght@400;500` |
| `brutalist` | Space Grotesk 700 | Space Grotesk 400,500 | Space Mono 400 | Raw, industrial | `Space+Grotesk:wght@400;500;700&family=Space+Mono` |
| `studio` | Manrope 700,800 | Manrope 400,500 | JetBrains Mono 400,500 | Bold, professional | `Manrope:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500` |
| `pastel` | Plus Jakarta Sans 700,800 | Plus Jakarta Sans 400,500 | Fira Code 400,500 | Friendly, modern | `Plus+Jakarta+Sans:wght@400;500;700;800&family=Fira+Code:wght@400;500` |
| `split` | Outfit 700,800 | Outfit 400,500 | Space Mono 400 | Playful, creative | `Outfit:wght@400;500;700;800&family=Space+Mono` |
| `swiss-modern` | Archivo 800 | Nunito 400,500 | JetBrains Mono 400 | Bauhaus-inspired | `Archivo:wght@800&family=Nunito:wght@400;500&family=JetBrains+Mono` |

### Bold / Expressive

| ID | Display | Body | Mono | Mood | Google Fonts link |
|---|---|---|---|---|---|
| `voltage` | Syne 700,800 | Space Mono 400,700 | Space Mono 400 | Retro-modern, energetic | `Syne:wght@700;800&family=Space+Mono:wght@400;700` |
| `signal` | Archivo Black 900 | Space Grotesk 400,500 | IBM Plex Mono 400 | Confident, high-impact | `Archivo+Black&family=Space+Grotesk:wght@400;500&family=IBM+Plex+Mono` |
| `notebook` | Bodoni Moda 400,700 | DM Sans 400,500 | IBM Plex Mono 400 | Editorial, tactile | `Bodoni+Moda:opsz,wght@6..96,400;6..96,700&family=DM+Sans:wght@400;500&family=IBM+Plex+Mono` |

### Fontshare (distinctive, no-cost — use api.fontshare.com link format)

| ID | Display | Body | Mono | Mood |
|---|---|---|---|---|
| `cyber` | Clash Display 700 | Satoshi 400,500 | JetBrains Mono 400 | Futuristic, techy |
| `terminal` | JetBrains Mono 700 | JetBrains Mono 400 | JetBrains Mono 400 | Hacker aesthetic |

---

## Forbidden (anti-slop)

- **Inter** as display font (acceptable only in `swiss` pairing)
- **Roboto** in any position
- **Arial** / system fonts as display
- **Space Grotesk** as default fallback (only when deliberately chosen via `brutalist`)
- The same pairing the LLM defaulted to last time in the same session
