---
name: tldraw-canvas
description: Master-level operation of the tldraw offline desktop app as a live, interactive whiteboard. Read/edit shapes, compose reference-quality diagrams, and install durable document scripts (clickable UI, animation loops) for interactive explainers. Use when the user wants to visualize, diagram, explain, or present something on the canvas, or references tldraw / a .tldraw file / "the whiteboard". Two modes: private explain-to-me, and live-stream field-a-question.
metadata:
  author: jrg
  version: "1.0"
  tags: tldraw, canvas, diagram, visualize, whiteboard, animation, interactive, presentation
---

# tldraw Canvas — Master Operator

Drive the open **tldraw offline** app as a shared thinking + presenting surface.
You are a master of the medium: full API fluency + design taste (composition,
typography, restraint) + motion craft (spring feel, purposeful easing, stagger).

## Interface

Use the **`str_tldraw`** utensil (canonical source:
`~/agent-core/primitives/tools/tldraw.ts`). Never hand-roll curl unless the
utensil is unavailable. Ops: `docs read bindings exec screenshot
script-workspace script-status recipe api imports readme`.

- **Read before you draw:** `str_tldraw({op:'read'})` to see current shapes.
- **Draw / edit:** `str_tldraw({op:'exec', code})` — live `editor` + `helpers`;
  `const {createShapeId,toRichText} = await import('tldraw')`.
- **Verify visually:** `str_tldraw({op:'screenshot'})` returns a file path — READ it.
- **Durable behavior:** `str_tldraw({op:'script-workspace'})` → edit `main.js` →
  `str_tldraw({op:'script-status'})` until `state:"applied"`.
- **Learn on demand:** `op:'recipe'` (no id = list), `op:'api'`, `op:'readme'`.

## Non-negotiables (the craftsman's tells)

1. **Lint before "done":** `str_tldraw({op:'exec', code:'return helpers.getLints()'})`
   must return `{lints:[]}`. Every meaningful arrow uses
   `helpers.createArrowBetweenShapes(a,b)` — real bindings, never raw arrows.
2. **See your own work:** always screenshot + read it before reporting. Never
   claim a composition is good without looking.
3. **Restraint:** default to basic geo shapes, default styles. Reach for color
   only to encode meaning (state, category, emphasis). No decoration without purpose.
4. **Hierarchy & rhythm:** ~300×200 standard shape, ~200 gap. Align to a grid.
   Title in serif, quiet grey subtitle. One idea per row/column.

## Semantic layout discipline

For directional, nested diagrams (flows, pipelines, hierarchies, railroad-style
explainers), adapt Chiplunkar & Pit-Claudel, *Automatic layout of railroad
diagrams* ([arXiv:2509.15834](https://arxiv.org/abs/2509.15834)). The paper is
specific to railroad diagrams; transfer these layout principles, not its notation:

1. **Model meaning before coordinates.** First define components, connections,
   order, branches, and groups. Then choose positions and sizes; style last. A
   reflow must preserve the same nodes, connectivity, direction, and nesting.
2. **Choose one semantic axis.** Commit to left→right or top→bottom reading order.
   Keep branches subordinate to it; do not overlap unrelated group bounds, and
   avoid crossing connectors.
3. **Lay out in this order: align → wrap → justify.** Align connection points or
   baselines—not merely box centers. Wrap at semantic boundaries to fit a target
   viewport. Only then distribute remaining space with a consistent minimum gap.
4. **Prefer the least disruptive wrap.** Among layouts that fit and mean the same
   thing, prefer fewer and shallower wraps, good use of available width, balanced
   rows, then lower total height. Penalize wraps inside deeply nested groups.
5. **Treat consistency as correctness.** Render repeated conceptual structures
   with the same alignment, spacing, and style. After reflow, trace every path and
   compare repeated patterns; reject disconnected, reversed, or one-off variants.

## Gotchas

**Multi-page builds — the page-switch race (correction 2026-07-21).** Inside one
`op:'exec'` batch, `createPage(...)` + `setCurrentPage(newId)` does NOT apply
before later `createShape(...)` calls — shapes land on the PREVIOUS page (symptom:
"I built page N" but they appear on page N-1). Reliable pattern:
1. Call 1: `editor.createPage({name})` (create only).
2. Call 2 (the build): prepend `editor.setCurrentPage(<existingId>)` —
   setCurrentPage on an ALREADY-EXISTING page DOES apply before the creates that
   follow it in the same call. Only createPage+setCurrentPage together fails.
3. Screenshot page N: `setCurrentPage(N)` + `selectAll` + `zoomToFit` +
   `selectNone` in one call, wait ~1s, THEN screenshot — the screenshot targets
   the app's focused page, which can lag an exec switch.
`getLints()` is document-wide; filter its `shapeIds` to the current page's ids to
judge only what you just built.

## Files: ~/canvas/

Daily boards: `~/canvas/YYYY-MM-DD.tldraw` (mirrors `~/flux/Entries/`).
One-offs: `~/canvas/oneoff/<slug>.tldraw`. The live app window is the editing
surface; files here are saved artifacts (File → Save in the app).

## Deep reference

Full craft playbook (palette, layout system, motion recipes, both workflow
modes): **`~/tldraw-mastery/PLAYBOOK.md`**. API reference + worked recipes
cached under `~/tldraw-mastery/reference/`.
