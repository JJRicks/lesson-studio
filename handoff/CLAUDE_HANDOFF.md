# Lesson Studio handoff

Read all of this before starting. A fresh agent tested an earlier version from a clean clone, and most of what's here comes from where it got stuck.

## 1. What this makes

One self-contained HTML page per lesson, opened locally by Joel, a BYU-Idaho engineering student, to learn the material. His words for what he loves: "beautiful, animated, interactive", "that clean style", and the "electron particle generator". The page is for understanding, so a correct, clear page beats a flashy one.

## 2. The brief, in Joel's words

The original request, which still governs every lesson:

> create a beautiful, animated, interactive website lesson that clearly and simply breaks down each topic (gives a high level overview, then dives into details) using easy to understand scannable language, analogies, examples, explanations of base concepts from first principles, assumes no knowledge, and makes sure every concept is covered. Should be organized in the order of problems on the homework, and after the explanation for each topic have a section that works through each respective problem for that topic step by step and hides the final answer behind a clickable reveal.

On guided notes:

> we only need one or two problems of each type, because this is a set of teaching documents / guided notes not actually a homework assignment. the goal is to learn the individual topics

On worked examples:

> For each of the worked examples, would you be able to create a steppable labeled and simple 3D animation to really help visualize what is happening and how each part comes into play?

On lessons for fun:

> Fully animated and interactive ... I love what you did with the electron particle generator, that sort of thing is lovely

## 3. First, decide what kind of lesson this is

If the prompt states a kind, that wins. Otherwise read the document's content, because filenames lie: `Diode Circuits HW 2 condensed.docx` actually held the BJT Calculation homework. If a name and its content disagree, build from the content and tell Joel.

| kind | how to recognize it | what to do |
|---|---|---|
| Homework | Point values, numbered problems to hand in | Work **every** problem, in order. Group problems under topics, with the explanation before its problems. |
| Guided notes | "Lesson NN", blank space for in-class examples, practice with answers | Teach every topic. Work **one or two examples of each problem type**. Prefer in-lesson examples. Use a practice problem only if it's the sole example of its type. |
| Just for fun | Joel names a topic | A shorter page led by a live, physically grounded animation. Include worked problems only if asked. |

If the source teaches a method without an example, add one from a standard textbook and mark it `<span class="bonus">extra, not in notes</span>`.

## 4. Workflow

**1. Read everything.** Put source files in `sources/`. Extract text with `pdftotext -layout file.pdf -` or `textutil -convert txt -stdout file.docx`. Look at every figure: render PDF pages with `pdftoppm -r 50 -png`, and unzip a docx to read `word/media/`. Circuit values and problem data often exist only in images. Match each image to its problem using the order in `word/document.xml`.

**2. Scaffold.** `python3 tools/new_lesson.py <slug> "<Title>"`. Use `wk9-triple-integrals` style slugs for coursework and a descriptive slug for anything else. The starter passes QA as it stands, so keep it passing as you go. Its demo content and `scenes/example.js` are placeholders to replace. In `lesson.json`, set `libs`, and set `output` to the absolute path for the finished page. Unless told otherwise, that's next to the source.

**3. Solve and verify, before designing anything.** Put every answer through `lessons/<slug>/verify.py`, using SymPy or numerics. Check them against any hint ranges and printed solutions. For simulator homework, reproduce the model yourself, as `gallery/bjt-characterization-lesson.html` did by solving LTspice's transistor models. For a physical device, fit a small model to datasheet numbers, report how close it lands, and drive the animations from it so the visuals are physically real. If an answer sits near a threshold, carry full digits and say which convention you used, both in the reveal and to Joel.

**4. Plan.** List topics in document order. For each one, write the big idea, the first-principles build-up, an everyday analogy, the interactive, and the worked examples. Ask what the reader should be able to do on the page, not only read.

**5. Write `body.html`.** See section 5.

**6. Build the interactives** in `page.js`. See section 7. Open the hero with the single most striking live thing.

**7. Build a stepper for every worked example.** Use 3D when the maths or physics has real geometry. For circuits, use the 2D schematic stepper: Joel said "probably no need for 3D when it comes to circuits, but animated interactive diagrams for sure." See section 8.

**8. QA.** See section 9.

**9. Deliver.** See section 10.

## 5. Page anatomy and writing

Copy the markup from `lessons/_starter/body.html`, which has working examples of the common components. `lessons/wk8-multivariable/body.html` shows the rest: `.seg`, `.btn`, `canvas.p3`, `.cursorbox`, `.legend`, `.sw`, `.badge` and `.setup`.

Every topic runs: **big idea → first principles → analogy → formal statement → interactive → worked examples**. Worked examples sit right after the topic they belong to.

| class | use |
|---|---|
| `.hero.load` | title, one-paragraph lede, `.chips`, and the signature interactive |
| `.part` + `.part-head` | one per lesson or homework section |
| `.big` | the idea in two sentences |
| `.topic` | one concept; give it `id` and `data-title` so the sidebar tracks it |
| `.analogy` | an everyday picture |
| `.thm` | a boxed definition or theorem from the source |
| `.mbox` | a displayed equation |
| `.key` | the one sentence to remember |
| `.warn` | a mistake people really make |
| `details.deeper` | optional depth |
| `details.quick` | a one-line self-check |
| `article.prob` | a worked example: `.ask`, then `ol.steps` where every `li` starts with an `h5`, then `details.reveal` |
| `.mcq` | multiple choice; `data-answer` names the right button's `data-k`, and `engine/js/shell.js` handles the clicks |

Inside an interactive:

| class | use |
|---|---|
| `.panel` | the instrument frame around any interactive |
| `.panel-head` with `.t` and `.status` | its title bar, and a live status line |
| `canvas.p2` (set a height) / `canvas.p3` | a 2D canvas / a 3D `Plot3D` canvas |
| `.ctlgrid` with `.sl` | a grid of sliders: `<div class="sl"><label for="id"><span>Name</span> <b id="out"></b></label><input type="range" id="id"></div>` |
| `.seg` | a segmented toggle; wire it with `seg("#id", key => ...)`, buttons carry `data-k` and `aria-pressed` |
| `.btn`, `.btn.ghost` | buttons |
| `.reads` with `.read`, `.k`, `.v` | readout tiles |
| `.cursorbox` | readout tiles built from plain `div`s with `.k` and `.v`, for `innerHTML` updates |
| `.note`, `.legend`, `.sw`, `.badge`, `.setup` | caption text, colour key, colour swatch, status pill, a text strip inside a panel |

Writing rules:
- Assume no prior knowledge, and define every term the first time.
- Use short, plain sentences, the way a knowledgeable person would explain it out loud.
- Say what the reader sees and does, and name things as they'd recognize them.
- Avoid em-dash asides, "not X, but Y" framing, colon-then-reveal sentences, emoji as markers, and words like "simply" or "obviously".
- Written steps stop one line before the final answer: "Compute it." The answer appears only in `details.reveal`, the stepper's answer step, and the hidden answer key.
- End with a cheat sheet, common mistakes, and a fully hidden answer key.
- Say where the numbers came from in the footer.

Maths is KaTeX, written as `\(inline\)` and `\[display\]` in `body.html`. Use `\le`, never a raw `<`, and write `&amp;` for alignment ampersands.

## 6. Design system

`engine/css/base.css` is the system, and Joel likes it. Reuse it rather than inventing a new look. Page-only styles go in `lesson.css`.

- **Colours:** every colour is a token with light and dark values (`--bg --surface --surface-2 --ink --muted --line --accent --glow --cursor --good --bad --plot --grid --s1 --s2 --s3 --t1 --t2 --t3 --t4`). Never write a literal colour that only works in one theme. A new token needs a value on `:root` and in both dark blocks.
- **Layout:** sticky sidebar plus a 780px reading column, collapsing to a drawer at 1000px. It must work at phone width with no sideways page scroll.
- **Motion:** animations start from a complete, readable first frame, respect `prefers-reduced-motion`, and only run while on screen. Animate transforms, never `opacity:0` on page load.

## 7. Interactives

`page.js` shares a closure with `engine/js/shell.js`, which provides:

| name | what |
|---|---|
| `$`, `$$` | query one, query all as an array |
| `css("--x")`, `tokens(TOK)` | read a token / read the palette in section 6 as RGB arrays: `T = tokens(TOK); rgbS(T.accent, .5)`. Hyphens become underscores: `T.surface_2`. For a soft token, use `css()` or add it to `TOK` |
| `rgbS`, `lerpC`, `ramp(T, t)` | RGB array to CSS colour, mix two, the height colour ramp |
| `clamp`, `fx(v, digits)`, `minus` | clamp, format with a real minus sign, swap hyphens for minus signs |
| `tex(el, "x^2", display)` | render TeX into an element |
| `seg("#id", fn)` | wire a `.seg` toggle |
| `canvas2d(cv)` | size a canvas for the screen, returns `{ c, W, H }` |
| `whenVisible(el, dt => ...)` | a frame loop that runs only on screen, and never under reduced motion |
| `themeListeners.push(fn)` | re-read tokens and redraw on theme change |
| `reduce`, `store` | reduced-motion flag, safe `localStorage` |

`lessons/_starter/page.js` shows them working together.

**Important limits:**
- `page.js` runs before three.js loads, in a separate closure, so a hero can't use the 3D stepper kit. Use `Plot3D` or a hand-written canvas.
- `Plot3D` is for boxes and height surfaces. It squeezes z to fit, which distorts angles, unless you pass `iso: true` in `bounds`. It has no arrowheads, keeps its axes at a corner, and spins by default. For vectors, copy the small projected renderer in `lessons/dot-product-angle/page.js`.
- Never preset an interactive to a worked example's numbers. It shows the answer.

Where to find things:
- **`Plot3D`** (`engine/js/plot3d.js`, add `"plot3d"` to `libs`): a dependency-free canvas 3D renderer for box and surface scenes, with drag to rotate. `new Plot3D(canvas, { build, tick, yaw, pitch, spin })`, then `.rebuild()`. `build(T)` returns `{ bounds: { a, b, c, d, zlo, zhi, iso }, groups: [{ at, faces: [{ p, col, n, a, two, st, sa, lw }] }], lines: [{ p, col, a, w }], labels: { b, d, o, z } }`. Helpers `boxFaces`, `surfaceGroups` and `surfaceWire` make those parts, and `riemannScene` in `lessons/wk8-multivariable/page.js` shows them in use.
- **`lessons/wk8-multivariable/page.js`**: Riemann box explorers, a gradient explorer with contours by marching squares and a draggable point, an optimization builder with a heat map, a Fubini slicer with a live plot, and a sweep-line region explorer.
- **`lessons/dot-product-angle/`**: a live hand-written 3D vector hero, and a topic-sized lesson to copy the shape of.
- **`gallery/6v6-tetrode-lesson.html`**: **`class TubeSim`**, the particle engine Joel loved, where particles spawn at a rate set by a physical model. Also a live scope, Web Audio playing the model's waveform, a plate-curve load line, and an animated schematic.
- **`gallery/bjt-characterization-lesson.html`**: **`class Plot`**, LTspice-style plots with draggable cursors, the electron-flow canvas, `.dc` command decoders, and "run the sweep" animations.
- **`gallery/bjt-calculation-lesson.html`**: **`playground()`**, a live circuit with sliders, animated current flow and a load-line chart.
- **`lessons/wk7-bjt-led-relay-drivers/`**: the circuits reference. Live SVG schematics with current dots in `page.js` (a pin-flip hero, a pnp sweep, a relay cutaway with hysteresis, a flyback scope), Gummel-Poon BJT and LED solvers in `shared.js`, and six 2D steppers.
- **Schematic kit** (`engine/js/schematic.js`, add `"schematic"` to `libs`): `new Schem(svgGroup)` draws parts in viewBox units, y down: `res`, `diode`, `led(a, k, {c})` with `.set(brightness)`, `bjt(B, {pnp})` returning pins `{B, C, E}`, `vsrc` returning `{top, bot}`, `gnd`, `net(p, {w, left})` (an LTspice net flag), `coil`, `lever(pivot, len)` with `.set(deg)`, `lamp` with `.set`, `rect`, `text`, `wire`, `node`, `arrow`. `flow(pts, {c, gap})` makes moving current dots: set `.speed`, then call `Schem.tick(flows, dt)` each frame. Classes `w`, `tint` (colour from `--c`), `fillc`, `soft`, `sm`.
- **`shared.js`** in a lesson folder is copied into both the `page.js` closure and the stepper closure. Put circuit drawings and solvers there so the hero and the worked examples draw the same circuit.

Gallery pages are plain HTML, so read their source and copy what you need into `page.js`. Repeated code worth keeping belongs in `engine/`.

## 8. Steppers

Add `"stepper3d"` to `libs`, or `"stepper2d"` and `"schematic"` for circuits (section 8b).
Both use the same viewer, step contract and QA. Files in `lessons/<slug>/scenes/` are concatenated in sort order, and each registers scenes under the worked example's article id. The engine moves the card's steps into a viewer with Back, Replay, Next and numbered dots, sticks it to the top of tall screens, lights up the written step, and lets a click on a written step jump the scene.

**The contract.** `steps` has exactly one entry per `<li>` in `ol.steps`, plus one final answer step. That answer step stays locked until the card's reveal is opened. Every `article.prob` needs a scene, unless its id is listed in `no_scene` in `lesson.json`. `check.py` fails on a scene with no article, an article with no scene, or a scene registered twice.

```js
S["ex1"] = {                       // the <article class="prob"> id
  cam: { y: -1.05, p: .42, d: 6.4, at: [.5, .5, .6] },  // yaw, pitch, distance, look-at in maths coordinates
  P: { s: 1 },                     // numbers that animate between steps
  build(k, P) { ... },             // create named objects and labels, once. Note the argument order: k first
  update(P, k) { ... },            // move things to match P, every frame. Note the argument order: P first
  steps: [
    { cap: tx`What to look at. Keep it under about 200 characters.`,
      add: "names to fade in", drop: "names to fade out",
      set: { s: .3 },              // where P ends up after this step
      from: { s: 0 },              // start here on Next or Replay; use it for sweeps
      win: { s: [.4, 1] },         // run this number during part of the step
      cam: { y: -1.2, p: .4 },     // only the fields that change
      dur: 3.5 }                   // seconds, default 1.1
  ]
};
```

Visibility, numbers and camera accumulate from step to step, so Back and jumping both work. Step 1's `from` plays once, the first time half of the viewer is on screen. `tx` is `String.raw`, so captions use single backslashes. Captions set the height of the sticky viewer, which is why they stay short.

Available in scene files: `sin cos tan acos atan2 sqrt hypot exp min max abs floor round PI TAU rng(a, b, n) lerp clamp01 ease tx`, plus `rectSolid`. Reach objects with `k.o.<name>`, and stash your own helpers on `k` in `build`.

**Scale.** All coordinates are maths coordinates, z up. `k.scale(sx, sy, sz, center)` comes first and is a plain multiply, not a fit, so pick values that put the scene within about ±1.5. **Use equal scales whenever an angle, a perpendicular or a circle matters.** Unequal z-scales are fine for heights, but they draw false angles.

| call | makes |
|---|---|
| `k.surf(name, (u,v)=>[x,y,z], [u0,u1,nu], [v0,v1,nv], opts)` | any parametric surface; `.map(fn)` re-shapes it. Only surfaces accept `ramp: [zlo, zhi]`, which colours by height |
| `k.poly(name, pts, opts)` / `k.flat(name, pts2D, z, opts)` | convex polygon; `.set(pts)` moves it |
| `k.curt(name, n, opts)` | wall on a polyline; `.set([[x,y,zTop,zBottom],...])` with exactly n points |
| `k.tube(name, pts, opts)` / `k.tubes(name, [pts...], opts)` | thick curves; opts `r` is the radius |
| `k.seg(name, opts)` | line; `.set(a, b)` |
| `k.arrow(name, opts)` | arrow; `.set(a, b)`, tip stored in `.b` |
| `k.wedge(name, opts)` | filled angle marker; `.set(apex, dirA, dirB, radius, fraction)`, where `fraction` opens it part-way for a sweep |
| `k.dot(name, {r, p})` | point; `.at(p)`, position stored in `.p` |
| `k.ball(name, opts)` / `k.block(name, opts)` | sphere `.at(p, worldRadius)` / box `.set(a, b)` |
| `k.grid(name, [x0,x1,dx], [y0,y1,dy], z)` / `k.axes(name, X, Y, Z, {at})` | floor grid / labeled axes; pass `null` to skip an axis |
| `k.label(name, pos or ()=>pos, tex, opts)` | math label pinned to a point |
| `k.alias(name, "a b c")` | a group name for `add` and `drop` |
| `k.cut("x")` | clip plane keeping everything below a value; pass `.pl` in `clip: [...]`, move with `.set(v)` |
| `rectSolid(k, f, X, Y, ramp)` | a solid over a rectangle that sweeps along x: objects `R Re top w1 w2 w3 w4 ghost slice`, alias `solid`, methods `.cut .set(g) .slice(s)` |

Shared options: `c` (any token name without `--`), `o` (opacity), `clip`, `lit: false`, `emi` (self-glow; keep it low, because dark-theme colours overexpose), `sh` (shininess), `po` (draw behind coplanar lines).

Label options: `c`, `dx`, `dy` (offset in pixels, which draws a leader line unless `line: false`), `when: () => bool`, `sm`, `plain`. Labels can't change after they're built, so make two and swap them with `add` and `drop`. For label text, use `cursor` rather than `s3`, which is too pale on the light theme.

**What makes a good scene.** Joel asked for "simple". Each step shows one new idea, and the picture does what the written step does:
- Show what the algebra means. "Eliminate λ" drew the whole line of points where the gradients can line up, and "use the constraint" lit up where that line crosses the constraint.
- Sweep slices to show integrals, and leave a translucent `ghost` so the reader sees what's left to fill.
- Move the camera to the view that proves the point. A sphere touching a plane reads best edge-on, a contour map from straight above, and an angle between two vectors face-on to their plane.
- Keep labels few, and drop old ones as new ones arrive.
- Translucent surfaces go at opacity .2 to .4 for context, and .7 to .95 for the subject.

### 8b. 2D circuit steppers

A scene with `view: "2d"` draws an SVG inside `box: [x0, y0, w, h]` (viewBox units, y down). The step fields (`add drop set from win dur cap`) work the same, and there's no camera. `update(P, k, t)` also gets the time, for flicker and AC.

| call | makes |
|---|---|
| `k.sch` | the always-visible `Schem` layer: draw the circuit here in `build` |
| `k.group(name, s => {...}, {under, side})` | a named layer that steps add and drop; `s` is a `Schem` |
| `k.flow(name, pts, {c, gap})` | current dots; set `k.o.name.speed` in `update` |
| `k.loop(name, pts, {c})` | a soft highlight under a KVL loop |
| `k.text(name, p, str)` | text with `.set(str)` |
| `k.rect(name, x, y, w, h, {c})` | a bar with `.set(x, y, w, h)` |
| `k.plot(name, {c})` | a trace with `.set(pts)`, for a scope |
| `k.label(name, p, tex, {c, dx, dy, line, when})` | an HTML KaTeX tag, offset in pixels. `line: false` places it right on `p` |

`update` runs after the step fades, so it can override a group's opacity, for example to crossfade two drawings with `P.m`.

**What worked for circuits:**
- Dots show conventional current. Make their speed follow the current, like `speedOf(I)` in the wk7 `shared.js`, and use one colour per loop: base `t1`, collector `t3`, AC `cursor`.
- Light the loop being solved with `k.loop`, and put the numbers in **side cards** at the right of the box. These are a voltage-budget bar, an E24 ruler with an arrow at the calculated value, and an LTspice `.op` printout whose values say `?` until the answer step. Copy `SC` from `lessons/wk7-bjt-led-relay-drivers/scenes/00-kit.js`.
- Declare the column the cards use as `side: [x, y, w, h]`, and draw the cards with `{ side: true }` (the `SC` helpers already do). Under 600px the engine then draws the circuit full width and moves the cards below it, scaled up. Otherwise a 740-wide scene shrinks its text to about 6px on a phone. Leave `side` out if the circuit itself reaches into that column.
- Write labels with inline division, `1.8\text{ V}/20\text{ mA}`. A `\frac` in a label renders too small to read.
- Demos in `page.js` use example part values. When the homework fixes a part (an 800 Ω relay), the demo uses a different one (400 Ω) and says so, or it shows the answer.

## 9. QA

```sh
python3 lessons/<slug>/verify.py                       # answers
python3 tools/check.py <slug>                          # must exit 0
python3 tools/sheets.py <slug>                         # every step, dark
python3 tools/sheets.py <slug> --light                 # every step, light
python3 tools/shot.py <slug> "#top"                    # the real page, one whole section at a time
python3 tools/shot.py <slug> "#topic1" --width 500     # phone width, which reveals layout problems check.py can't see
python3 tools/shot.py <slug> "#ex1" --step 3 --mid     # dot 3 with its numbers halfway through a sweep
```

These all build to `dist/` and never touch a delivered page.

**`check.py`** covers script errors, KaTeX failures, leftover raw TeX, sideways overflow, a reveal on every example, scenes matched to examples, step counts, unknown object names, answers showing too early, and the real stepping and lock flow in real-time Chrome.

**`spoilers.json`** drives the early-answer scan. Each example id lists regexes checked against its scene's pre-answer captions and labels and its card outside the reveal. `_page` is required: it lists regexes checked across the whole page outside reveals, so put each answer's distinctive form there, like `"53\\.4"`. Captions are scanned as raw TeX, and other text as rendered text plus TeX source. Keep patterns specific, or they'll match real step content.

**A passing `check.py` doesn't mean the page is right.** Open every contact sheet and read it like a student, step by step. Sheets show each step's end state at real size. Fix these on sight: labels colliding, objects cropped by the frame, a plane seen edge-on when its face matters, a scene too small in its frame, a caption describing something the picture doesn't show, a colour named in a caption that doesn't match what's drawn, and a label too pale to read. The test agent made about a dozen fixes on a one-example lesson after `check.py` had already passed, so expect that.

Then look at every section of the page itself with `shot.py`, in both themes and at 500px. Report honestly what you couldn't test: audio you couldn't hear, touch on a real phone, real GPUs (headless Chrome uses software rendering), and motion you only saw as stills.

## 10. Deliver

- `python3 tools/build.py <slug>` copies the page to `output`. It's the only tool that does. The filename follows `lagrange-double-integrals-lesson.html`. It's a local file: publish it to the web only if Joel asks.
- Commit the lesson source and push to `main`.
- Message Joel with: the link to the file; anything surprising about the source; the answers table for homework; which assumptions affect answers; what was added beyond the source; what you checked and what you didn't. Keep it short.

## 11. Pitfalls

- **Scenes need their article.** If a scene seems to do nothing, its `S[...]` key probably doesn't match the `<article>` id.
- **Radians.** `sin 6` means 6 radians. Say so on the page.
- **Don't trust a garbled problem statement.** Read it, say how you interpreted it, and tell Joel.
- **Sweep labels can pile up at the end of a sweep.** Check the end state in the sheets, and drop labels that collide there.
- **Start animated history full.** A scrolling scope should be seeded with more history than its window, or its first frame is part empty.
- **Grid and flex children need `min-width:0`,** or a long equation widens the page.
- **Scratch folders get wiped between sessions.** Everything that matters lives in this repo.
- **Check a drawing's moving parts in both states.** The wk7 relay cutaway's armature rotated the wrong way, so "released" drew the contacts touching. Only a screenshot showed it.
- **Monospace fonts lack `½`** and draw something like `%`. Write `LI²/2`.

If you edit `engine/` or `tools/`:
- Under `--virtual-time-budget` Chrome fires almost no animation frames, so animations look broken when they aren't. `tools/common.py probe()` runs in real time and reports over a local POST for this reason. Headless viewports are also about 143px shorter than `--window-size`, with a 500px minimum width.
- `overflow:hidden` on a card disables `position:sticky` inside it, hence `overflow:clip` on `article.prob`. Sticky also can't escape a grid item's row, hence `.v3wrap`.
- Browsers cap WebGL contexts at about 16, so the stepper shares one renderer and copies frames into each example's canvas.
- After any engine change, run `check.py` on every folder in `lessons/`.
- `Object.assign` copies a getter's current value, not the getter. Use `Object.defineProperty` to forward a setter, as `Kit2.flow` does for `speed`.
- An SVG `<use>` copy doesn't get the page's CSS, so its cards render black. That's why the 2D split layout moves one layer instead of mirroring it.

## 12. Repo rules

- Instructors' PDFs and docx files never get committed. They belong in `sources/`, which is git-ignored.
- The finished lessons restate problems and contain worked answers, so this repo stays private.
- Don't rewrite other lessons. They're the reference library.
- If you learn something that would have saved you time, add it to this guide in the same commit.
