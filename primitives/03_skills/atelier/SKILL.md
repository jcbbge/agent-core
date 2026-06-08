---
name: atelier
description: >
  Generate stunning single-file HTML presentations — from scratch, from notes, or from PowerPoint.
  Fuses Tufte's data-ink discipline with art-directed editorial design on a fixed 16:9 stage.
  Visual style discovery (3 previews, user picks), curated font/palette library, micro-animations,
  density modes (speaker-led vs. reading-first), PPT conversion, PDF export, Vercel deploy.
  Use when user asks for a presentation, slide deck, atelier, editorial slideshow, lookbook,
  "make slides", or wants to convert a PPTX.
argument-hint: <topic> [mode] [density]
allowed-tools: Bash Read Write
metadata:
  author: jrg
  version: "2.0"
  tags: html, editorial, tufte, presentation, animation, interactive, css, svg, slides, pptx
  lineage: tufte-deck-setup + editorial-magazine + frontend-slides
---

# Atelier — Presentation Builder

Create zero-dependency, self-contained HTML presentations on a fixed 16:9 stage.
Every deck is a single file with inline CSS/JS. No npm, no build tools, no frameworks.

## Lineage

Three traditions merged:

- **Tufte** — narrative arc, data-ink discipline, one-idea-per-slide, Karpathy/Feynman voice
- **Editorial Magazine** — full-bleed, horizontal-swipe, ghosted typography, alternating rhythm
- **Frontend Slides** — fixed 16:9 stage, visual style discovery, anti-AI-slop rules, export pipeline

The result: editorial minimalism on a rock-solid stage. Beauty from restraint and type.

---

## Parameters

| Parameter | Options | Default |
|---|---|---|
| **Mode** | `horizontal` (magazine swipe), `vertical` (scroll/fade) | `horizontal` |
| **Density** | `speaker-led` (big ideas, few words), `reading-first` (self-contained detail) | ask user |
| **Font pairing** | See support/FONT_PAIRINGS.md, or `random` | `random` |
| **Palette** | See support/PALETTES.md, or `random` | `random` |
| **Tone** | `clinical`, `provocative`, `witty-dry`, `visionary`, `insider` | `insider` |
| **Topic** | The subject — codebase, concept, pitch, research, anything | (user-supplied) |

---

## Core Principles

1. **Fixed 16:9 Stage (NON-NEGOTIABLE)** — Slides authored at 1920×1080, scaled uniformly. No reflow. See `support/viewport-base.css`.
2. **Zero Dependencies** — Single HTML file, all CSS/JS inline. Google Fonts or Fontshare only external load.
3. **Show, Don't Tell** — Style discovery via visual previews, not abstract choices.
4. **Anti-AI-Slop** — No Inter, no Roboto, no purple gradients on white, no cookie-cutter layouts. Every deck feels custom-crafted.
5. **Tufte's Data-Ink Discipline** — Every pixel earns its place. Direct labeling over legends. Prose over bullets. One idea per slide.

---

## Phase 0: Detect Mode

| Mode | Trigger | Go to |
|---|---|---|
| **A: New Presentation** | Topic, notes, or "make slides about X" | Phase 1 |
| **B: PPT Conversion** | User provides a .pptx file | Phase 4 |
| **C: Enhancement** | User provides existing HTML presentation | Read → enhance in place |

---

## Phase 1: Content Discovery

Ask all questions together in one message:

**1. Purpose** — Pitch deck / Teaching-Tutorial / Conference talk / Internal presentation / Explainer reading
**2. Length** — Short 5–10 / Medium 10–18 / Long 20+
**3. Content** — All content ready / Rough notes / Topic only
**4. Density** — Speaker-led (big ideas, visual breathing room) / Reading-first (self-contained detail for async review)

If user has content, ask them to share it.

### Step 1.2: Image Evaluation (if images provided)

1. Scan all image files
2. For each: what it shows, USABLE or NOT USABLE, what concept it represents, dominant colors
3. Co-design the outline — images inform structure alongside text
4. Confirm the outline with the user

---

## Phase 2: Style Discovery

**This is the "show, don't tell" phase.** Generate 3 distinct single-slide HTML previews.

Based on purpose, audience, mood, and density, generate 3 title-slide previews showing typography, colors, animation, and overall aesthetic. Save to `.atelier/previews/` and open each.

### Preview mix rules

- 1 editorial/restrained option (Tufte lineage)
- 1 bold/expressive option (distinct design system)
- 1 wildcard (custom-designed for this specific brief)

Read `support/FONT_PAIRINGS.md` and `support/PALETTES.md` for the curated library.

### Preview authenticity (NON-NEGOTIABLE)

- Every preview looks like a real first slide, not a diagnostic card
- Never render internal labels: no "Option A", no "preview", no template names on the slide
- Use real deck chrome only: title, author, date, section title
- If the slide needs text, use the user's actual topic

### Anti-slop rules

- No Inter, Roboto, Arial, or system fonts as display
- No `#6366f1` generic indigo, no purple gradients on white
- No identical card grids, no gratuitous glassmorphism
- Every option must feel genuinely different from the others
- Make a deliberate visual thesis: committed palette, recognizable layout system, distinctive type

### Step 2.1: User Picks

Ask: "Which direction?" — Style A / Style B / Style C / Mix elements

---

## Phase 3: Generate Presentation

### Before generating, read these supporting files:

- `support/viewport-base.css` — Mandatory fixed-stage CSS (include in full)
- `support/html-template.md` — HTML architecture, JS features, inline editing
- `support/animation-patterns.md` — CSS/JS animation reference

### The Narrative Arc

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

Not every topic needs all of these. Cut ruthlessly. The arc is a guide to order and rhythm — problem → reframe → kernel → mechanics → payoff → coda.

### Voice — Karpathy × Feynman × Editorial

- **Perspicuity (Karpathy):** Build intuition step by step. Always answer "why does this matter?"
- **Perspicacity (Feynman):** Find the kernel — the one deep idea the whole topic reduces to. Name it.
- One idea per slide. If it has two, split it.
- Prose, not bullets. Bullets fragment reasoning.
- Headlines are editorial takes, not descriptions — opinionated, zero clickbait.
- Code is illustration, not wallpaper — short, annotated, load-bearing.
- The coda returns to the opening epigraph and resolves it.

### Density application

| Mode | Behavior |
|---|---|
| **Speaker-led** | More slides, fewer ideas per slide. Large headings, short phrases, visual metaphors, presenter-friendly pacing. |
| **Reading-first** | Self-contained slides. Structured grids, comparison tables, annotated diagrams, captions, concise explanatory copy. |

### Slide Components (reuse — don't invent per slide)

- **kicker** — mono, uppercase, accent, with animated hairline rule draw
- **h1/h2** — display font, tight leading, negative letter-spacing
- **lede** — large body sentence under cover/section title
- **body** — body font prose. Reasoning here, never bullets
- **code** — mono, faint tint background, 2px accent left rule (Tufte sidenote style)
- **field-map** — direct-labeled rows (term → definition) with hairline separators
- **quote** — large display pull-quote with mono attribution
- **two-column** — before/after comparisons
- **ghosted** — giant background character/number, opacity 0.04–0.08, with ghost-drift animation
- **callout** — background tint + 4px accent left border, insider strategic note

### Key requirements

- Single self-contained HTML file, all CSS/JS inline
- Include the FULL contents of `support/viewport-base.css` in the `<style>` block
- Use Google Fonts or Fontshare — never system fonts alone
- Fixed 1920×1080 stage, scaled uniformly to viewport
- Arrow keys + Space + touch/swipe navigation
- `prefers-reduced-motion` respected
- Detailed `/* === SECTION NAME === */` comments
- Inline text editing included by default (hover top-left or press E)

### Micro-Animations (3–5 per deck, never all)

- **Entry:** Staggered fade-up (100ms–460ms offsets), scale-in, blur-in
- **Ambient:** Breathing accent (4s), ghost drift (12s), barely perceptible
- **Rule draw:** Hairline draws from left (800ms cubic-bezier)
- **SVG accents:** Corner L-bracket stroke animation, dot grid (one slide max)
- **Duration:** 400ms–800ms entries, 4s–12s ambient
- **Easing:** Always cubic-bezier, never linear
- **Never animate text directly** — animate containers

### Save and verify

1. Save to `~/Desktop/<topic>-atelier.html` (or path requested)
2. `open <file>.html` — verify rhythm, animations, typography
3. Run quality checklist

---

## Phase 4: PPT Conversion

1. Extract content: `python support/scripts/extract-pptx.py <input.pptx> <output_dir>`
2. Confirm extracted content with user
3. Proceed to Phase 2 for style discovery
4. Generate HTML preserving all text, images, slide order, speaker notes

---

## Phase 5: Delivery

1. Clean up `.atelier/previews/` if it exists
2. Open in browser
3. Tell user: file location, style name, slide count, navigation (arrows/space/swipe), inline editing (hover top-left or E), how to customize (`:root` CSS vars)

---

## Phase 6: Share & Export (Optional)

Ask: "Want to share? I can deploy to a live URL or export as PDF."

### Deploy to URL (Vercel)
```bash
bash support/scripts/deploy.sh <path-to-presentation>
```

### Export to PDF
```bash
bash support/scripts/export-pdf.sh <path-to-html> [output.pdf]
```

PDF is a static snapshot — animations not preserved. First run installs Playwright (~30-60s).

---

## Quality Bar

- [ ] Could a smart stranger learn the topic from this alone?
- [ ] One idea per slide?
- [ ] Kernel slide is genuinely the deepest point, stated simply?
- [ ] Font pairing feels intentional and cohesive?
- [ ] Palette creates mood without distraction?
- [ ] Zero chartjunk — no 3D, gradients, unnecessary shadows?
- [ ] Direct labels instead of legends?
- [ ] Code shown as accent-ruled blocks, not boxed?
- [ ] Micro-animations add life without performing? (3–5 max)
- [ ] `prefers-reduced-motion` respected?
- [ ] Fixed 16:9 stage — no reflow on different screens?
- [ ] Self-contained single file, opens with no build step?
- [ ] Does the coda resolve the thesis?
- [ ] Does it feel like something people would forward?

---

## Supporting Files

| File | Purpose | When to Read |
|---|---|---|
| `support/viewport-base.css` | Mandatory fixed-stage CSS | Phase 3 (include in full) |
| `support/html-template.md` | HTML architecture, JS features, inline editing | Phase 3 |
| `support/animation-patterns.md` | CSS/JS animation reference | Phase 3 |
| `support/FONT_PAIRINGS.md` | Curated font pairing library | Phase 2 |
| `support/PALETTES.md` | Curated color palette library | Phase 2 |
| `support/STYLE_PRESETS.md` | Complete preset definitions (fonts + colors + signature elements) | Phase 2 |
| `support/scripts/extract-pptx.py` | PPT content extraction | Phase 4 |
| `support/scripts/deploy.sh` | Deploy to Vercel | Phase 6 |
| `support/scripts/export-pdf.sh` | Export to PDF | Phase 6 |

## Composable Skills

- **micro-animation-director** — for more or less motion, compose explicitly at `playful`, `balanced`, or `restrained` intensity
- **rams** — for accessibility audit of generated presentations
- **impeccable** — for UI/UX vocabulary and anti-pattern checks
