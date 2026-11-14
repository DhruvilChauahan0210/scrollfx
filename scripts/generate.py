#!/usr/bin/env python3
"""
Writes effects/*.html from the definitions below.

Every effect is one standalone HTML file: open it, read it, copy it. The shared
page (intro, hint, credit, base styles) is written here once so the files stay
consistent; the files themselves are what people use. Edit an effect here and
run `python3 scripts/generate.py`, then `npm run check`.
"""
from pathlib import Path
from textwrap import dedent

VERSION = '2.27.2'
CDN = f'https://cdn.jsdelivr.net/npm/svg-scroll-draw@{VERSION}/dist'
SITE = 'https://svg-scroll-draw.vercel.app'
REPO = 'https://github.com/DhruvilChauahan0210/scrollfx'

BASE_CSS = """
:root { --bg: #f6f4ef; --ink: #16171b; --muted: #5d5f66; --accent: #2d55d8; --hot: #ff5c39; --line: #d9d5cc; }
* { box-sizing: border-box; }
html { scroll-behavior: auto; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif; }
.fx-intro { min-height: 92vh; display: grid; place-content: center; text-align: center; padding: 0 20px; }
.fx-kicker { font: 600 12px/1 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; }
.fx-intro h1 { font-size: clamp(34px, 7vw, 72px); line-height: 1.02; margin: 0 0 14px; letter-spacing: -.02em; }
.fx-intro p { max-width: 46ch; margin: 0 auto; color: var(--muted); }
.fx-hint { margin-top: 28px !important; font: 600 13px/1 ui-monospace, monospace; color: var(--accent) !important; }
.fx-stage { min-height: 100vh; display: grid; place-items: center; padding: 40px 20px; }
.fx-end { min-height: 70vh; display: grid; place-content: center; text-align: center; color: var(--muted); padding: 0 20px; }
.fx-credit { padding: 28px 20px 40px; text-align: center; font-size: 14px; color: var(--muted); border-top: 1px solid var(--line); }
.fx-credit a { color: var(--ink); }
svg { max-width: 100%; height: auto; }
@media (prefers-reduced-motion: reduce) { .fx-hint { display: none; } }
"""


def page(n, slug, title, desc, category, api, body, script, css='', end='The end. Scroll back up to see it again.', bare=False):
    if bare:
        # The whole page is the effect: scrollSnap pulls any scroll position
        # back to the nearest section, so an intro or a footer outside them
        # could not be reached. The body carries its own title and credit.
        body = body.replace('{CREDIT}', f'<p class="fx-credit-in">Built with <a href="{SITE}">svg-scroll-draw</a> · <a href="{REPO}">more effects on scrollfx</a></p>')
        return dedent(f"""\
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} · scrollfx</title>
    <meta name="description" content="{desc}">
    <meta name="fx:number" content="{n:02d}">
    <meta name="fx:category" content="{category}">
    <meta name="fx:api" content="{api}">
    <style>{BASE_CSS}{css}</style>
    </head>
    <body>
    {body}

    <script type="module">
    {script.strip()}
    </script>
    </body>
    </html>
    """)
    return dedent(f"""\
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} · scrollfx</title>
    <meta name="description" content="{desc}">
    <meta name="fx:number" content="{n:02d}">
    <meta name="fx:category" content="{category}">
    <meta name="fx:api" content="{api}">
    <style>{BASE_CSS}{css}</style>
    </head>
    <body>
    <header class="fx-intro">
      <p class="fx-kicker">scrollfx · {n:02d} · {category}</p>
      <h1>{title}</h1>
      <p>{desc}</p>
      <p class="fx-hint">Scroll ↓</p>
    </header>

    {body}

    <section class="fx-end"><p>{end}</p></section>

    <footer class="fx-credit">
      Built with <a href="{SITE}">svg-scroll-draw</a>, the zero-dependency scroll animation library ·
      <a href="{REPO}">more effects on scrollfx</a>
    </footer>

    <script type="module">
    {script.strip()}
    </script>
    </body>
    </html>
    """)


def imp(names, entry='index'):
    return f"import {{ {', '.join(names)} }} from '{CDN}/{entry}.mjs';"


EFFECTS = []


def fx(slug, title, desc, category, api, body, script, css='', bare=False):
    EFFECTS.append(dict(slug=slug, title=title, desc=desc, category=category, api=api, body=body, script=script, css=css, bare=bare))


# ── Line drawing ─────────────────────────────────────────────────────────────

fx('signature', 'Signature', 'A handwritten line that writes itself as you scroll, fading in as it goes.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="sig" viewBox="0 0 600 200" width="640" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 140 C 60 40, 110 40, 120 110 S 150 170, 175 110 S 220 40, 240 120 S 290 160, 310 100 C 325 60, 360 60, 360 110 S 400 150, 430 90 S 500 50, 520 120 S 560 150, 580 110" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#sig', { easing: 'ease-out', fade: true, trigger: { start: 'top 85%', end: 'center 40%' } });""")

fx('route-map', 'Route map', 'A travel route draws from city to city, each leg a little after the last.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="route" viewBox="0 0 640 360" width="680" fill="none" stroke-linecap="round">
    <g stroke="var(--line)" stroke-width="1">
      <path d="M0 60 H640 M0 120 H640 M0 180 H640 M0 240 H640 M0 300 H640 M80 0 V360 M160 0 V360 M240 0 V360 M320 0 V360 M400 0 V360 M480 0 V360 M560 0 V360" />
    </g>
    <g class="leg" stroke="var(--accent)" stroke-width="4">
      <path d="M70 290 C 120 220, 170 230, 210 190" />
      <path d="M210 190 C 260 150, 300 170, 350 120" />
      <path d="M350 120 C 410 80, 460 110, 500 90" />
      <path d="M500 90 C 540 70, 570 60, 590 40" />
    </g>
    <g fill="var(--hot)">
      <circle cx="70" cy="290" r="7" /><circle cx="210" cy="190" r="7" /><circle cx="350" cy="120" r="7" /><circle cx="500" cy="90" r="7" /><circle cx="590" cy="40" r="7" />
    </g>
  </svg>
</section>""",
imp(['scrollDraw']) + """
// Only the route legs draw; the grid and the cities stay.
scrollDraw('#route', { selector: '.leg path', stagger: 0.12, easing: 'ease-in-out', trigger: { start: 'top 80%', end: 'center 30%' } });""")

fx('outline-then-fill', 'Outline, then fill', 'A logo traces its outline, and its colour floods in as the line closes.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="logo" viewBox="0 0 200 200" width="320" stroke="var(--accent)" stroke-width="4" fill="var(--accent)">
    <path d="M100 20 L178 64 L178 136 L100 180 L22 136 L22 64 Z" />
    <path d="M100 60 L140 82 L140 118 L100 140 L60 118 L60 82 Z" fill="var(--bg)" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#logo', { fillOpacity: [0, 1], easing: 'ease-out', trigger: { start: 'top 80%', end: 'center 35%' } });""")

fx('color-shift-line', 'Colour-shift line', 'One stroke that warms from blue to orange and thickens as it draws.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="wave" viewBox="0 0 700 200" width="720" fill="none" stroke-linecap="round">
    <path d="M10 100 C 90 10, 170 190, 250 100 S 410 10, 490 100 S 610 190, 690 100" stroke="#2d55d8" stroke-width="3" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#wave', { strokeColor: ['#2d55d8', '#ff5c39'], strokeWidth: [3, 12], trigger: { start: 'top 85%', end: 'center 30%' } });""")

fx('erase-on-scroll', 'Erase on scroll', 'The opposite of drawing: a finished sketch rubs itself out as you scroll.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="erase" viewBox="0 0 300 220" width="420" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 190 L40 90 L150 20 L260 90 L260 190 Z" />
    <path d="M120 190 L120 130 L180 130 L180 190" />
    <path d="M70 110 H100 V140 H70 Z" />
    <path d="M200 110 H230 V140 H200 Z" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#erase', { direction: 'reverse', trigger: { start: 'top 60%', end: 'center 20%' } });""")

fx('sketch-preset', 'Sketch preset', 'A small illustration drawn with the sketch preset: a loose, hand-drawn feel.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="cup" viewBox="0 0 240 240" width="340" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 90 H170 V170 C170 200, 150 210, 110 210 C70 210, 50 200, 50 170 Z" />
    <path d="M170 110 C 210 110, 210 160, 170 160" />
    <path d="M80 70 C 70 50, 95 40, 85 20" />
    <path d="M110 70 C 100 50, 125 40, 115 20" />
    <path d="M140 70 C 130 50, 155 40, 145 20" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#cup', { preset: 'sketch', trigger: { start: 'top 80%', end: 'center 30%' } });""")

fx('shape-morph', 'Shape morph', 'A circle melts into a star as you scroll: one path, morphed.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="morph" viewBox="0 0 200 200" width="320" fill="none" stroke="var(--hot)" stroke-width="5" stroke-linejoin="round">
    <path d="M100 20 L123 77 L180 77 L135 112 L152 170 L100 136 L48 170 L65 112 L20 77 L77 77 Z" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
// A star of ten points into a decagon: the same commands, so the points slide.
const decagon = 'M100 20 L147 35 L176 75 L176 125 L147 165 L100 180 L53 165 L24 125 L24 75 L53 35 Z';
scrollDraw('#morph', { morphTo: decagon, easing: 'ease-in-out', trigger: { start: 'top 75%', end: 'center 25%' } });""")

fx('clip-reveal', 'Clip reveal', 'Not just lines: a whole card wipes in from the left, on any content.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <div id="card" class="card">
    <p class="card-k">Case study</p>
    <h2>Wipes in from the left, as you scroll</h2>
    <p>Any element: images, text, a gradient. The clip follows the scroll, back and forth.</p>
  </div>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#card', { clip: 'left', easing: 'ease-out', trigger: { start: 'top 85%', end: 'center 45%' } });""",
css=""".card { width: min(560px, 100%); padding: 36px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #2d55d8, #7a3bd8 60%, #ff5c39); }
.card-k { font: 600 12px/1 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; opacity: .8; margin: 0 0 10px; }
.card h2 { margin: 0 0 10px; font-size: 30px; line-height: 1.1; }
.card p { margin: 0; }""")

fx('underline', 'Hand-drawn underline', 'A marker underline sweeps under the key words of a headline.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <h2 class="headline">Scroll animation, <span class="mark">done right<svg id="underline" viewBox="0 0 300 30" preserveAspectRatio="none" fill="none" stroke="var(--hot)" stroke-width="6" stroke-linecap="round"><path d="M4 20 C 80 6, 190 6, 296 16" /></svg></span>.</h2>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#underline', { easing: 'ease-out', trigger: { start: 'top 75%', end: 'top 45%' } });""",
css=""".headline { font-size: clamp(32px, 6vw, 64px); line-height: 1.1; max-width: 16ch; text-align: center; margin: 0; }
.mark { position: relative; white-space: nowrap; }
.mark svg { position: absolute; left: 0; bottom: -0.18em; width: 100%; height: .4em; }""")

fx('line-chart', 'Line chart', 'A chart line plots its data as you scroll, then the points appear.', 'Line drawing', 'scrollDraw',
"""<section class="fx-stage">
  <svg id="chart" viewBox="0 0 600 320" width="640" fill="none">
    <g stroke="var(--line)" stroke-width="1"><path d="M50 40 H580 M50 110 H580 M50 180 H580 M50 250 H580" /></g>
    <path d="M50 280 H580 M50 20 V280" stroke="var(--ink)" stroke-width="2" />
    <path class="plot" d="M50 250 L130 220 L210 232 L290 170 L370 150 L450 92 L530 70 L580 40" stroke="var(--accent)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
  </svg>
</section>""",
imp(['scrollDraw']) + """
scrollDraw('#chart', { selector: '.plot', easing: 'ease-in-out', trigger: { start: 'top 80%', end: 'center 35%' } });""")

# ── Reveal ───────────────────────────────────────────────────────────────────

CARDS = '\n'.join(f'    <article class="tile"><span>{i:02d}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate([
    ('Fast', 'Runs on the browser’s own scroll timeline.'), ('Small', 'Zero dependencies, one import.'),
    ('Accessible', 'Respects reduced motion.'), ('Typed', 'TypeScript all the way.'),
    ('Framework-ready', 'React, Vue, Svelte, Solid, Angular.'), ('MIT', 'Free for any project.')], 1))
GRID_CSS = """.grid { width: min(960px, 100%); display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
.tile { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 24px; }
.tile span { font: 600 12px/1 ui-monospace, monospace; color: var(--accent); }
.tile h3 { margin: 10px 0 6px; font-size: 22px; }
.tile p { margin: 0; color: var(--muted); }"""

for slug, title, desc, preset in [
    ('fade-up-cards', 'Fade-up cards', 'A grid of cards rises into place one after another, the classic reveal.', 'fadeUp'),
    ('flip-cards', 'Flip cards', 'Cards flip up into view, each a beat after the one before.', 'flip'),
    ('scale-in-grid', 'Scale-in grid', 'Tiles grow from slightly small to full size as they arrive.', 'scale'),
]:
    fx(slug, title, desc, 'Reveal', 'scrollReveal',
       f"""<section class="fx-stage">
  <div class="grid">
{CARDS}
  </div>
</section>""",
       imp(['scrollReveal'], 'reveal/index') + f"""
scrollReveal('.tile', {{ preset: '{preset}', stagger: 0.1 }});""", css=GRID_CSS)

fx('slide-from-sides', 'Slide from the sides', 'Alternating rows slide in from the left and the right.', 'Reveal', 'scrollReveal',
"""<section class="fx-stage">
  <div class="rows">
    <p class="row l">Plan the page.</p>
    <p class="row r">Draw the lines.</p>
    <p class="row l">Ship it.</p>
    <p class="row r">Watch it move.</p>
  </div>
</section>""",
imp(['scrollReveal'], 'reveal/index') + """
scrollReveal('.row.l', { preset: 'fadeLeft', stagger: 0.12 });
scrollReveal('.row.r', { preset: 'fadeRight', stagger: 0.12 });""",
css=""".rows { width: min(760px, 100%); display: grid; gap: 22px; }
.row { margin: 0; font-size: clamp(28px, 5vw, 48px); font-weight: 700; }
.row.r { text-align: right; color: var(--accent); }""")

# ── Animate ──────────────────────────────────────────────────────────────────

fx('background-shift', 'Background shift', 'The whole section changes colour as you scroll through it.', 'Animate', 'scrollAnimate',
"""<section id="shift" class="fx-stage shift"><h2>From cream to midnight.</h2></section>""",
imp(['scrollAnimate']) + """
scrollAnimate('#shift', { props: { backgroundColor: ['#f6f4ef', '#141a33'], color: ['#16171b', '#f6f4ef'] }, easing: 'linear' });""",
css=""".shift h2 { font-size: clamp(32px, 6vw, 64px); margin: 0; text-align: center; }""")

fx('blur-to-sharp', 'Blur to sharp', 'A heading comes into focus, from blurred to crisp.', 'Animate', 'scrollAnimate',
"""<section class="fx-stage"><h2 id="focus" class="big">Coming into focus.</h2></section>""",
imp(['scrollAnimate']) + """
scrollAnimate('#focus', { props: { filter: ['blur(14px)', 'blur(0px)'], opacity: [0.2, 1] }, trigger: { start: 'top 90%', end: 'center 45%' } });""",
css=""".big { font-size: clamp(36px, 8vw, 88px); margin: 0; text-align: center; letter-spacing: -.02em; }""")

fx('rotate-in', 'Rotate in', 'A card swings in from a tilt and settles flat.', 'Animate', 'scrollAnimate',
"""<section class="fx-stage"><div id="tilt" class="tilt"><h2>Settles into place</h2><p>Rotation and scale, scrubbed by the scroll.</p></div></section>""",
imp(['scrollAnimate']) + """
scrollAnimate('#tilt', { props: { transform: ['rotate(-12deg) scale(0.85)', 'rotate(0deg) scale(1)'], opacity: [0, 1] }, trigger: { start: 'top 90%', end: 'center 50%' } });""",
css=""".tilt { width: min(520px, 100%); background: var(--ink); color: var(--bg); border-radius: 20px; padding: 40px; }
.tilt h2 { margin: 0 0 8px; font-size: 32px; } .tilt p { margin: 0; opacity: .75; }""")

fx('parallax-layers', 'Parallax layers', 'Three layers drift at different speeds for depth.', 'Animate', 'scrollParallax',
"""<section class="fx-stage layers">
  <div class="layer back" id="back"></div>
  <div class="layer mid" id="mid"></div>
  <h2 class="front" id="front">Depth, from three speeds.</h2>
</section>""",
imp(['scrollParallax']) + """
scrollParallax('#back', { speed: -0.25 });
scrollParallax('#mid', { speed: 0.15 });
scrollParallax('#front', { speed: 0.45 });""",
css=""".layers { position: relative; overflow: clip; min-height: 120vh; }
.layer { position: absolute; border-radius: 50%; }
.back { width: 520px; height: 520px; background: #dfe6ff; top: 10%; left: 8%; }
.mid { width: 300px; height: 300px; background: #ffd9cf; bottom: 12%; right: 10%; }
.front { position: relative; font-size: clamp(32px, 6vw, 64px); max-width: 14ch; text-align: center; margin: 0; }""")

fx('sticky-zoom', 'Sticky zoom', 'A picture pins in place and zooms in while you scroll past it.', 'Animate', 'scrollPin + scrollAnimate',
"""<section id="zoom-stage" class="zoom-stage">
  <div id="zoom" class="zoom"><span>Zoom</span></div>
</section>""",
imp(['scrollAnimate']) + "\n" + imp(['scrollPin'], 'pin/index') + """
const stage = document.querySelector('#zoom-stage');
scrollPin(stage, { pinDistance: '120vh' });
scrollAnimate('#zoom', { props: { transform: ['scale(0.6)', 'scale(1.6)'], borderRadius: ['40px', '0px'] }, triggerElement: stage.parentElement, trigger: { start: 'top top', end: 'bottom bottom' }, easing: 'linear' });""",
css=""".zoom-stage { height: 100vh; display: grid; place-items: center; overflow: clip; }
.zoom { width: min(520px, 80vw); aspect-ratio: 4/3; display: grid; place-items: center; background: linear-gradient(135deg, #2d55d8, #ff5c39); color: #fff; font-size: 48px; font-weight: 800; }""")

# ── Text ─────────────────────────────────────────────────────────────────────

fx('words-rise', 'Words rise', 'Each word of a statement rises into place, one after another.', 'Text', 'scrollText',
"""<section class="fx-stage"><h2 id="words" class="statement">We design pages that move only when the reader does.</h2></section>""",
imp(['scrollText'], 'text/index') + """
scrollText('#words', { split: 'words', stagger: 0.06 });""",
css=""".statement { font-size: clamp(32px, 6vw, 68px); line-height: 1.08; max-width: 18ch; margin: 0; letter-spacing: -.02em; }""")

fx('letters-drop', 'Letters drop', 'Letters fall into place one by one, like type being set.', 'Text', 'scrollText',
"""<section class="fx-stage"><h2 id="letters" class="statement">Typeset by scrolling.</h2></section>""",
imp(['scrollText'], 'text/index') + """
scrollText('#letters', { split: 'chars', stagger: 0.025, from: { opacity: 0, y: -40, rotate: -8 } });""",
css=""".statement { font-size: clamp(36px, 8vw, 84px); line-height: 1.05; margin: 0; letter-spacing: -.02em; text-align: center; }""")

fx('lines-fade', 'Lines fade in', 'A paragraph fades in line by line as it enters.', 'Text', 'scrollText',
"""<section class="fx-stage"><p id="para" class="para">Good motion explains. It shows where something came from, where it went, and what changed. It follows the reader instead of performing at them, and it stops the moment they stop.</p></section>""",
imp(['scrollText'], 'text/index') + """
scrollText('#para', { split: 'lines', stagger: 0.12, from: { opacity: 0, y: 16 } });""",
css=""".para { font-size: clamp(22px, 3.2vw, 32px); line-height: 1.45; max-width: 30ch; margin: 0; }""")

# ── Numbers ──────────────────────────────────────────────────────────────────

fx('stat-counters', 'Stat counters', 'Three numbers count up from zero as they come into view.', 'Numbers', 'scrollCounter',
"""<section class="fx-stage">
  <div class="stats">
    <div><strong id="c1">48,210</strong><span>sign-ups</span></div>
    <div><strong id="c2">99.9%</strong><span>uptime</span></div>
    <div><strong id="c3">$1.2M</strong><span>raised</span></div>
  </div>
</section>""",
imp(['scrollCounter']) + """
const grouped = new Intl.NumberFormat('en-US');
scrollCounter('#c1', { to: 48210, format: (n) => grouped.format(Math.round(n)) });
scrollCounter('#c2', { to: 99.9, format: (n) => n.toFixed(1) + '%' });
scrollCounter('#c3', { to: 1.2, format: (n) => '$' + n.toFixed(1) + 'M' });""",
css=""".stats { width: min(900px, 100%); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; text-align: center; }
.stats strong { display: block; font-size: clamp(44px, 7vw, 72px); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.stats span { color: var(--muted); }""")

fx('countdown', 'Countdown', 'A number counts down instead of up, ten to zero, with the scroll.', 'Numbers', 'scrollCounter',
"""<section class="fx-stage"><p class="launch">T−<strong id="t">0</strong></p></section>""",
imp(['scrollCounter']) + """
scrollCounter('#t', { from: 10, to: 0, once: false, easing: 'linear', trigger: { start: 'top 80%', end: 'top 20%' } });""",
css=""".launch { font-size: clamp(64px, 14vw, 160px); font-weight: 800; margin: 0; font-variant-numeric: tabular-nums; }""")

# ── Pin, horizontal, progress, snap ──────────────────────────────────────────

fx('pinned-steps', 'Pinned steps', 'A panel holds still while a list of steps lights up one by one.', 'Layout', 'scrollPin',
"""<section id="steps" class="steps">
  <h2>How it works</h2>
  <ol>
    <li>Pick an effect</li>
    <li>Copy one file</li>
    <li>Change the words</li>
    <li>Ship it</li>
  </ol>
  <div class="bar"><span id="bar"></span></div>
</section>""",
imp(['scrollPin'], 'pin/index') + """
const items = document.querySelectorAll('#steps li');
const bar = document.querySelector('#bar');
scrollPin('#steps', {
  pinDistance: '200vh',
  onProgress: (p) => {
    bar.style.transform = `scaleX(${p})`;
    items.forEach((li, i) => li.classList.toggle('on', p >= i / items.length));
  },
});""",
css=""".steps { height: 100vh; display: grid; place-content: center; gap: 18px; padding: 0 20px; }
.steps h2 { margin: 0; font-size: 40px; }
.steps ol { margin: 0; padding-left: 1.2em; font-size: clamp(24px, 4vw, 40px); font-weight: 700; }
.steps li { color: var(--line); transition: color .2s; }
.steps li.on { color: var(--ink); }
.bar { height: 6px; width: min(420px, 80vw); background: var(--line); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); transform: scaleX(0); transform-origin: left; }""")

fx('horizontal-gallery', 'Horizontal gallery', 'Scroll down, move sideways: panels slide past on a pinned stage.', 'Layout', 'scrollHorizontal',
"""<section class="h-outer">
  <div class="h-sticky">
    <div id="track" class="h-track">
      <article class="panel" style="background:#2d55d8">One</article>
      <article class="panel" style="background:#7a3bd8">Two</article>
      <article class="panel" style="background:#ff5c39">Three</article>
      <article class="panel" style="background:#16171b">Four</article>
    </div>
  </div>
</section>""",
imp(['scrollHorizontal'], 'horizontal/index') + """
scrollHorizontal('#track');""",
css=""".h-outer { height: 400vh; }
.h-sticky { position: sticky; top: 0; height: 100vh; overflow: clip; display: flex; align-items: center; }
.h-track { display: flex; gap: 24px; padding: 0 6vw; width: max-content; }
.panel { width: min(70vw, 620px); height: 60vh; border-radius: 22px; color: #fff; display: grid; place-items: center; font-size: 56px; font-weight: 800; }""")

fx('reading-progress', 'Reading progress', 'A bar along the top of the page fills as you read.', 'Layout', 'scrollProgress',
"""<div class="progress" id="progress"></div>
<article id="article" class="article">
  <h2>A long read</h2>
  <p>Progress is written to a CSS variable on the element, so the bar is plain CSS: a scaleX on a fixed strip. Nothing re-renders, and the browser does the drawing.</p>
  <p>Scroll through the article and watch the strip at the top. It reaches the end exactly when the article does, not the page.</p>
  <p>Use the same variable for anything: a dial, a colour, a counter beside the title.</p>
  <p>That is the whole effect.</p>
</article>""",
imp(['scrollProgress'], 'progress/index') + """
const bar = document.querySelector('#progress');
scrollProgress('#article', {
  trigger: { start: 'top top', end: 'bottom bottom' },
  onProgress: (p) => bar.style.setProperty('--p', p),
});""",
css=""".progress { position: fixed; top: 0; left: 0; right: 0; height: 5px; background: var(--accent); transform: scaleX(var(--p, 0)); transform-origin: left; z-index: 2; }
.article { width: min(680px, 100%); margin: 0 auto; padding: 20px 20px 40vh; font-size: 20px; }
.article h2 { font-size: 40px; } .article p { margin: 0 0 60vh; }""")

fx('snap-sections', 'Snap sections', 'Sections snap into place with a smooth glide when you stop scrolling.', 'Layout', 'scrollSnap',
"""<section class="snap s1"><div><p class="fx-kicker">scrollfx · 28 · Layout</p><h1>Snap sections</h1><p>Scroll a little, and the page glides to the next section.</p></div></section>
<section class="snap s2"><h2>Two</h2></section>
<section class="snap s3"><div><h2>Three</h2>{CREDIT}</div></section>""",
imp(['scrollSnap'], 'snap/index') + """
scrollSnap('.snap', { duration: 700 });""",
css=""".snap { height: 100vh; display: grid; place-items: center; text-align: center; color: #fff; padding: 0 20px; }
.snap h1, .snap h2 { font-size: clamp(48px, 10vw, 120px); margin: 0; letter-spacing: -.03em; }
.snap p { max-width: 40ch; margin: 12px auto 0; opacity: .85; }
.snap .fx-kicker { color: #fff; opacity: .7; }
.fx-credit-in { font-size: 14px; } .fx-credit-in a { color: #fff; }
.s1 { background: #2d55d8; } .s2 { background: #7a3bd8; } .s3 { background: #ff5c39; }""", bare=True)

# ── Sequences ────────────────────────────────────────────────────────────────

fx('image-sequence', 'Image sequence', 'An Apple-style product turn: frames on a canvas, scrubbed by the scroll.', 'Sequence', 'scrollFrames',
"""<section class="seq-outer">
  <div class="seq-sticky">
    <canvas id="film" role="img" aria-label="A cube turning as the page scrolls"></canvas>
  </div>
</section>""",
imp(['scrollFrames'], 'frames/index') + """
// The frames are drawn here so the effect needs no files; with your own, pass
// their URLs: frames: (i) => `/frames/${i + 1}.webp`.
const COUNT = 48;
function frame(i) {
  const c = document.createElement('canvas'); c.width = c.height = 480;
  const g = c.getContext('2d'); const a = (i / COUNT) * Math.PI * 2;
  g.fillStyle = '#141a33'; g.fillRect(0, 0, 480, 480);
  g.translate(240, 240); g.rotate(a);
  g.fillStyle = `hsl(${(i / COUNT) * 360}, 75%, 60%)`; g.fillRect(-110, -110, 220, 220);
  g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(-110, -110, 220, 220);
  return c.toDataURL('image/png');
}
const canvas = document.querySelector('#film');
scrollFrames(canvas, { frames: frame, count: COUNT, triggerElement: canvas.closest('.seq-outer'), trigger: { start: 'top top', end: 'bottom bottom' } });""",
css=""".seq-outer { height: 300vh; }
.seq-sticky { position: sticky; top: 0; height: 100vh; display: grid; place-items: center; }
#film { width: min(480px, 86vw); aspect-ratio: 1; border-radius: 22px; }""")

fx('draw-in-sequence', 'Draw in sequence', 'Icons draw one after another: each starts when the last one finishes.', 'Sequence', 'scrollDrawSequence',
"""<section class="fx-stage">
  <div class="icons">
    <svg class="icon" viewBox="0 0 64 64"><path d="M8 32 L26 50 L56 14" /></svg>
    <svg class="icon" viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" /><path d="M32 18 V32 L42 40" /></svg>
    <svg class="icon" viewBox="0 0 64 64"><path d="M12 52 L32 10 L52 52 Z" /><path d="M32 26 V38 M32 44 V46" /></svg>
    <svg class="icon" viewBox="0 0 64 64"><path d="M10 20 H54 V48 H10 Z" /><path d="M10 20 L32 36 L54 20" /></svg>
  </div>
</section>""",
imp(['scrollDrawSequence'], 'group/index') + """
scrollDrawSequence([...document.querySelectorAll('.icon')], { easing: 'ease-out', trigger: { start: 'top 80%', end: 'center 30%' } });""",
css=""".icons { display: flex; flex-wrap: wrap; gap: 28px; justify-content: center; }
.icon { width: 110px; height: 110px; fill: none; stroke: var(--ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }""")

fx('animate-group', 'Animate a group', 'A row of bars grows together from one call, one shared scroll window.', 'Sequence', 'scrollAnimateGroup',
"""<section class="fx-stage">
  <div class="bars">
    <span class="b" style="--h:40%"></span><span class="b" style="--h:65%"></span><span class="b" style="--h:52%"></span>
    <span class="b" style="--h:80%"></span><span class="b" style="--h:70%"></span><span class="b" style="--h:95%"></span>
  </div>
</section>""",
imp(['scrollAnimateGroup'], 'group/index') + """
scrollAnimateGroup([...document.querySelectorAll('.b')], { props: { transform: ['scaleY(0)', 'scaleY(1)'] }, easing: 'ease-out', trigger: { start: 'top 85%', end: 'center 45%' } });""",
css=""".bars { width: min(620px, 100%); height: 300px; display: flex; align-items: flex-end; gap: 16px; border-bottom: 2px solid var(--ink); }
.b { flex: 1; height: var(--h); background: var(--accent); border-radius: 8px 8px 0 0; transform-origin: bottom; }""")


def main():
    out = Path(__file__).resolve().parent.parent / 'effects'
    out.mkdir(exist_ok=True)
    for old in out.glob('*.html'):
        old.unlink()
    for i, e in enumerate(EFFECTS, 1):
        (out / f"{i:02d}-{e['slug']}.html").write_text(page(i, e['slug'], e['title'], e['desc'], e['category'], e['api'], e['body'], e['script'], e['css'], bare=e['bare']))
    print(f'{len(EFFECTS)} effects written to effects/')


if __name__ == '__main__':
    main()
