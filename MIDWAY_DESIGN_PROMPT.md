# MIDWAY_DESIGN_PROMPT.md
## paste this into Cursor. it's an ART-DIRECTION override — it changes how Midway LOOKS, not what it does.

> **how to use:** paste this whole file into Cursor. if you already built (or are building) from `MIDWAY_BUILD_PROMPT.md` + `midway-ecosystem.html`, say: *"Keep all functionality from the build prompt and the structure from the HTML. Re-skin the entire app to THIS design direction."* This file overrides the old "clean dark neon" look completely.

---

# 0. THE ONE-LINER

**Midway is a haunted 8-bit boardwalk arcade running inside a glitchy bootleg operating system.**

Every screen looks like a cursed retro desktop you found on an abandoned hard drive: draggable program windows, dithered black-and-white carnival art, CRT glow, blinking pixel signage, error dialogs that pop when you win or lose, a scrolling marquee ticker for the treasury. It's loud, characterful, and a little unhinged — but the money-flow numbers stay perfectly legible. **Chaos is the chrome. Clarity is the content.**

---

# 1. MOOD ANCHORS (what we're channeling)

Pull from these named aesthetics — blend them, don't pick one:

- **1-bit / dithered pixel art** — Bayer-dither black & white, halftone, `image-rendering: pixelated`. Think old Mac, Playdate, obradinn, `STAY ROTTEN` error collages.
- **Bootleg OS / Win98 + classic Mac chrome** — title bars, beveled buttons, scrollbars, taskbar, draggable windows, `ERROR.EXE` / `VIRUS DETECTED` / `CLICK FIX` dialogs.
- **Y2K webcore / old personal-site energy** — webrings, "Neighbors + Cool Sites", 88×31 badges, marquees, hit counters, guestbooks, sparkles, tiled backgrounds, "under construction" gifs.
- **Glitchcore / CRT / VHS** — scanlines, chromatic aberration, signal noise, screen curvature, datamosh.
- **Kinetic brutalist type** (jiejoe / danzan energy) — huge stacked display type, bilingual accents, scroll-driven reveals, one screaming accent color, an interactive gimmick.

Reference sites the owner picked: `danzan.jiejoe.com` (kinetic scroll + swipe-to-slash), `orwell.byholm.co`, `operate.so`, `myshaky.com/gotcha` — all characterful, interactive, hand-made-feeling. Match that *"a human weirdo built this, not a template"* quality.

**North star:** if it looks like a normal clean SaaS dashboard, you've failed. It should look like a pixel-arcade fever dream that somehow still works.

---

# 2. ART-DIRECTION PILLARS

1. **Everything is a window.** The app is a desktop. Games, the treasury, the loop, attractions — each lives in a draggable, closable OS-style window with a title bar.
2. **Dither everything visual.** Photos, the Carnie/mascot art, the dice stage backdrop → run through a 1-bit or 2-bit Bayer dither. No smooth gradients on imagery; gradients only as neon UI accents.
3. **Pixel-perfect, never blurry.** Hard edges. `image-rendering: pixelated`. Chunky 2–4px borders. No soft shadows — use hard offset "drop shadows" (`box-shadow: 4px 4px 0 #000`).
4. **One acid accent that screams.** Mostly grungy dark CRT + 1-bit art, then ONE loud color that does the shouting (see palette). Treasury/value = a second hot accent (acid gold-green).
5. **Motion is twitchy, not smooth.** Blinks, marquees, jitters, glitch-flickers, boot sequences. Snappy, low-framerate-feeling steps over silky easing.
6. **Legibility is sacred where it counts.** Balances, bets, payouts, treasury splits, burn totals → always crisp, high-contrast, mono/pixel numerals. The vibe never eats the numbers.

---

# 3. COLOR SYSTEM

Base is a **dark, grimy CRT** with **1-bit art** and **acid neon pops**.

```css
:root {
  /* CRT base */
  --void:      #0a0a0f;   /* deepest black-blue */
  --crt:       #12101a;   /* screen bg */
  --panel:     #1a1622;   /* window body */
  --chrome:    #2a2436;   /* title bars / bevels */
  --bevel-hi:  #4a4258;   /* raised bevel light */
  --bevel-lo:  #000000;   /* bevel shadow */
  --line:      #3a3350;

  /* ink (1-bit art) */
  --ink:       #e8e6f0;   /* near-white */
  --ink-dim:   #8b849c;

  /* ACID accents — the screaming colors */
  --acid:      #c2ff00;   /* primary: acid lime-yellow (value/treasury/jackpot) */
  --hot:       #ff2e88;   /* hot magenta (primary action / danger-fun) */
  --cyber:     #00e5ff;   /* cyber cyan (links / info) */
  --burn:      #ff3b30;   /* burn / lose / ERROR red */
  --win:       #39ff14;   /* win green */
  --amber:     #ffb000;   /* CRT amber (warnings, retro glow) */

  /* the 6 Colors game colors — keep saturated + pixel */
  --c-yellow:#ffe600; --c-orange:#ff7a00; --c-pink:#ff2eb0;
  --c-blue:#2e9bff;   --c-green:#39ff14;  --c-red:#ff2e2e;
}
```

**Usage:** dark CRT everywhere; art dithered in `--ink` on dark; `--acid` for treasury/value/jackpot and the "value comes home" story; `--hot` for primary buttons and mascot energy; `--cyber` for links/webring; `--burn`/`--win` for outcomes. Never more than ~2 acid colors screaming in one viewport — rotate which one leads per section.

Optional toggle: a **"1-BIT MODE"** button that strips the whole site to stark black & white dither (a nod to the board). Fun easter-egg, low effort, very on-brand.

---

# 4. TYPOGRAPHY (pixel + bitmap)

Load bitmap/pixel fonts. Recommended (all free, on Google Fonts or GitHub):

- **Display / headlines:** `Silkscreen`, `Pixelify Sans`, or **`Micro 5`** for the huge kinetic type. Chunky, blocky, loud.
- **UI / body / labels:** `VT323` or **`Departure Mono`** (crisp terminal feel).
- **Numbers (balances, treasury, payouts):** `Departure Mono` or `JetBrains Mono` — pixel-adjacent but unambiguous. Numerals must never be mistakable.
- **Accent / "system" text:** `Perfect DOS VGA 437` / `Pixel Operator` for dialog-box copy.

Rules: generous `letter-spacing` on display type; `text-transform: uppercase` for signage; disable font-smoothing on pixel fonts (`-webkit-font-smoothing: none; font-smooth: never;`) so they stay crunchy. Big type can be BILINGUAL/stacked (jiejoe style) — e.g. a giant "遊" or "祭" ghosted behind "MIDWAY".

---

# 5. LAYOUT = "THE BOOTLEG OS"

The whole product is a **fake operating system desktop.**

- **Desktop:** tiled or dithered wallpaper (a dithered carnival/boardwalk scene, or a repeating pixel pattern). Draggable **desktop icons** for each attraction (Colors, Glitch Pits, NFT Launchpad, Token Tools) — double-click opens its window.
- **Windows:** every module is a `react-rnd` draggable/resizable window with a **title bar** (title + fake minimize/maximize/close buttons), a beveled border (`border` + hard `box-shadow`), and a chunky body. Windows can overlap and stack (z-index on focus).
- **Taskbar (bottom or top):** a Win95-style bar. Left = a **"MIDWAY" start button**. Center = open-window tabs. Right = the **live treasury ticker** (marquee) + a blinking clock + wallet-connect chip.
- **Boot sequence:** first load = a 1.5s fake BIOS/boot screen (`MIDWAY OS v1.0 … LOADING ATTRACTIONS … TREASURY ONLINE ✓`) with a pixel progress bar, then the desktop "powers on" with a CRT flicker. Skippable, once per session.
- **Webring footer:** an actual old-web "◄ NEIGHBORS + COOL SITES ►" strip with 88×31 pixel badges (Colors, the token, socials), a fake hit counter, and "best viewed in MIDWAY OS."
- **Marquee ticker:** a scrolling `<marquee>`-style strip (CSS animation) reading live: `◎ TREASURY 12.40 … 🔥 BURNED 1,203 … ⭐ BELIEVERS PAID 4.1 … JACKPOT HIT BY 7xK…q2 …`.

---

# 6. TEXTURES & EFFECTS (the grime)

Apply globally but performantly:

- **CRT scanlines:** fixed overlay, `repeating-linear-gradient(transparent 0 2px, rgba(0,0,0,.25) 3px)` at low opacity.
- **Screen curvature + vignette:** subtle SVG/WebGL barrel-distort on the outer frame, or fake it with a radial vignette + rounded viewport. Keep it gentle.
- **Chromatic aberration:** on headlines and on hover, offset red/cyan text-shadows (`text-shadow: -1px 0 var(--burn), 1px 0 var(--cyber)`). Intensify briefly on glitch events.
- **Dither filter:** run mascot art, banners, and the dice-stage backdrop through a Bayer 4×4/8×8 dither (SVG filter or a small canvas/WebGL pass). Provide a `<Dither>` wrapper component.
- **Noise/grain:** faint animated film-grain overlay (`feTurbulence` or a tiny looping noise PNG) at ~3–5% opacity.
- **VHS/glitch bursts:** occasional (every ~20–40s, or on big wins) a 150ms datamosh/RGB-split/scanline-jump on a target element. Never constant — it's seasoning.
- **Hard shadows only:** `box-shadow: Npx Npx 0 #000` for that sticker/pixel-cutout look. No blurred shadows anywhere.

All effects respect `prefers-reduced-motion` and a **"CALM MODE"** toggle that kills glitch/marquee/flicker for accessibility.

---

# 7. MOTION & INTERACTION

- **Cursor:** custom pixel cursor (a little pointer or a carnival ticket). Optional faint **cursor trail** of pixel sparkles on the desktop (off in Calm Mode).
- **Kinetic scroll type** (jiejoe energy): the hub's hero and section breaks use HUGE stacked type that reacts to scroll — parallax, letters that snap/jitter in, a giant ghost character sliding behind. framer-motion `useScroll`.
- **Hover chaos:** buttons jitter/shake 2–3px, invert colors, or glitch-flicker on hover. Links underline with a marquee dash.
- **Blink:** signage ("JACKPOT", "LIVE", "PLAY NOW") uses stepped opacity blink (steps(2), not smooth fade).
- **Drag feel:** windows lift with a hard shadow bump + tiny rotate on grab.
- **Sound (optional, off by default, toggle in taskbar):** 8-bit blips on click, a coin `cha-ching` on win, a buzzer on loss, dial-up/boot chime on load. Pixel arcade needs sound to feel alive — but always mutable.
- **An interactive gimmick** (do at least one, danzan-style): e.g. you have to **crank a pixel lever** or **pull a slot handle** to roll; or a **"swipe to feed the treasury"** drag; or the mascot **reacts** (blinks, taunts) to your wins/losses.

---

# 8. COMPONENT-BY-COMPONENT RE-SKIN

Keep the function from `MIDWAY_BUILD_PROMPT.md`; restyle each piece:

**Taskbar / HUD** → Win95 bar. START ▸ MIDWAY button, open windows as tabs, right side = treasury marquee + blinking pixel clock + `[ CONNECT WALLET ]` beveled chip.

**Hero / boot** → BIOS boot → desktop reveal. Giant kinetic "MIDWAY" with a ghost kanji (祭 / 遊) behind it, tagline "EVERY CUT COMES HOME" in blinking pixel type, a dithered boardwalk/carnival wallpaper.

**The Loop (40/40/20 engine)** → render as a **flowchart in a program window** titled `LOOP.EXE`, boxes wired with pixel arrows, coins visibly traveling the wires (looping sprite animation). Split cards = three beveled sub-windows: `🔥 BURN.SYS`, `⭐ BELIEVERS.DAT`, `🔧 BUILD.BIN`.

**COLORS game** → a draggable window titled `COLORS.EXE`. The 6 color buttons = chunky pixel arcade buttons that depress. The dice stage = a dithered arcade cabinet screen; **dice are 3D pixel cubes** (low-poly, faceted, `image-rendering: pixelated`) that tumble and land. Winning dice get a blinking acid outline. `PLACE BET` / `ROLL` = big beveled arcade buttons with sound.

**Result** → **don't** use a clean banner. Pop a **fake OS dialog**: win = `★ JACKPOT.EXE` acid-gold dialog with a coin-rain sprite; loss = `✕ ERROR: NO MATCH` red dialog with `[RETRY]` `[CANCEL]` buttons (RETRY re-arms a round). Very `VIRUS DETECTED` collage energy — but readable.

**Treasury (live)** → a window titled `SYSTEM MONITOR` / `TREASURY.MON`. The three splits = pixel bar-graphs / VU-meters that tick up. Burn count = a glitchy decrementing "SUPPLY" readout. "CLAIM SHARE" = a beveled button that triggers a coin-drop animation + dialog.

**Attractions** → desktop **icons** on the wallpaper (double-click to open) AND a webring strip. Each icon = pixel art, with a `LIVE` blink badge or `SOON` sticker.

**Honest / fairness** → a `README.TXT` / Notepad window with monospace copy and a `[VERIFY FAIRNESS]` button that opens a `FAIRNESS.LOG` window showing seeds + dice derivation.

---

# 9. DO / DON'T

**DO**
- keep balances, bets, payouts, treasury numbers crisp and high-contrast at all times
- make the chaos *interactive* (draggable, clickable, reactive), not just decorative
- ship CALM MODE + `prefers-reduced-motion` fallbacks
- keep it fast — dithers/CRT as cheap CSS/small shaders, not heavy per-frame canvas everywhere
- make it mobile-usable: windows can go full-screen/stacked on small screens; taskbar collapses

**DON'T**
- don't let the glitch/marquee/flicker obscure the money-flow — that's the product's whole trust story
- don't use smooth blurred shadows, soft gradients on imagery, or a clean SaaS grid
- don't run glitch effects constantly (nausea + perf) — pulse them
- don't lose the Colors mechanics or the 40/40/20 treasury logic while re-skinning
- don't autoplay sound

---

# 10. IMPLEMENTATION NOTES (Next.js)

- **Draggable windows:** `react-rnd` (drag + resize + z-index focus). Wrap in a `<Win title="COLORS.EXE">` component with bevel + title bar.
- **Pixel rendering:** `image-rendering: pixelated;` on all art/sprites; chunky borders via `border` + `box-shadow: Npx Npx 0 #000`.
- **Dither:** a `<Dither src>` component — either an SVG filter (`feImage`+`feTile` Bayer matrix / `feComponentTransfer` posterize) or a tiny canvas/WebGL ordered-dither pass. Precompute for static art.
- **CRT/scanlines/vignette:** a single fixed overlay div + optional postprocessing shader (`@react-three/postprocessing` or a fullscreen fragment shader) for curvature + aberration if you want it richer.
- **Kinetic type:** framer-motion `useScroll` + `useTransform`; `steps()` easing for twitchy motion.
- **Marquee:** CSS keyframe translateX loop (not the deprecated `<marquee>`), duplicated content for seamless scroll.
- **Fonts:** `next/font/google` for Silkscreen / VT323 / Pixelify Sans / Micro 5; self-host Departure Mono / Perfect DOS VGA.
- **3D pixel dice:** `@react-three/fiber` low-poly cubes with `image-rendering: pixelated` on the canvas, or CSS 3D cubes with pixel-color faces. Snap-tumble on roll.
- **Boot/glitch/sound:** small state machine for the boot sequence; Howler.js (or native Audio) for optional 8-bit SFX, muted by default with a taskbar toggle.
- **Toggles:** global context for `CALM_MODE` and `ONE_BIT_MODE`; gate all heavy effects behind them.

---

# 11. ACCEPTANCE — "the look is right when"

- [ ] It reads as a **glitchy retro-OS arcade**, not a clean dashboard — draggable windows, taskbar, boot screen, webring
- [ ] Mascot/art + dice backdrop are **dithered pixel**, hard-edged, never blurry
- [ ] There's a **CRT layer** (scanlines + vignette, optional curvature) and tasteful, *pulsed* glitch bursts
- [ ] Wins/losses pop as **fake OS dialogs** (JACKPOT.EXE / ERROR: NO MATCH)
- [ ] Treasury lives in a **SYSTEM MONITOR** window with pixel VU-meters + a marquee ticker in the taskbar
- [ ] Type is **pixel/bitmap** and huge/kinetic on the hero; **numbers stay crisp and legible everywhere**
- [ ] There's at least **one tactile interactive gimmick** (lever/slot/swipe) and optional 8-bit sound
- [ ] **CALM MODE** + reduced-motion fully disable the chaos; it's usable on mobile
- [ ] Nothing about the re-skin broke the Colors mechanics or the 40/40/20 treasury loop

---

**Keep the soul from the build prompt: every cut comes home, honest and on-chain. Just make it look like it's running on a cursed arcade machine from 1998 that gained sentience.**

— end of MIDWAY_DESIGN_PROMPT.md
