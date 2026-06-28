---
name: editorial-magazine
description: Generate art-directed, single-file HTML editorial magazines — horizontal-swipe, full-bleed, Monocle-grade presentations. Use when user asks for a magazine, editorial slideshow, curatorial lookbook, art-directed presentation, or "make it look like a magazine". Parameterized by skin, tone, audience, and domain.
argument-hint: <topic-or-domain> [skin] [tone]
allowed-tools: Bash Read Write
metadata:
  author: jrg
  version: "1.0"
  tags: html, editorial, magazine, presentation, slideshow, art-direction, curatorial
---

# Editorial Magazine Generator

Create a single-file, self-contained HTML editorial magazine. The output is a premium, horizontal-swipe presentation — not a slide deck, not a dashboard. It should feel like a physical magazine digitized with obsessive care.

## Parameters

| Parameter | Options | Default |
|---|---|---|
| **Skin** | `e-ink-mono`, `neon-cyber`, `vintage-print`, `high-contrast-minimal` | `e-ink-mono` |
| **Tone** | `clinical`, `provocative`, `witty-dry`, `visionary`, `insider` | `insider` |
| **Audience** | Any senior role description | `full-stack AI engineer who ships daily` |
| **Domain & Data** | The subject matter — a codebase, trending repos, papers, any topic | (user-supplied) |
| **Page count** | 14 pages (cover + 12 content + back cover) is default; adjust to fit | 14 |

## Core Aesthetic

Strict monochrome e-ink by default (pure `#000` + `#fff` + one subtle tint `#f5f5f5` or `#111` on callouts only).

**Typography (locked):**
- **Headlines:** Playfair Display, ≥5vw
- **Body:** Source Serif 4, max(17px, 1.5vw), min opacity .85
- **Metadata:** IBM Plex Mono
- **Primary metric:** ≥6.5vw
- **Callout:** opacity .8

All sizing in `vw`. High contrast always.

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
```

## Structure (never break)

- `100vw × 100vh` pages, CSS `transform`-based horizontal pagination (no scroll).
- Navigation: arrow keys + mouse wheel + touch swipe + bottom dot navigation.
- Pages 1 & last: full-bleed dark covers (front + back).
- Interior pages: strict alternating light/dark.
- Each content page uses a **55/45 split**:

**LEFT (55%):**
- Giant ghosted rank number (enormous, low opacity ~0.05–0.08)
- Category tag
- Editorial headline (sharp, opinionated, zero clickbait)
- Source path / repo / paper / handle
- Description

**RIGHT (45%):**
- Primary metric at 6.5vw+
- Language/framework/category tag
- Callout box (background tint + 4px left border) with a personalized strategic note written directly to the audience. The note must feel like a brilliant colleague giving strategic leverage — not a summary, not a recommendation, but an insider take.

## Rules (never break)

- Full-bleed — no floating cards, no shadows, no padding boxes
- Monocle × e-ink aesthetic
- 10vh bottom padding minimum
- Generous whitespace — nothing overlaps
- Every headline editorial — opinionated, not descriptive
- Self-contained single HTML file, inline CSS + JS
- No frameworks or build tools required to view
- Google Fonts CDN is acceptable

## Navigation Implementation

```css
.magazine {
  display: flex;
  width: calc(100vw * PAGE_COUNT);
  height: 100vh;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

```javascript
let currentPage = 0;
function goToPage(page) {
  currentPage = Math.max(0, Math.min(page, totalPages - 1));
  document.querySelector('.magazine').style.transform =
    `translateX(-${currentPage * 100}vw)`;
  updateDots();
}

// Arrow keys
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goToPage(currentPage + 1);
  if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
});

// Mouse wheel (debounced)
let wheelTimeout;
document.addEventListener('wheel', (e) => {
  clearTimeout(wheelTimeout);
  wheelTimeout = setTimeout(() => {
    if (e.deltaX > 30 || e.deltaY > 30) goToPage(currentPage + 1);
    else if (e.deltaX < -30 || e.deltaY < -30) goToPage(currentPage - 1);
  }, 50);
}, { passive: true });

// Touch swipe
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    goToPage(currentPage + (diff > 0 ? 1 : -1));
  }
}, { passive: true });
```

## Process

1. **Understand the domain.** Read the subject matter until you can editorialize it — not summarize, editorialize. Every headline is a take.
2. **Decide the arc.** Cover → 12 content items (ranked, curated, or thematic) → back cover. The order should feel intentional.
3. **Write editorial.** Each page's headline and callout note must feel authored by a senior insider, not generated by a summarizer.
4. **Build the HTML.** Single file, inline CSS + JS, Google Fonts only external dependency.
5. **Save** to the path requested (default: `~/Desktop/<topic>-magazine.html`).
6. **Open it** — `open <file>.html` — and verify the rhythm.

## Quality Bar

- [ ] Does it feel like a premium physical object?
- [ ] Is every headline editorial, not descriptive?
- [ ] Do the callout notes feel like insider strategic advice?
- [ ] Full-bleed, no cards, no shadows, no padding boxes?
- [ ] Alternating light/dark rhythm unbroken?
- [ ] Navigation works: arrows, wheel, swipe, dots?
- [ ] Self-contained — opens with no build step?
- [ ] Giant ghosted numbers visible but not distracting?
- [ ] Typography hierarchy correct (Playfair / Source Serif / IBM Plex)?

## Composable Skills

- **micro-animation-director** — compose with this skill to add spring-physics transitions, stagger cascades, ambient breathing, and SVG stroke draws. Use `restrained` or `balanced` intensity.
- **atelier** — the richer sibling that merges this skill's editorial voice with Tufte's narrative arc, randomized font pairings, color palettes, and micro-animations built in.

## Worked Example

`~/constellation-zg/docs/control-flow-magazine.html` — 14-page magazine on Constellation's telemetry control flow. Study it for rhythm, density, and editorial voice.
