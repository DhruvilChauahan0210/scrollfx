# scrollfx

**Copy-paste scroll effects. Each one is a single HTML file: open it, read it, copy it.**

Line drawing, reveals, text that splits and rises, counters, pinned panels, horizontal scroll and
Apple-style image sequences. No build step, no framework required.

Every effect runs on [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll), a
zero-dependency scroll animation library that drives the browser's native CSS scroll timeline where
it can and falls back to JavaScript where it can't. The effects load it from jsDelivr; in your own
project, `npm install svg-scroll-draw` and change the import.

[![npm](https://img.shields.io/npm/v/svg-scroll-draw?label=svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Use an effect

1. Find it in the list below and open the file.
2. Copy it, or copy the `<section>`, the `<style>` and the `<script type="module">` into your page.
3. Change the words, the colours and the shapes.

Using a framework? svg-scroll-draw has components and hooks for React, Vue, Nuxt, Svelte, Solid
and Angular, with the same options: see the [docs](https://svg-scroll-draw.vercel.app/docs).

## Effects

<!-- effects -->
| # | Effect | What it does | API |
|---|---|---|---|
| 01 | [Signature](effects/01-signature.html) | A handwritten line that writes itself as you scroll, fading in as it goes. | `scrollDraw` |
| 02 | [Route map](effects/02-route-map.html) | A travel route draws from city to city, each leg a little after the last. | `scrollDraw` |
| 03 | [Outline, then fill](effects/03-outline-then-fill.html) | A logo traces its outline, and its colour floods in as the line closes. | `scrollDraw` |
| 04 | [Colour-shift line](effects/04-color-shift-line.html) | One stroke that warms from blue to orange and thickens as it draws. | `scrollDraw` |
| 05 | [Erase on scroll](effects/05-erase-on-scroll.html) | The opposite of drawing: a finished sketch rubs itself out as you scroll. | `scrollDraw` |
| 06 | [Sketch preset](effects/06-sketch-preset.html) | A small illustration drawn with the sketch preset: a loose, hand-drawn feel. | `scrollDraw` |
| 07 | [Shape morph](effects/07-shape-morph.html) | A circle melts into a star as you scroll: one path, morphed. | `scrollDraw` |
| 08 | [Clip reveal](effects/08-clip-reveal.html) | Not just lines: a whole card wipes in from the left, on any content. | `scrollDraw` |
| 09 | [Hand-drawn underline](effects/09-underline.html) | A marker underline sweeps under the key words of a headline. | `scrollDraw` |
| 10 | [Line chart](effects/10-line-chart.html) | A chart line plots its data as you scroll, then the points appear. | `scrollDraw` |
| 11 | [Fade-up cards](effects/11-fade-up-cards.html) | A grid of cards rises into place one after another, the classic reveal. | `scrollReveal` |
| 12 | [Flip cards](effects/12-flip-cards.html) | Cards flip up into view, each a beat after the one before. | `scrollReveal` |
| 13 | [Scale-in grid](effects/13-scale-in-grid.html) | Tiles grow from slightly small to full size as they arrive. | `scrollReveal` |
| 14 | [Slide from the sides](effects/14-slide-from-sides.html) | Alternating rows slide in from the left and the right. | `scrollReveal` |
| 15 | [Background shift](effects/15-background-shift.html) | The whole section changes colour as you scroll through it. | `scrollAnimate` |
| 16 | [Blur to sharp](effects/16-blur-to-sharp.html) | A heading comes into focus, from blurred to crisp. | `scrollAnimate` |
| 17 | [Rotate in](effects/17-rotate-in.html) | A card swings in from a tilt and settles flat. | `scrollAnimate` |
| 18 | [Parallax layers](effects/18-parallax-layers.html) | Three layers drift at different speeds for depth. | `scrollParallax` |
| 19 | [Sticky zoom](effects/19-sticky-zoom.html) | A picture pins in place and zooms in while you scroll past it. | `scrollPin + scrollAnimate` |
| 20 | [Words rise](effects/20-words-rise.html) | Each word of a statement rises into place, one after another. | `scrollText` |
| 21 | [Letters drop](effects/21-letters-drop.html) | Letters fall into place one by one, like type being set. | `scrollText` |
| 22 | [Lines fade in](effects/22-lines-fade.html) | A paragraph fades in line by line as it enters. | `scrollText` |
| 23 | [Stat counters](effects/23-stat-counters.html) | Three numbers count up from zero as they come into view. | `scrollCounter` |
| 24 | [Countdown](effects/24-countdown.html) | A number counts down instead of up, ten to zero, with the scroll. | `scrollCounter` |
| 25 | [Pinned steps](effects/25-pinned-steps.html) | A panel holds still while a list of steps lights up one by one. | `scrollPin` |
| 26 | [Horizontal gallery](effects/26-horizontal-gallery.html) | Scroll down, move sideways: panels slide past on a pinned stage. | `scrollHorizontal` |
| 27 | [Reading progress](effects/27-reading-progress.html) | A bar along the top of the page fills as you read. | `scrollProgress` |
| 28 | [Snap sections](effects/28-snap-sections.html) | Sections snap into place with a smooth glide when you stop scrolling. | `scrollSnap` |
| 29 | [Image sequence](effects/29-image-sequence.html) | An Apple-style product turn: frames on a canvas, scrubbed by the scroll. | `scrollFrames` |
| 30 | [Draw in sequence](effects/30-draw-in-sequence.html) | Icons draw one after another: each starts when the last one finishes. | `scrollDrawSequence` |
| 31 | [Animate a group](effects/31-animate-group.html) | A row of bars grows together from one call, one shared scroll window. | `scrollAnimateGroup` |
<!-- /effects -->

## Make your own

Each file follows the same shape: a header, one or more sections, a credit line, and a module
script that imports from svg-scroll-draw. The option tables in the
[API reference](https://svg-scroll-draw.vercel.app/docs) list everything an effect can use.

To change an effect in this repository, edit `scripts/generate.py`, then:

```bash
npm run generate && npm run build && npm run check
```

`check` opens every effect in Chromium, scrolls to the end, and fails on any console error or an
animation that never finishes.

## License

MIT. The effects are yours to copy into any project, commercial included.
