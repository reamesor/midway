# MIDWAY_INTRO_PROMPT.md
## paste this into Cursor. (optional: attach `midway-intro.html` — this prompt already contains everything, but the file is the visual source of truth.)

> **goal:** build the MIDWAY landing page with an animated intro transition that looks EXACTLY like the reference: a big-top **tent-curtain reveal** in a calm, warm, "operate.so × pixel" aesthetic. On load, a striped canopy covers the screen, the pixel tent unfurls, the MIDWAY wordmark assembles letter-by-letter, a tagline + a Luck–Logic spectrum fade in, then the canopy curtains part to reveal a clean hero underneath. No carousel. No treasury/house section. Just the reveal → hero.

---

# 0. STACK

- **Next.js 15** (App Router) + TypeScript
- **framer-motion** for orchestration (or plain CSS keyframes — the reference is pure CSS; either is fine, match the timings exactly)
- Fonts via `next/font/google`: **Instrument Sans** (400–700) for UI, **Space Mono** for the tiny technical/mono labels
- No other UI libs needed for the intro

Build the intro as a component `<MidwayIntro/>` that overlays the page on first load, plays once, then reveals `<Hero/>` beneath it. Add a small **REPLAY** button (dev/demo aid) that re-triggers the sequence.

---

# 1. AESTHETIC (exact tokens)

Calm, warm, editorial base + pixel art used ONLY as jewelry (logo, wordmark, glyphs). Not full 8-bit.

```css
:root{
  --paper:#e9e6df;   /* warm off-white bg */
  --paper-2:#e3e1d8;
  --sage:#a9c6a0;    /* curtain / soft green */
  --sage-2:#b9d3b1;
  --ink:#2f5a38;     /* deep green ink (text, outlines) */
  --ink-2:#3d6b45;
  --ink-dim:#6e8a6c;
  --line:#4a7a52;
  --gold:#c08a2e;    /* warm accent: pennant, curtain hem */
  --btn:#f4f2ec;     /* cream button */
}
```

Global: warm `--paper` background with a faint dot-grain overlay (`radial-gradient(rgba(47,90,56,.05) 1px, transparent 1px); background-size:4px 4px; opacity:.5`). Body `overflow:hidden` during intro. All pixel SVGs get `image-rendering:pixelated`. Antialiased text.

---

# 2. PIXEL ASSETS (render these as inline SVG via the tiny engine below)

**Pixel engine** — turns a char-grid into crisp `<rect>` SVG:
```ts
function rects(g:string[], p:Record<string,string>, px:number){let s='';
  for(let r=0;r<g.length;r++){const row=g[r];
    for(let c=0;c<row.length;c++){const col=p[row[c]];
      if(col) s+=`<rect x="${c*px}" y="${r*px}" width="${px}" height="${px}" fill="${col}"/>`;}}
  return s;}
function pixelSVG(g:string[], p:Record<string,string>, px:number){
  const cols=Math.max(...g.map(r=>r.length)), rows=g.length;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols*px} ${rows*px}" width="100%" height="100%" shape-rendering="crispEdges">${rects(g,p,px)}</svg>`;}
```

**The tent (16×16)** — palette `{K:'#2f5a38',R:'#7fae74',W:'#eef4e6',Y:'#c08a2e',D:'#254a2d'}`:
```
........KYYY....
........KYY.....
........KY......
.......KYK......
......KRWRK.....
.....KRWRWRK....
....KRWRWRWRK...
...KRWRWRWRWRK..
..KRWRWRWRWRWRK.
..KYKYKYKYKYKYK.
...KRWRWRWRWK...
...KRWRDDRWRK...
...KRWRDDRWRK...
...KRWRDDRWRK...
...KRWRDDRWRK...
...KKKKDDKKKK...
```

**Wordmark bitmap font (5×7 each)** — render each letter as its OWN SVG so they can be staggered. Fill `{X:'#2f5a38'}`:
```
M: X...X / XX.XX / X.X.X / X.X.X / X...X / X...X / X...X
I: XXXXX / ..X.. / ..X.. / ..X.. / ..X.. / ..X.. / XXXXX
D: XXXX. / X...X / X...X / X...X / X...X / X...X / XXXX.
W: X...X / X...X / X...X / X.X.X / X.X.X / XX.XX / X...X
A: .XXX. / X...X / X...X / XXXXX / X...X / X...X / X...X
Y: X...X / X...X / .X.X. / ..X.. / ..X.. / ..X.. / ..X..
```

**Play glyph (for buttons)** — fill with `currentColor` so it inherits button text color:
```
K...
KK..
KKK.
KKKK
KKK.
KK..
K...
```
Render tent at px≈7 (150px box), wordmark letters at px≈7 (38px wide each, 6px gap), mini-mark (hero) at px≈4, glyphs at px≈3.

---

# 3. THE ANIMATION TIMELINE (match these delays + easings EXACTLY)

Trigger everything by adding a class `run` to `<body>` (or an `isPlaying` state). Total ≈3.5s, then hero is fully in.

| # | element | starts | duration | easing | motion |
|---|---|---|---|---|---|
| 1 | corner brackets (4, staggered) | 0.15 / 0.28 / 0.41 / 0.54s | 0.4s | ease | fade + scale from 1.4→1, opacity→.9 |
| 2 | pixel tent | 0.5s | 0.7s | `cubic-bezier(.34,1.56,.4,1)` (overshoot) | scale .2→1, translateY 20px→0, opacity 0→1 |
| 2b | tent idle bob | 1.3s | 3s, infinite | ease-in-out | translateY 0 → -4px → 0 |
| 3 | wordmark letters (6, staggered) | 1.05s +0.09s each | 0.5s | `cubic-bezier(.34,1.56,.4,1)` | drop: translateY -28px→0, rotate -8deg→0, opacity 0→1 |
| 4 | tagline "every cut comes home" | 2.0s | 0.6s | ease | fade + translateY 8px→0 |
| 5 | Luck–Logic spectrum | 2.25s | 0.6s | ease | same fadeUp |
| 6 | center stage fades out | 3.0s | 0.5s | ease | opacity→0 |
| 7 | **curtains part** (L & R) | 3.0s | 1.1s | `cubic-bezier(.7,0,.2,1)` | L: translateX 0→-102% · R: translateX 0→+102% |
| 8 | hero reveal | 3.15s | 1.0s | ease | opacity 0→1, scale .985→1 |

**Curtains:** two panels, each `width:52%` (slight overlap so no seam), pinned to left and right edges, `z-index` above the center stage's parent but the center stage content sits on top of the curtains (z above). Curtain fill = **striped canopy**:
```css
background:repeating-linear-gradient(90deg,var(--sage) 0 26px,var(--sage-2) 26px 52px);
box-shadow:0 0 40px rgba(47,90,56,.2);
```
Add a hem stripe at the bottom of each curtain (the carnival valance):
```css
/* ::after, height:26px, bottom:0 */
background:repeating-linear-gradient(90deg,var(--gold) 0 26px,var(--ink) 26px 52px);opacity:.85;
```

**Corner brackets:** a centered box `width:min(560px,74vw); height:min(360px,52vh)`, with 4 absolutely-positioned 26×26px corner pieces using 2px `--ink` borders (tl: left+top, tr: right+top, bl: left+bottom, br: right+bottom).

**Center stage** (on top of curtains): flex column, centered, gap ~18px, containing brackets + tent + wordmark row + tagline + spectrum. It fades out (step 6) as the curtains part.

**Spectrum:** `Luck` — thin line with end ticks — a filled `--ink` knob — thin line — `Logic`. Small uppercase Space Mono caps.

After the sequence, set the intro overlay `pointer-events:none` and (optionally) unmount it; restore `body` scroll.

---

# 4. THE HERO (revealed underneath — keep it minimal)

Centered column, `--paper` bg:
- **rotated side labels** (fixed): left = `MIDWAY · ALPHA` / `07.12.2026`; right (rotated 180°) = `EVERY CUT COMES HOME` / `v3.1`. 10px uppercase `--ink-dim`.
- small **pixel tent mini-mark** (px≈4)
- **H1:** `every cut` / `comes home.` — `comes home.` in `--ink-dim` (`.soft`). Font `clamp(38px,7vw,76px)`, weight 600, letter-spacing -2px, line-height 1.
- **subline:** "the boardwalk, rebuilt honest. play, mint, trade — the house cut flows back to everyone." (max-width 440px, `--ink-2`)
- **button:** solid `--ink` bg, `--btn` text, pixel play glyph + "Enter the Midway", `border-radius:9px`, hard offset shadow `2px 2px 0 #1f3e26`, press-in on `:active`.

**Do NOT add** a carousel, a rides carousel, a treasury/house panel, an attractions grid, or any extra sections. The deliverable is: intro transition → clean hero. (Other sections can come later as separate work.)

---

# 5. REPLAY (dev aid)

Fixed bottom-right cream button with a pixel play glyph + "REPLAY". On click: remove the `run` class, force reflow (`void document.body.offsetWidth`), re-add `run` — so the whole sequence replays. (In framer-motion: reset a `key` or replay the timeline.)

---

# 6. RESPONSIVENESS & A11Y

- Works down to ~360px: tent + wordmark scale down (use `clamp`/viewport-based px), curtains still cover + part.
- Respect `prefers-reduced-motion`: skip the intro (or cut it to a fast 400ms fade) and show the hero immediately. Provide a "skip" affordance.
- Intro plays once per session (store a flag); REPLAY is the manual re-trigger.

---

# 7. ACCEPTANCE — "it matches when"

- [ ] On load: striped sage canopy covers the screen; brackets draw into the corners
- [ ] Pixel tent **pops with an overshoot** and then gently bobs
- [ ] "MIDWAY" assembles **letter-by-letter**, each dropping in with a slight rotate
- [ ] Tagline + Luck–Logic spectrum fade up under the wordmark
- [ ] At ~3.0s the **canopy curtains split left/right** and slide off, center stage fades
- [ ] The calm hero fades/scales in beneath, with rotated side labels + pixel mini-mark
- [ ] Palette is warm paper + sage + deep-green ink + gold accents; pixel art stays crisp (`image-rendering:pixelated`)
- [ ] REPLAY re-plays the full sequence; reduced-motion skips it
- [ ] No carousel, no treasury/house section — just reveal → hero

**Match the reference `midway-intro.html` 1:1 on colors, pixel grids, and the timeline above. The feel: a calm carnival tent quietly opening its flaps to start the show.**

— end of MIDWAY_INTRO_PROMPT.md
