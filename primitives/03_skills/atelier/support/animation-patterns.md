# Animation Patterns Reference

Match animations to the intended feeling. Use 3–5 per deck, never all.

## Effect-to-Feeling Guide

| Feeling | Animations | Visual Cues |
|---------|-----------|-------------|
| **Dramatic / Cinematic** | Slow fade-ins (1–1.5s), large scale transitions, parallax | Dark backgrounds, spotlight effects, full-bleed |
| **Techy / Futuristic** | Neon glow, glitch/scramble text, grid reveals | Particle canvas, grid patterns, monospace, cyan/magenta |
| **Playful / Friendly** | Bouncy easing (spring physics), floating/bobbing | Rounded corners, pastel/bright colors, hand-drawn |
| **Professional** | Subtle fast animations (200–300ms), clean slides | Navy/slate/charcoal, precise spacing, data viz focus |
| **Calm / Minimal** | Very slow subtle motion, gentle fades | High whitespace, muted palette, serif, generous padding |
| **Editorial / Magazine** | Staggered text reveals, image-text interplay | Strong type hierarchy, pull quotes, grid-breaking layouts |
| **Tufte / Austere** | Entry fade-up only, rule draws, breathing accent | Warm paper, one accent, restraint over spectacle |

## Entry Animations (on slide enter)

```css
/* Staggered fade-up — the workhorse */
.slide.active .entry-1 { animation: fadeUp 600ms ease both 100ms; }
.slide.active .entry-2 { animation: fadeUp 600ms ease both 220ms; }
.slide.active .entry-3 { animation: fadeUp 600ms ease both 340ms; }
.slide.active .entry-4 { animation: fadeUp 600ms ease both 460ms; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Scale In */
.reveal-scale {
    opacity: 0; transform: scale(0.9);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Slide from Left */
.reveal-left {
    opacity: 0; transform: translateX(-50px);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Blur In */
.reveal-blur {
    opacity: 0; filter: blur(10px);
    transition: opacity 0.8s, filter 0.8s var(--ease-out-expo);
}

/* Generic reveal with stagger */
.reveal {
    opacity: 0; transform: translateY(30px);
    transition: opacity var(--duration-normal, 0.6s) var(--ease-out-expo),
                transform var(--duration-normal, 0.6s) var(--ease-out-expo);
}
.slide.visible .reveal, .slide.active .reveal { opacity: 1; transform: translateY(0); }
.reveal:nth-child(1) { transition-delay: 0.1s; }
.reveal:nth-child(2) { transition-delay: 0.2s; }
.reveal:nth-child(3) { transition-delay: 0.3s; }
.reveal:nth-child(4) { transition-delay: 0.4s; }
```

## Ambient Animations (always running, barely perceptible)

```css
/* Breathing accent — key terms pulse gently */
.breathe { animation: breathe 4s ease-in-out infinite; }
@keyframes breathe {
  0%, 100% { opacity: 0.88; }
  50%      { opacity: 1; }
}

/* Ghosted element slow drift */
.ghost-drift { animation: ghostDrift 12s ease-in-out infinite alternate; }
@keyframes ghostDrift {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(-6px) scale(1.01); }
}
```

## Rule/Border Draw

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

## SVG Accent Marks

```html
<!-- Corner L-bracket that draws in -->
<svg class="corner-accent" width="40" height="40" viewBox="0 0 40 40">
  <path d="M0 40 L0 0 L40 0" fill="none" stroke="var(--accent)"
        stroke-width="1" opacity="0.3"
        stroke-dasharray="80" stroke-dashoffset="80">
    <animate attributeName="stroke-dashoffset" to="0"
             dur="1.2s" begin="0.5s" fill="freeze"
             calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
  </path>
</svg>

<!-- Dot grid background (one slide max) -->
<svg class="dot-grid" width="100%" height="100%">
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.5" fill="var(--faint)" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dots)"/>
</svg>
```

## Page Transitions

```css
/* Horizontal mode — smooth slide with slight overshoot */
.magazine { transition: transform 0.65s cubic-bezier(0.34, 1.12, 0.64, 1); }

/* Vertical mode — fade + lift */
.slide {
  opacity: 0; transform: translateY(8px);
  transition: opacity 420ms ease, transform 420ms cubic-bezier(.22,.61,.36,1);
}
.slide.active { opacity: 1; transform: none; }
```

## Background Effects

```css
/* Gradient Mesh */
.gradient-bg {
    background:
        radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(0, 255, 200, 0.2) 0%, transparent 50%),
        var(--bg-primary);
}

/* Grid Pattern */
.grid-bg {
    background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
}
```

## Interactive Effects

```javascript
/* 3D Tilt on Hover — for cards/panels */
class TiltEffect {
    constructor(el) {
        el.style.transformStyle = 'preserve-3d';
        el.style.perspective = '1000px';
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'rotateY(0) rotateX(0)';
        });
    }
}
```

## Animation Rules

- **Never animate text content directly** — animate containers
- **Duration:** 400ms–800ms entries, 4s–12s ambient
- **Easing:** Always cubic-bezier, never linear (except SVG stroke draws)
- **Opacity range for ambient:** 0.85–1.0 (barely perceptible)
- **No animation on first paint** — cover slide loads static
- **Reduced motion:** viewport-base.css handles `prefers-reduced-motion`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Fonts not loading | Check Google/Fontshare URL; ensure names match in CSS |
| Animations not triggering | Verify `.active`/`.visible` class is being toggled |
| Mobile issues | Test touch events; reduce particle count at narrow viewports |
| Performance | Use `will-change` sparingly; prefer `transform`/`opacity` only |
