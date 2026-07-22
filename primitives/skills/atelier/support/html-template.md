# HTML Presentation Template

Reference architecture for Atelier presentations. Fixed 16:9 stage: slides authored at 1920×1080, scaled uniformly.

## Base HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Title — A Reading</title>

    <!-- Fonts: Google Fonts or Fontshare — never system fonts alone -->
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">

    <style>
        /* ===========================================
           CSS CUSTOM PROPERTIES (THEME)
           Change these to retheme the whole deck
           =========================================== */
        :root {
            /* Colors — from chosen palette */
            --bg-primary: #f4f1ea;
            --bg-alt: #efeae0;
            --ink: #1c1b19;
            --muted: #6f6a61;
            --faint: #b9b2a5;
            --accent: #8c2f22;
            --rule: #d8d2c5;
            --code-bg: rgba(28,27,25,.045);
            --stage-bg: #000;
            --slide-bg: var(--bg-primary);

            /* Typography — at 1920×1080 design size */
            --font-display: 'Playfair Display', serif;
            --font-body: 'Source Serif 4', serif;
            --font-mono: 'IBM Plex Mono', monospace;
            --title-size: 112px;
            --h2-size: 72px;
            --body-size: 28px;
            --code-size: 22px;
            --kicker-size: 16px;

            /* Spacing */
            --slide-padding: 120px;
            --content-gap: 32px;
            --measure: 820px;

            /* Animation */
            --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
            --duration-normal: 0.6s;
        }

        /* ===========================================
           BASE STYLES
           =========================================== */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* --- PASTE viewport-base.css CONTENTS HERE --- */

        /* ===========================================
           SLIDE COMPONENTS
           =========================================== */

        /* Kicker — mono, uppercase, accent, with rule */
        .kicker {
            font-family: var(--font-mono);
            font-size: var(--kicker-size);
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .kicker::after {
            content: "";
            height: 1px;
            flex: 1;
            background: var(--rule);
        }

        /* Headlines */
        h1 {
            font-family: var(--font-display);
            font-weight: 400;
            font-size: var(--title-size);
            line-height: 0.98;
            letter-spacing: -0.015em;
            color: var(--ink);
        }
        h2 {
            font-family: var(--font-display);
            font-weight: 400;
            font-size: var(--h2-size);
            line-height: 1.04;
            letter-spacing: -0.012em;
            color: var(--ink);
            margin-bottom: 40px;
        }

        /* Lede — large sentence under title */
        .lede {
            font-family: var(--font-body);
            font-size: 36px;
            line-height: 1.5;
            max-width: var(--measure);
            color: var(--ink);
        }

        /* Body prose */
        .body {
            font-family: var(--font-body);
            font-size: var(--body-size);
            line-height: 1.62;
            max-width: var(--measure);
            color: var(--ink);
            margin-top: 24px;
        }
        .body .muted { color: var(--muted); }
        .body .accent { color: var(--accent); }

        /* Code block — accent left rule, not a box */
        pre {
            font-family: var(--font-mono);
            font-size: var(--code-size);
            line-height: 1.65;
            background: var(--code-bg);
            border-left: 3px solid var(--accent);
            padding: 28px 36px;
            margin-top: 40px;
            overflow-x: auto;
            color: var(--ink);
            max-width: 1100px;
        }
        pre .c { color: var(--muted); font-style: italic; }
        pre .k { color: var(--accent); }
        pre .s { color: #3a6b3a; }

        /* Field-map — direct-labeled rows */
        .map { margin-top: 48px; max-width: 1100px; }
        .map .row {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 32px;
            padding: 16px 0;
            border-bottom: 1px solid var(--rule);
            align-items: baseline;
        }
        .map .row:last-child { border-bottom: none; }
        .map .term {
            font-family: var(--font-mono);
            font-size: 20px;
            color: var(--accent);
        }
        .map .def { font-size: 26px; line-height: 1.45; }

        /* Quote */
        .quote {
            font-family: var(--font-display);
            font-size: 56px;
            line-height: 1.22;
            max-width: 960px;
        }
        .quote .attr {
            display: block;
            margin-top: 36px;
            font-family: var(--font-mono);
            font-size: 16px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--muted);
        }

        /* Two-column — before/after */
        .two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 64px;
            margin-top: 48px;
            align-items: start;
        }
        .two h3 {
            font-family: var(--font-mono);
            font-weight: 400;
            font-size: 16px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 20px;
        }

        /* Ghosted background element */
        .ghosted {
            position: absolute;
            font-family: var(--font-display);
            font-size: 400px;
            font-weight: 900;
            opacity: 0.05;
            color: var(--ink);
            pointer-events: none;
            line-height: 1;
        }

        /* Callout — insider note */
        .callout {
            background: var(--code-bg);
            border-left: 4px solid var(--accent);
            padding: 28px 36px;
            margin-top: 40px;
            max-width: var(--measure);
        }
        .callout p {
            font-family: var(--font-body);
            font-size: 24px;
            line-height: 1.55;
        }

        /* Chrome — progress + counter */
        .progress-bar {
            position: fixed;
            top: 0; left: 0;
            height: 2px;
            background: var(--accent);
            width: 0;
            transition: width 320ms cubic-bezier(.22,.61,.36,1);
            z-index: 50;
        }
        .counter {
            position: fixed;
            bottom: 40px; right: 48px;
            font-family: var(--font-mono);
            font-size: 16px;
            letter-spacing: 0.1em;
            color: var(--faint);
            z-index: 50;
        }

        /* ===========================================
           ANIMATIONS (see animation-patterns.md)
           =========================================== */
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity var(--duration-normal) var(--ease-out-expo),
                        transform var(--duration-normal) var(--ease-out-expo);
        }
        .slide.active .reveal,
        .slide.visible .reveal {
            opacity: 1;
            transform: translateY(0);
        }
        .reveal:nth-child(1) { transition-delay: 0.1s; }
        .reveal:nth-child(2) { transition-delay: 0.2s; }
        .reveal:nth-child(3) { transition-delay: 0.3s; }
        .reveal:nth-child(4) { transition-delay: 0.4s; }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                transition-duration: 0.2s !important;
            }
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progress"></div>
    <div class="deck-viewport">
        <main class="deck-stage" id="deckStage">

            <section class="slide active">
                <div class="kicker reveal">Topic · a reading</div>
                <h1 class="reveal">Title</h1>
                <p class="lede reveal" style="margin-top:48px;">One-line essence.</p>
            </section>

            <!-- More slides following the narrative arc -->

        </main>
    </div>
    <div class="counter" id="counter">01 / 01</div>

    <script>
        /* ===========================================
           SLIDE PRESENTATION CONTROLLER
           =========================================== */
        class SlidePresentation {
            constructor() {
                this.slides = [...document.querySelectorAll('.slide')];
                this.current = 0;
                this.stage = document.getElementById('deckStage');
                this.progress = document.getElementById('progress');
                this.counter = document.getElementById('counter');
                this.setupStageScale();
                this.setupNav();
                this.show(0);
            }

            setupStageScale() {
                const scale = () => {
                    const f = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                    const x = (window.innerWidth - 1920 * f) / 2;
                    const y = (window.innerHeight - 1080 * f) / 2;
                    this.stage.style.transform = `translate(${x}px, ${y}px) scale(${f})`;
                };
                scale();
                window.addEventListener('resize', scale);
            }

            setupNav() {
                document.addEventListener('keydown', e => {
                    if (['ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); this.show(this.current + 1); }
                    else if (['ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); this.show(this.current - 1); }
                    else if (e.key === 'Home') { e.preventDefault(); this.show(0); }
                    else if (e.key === 'End') { e.preventDefault(); this.show(this.slides.length - 1); }
                });
                document.addEventListener('click', e => {
                    e.clientX > innerWidth / 2 ? this.show(this.current + 1) : this.show(this.current - 1);
                });
                // Touch/swipe
                let startX;
                document.addEventListener('touchstart', e => startX = e.touches[0].clientX);
                document.addEventListener('touchend', e => {
                    const dx = e.changedTouches[0].clientX - startX;
                    if (Math.abs(dx) > 50) dx < 0 ? this.show(this.current + 1) : this.show(this.current - 1);
                });
            }

            show(n) {
                this.current = Math.max(0, Math.min(n, this.slides.length - 1));
                this.slides.forEach((s, i) => {
                    s.classList.toggle('active', i === this.current);
                    s.classList.toggle('visible', i === this.current);
                });
                const pad = n => String(n).padStart(2, '0');
                this.progress.style.width = (this.current / (this.slides.length - 1) * 100) + '%';
                this.counter.textContent = pad(this.current + 1) + ' / ' + pad(this.slides.length);
            }
        }

        new SlidePresentation();
    </script>

    <!-- ===========================================
         INLINE EDITING (included by default)
         =========================================== -->
    <div class="edit-hotzone"></div>
    <button class="edit-toggle" id="editToggle" title="Edit mode (E)">✏️</button>
    <style>
        .edit-hotzone {
            position: fixed; top: 0; left: 0;
            width: 80px; height: 80px; z-index: 10000; cursor: pointer;
        }
        .edit-toggle {
            position: fixed; top: 16px; left: 16px;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 10001;
            background: var(--accent, #8c2f22);
            color: white; border: none; border-radius: 8px;
            padding: 8px 14px; font-size: 18px; cursor: pointer;
        }
        .edit-toggle.show, .edit-toggle.active { opacity: 1; pointer-events: auto; }
    </style>
    <script>
        (() => {
            const btn = document.getElementById('editToggle');
            const hz = document.querySelector('.edit-hotzone');
            let hideTO = null, isEditing = false;

            hz.addEventListener('mouseenter', () => { clearTimeout(hideTO); btn.classList.add('show'); });
            hz.addEventListener('mouseleave', () => { hideTO = setTimeout(() => { if (!isEditing) btn.classList.remove('show'); }, 400); });
            btn.addEventListener('mouseenter', () => clearTimeout(hideTO));
            btn.addEventListener('mouseleave', () => { hideTO = setTimeout(() => { if (!isEditing) btn.classList.remove('show'); }, 400); });

            function toggleEdit() {
                isEditing = !isEditing;
                btn.classList.toggle('active', isEditing);
                document.querySelectorAll('h1,h2,h3,.lede,.body,.quote,p,.callout p,.map .def').forEach(el => {
                    el.contentEditable = isEditing;
                    el.style.outline = isEditing ? '1px dashed var(--accent, #8c2f22)' : 'none';
                });
            }

            btn.addEventListener('click', toggleEdit);
            hz.addEventListener('click', toggleEdit);
            document.addEventListener('keydown', e => {
                if ((e.key === 'e' || e.key === 'E') && !e.target.getAttribute('contenteditable')) toggleEdit();
            });
        })();
    </script>
</body>
</html>
```

## CSS Gotchas

### Negating CSS Functions

**WRONG — silently ignored:**
```css
right: -clamp(28px, 3.5vw, 44px);
```

**CORRECT:**
```css
right: calc(-1 * clamp(28px, 3.5vw, 44px));
```

### Slide Visibility

Use `visibility` + `opacity` + `pointer-events` (from viewport-base.css).
Do NOT use `display: none` / `display: block` — layout classes can override them.

## Image Pipeline (when images are provided)

Use direct file paths (not base64) for local viewing:
```html
<img src="assets/screenshot.png" alt="Screenshot" class="slide-image">
```

Process oversized images (>1MB) with Python PIL before embedding.
