---
name: scrollfx
description: Use when adding a scroll-driven effect to a web page (line drawing on scroll, reveal on scroll, text that splits and rises, counters, pinned panels, horizontal scroll, image sequences, parallax). Starts from one of the ready-made scrollfx effects, each a single HTML file built on the svg-scroll-draw library, and adapts it to the page.
---

# scrollfx

Ready-made scroll effects, each one HTML file in `effects/` of
https://github.com/DhruvilChauahan0210/scrollfx, built on the
[svg-scroll-draw](https://www.npmjs.com/package/svg-scroll-draw) library.

## How to add an effect to a page

1. Pick the closest effect from the list in the scrollfx README (each row names
   the library function it uses: `scrollDraw`, `scrollReveal`, `scrollAnimate`,
   `scrollText`, `scrollCounter`, `scrollPin`, `scrollHorizontal`,
   `scrollProgress`, `scrollSnap`, `scrollFrames`, `scrollDrawSequence`,
   `scrollAnimateGroup`).
2. Copy its `<section>`, its `<style>` and its `<script type="module">`.
3. In a project with a bundler, `npm install svg-scroll-draw` and change the
   jsDelivr import to the package: `https://cdn.jsdelivr.net/npm/svg-scroll-draw@X/dist/index.mjs`
   becomes `svg-scroll-draw`, and `…/dist/text/index.mjs` becomes
   `svg-scroll-draw/text` (the same for `reveal`, `pin`, `snap`, `progress`,
   `horizontal`, `frames`, `group`).
4. In React, Vue, Nuxt, Svelte, Solid or Angular, use the library's wrapper for
   that framework instead of calling the function in a module script: the
   options are the same. See https://svg-scroll-draw.vercel.app/docs.

## Rules

- Use only options listed in the svg-scroll-draw API reference
  (https://svg-scroll-draw.vercel.app/docs). `scrollAnimate` takes `props`;
  `from` belongs to `scrollText` and `scrollReveal`.
- Keep the content readable without JavaScript: the effects only animate what
  is already in the HTML.
- The library respects `prefers-reduced-motion` by showing the final state.
- `scrollSnap` pulls every scroll position to the nearest section, so a page
  that snaps should be made only of its sections.
