---
name: atelier
description: Generate rich, interactive single-file HTML presentations that fuse Tufte's data-ink discipline with art-directed editorial design. Randomized or curated Google Font pairings, color palettes, subtle CSS/SVG micro-animations, horizontal-swipe or vertical navigation. Use when user asks for a "rich presentation", "atelier", "interactive slideshow", "animated editorial", or wants something between a Tufte reading and a magazine spread.
argument-hint: <topic> [palette] [font-pairing] [mode]
allowed-tools: Bash Read Write
metadata:
  author: jrg
  version: "1.0"
  tags: html, editorial, tufte, presentation, animation, interactive, css, svg, micro-animation
---

# Atelier — Rich Interactive Presentation Builder

Atelier merges two lineages:
- **Tufte** — narrative arc, data-ink discipline, one-idea-per-slide, Karpathy/Feynman voice
- **Editorial Magazine** — full-bleed, horizontal-swipe, ghosted typography, alternating rhythm, insider tone

The result is a self-contained HTML file with curated typography, a living color palette, and subtle CSS/SVG micro-animations that feel handcrafted — never over-the-top, never distracting.

---

## Parameters

| Parameter | Options | Default |
|---|---|---|
| **Mode** | `horizontal` (magazine swipe), `vertical` (scroll reading) | `horizontal` |
| **Font pairing** | See table below, or `random` | `random` |
| **Palette** | See table below, or `random` | `random` |
| **Tone** | `clinical`, `provocative`, `witty-dry`, `visionary`, `insider` | `insider` |
| **Audience** | Any role description | `senior engineer` |
| **Topic** | The subject — codebase, concept, research, anything | (user-supplied) |

---

## Font Pairings

Pick one or use `random` to select at build time. All from Google Fonts.

| ID | Display | Body | Mono | Mood |
|---|---|---|---|---|
| `classic` | Playfair Display 700,900 | Source Serif 4 400,600 | IBM Plex Mono 400,500 | Traditional editorial |
| `swiss` | Inter 700,800 | Inter 400,500 | JetBrains Mono 400,500 | Clean, Swiss-style |
| `humanist` | Fraunces opsz 700,900 | Literata opsz 400,500 | Fira Code 400,500 | Warm, bookish |
| `brutalist` | Space Grotesk 700 | Space Grotesk 400,500 | Space Mono 400 | Raw, industrial |
| `editorial` | Cormorant Garamond 600,700 | Lora 400,500 | DM Mono 400,500 | Magazine luxury |
| `geometric` | Sora 700,800 | Nunito Sans opsz 400,500 | IBM Plex Mono 400,500 | Modern, precise |
| `contrast` | Libre Baskerville 700 | Karla 400,500 | Inconsolata 400,500 | Sharp tension |
| `warm` | DM Serif Display 400 | DM Sans 400,500 | DM Mono 400,500 | Friendly authority |

Build the Google Fonts `<link>` dynamically based on the selected pairing.

---

## Color Palettes

Pick one or use `random`. Each palette defines: `--bg`, `--bg-alt`, `--ink`, `--muted`, `--faint`, `--accent`, `--accent-2`, `--rule`.

| ID | Name | Background | Ink | Accent | Mood |
|---|---|---|---|---|---|
| `paper` | Warm Paper | `#f4f1ea` / `#efeae0` | `#1c1b19` | `#8c2f22` | Classic Tufte |
| `bone` | Bone & Indigo | `#f0ece4` / `#e6e0d6` | `#1a1a2e` | `#2d5a7b` | Quiet authority |
| `ink` | Dark Ink | `#0d0c0b` / `#161514` | `#e8e4dc` | `#c49a6c` | Dark mode editorial |
| `slate` | Cool Slate | `#f5f6f8` / `#e9ebef` | `#1e2028` | `#4a6fa5` | Technical clarity |
| `forest` | Deep Forest | `#f2f0eb` / `#e8e5de` | `#1b2420` | `#4a7c59` | Natural, grounded |
| `ember` | Warm Ember | `#faf5f0` / `#f0e8df` | `#2a1f1a` | `#b5543a` | Bold warmth |
| `midnight` | Midnight | `#111118` / `#1a1a24` | `#d4d0c8` | `#7b8cc4` | Deep, contemplative |
| `sand` | Desert Sand | `#f5f0e6` / `#ebe4d6` | `#2c2416` | `#a67c52` | Earthy, archival |

For alternating light/dark pages in horizontal mode, use `--bg` and `--bg-alt` as the two page backgrounds, inverting `--ink` and `--bg` on dark pages.

---

## Micro-Animations (CSS/SVG only — no JS animation)

These are the palette of available effects. Use 3–5 per presentation, never all of them. They must feel like the page is alive, not performing.

### Entry Animations (on page/slide enter)

```css
/* Staggered fade-up — content elements cascade in */
.slide.active .entry-1 { animation: fadeUp 600ms ease both 100ms; }
.slide.active .entry-2 { animation: fadeUp 600ms ease both 220ms; }
.slide.active .entry-3 { animation: fadeUp 600ms ease both 340ms; }
.slide.active .entry-4 { animation: fadeUp 600ms ease both 460ms; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Ambient Animations (always running, very subtle)

```css
/* Breathing accent — key terms pulse gently */
.breathe {
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { opacity: 0.88; }
  50%      { opacity: 1; }
}

/* Ghosted element slow drift */
.ghost-drift {
  animation: ghostDrift 12s ease-in-out infinite alternate;
}
@keyframes ghostDrift {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(-6px) scale(1.01); }
}
```

### Rule/Border Draw (for kicker lines, separators)

```css
/* Hairline rule draws in from left */
.rule-draw {
  transform-origin: left;
  animation: drawIn 800ms cubic-bezier(.22,.61,.36,1) both 400ms;
}
@keyframes drawIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

### SVG Accent Marks (optional decorative touches)

```html
<!-- Subtle corner accent — a thin L-bracket that fades in -->
<svg class="corner-accent" width="40" height="40" viewBox="0 0 40 40">
  <path d="M0 40 L0 0 L40 0" fill="none" stroke="var(--accent)"
        stroke-width="1" opacity="0.3"
        stroke-dasharray="80" stroke-dashoffset="80">
    <animate attributeName="stroke-dashoffset" to="0"
             dur="1.2s" begin="0.5s" fill="freeze"
             calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
  </path>
</svg>

<!-- Subtle dot grid background (use sparingly, one slide max) -->
<svg class="dot-grid" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.5" fill="var(--faint)" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dots)"/>
</svg>
```

### Page Transitions

```css
/* Horizontal mode — smooth slide with slight overshoot */
.magazine {
  transition: transform 0.65s cubic-bezier(0.34, 1.12, 0.64, 1);
}

/* Vertical mode — fade + lift */
.slide {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 420ms ease, transform 420ms cubic-bezier(.22,.61,.36,1);
}
.slide.active {
  opacity: 1;
  transform: none;
}
```

### Rules for Animation

- **Never animate text content directly** — animate containers
- **Duration range:** 400ms–800ms for entries, 4s–12s for ambient
- **Easing:** always cubic-bezier, never linear (except SVG stroke draws)
- **Opacity range for ambient:** 0.85–1.0 max swing (barely perceptible)
- **No animation on first paint** — cover slide loads static, animations begin on first navigation
- **Reduced motion:** respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Narrative Arc (from Tufte lineage)

The content structure. Adapt to topic — cut ruthlessly, never pad.

1. **Cover** — title, one-line essence, nav hint
2. **Thesis / epigraph** — a borrowed line reframed for the topic
3. **The problem** — what's broken or missing, made concrete
4. **The reframe** — the shift in how to see it
5. **The kernel** — the single deepest insight (the Feynman moment)
6. **The model** — the structure, direct-labeled
7. **Anatomy** — the concrete shape, annotated
8. **The contract** — the discipline the design enforces
9. **The surface** — how you use it, minimal
10. **The workhorse** — the most common move, shown
11. **The payoff** — before/after, side by side
12. **The quiet layer** — the unglamorous trustworthy parts
13. **In the wild** — real usage
14. **Coda** — return to the epigraph, resolve it

In horizontal mode, each arc point is a full-bleed page. In vertical mode, each is a scroll section.

---

## Slide Components

Reuse these — don't invent per slide:

- **kicker** — mono, uppercase, accent, with animated hairline rule draw
- **h1/h2** — display font, tight leading, negative letter-spacing
- **lede** — large body sentence under cover/section title
- **body** — body font prose. Reasoning here, never bullets
- **code** — mono, faint tint background, 2px accent left rule
- **field-map** — direct-labeled rows (term → definition) with hairline separators
- **quote** — large display pull-quote with mono attribution
- **two-column** — before/after comparisons
- **ghosted** — giant background character/number, opacity 0.04–0.08, with `ghost-drift` animation
- **callout** — background tint + 4px accent left border, insider strategic note
- **corner-accent** — SVG L-bracket, fades in via stroke animation

---

## Voice (Karpathy × Feynman × Editorial)

- One idea per slide/section — if it has two, split it
- Prose, not bullets — bullets fragment reasoning
- Build intuition before formalism (Karpathy), name the kernel plainly (Feynman)
- Headlines are editorial takes, not descriptions — opinionated, zero clickbait
- Callout notes feel like a brilliant colleague giving strategic leverage
- Code is illustration, not wallpaper — short, annotated, load-bearing

---

## Process

1. **Understand deeply.** Read the topic until you can state its kernel in one sentence.
2. **Select or randomize** font pairing and palette. Build the Google Fonts `<link>` and CSS custom properties.
3. **Find the arc.** Problem → reframe → kernel → mechanics → payoff → coda.
4. **Write editorial.** Every headline is a take. Every callout is insider advice.
5. **Choose 3–5 micro-animations** from the palette above. Wire them to entry points and ambient elements.
6. **Build the HTML.** Single file, inline CSS + JS, Google Fonts only external dependency.
7. **Save** to the path requested (default: `~/Desktop/<topic>-atelier.html`).
8. **Open it** — `open <file>.html` — and verify rhythm, animations, typography.

---

## Quality Bar

- [ ] Could a smart stranger learn the topic from this alone?
- [ ] One idea per slide/section?
- [ ] Kernel slide is genuinely the deepest point, stated simply?
- [ ] Font pairing feels intentional and cohesive?
- [ ] Palette creates mood without distraction?
- [ ] Micro-animations add life without performing? (3–5 max)
- [ ] `prefers-reduced-motion` respected?
- [ ] Zero chartjunk — no 3D, gradients, unnecessary shadows?
- [ ] Full-bleed in horizontal mode, generous whitespace in both?
- [ ] Self-contained single file, opens with no build step?
- [ ] Navigation works: arrows, wheel, swipe (horizontal) or scroll (vertical)?
- [ ] Does the coda resolve the thesis?
- [ ] Does it feel like something people would forward?

---

## Composable Skills

- **micro-animation-director** — the dedicated motion skill. Atelier uses `balanced` intensity by default. For more or less motion, compose explicitly with the director at `playful` or `restrained`.

## Ancestry

This skill descends from two parents — both preserved as independent skills:

- **Tufte Reading** (`~/Desktop/tufte-deck-setup/`) — vertical, system fonts, austere data-ink purity
- **Editorial Magazine** (`editorial-magazine` skill) — horizontal, Google Fonts, Monocle-grade full-bleed

Atelier is neither. It is their child — richer than Tufte, more narrative than Magazine, animated where both are static.
