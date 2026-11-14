# scrollfx

**Scroll-driven sections for React and Tailwind. Add one with the shadcn CLI, and it takes on your theme.**

Heroes, timelines, pricing, product tours: the sections a product site actually ships, with motion that follows
the reader's scroll. Every block uses only shadcn/ui's theme tokens (`bg-background`, `text-muted-foreground`,
`border-border`, `bg-primary`), so in your project it looks like the rest of your project.

```bash
npx shadcn@latest add https://scrollfx.vercel.app/r/hero-tilt.json
```

The motion runs on [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll), a zero-dependency
library that drives the browser's native CSS scroll timeline where it can and falls back to JavaScript where it
can't. The CLI installs it for you.

## Blocks

| Block | What moves | Install |
|---|---|---|
| **Hero, tilted screenshot** | The key phrase underlines itself; the product screenshot starts tilted back and straightens as you scroll. | `npx shadcn@latest add https://scrollfx.vercel.app/r/hero-tilt.json` |
| **Changelog timeline** | The rail draws down as you read, its tip held at 60% of the screen, and each release lights up as the line reaches it. | `npx shadcn@latest add https://scrollfx.vercel.app/r/changelog-timeline.json` |
| **Pricing, counted in** | Prices count up as the section arrives; every checkmark draws itself in, row after row. | `npx shadcn@latest add https://scrollfx.vercel.app/r/pricing-count.json` |

More are on the way: a pinned product tour, a horizontal case-study strip, a product turnaround, a stats band
and a testimonial wall.

## What every block does

- **Takes props.** Copy, prices, releases and links are props with sensible defaults; replace the defaults and
  ship.
- **Reads without the motion.** Content is in the server HTML (prices and counters included) and nothing starts
  hidden, so search engines and readers without JavaScript get the page.
- **Respects reduced motion.** With `prefers-reduced-motion`, every block shows its finished state.
- **Is checked in a real browser.** `npm run check` builds the site, scrolls every block in Chromium, and fails on
  any console error, any hydration warning, or an animation that never finishes.

## Develop

```bash
npm install
npm run dev     # http://localhost:4400
npm run build   # the shadcn registry (public/r) and the site
npm run check   # every block, scrolled in Chromium
```

A block is a file in `registry/blocks/`, an entry in `registry.json` and `lib/blocks.ts`, and a line in
`registry/previews.ts`.

## License

MIT. Use the blocks in any project, commercial included.
